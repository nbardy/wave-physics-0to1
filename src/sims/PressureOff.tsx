import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { PALETTE } from './lib/palette'

// Lesson 03 · "Euler's Field" — what the pressure term is actually for.
//
// Two channels STACKED, not side by side. Stacking puts the same x-column of
// both flows on the same vertical line, so the eye differences them for free:
// at any station along the channel you can see what the upper fluid did and
// what the lower one did instead. Side-by-side panes make the reader saccade
// horizontally and re-find the disc each time.
//
//   upper — the full step, pressure included: advect, diffuse, then project
//           (solve ∇²p = ∇·u*, subtract ∇p). The stream parts and goes AROUND.
//   lower — the identical step with the projection removed. Nothing rescues
//           incompressibility, so the fluid goes THROUGH: dye piles into the
//           disc's face, the streaklines fold, and the violet overlay marks
//           every cell that is quietly creating or destroying fluid.
//
// Both solvers come from the same constructor call with the same arguments, so
// they are bit-identical at t=0, and they are stepped in lockstep inside one
// fixed-timestep loop. The ONLY difference between them is `toggles.project`.
// There are no knobs: the figure this replaces reused lesson 01's three-switch
// TermToggle, which let a reader mutate an already-ruined running sim, so the
// clean before/after was never on screen at the same time — and two of its
// three switches named terms this section has not introduced yet.
//
// VISCOSITY HONESTY: Euler's equations have no viscosity at all, and both panes
// here carry a little (Re = 60). That is deliberate. An inviscid upper pane on
// this grid would shed an unsteady wake, and an unsteady upper pane invites the
// wrong reading — "turbulent vs. laminar" — when the figure means "goes around
// vs. goes through". Because the viscosity is IDENTICAL on both sides, it
// cancels out of the comparison: the pressure term remains the only difference
// between the two flows.
//
// STABILITY (AGENTS.md): semi-Lagrangian advection is unconditionally stable
// and diffusion is solved implicitly (Jacobi, stable for any a = ν·dt), so
// neither pane can blow up numerically — the lower pane fails PHYSICALLY, which
// is the whole point. INFLOW·FIXED_DT = 22/40 = 0.55 cells per step keeps the
// backtrace inside a neighbouring cell, which is an ACCURACY choice, not a
// stability one; the scheme would survive a much larger step, just smeared.

// ---------------------------------------------------------------- constants

const INFLOW = 22 // cells/s
const FIXED_DT = 1 / 40
const RE = 60 // ν = U·D/Re, set once per grid below
const GAP = 10 // px between the two panes
const LINGER = 1.1 // s to hold on the wreckage before rebuilding both

// Grid sized so CELLS ARE SQUARE — a disc has to render as a disc. The figure
// this replaces stretched a fixed 128×80 grid across a wide canvas and drew an
// ellipse, which reads as an airfoil-ish blob and quietly changes the physics
// the reader thinks they are looking at. Derive the row count from the PANE's
// pixel aspect; if a short pane leaves too few rows to resolve the disc, raise
// nx and ny TOGETHER (cells stay square) rather than squashing the aspect.
// At the article's 720px column and height 360, a pane is ~700×175 — aspect
// 0.25, which would put ny at 36 and the disc at r=4. NY_MIN=48 lifts that to
// r=6 (D=12 cells, close to CylinderFlow's 14) and pulls nx up to ~192 to keep
// the cells square. ~9.2k cells per pane, two panes; the same order as the CPU
// cylinder's single 144×88.
const NX_TARGET = 144
const NY_MIN = 48

type Grid = { nx: number; ny: number; discR: number; discX: number; discY: number; dyeRows: number[] }

const DYE_STRIPES = 8

function gridFor(paneW: number, paneH: number): Grid {
  const aspect = paneH / paneW
  let nx = NX_TARGET
  let ny = Math.round(nx * aspect)
  if (ny < NY_MIN) {
    ny = NY_MIN
    nx = Math.round(ny / aspect)
  }
  const discR = Math.round(0.13 * ny)
  return {
    nx,
    ny,
    discR,
    discX: Math.round(0.26 * nx),
    // One cell off the vertical centre-line — CylinderFlow's convention. A
    // perfectly symmetric solve sits on an unstable knife-edge; the offset lets
    // the wake pick a side instead of hanging there. At Re 60 the upper wake
    // should still relax to steady and near-symmetric.
    discY: Math.round(0.5 * ny) + 1,
    dyeRows: Array.from({ length: DYE_STRIPES }, (_, s) =>
      Math.round(((s + 0.5) / DYE_STRIPES) * (ny - 2)) + 1,
    ),
  }
}

// THE METER — mean |∇·u| per fluid cell, displayed as "% of its volume per
// second" (div is 1/s on a unit cell, so ×100 is exactly that).
//
// MEASURED LESSON (reader pass, 2026-07-29): the first version reported the
// FRACTION OF CELLS whose |div| cleared a floor — a spread statistic — and it
// read BACKWARDS: the projected pane's 40-sweep Jacobi residual is diffuse
// low-grade noise that tripped the floor in 6.5% of cells, while the broken
// pane's violation, though enormous, is CONCENTRATED in the plume around the
// disc (3.3% of cells). The honest pane out-scored the broken one and the
// number argued against the figure. Magnitude, not spread, is what differs
// between the panes, so the meter now averages |div| itself: the concentrated
// plume dominates the mean, the diffuse residual stays small, and the ordering
// matches what the violet shows.
// MEASURED (2026-07-29, headless audit): the honest pane's steady mean reads
// ~5.5% of a cell's volume per second — that is the 40-sweep Jacobi residual's
// true size, reported rather than rounded away. The first threshold here was
// 0.06, which restarted the broken pane the instant it crossed 6.0% — capping
// the on-screen contrast at 6.0-vs-5.5, two nearly equal numbers. The wreck
// threshold must sit far above the honest baseline or the meter contrast is
// throttled by the restart logic itself.
const WRECK_MEAN = 0.3 // broken pane restarts near ~30% vs the honest ~5.5%
// A hard cap on one demonstration cycle, so the birth of the catastrophe is on
// screen for a reader arriving mid-scroll even if WRECK_MEAN is mistuned. A
// parcel crosses the channel in nx/INFLOW ≈ 9 s, so 12 s is ~1.4 crossings.
const MAX_RUN = 12

const INK = 'rgba(26,31,43,0.75)'
const LABEL_FONT = '600 12px ui-sans-serif, system-ui'

// ------------------------------------------------------------------- panes

type PaneSpec = {
  label: string
  project: boolean
  overlay: 'none' | 'divergence'
  meterColor: string
}

const SPEC_ON: PaneSpec = {
  label: '−∇p/ρ on',
  project: true,
  overlay: 'none',
  meterColor: INK,
}
const SPEC_OFF: PaneSpec = {
  label: '−∇p/ρ off',
  project: false,
  overlay: 'divergence',
  // violet doubles as the legend for the overlay: the number and the stain are
  // the same colour, so no sentence is needed to connect them
  meterColor: PALETTE.div,
}

type Pane = {
  spec: PaneSpec
  solver: FluidSolver
  renderer: SolverRenderer
  /** Readout only — written in step(), read in draw(). draw() stays pure. */
  frac: number
}

function makePane(spec: PaneSpec, g: Grid): Pane {
  const visc = (INFLOW * 2 * g.discR) / RE
  const solver = new FluidSolver(g.nx, g.ny, INFLOW, visc)
  solver.addDisc(g.discX, g.discY, g.discR)
  solver.toggles.project = spec.project
  return { spec, solver, renderer: new SolverRenderer(solver), frac: 0 }
}

/** Mean |∇·u| over the FLUID cells — magnitude, not spread (see METER note). */
function meanAbsDiv(s: FluidSolver): number {
  let fluid = 0
  let sum = 0
  for (let j = 1; j < s.ny - 1; j++) {
    for (let i = 1; i < s.nx - 1; i++) {
      const k = s.idx(i, j)
      if (s.solid[k]) continue
      fluid++
      sum += Math.abs(s.div[k])
    }
  }
  return sum / fluid
}

/**
 * The projected pane will NOT read 0. Forty Jacobi sweeps leave a residual,
 * and the figure reports it instead of rounding it away to a comforting zero.
 */
function pct(meanDiv: number): string {
  const p = meanDiv * 100
  if (p >= 10) return p.toFixed(0)
  if (p >= 1) return p.toFixed(1)
  if (p > 0 && p < 0.01) return '<0.01'
  return p.toFixed(2)
}

// ------------------------------------------------------------------- phase

type Phase = { kind: 'running' } | { kind: 'wrecked'; since: number }

function createPressureOff(width: number, height: number): Stepper {
  const paneH = (height - GAP) / 2
  const grid = gridFor(width, paneH)

  const build = (): readonly [Pane, Pane] => [makePane(SPEC_ON, grid), makePane(SPEC_OFF, grid)]

  let panes = build()
  let phase: Phase = { kind: 'running' }
  let elapsed = 0
  let acc = 0

  const advanceBoth = () => {
    for (const pane of panes) {
      pane.solver.injectDyeStripe(grid.dyeRows, 1)
      pane.solver.step(FIXED_DT)
      // THE TRAP: FluidSolver.project() calls computeDivergence() BEFORE it
      // subtracts ∇p, so after a projected step `solver.div` holds the
      // PRE-correction divergence — the crime the pressure term just cleaned
      // up, not what is left over. Reading it as-is would make the honest pane
      // look exactly as guilty as the broken one. Recompute here, after the
      // correction, so the upper meter reports the true residual. (The lower
      // pane never projects at all, so its `div` is stale for the opposite
      // reason — same fix. CylinderFlow.tsx does this too.)
      pane.solver.computeDivergence()
      pane.frac = meanAbsDiv(pane.solver)
    }
  }

  // Thin dispatcher: one handler per phase, no default branch.
  const runRunning = (): Phase => {
    advanceBoth()
    elapsed += FIXED_DT
    const wrecked = panes[1].frac >= WRECK_MEAN || elapsed >= MAX_RUN
    return wrecked ? { kind: 'wrecked', since: 0 } : { kind: 'running' }
  }

  const runWrecked = (p: { kind: 'wrecked'; since: number }): Phase => {
    const since = p.since + FIXED_DT
    if (since <= LINGER) return { kind: 'wrecked', since }
    // A restart of the DEMONSTRATION, not of physics — nothing here is claiming
    // that a fluid recovers from having its pressure term removed. It never
    // does. Both panes are rebuilt together, from the same constructor call, so
    // every cycle starts the comparison fair and a reader who arrives mid-scroll
    // still sees the catastrophe being BORN rather than its aftermath.
    // (AdvectionSchemes.tsx restarts its two panes for exactly this reason.)
    panes = build()
    elapsed = 0
    return { kind: 'running' }
  }

  const substep = (p: Phase): Phase => {
    switch (p.kind) {
      case 'running':
        return runRunning()
      case 'wrecked':
        return runWrecked(p)
    }
  }

  // Second thin dispatcher: the hold note. An empty string draws nothing, so
  // there is no branch at the paint site either.
  const noteFor = (p: Phase): string => {
    switch (p.kind) {
      case 'running':
        return ''
      case 'wrecked':
        return 'restarting both'
    }
  }

  const paint = (ctx: CanvasRenderingContext2D, pane: Pane, w: number, y: number) => {
    ctx.save()
    ctx.translate(0, y)
    pane.renderer.draw(ctx, w, paneH, pane.spec.overlay)
    ctx.font = LABEL_FONT
    ctx.fillStyle = INK
    ctx.fillText(pane.spec.label, 10, 18)
    ctx.fillStyle = pane.spec.meterColor
    ctx.fillText(`fluid created or destroyed: ${pct(pane.frac)}% of a cell's volume each second`, 10, paneH - 10)
    ctx.restore()
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        phase = substep(phase)
        acc -= FIXED_DT
        guard++
      }
      acc = Math.min(acc, FIXED_DT)
    },
    draw(ctx, w, h) {
      const lowerY = paneH + GAP
      paint(ctx, panes[0], w, 0)
      paint(ctx, panes[1], w, lowerY)
      ctx.font = LABEL_FONT
      ctx.fillStyle = PALETTE.div
      ctx.textAlign = 'right'
      ctx.fillText(noteFor(phase), w - 10, h - 10)
      ctx.textAlign = 'left'
    },
  }
}

export function PressureOff({ height = 360 }: { height?: number }) {
  return <Sim height={height} create={(w, h) => createPressureOff(w, h)} />
}
