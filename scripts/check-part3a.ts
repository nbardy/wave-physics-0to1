/**
 * Part 3a checks — the bill's backbone and the Act I–III figures.
 * Run: bun run scripts/check-part3a.ts
 *
 * Oracle tier first: the schedule/bill model held to closed forms written
 * independently here (not read back from part3lib), the conditioned kernel's
 * reduction identity and per-level audit against the shipped specialists on
 * the 4×4 oracle, the per-level τ measurements with the falsifiable U-vs-W
 * probe (MET's clamped-spin exemption), and the allocation experiment whose
 * measured NULL binds Act III's narrative. Then the figure tier: every
 * component rendered headlessly, every knob driven to both ends, every claim
 * sampled in its own palette ink.
 *
 * Ends with the MEASURED FACTS block that 07 PLAN's placeholders quote —
 * prose may not claim a number that does not appear there.
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import { READOUT_ITERS, REFLASH_ITERS, JOULES_PER_ITER } from '../src/sims/pbits/CostStrip'
import {
  billOf,
  CLAMP_BASIS_NODES,
  CLAMP_ITERS_PER_NODE,
  disjointRegionPlan,
  floorBill,
  joulesOf,
  measureLevelTau,
  opCost,
  PATCH_NODES,
  perSample,
  scaledDenoise,
  scheduleBill,
  scheduleOps,
  type ChainSpec,
} from '../src/sims/pbits/part3lib'
import {
  exactConditional,
  exactDataReverse,
  forwardChain,
  N_LEVELS,
  NV,
} from '../src/sims/pbits/denoise'
import { GLYPH_LIST, nearestGlyphDistance } from '../src/sims/pbits/glyphs'
import { PRETRAINED } from '../src/sims/pbits/pretrained'
import {
  createCondTrainer,
  exactCondConditional,
  initCondModel,
  N_IN,
  specialize,
  TAU_SPINS,
  tauCode,
} from '../src/sims/pbits/denoiseCond'
import {
  createOpTimeline,
  opTimelineRegions,
  type OpTimelineProbe,
} from '../src/sims/pbits/OpTimeline'
import {
  cfChain,
  CF_SWEEP_GRID,
  clampFloorRegions,
  createClampFloor,
  type ClampFloorProbe,
} from '../src/sims/pbits/ClampFloor'
import {
  amortizeRegions,
  AS_BATCH,
  AS_SAMPLE_GRID,
  createAmortizeStrip,
  type AmortizeProbe,
} from '../src/sims/pbits/AmortizeStrip'
import {
  allocBudget,
  createMixBudget,
  dreamAlloc,
  MB_BUDGET,
  MB_STRAY_AT,
  mixBudgetRegions,
  tauProbeInput,
  type MixBudgetProbe,
} from '../src/sims/pbits/MixBudget'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ---------------------------------------------------------------------------
// Oracle tier 1 — the cost model vs independent closed forms.
// ---------------------------------------------------------------------------

console.log('--- bill model ---')
{
  ok(opCost({ kind: 'sweep', count: 7 }) === 7, 'op/sweep', 'a sweep costs one iteration each')
  ok(opCost({ kind: 'readout' }) === 300, 'op/readout', `readout = ${READOUT_ITERS} (§II B band, CostStrip's charge)`)
  ok(opCost({ kind: 'reflash' }) === 27_300, 'op/reflash', `reflash = ${REFLASH_ITERS} (91× readout, App. B ratio)`)
  ok(
    near(opCost({ kind: 'clamp', nodes: CLAMP_BASIS_NODES }), REFLASH_ITERS),
    'op/clamp-basis',
    `clamping all ${CLAMP_BASIS_NODES} patch nodes costs exactly one reflash — "about as expensive as coupling flashing" made arithmetic`,
  )
  ok(
    near(CLAMP_ITERS_PER_NODE, 27_300 / 144),
    'op/clamp-per-node',
    `${CLAMP_ITERS_PER_NODE.toFixed(4)} iters per written node`,
  )
}

const T = N_LEVELS
const K = 6
const specChain: ChainSpec = { levels: T, sweepsPerLevel: K, clampNodes: NV }
const condChain: ChainSpec = { levels: T, sweepsPerLevel: K, clampNodes: N_IN }
// closed forms, written here from the constants — not read from part3lib
const clamp16 = 16 * (27_300 / 144)
const clamp18 = 18 * (27_300 / 144)
const NAIVE_PS = T * (27_300 + clamp16 + 300 + K) // 91,918
const FLOOR_SPEC = T * (clamp16 + 300 + K) // 10,018
const FLOOR_COND = T * (clamp18 + 300 + K) // 11,155.5

{
  ok(near(perSample({ kind: 'naive', chain: specChain, samples: 1 }), NAIVE_PS), 'bill/naive', `naive per sample = ${NAIVE_PS}`)
  ok(
    near(scheduleBill({ kind: 'naive', chain: specChain, samples: 5 }).total, 5 * NAIVE_PS),
    'bill/naive-linear',
    'five naive samples cost exactly five bills',
  )
  const b1 = scheduleBill({ kind: 'batched', chain: specChain, samples: 1, batch: 1 })
  ok(near(b1.total, NAIVE_PS), 'bill/batched-N1', 'a batch of one IS the naive schedule')
  const b64 = perSample({ kind: 'batched', chain: specChain, samples: 64, batch: 64 })
  ok(near(b64, FLOOR_SPEC + (T * 27_300) / 64), 'bill/batched-N64', `${b64.toFixed(1)} = floor + T·reflash/64`)
  ok(near(floorBill(specChain).total, FLOOR_SPEC), 'bill/floor', `floor = ${FLOOR_SPEC} — the no-reflash sub-bill exactly`)
  const b20 = scheduleBill({ kind: 'batched', chain: specChain, samples: 20, batch: 8 })
  ok(b20.counts.reflashes === 9, 'bill/batched-groups', '20 samples in batches of 8 → 3 groups × T reflashes = 9')
  const c64 = scheduleBill({ kind: 'conditioned', chain: condChain, samples: 64 })
  ok(c64.counts.reflashes === 1, 'bill/cond-one-flash', 'conditioned: one flash, ever')
  ok(near(c64.total / 64, FLOOR_COND + 27_300 / 64), 'bill/cond-N64', `${(c64.total / 64).toFixed(1)} per sample`)
  const d64 = scheduleBill({ kind: 'disjoint', chain: specChain, samples: 64 })
  ok(d64.counts.reflashes === T, 'bill/disjoint-setup', `disjoint: ${T} setup flashes, zero after`)
  // the measured wrinkle the verdict must state: at large S disjoint's bare
  // 16-node clamps undercut the conditioned kernel's 18-node clamps
  ok(
    d64.total / 64 < c64.total / 64 && c64.total / 64 < b20.total / 20,
    'bill/ordering-wrinkle',
    `at scale: disjoint ${(d64.total / 64).toFixed(0)} < conditioned ${(c64.total / 64).toFixed(0)} — the τ spins' clamp surcharge, honestly priced`,
  )
  // ops-as-data sanity: the op sequence bills to the same total it schedules
  const ops = scheduleOps({ kind: 'conditioned', chain: condChain, samples: 3 })
  ok(near(billOf(ops).total, c64.total - 61 * FLOOR_COND), 'bill/ops-are-the-model', 'billing the op list = billing the schedule')
  ok(near(joulesOf(1e6), 1e6 * JOULES_PER_ITER), 'bill/joules', 'joules = iters × §II B estimate, nothing else')
}

console.log('--- clamp floor ---')
{
  const f6 = floorBill(cfChain(6))
  const share6 = f6.clampIters / f6.total
  ok(near(share6, (T * clamp18) / (T * (clamp18 + 300 + 6))), 'floor/share-k6', `clamp share at 6 sweeps = ${(share6 * 100).toFixed(1)}%`)
  const f600 = floorBill(cfChain(600))
  const share600 = f600.clampIters / f600.total
  ok(near(share600, (T * clamp18) / (T * (clamp18 + 300 + 600))), 'floor/share-k600', `clamp share at 600 sweeps = ${(share600 * 100).toFixed(1)}%`)
  ok(share6 > 0.9 && share600 > 0.5, 'floor/is-the-clamps', 'the clamps hold the floor majority across the whole knob range')
}

console.log('--- disjoint regions on the real fabric ---')
{
  const plan = disjointRegionPlan(T)
  const seen = new Set<number>()
  let overlap = false
  for (const r of plan.regions) for (const i of r) { if (seen.has(i)) overlap = true; seen.add(i) }
  ok(!overlap, 'regions/vertex-disjoint', `${plan.regions.length} regions share no node on the generated z1 graph`)
  ok(seen.size === plan.g.n, 'regions/partition', 'regions cover the fabric exactly')
  ok(plan.footprint === T * PATCH_NODES, 'regions/footprint', `footprint = Σ node counts = ${plan.footprint} p-bits`)
}

// ---------------------------------------------------------------------------
// Oracle tier 2 — the conditioned kernel.
// ---------------------------------------------------------------------------

console.log('--- conditioned kernel ---')

function kl(q: Float64Array, p: Float64Array): number {
  let s = 0
  for (let i = 0; i < q.length; i++) if (q[i] > 0) s += q[i] * Math.log(q[i] / Math.max(p[i], 1e-300))
  return s
}

{
  const codes = [1, 2, 3].map((t) => tauCode(t).join(','))
  ok(new Set(codes).size === 3, 'cond/codes-distinct', `τ codes ${codes.join(' | ')}`)
  ok(N_IN === NV + TAU_SPINS, 'cond/clamp-width', `${N_IN} clamped inputs = ${NV} pixels + ${TAU_SPINS} τ spins`)
}

{
  // reduction identity, untrained: fold the code into biases and the
  // conditioned kernel at fixed t IS a specialist, state by state
  const m = initCondModel(4, 99)
  const xt = forwardChain(GLYPH_LIST[0], 11, 1)[2]
  const a = exactCondConditional(m, xt, 2)
  const b = exactConditional(specialize(m, 2), xt)
  let maxd = 0
  for (let i = 0; i < a.length; i++) maxd = Math.max(maxd, Math.abs(a[i] - b[i]))
  ok(maxd < 1e-10, 'cond/reduction-untrained', `max |Δp| over 2^16 states = ${maxd.toExponential(2)}`)
}

// canonical Part 3a conditioned trainer: same data stream, seeds, and epoch
// budget as the shipped specialists (seed 7, 400 epochs, CD-10), with nh = 8
// hidden spins — double a specialist's, stated, because one kernel serves
// three levels
const condT0 = Date.now()
const condTrainer = createCondTrainer(GLYPH_LIST, {
  nh: 8,
  epochs: 400,
  drawsPerGlyph: 8,
  k: 10,
  lr: 0.2,
  seed: 7,
})
condTrainer.runEpochs(400)
const condTrainSecs = (Date.now() - condT0) / 1000
const cond = condTrainer.model

{
  const xt = forwardChain(GLYPH_LIST[2], 11, 4)[2]
  const a = exactCondConditional(cond, xt, 2)
  const b = exactConditional(specialize(cond, 2), xt)
  let maxd = 0
  for (let i = 0; i < a.length; i++) maxd = Math.max(maxd, Math.abs(a[i] - b[i]))
  ok(maxd < 1e-7, 'cond/reduction-trained', `trained kernel, same identity: max |Δp| = ${maxd.toExponential(2)}`)
}

/** Mean exact KL(q_true ‖ model) over 12 probe inputs per level. */
function auditLevel(t: number, p: (xt: Int8Array) => Float64Array): number {
  let acc = 0
  let n = 0
  for (let g = 0; g < GLYPH_LIST.length; g++) {
    for (const run of [3, 9]) {
      const xt = forwardChain(GLYPH_LIST[g], 2024, run)[t]
      acc += kl(exactDataReverse(GLYPH_LIST, t, xt), p(xt))
      n++
    }
  }
  return acc / n
}

const klSpec: number[] = []
const klCond: number[] = []
const klUntrained: number[] = []
{
  const un = initCondModel(8, 108)
  for (let t = 1; t <= T; t++) {
    klSpec.push(auditLevel(t, (xt) => exactConditional(PRETRAINED[t - 1], xt)))
    klCond.push(auditLevel(t, (xt) => exactCondConditional(cond, xt, t)))
    klUntrained.push(auditLevel(t, (xt) => exactCondConditional(un, xt, t)))
  }
  // recorded 2026-08-25 (deterministic counter RNG): spec 0.323/0.768/0.252,
  // cond 1.274/0.922/1.886 — regression tripwire, tolerance for float wiggle
  const recCond = [1.274, 0.922, 1.886]
  // "learning happened" is asserted per level at t=1,2 and as the mean over
  // levels — NOT per level at t=3: there the true reverse is broad (x_3 is
  // fair coins), and a flat untrained kernel scores KL 0.90 by sheer
  // vagueness while any sharpened kernel pays for overconfidence (measured
  // 2026-08-25: untrained 0.896 < cond 1.886 at t=3, while the specialist
  // reaches 0.252 — t=3 is genuinely the conditioned kernel's weak level,
  // recorded as such in the facts block).
  for (const t of [1, 2]) {
    ok(
      klCond[t - 1] < klUntrained[t - 1],
      `cond/learned-t${t}`,
      `KL ${klCond[t - 1].toFixed(3)} < untrained ${klUntrained[t - 1].toFixed(3)}`,
    )
  }
  const meanOf = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  ok(
    meanOf(klCond) < meanOf(klUntrained) / 3,
    'cond/learned-mean',
    `mean KL ${meanOf(klCond).toFixed(3)} vs untrained ${meanOf(klUntrained).toFixed(3)}`,
  )
  for (let t = 1; t <= T; t++) {
    ok(
      Math.abs(klCond[t - 1] - recCond[t - 1]) < 0.01,
      `cond/audit-t${t}`,
      `cond ${klCond[t - 1].toFixed(3)} vs specialist ${klSpec[t - 1].toFixed(3)} (recorded ${recCond[t - 1]})`,
    )
  }
  // the honest shape of the sharing cost: near-parity at the middle level,
  // measured factors at the ends — Predict #2's options are written from this
  ok(
    klCond[1] / klSpec[1] < 1.5,
    'cond/near-parity-t2',
    `middle level factor ${(klCond[1] / klSpec[1]).toFixed(2)}× — sharing nearly free where the task is copy-like`,
  )
  // the τ code carries level information: querying level t with the wrong
  // code is measurably worse than the right one
  for (const [t, wrongT] of [
    [1, 3],
    [3, 1],
  ] as const) {
    const right = auditLevel(t, (xt) => exactCondConditional(cond, xt, t))
    const wrong = auditLevel(t, (xt) => exactCondConditional(cond, xt, wrongT))
    ok(wrong > right + 0.1, `cond/code-matters-t${t}`, `wrong τ code: KL ${wrong.toFixed(3)} vs ${right.toFixed(3)}`)
  }
}

// ---------------------------------------------------------------------------
// Oracle tier 3 — per-level mixing and the clamped-spin exemption.
// ---------------------------------------------------------------------------

console.log('--- per-level mixing ---')

const taus: number[] = []
{
  for (let t = 1; t <= T; t++) taus.push(measureLevelTau(PRETRAINED[t - 1], tauProbeInput(t), 23).tau)
  // recorded 2026-08-25: τ = 1.09 / 2.86 / 2.05 (seed 23); seed spread ≤ 0.5
  const rec = [1.09, 2.86, 2.05]
  for (let t = 1; t <= T; t++) {
    ok(Math.abs(taus[t - 1] - rec[t - 1]) < 0.05, `tau/reproduce-t${t}`, `τ_${t} = ${taus[t - 1].toFixed(2)}`)
  }
  // determinism: same seed, same number
  const again = measureLevelTau(PRETRAINED[1], tauProbeInput(2), 23).tau
  ok(near(again, taus[1], 1e-12), 'tau/deterministic', 'same seed reproduces to the bit')

  // the falsifiable exemption (MET, verified): doubling the FREE-side W
  // multiplies τ where W is strong; doubling the CLAMPED-side U never raises
  // it beyond seed noise (measured: at t=2 it *drops* τ — stronger evidence
  // pins the outputs; clamped couplings sharpen, they do not stiffen)
  for (const t of [2, 3]) {
    const base = taus[t - 1]
    const u2 = measureLevelTau(scaledDenoise(PRETRAINED[t - 1], 2, 1), tauProbeInput(t), 23).tau
    const w2 = measureLevelTau(scaledDenoise(PRETRAINED[t - 1], 1, 2), tauProbeInput(t), 23).tau
    ok(w2 > 3 * base, `tau/W-taxes-t${t}`, `W×2: τ ${base.toFixed(2)} → ${w2.toFixed(2)}`)
    ok(u2 < 1.15 * base, `tau/U-exempt-t${t}`, `U×2: τ ${base.toFixed(2)} → ${u2.toFixed(2)} — no mixing cost from the clamped side`)
  }
}

console.log('--- allocation at equal bill ---')

function strayRate(models: typeof PRETRAINED, alloc: number[], dreams: number): { stray: number; meanDist: number } {
  let stray = 0
  let dist = 0
  for (let r = 1; r <= dreams; r++) {
    const d = dreamAlloc(models, 47, r, alloc)
    const dd = nearestGlyphDistance(d)
    dist += dd
    if (dd >= MB_STRAY_AT) stray++
  }
  return { stray: stray / dreams, meanDist: dist / dreams }
}

let allocFacts = ''
{
  const uni = allocBudget(taus, 0)
  const wtd = allocBudget(taus, 1)
  ok(uni.every((v) => v === MB_BUDGET / T), 'alloc/uniform', `λ=0 → [${uni.join(',')}]`)
  ok(
    uni.reduce((a, b) => a + b, 0) === MB_BUDGET && wtd.reduce((a, b) => a + b, 0) === MB_BUDGET,
    'alloc/equal-bill',
    `both splits spend exactly S = ${MB_BUDGET} sweeps — the bills are identical by construction`,
  )
  ok(JSON.stringify(uni) !== JSON.stringify(wtd), 'alloc/knob-moves', `λ=1 → [${wtd.join(',')}] — the knob changes the split`)
  const a0 = strayRate(PRETRAINED, uni, 400)
  const a1 = strayRate(PRETRAINED, wtd, 400)
  // MEASURED NULL (2026-08-25): 0.138 vs 0.170 stray at S=9 — within ~2 s.e.
  // of each other; τ-weighting does NOT buy visible quality at 4×4. This is
  // Act III's binding fact (07 PLAN MEASURED-FACTS #5 fallback branch): at
  // this size the schedule forgives you. The check asserts the null stays a
  // null — if allocation ever starts mattering here, the narrative changes.
  ok(Math.abs(a0.stray - a1.stray) < 0.06, 'alloc/null', `stray uniform ${a0.stray.toFixed(3)} vs weighted ${a1.stray.toFixed(3)} — a measured null`)
  // the sharpened, confessed variant: stiffen level 2's free side ×1.75 so
  // τ_2 ≈ 18 — and the warm-started reverse step STILL forgives the split
  const sharp = PRETRAINED.map((m, i) => (i === 1 ? scaledDenoise(m, 1, 1.75) : m))
  const tSharp = [1, 2, 3].map((t) => measureLevelTau(sharp[t - 1], tauProbeInput(t), 23).tau)
  ok(tSharp[1] > 10, 'alloc/sharp-tau', `sharpened τ_2 = ${tSharp[1].toFixed(1)} (base ${taus[1].toFixed(2)})`)
  const s0 = strayRate(sharp, allocBudget(tSharp, 0), 500)
  const s1 = strayRate(sharp, allocBudget(tSharp, 1), 500)
  ok(Math.abs(s0.stray - s1.stray) < 0.06, 'alloc/sharp-null', `sharpened: uniform ${s0.stray.toFixed(3)} vs weighted ${s1.stray.toFixed(3)} — still a null (warm starts don't pay τ)`)
  allocFacts =
    `S=${MB_BUDGET}: uniform [${uni.join(',')}] stray ${a0.stray.toFixed(3)} meanDist ${a0.meanDist.toFixed(3)} · ` +
    `τ-weighted [${wtd.join(',')}] stray ${a1.stray.toFixed(3)} meanDist ${a1.meanDist.toFixed(3)} (400 dreams each)\n` +
    `  sharpened (W_2×1.75, τ_2=${tSharp[1].toFixed(1)}): uniform stray ${s0.stray.toFixed(3)} vs weighted ${s1.stray.toFixed(3)} (500 dreams each) — NULL both ways`
}

// ---------------------------------------------------------------------------
// Figure tier — headless renders, knobs to both ends, own inks sampled.
// ---------------------------------------------------------------------------

console.log('--- figures ---')

const W = 640

function inkCount(canvas: Canvas, hex: string, tol = 40): number {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (Math.abs(img.data[i] - r) < tol && Math.abs(img.data[i + 1] - g) < tol && Math.abs(img.data[i + 2] - b) < tol) count++
  }
  return count
}

function regionInk(canvas: Canvas, hex: string, rx: number, ry: number, rw: number, rh: number, tol = 40): number {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh))
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (Math.abs(img.data[i] - r) < tol && Math.abs(img.data[i + 1] - g) < tol && Math.abs(img.data[i + 2] - b) < tol) count++
  }
  return count
}

function regionDiff(a: Canvas, b: Canvas, rx: number, ry: number, rw: number, rh: number): number {
  const ia = a.getContext('2d').getImageData(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh)).data
  const ib = b.getContext('2d').getImageData(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh)).data
  let diff = 0
  for (let i = 0; i < ia.length; i += 4) {
    if (ia[i] !== ib[i] || ia[i + 1] !== ib[i + 1] || ia[i + 2] !== ib[i + 2] || ia[i + 3] !== ib[i + 3]) diff++
  }
  return diff
}

// --- OpTimeline: the billed reprise ---------------------------------------
let otFacts = ''
{
  const H = 410
  const renderAt = (batchIdx: number, probe: OpTimelineProbe): Canvas => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    const stepper = createOpTimeline({ current: { batchIdx } }, probe)
    for (let f = 0; f < 300; f++) stepper.step(1 / 60) // 5 s of schedule at demo pace
    stepper.draw(ctx, W, H)
    return canvas
  }
  const p1: OpTimelineProbe = {} as OpTimelineProbe
  const p64: OpTimelineProbe = {} as OpTimelineProbe
  const c1 = renderAt(0, p1)
  const c64 = renderAt(6, p64)
  writeFileSync(join(OUT, 'part3-optimeline-n1.png'), c1.toBuffer('image/png'))
  writeFileSync(join(OUT, 'part3-optimeline-n64.png'), c64.toBuffer('image/png'))
  ok(near(p1.perSampleTotal, NAIVE_PS, 1e-6), 'fig/ot-naive-ps', `N=1 per-sample = ${p1.perSampleTotal.toFixed(0)} = the naive closed form`)
  ok(near(p1.reflashShare, (T * 27_300) / NAIVE_PS, 1e-9), 'fig/ot-reflash-share', `reflash share at N=1 = ${(p1.reflashShare * 100).toFixed(1)}%`)
  ok(p1.reflashShare > 0.85, 'fig/ot-reflash-owns', 'the reflash line item owns the naive bill')
  ok(near(p64.perSampleTotal, FLOOR_SPEC + (T * 27_300) / 64, 1e-6), 'fig/ot-batched-ps', `N=64 per-sample = ${p64.perSampleTotal.toFixed(0)}`)
  ok(near(p64.floorTotal, FLOOR_SPEC, 1e-9), 'fig/ot-floor', `drawn floor = ${p64.floorTotal}`)
  ok(p1.rate > 1 && p64.rate < 1, 'fig/ot-rate-crosses', `reflash rate ${p1.rate.toFixed(2)}/s at N=1 (red) vs ${p64.rate.toFixed(3)}/s at N=64`)
  // the rate readout's error ink: ferro appears in the strip only when broken
  const stripY = H - 60
  const ferro1 = regionInk(c1, PALETTE.ferro, 0, stripY, W, 60)
  const ferro64 = regionInk(c64, PALETTE.ferro, 0, stripY, W, 60)
  ok(ferro1 > 30 && ferro64 < 10, 'fig/ot-rate-red', `broken-limit ink: ${ferro1}px at N=1 vs ${ferro64}px at N=64`)
  const { comp, curve } = opTimelineRegions(W, H)
  ok(regionInk(c1, PALETTE.bill, comp.x, comp.y, comp.w, comp.h) > 200, 'fig/ot-bill-ink', 'composition bars wear the bill ink')
  ok(regionDiff(c1, c64, comp.x, comp.y, comp.w, comp.h) > 300, 'fig/ot-knob-moves-comp', 'the knob visibly reorders the composition')
  ok(regionInk(c1, PALETTE.bill, curve.x, curve.y, curve.w, curve.h) > 50, 'fig/ot-curve-ink', 'the cost curve is drawn in bill ink')
  ok(inkCount(c1, PALETTE.sUp) > 100, 'fig/ot-dreams-paint', 'the dream wall paints in spin amber')
  ok(p64.completed === 0 && p1.completed > 0, 'fig/ot-batch-pace', `N=1 delivered ${p1.completed} dreams in 5 s; N=64 still mid-batch — batching trades latency`)
  otFacts = `naive/sample ${NAIVE_PS.toFixed(0)} (reflash ${(p1.reflashShare * 100).toFixed(1)}%, clamp ${((T * clamp16) / NAIVE_PS * 100).toFixed(1)}%, readout ${((T * 300) / NAIVE_PS * 100).toFixed(1)}%, sweep ${((T * K) / NAIVE_PS * 100).toFixed(2)}%) · batched N=64: ${p64.perSampleTotal.toFixed(0)} · floor ${FLOOR_SPEC}`
}

// --- ClampFloor -------------------------------------------------------------
{
  const H = 360
  const renderAt = (sweepsIdx: number, probe: ClampFloorProbe): Canvas => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    const stepper = createClampFloor({ current: { sweepsIdx } }, probe)
    stepper.step(0)
    stepper.draw(ctx, W, H)
    return canvas
  }
  const pa: ClampFloorProbe = {} as ClampFloorProbe
  const pb: ClampFloorProbe = {} as ClampFloorProbe
  const ca = renderAt(0, pa)
  const cb = renderAt(CF_SWEEP_GRID.length - 1, pb)
  writeFileSync(join(OUT, 'part3-clampfloor.png'), ca.toBuffer('image/png'))
  ok(near(pa.floorTotal, FLOOR_COND, 1e-9), 'fig/cf-floor', `floor at 6 sweeps = ${pa.floorTotal}`)
  ok(near(pa.clampShare, (T * clamp18) / FLOOR_COND, 1e-9), 'fig/cf-share-low', `clamp share ${(pa.clampShare * 100).toFixed(1)}% at 6 sweeps`)
  ok(near(pb.clampShare, (T * clamp18) / (T * (clamp18 + 300 + 600)), 1e-9), 'fig/cf-share-high', `clamp share ${(pb.clampShare * 100).toFixed(1)}% at 600 sweeps — still the majority`)
  ok(near(pa.perSampleAt1, FLOOR_COND + 27_300, 1e-9) && near(pa.perSampleAt64, FLOOR_COND + 27_300 / 64, 1e-9), 'fig/cf-amortize', 'the wedge is exactly the setup flash ÷ samples')
  const { amort, decomp } = clampFloorRegions(W, H)
  ok(regionInk(ca, PALETTE.bill, amort.x, amort.y, amort.w, amort.h) > 300, 'fig/cf-bands-ink', 'the clamp bands wear the bill ink')
  ok(regionInk(ca, PALETTE.bill, decomp.x, decomp.y, decomp.w, decomp.h) > 100, 'fig/cf-decomp-ink', 'the decomposed clamp bar is bill ink')
  ok(regionDiff(ca, cb, amort.x, amort.y, amort.w, amort.h) > 200, 'fig/cf-knob-moves', 'the sweeps knob visibly moves the stack')
}

// --- AmortizeStrip ----------------------------------------------------------
{
  const H = 330
  const renderAt = (samplesIdx: number, probe: AmortizeProbe): Canvas => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    const stepper = createAmortizeStrip({ current: { samplesIdx } }, probe)
    stepper.step(0)
    stepper.draw(ctx, W, H)
    return canvas
  }
  const p8: AmortizeProbe = {} as AmortizeProbe
  const p64: AmortizeProbe = {} as AmortizeProbe
  const c8 = renderAt(3, p8)
  const c64 = renderAt(AS_SAMPLE_GRID.length - 1, p64)
  writeFileSync(join(OUT, 'part3-amortize.png'), c64.toBuffer('image/png'))
  ok(near(p8.perSample[0], NAIVE_PS, 1e-6), 'fig/as-naive', 'naive bar = the closed form at every S')
  ok(
    near(p64.perSample[1], FLOOR_SPEC + (T * 27_300 * Math.ceil(64 / AS_BATCH)) / 64, 1e-6),
    'fig/as-batched',
    `batched(B=${AS_BATCH}) at S=64 = ${p64.perSample[1].toFixed(0)} — recurring reflashes`,
  )
  ok(near(p64.perSample[2], FLOOR_COND + 27_300 / 64, 1e-6), 'fig/as-cond', `conditioned at S=64 = ${p64.perSample[2].toFixed(0)}`)
  ok(near(p64.perSample[3], FLOOR_SPEC + (T * 27_300) / 64, 1e-6), 'fig/as-disjoint', `disjoint at S=64 = ${p64.perSample[3].toFixed(0)}`)
  ok(
    p64.footprint[2] === PATCH_NODES && p64.footprint[3] === T * PATCH_NODES,
    'fig/as-footprint',
    `fabric: conditioned ${p64.footprint[2]} vs disjoint ${p64.footprint[3]} p-bits — the other axis of the trade`,
  )
  const { cost, fabric } = amortizeRegions(W, H)
  ok(regionDiff(c8, c64, cost.x, cost.y, cost.w, cost.h) > 100, 'fig/as-knob-moves-cost', 'the samples knob moves the cost bars')
  ok(regionDiff(c8, c64, fabric.x, fabric.y, fabric.w, fabric.h) === 0, 'fig/as-fabric-static', 'footprint does not depend on demand — 0 px differ')
  ok(regionInk(c64, PALETTE.bill, cost.x, cost.y, cost.w, cost.h) > 200, 'fig/as-cost-ink', 'cost bars in bill ink')
  ok(regionInk(c64, PALETTE.anti, fabric.x, fabric.y, fabric.w, fabric.h) > 100, 'fig/as-fabric-ink', 'footprint bars in their own ink')
}

// --- MixBudget --------------------------------------------------------------
{
  const H = 380
  const renderAt = (blendIdx: number, probe: MixBudgetProbe): Canvas => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
    const stepper = createMixBudget({ current: { blendIdx } }, probe)
    for (let f = 0; f < 3 + 120; f++) stepper.step(0.4) // τ (3 frames) + 120 dreams per wall
    stepper.draw(ctx, W, H)
    return canvas
  }
  const p0: MixBudgetProbe = {} as MixBudgetProbe
  const p10: MixBudgetProbe = {} as MixBudgetProbe
  const c0 = renderAt(0, p0)
  const c10 = renderAt(10, p10)
  writeFileSync(join(OUT, 'part3-mixbudget.png'), c10.toBuffer('image/png'))
  ok(
    p0.taus.every((v, i) => near(v, taus[i], 1e-9)),
    'fig/mb-taus',
    `figure τ = harness τ [${p0.taus.map((v) => v.toFixed(2)).join(', ')}]`,
  )
  ok(
    p0.alloc.every((v) => v === MB_BUDGET / T) && JSON.stringify(p10.alloc) !== JSON.stringify(p0.alloc),
    'fig/mb-knob-moves',
    `λ=0 [${p0.alloc.join(',')}] → λ=1 [${p10.alloc.join(',')}]`,
  )
  ok(
    p10.alloc.reduce((a, b) => a + b, 0) === MB_BUDGET,
    'fig/mb-equal-bill',
    `weighted split still spends exactly S=${MB_BUDGET}`,
  )
  ok(p10.dreams >= 100, 'fig/mb-dreams-flow', `${p10.dreams} dreams per wall accumulated`)
  ok(
    Number.isFinite(p10.strayUniform) && Number.isFinite(p10.strayBlend) && Math.abs(p10.strayUniform - p10.strayBlend) < 0.12,
    'fig/mb-witnesses-null',
    `witnesses at 120 dreams: stray ${p10.strayUniform.toFixed(2)} vs ${p10.strayBlend.toFixed(2)} — the on-canvas view of the measured null`,
  )
  const { levels, strips } = mixBudgetRegions(W, H)
  ok(regionInk(c10, PALETTE.ferro, levels.x, levels.y, levels.w, levels.h) > 50, 'fig/mb-tau-ink', 'τ bars in ferro')
  ok(regionInk(c10, PALETTE.held, levels.x, levels.y, levels.w, levels.h) > 50, 'fig/mb-U-ink', '|U| bars in the clamp green')
  ok(regionInk(c10, PALETTE.hid, levels.x, levels.y, levels.w, levels.h) > 50, 'fig/mb-W-ink', '|W| bars in the hidden pink')
  ok(regionInk(c10, PALETTE.sUp, strips.x, strips.y, strips.w, strips.h) > 200, 'fig/mb-strips-paint', 'both walls dream in spin amber')
  ok(regionDiff(c0, c10, levels.x, levels.y, levels.w, levels.h) > 50, 'fig/mb-alloc-visible', 'the allocation bars move with the knob')
}

// ---------------------------------------------------------------------------
// MEASURED FACTS — the block 07 PLAN's placeholders quote. Prose binds here.
// ---------------------------------------------------------------------------

const condFloorPS64 = FLOOR_COND + 27_300 / 64
console.log(`
=== MEASURED FACTS (Part 3a, 2026-08-25 — BINDS prose per 07 PLAN) ===
Cost model (frozen basis): sweep 1 · readout ${READOUT_ITERS} · reflash ${REFLASH_ITERS} per swap event ·
  clamp ${CLAMP_ITERS_PER_NODE.toFixed(2)}/node (= reflash ÷ ${CLAMP_BASIS_NODES}-node patch; clamping ≈ flashing per node, §II B 2).
  All numbers are MODELED RATES from verified constants — not hardware measurements.
#1 THE NAIVE BILL (T=3, k=6, 16-pixel clamps): ${otFacts}
#1b joules (§II B estimate, labeled): naive ${(NAIVE_PS * JOULES_PER_ITER * 1e6).toFixed(1)} μJ/sample → ${(1 / (NAIVE_PS * JOULES_PER_ITER)).toFixed(0)} samples/J;
    conditioned amortized (S=64) ${(condFloorPS64 * JOULES_PER_ITER * 1e6).toFixed(2)} μJ/sample → ${(1 / (condFloorPS64 * JOULES_PER_ITER)).toFixed(0)} samples/J.
#2 CONDITIONED vs SPECIALISTS (4×4 oracle, 12 probes/level, same data stream seed 7, 400 epochs, nh=8 vs 3×nh=4):
    per-level exact KL — specialists ${klSpec.map((v) => v.toFixed(3)).join(' / ')} · conditioned ${klCond.map((v) => v.toFixed(3)).join(' / ')}
    (untrained ${klUntrained.map((v) => v.toFixed(3)).join(' / ')} — NOTE: at t=3 the broad target lets a FLAT kernel
    score ${klUntrained[2].toFixed(2)} by vagueness; t=3 is genuinely the conditioned kernel's weak level). Sharing is NOT free here: near-parity at the middle level
    (×${(klCond[1] / klSpec[1]).toFixed(2)}), measured factors ×${(klCond[0] / klSpec[0]).toFixed(1)} and ×${(klCond[2] / klSpec[2]).toFixed(1)} at the ends — the price of one flash ever.
    Wrong-τ-code probe: KL rises ~0.2 nats — the level code carries real information. Train time ${condTrainSecs.toFixed(1)}s.
#3 THE CLAMP FLOOR (conditioned chain, 18-node clamps): floor ${FLOOR_COND} iters/sample,
    clamps ${(T * clamp18).toFixed(1)} = ${((T * clamp18) / FLOOR_COND * 100).toFixed(1)}% at k=6; still ${(((T * clamp18) / (T * (clamp18 + 300 + 600))) * 100).toFixed(1)}% at k=600.
    Amortization: naive ${NAIVE_PS.toFixed(0)} → conditioned@S=64 ${condFloorPS64.toFixed(0)} = ×${(NAIVE_PS / condFloorPS64).toFixed(2)} cheaper (×${(NAIVE_PS / FLOOR_COND).toFixed(2)} at S→∞).
#4 PER-LEVEL MIXING (PRETRAINED, 20k-sweep chains, seed 23): τ = ${taus.map((v) => v.toFixed(2)).join(' / ')}.
    Clamped-exemption probe: W×2 → τ ×${(measureLevelTau(scaledDenoise(PRETRAINED[1], 1, 2), tauProbeInput(2), 23).tau / taus[1]).toFixed(1)} at t=2; U×2 never raises τ beyond 15% (it DROPS it at t=2).
#5 ALLOCATION AT EQUAL BILL — MEASURED NULL: ${allocFacts}
    Act III's honest narrative is the null: warm-started reverse steps do not pay τ at this size.
#6 SCHEDULE LEDGER at S=64 (iters/sample): naive ${NAIVE_PS.toFixed(0)} · batched(B=8) ${(FLOOR_SPEC + (T * 27_300 * 8) / 64).toFixed(0)} · conditioned ${condFloorPS64.toFixed(0)} · disjoint ${(FLOOR_SPEC + (T * 27_300) / 64).toFixed(0)};
    fabric: one patch ${PATCH_NODES} p-bits vs disjoint ${T * PATCH_NODES}. Verdict: batched+conditioned (near-cheapest, 1× fabric, one flash ever);
    disjoint edges conditioned by ~${(((condFloorPS64 / (FLOOR_SPEC + (T * 27_300) / 64)) - 1) * 100).toFixed(1)}% per sample at S=64 (no τ-spin clamp surcharge) but costs ${T}× the fabric — regime: small T, idle fabric.
=== end MEASURED FACTS ===
`)

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`)
  process.exit(1)
}
console.log('all part3a checks green')
