import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Stokes drag, 1851 — a sphere settling in honey.
// A sphere released from the top of a viscous column. Its velocity obeys linear
// (Stokes) drag, whose equation of motion m·v̇ = m'g − 6πμR·v has the exact
// closed-form solution
//   v(t) = v_t + (v0 − v_t)·exp(−t/τ)
// which we step as   v ← v_t + (v − v_t)·exp(−dt/τ).
// This is the EXACT solution of the linear ODE, not a forward-Euler integrator —
// it is unconditionally stable for any dt (no CFL bound to satisfy).
//
// terminal velocity:  v_t = 2(ρs − ρf) g R² / (9μ)      →  v_t ∝ R²
// relaxation time:     τ  = m / (6πμR) = (ρs · (4/3)πR³) / (6πμR) = 2ρs R² / (9μ)
//
// The R² law is checkable by hand: doubling R should visibly ~quadruple the fall
// rate (both the terminal speed AND, coincidentally here, τ scale as R²).
//
// The green flow-past streaks around the sphere are DISPLAY ONLY — decorative
// creeping-flow streamlines, not a solved field.

const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const G = 900 // gravity in px/s² (display units)
const MU = 60 // dynamic viscosity of the "honey" (display units)
const RHO_S = 2.5 // sphere density
const RHO_F = 1.3 // honey density
const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)

function terminalV(R: number): number {
  return (2 * (RHO_S - RHO_F) * G * R * R) / (9 * MU)
}
function tau(R: number): number {
  return (2 * RHO_S * R * R) / (9 * MU)
}

function createColumn(rRef: { current: number }): Stepper {
  let y = 20
  let v = 0
  let measuredV = 0

  let acc = 0
  const advance = () => {
    const R = rRef.current
    const vt = terminalV(R)
    const t = tau(R)
    const yPrev = y
    // analytic linear-drag update (exact solution, unconditionally stable)
    v = vt + (v - vt) * Math.exp(-FIXED_DT / t)
    y += v * FIXED_DT
    measuredV = (y - yPrev) / FIXED_DT
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      const R = rRef.current
      ctx.clearRect(0, 0, w, h)

      // honey column tint
      ctx.fillStyle = 'rgba(217,119,6,0.06)'
      ctx.fillRect(0, 0, w, h)

      const cx = w * 0.42
      const bottom = h - 12

      // re-drop when the sphere reaches the bottom (fade handled by alpha ramp)
      const fadeStart = bottom - R - 24
      let alpha = 1
      if (y > fadeStart) {
        alpha = Math.max(0, 1 - (y - fadeStart) / 40)
        if (y > bottom + R) {
          y = 20
          v = 0
        }
      }

      // faint green flow-past streaks (display only)
      ctx.strokeStyle = 'rgba(5,150,105,0.35)'
      ctx.lineWidth = 1
      for (let k = -2; k <= 2; k++) {
        if (k === 0) continue
        const off = k * (R + 6)
        ctx.beginPath()
        ctx.moveTo(cx + off, y - R - 18)
        ctx.quadraticCurveTo(cx + off * 0.55, y, cx + off, y + R + 18)
        ctx.stroke()
      }

      // the sphere
      ctx.globalAlpha = alpha
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.arc(cx, y, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      // sepia readout box: R and measured v, plus the R² annotation
      ctx.strokeStyle = SEPIA
      ctx.fillStyle = SEPIA
      ctx.lineWidth = 1
      const bx = w * 0.7
      const by = 16
      ctx.strokeRect(bx, by, w * 0.27, 56)
      ctx.font = '600 11px ui-monospace, monospace'
      ctx.fillText(`R = ${R.toFixed(0)}`, bx + 8, by + 16)
      ctx.fillText(`v = ${measuredV.toFixed(0)} px/s`, bx + 8, by + 32)
      ctx.font = '600 11px ui-sans-serif, system-ui'
      ctx.fillText('v_t ∝ R²', bx + 8, by + 50)
    },
  }
}

export function FallingSphere() {
  const [R, setR] = useState(12)
  const rRef = useRef(R)
  rRef.current = R

  return (
    <Sim height={280} create={() => createColumn(rRef)}>
      <label className="sim-slider">
        <span>small</span>
        <input
          type="range"
          min={6}
          max={24}
          step={1}
          value={R}
          onChange={(e) => setR(Number(e.target.value))}
        />
        <span>large R</span>
      </label>
    </Sim>
  )
}
