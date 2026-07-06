import { useMemo, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { potentialVelocity } from './lib/potential'
import { PALETTE } from './lib/palette'
import { TeX } from '../components/TeX'

// ─────────────────────────────────────────────────────────────────────────────
// THE HERO — "two centuries in one slider."
//
// IOU: this same component appears twice in the article. At the top it is the
// unexplained HOOK — a mysterious scrubber the reader can drag but not yet
// decode. At the bottom it is the FINALE — the same scrubber, now readable,
// because the term strip below it has spelled out what each era contributed to
// the momentum equation. Both uses are THIS ONE component. Behaviour is
// identical in both places, so no `variant` prop is needed — the placement in
// the article is the only difference. (We keep it simple per the brief: identical
// behaviour is fine and simpler, so that is what we chose.)
//
// The scene is the same channel-with-obstacle composition as CylinderFlow,
// rendered by whichever THEORY the selected year implies. Era selection is a
// discriminated union with ONE clean handler per era, dispatched exhaustively —
// no default branch. Switching eras rebuilds the scene state cleanly; Reset
// re-runs create(), which rebuilds the CURRENT era fresh.
//
// Perf: exactly one era's state exists at a time (the stepper is rebuilt when
// the year changes). The FluidSolver grid is modest (cribbed from CylinderFlow)
// so everything holds 60fps on a laptop.
// ─────────────────────────────────────────────────────────────────────────────

// ── the six eras, as a discriminated union ──────────────────────────────────
type EraKind = 'newton' | 'euler' | 'navier' | 'reynolds' | 'prandtl' | 'yours'

interface EraDef {
  year: number
  kind: EraKind
  name: string
}

// index order = scrubber snap-stop order
const ERAS: EraDef[] = [
  { year: 1687, kind: 'newton', name: 'Newton' },
  { year: 1757, kind: 'euler', name: 'Euler / d’Alembert' },
  { year: 1822, kind: 'navier', name: 'Navier' },
  { year: 1883, kind: 'reynolds', name: 'Reynolds' },
  { year: 1904, kind: 'prandtl', name: 'Prandtl' },
  { year: 1999, kind: 'yours', name: 'your solver' },
]

// ── shared scene geometry (crib CylinderFlow proportions) ────────────────────
const NX = 132
const NY = 80
const INFLOW = 24 // cells/s
const DISC_R = 7 // D = 14
const DISC_CX = Math.round(NX * 0.28)
const DISC_CY = Math.round(NY * 0.5) + 1
const FIXED_DT = 1 / 40
const DYE_ROWS = [10, 18, 26, 34, 44, 54, 62, 70]

// Re → ν for the solver eras: Re = U·D/ν, U and D fixed. Each era below picks a
// Re; ν falls out. The CPU solver stays stable because semi-Lagrangian advect is
// unconditionally stable and diffusion is implicit (stable for any ν·dt) — the
// same reasoning CylinderFlow inherits.
const viscForRe = (re: number) => (INFLOW * DISC_R * 2) / re

// Per-era Reynolds numbers (solver eras only):
//   Navier   — honey world, creeping flow: very low Re, no eddies.
//   Reynolds — moderate Re: steady attached recirculation / mild waver.
//   Prandtl  — highest stable CPU Re: separated wake, unsteady street-ish.
//   yours    — same as Prandtl, but with dye injection on (lesson-01 look).
const RE_NAVIER = 4
const RE_REYNOLDS = 45
const RE_PRANDTL = 140
const RE_YOURS = 140

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

// ─────────────────────────────────────────────────────────────────────────────
// ERA HANDLERS — one clean path each. A handler builds a fresh Stepper for its
// theory. No handler asks "which era am I?" — the dispatcher already knows.
// ─────────────────────────────────────────────────────────────────────────────

// 1687 · Newton — corpuscle hail. ~120 independent particles stream from the
// left, bounce specularly off the disc's front face, leave an empty shadow
// wedge behind it, and make no wake. Self-contained (~40 lines); does NOT import
// the sibling CorpuscleHail.tsx.
function createNewton(): Stepper {
  const seed = (Math.random() * 2 ** 32) >>> 0
  const rand = mulberry32(seed)
  const N = 120
  const cx = DISC_CX / NX
  const cy = DISC_CY / NY
  const rNorm = DISC_R / NX // disc radius in x-normalized units (aspect handled at draw)

  interface P {
    x: number
    y: number
    vx: number
    vy: number
  }
  const parts: P[] = []
  const spawn = (p: P) => {
    p.x = -rand() * 0.1
    p.y = rand()
    p.vx = 0.35 + rand() * 0.05
    p.vy = 0
  }
  for (let i = 0; i < N; i++) {
    const p: P = { x: 0, y: 0, vx: 0, vy: 0 }
    spawn(p)
    p.x = rand() // stagger initial positions across the channel
    parts.push(p)
  }

  let acc = 0
  const advance = () => {
    for (const p of parts) {
      const nx = p.x + p.vx * FIXED_DT
      const ny = p.y + p.vy * FIXED_DT
      // collide with the disc front face: specular bounce off the circle
      const dx = nx - cx
      const dy = (ny - cy) * (NX / NY) // correct for pixel aspect so the disc is round
      const dist = Math.hypot(dx, dy)
      if (dist < rNorm && p.vx > 0) {
        const nnx = dx / dist
        const nny = dy / dist
        const dot = p.vx * nnx + p.vy * nny
        p.vx -= 2 * dot * nnx
        p.vy -= 2 * dot * nny * (NY / NX)
      } else {
        p.x = nx
        p.y = ny
      }
      if (p.x > 1.1 || p.y < -0.1 || p.y > 1.1) spawn(p)
    }
  }
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 4) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, w, h)
      // the disc
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.ellipse((DISC_CX / NX) * w, (DISC_CY / NY) * h, (DISC_R / NX) * w, (DISC_R / NY) * h, 0, 0, Math.PI * 2)
      ctx.fill()
      // corpuscles
      ctx.fillStyle = PALETTE.dye
      for (const p of parts) {
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

// 1757 · Euler / d'Alembert — ideal flow. Amber markers advected by the analytic
// potentialVelocity field; fore-aft symmetric, no wake. Trails show the smooth
// streamlines wrapping the disc and closing behind it.
function createEuler(): Stepper {
  const seed = (Math.random() * 2 ** 32) >>> 0
  const rand = mulberry32(seed)
  const cx = DISC_CX
  const cy = DISC_CY
  const N = 260
  interface M {
    x: number
    y: number
    trail: number[]
  }
  const marks: M[] = []
  const spawn = (m: M) => {
    m.x = rand() * 2
    m.y = rand() * (NY - 2) + 1
    m.trail = []
  }
  for (let i = 0; i < N; i++) {
    const m: M = { x: 0, y: 0, trail: [] }
    spawn(m)
    m.x = rand() * NX
    marks.push(m)
  }
  let acc = 0
  const advance = () => {
    for (const m of marks) {
      const v = potentialVelocity(m.x, m.y, cx, cy, DISC_R, INFLOW)
      m.x += v.x * FIXED_DT
      m.y += v.y * FIXED_DT
      m.trail.push(m.x, m.y)
      if (m.trail.length > 16) m.trail.splice(0, 2)
      const inDisc = (m.x - cx) ** 2 + (m.y - cy) ** 2 < DISC_R * DISC_R
      if (m.x > NX - 1 || inDisc || m.y < 1 || m.y > NY - 1) spawn(m)
    }
  }
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 4) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, w, h)
      const sx = w / NX
      const sy = h / NY
      ctx.strokeStyle = 'rgba(217,119,6,0.35)'
      ctx.lineWidth = 1
      for (const m of marks) {
        if (m.trail.length < 4) continue
        ctx.beginPath()
        ctx.moveTo(m.trail[0] * sx, m.trail[1] * sy)
        for (let t = 2; t < m.trail.length; t += 2) ctx.lineTo(m.trail[t] * sx, m.trail[t + 1] * sy)
        ctx.stroke()
      }
      ctx.fillStyle = PALETTE.dye
      for (const m of marks) {
        ctx.beginPath()
        ctx.arc(m.x * sx, m.y * sy, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      // the disc
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.ellipse(cx * sx, cy * sy, DISC_R * sx, DISC_R * sy, 0, 0, Math.PI * 2)
      ctx.fill()
    },
  }
}

// The three solver eras (Navier / Reynolds / Prandtl / yours) share one builder:
// a FluidSolver at the era's Re, with dye either off (markers ooze) or on.
function createSolverEra(re: number, dyeOn: boolean): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscForRe(re))
  solver.addDisc(DISC_CX, DISC_CY, DISC_R)
  const renderer = new SolverRenderer(solver)
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        if (dyeOn) solver.injectDyeStripe(DYE_ROWS, 1)
        solver.step(FIXED_DT)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
    },
  }
}

// ── the thin dispatcher: kind → handler, exhaustive, no default ──────────────
function createEra(kind: EraKind): Stepper {
  switch (kind) {
    case 'newton':
      return createNewton()
    case 'euler':
      return createEuler()
    case 'navier':
      return createSolverEra(RE_NAVIER, false) // honey world: markers/dye ooze, no eddies
    case 'reynolds':
      return createSolverEra(RE_REYNOLDS, false) // moderate Re: attached pair / mild waver
    case 'prandtl':
      return createSolverEra(RE_PRANDTL, false) // highest stable Re: separated wake
    case 'yours':
      return createSolverEra(RE_YOURS, true) // same as Prandtl + dye on (lesson-01 look)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE TERM STRIP — the momentum equation assembling with birthdays. Each piece
// is colored by PALETTE and carries a sepia nameplate that FILLS IN as the year
// passes it; before its birth-year the TeX renders muted-gray and the nameplate
// is an em-dash.
// ─────────────────────────────────────────────────────────────────────────────
interface Term {
  tex: string
  color: string
  who: string
  bornYear: number
}
const TERMS: Term[] = [
  { tex: '\\frac{\\partial u}{\\partial t}', color: PALETTE.vel, who: 'Euler', bornYear: 1757 },
  { tex: '+\\,(u\\cdot\\nabla)u', color: PALETTE.dye, who: 'Euler', bornYear: 1757 },
  { tex: '=\\,-\\frac{\\nabla p}{\\rho}', color: PALETTE.pHi, who: 'Euler', bornYear: 1757 },
  { tex: '+\\,\\nu\\nabla^2 u', color: PALETTE.visc, who: 'Navier', bornYear: 1822 },
  { tex: '\\text{with}\\;\\nabla\\cdot u = 0', color: PALETTE.div, who: 'Euler', bornYear: 1757 },
]

const SEPIA = '#78716c' // lesson-03 palette contract: history furniture
const MUTED = '#c9c5be' // very muted gray for not-yet-born TeX pieces

function TermStrip({ year }: { year: number }) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: '0.75rem 1rem',
          fontSize: '1.05rem',
        }}
      >
        {TERMS.map((term, i) => {
          const born = year >= term.bornYear
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ color: born ? term.color : MUTED }}>
                <TeX>{term.tex}</TeX>
              </span>
              <span style={{ color: SEPIA, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
                {born ? `${term.who} · ${term.bornYear}` : '—'}
              </span>
            </div>
          )
        })}
        {/* the final plate — no TeX, always present,永 unfilled */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ color: SEPIA, fontSize: '0.9rem' }}>smoothness</span>
          <span style={{ color: SEPIA, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
            open (2000–)
          </span>
        </div>
      </div>
      {year >= 1999 && (
        <div style={{ color: SEPIA, fontSize: '0.7rem', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace' }}>
          advection · Stam 1999 — projection · Chorin 1968 — grid · Harlow &amp; Welch 1965
        </div>
      )}
    </div>
  )
}

export function TimelineHero({ height = 300 }: { height?: number }) {
  // ONE knob: a discrete year scrubber. The slider steps over ERA INDICES so
  // touch users land exactly on an era (no in-between years).
  const [idx, setIdx] = useState(0)
  const era = ERAS[idx]

  // The stepper is rebuilt whenever the era changes: only one era's state exists
  // at a time. Keying <Sim> by kind forces create() to re-run on era switch, and
  // Reset re-runs create() for the CURRENT era.
  const create = useMemo(() => () => createEra(era.kind), [era.kind])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{ color: SEPIA, fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {era.year}
        </span>
        <span style={{ color: SEPIA, fontSize: '0.95rem' }}>{era.name}</span>
      </div>
      <Sim key={era.kind} height={height} create={create}>
        <label className="sim-slider">
          <span>1687</span>
          <input
            type="range"
            min={0}
            max={ERAS.length - 1}
            step={1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
          />
          <span>1999</span>
        </label>
      </Sim>
      <TermStrip year={era.year} />
    </div>
  )
}
