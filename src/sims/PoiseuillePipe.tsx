import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Hagen–Poiseuille flow with identical pressure gradient and viscosity.
// u(r) = (Δp/L) R² (1-r²/R²)/(4μ). Integrate u over concentric
// equal-area annuli to measure Q. Midpoint quadrature in s=r²/R² is exact
// for this linear integrand: mean speed is u_max/2, NOT 2u_max/3 (a slit).
// Volume units: the reference pipe's internal volume; length and area normalized.
// Markers illustrate that velocity field; they are not the volumetric meter.
// Fixed streamlines, deterministic equal-area seeding, identical seeds in both
// pipes. No random lateral respawning: it would trap dots near the slow walls.
// Fixed timestep for the collector/markers. Analytic constant velocities have
// no CFL restriction; modulo wrapping remains valid for any displacement.
const FIXED_DT = 1 / 240
const R_REF = 1
const UMAX_REF = 0.5
const ANNULI = 64
const MARKER_DENSITY = 160
const CYCLE_SECONDS = 8
const CYCLE_TICKS = CYCLE_SECONDS / FIXED_DT
const COLUMN_FULL = CYCLE_SECONDS * UMAX_REF / 2
const SEPIA = '#78716c'
interface Marker { x: number; r: number; speedFraction: number }
interface Pipe { R: number; markers: Marker[]; volume: number; color: string }
export function uMax(R: number) { return UMAX_REF * (R / R_REF) ** 2 }
export function volumeFlux(R: number): number {
  const annulusArea = (R / R_REF) ** 2 / ANNULI
  let flux = 0
  for (let i = 0; i < ANNULI; i++) {
    const radiusSquared = (i + 0.5) / ANNULI
    flux += uMax(R) * (1 - radiusSquared) * annulusArea
  }
  return flux
}
function buildMarkers(R: number): Marker[] {
  const count = Math.round(MARKER_DENSITY * R * R)
  return Array.from({ length: count }, (_, i) => {
    const s = (i + 0.5) / count
    // Project a uniform circular cross-section onto the side view.
    const theta = i * Math.PI * (3 - Math.sqrt(5))
    return { x: (0.5 + i * 0.4142135623730951) % 1, r: Math.sqrt(s) * Math.sin(theta), speedFraction: 1 - s }
  })
}
export interface PipeComparison extends Stepper {
  setRadius(radius: number): void
  measure(): { radius: number; elapsed: number; referenceVolume: number; testVolume: number; referenceFlow: number; testFlow: number }
}
export function createPipes(initialRadius = 0.5): PipeComparison {
  const ref: Pipe = { R: R_REF, markers: buildMarkers(R_REF), volume: 0, color: PALETTE.dye }
  const test: Pipe = { R: initialRadius, markers: buildMarkers(initialRadius), volume: 0, color: PALETTE.dye2 }
  const pipes = [ref, test]
  let ticks = 0, acc = 0, elapsed = 0
  const restart = () => {
    ticks = 0; acc = 0; elapsed = 0
    for (const p of pipes) { p.volume = 0; p.markers = buildMarkers(p.R) }
  }
  return {
    setRadius(radius) { test.R = Math.max(0.35, Math.min(1, radius)); restart() },
    measure() { return { radius: test.R, elapsed, referenceVolume: ref.volume, testVolume: test.volume, referenceFlow: volumeFlux(ref.R), testFlow: volumeFlux(test.R) } },
    step(dt) {
      acc += dt
      while (acc + 1e-12 >= FIXED_DT) {
        // Empty both collectors together after each eight-second sample.
        if (ticks === CYCLE_TICKS) { ticks = 0; for (const p of pipes) p.volume = 0 }
        ticks++; elapsed = ticks * FIXED_DT
        for (const p of pipes) {
          p.volume = volumeFlux(p.R) * elapsed
          for (const m of p.markers) m.x = (m.x + uMax(p.R) * m.speedFraction * FIXED_DT) % 1
        }
        acc -= FIXED_DT
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, w, h)
      const padX = 12
      const xOut = w * 0.55 // pipes end here; past this a marker is collected
      const halfPix = 34 // pixels of half-radius at R = R_REF
      const X = (x: number) => padX + x * (xOut - padX)

      const colTop = 35
      const colBot = h - 30
      const colH = colBot - colTop
      const colX0 = w * 0.66
      const colGap = 18
      const colW = Math.min(38, (w - 14 - colX0 - colGap) / 2)
      const colCenter = (i: number) => colX0 + i * (colW + colGap) + colW / 2
      const laneY = (i: number) => h * (i === 0 ? 0.25 : 0.75)

      // plumbing: outlet → column, drawn first so the fill paints over it
      ctx.strokeStyle = SEPIA
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1
      for (let i = 0; i < pipes.length; i++) {
        ctx.beginPath()
        ctx.moveTo(xOut, laneY(i))
        ctx.lineTo(colCenter(i), laneY(i))
        ctx.lineTo(colCenter(i), colBot)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // the two pipes
      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i]
        const midY = laneY(i)
        const rHalf = p.R * halfPix

        ctx.strokeStyle = PALETTE.wall
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padX, midY - rHalf)
        ctx.lineTo(xOut, midY - rHalf)
        ctx.moveTo(padX, midY + rHalf)
        ctx.lineTo(xOut, midY + rHalf)
        ctx.stroke()

        ctx.fillStyle = p.color
        for (const m of p.markers) {
          ctx.beginPath()
          ctx.arc(X(m.x), midY + m.r * rHalf, 2.1, 0, Math.PI * 2)
          ctx.fill()
        }

        // analytic parabola at a station, same Δp/L for both lanes so the u_max
        // difference (∝R²) is drawn to one shared scale
        const station = 0.66
        const um = uMax(p.R)
        const arrowScale = ((xOut - padX) * 0.24) / UMAX_REF
        ctx.strokeStyle = 'rgba(37,99,235,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(X(station), midY - rHalf)
        ctx.lineTo(X(station), midY + rHalf)
        ctx.stroke()
        ctx.strokeStyle = PALETTE.vel
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let s = 0; s <= 40; s++) {
          const rr = -1 + (2 * s) / 40
          const px = X(station) + um * (1 - rr * rr) * arrowScale
          const py = midY + rr * rHalf
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()

        ctx.fillStyle = SEPIA
        ctx.font = '600 11px ui-monospace, monospace'
        ctx.fillText(`R = ${p.R.toFixed(2)}`, padX, midY - rHalf - 7)
      }

      // Collecting columns integrate the cross-sectional volume flux, not dot counts.
      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i]
        const x = colX0 + i * (colW + colGap)
        ctx.strokeStyle = SEPIA
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 1
        ctx.strokeRect(x, colTop, colW, colH)
        ctx.globalAlpha = 1
        const fh = Math.min(1, p.volume / COLUMN_FULL) * colH
        ctx.fillStyle = p.color
        ctx.fillRect(x, colBot - fh, colW, fh)
        ctx.fillStyle = SEPIA
        ctx.font = '600 11px ui-monospace, monospace'
        ctx.fillText(p.volume.toFixed(2), x - 2, colBot + 15)
      }

      ctx.fillStyle = SEPIA
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('Same pressure drop, length and fluid', padX, 16)
      ctx.fillText('Volume', colX0, colTop - 8)
      ctx.font = '600 12px system-ui, sans-serif'
      const flowRatio = volumeFlux(test.R) / volumeFlux(R_REF)
      ctx.fillText(`Flow: ${(100 * flowRatio).toFixed(flowRatio < 0.1 ? 1 : 0)}% of reference`, padX, h * 0.5 - 3)
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText(`Collected over ${elapsed.toFixed(1)} s`, padX, h * 0.5 + 15)
    },
  }
}

export function PoiseuillePipe() {
  const [R, setR] = useState(0.5)
  const radius = useRef(R), sim = useRef<PipeComparison | null>(null)
  radius.current = R
  return (
    <Sim height={320} create={() => {
      const fresh = createPipes(radius.current); sim.current = fresh; return fresh
    }}>
      <label className="sim-slider">
        <span>Radius</span>
        <input aria-label="Pipe radius" type="range" min={0.35} max={1} step={0.01} value={R}
          onChange={e => {
            const next = Number(e.target.value); setR(next); sim.current?.setRadius(next)
          }} />
        <span>{R.toFixed(2)}</span>
      </label>
    </Sim>
  )
}
