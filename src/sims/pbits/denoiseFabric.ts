// Part 3, Act IV — the fabric-native conditional denoiser (PLAN F11).
//
// The 4×4 trainer of denoise.ts invented its own graph: dense U from every
// clamped input pixel to every output pixel, a private clique of hidden units.
// This module hangs the SAME kind of model on the real Z1 fabric instead, and
// the architecture is a PLACEMENT DECISION, not a design:
//
//   - The 64 visible pixels are the cells (2gx, 2gy) of a 16×16 torus patch —
//     one pixel per even-even cell. Every such cell has color (x+y) mod 2 = 0,
//     so the visible set sits on ONE color class, which is the layering
//     theorem's load-bearing condition (z1.ts, found 2026-08-05).
//   - The hidden units are simply THE REST OF THE PATCH, re-hung by BFS
//     distance from the visible set (layersFromVisible). With this placement
//     the layers are forced by the offset rules' odd parity: layer 0 = the 64
//     even-even pixels, layer 1 = the 128 odd-parity cells (every one is a
//     single knight-move from some pixel), layer 2 = the 64 odd-odd cells —
//     asserted, not trusted, in scripts/check-part3b.ts. Nobody designed a
//     three-layer deep Boltzmann machine; the placement did.
//   - Couplings exist ONLY where the fabric routes a wire: one J per real z1
//     edge of the patch (2,048 of them), nothing else. There is literally no
//     wire between two pixels — every offset has odd parity, so pixel–pixel
//     correlation is carried entirely by the hidden layers.
//
// Where the evidence enters (a modeling choice, stated once): the noisy input
// x_t arrives as a per-pixel programmable BIAS u_p·x_p on its own pixel —
// physically, a clamped p-bit fused to that pixel's bias line. The dense U of
// the 4×4 model does not exist here because the fabric routes no such wires;
// the diagonal is all the evidence path there is. Everything else (b, J) is
// per-node / per-edge, flashable.
//
// Training is CD-k with the honest phase machinery of denoise.ts, generalized:
// hidden–hidden edges exist (layer 1 ↔ layer 2), so neither phase factorizes —
// both run real chromatic block-Gibbs sweeps on the fabric's own two-coloring
// (legal by the odd-parity theorem), and statistics are averaged over the last
// few sweeps of each chain rather than read in closed form. The negative-phase
// sampler is the same sum type as denoise.ts — chromatic (correct) or
// synchronous (the §5 crime, stale fields read faithfully) — one clean handler
// each.
//
// At 64 visible pixels the joint oracle is DEAD (2^64 states; lib.MAX_EXACT is
// 20 and stays 20). That is the point of this module: every audit below is one
// of the surviving witnesses Part 1's ending promised —
//   W0 exact sub-oracle   — a 4-node fenced sub-model IS enumerable (subModel +
//                           enumerate); the sweep machinery is checked against it.
//   W1 fenced conditional — on a small pixel window, BOTH the model's exact
//                           conditional and the true data-reverse conditional
//                           (given the same context) are closed-form; their TV
//                           is the honest stand-in for the dead full-state KL.
//   W2 pinned moments     — pairwise ⟨y_a y_b⟩ of dreams vs the glyph family.
//   W3 known-answer probe — corrupt a held-out draw, denoise it, count pixels.
//   W4 autocorrelation    — integrated τ of the visible magnetization.
// Each check in scripts/check-part3b.ts names the witness it leans on.

import { buildModel, enumerate, subModel, u01, type Edge, type PbitModel } from './lib'
import { flipAt, cumulativeFlip, N_LEVELS } from './denoise'
import { layersFromVisible, z1Graph, type Z1Graph } from './z1'
import { GLYPH8_PIX, GLYPH8_SIDE } from './glyphs8'

export const PATCH_W = 16
export const PATCH_H = 16
/** The whole model's physical footprint in p-bits — pixels AND hidden layers.
 * This number feeds the ceiling chart's self-consistency check (PLAN F12). */
export const FABRIC_FOOTPRINT = PATCH_W * PATCH_H // 256

// ---------------------------------------------------------------------------
// Placement — κ for the fabric: built once, canonical thereafter.
// ---------------------------------------------------------------------------

export interface FabricPlacement {
  g: Z1Graph
  /** visible[p] = fabric node of glyph pixel p (row-major 8×8). */
  visible: Int32Array
  /** pixOf[node] = pixel index, or −1 for hidden nodes. */
  pixOf: Int32Array
  /** BFS layer of every node (0 = visible). */
  layer: Int32Array
  nLayers: number
  /** Per node: neighbor node ids and the shared edge's index into J. */
  nbrNode: Int32Array[]
  nbrEdge: Int32Array[]
}

export function placeGlyph8(): FabricPlacement {
  const g = z1Graph(PATCH_W, PATCH_H)
  const visible = new Int32Array(GLYPH8_PIX)
  const pixOf = new Int32Array(g.n).fill(-1)
  for (let gy = 0; gy < GLYPH8_SIDE; gy++) {
    for (let gx = 0; gx < GLYPH8_SIDE; gx++) {
      const p = gy * GLYPH8_SIDE + gx
      const node = 2 * gy * PATCH_W + 2 * gx
      visible[p] = node
      pixOf[node] = p
    }
  }
  const layer = layersFromVisible(g, [...visible])
  let nLayers = 0
  for (let i = 0; i < g.n; i++) nLayers = Math.max(nLayers, layer[i] + 1)
  const nbrNode: number[][] = Array.from({ length: g.n }, () => [])
  const nbrEdge: number[][] = Array.from({ length: g.n }, () => [])
  g.edges.forEach(([i, j], e) => {
    nbrNode[i].push(j)
    nbrEdge[i].push(e)
    nbrNode[j].push(i)
    nbrEdge[j].push(e)
  })
  return {
    g,
    visible,
    pixOf,
    layer,
    nLayers,
    nbrNode: nbrNode.map((a) => Int32Array.from(a)),
    nbrEdge: nbrEdge.map((a) => Int32Array.from(a)),
  }
}

// ---------------------------------------------------------------------------
// The model — biases per node, evidence weights per pixel, one J per real edge.
// ---------------------------------------------------------------------------

export interface FabricModel {
  /** per-node bias, length g.n */
  b: Float32Array
  /** per-pixel evidence weight (the diagonal input path), length 64 */
  u: Float32Array
  /** per-EDGE coupling, aligned with placement.g.edges */
  J: Float32Array
}

export function initFabricModel(pl: FabricPlacement, seed: number): FabricModel {
  const small = (i: number, salt: number) => (u01(seed, 0, i, salt) - 0.5) * 0.02
  return {
    b: new Float32Array(pl.g.n),
    u: Float32Array.from({ length: GLYPH8_PIX }, (_, i) => small(i, 1)),
    J: Float32Array.from({ length: pl.g.edges.length }, (_, i) => small(i, 2)),
  }
}

export function cloneFabricModel(m: FabricModel): FabricModel {
  return { b: Float32Array.from(m.b), u: Float32Array.from(m.u), J: Float32Array.from(m.J) }
}

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f)) // P(s=+1) = σ(2f), β = 1

export type Rand = (site: number, salt: number) => number

/** Local field on node i given the full patch state and the clamped evidence. */
export function fabricField(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  i: number,
): number {
  let f = m.b[i]
  const p = pl.pixOf[i]
  if (p >= 0) f += m.u[p] * x[p]
  const nn = pl.nbrNode[i]
  const ne = pl.nbrEdge[i]
  for (let k = 0; k < nn.length; k++) f += m.J[ne[k]] * s[nn[k]]
  return f
}

// ---------------------------------------------------------------------------
// Sweeps — the same sum type as denoise.ts's negative sampler, one clean
// handler each. `freeVisible` is the phase switch: positive phase clamps the
// pixels (only hidden moves), negative phase and generation free them.
// ---------------------------------------------------------------------------

export type FabricSampler = { kind: 'chromatic' } | { kind: 'synchronous' }

/** One chromatic sweep: all color-0 free sites (reading current state), then
 * all color-1 — legal block Gibbs because no fabric edge joins a color to
 * itself (odd-parity offsets; enforced by z1Chromatic elsewhere, re-asserted
 * against lib's sub-oracle in check-part3b W0). */
function sweepFabricChromatic(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  freeVisible: boolean,
  rand: Rand,
): void {
  const n = pl.g.n
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < n; i++) {
      if (pl.g.colors[i] !== c) continue
      if (!freeVisible && pl.pixOf[i] >= 0) continue
      s[i] = rand(i, c) < sigma2(fabricField(m, pl, x, s, i)) ? 1 : -1
    }
  }
}

/** The §5 crime on the fabric: every free site updates at once, each reading
 * the OLD state — neighbors decide on each other's stale values. Not Gibbs;
 * implemented faithfully so its damage to learning stays measurable at this
 * scale too. */
function sweepFabricSynchronous(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  freeVisible: boolean,
  rand: Rand,
): void {
  const n = pl.g.n
  const old = Int8Array.from(s)
  for (let i = 0; i < n; i++) {
    if (!freeVisible && pl.pixOf[i] >= 0) continue
    let f = m.b[i]
    const p = pl.pixOf[i]
    if (p >= 0) f += m.u[p] * x[p]
    const nn = pl.nbrNode[i]
    const ne = pl.nbrEdge[i]
    for (let k = 0; k < nn.length; k++) f += m.J[ne[k]] * old[nn[k]]
    s[i] = rand(i, 0) < sigma2(f) ? 1 : -1
  }
}

export function sweepFabric(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  freeVisible: boolean,
  sampler: FabricSampler,
  rand: Rand,
): void {
  switch (sampler.kind) {
    case 'chromatic':
      return sweepFabricChromatic(m, pl, x, s, freeVisible, rand)
    case 'synchronous':
      return sweepFabricSynchronous(m, pl, x, s, freeVisible, rand)
  }
}

// ---------------------------------------------------------------------------
// The forward chain at 64 pixels — same corruption schedule as Part 1
// (flipAt / N_LEVELS imported, not re-invented), new side.
// ---------------------------------------------------------------------------

export function forwardChain8(
  glyph: Int8Array,
  seed: number,
  run: number,
  scale = 1,
): Int8Array[] {
  const frames = [Int8Array.from(glyph)]
  for (let t = 1; t <= N_LEVELS; t++) {
    const prev = frames[t - 1]
    const next = new Int8Array(GLYPH8_PIX)
    const p = flipAt(t, scale)
    for (let i = 0; i < GLYPH8_PIX; i++)
      next[i] = u01(seed, run, i, 100 + t) < p ? -prev[i] : prev[i]
    frames.push(next)
  }
  return frames
}

// ---------------------------------------------------------------------------
// CD-k on the fabric. Neither phase factorizes (hidden–hidden edges exist),
// so both run sweeps; statistics are averaged over the last `avg` sweeps.
// ---------------------------------------------------------------------------

export interface FabricGrad {
  b: Float64Array
  u: Float64Array
  J: Float64Array
  count: number
}

export function freshFabricGrad(pl: FabricPlacement): FabricGrad {
  return {
    b: new Float64Array(pl.g.n),
    u: new Float64Array(GLYPH8_PIX),
    J: new Float64Array(pl.g.edges.length),
    count: 0,
  }
}

/** Run `total` sweeps; over the last `avg` of them accumulate ⟨s_i⟩ into
 * `mean` and ⟨s_i s_j⟩ per edge into `pair` (both scaled by 1/avg). */
function chainStats(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  freeVisible: boolean,
  sampler: FabricSampler,
  total: number,
  avg: number,
  rand: (sweep: number, site: number, salt: number) => number,
  mean: Float64Array,
  pair: Float64Array,
): void {
  const edges = pl.g.edges
  const inv = 1 / avg
  for (let sw = 0; sw < total; sw++) {
    sweepFabric(m, pl, x, s, freeVisible, sampler, (site, salt) => rand(sw, site, salt))
    if (sw >= total - avg) {
      for (let i = 0; i < s.length; i++) mean[i] += s[i] * inv
      for (let e = 0; e < edges.length; e++) pair[e] += s[edges[e][0]] * s[edges[e][1]] * inv
    }
  }
}

/**
 * One (x_t, y = x_{t−1}) pair's CD statistics, accumulated into `grad`.
 * Positive phase: pixels clamped at y, hidden sampled (kPos sweeps).
 * Negative phase: everything free, chain starts from the positive phase's
 * final state (the data, dressed with its own hidden explanation), kNeg sweeps.
 */
export function cdFabricAccumulate(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  y: Int8Array,
  sampler: FabricSampler,
  kPos: number,
  kNeg: number,
  avg: number,
  rand: (phase: number, sweep: number, site: number, salt: number) => number,
  grad: FabricGrad,
): void {
  const n = pl.g.n
  const s = new Int8Array(n)
  for (let i = 0; i < n; i++) {
    const p = pl.pixOf[i]
    s[i] = p >= 0 ? y[p] : rand(0, 0, i, 7) < 0.5 ? -1 : 1
  }
  const meanP = new Float64Array(n)
  const pairP = new Float64Array(pl.g.edges.length)
  chainStats(m, pl, x, s, false, sampler, kPos, avg, (sw, site, salt) => rand(1, sw, site, salt), meanP, pairP)
  // positive-phase pixel statistics are the data itself (clamped)
  const meanM = new Float64Array(n)
  const pairM = new Float64Array(pl.g.edges.length)
  chainStats(m, pl, x, s, true, sampler, kNeg, avg, (sw, site, salt) => rand(2, sw, site, salt), meanM, pairM)
  for (let i = 0; i < n; i++) grad.b[i] += meanP[i] - meanM[i]
  for (let e = 0; e < pl.g.edges.length; e++) grad.J[e] += pairP[e] - pairM[e]
  for (let p = 0; p < GLYPH8_PIX; p++) {
    const i = pl.visible[p]
    grad.u[p] += x[p] * (meanP[i] - meanM[i])
  }
  grad.count++
}

export function applyFabricGrad(
  m: FabricModel,
  grad: FabricGrad,
  lr: number,
  decay = 1e-4,
): void {
  const sc = lr / Math.max(grad.count, 1)
  for (let i = 0; i < m.b.length; i++) m.b[i] += sc * grad.b[i]
  for (let p = 0; p < m.u.length; p++) m.u[p] += sc * grad.u[p]
  for (let e = 0; e < m.J.length; e++) m.J[e] += sc * grad.J[e] - lr * decay * m.J[e]
}

// ---------------------------------------------------------------------------
// The trainer — one model per noise level, denoise.ts's shape re-hung.
// ---------------------------------------------------------------------------

export interface FabricTrainConfig {
  epochs: number
  drawsPerGlyph: number
  kPos: number
  kNeg: number
  avg: number
  lr: number
  sampler: FabricSampler
  seed: number
}

/** Tuned 2026-08-25 against the witness set (scratchpad sweep, four configs ×
 * three generation budgets): epochs 700 / kNeg 20 gave the best pinned-moments
 * error (0.11) with all seven glyphs represented in 300 dreams (no mode
 * collapse); shorter runs denoise fine but dream mushier. Training wall-clock
 * ~80 s in bun — offline only; the figure ships the weights. */
export const FABRIC_TRAIN_DEFAULTS: Omit<FabricTrainConfig, 'sampler' | 'seed'> = {
  epochs: 700,
  drawsPerGlyph: 6,
  kPos: 3,
  kNeg: 20,
  avg: 2,
  lr: 0.12,
}

export interface FabricTrainer {
  models: FabricModel[]
  readonly epoch: number
  runEpochs(n: number): void
}

export function createFabricTrainer(
  data: Int8Array[],
  pl: FabricPlacement,
  cfg: FabricTrainConfig,
): FabricTrainer {
  const models = Array.from({ length: N_LEVELS }, (_, t) => initFabricModel(pl, cfg.seed + 7 * t))
  let epoch = 0
  return {
    models,
    get epoch() {
      return epoch
    },
    runEpochs(n: number) {
      for (let e = 0; e < n; e++) {
        const grads = models.map(() => freshFabricGrad(pl))
        for (let g = 0; g < data.length; g++) {
          for (let d = 0; d < cfg.drawsPerGlyph; d++) {
            const run = (epoch * data.length + g) * cfg.drawsPerGlyph + d
            const frames = forwardChain8(data[g], cfg.seed ^ 0x5f2d, run)
            for (let t = 1; t <= N_LEVELS; t++) {
              cdFabricAccumulate(
                models[t - 1],
                pl,
                frames[t],
                frames[t - 1],
                cfg.sampler,
                cfg.kPos,
                cfg.kNeg,
                cfg.avg,
                (phase, sw, site, salt) =>
                  u01(cfg.seed, (run * 31 + t) ^ (phase << 20), site, sw * 8 + salt),
                grads[t - 1],
              )
            }
          }
        }
        const lrE = cfg.lr / (1 + epoch * 0.01)
        for (let t = 0; t < N_LEVELS; t++) applyFabricGrad(models[t], grads[t], lrE)
        epoch++
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Generation — the reverse chain on the fabric.
// ---------------------------------------------------------------------------

export function reverseStep8(
  m: FabricModel,
  pl: FabricPlacement,
  xt: Int8Array,
  sweeps: number,
  seed: number,
  run: number,
): Int8Array {
  const s = new Int8Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) {
    const p = pl.pixOf[i]
    s[i] = p >= 0 ? xt[p] : u01(seed, run, i, 3) < 0.5 ? -1 : 1 // warm-start pixels at x_t
  }
  const chrom: FabricSampler = { kind: 'chromatic' }
  // Warm-start the hidden layers from their conditional given the pixels
  // (denoise.ts's reverseStep samples w from its field the same way): two
  // hidden-only sweeps with the pixels held. Without this the free chain
  // opens against random hidden context and `sweeps` of budget go to
  // repairing it instead of denoising (measured: W3 recovery flipped from
  // worse-than-corruption to better once this landed, 2026-08-25).
  for (let sw = 0; sw < 2; sw++)
    sweepFabric(m, pl, xt, s, false, chrom, (site, salt) => u01(seed, run, site, sw * 8 + 200 + salt))
  for (let sw = 0; sw < sweeps; sw++)
    sweepFabric(m, pl, xt, s, true, chrom, (site, salt) => u01(seed, run, site, sw * 8 + 16 + salt))
  const y = new Int8Array(GLYPH8_PIX)
  for (let p = 0; p < GLYPH8_PIX; p++) y[p] = s[pl.visible[p]]
  return y
}

/** Full dream on the fabric: frames [x_T, …, x_1, x_0]. */
export function dream8(
  models: FabricModel[],
  pl: FabricPlacement,
  seed: number,
  run: number,
  sweeps = 6,
): Int8Array[] {
  let x: Int8Array = new Int8Array(GLYPH8_PIX)
  for (let i = 0; i < GLYPH8_PIX; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
  const frames = [x]
  for (let t = N_LEVELS; t >= 1; t--) {
    x = reverseStep8(models[t - 1], pl, x, sweeps, seed, run * 16 + t)
    frames.push(x)
  }
  return frames
}

// ---------------------------------------------------------------------------
// The witnesses. The joint oracle is dead here; these are its survivors.
// ---------------------------------------------------------------------------

/** The whole patch as a lib.ts PbitModel (evidence folded into biases), so
 * lib's frozen sub-oracle machinery (subModel + enumerate) applies verbatim. */
export function toPbitModel(m: FabricModel, pl: FabricPlacement, x: Int8Array): PbitModel {
  const h = new Float64Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) {
    h[i] = m.b[i]
    const p = pl.pixOf[i]
    if (p >= 0) h[i] += m.u[p] * x[p]
  }
  const edges: Edge[] = pl.g.edges.map(([i, j], e) => ({ i, j, J: m.J[e] }))
  return buildModel(pl.g.n, h, edges, 1)
}

/** W1, model side — the model's EXACT conditional over a small node fence,
 * everything else frozen at `s`: lib's subModel + enumerate, both frozen code.
 * Returns 2^|fence| probabilities in lib.stateIndex order. */
export function fencedModelConditional(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  s: Int8Array,
  fenceNodes: number[],
): Float64Array {
  return enumerate(subModel(toPbitModel(m, pl, x), s, fenceNodes))
}

/** W1, truth side — the TRUE data-reverse conditional on a pixel fence given
 * the rest of y and the evidence x_t, exact by the mixture's closed form:
 * P(fence = f | y_rest, x_t) ∝ Σ_g Π_{j∉F} ρ(y_j,g_j) · Π_{j∈F} ρ(f_j,g_j)·π(x_j,f_j)
 * with ρ the cumulative-corruption term at t−1 and π the step-t flip term.
 * The j∉F step terms are constant across fence configs and cancel. */
export function dataFencedConditional(
  glyphs: Int8Array[],
  t: number,
  xt: Int8Array,
  y: Int8Array,
  fencePix: number[],
  scale = 1,
): Float64Array {
  const rho = Math.max(cumulativeFlip(t - 1, scale), 1e-12)
  const p = flipAt(t, scale)
  const logRho = [Math.log(1 - rho), Math.log(rho)]
  const logP = [Math.log(1 - p), Math.log(p)]
  const inF = new Uint8Array(GLYPH8_PIX)
  for (const j of fencePix) inF[j] = 1
  const base = glyphs.map((g) => {
    let lw = 0
    for (let j = 0; j < GLYPH8_PIX; j++) if (!inF[j]) lw += logRho[y[j] === g[j] ? 0 : 1]
    return lw
  })
  const size = 1 << fencePix.length
  const logw = new Float64Array(size)
  let max = -Infinity
  for (let idx = 0; idx < size; idx++) {
    let mix = -Infinity
    for (let gi = 0; gi < glyphs.length; gi++) {
      let lw = base[gi]
      for (let k = 0; k < fencePix.length; k++) {
        const j = fencePix[k]
        const f = (idx >> k) & 1 ? 1 : -1
        lw += logRho[f === glyphs[gi][j] ? 0 : 1] + logP[f === xt[j] ? 0 : 1]
      }
      mix = mix > lw ? mix + Math.log1p(Math.exp(lw - mix)) : lw + Math.log1p(Math.exp(mix - lw))
    }
    logw[idx] = mix
    if (mix > max) max = mix
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

/** The model's conditional on a PIXEL fence given the rest of the pixels and
 * the hidden state — the object W1 compares against dataFencedConditional.
 * (Hidden state enters as frozen context; it is the state the sampler actually
 * holds when the window is read, which is the honest reading.) */
export function modelFencedConditional(
  m: FabricModel,
  pl: FabricPlacement,
  x: Int8Array,
  patchState: Int8Array,
  fencePix: number[],
): Float64Array {
  return fencedModelConditional(m, pl, x, patchState, fencePix.map((p) => pl.visible[p]))
}

/** W2 — mean pairwise product ⟨y_a y_b⟩ over samples, all a < b pairs (the
 * 8×8 sibling of denoise.pairwiseCorr; that one hardcodes 16 pixels). */
export function pairwiseCorr8(samples: Int8Array[]): Float64Array {
  const n = GLYPH8_PIX
  const out = new Float64Array((n * (n - 1)) / 2)
  for (const s of samples) {
    let k = 0
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) out[k++] += s[a] * s[b]
  }
  for (let k = 0; k < out.length; k++) out[k] /= Math.max(samples.length, 1)
  return out
}

/** W4 — integrated autocorrelation time of a scalar series (sweeps), with the
 * standard self-consistent window: sum ρ_k until the window exceeds 5τ. */
export function autocorrTime(series: Float64Array): number {
  const n = series.length
  let mean = 0
  for (let i = 0; i < n; i++) mean += series[i]
  mean /= n
  let var0 = 0
  for (let i = 0; i < n; i++) var0 += (series[i] - mean) ** 2
  var0 /= n
  if (var0 < 1e-12) return 1
  let tau = 1
  for (let k = 1; k < n / 2; k++) {
    let c = 0
    for (let i = 0; i + k < n; i++) c += (series[i] - mean) * (series[i + k] - mean)
    c /= (n - k) * var0
    tau += 2 * c
    if (k >= 5 * tau) break
  }
  return Math.max(tau, 1)
}
