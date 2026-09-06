import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, drawArrow, fmt, paneFrame } from '../lib/chrome'

// PLAN figs 5–6 — the prankster, gravitational edition.
//
// One knob: the loop area A on a constant-curvature patch (the same
// protagonist as the hero's lower pane). Two independent witnesses read the
// same quantity K·A: a transported arrow that returns rotated, and a
// geodesic triangle whose angles sum past 180°. Both meters are drawn from
// the geometry, so their agreement is visible, not asserted.

export const LOOP_K = 0.05
export const LOOP_A_MAX = 20

/** Holonomy of a loop on a constant-curvature patch: rotation = K·A. */
export function loopRotation(K: number, A: number): number {
  return K * A
}

export function createLoopMeter(aRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const A = aRef.current
      const rot = loopRotation(LOOP_K, A)
      const gap = 14
      const paneW = (w - 4 - gap) / 2
      const left = { x: 2, y: 20, w: paneW, h: h - 44 }
      const right = { x: 2 + paneW + gap, y: 20, w: paneW, h: h - 44 }

      // --- left: the loop and the returning arrow ---------------------------
      paneFrame(ctx, left)
      const cx = left.x + left.w / 2
      const cy = left.y + left.h / 2
      const rMax = Math.min(left.w, left.h) / 2 - 24
      const r = Math.sqrt(Math.max(A, 0.001) / LOOP_A_MAX) * rMax
      ctx.strokeStyle = PALETTE.geoCurved
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(r, 1.5), 0, Math.PI * 2)
      ctx.stroke()
      // start orientation (ghost) vs returned orientation (violet)
      const L = 34
      const sx = cx + r
      const sy = cy
      drawArrow(ctx, sx, sy, sx, sy - L, 'rgba(107,114,128,0.8)', 2)
      drawArrow(
        ctx,
        sx,
        sy,
        sx + L * Math.sin(rot),
        sy - L * Math.cos(rot),
        PALETTE.geoCurv,
        2.5,
      )
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.geoCurv
      ctx.fillText(
        `arrow returns rotated ${fmt((rot * 180) / Math.PI, 1)}°`,
        left.x + 4,
        h - 10,
      )

      // --- right: the triangle whose angles overshoot ------------------------
      // The corner wedges are LIVE: each carries its interior angle plus a
      // third of the excess, so the violet visibly spills past the amber
      // edges as the knob turns. At zero area the wedges sit exactly in the
      // corners — the flat boundary check, drawn rather than printed.
      paneFrame(ctx, right)
      const tx = [right.x + 22, right.x + right.w - 22, right.x + right.w / 2]
      const ty = [right.y + right.h - 24, right.y + right.h - 24, right.y + 30]
      ctx.strokeStyle = PALETTE.geoCurved
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tx[0], ty[0])
      ctx.lineTo(tx[1], ty[1])
      ctx.lineTo(tx[2], ty[2])
      ctx.closePath()
      ctx.stroke()
      const share = rot / 3
      for (let i = 0; i < 3; i++) {
        const vx = tx[i]
        const vy = ty[i]
        const jx = tx[(i + 1) % 3]
        const jy = ty[(i + 1) % 3]
        const kx = tx[(i + 2) % 3]
        const ky = ty[(i + 2) % 3]
        const e1 = Math.atan2(jy - vy, jx - vx)
        const e2 = Math.atan2(ky - vy, kx - vx)
        let between = e2 - e1
        while (between > Math.PI) between -= 2 * Math.PI
        while (between < -Math.PI) between += 2 * Math.PI
        const interior = Math.abs(between)
        const dir = between >= 0 ? 1 : -1
        // Opaque: a 0.55-alpha violet never matches its own palette hex, so
        // headless ink-sampling would read antialiased edges instead of the
        // wedge — and the color would depend on the page behind the canvas.
        ctx.fillStyle = PALETTE.geoCurv
        ctx.beginPath()
        ctx.moveTo(vx, vy)
        ctx.arc(vx, vy, 20, e1, e1 + dir * (interior + share), dir < 0)
        ctx.closePath()
        ctx.fill()
      }
      const excessDeg = (rot * 180) / Math.PI
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.geoCurv
      ctx.fillText(
        `angles sum to ${fmt(180 + excessDeg, 1)}°`,
        right.x + 4,
        h - 10,
      )

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('carry the arrow around the loop', left.x + 4, 14)
      ctx.fillText('the triangle agrees', right.x + 4, 14)
    },
  }
}

export function LoopMeter() {
  const [a, setA] = useState(10)
  const aRef = useRef(a)
  aRef.current = a

  return (
    <Sim height={280} animated={false} create={() => createLoopMeter(aRef)}>
      <label className="sim-slider">
        <span>small loop</span>
        <input
          type="range"
          min={0}
          max={LOOP_A_MAX}
          step={0.1}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
        />
        <span>large loop</span>
      </label>
    </Sim>
  )
}
