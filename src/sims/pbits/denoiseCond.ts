// Part 3 — the conditioned kernel: ONE energy model for all noise levels,
// the level entering as extra CLAMPED input spins (the σ_t-embedding trick in
// EBM form; formally just a thermodynamic kernel with a wider clamp set —
// Part 2's formalism doing new work).
//
//   E_θ(x_t, τ_t, w, y) = −b·y − c·w − [x_t, τ_t]ᵀU y − wᵀW y    (β = 1)
//
// where τ_t is a 2-spin binary code for t ∈ {1, 2, 3}. The τ spins live on
// the CLAMPED side by construction: they are part of the input vector the
// sampler never touches — in the positive phase, the negative phase, and
// generation alike they are written, never drawn. (That is also why they cost
// clamp price, not mixing: MET's clamped-spin exemption, and why the
// conditioned chain's clamp events write 16 + 2 nodes.)
//
// denoise.ts is FROZEN, so this module is a sibling, not a patch: the input
// dimension is 18 while denoise's DenoiseModel ties inputs to outputs at nv,
// so the field/CD/exact machinery is mirrored here for the wider clamp set.
// Everything auditable audits: `specialize` folds a fixed τ-code into the
// output biases and returns a plain denoise-shaped model, and the check
// script asserts the reduction identity — the conditioned kernel at fixed t
// IS a specialist, exactly, state by state over all 2^16 outputs.

import {
  FLIP_P,
  forwardChain,
  N_LEVELS,
  NV,
  TRAIN_DEFAULTS,
  type DenoiseModel,
} from './denoise'
import { u01 } from './lib'

export { FLIP_P, N_LEVELS, NV, TRAIN_DEFAULTS }

export const TAU_SPINS = 2
export const N_IN = NV + TAU_SPINS // 18 clamped inputs: 16 pixels + the τ code

/** The 2-spin level code, t = 1..3: (+,−), (−,+), (+,+). Never (−,−) — three
 *  levels, three codewords, pairwise Hamming distance ≥ 1 in spin space. */
export function tauCode(t: number): Int8Array {
  return Int8Array.from([(t & 1) !== 0 ? 1 : -1, (t & 2) !== 0 ? 1 : -1])
}

/** The widened clamp vector [x_t, τ_t]. */
export function condInput(xt: Int8Array, t: number): Int8Array {
  const xin = new Int8Array(N_IN)
  xin.set(xt, 0)
  xin.set(tauCode(t), NV)
  return xin
}

export interface CondModel {
  nh: number
  b: Float32Array // NV output biases
  c: Float32Array // nh hidden biases
  U: Float32Array // N_IN × NV, U[i*NV + j] couples clamped input i to output j
  W: Float32Array // nh × NV
}

export function initCondModel(nh: number, seed: number): CondModel {
  const small = (site: number, salt: number) => (u01(seed, 0, site, salt) - 0.5) * 0.02
  return {
    nh,
    b: new Float32Array(NV),
    c: new Float32Array(nh),
    U: Float32Array.from({ length: N_IN * NV }, (_, i) => small(i, 1)),
    W: Float32Array.from({ length: nh * NV }, (_, i) => small(i, 2)),
  }
}

function condYField(m: CondModel, xin: Int8Array, w: Int8Array, out: Float64Array): void {
  for (let j = 0; j < NV; j++) {
    let f = m.b[j]
    for (let i = 0; i < N_IN; i++) f += xin[i] * m.U[i * NV + j]
    for (let k = 0; k < m.nh; k++) f += w[k] * m.W[k * NV + j]
    out[j] = f
  }
}

function condWField(m: CondModel, y: Int8Array, out: Float64Array): void {
  for (let k = 0; k < m.nh; k++) {
    let f = m.c[k]
    for (let j = 0; j < NV; j++) f += y[j] * m.W[k * NV + j]
    out[k] = f
  }
}

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f))

type Rand = (site: number, salt: number) => number

/** k sweeps of exact block Gibbs on (y, w) with the whole [x, τ] side
 *  clamped — same bipartite rescue as denoise.ts, wider clamp set. */
function condNegChromatic(
  m: CondModel,
  xin: Int8Array,
  y: Int8Array,
  w: Int8Array,
  k: number,
  rand: Rand,
  wMean: Float64Array,
): void {
  const fy = new Float64Array(NV)
  const fw = new Float64Array(m.nh)
  condWField(m, y, fw) // in case k = 0
  for (let step = 0; step < k; step++) {
    condYField(m, xin, w, fy)
    for (let j = 0; j < NV; j++) y[j] = rand(j, 8 * step + 1) < sigma2(fy[j]) ? 1 : -1
    condWField(m, y, fw)
    for (let kk = 0; kk < m.nh; kk++) w[kk] = rand(kk, 8 * step + 2) < sigma2(fw[kk]) ? 1 : -1
  }
  for (let kk = 0; kk < m.nh; kk++) wMean[kk] = Math.tanh(fw[kk])
}

interface CondGrad {
  b: Float64Array
  c: Float64Array
  U: Float64Array
  W: Float64Array
  count: number
}

function freshCondGrad(m: CondModel): CondGrad {
  return {
    b: new Float64Array(NV),
    c: new Float64Array(m.nh),
    U: new Float64Array(N_IN * NV),
    W: new Float64Array(m.nh * NV),
    count: 0,
  }
}

/** CD-k for one (x_t at level t, y = x_{t−1}) pair — denoise.ts's machinery
 *  with the level riding in the clamp set. */
function condCdAccumulate(
  m: CondModel,
  xin: Int8Array,
  y: Int8Array,
  k: number,
  rand: Rand,
  grad: CondGrad,
): void {
  const fw = new Float64Array(m.nh)
  condWField(m, y, fw)
  const wPlus = new Float64Array(m.nh)
  for (let kk = 0; kk < m.nh; kk++) wPlus[kk] = Math.tanh(fw[kk])
  const yNeg = Int8Array.from(y)
  const wNeg = new Int8Array(m.nh)
  for (let kk = 0; kk < m.nh; kk++) wNeg[kk] = rand(kk, 0) < sigma2(fw[kk]) ? 1 : -1
  const wMinus = new Float64Array(m.nh)
  condNegChromatic(m, xin, yNeg, wNeg, k, rand, wMinus)
  for (let j = 0; j < NV; j++) {
    const dy = y[j] - yNeg[j]
    grad.b[j] += dy
    if (dy !== 0) for (let i = 0; i < N_IN; i++) grad.U[i * NV + j] += xin[i] * dy
  }
  for (let kk = 0; kk < m.nh; kk++) {
    grad.c[kk] += wPlus[kk] - wMinus[kk]
    for (let j = 0; j < NV; j++)
      grad.W[kk * NV + j] += wPlus[kk] * y[j] - wMinus[kk] * yNeg[j]
  }
  grad.count++
}

function applyCondGrad(m: CondModel, grad: CondGrad, lr: number, decay = 1e-4): void {
  const s = lr / Math.max(grad.count, 1)
  for (let j = 0; j < NV; j++) m.b[j] += s * grad.b[j]
  for (let kk = 0; kk < m.nh; kk++) m.c[kk] += s * grad.c[kk]
  for (let i = 0; i < N_IN * NV; i++) m.U[i] += s * grad.U[i] - lr * decay * m.U[i]
  for (let i = 0; i < m.nh * NV; i++) m.W[i] += s * grad.W[i] - lr * decay * m.W[i]
}

export interface CondTrainConfig {
  nh: number
  epochs: number
  drawsPerGlyph: number
  k: number
  lr: number
  seed: number
}

export interface CondTrainer {
  model: CondModel
  readonly epoch: number
  runEpochs(n: number): void
}

/** One model, all levels: the same forward-chain data stream as denoise's
 *  createTrainer (same seeds, same corruption draws, same epoch count = the
 *  same total data budget), every level's pairs accumulating into the ONE
 *  shared gradient. Negative phase is chromatic only — the conditioned
 *  kernel exists to run on the fabric's legal schedule. */
export function createCondTrainer(data: Int8Array[], cfg: CondTrainConfig): CondTrainer {
  const model = initCondModel(cfg.nh, cfg.seed + 101)
  let epoch = 0
  return {
    model,
    get epoch() {
      return epoch
    },
    runEpochs(n: number) {
      for (let e = 0; e < n; e++) {
        const grad = freshCondGrad(model)
        for (let g = 0; g < data.length; g++) {
          for (let d = 0; d < cfg.drawsPerGlyph; d++) {
            const run = (epoch * data.length + g) * cfg.drawsPerGlyph + d
            const frames = forwardChain(data[g], cfg.seed ^ 0x5f2d, run)
            for (let t = 1; t <= N_LEVELS; t++) {
              condCdAccumulate(
                model,
                condInput(frames[t], t),
                frames[t - 1],
                cfg.k,
                (site, salt) => u01(cfg.seed, run * 31 + t, site, salt),
                grad,
              )
            }
          }
        }
        const lrE = cfg.lr / (1 + epoch * 0.01)
        applyCondGrad(model, grad, lrE)
        epoch++
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Generation and exact machinery.
// ---------------------------------------------------------------------------

/** One reverse step at level t: clamp [x_t, τ_t], block-Gibbs (w, y). */
export function reverseStepCond(
  m: CondModel,
  xt: Int8Array,
  t: number,
  sweeps: number,
  seed: number,
  run: number,
): Int8Array {
  const xin = condInput(xt, t)
  const y = Int8Array.from(xt)
  const w = new Int8Array(m.nh)
  const fw = new Float64Array(m.nh)
  condWField(m, y, fw)
  for (let kk = 0; kk < m.nh; kk++) w[kk] = u01(seed, run, kk, 3) < sigma2(fw[kk]) ? 1 : -1
  condNegChromatic(m, xin, y, w, sweeps, (site, salt) => u01(seed, run, site, 16 + salt), fw)
  return y
}

/** Full dream from fair coins, one kernel serving every level. */
export function dreamCond(
  m: CondModel,
  seed: number,
  run: number,
  sweeps = 6,
): Int8Array[] {
  let x: Int8Array = new Int8Array(NV)
  for (let i = 0; i < NV; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
  const frames = [x]
  for (let t = N_LEVELS; t >= 1; t--) {
    x = reverseStepCond(m, x, t, sweeps, seed, run * 16 + t)
    frames.push(x)
  }
  return frames
}

/**
 * Fold a fixed level code into the biases: b'_j = b_j + Σ_τ code·U_τj, keep
 * the first NV rows of U — the result is a plain DenoiseModel, and the
 * conditioned kernel at fixed t must equal it EXACTLY (the reduction identity
 * the check asserts against denoise.ts's own exactConditional). This is also
 * the boundary claim in prose form: hold the τ code fixed and the conditioned
 * kernel IS a specialist.
 */
export function specialize(m: CondModel, t: number): DenoiseModel {
  const code = tauCode(t)
  const b = Float32Array.from(m.b)
  for (let j = 0; j < NV; j++) {
    for (let k = 0; k < TAU_SPINS; k++) b[j] += code[k] * m.U[(NV + k) * NV + j]
  }
  return {
    nv: NV,
    nh: m.nh,
    b,
    c: Float32Array.from(m.c),
    U: Float32Array.from(m.U.subarray(0, NV * NV)),
    W: Float32Array.from(m.W),
  }
}

function log2cosh(a: number): number {
  const t = Math.abs(a)
  return t + Math.log1p(Math.exp(-2 * t))
}

/** The conditioned kernel's exact single-step conditional K̃(y | x_t, τ_t)
 *  over all 2^16 outputs — hidden spins marginalized in closed form (no w–w
 *  couplings), same derivation as denoise.ts's exactConditional. */
export function exactCondConditional(m: CondModel, xt: Int8Array, t: number): Float64Array {
  const xin = condInput(xt, t)
  const a = new Float64Array(NV)
  for (let j = 0; j < NV; j++) {
    let f = m.b[j]
    for (let i = 0; i < N_IN; i++) f += xin[i] * m.U[i * NV + j]
    a[j] = f
  }
  const size = 1 << NV
  const logw = new Float64Array(size)
  const y = new Int8Array(NV)
  let max = -Infinity
  for (let idx = 0; idx < size; idx++) {
    for (let j = 0; j < NV; j++) y[j] = (idx >> j) & 1 ? 1 : -1
    let lw = 0
    for (let j = 0; j < NV; j++) lw += a[j] * y[j]
    for (let k = 0; k < m.nh; k++) {
      let f = m.c[k]
      for (let j = 0; j < NV; j++) f += y[j] * m.W[k * NV + j]
      lw += log2cosh(f)
    }
    logw[idx] = lw
    if (lw > max) max = lw
  }
  const p = new Float64Array(size)
  let z = 0
  for (let idx = 0; idx < size; idx++) {
    const w = Math.exp(logw[idx] - max)
    p[idx] = w
    z += w
  }
  for (let idx = 0; idx < size; idx++) p[idx] /= z
  return p
}
