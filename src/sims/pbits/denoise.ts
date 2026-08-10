// ACT IV trainer — a TRUE conditional reverse-diffusion loop on 4×4 glyphs.
//
// Forward: bit-flip corruption, a simple stochastic program (a for-loop with a
// biased coin per pixel) — NOT the machine's native act. Per noise level t a
// conditional energy model
//
//   E_θ(x_t, w, y) = −b·y − c·w − x_tᵀU y − wᵀW y      (β = 1 throughout)
//
// with the noisy input x_t ALWAYS clamped, y the 16 output p-bits, w a handful
// of hidden p-bits. There are no y–y and no w–w couplings, so {y} and {w} are
// the two colors of a bipartite graph by construction: "all y at once, then
// all w at once" is exact block Gibbs — the same red/black rescue as §6.
//
// Training is contrastive divergence (CD-k): positive phase clamps x_t AND y
// and reads the hidden statistics exactly (w given y factorizes, so tanh of
// the field IS ⟨w⟩ — no sampling noise); negative phase clamps only x_t and
// runs k block-Gibbs sweeps of (w, y) starting from the data. Each parameter
// moves by the disagreement between the two phases. The negative-phase
// sampler is a sum type — chromatic (correct) or synchronous (the §5 crime,
// implemented faithfully so its damage to LEARNING can be measured, F29).
//
// Everything auditable here audits: the closed-form hidden-spin
// marginalization is checked against lib.ts's exact enumerator on a reduced
// model in scripts/check-pbit-act4.ts, and learned kernels are compared to
// the exact data reverse kernel (a 6-glyph mixture, computable in closed
// form) over all 2^16 output states.

import { u01 } from './lib'
import { GLYPH_PIX } from './glyphs'

export const NV = GLYPH_PIX // 16 visible pixels
export const N_LEVELS = 3
/** Per-step flip probabilities p_t, t = 1..3. The last is ½: the final frame
 * is fair coins, so generation can start from pure noise. In β language the
 * keep-probability is σ(2β_t), i.e. β_t = ½·ln((1−p_t)/p_t); β_3 = 0. */
export const FLIP_P: readonly number[] = [0.08, 0.2, 0.5]

export function flipAt(t: number, scale = 1): number {
  // The LAST step is pinned at ½ regardless of scale — not merely capped:
  // the final frame must be fair coins at every knob setting, or the prose's
  // "cannot get any deader" and generation-from-pure-noise premise both break
  // at scale < 1 (figure audit found the cap-only version reading 20%,
  // 2026-08-11).
  if (t === N_LEVELS) return 0.5
  return Math.min(0.5, FLIP_P[t - 1] * scale)
}

/** Cumulative probability that a pixel differs from the clean glyph after t steps. */
export function cumulativeFlip(t: number, scale = 1): number {
  let rho = 0
  for (let s = 1; s <= t; s++) {
    const p = flipAt(s, scale)
    rho = rho * (1 - p) + (1 - rho) * p
  }
  return rho
}

/** The forward corruption chain: frames[t] is x_t, frames[0] the clean glyph. */
export function forwardChain(
  glyph: Int8Array,
  seed: number,
  run: number,
  scale = 1,
): Int8Array[] {
  const frames = [Int8Array.from(glyph)]
  for (let t = 1; t <= N_LEVELS; t++) {
    const prev = frames[t - 1]
    const next = new Int8Array(NV)
    const p = flipAt(t, scale)
    for (let i = 0; i < NV; i++) next[i] = u01(seed, run, i, 100 + t) < p ? -prev[i] : prev[i]
    frames.push(next)
  }
  return frames
}

// ---------------------------------------------------------------------------
// The per-level conditional model.
// ---------------------------------------------------------------------------

export interface DenoiseModel {
  nv: number
  nh: number
  b: Float32Array // nv — output biases
  c: Float32Array // nh — hidden biases
  U: Float32Array // nv*nv, U[i*nv + j] couples clamped x_i to output y_j
  W: Float32Array // nh*nv, W[k*nv + j] couples hidden w_k to output y_j
}

export function initModel(nv: number, nh: number, seed: number): DenoiseModel {
  const small = (site: number, salt: number) => (u01(seed, 0, site, salt) - 0.5) * 0.02
  return {
    nv,
    nh,
    b: new Float32Array(nv),
    c: new Float32Array(nh),
    U: Float32Array.from({ length: nv * nv }, (_, i) => small(i, 1)),
    W: Float32Array.from({ length: nh * nv }, (_, i) => small(i, 2)),
  }
}

export function cloneModel(m: DenoiseModel): DenoiseModel {
  return {
    nv: m.nv,
    nh: m.nh,
    b: Float32Array.from(m.b),
    c: Float32Array.from(m.c),
    U: Float32Array.from(m.U),
    W: Float32Array.from(m.W),
  }
}

/** Local field on output y_j given clamped x and hidden w. */
export function yFieldInto(
  m: DenoiseModel,
  x: Int8Array,
  w: Int8Array,
  out: Float64Array,
): void {
  for (let j = 0; j < m.nv; j++) {
    let f = m.b[j]
    for (let i = 0; i < m.nv; i++) f += x[i] * m.U[i * m.nv + j]
    for (let k = 0; k < m.nh; k++) f += w[k] * m.W[k * m.nv + j]
    out[j] = f
  }
}

/** Local field on hidden w_k given outputs y. */
export function wFieldInto(m: DenoiseModel, y: Int8Array, out: Float64Array): void {
  for (let k = 0; k < m.nh; k++) {
    let f = m.c[k]
    for (let j = 0; j < m.nv; j++) f += y[j] * m.W[k * m.nv + j]
    out[k] = f
  }
}

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f)) // P(s=+1) = σ(2f), β = 1

export type Rand = (site: number, salt: number) => number

// ---------------------------------------------------------------------------
// The negative-phase sampler — a sum type, one clean handler each.
// ---------------------------------------------------------------------------

export type NegSampler = { kind: 'chromatic' } | { kind: 'synchronous' }

/** k sweeps of exact block Gibbs: all y given (x, w), then all w given y —
 * legal because the (y, w) graph is bipartite by construction. `wMean`
 * receives ⟨w⟩ under the field the final w was actually drawn from (the fresh
 * y — the exact Rao–Blackwellized statistic for this sampler). */
function negChromatic(
  m: DenoiseModel,
  x: Int8Array,
  y: Int8Array,
  w: Int8Array,
  k: number,
  rand: Rand,
  wMean: Float64Array,
): void {
  const fy = new Float64Array(m.nv)
  const fw = new Float64Array(m.nh)
  for (let step = 0; step < k; step++) {
    yFieldInto(m, x, w, fy)
    for (let j = 0; j < m.nv; j++) y[j] = rand(j, 8 * step + 1) < sigma2(fy[j]) ? 1 : -1
    wFieldInto(m, y, fw)
    for (let kk = 0; kk < m.nh; kk++) w[kk] = rand(kk, 8 * step + 2) < sigma2(fw[kk]) ? 1 : -1
  }
  for (let kk = 0; kk < m.nh; kk++) wMean[kk] = Math.tanh(fw[kk])
}

/** k sweeps of the §5 crime: every free spin updates at once, each reading the
 * OLD state — y consults stale w while w consults stale y. Not Gibbs. The
 * final hidden statistic is honestly the sampler's own: ⟨w⟩ under the STALE
 * field it actually drew from, not a fresh read that would quietly repair the
 * damage. (In this bipartite graph the stale reads decouple the two layers,
 * so the negative cross-statistics ⟨w y⟩⁻ collapse toward ⟨w⟩⟨w y⟩-free
 * products — that decoupling is exactly the bias F29 measures.) */
function negSynchronous(
  m: DenoiseModel,
  x: Int8Array,
  y: Int8Array,
  w: Int8Array,
  k: number,
  rand: Rand,
  wMean: Float64Array,
): void {
  const fy = new Float64Array(m.nv)
  const fw = new Float64Array(m.nh)
  wFieldInto(m, y, fw) // in case k = 0
  for (let step = 0; step < k; step++) {
    yFieldInto(m, x, w, fy) // reads old w
    wFieldInto(m, y, fw) // reads old y
    for (let j = 0; j < m.nv; j++) y[j] = rand(j, 8 * step + 1) < sigma2(fy[j]) ? 1 : -1
    for (let kk = 0; kk < m.nh; kk++) w[kk] = rand(kk, 8 * step + 2) < sigma2(fw[kk]) ? 1 : -1
  }
  for (let kk = 0; kk < m.nh; kk++) wMean[kk] = Math.tanh(fw[kk])
}

function runNegChain(
  m: DenoiseModel,
  sampler: NegSampler,
  x: Int8Array,
  y: Int8Array,
  w: Int8Array,
  k: number,
  rand: Rand,
  wMean: Float64Array,
): void {
  switch (sampler.kind) {
    case 'chromatic':
      return negChromatic(m, x, y, w, k, rand, wMean)
    case 'synchronous':
      return negSynchronous(m, x, y, w, k, rand, wMean)
  }
}

/** Gradient accumulator, same shape as the model's parameters. */
export interface Grad {
  b: Float64Array
  c: Float64Array
  U: Float64Array
  W: Float64Array
  count: number
}

export function freshGrad(m: DenoiseModel): Grad {
  return {
    b: new Float64Array(m.nv),
    c: new Float64Array(m.nh),
    U: new Float64Array(m.nv * m.nv),
    W: new Float64Array(m.nh * m.nv),
    count: 0,
  }
}

/**
 * CD-k statistics for one (x_t, y = x_{t−1}) pair, accumulated into `grad`.
 * Positive-phase hidden statistics are exact (tanh of the field — w
 * factorizes given y); the negative chain starts at the data and runs k
 * sweeps of the chosen sampler; final hidden statistics again read as tanh.
 * Each accumulated term is (positive stat − negative stat).
 */
export function cdAccumulate(
  m: DenoiseModel,
  x: Int8Array,
  y: Int8Array,
  sampler: NegSampler,
  k: number,
  rand: Rand,
  grad: Grad,
): void {
  const fw = new Float64Array(m.nh)
  // positive phase: x and y clamped; ⟨w_k⟩⁺ = tanh(field)
  wFieldInto(m, y, fw)
  const wPlus = new Float64Array(m.nh)
  for (let kk = 0; kk < m.nh; kk++) wPlus[kk] = Math.tanh(fw[kk])
  // negative phase: only x clamped; chain starts from the data
  const yNeg = Int8Array.from(y)
  const wNeg = new Int8Array(m.nh)
  for (let kk = 0; kk < m.nh; kk++) wNeg[kk] = rand(kk, 0) < sigma2(fw[kk]) ? 1 : -1
  const wMinus = new Float64Array(m.nh)
  runNegChain(m, sampler, x, yNeg, wNeg, k, rand, wMinus)
  // the subtraction
  for (let j = 0; j < m.nv; j++) {
    const dy = y[j] - yNeg[j]
    grad.b[j] += dy
    if (dy !== 0) for (let i = 0; i < m.nv; i++) grad.U[i * m.nv + j] += x[i] * dy
  }
  for (let kk = 0; kk < m.nh; kk++) {
    grad.c[kk] += wPlus[kk] - wMinus[kk]
    for (let j = 0; j < m.nv; j++)
      grad.W[kk * m.nv + j] += wPlus[kk] * y[j] - wMinus[kk] * yNeg[j]
  }
  grad.count++
}

/** Apply the mean accumulated gradient at learning rate lr, with a small
 * weight decay on the couplings to keep the landscape from running away. */
export function applyGrad(m: DenoiseModel, grad: Grad, lr: number, decay = 1e-4): void {
  const s = lr / Math.max(grad.count, 1)
  for (let j = 0; j < m.nv; j++) m.b[j] += s * grad.b[j]
  for (let kk = 0; kk < m.nh; kk++) m.c[kk] += s * grad.c[kk]
  for (let i = 0; i < m.nv * m.nv; i++) m.U[i] += s * grad.U[i] - lr * decay * m.U[i]
  for (let i = 0; i < m.nh * m.nv; i++) m.W[i] += s * grad.W[i] - lr * decay * m.W[i]
}

// ---------------------------------------------------------------------------
// The trainer — one model per noise level, trained on fresh forward chains.
// ---------------------------------------------------------------------------

export interface TrainConfig {
  nh: number
  epochs: number
  drawsPerGlyph: number
  k: number
  lr: number
  sampler: NegSampler
  seed: number
}

export const TRAIN_DEFAULTS: Omit<TrainConfig, 'sampler' | 'seed' | 'nh'> = {
  epochs: 400,
  drawsPerGlyph: 8,
  k: 10,
  lr: 0.2,
}

export interface Trainer {
  models: DenoiseModel[]
  readonly epoch: number
  /** Run n epochs (one pass over every glyph × drawsPerGlyph fresh corruptions). */
  runEpochs(n: number): void
}

export function createTrainer(data: Int8Array[], cfg: TrainConfig): Trainer {
  const models = Array.from({ length: N_LEVELS }, (_, t) =>
    initModel(NV, cfg.nh, cfg.seed + 7 * t),
  )
  let epoch = 0
  return {
    models,
    get epoch() {
      return epoch
    },
    runEpochs(n: number) {
      for (let e = 0; e < n; e++) {
        const grads = models.map(freshGrad)
        for (let g = 0; g < data.length; g++) {
          for (let d = 0; d < cfg.drawsPerGlyph; d++) {
            const run = (epoch * data.length + g) * cfg.drawsPerGlyph + d
            const frames = forwardChain(data[g], cfg.seed ^ 0x5f2d, run)
            for (let t = 1; t <= N_LEVELS; t++) {
              cdAccumulate(
                models[t - 1],
                frames[t],
                frames[t - 1],
                cfg.sampler,
                cfg.k,
                (site, salt) => u01(cfg.seed, run * 31 + t, site, salt),
                grads[t - 1],
              )
            }
          }
        }
        // annealed step: the minibatch mean gradient, cooled as evidence piles up
        const lrE = cfg.lr / (1 + epoch * 0.01)
        for (let t = 0; t < N_LEVELS; t++) applyGrad(models[t], grads[t], lrE)
        epoch++
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Generation — the reverse chain. x_T is fair coins; for t = T…1 clamp x_t,
// block-Gibbs (w, y), and the sampled y steps down to x_{t−1}.
// ---------------------------------------------------------------------------

export function reverseStep(
  m: DenoiseModel,
  xt: Int8Array,
  sweeps: number,
  seed: number,
  run: number,
): Int8Array {
  const y = Int8Array.from(xt) // warm start at the noisy input
  const w = new Int8Array(m.nh)
  const fw = new Float64Array(m.nh)
  wFieldInto(m, y, fw)
  for (let kk = 0; kk < m.nh; kk++) w[kk] = u01(seed, run, kk, 3) < sigma2(fw[kk]) ? 1 : -1
  negChromatic(m, xt, y, w, sweeps, (site, salt) => u01(seed, run, site, 16 + salt), fw)
  return y
}

/** Full dream: returns frames [x_T, …, x_1, x_0]. */
export function dream(
  models: DenoiseModel[],
  seed: number,
  run: number,
  sweeps = 6,
): Int8Array[] {
  let x: Int8Array = new Int8Array(NV)
  for (let i = 0; i < NV; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
  const frames = [x]
  for (let t = N_LEVELS; t >= 1; t--) {
    x = reverseStep(models[t - 1], x, sweeps, seed, run * 16 + t)
    frames.push(x)
  }
  return frames
}

// ---------------------------------------------------------------------------
// Exact machinery. The hidden spins marginalize in closed form (no w–w
// couplings): log Σ_w e^{−E} = a·y + Σ_k log 2cosh(c_k + (W y)_k) with
// a_j = b_j + Σ_i x_i U_ij. This closed form is itself audited against
// lib.ts's brute-force enumerator on a reduced model in the check script.
// ---------------------------------------------------------------------------

function log2cosh(a: number): number {
  const t = Math.abs(a)
  return t + Math.log1p(Math.exp(-2 * t))
}

/** The model's exact single-step kernel K̃(y | x) over all 2^nv output states.
 * State index convention matches lib.stateIndex: bit j set ⇔ y_j = +1. */
export function exactConditional(m: DenoiseModel, x: Int8Array): Float64Array {
  const a = new Float64Array(m.nv)
  for (let j = 0; j < m.nv; j++) {
    let f = m.b[j]
    for (let i = 0; i < m.nv; i++) f += x[i] * m.U[i * m.nv + j]
    a[j] = f
  }
  const size = 1 << m.nv
  const logw = new Float64Array(size)
  const y = new Int8Array(m.nv)
  let max = -Infinity
  for (let idx = 0; idx < size; idx++) {
    for (let j = 0; j < m.nv; j++) y[j] = (idx >> j) & 1 ? 1 : -1
    let lw = 0
    for (let j = 0; j < m.nv; j++) lw += a[j] * y[j]
    for (let k = 0; k < m.nh; k++) {
      let f = m.c[k]
      for (let j = 0; j < m.nv; j++) f += y[j] * m.W[k * m.nv + j]
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

function bitsOf(s: Int8Array): number {
  let idx = 0
  for (let k = 0; k < s.length; k++) if (s[k] > 0) idx |= 1 << k
  return idx
}

function popcount(v: number): number {
  v = v - ((v >> 1) & 0x55555555)
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333)
  return (Math.imul((v + (v >> 4)) & 0x0f0f0f0f, 0x01010101) >> 24) & 31
}

/**
 * The TRUE reverse kernel q(x_{t−1} = y | x_t), computed exactly from the
 * data process: a mixture over glyphs of per-pixel Bernoulli terms,
 * q(y | x_t) ∝ Σ_g P(x_{t−1} = y | g) · P(x_t | x_{t−1} = y).
 * This is the oracle the learned kernels are audited against.
 */
export function exactDataReverse(
  glyphs: Int8Array[],
  t: number,
  xt: Int8Array,
  scale = 1,
): Float64Array {
  const rho = cumulativeFlip(t - 1, scale)
  const p = flipAt(t, scale)
  const logRho = [Math.log(1 - rho), Math.log(Math.max(rho, 1e-300))]
  const logP = [Math.log(1 - p), Math.log(p)]
  const gBits = glyphs.map(bitsOf)
  const xBits = bitsOf(xt)
  const size = 1 << NV
  const logw = new Float64Array(size)
  let max = -Infinity
  for (let idx = 0; idx < size; idx++) {
    const dX = popcount(idx ^ xBits)
    const stepTerm = dX * logP[1] + (NV - dX) * logP[0]
    let mix = -Infinity
    for (let g = 0; g < gBits.length; g++) {
      const dG = popcount(idx ^ gBits[g])
      const lw = dG * logRho[1] + (NV - dG) * logRho[0]
      mix = mix > lw ? mix + Math.log1p(Math.exp(lw - mix)) : lw + Math.log1p(Math.exp(mix - lw))
    }
    const lw = stepTerm + mix
    logw[idx] = lw
    if (lw > max) max = lw
  }
  const q = new Float64Array(size)
  let z = 0
  for (let idx = 0; idx < size; idx++) {
    const w = Math.exp(logw[idx] - max)
    q[idx] = w
    z += w
  }
  for (let idx = 0; idx < size; idx++) q[idx] /= z
  return q
}

/** Marginal of a full 2^16 distribution onto a small pixel patch (≤ 4 sites →
 * 16 columns, the same meter width as §5's auditable corner). */
export function marginalPatch(p: Float64Array, sites: number[]): Float64Array {
  const out = new Float64Array(1 << sites.length)
  for (let idx = 0; idx < p.length; idx++) {
    let sub = 0
    for (let k = 0; k < sites.length; k++) if ((idx >> sites[k]) & 1) sub |= 1 << k
    out[sub] += p[idx]
  }
  return out
}

/** Exact mean negative log-likelihood of pairs (x_t, y) under a model. */
export function exactNLL(m: DenoiseModel, pairs: Array<{ x: Int8Array; y: Int8Array }>): number {
  let total = 0
  for (const { x, y } of pairs) {
    const p = exactConditional(m, x)
    total += -Math.log(Math.max(p[bitsOf(y)], 1e-300))
  }
  return total / pairs.length
}

/** Mean pairwise product ⟨y_a y_b⟩ over a set of samples, all a < b pairs. */
export function pairwiseCorr(samples: Int8Array[]): Float64Array {
  const out = new Float64Array((NV * (NV - 1)) / 2)
  for (const s of samples) {
    let k = 0
    for (let a = 0; a < NV; a++)
      for (let b = a + 1; b < NV; b++) out[k++] += s[a] * s[b]
  }
  for (let k = 0; k < out.length; k++) out[k] /= Math.max(samples.length, 1)
  return out
}

export function corrError(a: Float64Array, b: Float64Array): number {
  let e = 0
  for (let k = 0; k < a.length; k++) e += Math.abs(a[k] - b[k])
  return e / a.length
}
