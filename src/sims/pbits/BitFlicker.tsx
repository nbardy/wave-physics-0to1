import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, drawSpin, u01 } from './lib'

// PLAN F2/F3 — the coin with a knob. One p-bit flickers at a fixed sample rate;
// its histogram leans as the bias knob moves. With `trace` on, every bias the
// reader visits deposits dots against h — the S-curve is drawn BY the reader's
// sweeping, before the sigmoid is ever named.
//
// Each column is an overlapping dot chart, not one dot: samples arrive in blocks
// of BLOCK, and each block's mean is a dot inked at alpha = (dots at that level)
// / (dots in the column). A block of BLOCK ±1 samples can only land on BLOCK + 1
// discrete means, so repeat dots stack exactly and darken. The darkest dot in a
// column IS the mean; the pale fringe above and below is the spread you'd get
// from re-measuring — the thing a single averaged dot hides.

const SAMPLE_DT = 1 / 40 // fixed sampling clock, decoupled from frame rate
const H_MAX = 3
const BINS = 25
const BLOCK = 8 // samples per deposited dot → BLOCK + 1 possible dot heights
const LEVELS = BLOCK + 1

export interface BitShared {
  h: number
}

interface TraceBin {
  /** dots deposited at each of the LEVELS discrete block means, low to high */
  levels: number[]
  dots: number
  /** samples of the block still filling */
  partial: number
  partialSum: number
}

export function createBitFlicker(
  shared: { current: BitShared },
  trace: boolean,
  seed = 11,
): Stepper {
  let s: number = 1
  let nPlus = 0
  let nMinus = 0
  let tick = 0
  let acc = 0
  let lastH = shared.current.h
  const bins: TraceBin[] = Array.from({ length: BINS }, () => ({
    levels: Array.from({ length: LEVELS }, () => 0),
    dots: 0,
    partial: 0,
    partialSum: 0,
  }))

  const sample = (h: number) => {
    tick++
    const p = 1 / (1 + Math.exp(-2 * h))
    s = u01(seed, tick, 0, 0) < p ? 1 : -1
    if (s > 0) nPlus++
    else nMinus++
    const bin = Math.min(BINS - 1, Math.max(0, Math.round(((h + H_MAX) / (2 * H_MAX)) * (BINS - 1))))
    const b = bins[bin]
    b.partialSum += s
    b.partial++
    if (b.partial < BLOCK) return
    // a full block closes: its mean lands on one of the LEVELS rungs
    b.levels[(b.partialSum + BLOCK) / 2]++
    b.dots++
    b.partial = 0
    b.partialSum = 0
  }

  return {
    step(dt) {
      const h = shared.current.h
      if (h !== lastH) {
        // the target moved — the histogram starts a fresh measurement
        nPlus = 0
        nMinus = 0
        lastH = h
      }
      acc += dt
      while (acc >= SAMPLE_DT) {
        acc -= SAMPLE_DT
        sample(h)
      }
    },
    draw(ctx, w, hgt) {
      ctx.clearRect(0, 0, w, hgt)
      drawLayerRail(ctx, w, 'target')
      const h = shared.current.h

      const leftW = trace ? w * 0.46 : w
      // the coin itself
      drawSpin(ctx, leftW * 0.24, hgt * 0.42, 30, s)
      ctx.font = FONT_METER
      ctx.fillStyle = s > 0 ? PALETTE.sUp : PALETTE.sDn
      ctx.textAlign = 'center'
      ctx.fillText(s > 0 ? '+1' : '−1', leftW * 0.24, hgt * 0.42 + 5)
      ctx.textAlign = 'left'

      // its histogram
      const total = nPlus + nMinus
      const barR: Rect = { x: leftW * 0.46, y: 26, w: leftW * 0.42, h: hgt - 78 }
      paneFrame(ctx, barR)
      const halfW = barR.w / 2
      const fPlus = total ? nPlus / total : 0
      const fMinus = total ? nMinus / total : 0
      ctx.fillStyle = PALETTE.sDn
      ctx.fillRect(barR.x + halfW * 0.15, barR.y + barR.h * (1 - fMinus), halfW * 0.7, barR.h * fMinus)
      ctx.fillStyle = PALETTE.sUp
      ctx.fillRect(barR.x + halfW * 1.15, barR.y + barR.h * (1 - fPlus), halfW * 0.7, barR.h * fPlus)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('−1', barR.x + halfW * 0.4, barR.y + barR.h + 14)
      ctx.fillText('+1', barR.x + halfW * 1.4, barR.y + barR.h + 14)
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      const mean = total ? (nPlus - nMinus) / total : 0
      ctx.fillText(`mean so far: ${fmt(mean, 2)}`, leftW * 0.05, hgt - 14)

      if (!trace) return

      // the sweep trace — dots the reader has deposited, mean vs h
      const tr: Rect = { x: leftW + 18, y: 26, w: w - leftW - 34, h: hgt - 78 }
      paneFrame(ctx, tr)
      const px = (hh: number) => tr.x + ((hh + H_MAX) / (2 * H_MAX)) * tr.w
      const py = (m: number) => tr.y + ((1 - m) / 2) * tr.h
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(tr.x, py(0))
      ctx.lineTo(tr.x + tr.w, py(0))
      ctx.moveTo(px(0), tr.y)
      ctx.lineTo(px(0), tr.y + tr.h)
      ctx.stroke()
      ctx.fillStyle = PALETTE.sUp
      for (let b = 0; b < BINS; b++) {
        const { levels, dots } = bins[b]
        if (dots < 1) continue
        const hh = -H_MAX + (b / (BINS - 1)) * 2 * H_MAX
        const x = px(hh)
        for (let k = 0; k < LEVELS; k++) {
          const share = levels[k] / dots
          if (share === 0) continue
          // floor keeps a lone outlying block visible as a ghost rather than
          // vanishing once the column has collected many dots
          ctx.globalAlpha = Math.min(1, 0.14 + 0.86 * share)
          ctx.beginPath()
          ctx.arc(x, py((2 * k) / BLOCK - 1), 3.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      // where the knob stands now
      ctx.strokeStyle = 'rgba(217,119,6,0.5)'
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(px(h), tr.y)
      ctx.lineTo(px(h), tr.y + tr.h)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // captions longest-first: the pane narrows with the figure, and a caption
      // wider than the pane truncates mid-word (figure audit, 2026-08-17), so
      // pick by measurement rather than a guessed breakpoint
      const captions = [
        'mean vs bias — each stop leaves a stack of dots; the darkest is its mean',
        'mean vs bias — each stop leaves a stack; darkest is its mean',
        'mean vs bias — darkest dot is the mean',
        'darkest dot is the mean',
      ]
      const fits = captions.find((c) => ctx.measureText(c).width <= tr.w - 12) ?? captions[captions.length - 1]
      ctx.fillText(fits, tr.x + 6, tr.y + tr.h + 14)
    },
  }
}

export function BitFlicker({ trace = false }: { trace?: boolean }) {
  const [h, setH] = useState(0)
  const shared = useRef<BitShared>({ h })
  shared.current.h = h

  return (
    <Sim height={230} create={() => createBitFlicker(shared, trace)}>
      <label className="sim-slider">
        <span>prefers −1</span>
        <input
          type="range"
          min={-H_MAX}
          max={H_MAX}
          step={0.05}
          value={h}
          onChange={(e) => setH(Number(e.target.value))}
        />
        <span>prefers +1</span>
      </label>
    </Sim>
  )
}
