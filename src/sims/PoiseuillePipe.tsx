import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Hagen–Poiseuille, 1839–46 — laminar flow in a pipe.
// A horizontal pipe of radius R at a FIXED pressure gradient Δp/L. The velocity
// profile is the analytic parabola
//   u(r) = u_max · (1 − r²/R²),   with u_max = (Δp/L)·R² / (4μ)  ∝ R²
// so at fixed Δp/L the peak speed grows as R². Integrating the parabola over the
// circular cross-section gives the volumetric flux
//   Q = (π/8)·(Δp/L)·R⁴ / μ   ∝ R⁴          ← the fourth-power law.
// Halving R therefore drops Q to (1/2)⁴ = 1/16 ≈ 0.06.
//
// Markers are advected by the analytic profile (no integrator feedback); they
// respawn at the left. Marker DENSITY per unit cross-sectional area is held
// constant, so a wider pipe carries proportionally more markers and the flux
// difference reads directly as throughput. Display only.

const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const UMAX_REF = 0.5 // peak speed (pipe-lengths / sec) at R = R_MAX (the ∝R² baseline)
const R_MAX = 1.0 // slider units; markers/flux normalized so R=1.0 → Q=1.00
const MARKER_DENSITY = 900 // markers per unit area → count scales with R²
const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)

interface Marker {
  x: number // ∈ [0,1] along the pipe
  r: number // ∈ [-1,1] fraction of the CURRENT radius (lateral)
}

// u_max ∝ R²: normalized so R = R_MAX gives UMAX_REF.
function uMax(R: number): number {
  return UMAX_REF * (R / R_MAX) ** 2
}
// relative flux Q ∝ R⁴, normalized to 1.00 at R = R_MAX.
function relFlux(R: number): number {
  return (R / R_MAX) ** 4
}

function createPipe(rRef: { current: number }): Stepper {
  let markers: Marker[] = []

  // rebuild the marker set so its count tracks R² (constant areal density).
  let builtFor = -1
  const rebuild = (R: number) => {
    const count = Math.max(6, Math.round(MARKER_DENSITY * R * R))
    markers = new Array(count)
    for (let i = 0; i < count; i++) {
      markers[i] = { x: Math.random(), r: Math.random() * 2 - 1 }
    }
    builtFor = R
  }

  let acc = 0
  const advance = () => {
    const R = rRef.current
    if (Math.abs(R - builtFor) > 1e-3) rebuild(R)
    const um = uMax(R)
    for (const m of markers) {
      const u = um * (1 - m.r * m.r) // parabolic profile in the fractional radius
      m.x += u * FIXED_DT
      if (m.x > 1) {
        m.x -= 1
        m.r = Math.random() * 2 - 1 // respawn at the left, fresh lateral position
      }
    }
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
      const padX = 20
      const midY = h * 0.5
      const halfPix = h * 0.38 // pixels for R = R_MAX
      const X = (x: number) => padX + x * (w - 2 * padX)
      const rHalf = R * halfPix

      // pipe walls
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(padX, midY - rHalf)
      ctx.lineTo(w - padX, midY - rHalf)
      ctx.moveTo(padX, midY + rHalf)
      ctx.lineTo(w - padX, midY + rHalf)
      ctx.stroke()

      // amber markers
      ctx.fillStyle = PALETTE.dye
      for (const m of markers) {
        ctx.beginPath()
        ctx.arc(X(m.x), midY + m.r * rHalf, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // parabolic velocity-profile outline at a station (blue), scaled by u_max(R)
      const station = 0.72
      const um = uMax(R)
      const arrowScale = (w - 2 * padX) * 0.22 / UMAX_REF
      ctx.strokeStyle = PALETTE.vel
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let s = 0; s <= 40; s++) {
        const rr = -1 + (2 * s) / 40
        const u = um * (1 - rr * rr)
        const px = X(station) + u * arrowScale
        const py = midY + rr * rHalf
        if (s === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      // the profile's baseline at the station
      ctx.strokeStyle = 'rgba(37,99,235,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(X(station), midY - rHalf)
      ctx.lineTo(X(station), midY + rHalf)
      ctx.stroke()

      // sepia readout box: Q ∝ R⁴ and live relative flux
      ctx.strokeStyle = SEPIA
      ctx.fillStyle = SEPIA
      ctx.lineWidth = 1
      const bx = 12
      const by = 12
      ctx.strokeRect(bx, by, 118, 40)
      ctx.font = '600 12px ui-monospace, monospace'
      ctx.fillText('Q ∝ R⁴', bx + 8, by + 17)
      ctx.fillText(`Q = ${relFlux(R).toFixed(2)}`, bx + 8, by + 33)
    },
  }
}

export function PoiseuillePipe() {
  const [R, setR] = useState(0.8)
  const rRef = useRef(R)
  rRef.current = R

  return (
    <Sim height={260} create={() => createPipe(rRef)}>
      <label className="sim-slider">
        <span>narrow</span>
        <input
          type="range"
          min={0.35}
          max={1.0}
          step={0.01}
          value={R}
          onChange={(e) => setR(Number(e.target.value))}
        />
        <span>wide R</span>
      </label>
    </Sim>
  )
}
