// The whole model. 809 numbers.
//
// It is deliberately the smallest thing that can do the one job the article
// gives it: supply the SMOOTH part of the pressure field, which is the part
// Gauss–Seidel is worst at finding. So the architecture is mostly a statement
// about frequency:
//
//   b (96×64)  ─restrict 8×─►  coarse (12×8)  ─3 conv layers─►  coarse p̂
//              ◄──── prolong ────  p₀ (96×64)
//
// Averaging 8×8 blocks throws away every wavelength shorter than 8 cells before
// the network sees anything, so the network CANNOT propose high-frequency
// pressure — it has no basis for it. That is a feature: the sweeps that follow
// erase rough error in a handful of passes anyway, and a net that guessed at it
// would only be adding work. Three 3×3 convolutions on the coarse grid reach 7
// coarse cells, i.e. 56 fine cells, which is most of the domain — a genuinely
// nonlocal response, built out of local operations, which is what the true
// inverse Laplacian needs.
//
// Two exact symmetries are built in rather than learned, because a network that
// has to learn them wastes capacity and still only gets them approximately:
//
//   scale — A p = b is linear, so p scales with b. The field is divided by its
//           own RMS on the way in and multiplied back on the way out, and the
//           network never sees a magnitude. Doubling the inflow cannot surprise it.
//   units — the coarse grid has spacing h = 8, and pressure carries h², so the
//           network's output is read in units of RMS(b)·h². Its own numbers stay O(1).
//
// The obstacle enters as a second input channel (the fraction of each coarse
// cell that is solid), because a pressure field around a cylinder is not the
// pressure field of the same divergence in open water.

import { rms, type FloatArr, type Grid } from './poisson'

export const NX = 96
export const NY = 64
export const POOL = 8
export const CX = NX / POOL // 12
export const CY = NY / POOL // 8
export const CH = 8 // hidden channels
export const IN_CH = 2 // divergence, solid fraction
export const SCALE = POOL * POOL // pressure carries h² of the grid it was solved on

export interface NetWeights {
  w1: Float32Array // CH × IN_CH × 3 × 3
  b1: Float32Array // CH
  w2: Float32Array // CH × CH × 3 × 3
  b2: Float32Array // CH
  w3: Float32Array // 1 × CH × 3 × 3
  b3: Float32Array // 1
}

export const SHAPES = {
  w1: CH * IN_CH * 9,
  b1: CH,
  w2: CH * CH * 9,
  b2: CH,
  w3: 1 * CH * 9,
  b3: 1,
} as const

export function paramCount(): number {
  return Object.values(SHAPES).reduce((a, b) => a + b, 0)
}

export function zeroWeights(): NetWeights {
  return {
    w1: new Float32Array(SHAPES.w1),
    b1: new Float32Array(SHAPES.b1),
    w2: new Float32Array(SHAPES.w2),
    b2: new Float32Array(SHAPES.b2),
    w3: new Float32Array(SHAPES.w3),
    b3: new Float32Array(SHAPES.b3),
  }
}

// ------------------------------------------------------------------ layers

/** 3×3 convolution, zero-padded (p = 0 outside the domain is the physical BC). */
export function conv2d(
  x: Float32Array,
  w: Float32Array,
  bias: Float32Array,
  inCh: number,
  outCh: number,
  out: Float32Array,
): void {
  for (let oc = 0; oc < outCh; oc++) {
    const obase = oc * CX * CY
    for (let cj = 0; cj < CY; cj++) {
      for (let ci = 0; ci < CX; ci++) {
        let acc = bias[oc]
        for (let ic = 0; ic < inCh; ic++) {
          const ibase = ic * CX * CY
          const wbase = (oc * inCh + ic) * 9
          for (let dy = -1; dy <= 1; dy++) {
            const jj = cj + dy
            if (jj < 0 || jj >= CY) continue
            for (let dx = -1; dx <= 1; dx++) {
              const ii = ci + dx
              if (ii < 0 || ii >= CX) continue
              acc += w[wbase + (dy + 1) * 3 + (dx + 1)] * x[ibase + ii + jj * CX]
            }
          }
        }
        out[obase + ci + cj * CX] = acc
      }
    }
  }
}

/** 8×8 box average, fine → coarse. */
export function restrict(fine: FloatArr, coarse: Float32Array): void {
  coarse.fill(0)
  const inv = 1 / (POOL * POOL)
  for (let cj = 0; cj < CY; cj++) {
    for (let ci = 0; ci < CX; ci++) {
      let s = 0
      for (let dy = 0; dy < POOL; dy++) {
        const row = (cj * POOL + dy) * NX + ci * POOL
        for (let dx = 0; dx < POOL; dx++) s += fine[row + dx]
      }
      coarse[ci + cj * CX] = s * inv
    }
  }
}

/** Bilinear interpolation, coarse → fine, coarse samples sitting at block centers. */
export function prolong(coarse: Float32Array, fine: Float32Array): void {
  const half = (POOL - 1) / 2
  for (let j = 0; j < NY; j++) {
    const y = Math.min(Math.max((j - half) / POOL, 0), CY - 1)
    const j0 = Math.min(Math.floor(y), CY - 1)
    const j1 = Math.min(j0 + 1, CY - 1)
    const ty = y - j0
    for (let i = 0; i < NX; i++) {
      const x = Math.min(Math.max((i - half) / POOL, 0), CX - 1)
      const i0 = Math.min(Math.floor(x), CX - 1)
      const i1 = Math.min(i0 + 1, CX - 1)
      const tx = x - i0
      const a = coarse[i0 + j0 * CX]
      const b = coarse[i1 + j0 * CX]
      const c = coarse[i0 + j1 * CX]
      const d = coarse[i1 + j1 * CX]
      fine[i + j * NX] = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
    }
  }
}

// ------------------------------------------------------------------ forward

/** Every intermediate the backward pass needs. Allocated once, reused per sample. */
export interface Activations {
  inp: Float32Array // IN_CH × CX × CY  (normalized divergence, solid fraction)
  z1: Float32Array // CH × CX × CY  pre-tanh
  a1: Float32Array // CH × CX × CY  post-tanh
  z2: Float32Array
  a2: Float32Array
  out: Float32Array // 1 × CX × CY  coarse p̂
  fine: Float32Array // NX × NY      prolonged, before scaling
  scale: number // RMS(b) · SCALE
}

export function makeActivations(): Activations {
  return {
    inp: new Float32Array(IN_CH * CX * CY),
    z1: new Float32Array(CH * CX * CY),
    a1: new Float32Array(CH * CX * CY),
    z2: new Float32Array(CH * CX * CY),
    a2: new Float32Array(CH * CX * CY),
    out: new Float32Array(CX * CY),
    fine: new Float32Array(NX * NY),
    scale: 0,
  }
}

/** Coarse solid fraction — cached per case, it never changes during a solve. */
export function solidFraction(solid: Uint8Array, coarse: Float32Array): void {
  const inv = 1 / (POOL * POOL)
  for (let cj = 0; cj < CY; cj++) {
    for (let ci = 0; ci < CX; ci++) {
      let s = 0
      for (let dy = 0; dy < POOL; dy++) {
        const row = (cj * POOL + dy) * NX + ci * POOL
        for (let dx = 0; dx < POOL; dx++) s += solid[row + dx]
      }
      coarse[ci + cj * CX] = s * inv
    }
  }
}

/**
 * The proposal. Writes p₀ into `p0` and returns the activations for training.
 * A zero field gets a zero proposal — the normalization has nothing to divide by
 * and the honest answer is "no opinion", not a silent NaN.
 */
export function propose(
  g: Grid,
  w: NetWeights,
  b: FloatArr,
  solidCoarse: Float32Array,
  p0: FloatArr,
  act: Activations,
): Activations {
  const s = rms(g, b)
  act.scale = s * SCALE
  if (s === 0) {
    p0.fill(0)
    act.out.fill(0)
    act.fine.fill(0)
    return act
  }
  const bc = act.inp.subarray(0, CX * CY)
  restrict(b, bc)
  for (let k = 0; k < CX * CY; k++) bc[k] /= s
  act.inp.set(solidCoarse, CX * CY)

  conv2d(act.inp, w.w1, w.b1, IN_CH, CH, act.z1)
  for (let k = 0; k < act.z1.length; k++) act.a1[k] = Math.tanh(act.z1[k])
  conv2d(act.a1, w.w2, w.b2, CH, CH, act.z2)
  for (let k = 0; k < act.z2.length; k++) act.a2[k] = Math.tanh(act.z2[k])
  conv2d(act.a2, w.w3, w.b3, CH, 1, act.out)

  prolong(act.out, act.fine)
  const { nx, ny, solid } = g
  p0.fill(0)
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const k = i + j * nx
      if (solid[k]) continue
      p0[k] = act.fine[k] * act.scale
    }
  }
  return act
}
