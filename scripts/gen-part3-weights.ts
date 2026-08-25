/**
 * Offline training run for Part 3's fabric-native 8×8 denoiser (PLAN F11).
 * Produces src/sims/pbits/pretrained8.ts — the shipped weights the FabricDream
 * figure loads (the hero-ships-pretrained device, third use in the series;
 * confessed in prose). Deterministic: same config + seed ⇒ same file, which is
 * what check-part3b.ts's regression guard re-derives and compares.
 *
 * Run with `bun run scripts/gen-part3-weights.ts`.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FABRIC_TRAIN_DEFAULTS,
  createFabricTrainer,
  dream8,
  forwardChain8,
  pairwiseCorr8,
  placeGlyph8,
  reverseStep8,
  sweepFabric,
  dataFencedConditional,
  modelFencedConditional,
  type FabricModel,
  type FabricSampler,
} from '../src/sims/pbits/denoiseFabric'
import { corrError, N_LEVELS } from '../src/sims/pbits/denoise'
import { GLYPH8_LIST, hamming8, nearestGlyph8Distance } from '../src/sims/pbits/glyphs8'
import { tvDistance, u01 } from '../src/sims/pbits/lib'

export const GEN_SEED = 11
const chrom: FabricSampler = { kind: 'chromatic' }

const pl = placeGlyph8()
const t0 = performance.now()
const trainer = createFabricTrainer(GLYPH8_LIST, pl, {
  ...FABRIC_TRAIN_DEFAULTS,
  sampler: chrom,
  seed: GEN_SEED,
})
trainer.runEpochs(FABRIC_TRAIN_DEFAULTS.epochs)
const wallClock = (performance.now() - t0) / 1000
console.log(`trained ${FABRIC_TRAIN_DEFAULTS.epochs} epochs in ${wallClock.toFixed(1)} s`)

// --- quick witness readout (the full measured-facts pass lives in check-part3b) ---
{
  // W3 known-answer probe
  let corrupted = 0
  let recon = 0
  const TRIALS = 60
  for (let trial = 0; trial < TRIALS; trial++) {
    const g = GLYPH8_LIST[trial % GLYPH8_LIST.length]
    const frames = forwardChain8(g, 777, trial)
    corrupted += hamming8(frames[2], g)
    let x = frames[2]
    for (let t = 2; t >= 1; t--) x = reverseStep8(trainer.models[t - 1], pl, x, 24, 555, trial * 8 + t)
    recon += hamming8(x, g)
  }
  console.log(
    `W3 known-answer: ${(corrupted / TRIALS).toFixed(2)} px astray corrupted → ${(recon / TRIALS).toFixed(2)} denoised`,
  )
  // W2 moments + dream family distance
  const dreams: Int8Array[] = []
  let distSum = 0
  for (let r = 0; r < 200; r++) {
    const d = dream8(trainer.models, pl, 4242, r, 24)[N_LEVELS]
    dreams.push(d)
    distSum += nearestGlyph8Distance(d)
  }
  console.log(
    `W2 moments err: ${corrError(pairwiseCorr8(dreams), pairwiseCorr8(GLYPH8_LIST)).toFixed(4)} · mean px from nearest glyph: ${(distSum / dreams.length).toFixed(2)}`,
  )
  // W1 fenced conditional at t=1 on one probe — hidden context equilibrated
  // (20 clamped sweeps), the state the sampler would actually hold when read.
  const frames = forwardChain8(GLYPH8_LIST[0], 999, 0)
  const fence = [27, 28, 35, 36]
  const s = new Int8Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) {
    const p = pl.pixOf[i]
    s[i] = p >= 0 ? frames[0][p] : u01(1, 0, i, 5) < 0.5 ? -1 : 1
  }
  for (let sw = 0; sw < 20; sw++)
    sweepFabric(trainer.models[0], pl, frames[1], s, false, chrom, (site, salt) => u01(88, sw, site, salt))
  const tv = tvDistance(
    modelFencedConditional(trainer.models[0], pl, frames[1], s, fence),
    dataFencedConditional(GLYPH8_LIST, 1, frames[1], frames[0], fence),
  )
  console.log(`W1 fenced TV (t=1, one probe): ${tv.toFixed(4)}`)
}

// --- emit pretrained8.ts ---
const fmt = (v: number) => {
  const s = Number(v.toPrecision(6)).toString()
  return s
}
const arr = (a: Float32Array) => `Float32Array.from([${Array.from(a, fmt).join(',')}])`
const modelSrc = (m: FabricModel) =>
  `  {\n    b: ${arr(m.b)},\n    u: ${arr(m.u)},\n    J: ${arr(m.J)},\n  }`

const out = `// The FabricDream figure's pretrained weights — the hero-ships-pretrained
// device, third use in the series (confessed in prose; the 4×4 wall keeps the
// live paint-box job). PROVENANCE: produced by this repo's own fabric trainer
// (denoiseFabric.ts createFabricTrainer) on the seven built-in 8×8 glyphs,
// run headlessly via bun by scripts/gen-part3-weights.ts on ${new Date().toISOString().slice(0, 10)}:
// config { epochs: ${FABRIC_TRAIN_DEFAULTS.epochs}, drawsPerGlyph: ${FABRIC_TRAIN_DEFAULTS.drawsPerGlyph}, kPos: ${FABRIC_TRAIN_DEFAULTS.kPos}, kNeg: ${FABRIC_TRAIN_DEFAULTS.kNeg}, avg: ${FABRIC_TRAIN_DEFAULTS.avg},
// lr: ${FABRIC_TRAIN_DEFAULTS.lr}, sampler: chromatic, seed: ${GEN_SEED} } — FABRIC_TRAIN_DEFAULTS verbatim,
// training wall-clock ${wallClock.toFixed(1)} s. Placement: placeGlyph8() (16×16 torus, pixels
// on the even-even cells of one color class, hidden = BFS layers 1–2).
// Regenerate by re-running the generator; scripts/check-part3b.ts re-derives
// this exact run and asserts the shipped constants match it, so a trainer or
// schedule change cannot silently strand this file.
//
// GENERATED FILE — edit the trainer, not these numbers.

import { N_LEVELS } from './denoise'
import type { FabricModel } from './denoiseFabric'

/** The generator's seed — the regression guard retrains with this. */
export const PRETRAINED8_SEED = ${GEN_SEED}

export const PRETRAINED8: FabricModel[] = [
${trainer.models.map(modelSrc).join(',\n')},
]

if (PRETRAINED8.length !== N_LEVELS) throw new Error('pretrained8 weights out of step with N_LEVELS')
`
const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'sims', 'pbits', 'pretrained8.ts')
writeFileSync(dest, out)
console.log(`wrote ${dest}`)
