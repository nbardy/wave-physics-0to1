// Part 3 shared core — the bill. A schedule is DATA: a sum-type sequence of
// priced operations (sweep / readout / clamp / reflash), and every economic
// number in the article is arithmetic on that sequence. The cost constants
// come from Part 2's CostStrip — ONE source of truth (imported, never
// redeclared), per the coordinator decision (07 PLAN §DECISIONS #6): Parts 2
// and 3 must print the same bill for the same act.
//
// COST-MODEL (stated once, then frozen — 07 PLAN §Cost-model decisions):
//   - sweep: one Gibbs iteration-equivalent per patch sweep (CostStrip's
//     convention).
//   - readout: READOUT_ITERS = 300 per readout event (§II B's 10²–10³ energy
//     band, CostStrip's charged choice).
//   - reflash: REFLASH_ITERS = 27,300 per kernel-swap event (Appendix B's
//     ≈91× per-node ratio applied at CostStrip's flat event basis — kept flat
//     per DECISION #6; per-node refinement deferred).
//   - clamp: flash-priced PER CLAMPED NODE (verified §II B 2: clamping is
//     "about as expensive as coupling flashing"). The per-node price is
//     pinned by Part 2's own reflash event: CostStrip's reflash button
//     flashes a 12×12 = 144-node fabric patch for 27,300 iteration-
//     equivalents, so one written node = REFLASH_ITERS / 144 ≈ 189.6
//     iteration-equivalents. Re-clamping a 16-pixel evidence frame therefore
//     costs 16 × 189.6 ≈ 3,033 — and clamping all 144 nodes would cost
//     exactly one reflash, which is the verified sentence made arithmetic.
//   - joules: §II B's ~3×10⁻¹⁰ J/iteration ONLY, labeled as the estimate it
//     is; Appendix B's per-node figure is never mixed in (no-blend rule).
// Every number produced here is a MODELED RATE built from verified paper
// constants — nothing is a measurement of physical hardware. Figures print
// that confession as chrome on the bill itself.

import { JOULES_PER_ITER, READOUT_ITERS, REFLASH_ITERS } from './CostStrip'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt } from '../lib/chrome'
import { yFieldInto, wFieldInto, type DenoiseModel } from './denoise'
import { u01 } from './lib'
import { integratedTau } from './MixingDial'
import { z1Graph, type Z1Graph } from './z1'

export { JOULES_PER_ITER, READOUT_ITERS, REFLASH_ITERS }

/** CostStrip's reflash event flashes its 12×12 patch — the flat event price
 *  divided by these 144 nodes is the model's per-written-node price. */
export const CLAMP_BASIS_NODES = 144
export const CLAMP_ITERS_PER_NODE = REFLASH_ITERS / CLAMP_BASIS_NODES // 189.58…

// ---------------------------------------------------------------------------
// Ops — the schedule's alphabet. One clean handler per kind.
// ---------------------------------------------------------------------------

export type Op =
  | { kind: 'sweep'; count: number }
  | { kind: 'readout' }
  | { kind: 'clamp'; nodes: number }
  | { kind: 'reflash' }

export function opCost(op: Op): number {
  switch (op.kind) {
    case 'sweep':
      return op.count
    case 'readout':
      return READOUT_ITERS
    case 'clamp':
      return op.nodes * CLAMP_ITERS_PER_NODE
    case 'reflash':
      return REFLASH_ITERS
  }
}

/** The bill: iteration-equivalents per line item plus event counts. */
export interface Bill {
  sweepIters: number
  readoutIters: number
  clampIters: number
  reflashIters: number
  total: number
  counts: { sweeps: number; readouts: number; clamps: number; reflashes: number }
}

export function billOf(ops: Op[]): Bill {
  const b: Bill = {
    sweepIters: 0,
    readoutIters: 0,
    clampIters: 0,
    reflashIters: 0,
    total: 0,
    counts: { sweeps: 0, readouts: 0, clamps: 0, reflashes: 0 },
  }
  for (const op of ops) {
    const c = opCost(op)
    b.total += c
    switch (op.kind) {
      case 'sweep':
        b.sweepIters += c
        b.counts.sweeps += op.count
        break
      case 'readout':
        b.readoutIters += c
        b.counts.readouts++
        break
      case 'clamp':
        b.clampIters += c
        b.counts.clamps++
        break
      case 'reflash':
        b.reflashIters += c
        b.counts.reflashes++
        break
    }
  }
  return b
}

/** Joules under the §II B estimate — an ESTIMATE, label it wherever printed. */
export function joulesOf(iters: number): number {
  return iters * JOULES_PER_ITER
}

// ---------------------------------------------------------------------------
// Schedules — the article's four ways to run the same reverse chain, as data.
// ---------------------------------------------------------------------------

/** One reverse-diffusion chain, structurally: T levels, each level clamps the
 *  evidence (x_t plus any conditioning spins), sweeps, and reads out. */
export interface ChainSpec {
  levels: number
  sweepsPerLevel: number
  /** Nodes re-written per clamp event: 16 for a specialist kernel's x_t,
   *  16 + 2 for the conditioned kernel (x_t plus the τ-code spins). */
  clampNodes: number
}

export type SchedulePlan =
  /** Kernel-per-level, swap inside every sample: N·T reflashes. */
  | { kind: 'naive'; chain: ChainSpec; samples: number }
  /** Loops reordered — all samples through a level before any swap.
   *  T reflashes per batch of `batch` samples (recurring). */
  | { kind: 'batched'; chain: ChainSpec; samples: number; batch: number }
  /** One conditioned kernel, flashed once EVER: 1 setup reflash total. */
  | { kind: 'conditioned'; chain: ChainSpec; samples: number }
  /** T kernels flashed once onto disjoint fabric regions: T setup reflashes
   *  total, zero thereafter — the trade is fabric, priced by footprint. */
  | { kind: 'disjoint'; chain: ChainSpec; samples: number }

/** The per-sample body every schedule shares — no schedule escapes it. */
function chainBodyOps(chain: ChainSpec): Op[] {
  const ops: Op[] = []
  for (let t = 0; t < chain.levels; t++) {
    ops.push({ kind: 'clamp', nodes: chain.clampNodes })
    ops.push({ kind: 'sweep', count: chain.sweepsPerLevel })
    ops.push({ kind: 'readout' })
  }
  return ops
}

function opsNaive(chain: ChainSpec, samples: number): Op[] {
  const ops: Op[] = []
  for (let s = 0; s < samples; s++) {
    for (let t = 0; t < chain.levels; t++) {
      ops.push({ kind: 'reflash' })
      ops.push({ kind: 'clamp', nodes: chain.clampNodes })
      ops.push({ kind: 'sweep', count: chain.sweepsPerLevel })
      ops.push({ kind: 'readout' })
    }
  }
  return ops
}

function opsBatched(chain: ChainSpec, samples: number, batch: number): Op[] {
  const ops: Op[] = []
  for (let done = 0; done < samples; done += batch) {
    const n = Math.min(batch, samples - done)
    for (let t = 0; t < chain.levels; t++) {
      ops.push({ kind: 'reflash' })
      for (let s = 0; s < n; s++) {
        ops.push({ kind: 'clamp', nodes: chain.clampNodes })
        ops.push({ kind: 'sweep', count: chain.sweepsPerLevel })
        ops.push({ kind: 'readout' })
      }
    }
  }
  return ops
}

function opsOneTimeSetup(chain: ChainSpec, samples: number, setupFlashes: number): Op[] {
  const ops: Op[] = []
  for (let f = 0; f < setupFlashes; f++) ops.push({ kind: 'reflash' })
  for (let s = 0; s < samples; s++) ops.push(...chainBodyOps(chain))
  return ops
}

export function scheduleOps(p: SchedulePlan): Op[] {
  switch (p.kind) {
    case 'naive':
      return opsNaive(p.chain, p.samples)
    case 'batched':
      return opsBatched(p.chain, p.samples, p.batch)
    case 'conditioned':
      return opsOneTimeSetup(p.chain, p.samples, 1)
    case 'disjoint':
      return opsOneTimeSetup(p.chain, p.samples, p.chain.levels)
  }
}

export function scheduleBill(p: SchedulePlan): Bill {
  return billOf(scheduleOps(p))
}

export function perSample(p: SchedulePlan): number {
  return scheduleBill(p).total / p.samples
}

/** The no-reflash sub-bill of ONE sample — the floor no batch size pierces. */
export function floorBill(chain: ChainSpec): Bill {
  return billOf(chainBodyOps(chain))
}

// ---------------------------------------------------------------------------
// Fabric footprint — the disjoint schedule's other axis.
// ---------------------------------------------------------------------------

/** One kernel occupies one CostStrip-sized 12×12 fabric patch. */
export const PATCH_NODES = CLAMP_BASIS_NODES

export interface RegionPlan {
  g: Z1Graph
  /** Node sets, one per kernel — vertex-disjoint on the real fabric graph. */
  regions: number[][]
  footprint: number
}

/** T kernel regions side by side on one real Z1 graph: region r owns the
 *  columns [12r, 12r+12). Disjointness is by construction and asserted by
 *  the check on the generated graph, not trusted. */
export function disjointRegionPlan(T: number, patchW = 12, patchH = 12): RegionPlan {
  const g = z1Graph(patchW * T, patchH)
  const regions: number[][] = Array.from({ length: T }, () => [])
  for (let y = 0; y < patchH; y++) {
    for (let x = 0; x < patchW * T; x++) {
      regions[Math.floor(x / patchW)].push(y * patchW * T + x)
    }
  }
  let footprint = 0
  for (const r of regions) footprint += r.length
  return { g, regions, footprint }
}

// ---------------------------------------------------------------------------
// The bill strip — the article's persistent second protagonist, one renderer.
// ---------------------------------------------------------------------------

export interface BillStripOpts {
  /** Reflash rate in events per second of schedule time; red past 1/s. */
  reflashRate?: number
  /** Extra headline printed left of the total (e.g. "per sample: …"). */
  headline?: string
}

/** Draw the standing bill strip: line items in the bill ink, the joules
 *  conversion labeled as the §II B estimate, and the modeled-rates confession
 *  as chrome — cheapness and honesty travel together (07 PLAN rule 5). */
export function drawBillStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  b: Bill,
  opts: BillStripOpts = {},
): void {
  const narrow = w < 520
  ctx.textAlign = 'left'
  ctx.font = narrow ? FONT_METER : '600 15px ui-sans-serif, system-ui'
  ctx.fillStyle = PALETTE.bill
  const head = opts.headline ? `${opts.headline} · ` : ''
  ctx.fillText(`${head}bill: ${fmt(b.total, 0)} iteration-equivalents`, x, y)
  ctx.font = FONT_LABEL
  ctx.fillStyle = '#1a1f2b'
  ctx.fillText(
    `= ${fmt(b.sweepIters, 0)} sweep + ${fmt(b.readoutIters, 0)} readout + ${fmt(b.clampIters, 0)} clamp + ${fmt(b.reflashIters, 0)} reflash`,
    x,
    y + 15,
  )
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText(
    narrow
      ? `≈ ${fmtJ(joulesOf(b.total))} (§II B estimate) · modeled rates, not hardware`
      : `≈ ${fmtJ(joulesOf(b.total))} at ~3e-10 J/iteration (§II B, an estimate) · MODELED RATES from verified constants — not a hardware measurement`,
    x,
    y + 29,
  )
  if (opts.reflashRate !== undefined) {
    const over = opts.reflashRate > 1
    ctx.fillStyle = over ? PALETTE.ferro : 'rgba(85,96,111,0.9)'
    ctx.fillText(
      `reflash rate ${fmt(opts.reflashRate, 2)}/s — paper's limit: about once per second${over ? ' — BROKEN' : ''}`,
      x,
      y + 43,
    )
  }
}

/** Joules formatter spanning nJ→J (CostStrip's fmtEnergy stops at mJ and the
 *  wall's bills climb past it; Greek μ per the tofu rule). */
export function fmtJ(j: number): string {
  if (j < 1e-6) return `${fmt(j * 1e9, 1)} nJ`
  if (j < 1e-3) return `${fmt(j * 1e6, 1)} μJ`
  if (j < 1) return `${fmt(j * 1e3, 1)} mJ`
  return `${fmt(j, 2)} J`
}

// ---------------------------------------------------------------------------
// Per-level mixing measurement — MixingDial's τ estimator pointed at a
// denoise kernel's own (y, w) block-Gibbs chain at clamped evidence x_t.
// ---------------------------------------------------------------------------

const TAU_MEASURE_SWEEPS = 20_000
const TAU_BURN_SWEEPS = 1_000

const sig2 = (f: number) => 1 / (1 + Math.exp(-2 * f))

export interface LevelMixing {
  tau: number
  ess: number
}

/** Integrated autocorrelation time of the y-magnetization under the model's
 *  own exact block-Gibbs chain (all y given w, then all w given y) with x
 *  clamped — the same sampler generation runs, interrogated. Deterministic. */
export function measureLevelTau(m: DenoiseModel, x: Int8Array, seed = 23): LevelMixing {
  const y = new Int8Array(m.nv)
  const w = new Int8Array(m.nh)
  for (let j = 0; j < m.nv; j++) y[j] = u01(seed, 0, j, 41) < 0.5 ? -1 : 1
  for (let k = 0; k < m.nh; k++) w[k] = u01(seed, 0, k, 42) < 0.5 ? -1 : 1
  const fy = new Float64Array(m.nv)
  const fw = new Float64Array(m.nh)
  const series = new Float64Array(TAU_MEASURE_SWEEPS)
  for (let t = 1; t <= TAU_BURN_SWEEPS + TAU_MEASURE_SWEEPS; t++) {
    yFieldInto(m, x, w, fy)
    for (let j = 0; j < m.nv; j++) y[j] = u01(seed, t, j, 1) < sig2(fy[j]) ? 1 : -1
    wFieldInto(m, y, fw)
    for (let k = 0; k < m.nh; k++) w[k] = u01(seed, t, k, 2) < sig2(fw[k]) ? 1 : -1
    if (t > TAU_BURN_SWEEPS) {
      let mag = 0
      for (let j = 0; j < m.nv; j++) mag += y[j]
      series[t - TAU_BURN_SWEEPS - 1] = mag
    }
  }
  const tau = integratedTau(series)
  return { tau, ess: 1 / tau }
}

/** Clone a denoise model with its clamped-side (U) and free-side (W)
 *  couplings scaled — the check harness's falsifiable form of MET's
 *  clamped-spin exemption (U rides the clamped side; W is what τ taxes). */
export function scaledDenoise(m: DenoiseModel, uScale: number, wScale: number): DenoiseModel {
  return {
    nv: m.nv,
    nh: m.nh,
    b: Float32Array.from(m.b),
    c: Float32Array.from(m.c),
    U: Float32Array.from(m.U, (v) => v * uScale),
    W: Float32Array.from(m.W, (v) => v * wScale),
  }
}
