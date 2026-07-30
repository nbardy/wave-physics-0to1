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

// Per-era Reynolds numbers (solver eras only). Every solver era injects dye —
// the renderer paints nothing but dye and solids, so an era without dye is a
// blank rectangle with a gray blob in it. (It shipped that way once. Don't.)
//   Navier   — honey world, creeping flow: very low Re, no eddies.
//   Reynolds — moderate Re: steady attached recirculation / mild waver.
//   Prandtl  — highest stable CPU Re: separated wake, unsteady street-ish.
//   yours    — same Re as Prandtl; the difference is what the dye is asked to show.
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
      // Collide with the disc: specular bounce off the circle.
      //
      // BUG (fixed 2026-07): this scale factor was (NX / NY) = 1.65 instead of
      // (NY / NX) = 0.606, which made the COLLISION ellipse 2.7× shorter than the
      // DRAWN one — half-extent R·NY/NX² = 0.032 against a drawn R/NY = 0.0875 —
      // so corpuscles streamed straight through the visible gray disc in the one
      // era whose entire point is that nothing goes around it. Reasoning, so it
      // stays fixed: positions here are normalized (x/w, y/h). One y-unit spans
      // NY cells, one x-unit spans NX cells, so converting a y-offset into
      // x-normalized units multiplies by NY/NX. In that isotropic space the disc
      // is a circle of radius rNorm = R/NX, and dy_norm at the boundary is
      // rNorm·(NX/NY) = R/NY — exactly the ellipse radius used by draw() below.
      const dx = nx - cx
      const dy = (ny - cy) * (NY / NX)
      const dist = Math.hypot(dx, dy)
      if (dist < rNorm && p.vx > 0) {
        const nnx = dx / dist
        const nny = dy / dist
        // Reflect in that same isotropic space: carry vy in, carry it back out.
        // (The old code applied only the outbound half of this transform, which
        // was the other half of the same aspect-ratio confusion.)
        const vy = p.vy * (NY / NX)
        const dot = p.vx * nnx + vy * nny
        p.vx -= 2 * dot * nnx
        p.vy = (vy - 2 * dot * nny) * (NX / NY)
        // Land the corpuscle ON the surface instead of leaving it where it was.
        // Reflection is an involution, so a particle left INSIDE with vx still
        // positive reflects, reflects back, and never moves again — it parks on
        // the disc forever. (Visible once the collision ellipse was widened to
        // match the drawn one: two dots sat on the gray disc.) Placing it at the
        // contact point makes the next dist test read exactly rNorm, so there is
        // no second collision and no fixed point to get caught in.
        p.x = cx + nnx * rNorm
        p.y = cy + nny * rNorm * (NX / NY)
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

// The full-channel solver eras (Navier / Reynolds / yours) share one builder: a
// FluidSolver at the era's Re, fed by the eight-row lesson-01 dye stripe. The Re
// is the whole difference — honey ooze at 4, attached recirculation at 45, a
// shedding street at 140 — and the stripe is what makes that difference visible.
// PRE-ROLL (reader pass, 2026-07-29): a solver era starts from still, empty
// water, and dye needs NX/INFLOW ≈ 6.5 s to cross the channel — so without a
// warmup, every slider move showed a gray blob in an empty pane for seconds and
// a reader reasonably concluded the era was broken. Same cure as the lesson-01
// hero (WingFlow's 480-step pre-roll): run the era to a developed state inside
// create(), so the FIRST painted frame is already flowing. ~300 steps ≈ 7.5 s
// of sim time, a one-off ~100–200 ms cost on era switch.
const PREROLL_STEPS = 300

function createStripeEra(re: number): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscForRe(re))
  solver.addDisc(DISC_CX, DISC_CY, DISC_R)
  const renderer = new SolverRenderer(solver)
  for (let n = 0; n < PREROLL_STEPS; n++) {
    solver.injectDyeStripe(DYE_ROWS, 1)
    solver.step(FIXED_DT)
  }
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.injectDyeStripe(DYE_ROWS, 1)
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

// 1904 · Prandtl — the sliver, and the meter it unstuck. Same Re as `yours`, so
// the physics is identical; the READING is what differs. Two tight dye bands
// straddle the disc's shoulders instead of the eight-row full-channel stripe, so
// what you watch is the thin layer pinned against the wall and the station where
// it lets go — not the whole channel. Underneath it runs the instrument
// d'Alembert's paradox was missing: a wake-survey drag coefficient, which reads
// clearly nonzero where the 1757 pane's would read zero.
const PRANDTL_WALL_ROWS = [
  DISC_CY - DISC_R - 1,
  DISC_CY - DISC_R + 1,
  DISC_CY - 3,
  DISC_CY + 3,
  DISC_CY + DISC_R - 1,
  DISC_CY + DISC_R + 1,
]

// Prandtl's own instrument: ∫u(U−u)dy across a station downstream is the momentum
// the body stole from the stream. Divide by ½U²D for a drag coefficient. This is
// measured off THIS 132×80 grid with a staircased disc in a 17%-blocked channel,
// so it is a reading of the pane, not a wind-tunnel number — the label says so.
const WAKE_STATION = Math.min(NX - 3, DISC_CX + 6 * DISC_R)
function wakeDrag(solver: FluidSolver): number {
  let deficit = 0
  for (let j = 1; j < NY - 1; j++) {
    const u = solver.u[solver.idx(WAKE_STATION, j)]
    deficit += u * (INFLOW - u)
  }
  return deficit / (0.5 * INFLOW * INFLOW * DISC_R * 2)
}

function createPrandtl(): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscForRe(RE_PRANDTL))
  solver.addDisc(DISC_CX, DISC_CY, DISC_R)
  const renderer = new SolverRenderer(solver)
  let cd = 0 // EMA — the wake sheds, so the raw reading jitters
  for (let n = 0; n < PREROLL_STEPS; n++) {
    solver.injectDyeStripe(PRANDTL_WALL_ROWS, 1)
    solver.step(FIXED_DT)
    cd += (wakeDrag(solver) - cd) * 0.05
  }
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.injectDyeStripe(PRANDTL_WALL_ROWS, 1)
        solver.step(FIXED_DT)
        cd += (wakeDrag(solver) - cd) * 0.05
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
      const sx = (WAKE_STATION / NX) * w
      ctx.save()
      ctx.strokeStyle = 'rgba(120,113,108,0.5)'
      ctx.setLineDash([4, 5])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = SEPIA
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(`wake survey · C_d ≈ ${cd.toFixed(2)}`, 10, h - 10)
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
      return createStripeEra(RE_NAVIER) // honey world: dye oozes, no eddies
    case 'reynolds':
      return createStripeEra(RE_REYNOLDS) // moderate Re: attached pair / mild waver
    case 'prandtl':
      return createPrandtl() // the sliver at the wall + the drag meter
    case 'yours':
      return createStripeEra(RE_YOURS) // same Re, the lesson-01 eight-row street
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
