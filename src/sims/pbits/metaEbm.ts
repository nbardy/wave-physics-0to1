// Act IV core (Part 2, PLAN §8, F14–F16) — the meta-EBM: a 12-spin model the
// fabric cannot express, and its compilation into per-site Gibbs-update
// kernels whose higher-order terms are realized by soft-product hidden-spin
// gates. Per the Thermalizers meta-EBM construction (arXiv:2608.01615 §IV D —
// VERIFIED against the primary source, see articles/06-z1-compiler/RESEARCH.md):
// the target is SPARSE — fields + 18 of the 66 possible pairwise terms + 20
// three-body terms, magnitudes ~ N(0, 0.6²), d = 12. The impossibility has
// two legs: three-body terms have ZERO native support in pairwise Ising, and
// the target's pair graph is not the fabric's graph. The COMPILATION, like
// the paper's, is over a fully connected spin set with J_max (the coupling
// dynamic range) as the single knob — the paper states the Z1 connectivity
// residual "is not simulated," so no number measured here includes a
// fabric-placement penalty, and the checks label it that way. Kernel logit
// θ_n(x) = W_n + ½ΣW_mn x_m + ⅙ΣW⁽³⁾x_m x_m′; each hyperedge realized on the
// substrate by ONE hidden spin via the soft-product gate
// ½[sp(−2(αᵀz−β)) − sp(−2(αᵀz+β))]. Their measured contraction ρ₀ = 0.28
// (exact diagonalization), floor ≈ 0.6× the Eq (43) bound δ̃_t ≤ ε̄/(1−ρ₀),
// error saturating within ~3 sweeps — our checks reproduce the construction
// and the saturation shape at our own numbers.
//
// lib.ts is frozen — this file imports its RNG/oracle vocabulary and adds the
// three-body layer beside it, never inside it.
//
// ---------------------------------------------------------------------------
// The gate's exact algebra (this file's load-bearing derivation)
// ---------------------------------------------------------------------------
// Eq (42), verified: θ_y(x) = J_xyᵀx + h_y + Σ_a ½[sp(−2(α_aᵀx − β_a)) −
// sp(−2(α_aᵀx + β_a))], α_a the input-to-hidden coupling, β_a the hidden
// spin's coupling to the output. Write sp(z) = ln(1+eᶻ). Using
// sp(−2q) = −q + ln 2cosh(q),
//   gate(t) = ½[sp(−2(t−β)) − sp(−2(t+β))] = β + ½ ln[cosh(t−β)/cosh(t+β)],
// i.e. β plus an ODD function G(t) — which is exactly the marginalized
// hidden spin's contribution to the output logit, up to sign and constant.
// One subtlety the formula's notation hides: with a purely LINEAR projection
// t = αᵀx the gate is constant-plus-odd in x, so its bilinear (x_m·x_m′)
// content is identically zero for ANY α — an odd function of a linear form
// cannot produce an even term. The hidden spin needs a native bias to break
// the symmetry; α_aᵀx must be read as the hidden spin's full input field.
// We align the projection with the pair and give the hidden spin bias s·a:
//   t = a·(x_m + x_m′) + s·a,   s = sign(W).
// On the four input corners t takes the three values a·(u+s), u = x_m+x_m′ ∈
// {2, 0, −2}, so EXACTLY (softness included — three points, three
// coefficients):
//   gate = A + B·u + C·x_m x_m′,
//   C = ¼[gate(u=2) − 2·gate(u=0) + gate(u=−2)] = s·¼[G(3a) − 3G(a)].
// A (a constant) and B·u (one wire to each partner) are native Ising
// vocabulary — the compiler cancels them with programmed field/coupling
// offsets and keeps C·x_m x_m′: one hidden spin IS a product term, plus
// furniture the fabric already owns.
//
// Calibration: in the hard limit a → ∞ with δ := 3a − β held fixed,
// C → ⅛ ln(1 + e^{2δ}), so δ(W) = ½ ln(e^{8|W|} − 1) makes C → |W| exactly,
// and the finite-a softness residual |C − |W|| dies like e^{−4a} (the
// nearest neglected ln-cosh tail sits at argument 2a − δ), which is the
// paper's "sharpens the softplus difference toward a ReLU… residual that
// decays exponentially in the coupling magnitude."
// scripts/check-metaebm.ts measures the decay rate and asserts it.

import { u01, tvDistance } from './lib'

export const META_D = 12
export const META_PAIRS = 18
export const META_TRIPLES = 20
export const META_SIGMA = 0.6
export const META_SEED = 1612 // the Torx arXiv id, as a hat-tip

// ---------------------------------------------------------------------------
// Deterministic Gaussians — Box–Muller over lib's counter RNG. No Math.random
// anywhere in this act; a model is a pure function of its seed.
// ---------------------------------------------------------------------------

export function gaussHash(seed: number, sweep: number, site: number): number {
  const u1 = Math.max(u01(seed, sweep, site, 0), 1e-12)
  const u2 = u01(seed, sweep, site, 1)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ---------------------------------------------------------------------------
// The target model — canonical value, built once by κ. β (inverse temp) = 1,
// folded into the coefficients, as everywhere in Part 2.
// ---------------------------------------------------------------------------

export interface PairTerm {
  m: number
  n: number
  J: number
}

export interface TripleTerm {
  m: number
  mp: number
  n: number
  W: number
}

export interface MetaModel {
  d: number
  h: Float64Array
  pairs: PairTerm[]
  triples: TripleTerm[]
  /** Per-site views so a field evaluation is O(degree), not O(terms). */
  pairAt: Array<Array<{ other: number; J: number }>>
  tripleAt: Array<Array<{ a: number; b: number; W: number }>>
}

/** Seeded k-of-n pick: partial Fisher–Yates over the counter RNG. */
function pickK<T>(items: T[], k: number, seed: number, sweep: number): T[] {
  const arr = items.slice()
  for (let i = 0; i < k; i++) {
    const r = i + Math.floor(u01(seed, sweep, i, 2) * (arr.length - i))
    const tmp = arr[i]
    arr[i] = arr[r]
    arr[r] = tmp
  }
  return arr.slice(0, k)
}

export function buildMetaModel(seed = META_SEED): MetaModel {
  const d = META_D
  const allPairs: Array<[number, number]> = []
  for (let i = 0; i < d; i++) for (let j = i + 1; j < d; j++) allPairs.push([i, j])
  const allTriples: Array<[number, number, number]> = []
  for (let i = 0; i < d; i++)
    for (let j = i + 1; j < d; j++) for (let k = j + 1; k < d; k++) allTriples.push([i, j, k])

  const pairs: PairTerm[] = pickK(allPairs, META_PAIRS, seed, 1).map(([m, n], t) => ({
    m,
    n,
    J: META_SIGMA * gaussHash(seed, 3, t),
  }))
  const triples: TripleTerm[] = pickK(allTriples, META_TRIPLES, seed, 2).map(([m, mp, n], t) => ({
    m,
    mp,
    n,
    W: META_SIGMA * gaussHash(seed, 4, t),
  }))
  const h = Float64Array.from({ length: d }, (_, n) => META_SIGMA * gaussHash(seed, 5, n))

  const pairAt: MetaModel['pairAt'] = Array.from({ length: d }, () => [])
  for (const { m, n, J } of pairs) {
    pairAt[m].push({ other: n, J })
    pairAt[n].push({ other: m, J })
  }
  const tripleAt: MetaModel['tripleAt'] = Array.from({ length: d }, () => [])
  for (const { m, mp, n, W } of triples) {
    tripleAt[m].push({ a: mp, b: n, W })
    tripleAt[mp].push({ a: m, b: n, W })
    tripleAt[n].push({ a: m, b: mp, W })
  }
  return { d, h, pairs, triples, pairAt, tripleAt }
}

/** The figure's marquee hyperedge: the largest-|W| three-body term. */
export function marqueeTriple(m: MetaModel): TripleTerm {
  let best = m.triples[0]
  for (const t of m.triples) if (Math.abs(t.W) > Math.abs(best.W)) best = t
  return best
}

// ---------------------------------------------------------------------------
// Exact law and exact conditionals — the oracle side.
// ---------------------------------------------------------------------------

/** −E(x) with β = 1: Σh·x + ΣJ·xx + ΣW·xxx. */
export function metaLogWeight(m: MetaModel, x: Int8Array): number {
  let lw = 0
  for (let n = 0; n < m.d; n++) lw += m.h[n] * x[n]
  for (const { m: a, n: b, J } of m.pairs) lw += J * x[a] * x[b]
  for (const { m: a, mp: b, n: c, W } of m.triples) lw += W * x[a] * x[b] * x[c]
  return lw
}

export function decodeState(idx: number, d: number, out: Int8Array): void {
  for (let k = 0; k < d; k++) out[k] = (idx >> k) & 1 ? 1 : -1
}

/**
 * Exact Boltzmann law over all 2^12 = 4096 states, in log space (the exp-
 * overflow bug from walkCompile's ledger — ~50 terms of magnitude ~0.6 push
 * raw weights past double range at the tails, so normalize under a max-shift).
 */
export function enumerateMeta(m: MetaModel): Float64Array {
  const size = 1 << m.d
  const lw = new Float64Array(size)
  const x = new Int8Array(m.d)
  let peak = -Infinity
  for (let idx = 0; idx < size; idx++) {
    decodeState(idx, m.d, x)
    lw[idx] = metaLogWeight(m, x)
    if (lw[idx] > peak) peak = lw[idx]
  }
  let z = 0
  for (let idx = 0; idx < size; idx++) {
    lw[idx] = Math.exp(lw[idx] - peak)
    z += lw[idx]
  }
  for (let idx = 0; idx < size; idx++) lw[idx] /= z
  return lw
}

/**
 * The exact Gibbs-update logit at site n (x[n] itself unread): this is the
 * paper's θ_n(x) with our per-term bookkeeping — fields + pairwise partners +
 * the product of each hyperedge's other two spins.
 */
export function targetField(m: MetaModel, x: Int8Array, n: number): number {
  let f = m.h[n]
  const pa = m.pairAt[n]
  for (let k = 0; k < pa.length; k++) f += pa[k].J * x[pa[k].other]
  const ta = m.tripleAt[n]
  for (let k = 0; k < ta.length; k++) f += ta[k].W * x[ta[k].a] * x[ta[k].b]
  return f
}

// ---------------------------------------------------------------------------
// The soft-product gate.
// ---------------------------------------------------------------------------

export function softplus(z: number): number {
  return Math.max(z, 0) + Math.log1p(Math.exp(-Math.abs(z)))
}

/** The paper's gate, evaluated as written: ½[sp(−2(t−β)) − sp(−2(t+β))]. */
export function gateRamp(t: number, beta: number): number {
  return 0.5 * (softplus(-2 * (t - beta)) - softplus(-2 * (t + beta)))
}

export interface SoftGate {
  /** The two partner sites (the hyperedge minus this kernel's output site). */
  m: number
  mp: number
  /** The target coefficient's sign, carried by the hidden spin's bias s·a. */
  s: number
  /** Coupling magnitude (the article's J_max knob) and output coupling β. */
  a: number
  beta: number
  /** Exact constant content — cancelled by a native field offset at n. */
  A: number
  /** Exact linear content per partner — cancelled by native m–n wires. */
  B: number
  /** Exact realized product coefficient (signed) — the analytic oracle. */
  C: number
  /** The target coefficient this gate was calibrated to. */
  W: number
}

/** δ(W): the threshold offset that makes the hard-limit coefficient exact. */
export function gateDelta(absW: number): number {
  return 0.5 * Math.log(Math.expm1(8 * absW))
}

export function makeGate(a: number, W: number, m: number, mp: number): SoftGate {
  const s = W < 0 ? -1 : 1
  const beta = 3 * a - gateDelta(Math.abs(W))
  // The gate at the three reachable projection values a·(u+s), u ∈ {2,0,−2}.
  const g2 = gateRamp(a * (2 + s), beta)
  const g0 = gateRamp(a * s, beta)
  const gm2 = gateRamp(a * (-2 + s), beta)
  return {
    m,
    mp,
    s,
    a,
    beta,
    A: (g2 + 2 * g0 + gm2) / 4,
    B: (g2 - gm2) / 4,
    C: (g2 - 2 * g0 + gm2) / 4,
    W,
  }
}

/**
 * The gate's contribution to the output site's logit, evaluated FROM THE
 * SUBSTRATE FORMULA (not from the analytic C — the checks hold the two
 * equal): the Eq-42 softplus difference over the input projection, minus the
 * native offsets that cancel its constant and linear content. Equals
 * C·x_m·x_m′ exactly on the corners.
 */
export function gateLogit(g: SoftGate, xm: number, xmp: number): number {
  const u = xm + xmp
  return gateRamp(g.a * (u + g.s), g.beta) - g.A - g.B * u
}

// ---------------------------------------------------------------------------
// The compiled model: per-site Gibbs kernels, higher-order terms via gates.
// One hidden spin per hyperedge per kernel — each of the 20 triples appears
// in three site kernels, so the compilation spends 60 hidden-spin instances
// (the paper's budget: up to n_h = 8 hidden per site).
// ---------------------------------------------------------------------------

export interface CompiledMeta {
  target: MetaModel
  jGate: number
  gateAt: SoftGate[][]
  hiddenSpins: number
}

export function compileMeta(target: MetaModel, jGate: number): CompiledMeta {
  const gateAt: SoftGate[][] = Array.from({ length: target.d }, () => [])
  let hiddenSpins = 0
  for (const { m, mp, n, W } of target.triples) {
    gateAt[n].push(makeGate(jGate, W, m, mp))
    gateAt[m].push(makeGate(jGate, W, mp, n))
    gateAt[mp].push(makeGate(jGate, W, m, n))
    hiddenSpins += 3
  }
  return { target, jGate, gateAt, hiddenSpins }
}

/** The compiled kernel's logit at site n: native terms + gate contributions. */
export function compiledField(cm: CompiledMeta, x: Int8Array, n: number): number {
  const m = cm.target
  let f = m.h[n]
  const pa = m.pairAt[n]
  for (let k = 0; k < pa.length; k++) f += pa[k].J * x[pa[k].other]
  const ga = cm.gateAt[n]
  for (let k = 0; k < ga.length; k++) f += gateLogit(ga[k], x[ga[k].m], x[ga[k].mp])
  return f
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/**
 * One full sweep of a per-site Gibbs chain, propagated EXACTLY: the
 * 4096-state distribution pushed through the twelve site-update kernels in
 * order, each site's conditional given by `field`. No sampling noise — so
 * chain errors can be measured as full 4096-state TV, the strictest
 * available metric. (The on-canvas occupancy bars instead use a 4-site
 * marginal: 4096 bars are unreadable and a sampled count per state would be
 * noise; the projection is where sampled evidence and exact law can meet
 * honestly at figure scale.)
 */
function sweepExactKernel(
  d: number,
  p: Float64Array,
  field: (x: Int8Array, n: number) => number,
): void {
  const x = new Int8Array(d)
  for (let n = 0; n < d; n++) {
    const bit = 1 << n
    for (let idx = 0; idx < p.length; idx++) {
      if (idx & bit) continue
      const idx1 = idx | bit
      decodeState(idx, d, x)
      const pPlus = sigmoid(2 * field(x, n))
      const mass = p[idx] + p[idx1]
      p[idx] = mass * (1 - pPlus)
      p[idx1] = mass * pPlus
    }
  }
}

/** One exact sweep of the COMPILED chain (gate-realized kernels). */
export function sweepExactCompiled(cm: CompiledMeta, p: Float64Array): void {
  sweepExactKernel(cm.target.d, p, (x, n) => compiledField(cm, x, n))
}

/** One exact sweep of the IDEAL chain (the target's own Gibbs conditionals). */
export function sweepExactTarget(m: MetaModel, p: Float64Array): void {
  sweepExactKernel(m.d, p, (x, n) => targetField(m, x, n))
}

/**
 * The papers' saturation quantity (Thermalizers §IV D / Eq (43)): the
 * layer-wise error δ̃_t = TV(compiled chain at sweep t, ideal Gibbs chain at
 * sweep t), both propagated exactly from the same uniform start. Per the
 * contraction story δ̃_t ≤ ε̄/(1−ρ₀), it accumulates for a few sweeps and
 * then SATURATES at a depth-independent floor — it does not grow with depth,
 * and it is NOT the mixing curve (this model's own mixing is much slower
 * than its compilation error; measured in scripts/check-metaebm.ts).
 * Compilation is over a fully connected spin set, as in the paper — the Z1
 * connectivity residual is out of scope here ("not simulated" in §IV D).
 */
export function deltaCurve(cm: CompiledMeta, sweeps: number): Float64Array {
  const size = 1 << cm.target.d
  const pc = new Float64Array(size).fill(1 / size)
  const pi = new Float64Array(size).fill(1 / size)
  const dv = new Float64Array(sweeps + 1)
  for (let t = 1; t <= sweeps; t++) {
    sweepExactCompiled(cm, pc)
    sweepExactTarget(cm.target, pi)
    dv[t] = tvDistance(pc, pi)
  }
  return dv
}

/** TV-to-exact-law after each sweep, from a uniform start (mixing + floor). */
export function tvCurveExact(cm: CompiledMeta, exact: Float64Array, sweeps: number): Float64Array {
  const size = 1 << cm.target.d
  const p = new Float64Array(size).fill(1 / size)
  const tv = new Float64Array(sweeps + 1)
  tv[0] = tvDistance(exact, p)
  for (let t = 1; t <= sweeps; t++) {
    sweepExactCompiled(cm, p)
    tv[t] = tvDistance(exact, p)
  }
  return tv
}

/** One sampled sweep of the compiled chain (sequential through the sites). */
export function sweepSampledCompiled(
  cm: CompiledMeta,
  s: Int8Array,
  rand: (site: number, salt: number) => number,
): void {
  for (let n = 0; n < cm.target.d; n++) {
    s[n] = rand(n, 0) < sigmoid(2 * compiledField(cm, s, n)) ? 1 : -1
  }
}

// ---------------------------------------------------------------------------
// Projections for the figure meter.
// ---------------------------------------------------------------------------

/** Marginal of a full 2^d law onto a subset of sites (their bit order). */
export function marginalize(p: Float64Array, _d: number, sites: number[]): Float64Array {
  const out = new Float64Array(1 << sites.length)
  for (let idx = 0; idx < p.length; idx++) {
    let sub = 0
    for (let k = 0; k < sites.length; k++) if ((idx >> sites[k]) & 1) sub |= 1 << k
    out[sub] += p[idx]
  }
  return out
}

/**
 * The meter's projection: the four sites carrying the most three-body terms —
 * the corner of the model where the fabric's missing vocabulary matters most.
 */
export function projSites(m: MetaModel): number[] {
  const load = Array.from({ length: m.d }, (_, n) => ({ n, k: m.tripleAt[n].length }))
  load.sort((p, q) => q.k - p.k || p.n - q.n)
  return load
    .slice(0, 4)
    .map((e) => e.n)
    .sort((p, q) => p - q)
}
