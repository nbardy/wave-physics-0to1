import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Stokes drag, 1851 — a two-lane race between steel spheres in cold honey.
//
// WHY A RACE AND NOT ONE BALL. One sphere falling alone makes v_t ∝ R² invisible:
// eyes judge relative motion, not absolute speed, so shrinking a lone ball just
// looks like "smaller ball, roughly the same fall." Two spheres released on the
// same line, with the LEFT one pinned at R_BIG forever, turns the exponent into a
// gap you can measure with a finger. Fixing the reference is load-bearing: the
// leader's terminal speed never changes, so the race always takes the same 1.96 s
// (no slider-dependent playback rate), and the challenger's final depth is exactly
// 1/k² of the column at EVERY slider position — a hand-check at every setting.
//
// THE PHYSICS (exact, no fitting). Linear drag, m·v̇ = m'g − 6πμR·v, has the
// closed-form solution v(t) = v_t + (v0 − v_t)·exp(−t/τ), stepped here as
//   v ← v_t + (v − v_t)·exp(−dt/τ)
//   v_t = 2(ρs − ρf) g R² / (9μ)        →  v_t ∝ R²
//   τ   = m/(6πμR) = 2 ρs R² / (9μ)     →  τ   ∝ R²
// With the SI constants below, v_t(R) = 556.34·R² m/s, so v_t(8 mm) = 35.6 mm/s
// and τ(8 mm) = 4.44 ms. Fall height H = 244 px = 69.7 mm → race = 1.96 s.
//
// STABILITY — why the exponential update is not a shortcut here. dt/τ = 0.94 for
// the 8 mm sphere: forward Euler on the same step would sit right at the edge of
// oscillation (it flips sign at dt/τ = 2). For the quarter-size sphere τ = 0.28 ms,
// so dt/τ = 15 and forward Euler diverges outright — the ball would fling itself
// off the canvas. The exact exponential update is unconditionally stable for any
// dt, and it is the ONLY scheme in reach that survives the small ball. That is the
// whole reason the slider can go to ¼ size at all.
//
// WHAT IS HONEST HERE, AND WHAT IS NOT:
//
// • TWO SEPARATE COLUMNS, because we do not solve sphere–sphere coupling. Stokes
//   flow is long-ranged (the disturbance decays like 1/r, not 1/r³), so two spheres
//   sharing one column would not fall independently: a trailing sphere sits in the
//   leader's downward wake and falls FASTER than it would alone — the two draw
//   together and settle as a pair. That is exactly why dilute suspensions form
//   doublets and why sedimentation in a real cylinder is not a sum of single-ball
//   solutions. Putting the racers in separate columns is a confession, not a
//   staging convenience: it declares "each of these is a one-body solution."
//   Direction of the bias if they shared a column: the challenger would gain, so
//   the measured gap would come out SMALLER than k².
//
// • UNBOUNDED-FLUID LAW, NO WALL CORRECTION — and therefore NO VESSEL WALLS DRAWN.
//   Each column is a tinted panel that fades to transparent at its edges and bleeds
//   off the top and bottom of the frame: a column of honey, not a jar. Drawn side
//   walls a few radii out would contradict the law we are integrating — Faxén's
//   wall correction at ~2.5 radii of clearance is tens of percent, and it would
//   slow the BIG ball more than the small one, pulling the observed ratio below k².
//   No wall is drawn because no wall is in the equation.
//
// • REYNOLDS NUMBER. Re = ρ_f·v_t·2R/μ = 1420·0.0356·0.016/25 = 3.2×10⁻². Creeping
//   flow with three orders of margin, so Stokes' law is being used inside its own
//   regime, not extrapolated out of it. (An earlier draft of this figure quoted
//   3.2×10⁻⁵; that was an arithmetic slip of 10³ — the number above is the one the
//   constants actually produce.)
//
// • THE TRANSIENT IS NOT SLOWED DOWN, AND UNIFORM STROBE SPACING IS THE PAYLOAD.
//   τ = 4.4 ms means terminal velocity is reached inside the first 0.16 mm of a
//   69.7 mm column — 0.23% of the fall. So every strobe gap is equal from the very
//   first stamp, and that equality is the visible signature of "drag has already
//   caught weight." We deliberately do NOT stretch the transient to animate it:
//   faking a visible acceleration phase would be inventing a physical régime the
//   equation does not have at this scale.
//
// • THE GREEN FLOW-PAST STREAKS ARE DISPLAY ONLY — decorative creeping-flow hints,
//   not a solved field. Their lateral offset scales with R so the bigger ball
//   visibly disturbs a wider swath, which is true of the real Stokeslet; the curve
//   shapes are not.
//
// THE WHY GAUGE (the part a reader asked for). Above the columns, two bars per
// sphere: weight ∝ R³ (grey, the steel) and resistance 6πμR ∝ R (green, the μ term,
// same green as the flow streaks so the viscosity story is one colour throughout).
// At k = 2 the challenger keeps ⅛ of the weight but ½ of the drag — it gives up
// seven-eighths of its weight to keep half its resistance, and that mismatch IS the
// division R³/R¹ = R². The exponent stops being a claim and becomes two bar lengths.

const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const G = 9.81 // m/s²
const MU = 25 // Pa·s — cold, thick honey
const RHO_S = 7800 // kg/m³ — steel
const RHO_F = 1420 // kg/m³ — honey
const R_BIG = 8e-3 // m — the fixed reference sphere; never moves with the slider
const PX_PER_M = 3500 // display scale
const STROBE_STEPS = 60 // 0.25 s between strobe stamps
const HOLD_STEPS = 420 // 1.75 s frozen tableau at the finish, then restage

const SEPIA = '#78716c' // history furniture (lesson-03 palette addition): readouts, gridline labels

// --- layout (canvas height 360) -------------------------------------------
const GAUGE_TOP = 8 // y 8–46: the two-bar "why" gauge per column
const RELEASE_Y = 56 // solid release line, both columns
const FLOOR_Y = 300 // solid floor line
const H_PX = FLOOR_Y - RELEASE_Y // 244 px of fall
const H_M = H_PX / PX_PER_M // 0.06971 m = 69.7 mm
const GUTTER = 28 // px between the two columns; depth labels live here
const READOUT_Y = 310 // y 310–352: symbolic meter strip

function terminalV(R: number): number {
  return (2 * (RHO_S - RHO_F) * G * R * R) / (9 * MU)
}
function tau(R: number): number {
  return (2 * RHO_S * R * R) / (9 * MU)
}

interface Racer {
  R: number // sphere radius, m
  depth: number // m fallen below the release line
  v: number // m/s, live (this is the printed reading — no round-trip through Δy/Δt)
  stamps: number[] // strobe depths, m
}

// The race is a two-state machine. Encoding it as a sum type keeps the finish
// condition out of draw() — draw() reads state and never mutates it.
type Phase = { kind: 'running' } | { kind: 'held'; stepsLeft: number }

function createRace(ratioRef: { current: number }): Stepper {
  const racers: Racer[] = [
    { R: R_BIG, depth: 0, v: 0, stamps: [] },
    { R: R_BIG, depth: 0, v: 0, stamps: [] },
  ]
  let stagedRatio = 0 // overwritten by the stage() call below, before the first draw
  let stepIndex = 0
  let phase: Phase = { kind: 'running' }

  // Restage: both spheres back on the line, both trails cleared, clock to zero.
  const stage = (ratio: number) => {
    stagedRatio = ratio
    racers[0].R = R_BIG // the reference never changes — that is the whole design
    racers[1].R = R_BIG / ratio
    for (const r of racers) {
      r.depth = 0
      r.v = 0
      r.stamps.length = 0
    }
    stepIndex = 0
  }

  const integrate = (r: Racer) => {
    const vt = terminalV(r.R)
    // analytic linear-drag update: the exact solution, unconditionally stable
    r.v = vt + (r.v - vt) * Math.exp(-FIXED_DT / tau(r.R))
    r.depth += r.v * FIXED_DT
  }

  // --- one handler per phase, each a single semantic path -------------------
  const runRunning = (): Phase => {
    stepIndex++
    for (const r of racers) integrate(r)
    // Both racers are stamped on the SAME step index, so simultaneity of the
    // strobe is true by construction rather than by eyeballing two timers.
    if (stepIndex % STROBE_STEPS === 0) for (const r of racers) r.stamps.push(r.depth)
    // racers[0] is always the leader (fixed at R_BIG, always the largest), so the
    // finish test needs no "who won" branch.
    if (racers[0].depth < H_M) return { kind: 'running' }
    return { kind: 'held', stepsLeft: HOLD_STEPS }
  }

  const runHeld = (held: { kind: 'held'; stepsLeft: number }): Phase => {
    const left = held.stepsLeft - 1
    if (left > 0) return { kind: 'held', stepsLeft: left }
    stage(stagedRatio)
    return { kind: 'running' }
  }

  // --- thin dispatcher ------------------------------------------------------
  const advance = () => {
    // Knob changes restage here, in advance() — never in draw().
    if (ratioRef.current !== stagedRatio) {
      stage(ratioRef.current)
      phase = { kind: 'running' }
      return
    }
    switch (phase.kind) {
      case 'running':
        phase = runRunning()
        return
      case 'held':
        phase = runHeld(phase)
        return
    }
  }

  // Stage once at construction so the very first draw() already shows the staged
  // radii — a paused figure must never render a frame the physics never held.
  stage(ratioRef.current)

  let acc = 0

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

      const colW = Math.max(120, Math.min(210, (w - 72) / 2))
      const blockW = 2 * colW + GUTTER
      const x0 = Math.round((w - blockW) / 2)
      const colX = (i: number) => x0 + i * (colW + GUTTER)
      const colCx = (i: number) => colX(i) + colW / 2
      const BAR_MAX = Math.min(86, colW - 12)
      const yOf = (depth: number) => RELEASE_Y + depth * PX_PER_M

      // --- honey columns: tinted panels, no jars ----------------------------
      // Horizontal gradient to transparent at each edge, full canvas height, so
      // there is nothing anywhere that could be read as a vessel wall.
      for (let i = 0; i < 2; i++) {
        const g = ctx.createLinearGradient(colX(i), 0, colX(i) + colW, 0)
        g.addColorStop(0, 'rgba(217,119,6,0)')
        g.addColorStop(0.14, 'rgba(217,119,6,0.06)')
        g.addColorStop(0.86, 'rgba(217,119,6,0.06)')
        g.addColorStop(1, 'rgba(217,119,6,0)')
        ctx.fillStyle = g
        ctx.fillRect(colX(i), 0, colW, h)
      }

      // --- the "why" gauge: weight ∝ R³ vs resistance 6πμR ∝ R --------------
      // Left block carries the labels; the right block is a pure translate.
      const bars = [
        { label: 'weight ∝ R³', power: 3, color: PALETTE.wall, y: GAUGE_TOP + 11 },
        { label: '6πμR ∝ R', power: 1, color: PALETTE.visc, y: GAUGE_TOP + 32 },
      ]
      for (let i = 0; i < 2; i++) {
        const ratio = racers[i].R / R_BIG
        for (const bar of bars) {
          ctx.fillStyle = 'rgba(107,114,128,0.13)'
          ctx.fillRect(colX(i), bar.y, BAR_MAX, 6) // full-length track = the reference
          ctx.fillStyle = bar.color
          ctx.fillRect(colX(i), bar.y, BAR_MAX * Math.pow(ratio, bar.power), 6)
        }
      }
      ctx.fillStyle = SEPIA
      ctx.font = '600 9px ui-sans-serif, system-ui'
      for (const bar of bars) ctx.fillText(bar.label, colX(0), bar.y - 3)

      // --- shared rules spanning both columns -------------------------------
      ctx.strokeStyle = 'rgba(120,113,108,0.55)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x0 - 6, RELEASE_Y)
      ctx.lineTo(x0 + blockW + 6, RELEASE_Y)
      ctx.moveTo(x0 - 6, FLOOR_Y)
      ctx.lineTo(x0 + blockW + 6, FLOOR_Y)
      ctx.stroke()

      // dashed depth gridlines, labelled in the gutter
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(120,113,108,0.35)'
      ctx.fillStyle = SEPIA
      ctx.font = '600 10px ui-sans-serif, system-ui'
      ctx.textAlign = 'center'
      const fractions: [number, string][] = [
        [0.25, '¼'],
        [0.5, '½'],
        [0.75, '¾'],
      ]
      for (const [f, label] of fractions) {
        const gy = RELEASE_Y + f * H_PX
        ctx.beginPath()
        ctx.moveTo(x0, gy)
        ctx.lineTo(x0 + blockW, gy)
        ctx.stroke()
        ctx.fillText(label, x0 + colW + GUTTER / 2, gy + 3.5)
      }
      ctx.setLineDash([])
      ctx.textAlign = 'left'

      // --- strobe stamps: speed rendered as spacing -------------------------
      // Big ball: evenly spaced rungs down the column. Quarter-size ball: a smear
      // of rings near the release line. Same clock, same step indices, both lanes.
      for (let i = 0; i < 2; i++) {
        const rpx = racers[i].R * PX_PER_M
        const cx = colCx(i)
        const tickX = i === 0 ? x0 - 12 : x0 + blockW + 4
        ctx.strokeStyle = 'rgba(107,114,128,0.45)'
        ctx.lineWidth = 1
        for (const d of racers[i].stamps) {
          const sy = yOf(d)
          ctx.beginPath()
          ctx.arc(cx, sy, rpx, 0, Math.PI * 2)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(tickX, sy)
          ctx.lineTo(tickX + 8, sy)
          ctx.stroke()
        }
      }

      // --- the spheres, plus display-only flow streaks ----------------------
      for (let i = 0; i < 2; i++) {
        const rpx = racers[i].R * PX_PER_M
        const cx = colCx(i)
        const cy = yOf(racers[i].depth)

        // creeping-flow hints: lateral offset ∝ R, so the bigger ball drags a
        // visibly wider swath of honey with it. Decoration, not a solved field.
        ctx.strokeStyle = 'rgba(5,150,105,0.35)'
        ctx.lineWidth = 1
        for (let s = -2; s <= 2; s++) {
          if (s === 0) continue
          const off = s * rpx * 0.9
          ctx.beginPath()
          ctx.moveTo(cx + off, cy - rpx - 18)
          ctx.quadraticCurveTo(cx + off * 0.55, cy, cx + off, cy + rpx + 18)
          ctx.stroke()
        }

        ctx.fillStyle = PALETTE.wall
        ctx.beginPath()
        ctx.arc(cx, cy, rpx, 0, Math.PI * 2)
        ctx.fill()
      }

      // --- readout strip: symbolic meter readings ---------------------------
      // Every number below is computed live — radii from the racers, speeds from
      // the live v (which equals terminalV(R) to 0.2% after the first 4.4 ms),
      // and the ratio line from terminalV() of each ball. Nothing is hardcoded.
      ctx.fillStyle = SEPIA
      ctx.font = '600 11px ui-monospace, monospace'
      for (let i = 0; i < 2; i++) {
        const mm = racers[i].R * 1000
        const vmm = racers[i].v * 1000
        ctx.fillText(`R ${mm.toFixed(1)} mm   v ${vmm.toFixed(1)} mm/s`, colX(i), READOUT_Y + 16)
      }
      const sizeRatio = R_BIG / racers[1].R
      const speedRatio = terminalV(R_BIG) / terminalV(racers[1].R)
      ctx.textAlign = 'center'
      ctx.fillText(
        `size ×${sizeRatio.toFixed(1)} → speed ×${speedRatio.toFixed(1)}`,
        x0 + blockW / 2,
        READOUT_Y + 38,
      )
      ctx.textAlign = 'left'
    },
  }
}

export function FallingSphere() {
  // One knob, and it only shrinks the RIGHT sphere. k = R_BIG / R_small.
  const [k, setK] = useState(2)
  const ratioRef = useRef(k)
  ratioRef.current = k

  return (
    <Sim height={360} create={() => createRace(ratioRef)}>
      <label className="sim-slider">
        <span>same size</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.25}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
        />
        <span>¼ size</span>
      </label>
    </Sim>
  )
}
