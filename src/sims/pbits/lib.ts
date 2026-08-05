// The p-bit lesson's core: one canonical model, three update schedules as a sum
// type (one handler each — no structural branching past the dispatcher), an
// exact enumerator that is the article's oracle, and the shared meter/rail
// drawing vocabulary. Everything distributional in the lesson audits against
// `enumerate` — the figures are only as honest as this file.

import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, type Rect } from '../lib/chrome'

// ---------------------------------------------------------------------------
// RNG — counter-based, so a trajectory is a pure function of (seed, sweep,
// site, salt). Reset re-runs `create` and reproduces the run exactly; no
// hidden generator state, headless checks are deterministic.
// ---------------------------------------------------------------------------

function mix(x: number): number {
  x |= 0
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad)
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97)
  return (x ^ (x >>> 15)) >>> 0
}

/** Uniform [0,1) from a counter tuple — never from mutable generator state. */
export function u01(seed: number, sweep: number, site: number, salt: number): number {
  let x = mix(seed ^ Math.imul(sweep, 0x9e3779b9))
  x = mix(x ^ Math.imul(site + 1, 0x85ebca6b))
  x = mix(x ^ Math.imul(salt + 1, 0xc2b2ae35))
  return x / 4294967296
}

// ---------------------------------------------------------------------------
// The canonical model. κ (buildModel) does all validation once; the samplers
// assume canonical input and never re-check.
// ---------------------------------------------------------------------------

export interface Edge {
  i: number
  j: number
  J: number
}

export interface PbitModel {
  n: number
  beta: number
  h: Float32Array
  /** Neighbor lists (symmetric — j appears in i's list and vice versa). */
  nbr: Int32Array[]
  wgt: Float32Array[]
  edges: Edge[]
  /** 0 = free, ±1 = clamped to that value. Samplers never touch clamped sites. */
  clamp: Int8Array
}

export function buildModel(
  n: number,
  h: ArrayLike<number>,
  edges: Edge[],
  beta: number,
  clamp?: ArrayLike<number>,
): PbitModel {
  const nbrs: number[][] = Array.from({ length: n }, () => [])
  const wgts: number[][] = Array.from({ length: n }, () => [])
  for (const { i, j, J } of edges) {
    if (i === j || i < 0 || j < 0 || i >= n || j >= n) throw new Error(`bad edge ${i}-${j}`)
    nbrs[i].push(j)
    wgts[i].push(J)
    nbrs[j].push(i)
    wgts[j].push(J)
  }
  return {
    n,
    beta,
    h: Float32Array.from({ length: n }, (_, i) => Number(h[i] ?? 0)),
    nbr: nbrs.map((a) => Int32Array.from(a)),
    wgt: wgts.map((a) => Float32Array.from(a)),
    edges,
    clamp: clamp ? Int8Array.from(clamp as ArrayLike<number>) : new Int8Array(n),
  }
}

/** Fresh spin state: clamped sites at their held value, free sites from the seed. */
export function freshSpins(m: PbitModel, seed: number): Int8Array {
  const s = new Int8Array(m.n)
  for (let i = 0; i < m.n; i++) {
    s[i] = m.clamp[i] !== 0 ? m.clamp[i] : u01(seed, 0, i, 0) < 0.5 ? -1 : 1
  }
  return s
}

export function localField(m: PbitModel, s: Int8Array, i: number): number {
  let f = m.h[i]
  const nb = m.nbr[i]
  const wg = m.wgt[i]
  for (let k = 0; k < nb.length; k++) f += wg[k] * s[nb[k]]
  return f
}

/** The whole update rule: P(sᵢ = +1 | neighbors) = σ(2β · field). */
export function condProbPlus(m: PbitModel, s: Int8Array, i: number): number {
  return 1 / (1 + Math.exp(-2 * m.beta * localField(m, s, i)))
}

export function energy(m: PbitModel, s: Int8Array): number {
  let e = 0
  for (let i = 0; i < m.n; i++) e -= m.h[i] * s[i]
  for (const { i, j, J } of m.edges) e -= J * s[i] * s[j]
  return e
}

// ---------------------------------------------------------------------------
// Schedules — the sum type the whole lesson turns on. The dispatcher is thin;
// each handler is one clean path. `rand(site, salt)` is the caller's counter
// RNG partially applied with (seed, sweep).
// ---------------------------------------------------------------------------

export type Schedule =
  | { kind: 'sequential' }
  | { kind: 'synchronous' }
  | { kind: 'chromatic'; colors: Uint8Array; numColors: number }

export type Rand = (site: number, salt: number) => number

export function sweep(m: PbitModel, s: Int8Array, sched: Schedule, rand: Rand): void {
  switch (sched.kind) {
    case 'sequential':
      return sweepSequential(m, s, rand)
    case 'synchronous':
      return sweepSynchronous(m, s, rand)
    case 'chromatic':
      return sweepChromatic(m, s, sched.colors, sched.numColors, rand)
  }
}

function updateSite(m: PbitModel, s: Int8Array, i: number, u: number): void {
  s[i] = u < condProbPlus(m, s, i) ? 1 : -1
}

/** One site at a time, each reading the freshest state. Correct, serial. */
function sweepSequential(m: PbitModel, s: Int8Array, rand: Rand): void {
  for (let i = 0; i < m.n; i++) {
    if (m.clamp[i] !== 0) continue
    updateSite(m, s, i, rand(i, 0))
  }
}

/**
 * Every site at once, all reading the OLD state — adjacent sites decide on each
 * other's stale values. This is not Gibbs sampling; it is the lesson's marquee
 * wrong answer, implemented faithfully so its wrongness can be measured.
 */
function sweepSynchronous(m: PbitModel, s: Int8Array, rand: Rand): void {
  const old = Int8Array.from(s)
  for (let i = 0; i < m.n; i++) {
    if (m.clamp[i] !== 0) continue
    s[i] = rand(i, 0) < 1 / (1 + Math.exp(-2 * m.beta * localField(m, old, i))) ? 1 : -1
  }
}

/**
 * One pass per color, all sites of a color at once, reading current state.
 * Correctness condition (holds by construction, verified in buildChromatic):
 * no edge joins two sites of the same color, so within a pass every updated
 * site's neighbors are frozen — the parallel update IS a block-Gibbs update.
 */
function sweepChromatic(
  m: PbitModel,
  s: Int8Array,
  colors: Uint8Array,
  numColors: number,
  rand: Rand,
): void {
  for (let c = 0; c < numColors; c++) {
    for (let i = 0; i < m.n; i++) {
      if (m.clamp[i] !== 0 || colors[i] !== c) continue
      updateSite(m, s, i, rand(i, c))
    }
  }
}

/** κ for chromatic schedules: rejects a coloring with an intra-color edge. */
export function buildChromatic(m: PbitModel, colors: Uint8Array, numColors: number): Schedule {
  for (const { i, j } of m.edges) {
    if (colors[i] === colors[j]) throw new Error(`edge ${i}-${j} joins two color-${colors[i]} sites`)
  }
  return { kind: 'chromatic', colors, numColors }
}

// ---------------------------------------------------------------------------
// Grids (the §5–§6 lattice) and their two-coloring.
// ---------------------------------------------------------------------------

export function gridModel(
  w: number,
  hgt: number,
  J: number,
  beta: number,
  clamp?: ArrayLike<number>,
): PbitModel {
  const edges: Edge[] = []
  for (let y = 0; y < hgt; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x + 1 < w) edges.push({ i, j: i + 1, J })
      if (y + 1 < hgt) edges.push({ i, j: i + w, J })
    }
  }
  return buildModel(w * hgt, new Float32Array(w * hgt), edges, beta, clamp)
}

export function twoColorGrid(w: number, hgt: number): Uint8Array {
  const c = new Uint8Array(w * hgt)
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) c[y * w + x] = (x + y) & 1
  return c
}

// ---------------------------------------------------------------------------
// The oracle. State index convention: bit k of the index is 1 ⇔ s[site k] = +1,
// where `sites` orders the subsystem (defaults to all spins).
// ---------------------------------------------------------------------------

export const MAX_EXACT = 20

/** Exact Boltzmann distribution over the free spins of a small model. */
export function enumerate(m: PbitModel): Float64Array {
  if (m.n > MAX_EXACT) throw new Error(`enumerate: ${m.n} spins is past the oracle's edge`)
  const size = 1 << m.n
  const p = new Float64Array(size)
  const s = new Int8Array(m.n)
  let z = 0
  for (let idx = 0; idx < size; idx++) {
    for (let k = 0; k < m.n; k++) s[k] = (idx >> k) & 1 ? 1 : -1
    const w = Math.exp(-m.beta * energy(m, s))
    p[idx] = w
    z += w
  }
  for (let idx = 0; idx < size; idx++) p[idx] /= z
  return p
}

/** Index of the current state of `sites` (defaults to the whole system). */
export function stateIndex(s: Int8Array, sites?: ArrayLike<number>): number {
  let idx = 0
  if (sites) {
    for (let k = 0; k < sites.length; k++) if (s[sites[k]] > 0) idx |= 1 << k
  } else {
    for (let k = 0; k < s.length; k++) if (s[k] > 0) idx |= 1 << k
  }
  return idx
}

/**
 * The conditional model of `sites` given everything else frozen at its current
 * value: outside couplings fold into effective biases; inside edges survive.
 * Exact as long as the complement genuinely stays frozen (ours is clamped).
 */
export function subModel(m: PbitModel, s: Int8Array, sites: number[]): PbitModel {
  const local = new Map<number, number>()
  sites.forEach((site, k) => local.set(site, k))
  const h = new Float64Array(sites.length)
  const edges: Edge[] = []
  sites.forEach((site, k) => {
    h[k] = m.h[site]
    const nb = m.nbr[site]
    const wg = m.wgt[site]
    for (let t = 0; t < nb.length; t++) {
      const other = local.get(nb[t])
      if (other === undefined) h[k] += wg[t] * s[nb[t]]
      else if (other > k) edges.push({ i: k, j: other, J: wg[t] })
    }
  })
  return buildModel(sites.length, h, edges, m.beta)
}

/** Total variation distance between two distributions on the same states. */
export function tvDistance(p: ArrayLike<number>, q: ArrayLike<number>): number {
  let d = 0
  for (let i = 0; i < p.length; i++) d += Math.abs(p[i] - q[i])
  return d / 2
}

export function countsToProbs(counts: Float64Array): Float64Array {
  let total = 0
  for (let i = 0; i < counts.length; i++) total += counts[i]
  const p = new Float64Array(counts.length)
  if (total > 0) for (let i = 0; i < counts.length; i++) p[i] = counts[i] / total
  return p
}

// ---------------------------------------------------------------------------
// The lesson's shared models. One frustrated four-loop is the Act-I
// protagonist: three agree-wires and one disagree-wire around a ring, so no
// state satisfies every wire and the distribution stays honestly spread.
// ---------------------------------------------------------------------------

export function frustratedLoop(beta: number): PbitModel {
  return buildModel(
    4,
    [0, 0, 0, 0],
    [
      { i: 0, j: 1, J: 1 },
      { i: 1, j: 2, J: 1 },
      { i: 2, j: 3, J: 1 },
      { i: 3, j: 0, J: -1 },
    ],
    beta,
  )
}

// ---------------------------------------------------------------------------
// Drawing vocabulary — the meter and the layer rail, shared by every figure.
// ---------------------------------------------------------------------------

// The transformation rail (revised 2026-08-05 after review): not disciplines
// but the pipeline the reader keeps confusing — the distribution you want,
// the (h, J) landscape that encodes it, the schedule that samples it, and
// whatever physically executes the schedule. Thermalizers is the arrow from
// TARGET to ENERGY; the chip lives entirely in SUBSTRATE.
export type LayerName = 'target' | 'energy' | 'sampler' | 'substrate'

const LAYERS: readonly LayerName[] = ['target', 'energy', 'sampler', 'substrate']

/** The persistent three-slot rail: which layer this figure lives on. */
export function drawLayerRail(
  ctx: CanvasRenderingContext2D,
  w: number,
  active: LayerName,
): void {
  ctx.save()
  ctx.font = FONT_LABEL
  ctx.textAlign = 'right'
  let x = w - 10
  for (let k = LAYERS.length - 1; k >= 0; k--) {
    const name = LAYERS[k]
    const on = name === active
    ctx.fillStyle = on ? PALETTE.meter : 'rgba(120,140,170,0.55)'
    ctx.font = on ? '600 11px ui-sans-serif, system-ui' : FONT_LABEL
    ctx.fillText(name.toUpperCase(), x, 16)
    x -= ctx.measureText(name.toUpperCase()).width + 14
    if (k > 0) {
      ctx.fillStyle = 'rgba(120,140,170,0.45)'
      ctx.fillText('·', x + 9, 16)
    }
  }
  ctx.restore()
}

/** One spin as a filled dot in its state's ink. */
export function drawSpin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  s: number,
): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = s > 0 ? PALETTE.sUp : PALETTE.sDn
  ctx.fill()
}

/** The clamp halo — a held spin wears a ring. */
export function drawHalo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath()
  ctx.arc(x, y, r + 3.5, 0, Math.PI * 2)
  ctx.strokeStyle = PALETTE.held
  ctx.lineWidth = 2
  ctx.stroke()
}

export function edgeColor(J: number): string {
  return J >= 0 ? PALETTE.ferro : PALETTE.anti
}

export interface MeterOptions {
  label?: string
  /** Also print the sample count under the TV number. */
  samples?: number
}

/**
 * THE METER — exact ghost bars with live sampled bars over them and the TV
 * distance as one number. Returns the TV it printed so checks can hold the
 * pixels and the number to the same value.
 */
export function drawMeter(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  exact: Float64Array,
  sampled: Float64Array,
  opts: MeterOptions = {},
): number {
  const n = exact.length
  const textH = 34
  const plotH = r.h - textH
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, exact[i], sampled[i])
  if (peak === 0) peak = 1
  const bw = r.w / n
  for (let i = 0; i < n; i++) {
    const x = r.x + i * bw
    const gh = (exact[i] / peak) * plotH
    ctx.strokeStyle = PALETTE.ghost
    ctx.lineWidth = 1.4
    ctx.strokeRect(x + bw * 0.12, r.y + plotH - gh, bw * 0.76, gh)
    const sh = (sampled[i] / peak) * plotH
    ctx.fillStyle = PALETTE.meter
    ctx.globalAlpha = 0.55
    ctx.fillRect(x + bw * 0.24, r.y + plotH - sh, bw * 0.52, sh)
    ctx.globalAlpha = 1
  }
  const tv = tvDistance(exact, sampled)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.meter
  const label = opts.label ? `${opts.label}  ` : ''
  ctx.textAlign = 'left'
  ctx.fillText(`${label}distance from exact: ${fmt(tv, 3)}`, r.x, r.y + r.h - 14)
  if (opts.samples !== undefined) {
    ctx.font = FONT_LABEL
    ctx.fillStyle = 'rgba(85,96,111,0.9)'
    ctx.fillText(`${Math.round(opts.samples).toLocaleString()} samples`, r.x, r.y + r.h)
  }
  return tv
}
