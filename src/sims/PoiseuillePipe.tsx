import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Hagen–Poiseuille, 1839–46 — laminar flow in a pipe, staged as a RACE between two
// pipes driven by the SAME pressure gradient Δp/L, so the fourth power arrives as a
// length you can measure with your eye instead of a decimal in a readout.
//
//   u(r) = u_max · (1 − r²/R²),    u_max = (Δp/L)·R² / (4μ)   ∝ R²
//   Q     = ∫ u dA = (π/8)·(Δp/L)·R⁴ / μ                      ∝ R⁴
//
// How the R⁴ is EARNED rather than typed: each pipe is seeded with a marker count
// proportional to its cross-sectional area (∝ R²), and every marker is advected by
// the analytic parabola, whose scale is ∝ R². Markers that run off the right-hand
// end are TALLIED, one at a time, into that pipe's collecting column. The crossing
// rate is therefore (markers ∝ R²) × (mean speed ∝ R²) ∝ R⁴ — the column heights are
// a count of real crossings. No ratio is hardcoded anywhere in this file.
//
// Stability: there is no integrator. A marker's step is an analytic velocity that
// never depends on the previous state, so nothing can grow without bound. The fixed
// timestep is here only so RAF cadence cannot change the measured crossing rates.

const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const R_REF = 1.0 // the reference pipe: full radius, always the top lane
const UMAX_REF = 0.5 // peak speed (pipe-lengths/sec) at R = R_REF — the ∝R² baseline
const MARKER_DENSITY = 300 // markers per unit cross-sectional area → count ∝ R²
// Mean speed across the parabola is (2/3)·u_max, so the reference pipe tallies
// MARKER_DENSITY·(2/3)·UMAX_REF = 100 crossings/sec — COLUMN_FULL is a ~7 s fill.
const COLUMN_FULL = 700
const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)

interface Marker {
  x: number // ∈ [0,1] along the pipe
  r: number // ∈ [-1,1] fraction of THIS pipe's radius (lateral)
}

interface Pipe {
  R: number
  markers: Marker[]
  tally: number // markers collected this cycle — this IS the column height
  color: string
}

function buildMarkers(R: number): Marker[] {
  // constant areal density: a pipe of radius R gets ∝R² markers
  const count = Math.max(8, Math.round(MARKER_DENSITY * R * R))
  const markers = new Array<Marker>(count)
  for (let i = 0; i < count; i++) markers[i] = { x: Math.random(), r: Math.random() * 2 - 1 }
  return markers
}

function uMax(R: number): number {
  return UMAX_REF * (R / R_REF) ** 2
}

function createPipes(rRef: { current: number }): Stepper {
  const ref: Pipe = { R: R_REF, markers: buildMarkers(R_REF), tally: 0, color: PALETTE.dye }
  const test: Pipe = {
    R: rRef.current,
    markers: buildMarkers(rRef.current),
    tally: 0,
    color: PALETTE.dye2,
  }
  const pipes = [ref, test]

  const advancePipe = (p: Pipe) => {
    const um = uMax(p.R)
    for (const m of p.markers) {
      m.x += um * (1 - m.r * m.r) * FIXED_DT // parabolic profile in the fractional radius
      if (m.x > 1) {
        m.x -= 1
        m.r = Math.random() * 2 - 1 // respawn at the left, fresh lateral position
        p.tally++ // one marker crossed the outlet: collect it
      }
    }
  }

  let acc = 0
  const advance = () => {
    // Knob change → restage: rebuild the test pipe's marker set and empty both
    // columns so the next comparison starts clean. Done here in the step path;
    // draw stays pure.
    if (Math.abs(rRef.current - test.R) > 1e-3) {
      test.R = rRef.current
      test.markers = buildMarkers(test.R)
      ref.tally = 0
      test.tally = 0
    }
    advancePipe(ref)
    advancePipe(test)
    // The cycle restarts when the reference column tops out, so the two heights are
    // always a fresh side-by-side measurement instead of a saturated pair.
    if (ref.tally >= COLUMN_FULL) {
      ref.tally = 0
      test.tally = 0
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
      ctx.clearRect(0, 0, w, h)
      const padX = 18
      const xOut = w * 0.55 // pipes end here; past this a marker is collected
      const halfPix = 40 // pixels of half-radius at R = R_REF
      const X = (x: number) => padX + x * (xOut - padX)

      const colTop = 16
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

      // collecting columns — heights are the raw crossing tallies
      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i]
        const x = colX0 + i * (colW + colGap)
        ctx.strokeStyle = SEPIA
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 1
        ctx.strokeRect(x, colTop, colW, colH)
        ctx.globalAlpha = 1
        const fh = Math.min(1, p.tally / COLUMN_FULL) * colH
        ctx.fillStyle = p.color
        ctx.fillRect(x, colBot - fh, colW, fh)
        ctx.fillStyle = SEPIA
        ctx.font = '600 11px ui-monospace, monospace'
        ctx.fillText(`${p.tally}`, x, colBot + 15)
      }

      // sepia readout in the gap between the lanes
      const ratio = test.tally > 0 ? `  =  ${(ref.tally / test.tally).toFixed(1)} : 1` : ''
      ctx.fillStyle = SEPIA
      ctx.font = '600 12px ui-monospace, monospace'
      ctx.fillText(`Q ∝ R⁴     collected ${ref.tally} : ${test.tally}${ratio}`, padX, h * 0.5 + 4)
    },
  }
}

export function PoiseuillePipe() {
  const [R, setR] = useState(0.5)
  const rRef = useRef(R)
  rRef.current = R

  return (
    <Sim height={320} create={() => createPipes(rRef)}>
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
