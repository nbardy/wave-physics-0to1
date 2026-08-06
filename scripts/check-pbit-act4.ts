/**
 * Headless checks for ACT IV of the p-bit lesson (§9–§10 + hero). Two tiers,
 * same shape as check-pbit-figures.ts:
 *
 *  1. ORACLE TIER — the denoise trainer against exact truth. The closed-form
 *     hidden-spin marginalization is checked against lib.ts's brute-force
 *     enumerator (the lesson's frozen oracle) on a reduced model; then the
 *     act's four load-bearing claims are measured, not asserted: training
 *     lowers exact NLL, denoising beats the corruption it undoes, hidden
 *     units beat the factorized model's pairwise correlations by a stated
 *     factor, and the synchronous negative phase learns measurably biased
 *     kernels. Also a regression guard holding the SHIPPED pretrained
 *     constants to the same training run they claim to be — a schedule or
 *     trainer change cannot silently strand pretrained.ts.
 *
 *  2. FIGURE TIER — steppers rendered into @napi-rs/canvas, asserting the
 *     specific thing each figure must show (one quantity's own colour, knobs
 *     driven to both ends). Renders land in `_figure_check/` for eyeballing.
 *
 * Run with `bun run scripts/check-pbit-act4.ts`.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { PALETTE } from '../src/sims/lib/palette'
import { buildModel, enumerate, tvDistance, type Edge } from '../src/sims/pbits/lib'
import {
  corrError,
  createTrainer,
  dream,
  exactConditional,
  exactDataReverse,
  exactNLL,
  forwardChain,
  initModel,
  pairwiseCorr,
  reverseStep,
  N_LEVELS,
  NV,
  TRAIN_DEFAULTS,
  type NegSampler,
} from '../src/sims/pbits/denoise'
import { GLYPH_LIST, GLYPHS, hamming } from '../src/sims/pbits/glyphs'
import { PRETRAINED } from '../src/sims/pbits/pretrained'
import { createFilmstrip, type FilmstripProbe } from '../src/sims/pbits/Filmstrip'
import { createPhaseTrainer, type PhaseProbe } from '../src/sims/pbits/PhaseTrainer'
import { createDreamChain, type DreamChainProbe } from '../src/sims/pbits/DreamChain'
import { createDreamCompare, type CompareProbe } from '../src/sims/pbits/DreamCompare'
import {
  createMosaicHero,
  freshPaint,
  type MosaicProbe,
  type MosaicShared,
} from '../src/sims/pbits/MosaicHero'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const chrom: NegSampler = { kind: 'chromatic' }
const sync: NegSampler = { kind: 'synchronous' }
const SEED = 7 // the shipped weights' seed — everything here is deterministic

// ---------------------------------------------------------------------------
// Tier 1 — the oracle.
// ---------------------------------------------------------------------------

{
  // The closed-form hidden-spin marginalization vs lib's brute-force
  // enumerator, on a reduced model (4 visible + 4 hidden = 8 spins, so the
  // full joint fits): fold the clamped x into y-biases, build the equivalent
  // PbitModel, enumerate all 256 joint states, sum out the hidden four, and
  // compare with exactConditional's log-2cosh shortcut.
  const m = initModel(4, 4, 99)
  // give it non-trivial weights so agreement isn't vacuous
  for (let i = 0; i < m.U.length; i++) m.U[i] = Math.sin(i * 1.7) * 0.8
  for (let i = 0; i < m.W.length; i++) m.W[i] = Math.cos(i * 2.3) * 1.1
  for (let j = 0; j < 4; j++) m.b[j] = 0.3 - 0.2 * j
  for (let k = 0; k < 4; k++) m.c[k] = 0.1 * k - 0.15
  const x = Int8Array.from([1, -1, -1, 1])
  const closed = exactConditional(m, x)
  const h: number[] = []
  for (let j = 0; j < 4; j++) {
    let a = m.b[j]
    for (let i = 0; i < 4; i++) a += x[i] * m.U[i * 4 + j]
    h.push(a)
  }
  for (let k = 0; k < 4; k++) h.push(m.c[k])
  const edges: Edge[] = []
  for (let k = 0; k < 4; k++)
    for (let j = 0; j < 4; j++) edges.push({ i: 4 + k, j, J: m.W[k * 4 + j] })
  const joint = enumerate(buildModel(8, h, edges, 1))
  const marg = new Float64Array(16)
  for (let idx = 0; idx < 256; idx++) marg[idx & 15] += joint[idx]
  // tolerance: the model stores Float32 weights, and the two routes
  // accumulate them in different orders — agreement to ~1e-7 is exact modulo
  // float rounding; a real marginalization bug lands at 1e-2 or worse.
  ok(
    tvDistance(closed, marg) < 1e-6,
    'oracle/marginalization',
    `closed-form vs enumerated hidden sum, TV ${tvDistance(closed, marg).toExponential(1)}`,
  )
}

{
  // exactDataReverse boundary: hand it an UNcorrupted glyph at t=1 and the
  // most probable predecessor must be that glyph itself.
  const g = GLYPHS.box
  const q = exactDataReverse(GLYPH_LIST, 1, g)
  let best = 0
  for (let i = 1; i < q.length; i++) if (q[i] > q[best]) best = i
  let gBits = 0
  for (let k = 0; k < NV; k++) if (g[k] > 0) gBits |= 1 << k
  ok(best === gBits, 'oracle/reverse-boundary', `argmax q(·|clean box) is the box itself`)
}

// The act's three trained models — same data, same budget, three regimes.
const tC = createTrainer(GLYPH_LIST, { ...TRAIN_DEFAULTS, nh: 4, sampler: chrom, seed: SEED })
const tF = createTrainer(GLYPH_LIST, { ...TRAIN_DEFAULTS, nh: 0, sampler: chrom, seed: SEED })
const tS = createTrainer(GLYPH_LIST, { ...TRAIN_DEFAULTS, nh: 4, sampler: sync, seed: SEED })

// held-out eval pairs (seed disjoint from training)
const evalPairs: Array<{ t: number; x: Int8Array; y: Int8Array }> = []
for (let g = 0; g < GLYPH_LIST.length; g++)
  for (let d = 0; d < 2; d++) {
    const frames = forwardChain(GLYPH_LIST[g], 999, g * 2 + d)
    for (let t = 1; t <= N_LEVELS; t++) evalPairs.push({ t, x: frames[t], y: frames[t - 1] })
  }
const nllPerLevel = (models: typeof tC.models) =>
  [1, 2, 3].map((t) => exactNLL(models[t - 1], evalPairs.filter((p) => p.t === t)))

{
  const initNLL = nllPerLevel(tC.models)
  tC.runEpochs(TRAIN_DEFAULTS.epochs)
  tF.runEpochs(TRAIN_DEFAULTS.epochs)
  tS.runEpochs(TRAIN_DEFAULTS.epochs)
  const finalNLL = nllPerLevel(tC.models)
  for (let t = 1; t <= N_LEVELS; t++) {
    ok(
      finalNLL[t - 1] < 0.95 * initNLL[t - 1],
      'oracle/loss-decreases',
      `t=${t}: exact NLL ${initNLL[t - 1].toFixed(2)} → ${finalNLL[t - 1].toFixed(2)}`,
    )
  }
  // the easy level must be learned nearly cold — its truth is near-deterministic
  ok(finalNLL[0] < 1.0, 'oracle/level-1-learned', `t=1 exact NLL ${finalNLL[0].toFixed(2)} nats`)
}

{
  // denoising beats the corruption it undoes: corrupt to t=2 (~4 px astray),
  // run the reverse chain down, measure pixels astray from the source glyph.
  let corrupted = 0
  let recon = 0
  const TRIALS = 120
  for (let trial = 0; trial < TRIALS; trial++) {
    const g = GLYPH_LIST[trial % GLYPH_LIST.length]
    const frames = forwardChain(g, 777 + SEED, trial)
    corrupted += hamming(frames[2], g)
    let x = frames[2]
    for (let t = 2; t >= 1; t--) x = reverseStep(tC.models[t - 1], x, 6, 555 + SEED, trial * 8 + t)
    recon += hamming(x, g)
  }
  ok(
    recon < 0.8 * corrupted,
    'oracle/reconstruction',
    `${(corrupted / TRIALS).toFixed(2)} px astray corrupted → ${(recon / TRIALS).toFixed(2)} px denoised`,
  )
}

const dreamsOf = (models: typeof tC.models, n = 300) => {
  const out: Int8Array[] = []
  for (let r = 0; r < n; r++) out.push(dream(models, SEED * 13 + 4242, r, 6)[N_LEVELS])
  return out
}
const DATA_CORR = pairwiseCorr(GLYPH_LIST)

{
  // hidden units beat the factorized model's dream correlations ×1.5
  const errC = corrError(pairwiseCorr(dreamsOf(tC.models)), DATA_CORR)
  const errF = corrError(pairwiseCorr(dreamsOf(tF.models)), DATA_CORR)
  ok(
    errF > 1.5 * errC,
    'oracle/factorized-tears',
    `pairwise-corr error: coupled ${errC.toFixed(3)} vs factorized ${errF.toFixed(3)} (×${(errF / errC).toFixed(2)})`,
  )
}

{
  // the synchronous negative phase learns BIASED kernels: measurably
  // divergent from the chromatic-trained ones, and further from the exact
  // reverse — the §5 crime, resurfacing inside learning.
  const probe = forwardChain(GLYPH_LIST[1], 2024, 3)[3]
  const kC = exactConditional(tC.models[2], probe)
  const kS = exactConditional(tS.models[2], probe)
  const truth = exactDataReverse(GLYPH_LIST, 3, probe)
  const div = tvDistance(kC, kS)
  const biasC = tvDistance(kC, truth)
  const biasS = tvDistance(kS, truth)
  ok(div > 0.3, 'oracle/sync-diverges', `TV(chromatic-trained, sync-trained) = ${div.toFixed(3)} at t=3`)
  ok(
    biasS > biasC + 0.15,
    'oracle/sync-biased',
    `distance from exact reverse: chromatic ${biasC.toFixed(3)} vs synchronous ${biasS.toFixed(3)}`,
  )
}

{
  // the shipped hero constants ARE this training run (up to the 6-digit
  // rounding they were stored at) — regression guard so a trainer or
  // schedule change cannot silently strand pretrained.ts.
  for (let t = 1; t <= N_LEVELS; t++) {
    const probe = forwardChain(GLYPH_LIST[2], 2024, t)[t]
    const tv = tvDistance(
      exactConditional(PRETRAINED[t - 1], probe),
      exactConditional(tC.models[t - 1], probe),
    )
    ok(tv < 0.01, 'oracle/pretrained-fidelity', `t=${t}: TV(shipped, retrained) ${tv.toExponential(1)}`)
  }
}

// ---------------------------------------------------------------------------
// Tier 2 — the figures.
// ---------------------------------------------------------------------------

const W = 640

function render(name: string, h: number, make: () => Stepper, seconds: number) {
  const canvas = createCanvas(W, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = make()
  const steps = Math.round(seconds * 60)
  for (let i = 0; i < steps; i++) stepper.step(1 / 60)
  ctx.clearRect(0, 0, W, h)
  stepper.draw(ctx, W, h)
  writeFileSync(join(OUT, `${name}.png`), canvas.toBuffer('image/png'))
  return ctx.getImageData(0, 0, W, h)
}

function hexRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/** Count pixels within tolerance of one palette ink — never "any ink". */
function inkCount(img: ImageData, hex: string, tol = 40, minAlpha = 60): number {
  const [r, g, b] = hexRGB(hex)
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < minAlpha) continue
    if (
      Math.abs(img.data[i] - r) < tol &&
      Math.abs(img.data[i + 1] - g) < tol &&
      Math.abs(img.data[i + 2] - b) < tol
    )
      n++
  }
  return n
}

{
  // Filmstrip: the clean pane matches the glyph; the noise knob at both ends
  // changes how astray the middle of the strip runs (averaged over redraws —
  // the strip is a distribution, so one draw proves nothing).
  const meanAstray = (scale: number) => {
    const probe: FilmstripProbe = { frames: [] }
    const shared = { current: { glyph: 'cross' as const, scale } }
    const stepper = createFilmstrip(shared, probe)
    let total = 0
    const DRAWS = 24
    for (let d = 0; d < DRAWS; d++) {
      for (let i = 0; i < 55; i++) stepper.step(1 / 60) // > one redraw period
      total += hamming(probe.frames[2], probe.frames[0])
    }
    return total / DRAWS
  }
  const lo = meanAstray(0.4)
  const hi = meanAstray(1.6)
  ok(lo < hi - 1, 'fig/filmstrip-knob', `t=2 pixels astray: ${lo.toFixed(2)} at gentle vs ${hi.toFixed(2)} at harsh`)
  const img = render(
    'act4-filmstrip',
    210,
    () => createFilmstrip({ current: { glyph: 'cross', scale: 1 } }),
    2,
  )
  ok(inkCount(img, PALETTE.sUp) > 800, 'fig/filmstrip-ink', `sUp ink ${inkCount(img, PALETTE.sUp)} px`)
}

{
  // PhaseTrainer: after ~45 simulated seconds the trainer has spent its
  // budget, the phase disagreement has fallen, and the exact patch audit is
  // in place; the two phase tints (their first appearance in the lesson) and
  // the clamp halos are actually painted.
  const probe: PhaseProbe = { epoch: 0, disagreement: NaN, peakDisagreement: 0, auditTV: NaN }
  const shared = { current: { level: 2 } }
  const stepper = createPhaseTrainer(shared, probe)
  for (let i = 0; i < 2700; i++) stepper.step(1 / 60) // 45 s in
  const late = probe.disagreement
  ok(probe.epoch >= TRAIN_DEFAULTS.epochs, 'fig/phase-epochs', `trained ${probe.epoch} epochs`)
  ok(
    late < 0.7 * probe.peakDisagreement,
    'fig/phase-disagreement-falls',
    `phase disagreement peaked ${probe.peakDisagreement.toFixed(3)} untrained → ${late.toFixed(3)} trained`,
  )
  ok(
    Number.isFinite(probe.auditTV) && probe.auditTV < 0.45,
    'fig/phase-audit',
    `exact 2×2-patch audit TV ${probe.auditTV.toFixed(3)}`,
  )
  const canvas = createCanvas(W, 330)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, 330)
  writeFileSync(join(OUT, 'act4-phase-trainer.png'), canvas.toBuffer('image/png'))
  const img = ctx.getImageData(0, 0, W, 330)
  // the tints are low-alpha washes of the held green / meter violet
  const tintPixels = (hex: string) => inkCount(img, hex, 30, 12)
  ok(tintPixels(PALETTE.held) > 3000, 'fig/phase-tint-data', `data-phase green wash ${tintPixels(PALETTE.held)} px`)
  ok(tintPixels(PALETTE.meter) > 3000, 'fig/phase-tint-dream', `dream-phase violet wash ${tintPixels(PALETTE.meter)} px`)
  ok(inkCount(img, PALETTE.held) > 100, 'fig/phase-halos', `held halo ink ${inkCount(img, PALETTE.held)} px`)
}

{
  // DreamChain: at the default six sweeps the finished dreams are family
  // members; starving the sampler to one sweep degrades them. Both knob ends
  // exercised on the figure's own probe.
  const rate = (sweeps: number, seconds: number) => {
    const probe: DreamChainProbe = { finished: 0, withinFamily: 0, distSum: 0 }
    const stepper = createDreamChain({ current: { sweeps } }, probe)
    for (let i = 0; i < seconds * 60; i++) stepper.step(1 / 60)
    return { probe }
  }
  const rich = rate(6, 300)
  const starved = rate(1, 300)
  ok(
    rich.probe.finished >= 50,
    'fig/dream-chain-runs',
    `${rich.probe.finished} dreams finished in 300 s`,
  )
  ok(
    rich.probe.withinFamily / rich.probe.finished > 0.7,
    'fig/dream-chain-family',
    `${rich.probe.withinFamily}/${rich.probe.finished} within 3 px of a glyph at 6 sweeps`,
  )
  const meanRich = rich.probe.distSum / rich.probe.finished
  const meanStarved = starved.probe.distSum / starved.probe.finished
  ok(
    meanStarved > meanRich + 0.1,
    'fig/dream-chain-knob',
    `mean px from nearest glyph: ${meanStarved.toFixed(2)} starved vs ${meanRich.toFixed(2)} at 6 sweeps`,
  )
  render('act4-dream-chain', 200, () => createDreamChain({ current: { sweeps: 6 } }), 30)
}

{
  // DreamCompare, factorized mode: the live-trained challenger's running
  // pairwise-correlation error lands measurably above the reference row's.
  const probe: CompareProbe = {
    trained: false,
    refCorrErr: NaN,
    chCorrErr: NaN,
    refKernelTV: NaN,
    chKernelTV: NaN,
  }
  const stepper = createDreamCompare('factorized', probe)
  for (let i = 0; i < 150 * 60; i++) stepper.step(1 / 60)
  ok(probe.trained, 'fig/compare-f-trains', 'factorized model finished its live training')
  ok(
    probe.chCorrErr > 1.3 * probe.refCorrErr,
    'fig/compare-f-separation',
    `corr error ${probe.refCorrErr.toFixed(3)} coupled vs ${probe.chCorrErr.toFixed(3)} factorized on the rows shown`,
  )
  const canvas = createCanvas(W, 240)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, 240)
  writeFileSync(join(OUT, 'act4-compare-factorized.png'), canvas.toBuffer('image/png'))
}

{
  // DreamCompare, synchronous mode: the one-time exact kernel audit shows the
  // sync-trained row further from the true reverse kernel.
  const probe: CompareProbe = {
    trained: false,
    refCorrErr: NaN,
    chCorrErr: NaN,
    refKernelTV: NaN,
    chKernelTV: NaN,
  }
  const stepper = createDreamCompare('synchronous', probe)
  for (let i = 0; i < 60 * 60; i++) stepper.step(1 / 60)
  ok(probe.trained, 'fig/compare-s-trains', 'sync-trained model finished its live training')
  ok(
    probe.chKernelTV > probe.refKernelTV + 0.15,
    'fig/compare-s-bias',
    `single-step TV from exact reverse: ${probe.refKernelTV.toFixed(3)} red/black vs ${probe.chKernelTV.toFixed(3)} all-at-once`,
  )
  const canvas = createCanvas(W, 240)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, 240)
  writeFileSync(join(OUT, 'act4-compare-synchronous.png'), canvas.toBuffer('image/png'))
}

{
  // MosaicHero: the wall dreams in the glyph family under the shipped
  // weights, and after the reader paints a glyph and retrains, the painted
  // glyph starts surfacing across the population.
  const shared: { current: MosaicShared } = {
    current: { painted: freshPaint(), wantTrain: false, wantForget: false },
  }
  const probe: MosaicProbe = { finished: 0, withinFamily: 0, matchPainted: 0, trainedOnPaint: false }
  const stepper = createMosaicHero(shared, probe)
  for (let i = 0; i < 30 * 60; i++) stepper.step(1 / 60)
  ok(probe.finished > 100, 'fig/mosaic-runs', `${probe.finished} dreams finished across the wall in 30 s`)
  ok(
    probe.withinFamily / probe.finished > 0.7,
    'fig/mosaic-family',
    `${probe.withinFamily}/${probe.finished} within 3 px of a glyph`,
  )
  const canvas = createCanvas(W, 300)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, 300)
  writeFileSync(join(OUT, 'act4-mosaic-hero.png'), canvas.toBuffer('image/png'))
  const img = ctx.getImageData(0, 0, W, 300)
  ok(inkCount(img, PALETTE.sUp) > 4000, 'fig/mosaic-ink', `sUp ink ${inkCount(img, PALETTE.sUp)} px`)
  // paint a seventh glyph the six don't contain (the top half), retrain, run on
  for (let i = 0; i < 8; i++) shared.current.painted[i] = 1
  shared.current.wantTrain = true
  for (let i = 0; i < 5 * 60 && !probe.trainedOnPaint; i++) stepper.step(1 / 60)
  ok(probe.trainedOnPaint, 'fig/mosaic-retrains', 'in-browser retrain completed on the painted glyph')
  const before = probe.matchPainted
  for (let i = 0; i < 45 * 60; i++) stepper.step(1 / 60)
  ok(
    probe.matchPainted - before >= 5,
    'fig/mosaic-painted-appears',
    `${probe.matchPainted - before} dreams within 2 px of the painted glyph after retraining`,
  )
  const canvas2 = createCanvas(W, 300)
  const ctx2 = canvas2.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx2, W, 300)
  writeFileSync(join(OUT, 'act4-mosaic-retrained.png'), canvas2.toBuffer('image/png'))
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
