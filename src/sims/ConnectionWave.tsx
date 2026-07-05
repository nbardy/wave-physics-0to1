import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { canvasFrac, clockRow, drawBase, drawGraph, laneSplit, type Lane } from './lib/clocks'
import { AWAVE_FIXED_DT, AWAVE_N, createAWave, type AWave } from './lib/awave'

// §10 — the wave in the connection (figs 52–60 core family).
// Every pane in every config is driven by the SAME leapfrog state array A_y(x,t)
// from lib/awave.ts (A_tt = c²A_xx; explicit leapfrog, stability c·dt/dx ≤ 1,
// Courant number C = 0.5 there by construction — this file adds NO integrator of
// its own, so it carries no new stability condition). Three figures, one typed
// mode prop dispatched once:
//   'pluck'    — the reader performs math #8: tap/click to pluck the frozen A
//                curve (wave.pluck at the tap position); the bump splits into two
//                fronts running opposite ways at c, verified by distance = c·t
//                markers riding the fronts — the readout comes before the
//                equation. The clocks show a reference needle parallel-
//                transported from the left end under the live A (the hero's
//                bottom-pane rendering): the pulse arrives as a traveling kink
//                in what "parallel" means. The tap is the figure's one
//                interaction; time runs at a fixed slow-down (the "I have slowed
//                time enormously" confession lives in the prose).
//   'readouts' — the same scene plus the gauge-invariant readouts in a lower
//                lane: E = −∂A/∂t (red) and B = ∂A/∂x (cyan), both computed in
//                lib/awave.ts from the leapfrog's two stored time levels /
//                centered difference — drawn exactly IN PHASE because they are
//                in phase for a traveling wave (the quarter-cycle "each births
//                the other" picture is a misconception and is banned — PLAN.md
//                hero spec). One knob: time speed.
//   'compass'  — the household anchor: a bar magnet wiggles at the left end and
//                the row of compasses re-aims in sequence, late. The needles
//                read the curvature readout (B = ∂A/∂x, the space–space row of
//                §9's dictionary; curvature violet per the palette contract)
//                while the wave itself rides in A, drawn in the lane below —
//                the hero's dual-pane mapping. One knob: time speed.

const CLOCKS = 26

// Visual gain on the transported needle's accumulated turn (same confessed
// factors as HeroEMWave's bottom pane): a unit A-pulse would otherwise turn the
// needle too little to read as a kink. Exaggeration of angle only — the needle
// still integrates the live A, nothing else.
const TRANSPORT_GAIN = 0.9
const TRANSPORT_SCALE = 8

/** The hero's bottom-pane rendering: clock faces with a reference needle
 *  parallel-transported from the left end under the live A —
 *  needle(i) = π/2 + Σ A·dx up to clock i (with the confessed visual gain). */
function drawTransportRow(ctx: CanvasRenderingContext2D, lane: Lane, wave: AWave): void {
  const row = clockRow(lane, CLOCKS)
  drawBase(ctx, row, lane)
  const n = AWAVE_N
  let phi = Math.PI / 2
  for (let i = 0; i < CLOCKS; i++) {
    const from = Math.floor((i / CLOCKS) * n)
    const to = Math.floor(((i + 1) / CLOCKS) * n)
    // face
    ctx.strokeStyle = PALETTE.wall
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(row.cx[i], row.cy, row.r, 0, Math.PI * 2)
    ctx.stroke()
    // transported needle — the connection's own color: this is A made visible
    ctx.strokeStyle = PALETTE.conn
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(row.cx[i], row.cy)
    ctx.lineTo(
      row.cx[i] + Math.cos(-phi) * row.r * 0.85,
      row.cy + Math.sin(-phi) * row.r * 0.85,
    )
    ctx.stroke()
    for (let j = from; j < to; j++) phi += wave.a[j] * TRANSPORT_GAIN * (1 / CLOCKS) * TRANSPORT_SCALE
  }
}

/** An x-mapping row over the full grid, for drawGraph lanes (faces unused). */
function gridRow(lane: Lane) {
  return clockRow(lane, AWAVE_N)
}

// ---------------------------------------------------------------------------
// 'pluck' — tap to pluck; watch the split fronts ride the c·t markers.
// ---------------------------------------------------------------------------

const PLUCK_AMP = 0.9
// Fixed slow-down so the pluck stays the figure's ONE interaction (no slider).
const PLUCK_TIME_SCALE = 0.55
// Mirrors lib/awave.ts's private Courant constant C: the crest of each split
// front moves exactly C grid samples per fixed step (up to the scheme's mild
// numerical dispersion, invisible for this smooth pluck kernel). awave.ts does
// not export C; if its value changes, this marker speed must change with it.
const COURANT = 0.5

interface PluckRefs {
  /** Fractional x positions of taps not yet applied; drained by step(). */
  taps: number[]
}

function createPluck(refs: PluckRefs): Stepper {
  const wave = createAWave(false) // the frozen connection: flat, silent, waiting
  // Mirror of awave's internal fixed-step accumulator: both start at 0 and see
  // the identical scaled-dt stream and the identical guard, so stepsSince counts
  // exactly the leapfrog steps taken — the marker distance C·steps is exact.
  let acc = 0
  let stepsSince = 0
  // null = the reader has not plucked yet — absence is the meaning (rule T2).
  let last: { f: number } | null = null

  return {
    step(dt) {
      const scaled = dt * PLUCK_TIME_SCALE
      for (const f of refs.taps) {
        wave.pluck(f, PLUCK_AMP)
        last = { f }
        stepsSince = 0
      }
      refs.taps.length = 0
      acc += scaled
      let guard = 0
      while (acc >= AWAVE_FIXED_DT && guard < 8) {
        acc -= AWAVE_FIXED_DT
        stepsSince++
        guard++
      }
      wave.step(scaled)
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, bottom] = laneSplit(w, h, [0.55, 0.45])
      drawTransportRow(ctx, top, wave)
      drawGraph(ctx, bottom, gridRow(bottom), wave.a, {
        color: PALETTE.conn,
        yMin: -1.15,
        yMax: 1.15,
        label: 'A(x) — the connection',
      })

      // the distance/time readout, shown before any equation: each front sits
      // a distance c·t from the pluck point.
      if (last) {
        const dist = (COURANT * stepsSince) / (AWAVE_N - 1)
        for (const s of [-1, 1]) {
          const f = last.f + s * dist
          if (f < 0 || f > 1) continue // a departed front has left the readout too
          const x = bottom.x0 + f * (bottom.x1 - bottom.x0)
          ctx.strokeStyle = 'rgba(85,96,111,0.65)'
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(x, bottom.y0)
          ctx.lineTo(x, bottom.y1)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(85,96,111,0.85)'
          ctx.font = '11px system-ui, sans-serif'
          ctx.fillText('c·t', x + 3, bottom.y0 + 11)
        }
        ctx.fillStyle = '#55606f'
        ctx.font = '13px system-ui, sans-serif'
        ctx.fillText(
          `two fronts, each a distance c·t from your pluck — t = ${(stepsSince * AWAVE_FIXED_DT).toFixed(2)} s`,
          12,
          20,
        )
      }
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('tap or click anywhere to pluck the connection', 12, h - 10)
    },
  }
}

function PluckFigure() {
  const refs = useRef<PluckRefs>({ taps: [] })

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = canvasFrac(e)
    if (!p) return
    // generous hit target: the whole canvas plucks, clamped off the absorbing ends
    refs.current.taps.push(Math.min(0.95, Math.max(0.05, p.fx)))
  }

  return (
    <div onPointerDown={onPointerDown} style={{ touchAction: 'none' }}>
      <Sim
        height={320}
        create={() => createPluck(refs.current)}
        caption="Pluck the frozen connection: the bump splits into two fronts, and each rides its c·t marker — the wave equation observed before it is written."
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 'readouts' — same scene + E = −∂A/∂t (red) and B = ∂A/∂x (cyan), in phase.
// ---------------------------------------------------------------------------

const EB_RANGE = 0.16 // plotting range for the derivative readouts of a unit pulse
const RELAUNCH_AFTER = 6 // seconds of wave time before the stage is re-plucked

function createReadouts(speedRef: { current: number }): Stepper {
  const wave = createAWave(true) // seeded with an exact right-traveling pulse
  let sinceLaunch = 0

  return {
    step(dt) {
      const scaled = dt * speedRef.current
      wave.step(scaled)
      sinceLaunch += scaled
      // keep the stage alive (the hero's move): re-pluck after the pulse leaves
      if (sinceLaunch > RELAUNCH_AFTER) {
        wave.pluck(0.15, 1)
        sinceLaunch = 0
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, mid, low] = laneSplit(w, h, [0.4, 0.27, 0.33])
      drawTransportRow(ctx, top, wave)
      drawGraph(ctx, mid, gridRow(mid), wave.a, {
        color: PALETTE.conn,
        yMin: -1.15,
        yMax: 1.15,
        label: 'A(x) — the connection',
      })
      const lowRow = gridRow(low)
      drawGraph(ctx, low, lowRow, wave.e, {
        color: PALETTE.efield,
        yMin: -EB_RANGE,
        yMax: EB_RANGE,
      })
      drawGraph(ctx, low, lowRow, wave.b, {
        color: PALETTE.bfield,
        yMin: -EB_RANGE,
        yMax: EB_RANGE,
        axis: false,
      })
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillStyle = PALETTE.efield
      ctx.fillText('E = −∂A/∂t', low.x0 + 4, low.y0 + 12)
      ctx.fillStyle = PALETTE.bfield
      ctx.fillText('B = ∂A/∂x', low.x0 + 88, low.y0 + 12)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.fillText('— in phase: both are slopes of the same pulse', low.x0 + 168, low.y0 + 12)
    },
  }
}

function ReadoutsFigure() {
  const [speed, setSpeed] = useState(0.7)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim
      height={360}
      create={() => createReadouts(speedRef)}
      caption="One pulse, read three ways: A itself, E from its time-slope, B from its space-slope — rising and falling in lockstep."
    >
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.05}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}

// ---------------------------------------------------------------------------
// 'compass' — the household anchor: a wiggling magnet, a row of compasses,
// the redefinition of "rest" arriving clock by clock, late.
// ---------------------------------------------------------------------------

const COMPASSES = 18
// The magnet is a displacement source in A, injected once per FIXED leapfrog
// step (never per frame — the drive is deterministic and frame-rate free; a
// bounded source does not alter the scheme's stability). Constants tuned so the
// radiated wave swings A by ~0.6 and spans ~¾ of the row per wavelength.
const DRIVE_F = 0.08 // source position (kernel clear of the absorbing boundary)
const DRIVE_OMEGA = 5.0 // rad/s of wave time
const DRIVE_EPS = 0.05 // per-step source amplitude
// A compass aligns with the TOTAL field: deflection = atan(B_wave / B_north).
// B_NORTH sets the ambient north strength (i.e. the needles' sensitivity) —
// chosen so the passing wave swings them visibly without pinning them sideways.
const B_NORTH = 0.012

function createCompass(speedRef: { current: number }): Stepper {
  const wave = createAWave(false)
  let acc = 0
  let phase = 0

  return {
    step(dt) {
      acc += dt * speedRef.current
      let guard = 0
      while (acc >= AWAVE_FIXED_DT && guard < 8) {
        phase += DRIVE_OMEGA * AWAVE_FIXED_DT
        wave.pluck(DRIVE_F, DRIVE_EPS * Math.sin(phase))
        wave.step(AWAVE_FIXED_DT) // consumes exactly one internal fixed step
        acc -= AWAVE_FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, bottom] = laneSplit(w, h, [0.6, 0.4])

      // the magnet zone at the left; compasses fill the rest of the lane
      const magW = 64
      const rowLane: Lane = { x0: top.x0 + magW, x1: top.x1, y0: top.y0, y1: top.y1 }
      const row = clockRow(rowLane, COMPASSES)
      drawBase(ctx, row, rowLane)

      // the bar magnet, rocking with the drive phase (household object — its
      // red/gray poles are not palette-bound quantities)
      ctx.save()
      ctx.translate(top.x0 + 26, row.cy)
      ctx.rotate(0.45 * Math.sin(phase))
      ctx.fillStyle = '#6b7280'
      ctx.fillRect(-22, -7, 22, 14)
      ctx.fillStyle = '#b91c1c'
      ctx.fillRect(0, -7, 22, 14)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px system-ui, sans-serif'
      ctx.fillText('N', 12, 4)
      ctx.fillText('S', -16, 4)
      ctx.restore()

      // the compasses: each needle aligns with ambient north + the wave's B,
      // read from the SAME state array the lane below plots as A
      for (let i = 0; i < row.n; i++) {
        const fx = (row.cx[i] - top.x0) / (top.x1 - top.x0)
        const gi = Math.round(fx * (AWAVE_N - 1))
        const defl = Math.atan(wave.b[gi] / B_NORTH)
        const dx = Math.sin(defl)
        const dy = -Math.cos(defl)
        // face
        ctx.strokeStyle = PALETTE.wall
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(row.cx[i], row.cy, row.r, 0, Math.PI * 2)
        ctx.stroke()
        // the undisturbed rest direction (north), a faint outer tick
        ctx.strokeStyle = 'rgba(107,114,128,0.5)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(row.cx[i], row.cy - row.r * 0.78)
        ctx.lineTo(row.cx[i], row.cy - row.r * 1.05)
        ctx.stroke()
        // the needle — it reads the curvature (B = ∂A/∂x, the space–space row
        // of §9's dictionary), so it wears curvature's violet
        ctx.strokeStyle = PALETTE.curv
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(row.cx[i], row.cy)
        ctx.lineTo(row.cx[i] + dx * row.r * 0.8, row.cy + dy * row.r * 0.8)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(124,58,237,0.35)'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(row.cx[i], row.cy)
        ctx.lineTo(row.cx[i] - dx * row.r * 0.55, row.cy - dy * row.r * 0.55)
        ctx.stroke()
      }

      drawGraph(ctx, bottom, gridRow(bottom), wave.a, {
        color: PALETTE.conn,
        yMin: -0.9,
        yMax: 0.9,
        label: 'A(x) — the wave itself rides in the connection',
      })
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('the news of where to rest arrives clock by clock — late', 12, h - 10)
    },
  }
}

function CompassFigure() {
  const [speed, setSpeed] = useState(0.5)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim
      height={320}
      create={() => createCompass(speedRef)}
      caption="Wiggle a magnet at one end: what travels down the row is not a needle and not a substance — it is the redefinition of where each needle wants to rest, arriving point by point, late."
    >
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.05}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}

// ---------------------------------------------------------------------------
// Thin dispatcher — the one place the mode is examined (rule D1).
// ---------------------------------------------------------------------------

export type ConnectionWaveMode = 'pluck' | 'readouts' | 'compass'

const FIGURES: Record<ConnectionWaveMode, () => React.JSX.Element> = {
  pluck: PluckFigure,
  readouts: ReadoutsFigure,
  compass: CompassFigure,
}

export function ConnectionWave({ mode }: { mode: ConnectionWaveMode }) {
  const Figure = FIGURES[mode]
  return <Figure />
}
