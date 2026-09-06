import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'

// PLAN fig 10 — restricted covariance, shown not asserted.
//
// The confession, stated in prose where this figure lands: these are NOT the
// 1913/1915 field equations. They are toy operators with the same symmetry
// property — one rotation-invariant (the full Laplacian, standing in for the
// 1915 law), one grid-aligned (a single second derivative, standing in for
// the draft's restricted covariance). A fixed physical wave is measured
// through a rotating grid: the invariant operator's answer sits still while
// the grid-aligned one slides. Both bars are COMPUTED live from the knob
// angle, so the slide is arithmetic, not animation.

export const WAVE_K = 1.5

/** Grid-aligned second derivative of a fixed plane wave cos(kx), measured
 *  along the grid-x direction of a grid rotated by θ: k²·cos²θ. */
export function draftReading(theta: number): number {
  return WAVE_K * WAVE_K * Math.cos(theta) * Math.cos(theta)
}

/** Full Laplacian of the same wave: k² under every rotation. */
export function fullReading(): number {
  return WAVE_K * WAVE_K
}

export function createCovarianceMachine(thetaRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const theta = thetaRef.current
      const gap = 14
      const paneW = (w - 4 - gap) / 2
      const left = { x: 2, y: 20, w: paneW, h: h - 44 }
      const right = { x: 2 + paneW + gap, y: 20, w: paneW, h: h - 44 }

      // --- left: fixed wave, rotating grid ----------------------------------
      paneFrame(ctx, left)
      ctx.save()
      ctx.beginPath()
      ctx.rect(left.x, left.y, left.w, left.h)
      ctx.clip()
      // the physical wave: vertical crests, never moving
      const lambda = 46
      for (let x = left.x - lambda; x < left.x + left.w + lambda; x += lambda) {
        ctx.fillStyle = 'rgba(37,99,235,0.10)'
        ctx.fillRect(x, left.y, lambda / 2, left.h)
      }
      // the coordinate grid, rotated by the knob
      const cx = left.x + left.w / 2
      const cy = left.y + left.h / 2
      ctx.strokeStyle = 'rgba(107,114,128,0.55)'
      ctx.lineWidth = 1
      const R = Math.hypot(left.w, left.h)
      for (let d = -R; d <= R; d += 22) {
        ctx.beginPath()
        ctx.moveTo(cx + d * Math.cos(theta) - R * Math.sin(theta), cy + d * Math.sin(theta) - R * Math.cos(theta))
        ctx.lineTo(cx + d * Math.cos(theta) + R * Math.sin(theta), cy + d * Math.sin(theta) + R * Math.cos(theta))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - R * Math.cos(theta) - d * Math.sin(theta), cy - R * Math.sin(theta) + d * Math.cos(theta))
        ctx.lineTo(cx + R * Math.cos(theta) - d * Math.sin(theta), cy + R * Math.sin(theta) + d * Math.cos(theta))
        ctx.stroke()
      }
      ctx.restore()

      // --- right: the two answers --------------------------------------------
      paneFrame(ctx, right)
      const full = fullReading()
      const draft = draftReading(theta)
      const base = right.y + right.h - 14
      const top = right.y + 14
      const barH = (v: number) => (v / full) * (base - top)
      const bw = Math.min(52, (right.w - 36) / 2)
      const bx0 = right.x + 14
      // draft bar (red): slides with the grid
      ctx.fillStyle = PALETTE.entwurf
      ctx.fillRect(bx0, base - barH(draft), bw, barH(draft))
      // 1915 bar (green): sits still
      ctx.fillStyle = PALETTE.gr1915
      ctx.fillRect(bx0 + bw + 8, base - barH(full), bw, barH(full))
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.entwurf
      ctx.fillText(`draft ${fmt(draft, 2)}`, bx0, h - 10)
      ctx.fillStyle = PALETTE.gr1915
      const g = `1915 law ${fmt(full, 2)}`
      ctx.fillText(g, right.x + right.w - ctx.measureText(g).width - 4, h - 10)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('one wave, a rotating grid', left.x + 4, 14)
      ctx.fillText('the two answers as the grid turns', right.x + 4, 14)
    },
  }
}

export function CovarianceMachine() {
  const [theta, setTheta] = useState(0)
  const thetaRef = useRef(theta)
  thetaRef.current = theta

  return (
    <Sim height={280} animated={false} create={() => createCovarianceMachine(thetaRef)}>
      <label className="sim-slider">
        <span>grid 0°</span>
        <input
          type="range"
          min={0}
          max={Math.PI / 2}
          step={0.01}
          value={theta}
          onChange={(e) => setTheta(Number(e.target.value))}
        />
        <span>grid 90°</span>
      </label>
    </Sim>
  )
}
