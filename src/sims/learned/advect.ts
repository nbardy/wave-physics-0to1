// The advection seam, isolated for the second trained model.
//
// Everything here runs the SAME scheme lesson 01 ships — semi-Lagrangian
// advection, backtrace and bilinearly interpolate — at two resolutions of the
// same flow. The fine grid is the standard; the coarse grid is the budget; the
// gap between them is the discretization error the learned correction is asked
// to close. No new physics enters anywhere in this file: the velocity fields
// are analytic and divergence-free by construction (they are curls of scalar
// bumps), so the transported dye has exactly one honest invariant — its total —
// and every deviation from the fine reference is the scheme's fault, not the
// flow's.
//
// The network is a flux net, and the flux form is the point. It outputs face
// fluxes F and the correction applied is −div F, so the sum of the correction
// over the grid telescopes to zero identically. Mass conservation is not a
// behavior it learned; it is a behavior the architecture cannot avoid. That is
// the same move the pressure net made with scale symmetry — structure you can
// prove goes in the wiring, and the weights only ever fill in what you can't.

export const FNX = 96
export const FNY = 64
export const FACTOR = 4 // the trained coarsening; SmearRace also visits 2 and 8
export const CNX = FNX / FACTOR // 24
export const CNY = FNY / FACTOR // 16
export const DT = 1 / 30

// Semi-Lagrangian is unconditionally stable, so DT carries no CFL condition —
// the constraint it does carry is legibility: at the training speeds (8–20
// fine cells/s) a fine parcel moves at most ~0.7 cells per step, which keeps
// the backtrace inside the bilinear footprint where the scheme is at its
// most honest.

// ---------------------------------------------------------------- velocity

export interface Vortex {
  cx: number // fine-cell coordinates
  cy: number
  s: number // radius of the stream-function bump, fine cells
  a: number // amplitude (sign = spin direction); rescaled to a target speed
}

export interface Swirl {
  vortices: Vortex[]
  peak: number // max |v| in fine cells/s after rescaling
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * v = ∇×(ψ ẑ) for a sum of Gaussian stream-function bumps — divergence-free
 * exactly, zero at infinity, and (with centers kept off the walls) small at the
 * box edge, so the closed box is a fair home for it.
 */
export function swirlVelocityAt(sw: Swirl, x: number, y: number): [number, number] {
  let vx = 0
  let vy = 0
  for (const v of sw.vortices) {
    const dx = x - v.cx
    const dy = y - v.cy
    const e = v.a * Math.exp(-(dx * dx + dy * dy) / (v.s * v.s))
    vx += e * (-2 * dy) / (v.s * v.s)
    vy += e * (2 * dx) / (v.s * v.s)
  }
  return [vx, vy]
}

export function makeSwirl(seed: number, peakSpeed: number, nVortices: number): Swirl {
  const rnd = mulberry32(seed)
  const vortices: Vortex[] = []
  for (let k = 0; k < nVortices; k++) {
    vortices.push({
      cx: FNX * (0.25 + 0.5 * rnd()),
      cy: FNY * (0.25 + 0.5 * rnd()),
      s: 10 + 12 * rnd(),
      a: (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd()),
    })
  }
  const sw: Swirl = { vortices, peak: 0 }
  // rescale so the fastest fine cell moves at exactly peakSpeed
  let m = 0
  for (let j = 0; j < FNY; j++) {
    for (let i = 0; i < FNX; i++) {
      const [vx, vy] = swirlVelocityAt(sw, i, j)
      m = Math.max(m, Math.hypot(vx, vy))
    }
  }
  const scale = m === 0 ? 0 : peakSpeed / m
  for (const v of vortices) v.a *= scale
  sw.peak = peakSpeed
  return sw
}

/** Velocity sampled at every cell center of an nx×ny coarsening of the fine grid. */
export function sampleVelocity(sw: Swirl, nx: number, ny: number): { u: Float32Array; v: Float32Array } {
  const f = FNX / nx
  const u = new Float32Array(nx * ny)
  const v = new Float32Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const [vx, vy] = swirlVelocityAt(sw, (i + 0.5) * f - 0.5, (j + 0.5) * f - 0.5)
      // fine cells/s → this grid's cells/s
      u[i + j * nx] = vx / f
      v[i + j * nx] = vy / f
    }
  }
  return { u, v }
}

// ------------------------------------------------------------------ dye

/** Sharp-edged seeds, same reasoning as AdvectionSchemes: smooth blobs hide
 *  everything a scheme does wrong, discontinuities confess it immediately. */
export type PatternKind = 'disc' | 'ring' | 'stripes' | 'pair'

export function seedPattern(kind: PatternKind, nx: number, ny: number, out: Float32Array): void {
  const f = FNX / nx
  out.fill(0)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      // classify by the FINE-grid location of this cell's center, so every
      // resolution seeds the same physical shape
      const x = ((i + 0.5) * f - 0.5) / FNX
      const y = ((j + 0.5) * f - 0.5) / FNY
      const k = i + j * nx
      if (kind === 'disc') {
        const r = Math.hypot((x - 0.38) / 0.13, (y - 0.42) / (0.13 * (FNX / FNY)))
        out[k] = r <= 1 ? 1 : 0
      } else if (kind === 'ring') {
        const r = Math.hypot((x - 0.55) / 0.2, (y - 0.5) / (0.2 * (FNX / FNY)))
        out[k] = r >= 0.55 && r <= 1 ? 1 : 0
      } else if (kind === 'stripes') {
        out[k] = Math.floor(y * 8) % 2 === 0 && x > 0.15 && x < 0.85 ? 1 : 0
      } else {
        const r1 = Math.hypot((x - 0.32) / 0.1, (y - 0.35) / (0.1 * (FNX / FNY)))
        const r2 = Math.hypot((x - 0.6) / 0.1, (y - 0.62) / (0.1 * (FNX / FNY)))
        out[k] = r1 <= 1 || r2 <= 1 ? 1 : 0
      }
    }
  }
}

// ------------------------------------------------------------------ SL step

function sampleBilinear(f: Float32Array, nx: number, ny: number, x: number, y: number): number {
  const cx = Math.min(Math.max(x, 0), nx - 1.001)
  const cy = Math.min(Math.max(y, 0), ny - 1.001)
  const i0 = Math.floor(cx)
  const j0 = Math.floor(cy)
  const tx = cx - i0
  const ty = cy - j0
  const a = f[i0 + j0 * nx]
  const b = f[i0 + 1 + j0 * nx]
  const c = f[i0 + (j0 + 1) * nx]
  const d = f[i0 + 1 + (j0 + 1) * nx]
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

/** One semi-Lagrangian step: dst[cell] = src at the backtraced point. */
export function slStep(
  nx: number,
  ny: number,
  u: Float32Array,
  v: Float32Array,
  dt: number,
  src: Float32Array,
  dst: Float32Array,
): void {
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = i + j * nx
      dst[k] = sampleBilinear(src, nx, ny, i - u[k] * dt, j - v[k] * dt)
    }
  }
}

/**
 * The backtrace of a semi-Lagrangian step is a function of the velocity field
 * alone, and every flow in this file is frozen — so the whole step collapses to
 * a fixed sparse gather: four indices and four weights per cell, computed once.
 * The payoff is not speed (though it is ~3× faster): a fixed gather has an
 * exact adjoint — scatter with the same weights — which is what lets the
 * solver-in-the-loop trainer backpropagate through the solver itself.
 */
export interface SLOp {
  nx: number
  ny: number
  idx: Int32Array // 4 per cell
  wt: Float32Array // 4 per cell
}

export function makeSLOp(nx: number, ny: number, u: Float32Array, v: Float32Array, dt: number): SLOp {
  const n = nx * ny
  const idx = new Int32Array(4 * n)
  const wt = new Float32Array(4 * n)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = i + j * nx
      const cx = Math.min(Math.max(i - u[k] * dt, 0), nx - 1.001)
      const cy = Math.min(Math.max(j - v[k] * dt, 0), ny - 1.001)
      const i0 = Math.floor(cx)
      const j0 = Math.floor(cy)
      const tx = cx - i0
      const ty = cy - j0
      const o = 4 * k
      idx[o] = i0 + j0 * nx
      idx[o + 1] = i0 + 1 + j0 * nx
      idx[o + 2] = i0 + (j0 + 1) * nx
      idx[o + 3] = i0 + 1 + (j0 + 1) * nx
      wt[o] = (1 - tx) * (1 - ty)
      wt[o + 1] = tx * (1 - ty)
      wt[o + 2] = (1 - tx) * ty
      wt[o + 3] = tx * ty
    }
  }
  return { nx, ny, idx, wt }
}

export function applySL(op: SLOp, src: Float32Array, dst: Float32Array): void {
  const n = op.nx * op.ny
  for (let k = 0; k < n; k++) {
    const o = 4 * k
    dst[k] =
      op.wt[o] * src[op.idx[o]] +
      op.wt[o + 1] * src[op.idx[o + 1]] +
      op.wt[o + 2] * src[op.idx[o + 2]] +
      op.wt[o + 3] * src[op.idx[o + 3]]
  }
}

/** Adjoint of applySL: scatter dDst back through the same weights, ACCUMULATING into dSrc. */
export function applySLAdjoint(op: SLOp, dDst: Float32Array, dSrc: Float32Array): void {
  const n = op.nx * op.ny
  for (let k = 0; k < n; k++) {
    const o = 4 * k
    const g = dDst[k]
    if (g === 0) continue
    dSrc[op.idx[o]] += op.wt[o] * g
    dSrc[op.idx[o + 1]] += op.wt[o + 1] * g
    dSrc[op.idx[o + 2]] += op.wt[o + 2] * g
    dSrc[op.idx[o + 3]] += op.wt[o + 3] * g
  }
}

/** Box-average a fine field down to nx×ny (the ghost every figure compares against). */
export function restrictTo(fine: Float32Array, nx: number, ny: number, out: Float32Array): void {
  const f = FNX / nx
  const inv = 1 / (f * f)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let s = 0
      for (let dy = 0; dy < f; dy++) {
        const row = (j * f + dy) * FNX + i * f
        for (let dx = 0; dx < f; dx++) s += fine[row + dx]
      }
      out[i + j * nx] = s * inv
    }
  }
}

export function relErr(a: Float32Array, ref: Float32Array): number {
  let num = 0
  let den = 0
  for (let k = 0; k < a.length; k++) {
    num += (a[k] - ref[k]) ** 2
    den += ref[k] ** 2
  }
  return den === 0 ? 0 : Math.sqrt(num / den)
}

export function total(f: Float32Array): number {
  let s = 0
  for (let k = 0; k < f.length; k++) s += f[k]
  return s
}

// ------------------------------------------------------------------ the net
//
// dyePost (normalized), u, v  →  two 3×3 conv layers (tanh)  →  face fluxes
// (tanh-bounded)  →  correction = −div F.
//
// Bounds and symmetries in the wiring, not the weights:
//   scale — advection is linear in dye, so the input is divided by RMS(dye)
//           and the fluxes multiplied back; a brighter blob cannot surprise it.
//   mass  — the correction is a flux divergence with zero flux through the
//           walls, so its total is exactly zero, trained or wrecked.
//   size  — each flux is tanh-bounded at FLUX_SCALE of the local dye scale, so
//           one step can only move a fraction of a cell's worth of dye.

export const A_IN = 3
export const A_CH = 8
export const U_SCALE = 6 // coarse cells/s that maps to 1.0 in the input
export const FLUX_SCALE = 0.35

export interface AdvectWeights {
  w1: Float32Array // A_CH × A_IN × 9
  b1: Float32Array
  w2: Float32Array // A_CH × A_CH × 9
  b2: Float32Array
  w3: Float32Array // 2 × A_CH × 9
  b3: Float32Array
}

export const A_SHAPES = {
  w1: A_CH * A_IN * 9,
  b1: A_CH,
  w2: A_CH * A_CH * 9,
  b2: A_CH,
  w3: 2 * A_CH * 9,
  b3: 2,
} as const

export function advectParamCount(): number {
  return Object.values(A_SHAPES).reduce((a, b) => a + b, 0)
}

export function zeroAdvectWeights(): AdvectWeights {
  return {
    w1: new Float32Array(A_SHAPES.w1),
    b1: new Float32Array(A_SHAPES.b1),
    w2: new Float32Array(A_SHAPES.w2),
    b2: new Float32Array(A_SHAPES.b2),
    w3: new Float32Array(A_SHAPES.w3),
    b3: new Float32Array(A_SHAPES.b3),
  }
}

/** 3×3 zero-padded conv on the CNX×CNY grid, generic in channel counts. */
export function convC(
  x: Float32Array,
  w: Float32Array,
  bias: Float32Array,
  inCh: number,
  outCh: number,
  out: Float32Array,
): void {
  const n = CNX * CNY
  for (let oc = 0; oc < outCh; oc++) {
    const obase = oc * n
    for (let cj = 0; cj < CNY; cj++) {
      for (let ci = 0; ci < CNX; ci++) {
        let acc = bias[oc]
        for (let ic = 0; ic < inCh; ic++) {
          const ibase = ic * n
          const wbase = (oc * inCh + ic) * 9
          for (let dy = -1; dy <= 1; dy++) {
            const jj = cj + dy
            if (jj < 0 || jj >= CNY) continue
            for (let dx = -1; dx <= 1; dx++) {
              const ii = ci + dx
              if (ii < 0 || ii >= CNX) continue
              acc += w[wbase + (dy + 1) * 3 + (dx + 1)] * x[ibase + ii + jj * CNX]
            }
          }
        }
        out[obase + ci + cj * CNX] = acc
      }
    }
  }
}

export interface AdvectActs {
  inp: Float32Array // A_IN × n
  z1: Float32Array
  a1: Float32Array
  z2: Float32Array
  a2: Float32Array
  zf: Float32Array // 2 × n, pre-tanh flux
  flux: Float32Array // 2 × n, post-tanh, unscaled
  scale: number // RMS(dye) · FLUX_SCALE
}

export function makeAdvectActs(): AdvectActs {
  const n = CNX * CNY
  return {
    inp: new Float32Array(A_IN * n),
    z1: new Float32Array(A_CH * n),
    a1: new Float32Array(A_CH * n),
    z2: new Float32Array(A_CH * n),
    a2: new Float32Array(A_CH * n),
    zf: new Float32Array(2 * n),
    flux: new Float32Array(2 * n),
    scale: 0,
  }
}

/**
 * The correction for one coarse step, written into `corr`. Fx = flux across the
 * face between (i,j) and (i+1,j); the last column's Fx and last row's Fy are
 * forced to zero so no dye crosses the wall — that zeroing plus the telescoping
 * divergence is the whole conservation proof.
 */
export function advectCorrection(
  w: AdvectWeights,
  dyePost: Float32Array,
  u: Float32Array,
  v: Float32Array,
  corr: Float32Array,
  act: AdvectActs,
): AdvectActs {
  const n = CNX * CNY
  let s = 0
  for (let k = 0; k < n; k++) s += dyePost[k] * dyePost[k]
  s = Math.sqrt(s / n)
  act.scale = s * FLUX_SCALE
  if (s === 0) {
    corr.fill(0)
    act.flux.fill(0)
    return act
  }
  for (let k = 0; k < n; k++) {
    act.inp[k] = dyePost[k] / s
    act.inp[n + k] = u[k] / U_SCALE
    act.inp[2 * n + k] = v[k] / U_SCALE
  }
  convC(act.inp, w.w1, w.b1, A_IN, A_CH, act.z1)
  for (let k = 0; k < act.z1.length; k++) act.a1[k] = Math.tanh(act.z1[k])
  convC(act.a1, w.w2, w.b2, A_CH, A_CH, act.z2)
  for (let k = 0; k < act.z2.length; k++) act.a2[k] = Math.tanh(act.z2[k])
  convC(act.a2, w.w3, w.b3, A_CH, 2, act.zf)
  for (let k = 0; k < act.zf.length; k++) act.flux[k] = Math.tanh(act.zf[k])

  for (let j = 0; j < CNY; j++) {
    for (let i = 0; i < CNX; i++) {
      const k = i + j * CNX
      const fxR = i < CNX - 1 ? act.flux[k] : 0
      const fxL = i > 0 ? act.flux[k - 1] : 0
      const fyU = j < CNY - 1 ? act.flux[n + k] : 0
      const fyD = j > 0 ? act.flux[n + k - CNX] : 0
      corr[k] = -(fxR - fxL + fyU - fyD) * act.scale
    }
  }
  return act
}

// ------------------------------------------------------------------ cases

export interface AdvectCase {
  id: string
  label: string
  seed: number
  peak: number
  nVortices: number
  pattern: PatternKind
}

export const ADVECT_TRAIN: readonly AdvectCase[] = [
  { id: 'a1', label: 'disc, two vortices', seed: 31, peak: 12, nVortices: 2, pattern: 'disc' },
  { id: 'a2', label: 'ring, three vortices', seed: 32, peak: 16, nVortices: 3, pattern: 'ring' },
  { id: 'a3', label: 'stripes, two vortices', seed: 33, peak: 10, nVortices: 2, pattern: 'stripes' },
  { id: 'a4', label: 'pair, three vortices', seed: 34, peak: 18, nVortices: 3, pattern: 'pair' },
  { id: 'a5', label: 'disc, three vortices', seed: 35, peak: 20, nVortices: 3, pattern: 'disc' },
  { id: 'a6', label: 'stripes, four vortices', seed: 36, peak: 14, nVortices: 4, pattern: 'stripes' },
] as const

export const ADVECT_HELD_OUT: readonly AdvectCase[] = [
  { id: 'ah1', label: 'held-out disc', seed: 131, peak: 14, nVortices: 3, pattern: 'disc' },
  { id: 'ah2', label: 'held-out ring', seed: 132, peak: 17, nVortices: 2, pattern: 'ring' },
  { id: 'ah3', label: 'held-out stripes', seed: 133, peak: 11, nVortices: 3, pattern: 'stripes' },
] as const

// Out of distribution by regime, not by geometry: the swirl is half again
// faster than anything in training, with more vortices than the generator
// ever drew. Same physics, same box — just a flow the weights never met.
export const ADVECT_OOD: readonly AdvectCase[] = [
  { id: 'ao1', label: 'faster swirl than trained', seed: 231, peak: 30, nVortices: 5, pattern: 'disc' },
] as const
