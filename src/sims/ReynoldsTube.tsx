import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// ─────────────────────────────────────────────────────────────────────────────
// HONESTY CONFESSION (mandatory, per the article's prose):
//   This is Osborne Reynolds's 1883 dye-filament experiment recreated as a
//   PHENOMENOLOGICAL CARTOON, *not* a Navier–Stokes solve. The base flow is the
//   exact laminar Poiseuille profile, but the transition to turbulence is faked
//   by a linear-instability toy: a handful of seeded travelling sine modes whose
//   amplitudes grow or decay according to an empirical growth rate σ ∝ (Re−Re_c)
//   with a hand-picked critical number Re_c = 2000. That threshold, the mode
//   shapes, and the saturation cap are all invented to LOOK right — straight and
//   glassy below Re_c, wavering near it, erupting into folds above it. The real
//   instability is a genuine eigenvalue problem of the linearised NS operator;
//   this is a stand-in. The article confesses this in the surrounding text; the
//   figure must not pretend otherwise.
// ─────────────────────────────────────────────────────────────────────────────

const N_PARTICLES = 400 // chain length of the dye filament
const RE_MIN = 500
const RE_MAX = 6000
const RE_C = 2000 // empirical critical Reynolds number (the invented threshold)
const N_MODES = 4 // seeded travelling sinusoidal perturbation modes
const FIXED_DT = 1 / 120 // fixed physics step, decoupled from RAF cadence

// The perturbation amplitude A obeys dA/dt = σ·A, σ = SIGMA_GAIN·(Re−Re_c)/Re_c.
// A is capped at A_SAT by construction, and σ is bounded by the finite Re range,
// so A·dt can never exceed a fraction of the tube half-height in one step — the
// advection stays well-behaved without a runtime stability guard on the modes.
const SIGMA_GAIN = 2.2 // growth-rate scale (per second, at Re = 2·Re_c)
const A_SAT = 1.0 // saturation amplitude in units of tube half-height
const JITTER_THRESHOLD = 0.7 // fraction of A_SAT above which curls get random-walk jitter
const MIXED_REINJECT_S = 6 // guard rail: re-inject after this long fully mixed

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

  let amp = 0.02 // current perturbation amplitude A (starts tiny)
  let t = 0
  let mixedFor = 0 // seconds the filament has been continuously "fully mixed"
  let acc = 0 // fixed-DT accumulator (persists across step calls via closure)

  const particles: Particle[] = []
  const seedFilament = () => {
    particles.length = 0
    for (let i = 0; i < N_PARTICLES; i++) {
      particles.push({ x: i / (N_PARTICLES - 1), y: 0, jitter: 0 })
    }
    amp = 0.02
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

    // amplitude ODE: dA/dt = σ A, σ ∝ (Re − Re_c). Grows above Re_c, decays below.
    const sigma = (SIGMA_GAIN * (re - RE_C)) / RE_C
    amp = Math.min(A_SAT, Math.max(0.0, amp * Math.exp(sigma * FIXED_DT)))
    // keep a floor of noise alive so a super-critical run can re-excite after decay
    if (amp < 0.02) amp = 0.02

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
      // sepia '#78716c' (year labels, nameplates, meters).
      const re = reRef.current
      ctx.fillStyle = '#78716c'
      ctx.font = '600 14px ui-monospace, SFMono-Regular, monospace'
      ctx.fillText(`Re ≈ ${Math.round(re)}`, 12, h - 14)
    },
  }
}

export function ReynoldsTube({ height = 260 }: { height?: number }) {
  // ONE knob: flow speed, displayed as Reynolds number.
  const [re, setRe] = useState(1200)
  const reRef = useRef(re)
  reRef.current = re

  return (
    <Sim height={height} create={() => createReynolds(reRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={RE_MIN}
          max={RE_MAX}
          step={10}
          value={re}
          onChange={(e) => setRe(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}
