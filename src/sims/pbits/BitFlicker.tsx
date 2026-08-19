import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, drawSpin, u01 } from './lib'

// PLAN F2/F3 — the coin with a knob. One p-bit flickers at a fixed sample rate;
// its histogram leans as the bias knob moves. With `trace` on, every bias the
// reader visits deposits its measured mean as a dot against h — the S-curve is
// drawn BY the reader's sweeping, before the sigmoid is ever named.

const SAMPLE_DT = 1 / 40 // fixed sampling clock, decoupled from frame rate
const H_MAX = 3
const BINS = 25

export interface BitShared {
  h: number
}

interface TraceBin {
  sum: number
  n: number
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
  const bins: TraceBin[] = Array.from({ length: BINS }, () => ({ sum: 0, n: 0 }))

  const sample = (h: number) => {
    tick++
    const p = 1 / (1 + Math.exp(-2 * h))
    s = u01(seed, tick, 0, 0) < p ? 1 : -1
    if (s > 0) nPlus++
    else nMinus++
    const bin = Math.min(BINS - 1, Math.max(0, Math.round(((h + H_MAX) / (2 * H_MAX)) * (BINS - 1))))
    bins[bin].sum += s
    bins[bin].n++
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
      for (let b = 0; b < BINS; b++) {
        const { sum, n } = bins[b]
        if (n < 8) continue
        const hh = -H_MAX + (b / (BINS - 1)) * 2 * H_MAX
        ctx.beginPath()
        ctx.arc(px(hh), py(sum / n), 3.4, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.sUp
        ctx.fill()
      }
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
      // narrow: the full caption truncated mid-word at 360px (figure audit
      // close-out item, 2026-08-17) — same fact, compressed wording
      ctx.fillText(
        w < 520 ? 'mean vs bias — every bias leaves a dot' : 'mean vs bias — every bias you visit leaves its dot',
        tr.x + 6,
        tr.y + tr.h + 14,
      )
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
