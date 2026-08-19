// The pressure Poisson problem, lifted out of `sims/lib/solver.ts` so a figure
// can iterate it on its own terms: from an arbitrary initial guess, to a
// residual TOLERANCE rather than a fixed sweep count.
//
// The discretization is copied exactly from `FluidSolver.project` — same
// 5-point stencil, same h = 1, same Dirichlet p = 0 on the outer frame, same
// Neumann mirror at solid cells. It has to be exact: the whole article rests on
// the claim that a learned guess and a cold start end at the SAME answer, and
// that claim is empty if the two paths are solving different linear systems.
//
//   A p = b,   (A p)ᵢⱼ = p_left + p_right + p_down + p_up − 4 pᵢⱼ,   b = ∇·u*
//
// Sweeps are Gauss–Seidel (in place, reading neighbours already updated this
// pass) because that is what the shipped CPU solver does — see the note above
// DIFFUSE_ITERS_MIN in solver.ts. Gauss–Seidel converges about twice as fast as
// true Jacobi and has the same spectral character: it flattens rough error in a
// few sweeps and smooth error almost not at all. That asymmetry is the reason a
// learned guess can pay for itself, and §"the slow half" measures it.

export interface Grid {
  nx: number
  ny: number
  solid: Uint8Array
}

/**
 * Figures ship fields as Float32Array (half the memory, and it is what the
 * solver already uses); the reference solve runs in Float64Array because
 * float32 conjugate gradients stagnate around 5·10⁻⁵ on this grid — the
 * residual stops falling not because the iteration stalls but because the
 * arithmetic has run out of digits. Every operator here takes either.
 */
export type FloatArr = Float32Array | Float64Array

/** A p, written into `out`. Border cells and solids are left at 0. */
export function applyLaplacian(g: Grid, p: FloatArr, out: FloatArr): void {
  const { nx, ny, solid } = g
  out.fill(0)
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      const pl = solid[k - 1] ? p[k] : p[k - 1]
      const pr = solid[k + 1] ? p[k] : p[k + 1]
      const pd = solid[k - nx] ? p[k] : p[k - nx]
      const pu = solid[k + nx] ? p[k] : p[k + nx]
      out[k] = pl + pr + pd + pu - 4 * p[k]
    }
  }
}

/** ‖b − A p‖₂ / ‖b‖₂ over the cells the solver actually updates. */
export function relResidual(g: Grid, p: FloatArr, b: FloatArr): number {
  const { nx, ny, solid } = g
  let num = 0
  let den = 0
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      const pl = solid[k - 1] ? p[k] : p[k - 1]
      const pr = solid[k + 1] ? p[k] : p[k + 1]
      const pd = solid[k - nx] ? p[k] : p[k - nx]
      const pu = solid[k + nx] ? p[k] : p[k + nx]
      const r = b[k] - (pl + pr + pd + pu - 4 * p[k])
      num += r * r
      den += b[k] * b[k]
    }
  }
  return den === 0 ? 0 : Math.sqrt(num / den)
}

/** One Gauss–Seidel sweep, in place. */
export function sweep(g: Grid, p: FloatArr, b: FloatArr): void {
  const { nx, ny, solid } = g
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      const pl = solid[k - 1] ? p[k] : p[k - 1]
      const pr = solid[k + 1] ? p[k] : p[k + 1]
      const pd = solid[k - nx] ? p[k] : p[k - nx]
      const pu = solid[k + nx] ? p[k] : p[k + nx]
      p[k] = (pl + pr + pd + pu - b[k]) / 4
    }
  }
}

/**
 * Sweep `p` (whatever it already holds — zeros for a cold start, the network's
 * proposal for a warm one) until the relative residual drops below `tol`.
 * Returns the sweeps spent and the residual reached; `hit` says whether the
 * gate opened at all inside `maxSweeps`.
 */
export interface SolveReport {
  sweeps: number
  residual: number
  hit: boolean
}

export function solveToTolerance(
  g: Grid,
  p: FloatArr,
  b: FloatArr,
  tol: number,
  maxSweeps = 4000,
): SolveReport {
  let res = relResidual(g, p, b)
  if (res < tol) return { sweeps: 0, residual: res, hit: true }
  for (let n = 1; n <= maxSweeps; n++) {
    sweep(g, p, b)
    res = relResidual(g, p, b)
    if (res < tol) return { sweeps: n, residual: res, hit: true }
  }
  return { sweeps: maxSweeps, residual: res, hit: false }
}

/** ‖a − b‖∞ over updated cells — the "did the two paths agree?" meter. */
export function maxAbsDiff(g: Grid, a: FloatArr, b: FloatArr): number {
  const { nx, ny, solid } = g
  let m = 0
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      const d = Math.abs(a[k] - b[k])
      if (d > m) m = d
    }
  }
  return m
}

/** RMS of `f` over updated cells. The scale every field in this article is normalized by. */
export function rms(g: Grid, f: FloatArr): number {
  const { nx, ny, solid } = g
  let s = 0
  let n = 0
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      s += f[k] * f[k]
      n++
    }
  }
  return n === 0 ? 0 : Math.sqrt(s / n)
}

// ------------------------------------------------------- the fair baseline
//
// Gauss–Seidel is what the series' solver ships, and it is the thing the warm
// start is measured against — but it is also a soft target, and an accelerator
// that only beats a soft target has proved nothing. Conjugate gradients on the
// same matrix is the honest classical comparison: same A, same b, same residual
// gate, no learning anywhere. A is symmetric and negative definite here (the
// solid mirror removes a row and its transpose together), so CG applies to −A.

export function solveCG(
  g: Grid,
  p: FloatArr,
  b: FloatArr,
  tol: number,
  maxIters = 2000,
): SolveReport {
  const n = g.nx * g.ny
  // CG runs in double precision on its own copy and writes back at the end;
  // see the FloatArr note above for why.
  const x = Float64Array.from(p)
  const bb = Float64Array.from(b)
  const r = new Float64Array(n)
  const d = new Float64Array(n)
  const q = new Float64Array(n)
  const ap = new Float64Array(n)

  const inner = (a: Float64Array, c: Float64Array) => {
    let s = 0
    for (let j = 1; j < g.ny - 1; j++) {
      for (let i = 1; i < g.nx - 1; i++) {
        const k = i + j * g.nx
        if (g.solid[k]) continue
        s += a[k] * c[k]
      }
    }
    return s
  }

  // r = (−b) − (−A)p, working with M = −A so the system is positive definite
  applyLaplacian(g, x, ap)
  for (let k = 0; k < n; k++) r[k] = -bb[k] + ap[k]
  d.set(r)
  let rr = inner(r, r)
  let res = relResidual(g, x, bb)
  if (res < tol) return { sweeps: 0, residual: res, hit: true }

  for (let it = 1; it <= maxIters; it++) {
    applyLaplacian(g, d, q)
    for (let k = 0; k < n; k++) q[k] = -q[k] // q = M d
    const dq = inner(d, q)
    if (dq === 0) break
    const alpha = rr / dq
    for (let j = 1; j < g.ny - 1; j++) {
      for (let i = 1; i < g.nx - 1; i++) {
        const k = i + j * g.nx
        if (g.solid[k]) continue
        x[k] += alpha * d[k]
        r[k] -= alpha * q[k]
      }
    }
    const rr2 = inner(r, r)
    res = relResidual(g, x, bb)
    if (res < tol) {
      for (let k = 0; k < n; k++) p[k] = x[k]
      return { sweeps: it, residual: res, hit: true }
    }
    const beta = rr2 / rr
    rr = rr2
    for (let j = 1; j < g.ny - 1; j++) {
      for (let i = 1; i < g.nx - 1; i++) {
        const k = i + j * g.nx
        if (g.solid[k]) continue
        d[k] = r[k] + beta * d[k]
      }
    }
  }
  for (let k = 0; k < n; k++) p[k] = x[k]
  return { sweeps: maxIters, residual: res, hit: false }
}
