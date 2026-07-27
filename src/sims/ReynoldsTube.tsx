import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// ─────────────────────────────────────────────────────────────────────────────
// HONESTY CONFESSION (mandatory, per the article's prose):
//   This is Osborne Reynolds's 1883 dye-filament experiment recreated as a
//   PHENOMENOLOGICAL CARTOON, *not* a Navier–Stokes solve. The base flow is the
//   exact laminar Poiseuille profile, but the transition to turbulence is faked
//   by a linear-instability toy: a handful of seeded travelling sine modes whose
//   amplitudes grow or decay at an invented rate σ. The mode shapes, the
//   saturation cap and the critical number Re_c = 2000 are all chosen to LOOK
//   right — straight and glassy below Re_c, erupting into folds above it.
//
//   THE GROWTH LAW IS DELIBERATELY DISCONTINUOUS AT Re_c:
//       σ(Re) = +(SIGMA_FLOOR + SIGMA_GAIN·(Re−Re_c)/Re_c)   for Re ≥ Re_c
//       σ(Re) = −(SIGMA_FLOOR + SIGMA_GAIN·(Re_c−Re)/Re_c)   for Re <  Re_c
//   The FLOOR is the whole point. A smooth σ ∝ (Re−Re_c) — what this figure used
//   to have — means the eruption takes ~35 s at Re = 2100 and ~18 s at Re = 2200,
//   so a reader easing the slider just past the threshold sees nothing happen and
//   concludes the threshold is somewhere near 4000. The sharpness Reynolds
//   actually reported was then invisible, which inverted the sentence the figure
//   exists to support. With the floor, crossing Re_c saturates the filament in
//   under two seconds at any supercritical Re, and dropping back below it flushes
//   the tube just as fast.
//
//   What is being faked, precisely: the real instability is an eigenvalue problem
//   of the linearised NS operator, whose growth rate vanishes CONTINUOUSLY at
//   criticality; pipe flow's transition is famously subcritical and finite-
//   amplitude besides. A jump discontinuity in σ is not that. It is a cartoon of
//   the OBSERVED sharpness, drawn at the timescale of a reader's hand on a
//   slider. The article confesses this in the surrounding text; the figure must
//   not pretend otherwise.
// ─────────────────────────────────────────────────────────────────────────────

const N_PARTICLES = 400 // chain length of the dye filament
const RE_MIN = 500
const RE_MAX = 6000
const RE_C = 2000 // empirical critical Reynolds number (the invented threshold)
const N_MODES = 4 // seeded travelling sinusoidal perturbation modes
const FIXED_DT = 1 / 120 // fixed physics step, decoupled from RAF cadence

// The perturbation amplitude A obeys dA/dt = σ·A with σ from `regimeOf` below.
// A is capped at A_SAT by construction and floored at A_NOISE, and |σ| is bounded
// by the finite Re range, so A·dt can never exceed a fraction of the tube
// half-height in one step — the advection stays well-behaved without a runtime
// stability guard on the modes.
const SIGMA_FLOOR = 2.3 // |σ| the instant the threshold is crossed (per second)
const SIGMA_GAIN = 2.2 // extra growth rate per Re_c of overshoot
const A_SAT = 1.0 // saturation amplitude in units of tube half-height
const A_NOISE = 0.02 // background noise floor, so a re-crossing can re-excite
const JITTER_THRESHOLD = 0.7 // fraction of A_SAT above which curls get random-walk jitter
const MIXED_REINJECT_S = 6 // guard rail: re-inject after this long fully mixed

// Reynolds's two regimes, as a sum type — the figure's readout, its color, and the
// sign of the growth rate all follow from which side of Re_c we are on. This is
// the ONE place the threshold is decided.
type Regime = { kind: 'direct'; sigma: number } | { kind: 'sinuous'; sigma: number }

const regimeOf = (re: number): Regime =>
  re < RE_C
    ? { kind: 'direct', sigma: -(SIGMA_FLOOR + (SIGMA_GAIN * (RE_C - re)) / RE_C) }
    : { kind: 'sinuous', sigma: SIGMA_FLOOR + (SIGMA_GAIN * (re - RE_C)) / RE_C }

// Reynolds's own words for the two states. Amber is the dye in motion; sepia is
// this lesson's history furniture, and a filament running straight is the quiet one.
const REGIME_STYLE: Record<Regime['kind'], { label: string; color: string }> = {
  direct: { label: 'direct', color: '#78716c' },
  sinuous: { label: 'sinuous', color: PALETTE.dye },
}

// where Re_c sits along the slider track, as a fraction of its span
const RE_C_FRAC = (RE_C - RE_MIN) / (RE_MAX - RE_MIN)

// A deterministic PRNG so Reset genuinely reseeds (mulberry32).
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Mode {
  k: number // wavenumber (radians per unit x)
  c: number // phase speed
  phase: number // seeded initial phase
  shape: number // vertical mode shape exponent (how the mode sits across the tube)
}

interface Particle {
  x: number
  y: number // offset from axis, in units of tube half-height (−1..1 spans the tube)
  jitter: number // accumulated seeded random-walk displacement
}

function createReynolds(reRef: { current: number }): Stepper {
  // fresh seed per create() → Reset reseeds the modes and the jitter walk
  const seed = (Math.random() * 2 ** 32) >>> 0
  const rand = mulberry32(seed)

  const modes: Mode[] = []
  for (let m = 0; m < N_MODES; m++) {
    modes.push({
      k: 6 + rand() * 10, // a few wavelengths across the tube
      c: 0.4 + rand() * 0.4, // travel downstream slower than the centreline
      phase: rand() * Math.PI * 2,
      shape: 1 + Math.floor(rand() * 2), // sin(shape·π·(y+1)/2): pinned at the walls
    })
  }

  let amp = A_NOISE // current perturbation amplitude A (starts tiny)
  let t = 0
  let mixedFor = 0 // seconds the filament has been continuously "fully mixed"
  let acc = 0 // fixed-DT accumulator (persists across step calls via closure)

  const particles: Particle[] = []
  const seedFilament = () => {
    particles.length = 0
    for (let i = 0; i < N_PARTICLES; i++) {
      particles.push({ x: i / (N_PARTICLES - 1), y: 0, jitter: 0 })
    }
    amp = A_NOISE
    mixedFor = 0
  }
  seedFilament()

  // Poiseuille base profile: u(y) ∝ 1 − y² (parabola, max on the axis).
  const baseU = (y: number) => 1 - y * y

  // vertical perturbation velocity v'(x,y,t) from the seeded travelling modes,
  // scaled by the current amplitude A.
  const perturbV = (x: number, y: number) => {
    let v = 0
    for (const md of modes) {
      const s = Math.sin((md.shape * Math.PI * (y + 1)) / 2)
      v += s * Math.sin(md.k * x - md.c * md.k * t + md.phase)
    }
    return (amp * v) / modes.length
  }

  const advance = () => {
    const re = reRef.current
    t += FIXED_DT

    // amplitude ODE: dA/dt = σ A. Sign and size of σ come from the regime.
    const { sigma } = regimeOf(re)
    amp = Math.min(A_SAT, amp * Math.exp(sigma * FIXED_DT))
    // keep a floor of noise alive so a super-critical run can re-excite after decay
    if (amp < A_NOISE) amp = A_NOISE

    const jittering = amp > JITTER_THRESHOLD * A_SAT
    const uScale = 0.9 // filament march speed along x (normalized tube-length/s)

    let mixedCount = 0
    for (const p of particles) {
      const u = baseU(p.y)
      p.x += uScale * u * FIXED_DT
      p.y += perturbV(p.x, p.y) * FIXED_DT
      if (jittering) {
        // the "mass of curls" regime: seeded random-walk on each particle
        p.jitter += (rand() - 0.5) * (amp - JITTER_THRESHOLD) * 0.06
        p.y += p.jitter * FIXED_DT * 6
      }
      // reflect off the tube walls (|y| ≤ 1); the dye can't leave the glass
      if (p.y > 1) p.y = 2 - p.y
      if (p.y < -1) p.y = -2 - p.y
      // count how "mixed" the tail is: large excursions near the outflow
      if (p.x > 0.6 && Math.abs(p.y) > 0.55) mixedCount++
    }

    // continuous re-injection at the inlet: recycle particles that ran off the end
    for (const p of particles) {
      if (p.x > 1) {
        p.x -= 1
        p.y = 0
        p.jitter = 0
      }
    }

    // ── GUARD RAIL ──────────────────────────────────────────────────────────
    // If the filament has been fully mixed (a large mixed fraction downstream)
    // for more than MIXED_REINJECT_S continuously, gently re-inject a fresh
    // filament WITHOUT touching the flow speed — otherwise the amber turns into
    // permanent uniform haze and the figure loses its dye line forever.
    if (mixedCount > particles.length * 0.5) mixedFor += FIXED_DT
    else mixedFor = 0
    if (mixedFor > MIXED_REINJECT_S) seedFilament()
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
      const cy = h / 2
      const halfH = h * 0.32 // tube half-height in pixels
      const x = (px: number) => px * w
      const y = (py: number) => cy + py * halfH

      // the glass tube: two walls
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, cy - halfH)
      ctx.lineTo(w, cy - halfH)
      ctx.moveTo(0, cy + halfH)
      ctx.lineTo(w, cy + halfH)
      ctx.stroke()

      // faint centreline
      ctx.strokeStyle = 'rgba(120,140,170,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(w, cy)
      ctx.stroke()

      // the amber dye filament as a connected path, sorted by x so folds render
      const sorted = [...particles].sort((a, b) => a.x - b.x)
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 2.4
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      let started = false
      for (const p of sorted) {
        const px = x(p.x)
        const py = y(p.y)
        if (!started) {
          ctx.moveTo(px, py)
          started = true
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()

      // the injector nozzle at the inlet
      ctx.fillStyle = PALETTE.dye
      ctx.beginPath()
      ctx.arc(x(0), cy, 4, 0, Math.PI * 2)
      ctx.fill()

      // sepia Re readout — lesson-03 palette contract: history furniture is
      // sepia '#78716c' (year labels, nameplates, meters) — with the regime name
      // beside it, so the threshold is a thing that VISIBLY flips rather than a
      // constant buried in the source.
      const re = reRef.current
      const style = REGIME_STYLE[regimeOf(re).kind]
      ctx.font = '600 14px ui-monospace, SFMono-Regular, monospace'
      const reText = `Re ≈ ${Math.round(re)}`
      ctx.fillStyle = '#78716c'
      ctx.fillText(reText, 12, h - 14)

      const pillX = 12 + ctx.measureText(reText).width + 12
      ctx.font = '600 12px ui-sans-serif, system-ui'
      const pillW = ctx.measureText(style.label).width + 16
      ctx.fillStyle = style.color
      ctx.globalAlpha = 0.14
      roundRect(ctx, pillX, h - 28, pillW, 19, 9)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = style.color
      ctx.lineWidth = 1
      roundRect(ctx, pillX, h - 28, pillW, 19, 9)
      ctx.stroke()
      ctx.fillStyle = style.color
      ctx.fillText(style.label, pillX + 8, h - 14)

      // the threshold itself, named on the canvas
      ctx.fillStyle = '#78716c'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText(`Re_c ≈ ${RE_C}`, pillX + pillW + 12, h - 14)
    },
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const SEPIA = '#78716c'
// A range input's thumb centre travels between half-a-thumb from each end, so a
// tick at a plain `left: f%` drifts from the value it marks. This is the standard
// correction; THUMB is the browser default width we style against.
const THUMB_PX = 16
const tickLeft = (f: number) => `calc(${f * 100}% + ${(0.5 - f) * THUMB_PX}px)`

export function ReynoldsTube({ height = 260 }: { height?: number }) {
  // ONE knob: flow speed, displayed as Reynolds number.
  const [re, setRe] = useState(1200)
  const reRef = useRef(re)
  reRef.current = re

  return (
    <Sim height={height} create={() => createReynolds(reRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <span style={{ position: 'relative', display: 'inline-flex', flex: 1 }}>
          <input
            type="range"
            min={RE_MIN}
            max={RE_MAX}
            step={10}
            value={re}
            onChange={(e) => setRe(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          {/* the threshold, marked on the track the reader is dragging */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: tickLeft(RE_C_FRAC),
              top: -3,
              height: 20,
              width: 2,
              marginLeft: -1,
              background: SEPIA,
              opacity: 0.75,
              pointerEvents: 'none',
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: tickLeft(RE_C_FRAC),
              top: 18,
              transform: 'translateX(-50%)',
              font: '10px ui-sans-serif, system-ui',
              color: SEPIA,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Re_c ≈ {RE_C}
          </span>
        </span>
        <span>fast</span>
      </label>
    </Sim>
  )
}
