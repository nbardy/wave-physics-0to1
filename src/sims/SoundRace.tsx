import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Newton's public miss, 1687 — in the Principia Newton computed the speed of sound
// assuming the compressions are ISOTHERMAL (Boyle's law, pressure ∝ density). That
// gives c_iso = √(p/ρ). The measured speed is faster: sound is actually ADIABATIC,
// c = √(γ·p/ρ), with γ = 1.4 for air. Laplace fixed it in 1816.
//
// The ratio is exact: c_measured / c_Newton = √γ = √1.4. At 0 °C the measured speed
// is 331 m/s, so Newton's isothermal prediction is 331/√1.4 ≈ 280 m/s. Two fronts
// launched together therefore separate at a fixed ratio; by the time the fast front
// crosses the tube the gap is (1 − 1/√1.4) ≈ 15.5% of the tube. Honest caveat: this
// is a 1-D constant-speed RACE, not an acoustics solver — the "pulses" are markers,
// the physics content is entirely in the two speeds and their √γ ratio.
//
// Phase is a discriminated union with exhaustive dispatch (no default branch):
//   Racing  — both fronts advancing until the fast one hits the wall
//   Paused  — 1 s hold showing the Laplace footnote, then reset to Racing
//
// Fixed physics timestep with the acc/FIXED_DT accumulator (RAF-independent).
//
// Sepia '#78716c' is this lesson's history-furniture color (Newton front, footnote).

const SEPIA = '#78716c'
const FIXED_DT = 1 / 240
const C_MEASURED = 331 // m/s at 0 °C
const SQRT_GAMMA = Math.sqrt(1.4)
const C_NEWTON = C_MEASURED / SQRT_GAMMA // ≈ 280 m/s (isothermal prediction)
const TUBE_M = 200 // physical length the tube represents (m)
const PAUSE_S = 1.0 // hold after the race before restart

type Phase =
  | { kind: 'racing'; t: number }
  | { kind: 'paused'; t: number }

function createRace(speedRef: { current: number }): Stepper {
  let phase: Phase = { kind: 'racing', t: 0 }
  let acc = 0

  // time for the measured front to cross the whole tube
  const T_FINISH = TUBE_M / C_MEASURED

  // exhaustive dispatch on phase.kind — advances one fixed physics step
  const advance = (): void => {
    const timeScale = speedRef.current // slow-motion factor from the slider
    const step = FIXED_DT * timeScale
    if (phase.kind === 'racing') {
      const t = phase.t + step
      phase = t >= T_FINISH ? { kind: 'paused', t: 0 } : { kind: 'racing', t }
      return
    }
    if (phase.kind === 'paused') {
      const t = phase.t + step
      phase = t >= PAUSE_S ? { kind: 'racing', t: 0 } : { kind: 'paused', t }
      return
    }
    // no default branch: Phase is exhausted above
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 12) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 24
      const tubeLeft = pad
      const tubeRight = w - pad
      const tubeLen = tubeRight - tubeLeft
      const midY = h / 2 + 10

      // race clock: freeze at the finish while paused so both fronts sit at the wall
      const raceT = phase.kind === 'racing' ? phase.t : T_FINISH
      const xMeasured = tubeLeft + Math.min((C_MEASURED * raceT) / TUBE_M, 1) * tubeLen
      const xNewton = tubeLeft + Math.min((C_NEWTON * raceT) / TUBE_M, 1) * tubeLen

      // tube walls
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.strokeRect(tubeLeft, midY - 26, tubeLen, 52)

      // left wall (launch point) accent
      ctx.fillStyle = 'rgba(107,114,128,0.35)'
      ctx.fillRect(tubeLeft, midY - 26, 4, 52)

      // Newton's isothermal front (sepia) — draw first so the fast one overlays
      drawFront(ctx, xNewton, midY, SEPIA)
      // measured / adiabatic front (velocity blue)
      drawFront(ctx, xMeasured, midY, PALETTE.vel)

      // labels riding above each front
      ctx.font = '11px ui-sans-serif, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = PALETTE.vel
      ctx.fillText('measured · 331 m/s', clampX(xMeasured, tubeLeft, tubeRight, 70), midY - 34)
      ctx.fillStyle = SEPIA
      ctx.fillText("Newton's prediction · 280 m/s", clampX(xNewton, tubeLeft, tubeRight, 90), midY + 46)
      ctx.textAlign = 'left'

      // Laplace footnote appears only during the paused hold (before restart)
      if (phase.kind === 'paused') {
        ctx.fillStyle = SEPIA
        ctx.font = '10px ui-sans-serif, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('γ corrected — Laplace 1816', tubeRight, h - 6)
        ctx.textAlign = 'left'
      }
    },
  }
}

function drawFront(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  // a compression pulse: a bright vertical band fading to each side
  const grad = ctx.createLinearGradient(x - 10, 0, x + 10, 0)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.5, color)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(x - 10, y - 24, 20, 48)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y - 24)
  ctx.lineTo(x, y + 24)
  ctx.stroke()
}

function clampX(x: number, lo: number, hi: number, margin: number): number {
  return Math.max(lo + margin, Math.min(hi - margin, x))
}

export function SoundRace() {
  const [speed, setSpeed] = useState(0.4)
  const speedRef = useRef(speed)
  speedRef.current = speed

  return (
    <Sim height={240} create={() => createRace(speedRef)}>
      <label className="sim-slider">
        <span>slow-mo</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>real time</span>
      </label>
    </Sim>
  )
}
