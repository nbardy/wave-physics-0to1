/**
 * Act IV (meta-EBM) checks: the soft-product gate's exact algebra and its
 * exponential residual decay, the compiled per-site kernels against the
 * target's own Gibbs conditionals, the compiled chain's saturating error
 * floor (the Thermalizers Eq (43) contraction story), and per-figure ink +
 * knob checks for F15b/F16/F14. Compilation is over a fully connected spin
 * set, matching the paper's §IV D experiment — the Z1 placement penalty is
 * "not simulated" there and carries no number here either.
 * Run: bun run scripts/check-metaebm.ts
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import { countsToProbs, stateIndex, tvDistance, u01 } from '../src/sims/pbits/lib'
import {
  META_D,
  buildMetaModel,
  compileMeta,
  compiledField,
  deltaCurve,
  enumerateMeta,
  makeGate,
  marginalize,
  marqueeTriple,
  projSites,
  sweepSampledCompiled,
  targetField,
  tvCurveExact,
} from '../src/sims/pbits/metaEbm'
import { createSoftProduct, type SoftProductProbe } from '../src/sims/pbits/SoftProduct'
import { createMetaEbmChain, type MetaChainProbe } from '../src/sims/pbits/MetaEbmChain'
import { createMetaImpossible, type MetaImpossibleProbe } from '../src/sims/pbits/MetaImpossible'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const model = buildMetaModel()
const exact = enumerateMeta(model)
const marquee = marqueeTriple(model)

{
  // the model is the paper's sparse target: 18 of 66 pairs, 20 triples,
  // magnitudes ~N(0, 0.6²) — sanity on the seeded construction
  const pairKeys = new Set(model.pairs.map(({ m, n }) => `${m}-${n}`))
  ok(
    model.pairs.length === 18 && pairKeys.size === 18 && model.triples.length === 20,
    'meta/model',
    `${pairKeys.size} distinct pairs of 66, ${model.triples.length} triples of 220`,
  )
  let z = 0
  for (let i = 0; i < exact.length; i++) z += exact[i]
  ok(Math.abs(z - 1) < 1e-12, 'meta/law', `4096-state law sums to 1 ${Math.abs(z - 1).toExponential(1)} off`)
}

{
  // GATE ALGEBRA — the figure's whole claim. The compiled field must equal
  // the target field plus each gate's analytic residual (C − W)·x_m·x_m′
  // EXACTLY (the corner decomposition is an identity, not a limit). A bug in
  // either the softplus evaluation or the A/B/C bookkeeping breaks this at
  // 1e-2 scale, not 1e-12.
  let worst = 0
  const x = new Int8Array(META_D)
  for (const jg of [1.2, 2.5, 6]) {
    const cm = compileMeta(model, jg)
    for (let trial = 0; trial < 200; trial++) {
      for (let k = 0; k < META_D; k++) x[k] = u01(9, trial, k, 5) < 0.5 ? -1 : 1
      for (let n = 0; n < META_D; n++) {
        let expect = targetField(model, x, n)
        for (const g of cm.gateAt[n]) expect += (g.C - g.W) * x[g.m] * x[g.mp]
        worst = Math.max(worst, Math.abs(compiledField(cm, x, n) - expect))
      }
    }
  }
  ok(worst < 1e-12, 'gate/identity', `|compiled − (target + analytic residual)| ≤ ${worst.toExponential(1)}`)
}

{
  // RESIDUAL DECAY — one gate at the marquee coefficient, coupling swept
  // across the figure's knob range: the residual must fall monotonically and
  // at the asymptotic rate e^{−4a} (each unit of coupling buys e⁻⁴ ≈ 54×).
  const W = marquee.W
  const grid = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]
  const rs = grid.map((a) => Math.abs(makeGate(a, W, 0, 1).C - W))
  let monotone = true
  for (let k = 1; k < rs.length; k++) if (rs[k] >= rs[k - 1]) monotone = false
  ok(monotone, 'gate/monotone', `residual falls at every knob step: ${rs[0].toExponential(1)} → ${rs[rs.length - 1].toExponential(1)}`)
  const slope = (Math.log(rs[rs.length - 1]) - Math.log(rs[grid.indexOf(3.5)])) / (6 - 3.5)
  ok(slope > -4.2 && slope < -3.8, 'gate/rate', `measured ln-slope ${slope.toFixed(2)} per unit coupling (theory −4)`)
  ok(rs[rs.length - 1] < 1e-6 && rs[rs.length - 1] > 0, 'gate/floor', `residual at a=6: ${rs[rs.length - 1].toExponential(2)} — tiny, and honestly nonzero`)
}

{
  // COMPILED KERNELS vs EXACT GIBBS CONDITIONALS at strong coupling: every
  // site, every one of the 2^11 contexts.
  const cm = compileMeta(model, 6)
  const x = new Int8Array(META_D)
  let worst = 0
  for (let idx = 0; idx < 1 << META_D; idx++) {
    for (let k = 0; k < META_D; k++) x[k] = (idx >> k) & 1 ? 1 : -1
    for (let n = 0; n < META_D; n++) {
      const pc = 1 / (1 + Math.exp(-2 * compiledField(cm, x, n)))
      const pt = 1 / (1 + Math.exp(-2 * targetField(model, x, n)))
      worst = Math.max(worst, Math.abs(pc - pt))
    }
  }
  ok(worst < 1e-6, 'kernel/conditionals', `max |compiled − exact| over 12×4096 conditionals at J_max=6: ${worst.toExponential(2)}`)
}

{
  // THE CHAIN'S FLOOR — the Eq (43) contraction story. δ̃_t = TV(compiled
  // chain, ideal chain), both exact: it must accumulate, reach the bulk of
  // its floor within ~3 sweeps, then SATURATE (flat tail), and the floor
  // must move down when the knob loosens the coupling cap.
  const dv = deltaCurve(compileMeta(model, 2.5), 60)
  const floor = dv[60]
  ok(floor > 0.02 && floor < 0.08, 'chain/floor-exists', `δ̃ floor at J_max=2.5: ${floor.toFixed(4)} (nonzero — the compiled chain is honestly not the ideal one)`)
  ok(dv[3] > 0.5 * floor, 'chain/fast-accumulation', `δ̃ at sweep 3 is ${((100 * dv[3]) / floor).toFixed(0)}% of the floor — the bulk arrives in ~3 sweeps`)
  const creep = (dv[60] - dv[30]) / dv[60]
  ok(creep < 0.1, 'chain/saturates', `tail creep sweeps 30→60 only ${(100 * creep).toFixed(1)}% — flat, not growing with depth`)
  const floors = [1.5, 2.5, 4].map((jg) => deltaCurve(compileMeta(model, jg), 40)[40])
  ok(
    floors[0] > floors[1] && floors[1] > floors[2],
    'chain/knob-moves-floor',
    `floors at J_max 1.5/2.5/4: ${floors.map((f) => f.toExponential(1)).join(' > ')}`,
  )
  // TV to the exact LAW is a different clock: it falls fast early, then is
  // mixing-limited (this model's couplings reach ~1.5, so its own Gibbs
  // dynamics are slow) — assert the fall, the nonzero stationary gap, and
  // that the knob shrinks the gap.
  const tv = tvCurveExact(compileMeta(model, 2.5), exact, 60)
  ok(tv[3] < 0.35 * tv[0], 'chain/law-fall', `TV to law ${tv[0].toFixed(3)} → ${tv[3].toFixed(3)} in 3 sweeps`)
  ok(tv[60] > 1e-3, 'chain/law-gap', `stationary gap at J_max=2.5 after 60 sweeps: ${tv[60].toFixed(4)}`)
  const tvTight = tvCurveExact(compileMeta(model, 4), exact, 60)
  ok(tvTight[60] < tv[60], 'chain/law-knob', `J_max 4 vs 2.5 after 60 sweeps: ${tvTight[60].toExponential(1)} < ${tv[60].toExponential(1)}`)
}

{
  // SAMPLED CHAINS on the meter's projection — the occupancy the F16 bars
  // actually show, against the exact law's marginal.
  const cm = compileMeta(model, 2.5)
  const sites = projSites(model)
  const ghost = marginalize(exact, META_D, sites)
  const counts = new Float64Array(16)
  const chains = Array.from({ length: 48 }, (_, c) =>
    Int8Array.from({ length: META_D }, (_, k) => (u01(31, c, k, 0) < 0.5 ? -1 : 1)),
  )
  for (let t = 1; t <= 400; t++) {
    chains.forEach((s, c) => {
      sweepSampledCompiled(cm, s, (site, salt) => u01(77, t, site, salt * 101 + c))
      counts[stateIndex(s, sites)]++
    })
  }
  const tv = tvDistance(ghost, countsToProbs(counts))
  ok(tv < 0.12, 'chain/sampled-marginal', `occupancy TV on spins {${sites.join(',')}} after 400×48 sweeps: ${tv.toFixed(4)}`)
}

// ---------------------------------------------------------------------------
// Figures: render headlessly, sample each quantity's own ink, drive every
// knob to both ends.
// ---------------------------------------------------------------------------

const W = 680
const H = 340

function render(draw: (ctx: CanvasRenderingContext2D) => void, file: string) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  draw(ctx)
  writeFileSync(join(OUT, file), canvas.toBuffer('image/png'))
  return ctx.getImageData(0, 0, W, H)
}

function ink(img: ImageData, hex: string, tol = 40): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (
      Math.abs(img.data[i] - r) < tol &&
      Math.abs(img.data[i + 1] - g) < tol &&
      Math.abs(img.data[i + 2] - b) < tol
    )
      count++
  }
  return count
}

{
  // F15b — SoftProduct. The knob's two ends: weak coupling shows a fat red
  // residual, strong coupling kills it by orders of magnitude.
  const probeLo: SoftProductProbe = { residual: 0, realized: 0, target: 0 }
  const lo = createSoftProduct({ current: { a: 1.0 } }, probeLo)
  lo.step(1 / 60)
  const imgLo = render((ctx) => lo.draw(ctx, W, H), 'soft-product-weak.png')
  const probeHi: SoftProductProbe = { residual: 0, realized: 0, target: 0 }
  const hi = createSoftProduct({ current: { a: 6 } }, probeHi)
  hi.step(1 / 60)
  const imgHi = render((ctx) => hi.draw(ctx, W, H), 'soft-product-strong.png')
  ok(
    probeLo.residual > 1e4 * probeHi.residual,
    'fig/soft-knob',
    `corner residual ${probeLo.residual.toFixed(3)} (a=1) vs ${probeHi.residual.toExponential(1)} (a=6)`,
  )
  ok(
    Math.abs(probeHi.realized - probeHi.target) < 1e-6,
    'fig/soft-converged',
    `realized C ${probeHi.realized.toFixed(6)} vs target W ${probeHi.target.toFixed(6)} at a=6`,
  )
  const ferroLo = ink(imgLo, PALETTE.ferro)
  const ferroHi = ink(imgHi, PALETTE.ferro)
  ok(ferroLo > ferroHi + 2000, 'fig/soft-residual-ink', `residual (ferro) ink ${ferroLo} px weak vs ${ferroHi} px strong`)
  ok(ink(imgHi, PALETTE.meter) > 300, 'fig/soft-gate-ink', `${ink(imgHi, PALETTE.meter)} px of gate/curve violet`)
  ok(ink(imgHi, PALETTE.sUp) > 500, 'fig/soft-surface-ink', `${ink(imgHi, PALETTE.sUp)} px of positive-surface amber`)
  ok(ink(imgHi, PALETTE.ghost) > 200, 'fig/soft-ramp-ink', `${ink(imgHi, PALETTE.ghost)} px of softplus-ramp gray`)
}

{
  // F16 — MetaEbmChain, knob at both ends; the exact δ̃ curve finishes, the
  // sampled bars accumulate, and tightening the cap drops the floor.
  const run = (jGate: number, file: string) => {
    const probe: MetaChainProbe = { tvMeter: 1, floor: 0, samples: 0, curveDone: false }
    const stepper = createMetaEbmChain({ current: { jGate } }, probe)
    for (let f = 0; f < 70; f++) stepper.step(1 / 30)
    const img = render((ctx) => stepper.draw(ctx, W, H), file)
    return { probe, img }
  }
  const mid = run(2.5, 'metaebm-chain.png')
  const tight = run(4.5, 'metaebm-chain-tight.png')
  ok(mid.probe.curveDone && mid.probe.samples > 500, 'fig/chain-ran', `δ̃ curve complete, ${mid.probe.samples} marginal samples accumulated`)
  ok(mid.probe.floor > 0.02 && mid.probe.floor < 0.08, 'fig/chain-floor', `on-canvas floor ${mid.probe.floor.toFixed(4)} at J_max=2.5`)
  ok(tight.probe.floor < mid.probe.floor / 20, 'fig/chain-knob', `floor ${tight.probe.floor.toExponential(1)} at J_max=4.5 — the knob moves the floor`)
  ok(mid.probe.tvMeter < 0.35, 'fig/chain-meter', `sampled occupancy TV ${mid.probe.tvMeter.toFixed(3)} against the ghost`)
  ok(ink(mid.img, PALETTE.ghost) > 400, 'fig/chain-ghost-ink', `${ink(mid.img, PALETTE.ghost)} px of exact-ghost gray`)
  ok(ink(mid.img, PALETTE.meter) > 800, 'fig/chain-meter-ink', `${ink(mid.img, PALETTE.meter)} px of sampled/δ̃ violet`)
}

{
  // F14 — MetaImpossible. Re-rolling the placement changes how many pairwise
  // wires get lucky; the three-body row can never change.
  const probes: number[] = []
  let bestRoll = 1
  for (let roll = 1; roll <= 8; roll++) {
    const probe: MetaImpossibleProbe = { routable: -1 }
    const stepper = createMetaImpossible({ current: { roll } }, probe)
    stepper.step(1 / 60)
    const canvas = createCanvas(W, H)
    stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, W, H)
    probes.push(probe.routable)
    if (probe.routable > probes[bestRoll - 1]) bestRoll = roll
  }
  ok(
    Math.min(...probes) < Math.max(...probes),
    'fig/impossible-knob',
    `direct-wire count varies across rolls: {${probes.join(',')}} of 18`,
  )
  const probe: MetaImpossibleProbe = { routable: -1 }
  const stepper = createMetaImpossible({ current: { roll: bestRoll } }, probe)
  stepper.step(1 / 60)
  const img = render((ctx) => stepper.draw(ctx, W, H), 'meta-impossible.png')
  ok(ink(img, PALETTE.ferro) > 400, 'fig/impossible-flagged-ink', `${ink(img, PALETTE.ferro)} px of flagged red (unroutable wires + hyperedges)`)
  ok(probe.routable === 0 || ink(img, PALETTE.held) > 60, 'fig/impossible-landed-ink', `${ink(img, PALETTE.held)} px of landed green (${probe.routable} direct wires)`)
  ok(ink(img, PALETTE.meter) > 200, 'fig/impossible-spin-ink', `${ink(img, PALETTE.meter)} px of placed-spin violet rings`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
