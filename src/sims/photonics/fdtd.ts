// 2D FDTD — TM-mode Maxwell (Ez, Hx, Hy) leapfrogging on a Yee grid (Yee 1966;
// the textbook form in Taflove & Hagness, Computational Electrodynamics).
// Named-solver honesty (METHODOLOGY §0 #4): this is the solver the photonics
// figures teach, and the articles will say so.
//
// CPU reference first, per the repo pattern (see sims/lib/gpu/): the WGSL port
// comes later and is checked against THIS file's numbers, never against itself.
// No rendering in this file — `createFdtd` builds fresh state, `step` advances
// exactly one fixed DT, and `scripts/check-photonics-spike.ts` validates the
// physics headlessly.
//
// Units: dx = dy = 1 cell, c0 = 1 cell per time unit, ε0 = μ0 = 1. A material
// is its refractive index n(x, y) ≥ 1 (εr = n², μr = 1), so the local wave
// speed is c0/n and VACUUM is the fastest medium — the stability bound below
// depends on n_min = 1, which stampIndexRect enforces by refusing n < 1.
//
// Yee staggering: Ez lives at integer (i, j); Hy at (i+½, j), stored at
// index [i, j] for i < nx−1; Hx at (i, j+½), stored at [i, j] for j < ny−1.
// One step = H half-step from ∇×E, then E full step from ∇×H — leapfrog.

export const DX = 1 // cell size — the length unit
export const C0 = 1 // vacuum wave speed — the speed unit

// Courant stability (2D Yee): c_max·dt ≤ dx/√2, with c_max = c0/n_min = c0
// because stampIndexRect refuses n < 1. DT is DERIVED from the bound — there
// is no free timestep to mis-set, so the scheme is stable by construction.
// COURANT_SAFETY keeps a 1% margin so float32 rounding can never sit exactly
// on the bound.
export const COURANT_SAFETY = 0.99
export const DT = (COURANT_SAFETY * DX) / (C0 * Math.SQRT2)

// First-order Mur absorbing boundary (Mur 1981). Exact only at NORMAL
// incidence: obliquely arriving waves reflect a few percent of their
// amplitude, corners are worst, and the coefficient below assumes vacuum
// (n = 1) at the edge — which is why stampIndexRect refuses to write inside
// the outer VACUUM_RIM. A PML is the planned upgrade; it slots in as another
// variant of the Boundary sum type without touching the handlers here.
const MUR_COEF = (C0 * DT - DX) / (C0 * DT + DX)

/** Cells at each edge that must stay vacuum so the Mur coefficient is honest. */
export const VACUUM_RIM = 2

// ---------------------------------------------------------------- domain

/**
 * Boundary treatment is a sum type — the ONLY semantic branch in the solver,
 * dispatched once per step in `step`. 'pec' = perfect electric conductor
 * (Ez pinned to 0 on the rim: a lossless mirror box, used by the energy-
 * conservation check). 'mur1' = first-order Mur absorber (open space).
 */
export type Boundary = 'pec' | 'mur1'

/** Continuous-wave soft source along the vertical segment i, j0..j1 (inclusive; j0 === j1 is a point). */
export interface CwLineSource {
  i: number
  j0: number
  j1: number
  /** vacuum wavelength, in cells */
  wavelength: number
  amp: number
  /** smooth sin² turn-on over this many periods (0 = hard start) */
  rampPeriods: number
}

export interface FdtdSpec {
  nx: number
  ny: number
  boundary: Boundary
}

export interface FdtdState {
  readonly nx: number
  readonly ny: number
  readonly boundary: Boundary
  /** steps taken; simulated time is n·DT */
  n: number
  /** Ez at integer (i, j), row-major i + j·nx */
  ez: Float32Array
  /** Hx at (i, j+½), valid j < ny−1; last row stays 0 */
  hx: Float32Array
  /** Hy at (i+½, j), valid i < nx−1; last column stays 0 */
  hy: Float32Array
  /** 1/n² per Ez cell — the update coefficient; written only by stampIndexRect */
  invEps: Float32Array
  /** 1.0 outside opaque (PEC) walls, 0.0 inside — multiplied into Ez each step, branch-free */
  ezMask: Float32Array
  /** live sources; a check turns them off by assigning [] */
  sources: CwLineSource[]
  /** Mur edge memory (previous-step Ez on the rim and one cell in); allocated for both boundaries, read only by 'mur1' */
  mur: MurMemory
}

interface MurMemory {
  left0: Float32Array
  left1: Float32Array
  right0: Float32Array
  right1: Float32Array
  bottom0: Float32Array
  bottom1: Float32Array
  top0: Float32Array
  top1: Float32Array
}

// ---------------------------------------------------------------- factory

export function createFdtd(spec: FdtdSpec): FdtdState {
  const { nx, ny, boundary } = spec
  if (!Number.isInteger(nx) || !Number.isInteger(ny) || nx < 8 || ny < 8) {
    throw new Error(`createFdtd: grid must be integer and at least 8×8, got ${nx}×${ny}`)
  }
  const size = nx * ny
  return {
    nx,
    ny,
    boundary,
    n: 0,
    ez: new Float32Array(size),
    hx: new Float32Array(size),
    hy: new Float32Array(size),
    invEps: new Float32Array(size).fill(1),
    ezMask: new Float32Array(size).fill(1),
    sources: [],
    mur: {
      left0: new Float32Array(ny),
      left1: new Float32Array(ny),
      right0: new Float32Array(ny),
      right1: new Float32Array(ny),
      bottom0: new Float32Array(nx),
      bottom1: new Float32Array(nx),
      top0: new Float32Array(nx),
      top1: new Float32Array(nx),
    },
  }
}

// ---------------------------------------------------------------- stamping
// Ingestion lives here (κ): geometry is validated LOUDLY at stamp time, so
// the step handlers never re-check anything. No silent clamping, no fallback.

/** Stamp refractive index n over the inclusive cell rect [x0..x1]×[y0..y1]. */
export function stampIndexRect(
  s: FdtdState,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  n: number,
): void {
  if (n < 1) {
    throw new Error(`stampIndexRect: n = ${n} < 1 would break the Courant bound (vacuum must stay the fastest medium)`)
  }
  if (x0 > x1 || y0 > y1 || x0 < VACUUM_RIM || y0 < VACUUM_RIM || x1 > s.nx - 1 - VACUUM_RIM || y1 > s.ny - 1 - VACUUM_RIM) {
    throw new Error(
      `stampIndexRect: rect [${x0}..${x1}]×[${y0}..${y1}] leaves [${VACUUM_RIM}..${s.nx - 1 - VACUUM_RIM}]×[${VACUUM_RIM}..${s.ny - 1 - VACUUM_RIM}] — the outer ${VACUUM_RIM}-cell rim must stay vacuum for the Mur coefficient to be honest`,
    )
  }
  const inv = 1 / (n * n)
  for (let j = y0; j <= y1; j++) {
    const row = j * s.nx
    for (let i = x0; i <= x1; i++) s.invEps[row + i] = inv
  }
}

/** Stamp an opaque (PEC) wall over the inclusive cell rect — Ez is pinned to 0 there every step. */
export function stampWallRect(s: FdtdState, x0: number, y0: number, x1: number, y1: number): void {
  if (x0 > x1 || y0 > y1 || x0 < 0 || y0 < 0 || x1 > s.nx - 1 || y1 > s.ny - 1) {
    throw new Error(`stampWallRect: rect [${x0}..${x1}]×[${y0}..${y1}] outside the ${s.nx}×${s.ny} grid`)
  }
  for (let j = y0; j <= y1; j++) {
    const row = j * s.nx
    for (let i = x0; i <= x1; i++) s.ezMask[row + i] = 0
  }
}

// ---------------------------------------------------------------- stepping

/**
 * Advance exactly one DT. Thin dispatcher on the boundary sum type — the
 * handlers below each run one clean path with no structural branching.
 */
export function step(s: FdtdState): void {
  switch (s.boundary) {
    case 'pec':
      stepPec(s)
      return
    case 'mur1':
      stepMur(s)
      return
  }
}

function stepPec(s: FdtdState): void {
  updateH(s)
  updateEzInterior(s)
  injectSources(s)
  applyWalls(s)
  s.n++
  // the Ez rim is never written → stays 0 → perfect mirror, by construction
}

function stepMur(s: FdtdState): void {
  updateH(s)
  snapshotEdges(s)
  updateEzInterior(s)
  injectSources(s)
  applyMurEdges(s)
  applyWalls(s) // last, so a wall touching the rim wins over the Mur write
  s.n++
}

/** H half-step: Hx −= dt·∂Ez/∂y, Hy += dt·∂Ez/∂x (μ = 1, dx = dy = 1). */
function updateH(s: FdtdState): void {
  const { nx, ny, ez, hx, hy } = s
  for (let j = 0; j < ny - 1; j++) {
    const row = j * nx
    for (let i = 0; i < nx; i++) {
      const k = row + i
      hx[k] -= DT * (ez[k + nx] - ez[k])
    }
  }
  for (let j = 0; j < ny; j++) {
    const row = j * nx
    for (let i = 0; i < nx - 1; i++) {
      const k = row + i
      hy[k] += DT * (ez[k + 1] - ez[k])
    }
  }
}

/** E full step on interior cells: Ez += dt/εr · (∂Hy/∂x − ∂Hx/∂y). */
function updateEzInterior(s: FdtdState): void {
  const { nx, ny, ez, hx, hy, invEps } = s
  for (let j = 1; j < ny - 1; j++) {
    const row = j * nx
    for (let i = 1; i < nx - 1; i++) {
      const k = row + i
      ez[k] += DT * invEps[k] * (hy[k] - hy[k - 1] - hx[k] + hx[k - nx])
    }
  }
}

/** Soft CW injection: Ez += dt·J at the new time level, with a sin² turn-on. */
function injectSources(s: FdtdState): void {
  const t = (s.n + 1) * DT
  for (const src of s.sources) {
    const omega = (2 * Math.PI * C0) / src.wavelength
    const tau = (src.rampPeriods * src.wavelength) / C0
    const envelope = t >= tau ? 1 : Math.sin((Math.PI * t) / (2 * tau)) ** 2
    const drive = DT * src.amp * envelope * Math.sin(omega * t)
    for (let j = src.j0; j <= src.j1; j++) s.ez[j * s.nx + src.i] += drive
  }
}

/** Pin Ez to 0 inside opaque walls — a branch-free mask multiply. */
function applyWalls(s: FdtdState): void {
  const { ez, ezMask } = s
  for (let k = 0; k < ez.length; k++) ez[k] *= ezMask[k]
}

/** Remember rim Ez (edge + one cell in) before the update; Mur needs both old values. */
function snapshotEdges(s: FdtdState): void {
  const { nx, ny, ez, mur } = s
  for (let j = 0; j < ny; j++) {
    const row = j * nx
    mur.left0[j] = ez[row]
    mur.left1[j] = ez[row + 1]
    mur.right0[j] = ez[row + nx - 1]
    mur.right1[j] = ez[row + nx - 2]
  }
  const topRow = (ny - 1) * nx
  for (let i = 0; i < nx; i++) {
    mur.bottom0[i] = ez[i]
    mur.bottom1[i] = ez[nx + i]
    mur.top0[i] = ez[topRow + i]
    mur.top1[i] = ez[topRow - nx + i]
  }
}

/**
 * Mur 1st-order update: Ez_edge ← Ez_in_old + coef·(Ez_in_new − Ez_edge_old).
 * Left/right edges first, then bottom/top over the full width — the four
 * corner cells get the vertical-edge treatment, which is the standard cheap
 * corner and one source of the small residual reflection the checks measure.
 */
function applyMurEdges(s: FdtdState): void {
  const { nx, ny, ez, mur } = s
  for (let j = 1; j < ny - 1; j++) {
    const row = j * nx
    ez[row] = mur.left1[j] + MUR_COEF * (ez[row + 1] - mur.left0[j])
    ez[row + nx - 1] = mur.right1[j] + MUR_COEF * (ez[row + nx - 2] - mur.right0[j])
  }
  const topRow = (ny - 1) * nx
  for (let i = 0; i < nx; i++) {
    ez[i] = mur.bottom1[i] + MUR_COEF * (ez[nx + i] - mur.bottom0[i])
    ez[topRow + i] = mur.top1[i] + MUR_COEF * (ez[topRow - nx + i] - mur.top0[i])
  }
}

// ---------------------------------------------------------------- measures

/**
 * Instantaneous field energy ½Σ(εr·Ez² + Hx² + Hy²), for figure meters. Note
 * for checks: E and H live half a step apart, so this oscillates slightly at
 * 2ω — the check script uses the time-centered pairing ⟨H^{n+½}, H^{n−½}⟩,
 * which the lossless leapfrog conserves exactly in exact arithmetic.
 */
export function totalEnergy(s: FdtdState): number {
  const { ez, hx, hy, invEps } = s
  let e = 0
  let h = 0
  for (let k = 0; k < ez.length; k++) {
    e += (ez[k] * ez[k]) / invEps[k]
    h += hx[k] * hx[k] + hy[k] * hy[k]
  }
  return 0.5 * (e + h)
}
