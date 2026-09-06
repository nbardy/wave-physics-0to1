import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'

// PLAN figs 1 + 14 — the hero and its ring-closing return.
//
// One knob: the curvature K of the lower sheet (a patch of constant
// curvature, drawn intrinsically — no embedding, no gravity; the confession
// in §1 says this is spatial curvature standing in for spacetime curvature).
// Upper pane: K = 0 always — two parallels stay parallel. Lower pane: two
// geodesics launched parallel with the same initial separation meet by a
// factor cos(L·√K). The end-separation meters are MEASURED off the drawn
// curves, so the prose's claim lives in pixels, not in a label.

export const SHEET_LEN = 10
export const SHEET_SEP = 4
export const K_MAX = 0.012

/** End separation of two geodesics launched parallel, separation s0, on a
 *  constant-curvature patch: s1 = s0·cos(L·√K). Exact for K ≥ 0. */
export function geodesicEndSeparation(s0: number, L: number, K: number): number {
  if (K <= 0) return s0
  return s0 * Math.cos(L * Math.sqrt(K))
}

export function createStraightLines(kRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const K = kRef.current
      const gap = 10
      const paneH = (h - 24 - gap) / 2
      const top = { x: 2, y: 20, w: w - 4, h: paneH }
      const bot = { x: 2, y: 20 + paneH + gap, w: w - 4, h: paneH }
      const N = 120

      const drawPair = (
        r: { x: number; y: number; w: number; h: number },
        k: number,
        ink: string,
      ) => {
        const midY = r.y + r.h / 2
        const ampY = r.h * 0.28
        const yOf = (s: number, x: number) => {
          const frac = k <= 0 ? s : s * Math.cos((x / SHEET_LEN) * SHEET_LEN * Math.sqrt(k))
          return midY - (frac / SHEET_SEP) * ampY
        }
        paneFrame(ctx, r)
        for (const s of [-SHEET_SEP / 2, SHEET_SEP / 2]) {
          ctx.strokeStyle = ink
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i <= N; i++) {
            const x = (i / N) * SHEET_LEN
            const px = r.x + 8 + (i / N) * (r.w - 16)
            const py = yOf(s, x)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.stroke()
        }
        // end-separation ticks: the measured quantity, drawn not printed
        const s1 = geodesicEndSeparation(SHEET_SEP, SHEET_LEN, k)
        const pxEnd = r.x + r.w - 8
        const yTop = yOf(s1 / 2, SHEET_LEN)
        const yBot = yOf(-s1 / 2, SHEET_LEN)
        ctx.strokeStyle = ink
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pxEnd + 2, yTop)
        ctx.lineTo(pxEnd + 2, yBot)
        ctx.stroke()
        return s1
      }

      const sTop = drawPair(top, 0, PALETTE.geoFlat)
      const sBot = drawPair(bot, K, PALETTE.geoCurved)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('flat sheet — parallels stay parallel', top.x + 4, 14)
      // Short enough to clear the meter at 380px wide (reader pass:
      // the longer title collided with the readout on a phone).
      ctx.fillText('curved sheet — parallels meet', bot.x + 4, 20 + paneH + gap - 6)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.geoFlat
      ctx.fillText(`end separation ${fmt(sTop, 2)}`, top.x + top.w - 150, 14)
      ctx.fillStyle = PALETTE.geoCurved
      ctx.fillText(`end separation ${fmt(sBot, 2)}`, bot.x + bot.w - 150, 20 + paneH + gap - 6)
    },
  }
}

export function StraightLines() {
  const [k, setK] = useState(0.006)
  const kRef = useRef(k)
  kRef.current = k

  return (
    <Sim height={300} animated={false} create={() => createStraightLines(kRef)}>
      <label className="sim-slider">
        <span>flat</span>
        <input
          type="range"
          min={0}
          max={K_MAX}
          step={0.0002}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
        />
        <span>curved</span>
      </label>
    </Sim>
  )
}
