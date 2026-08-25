/**
 * Headless checks for Part 3's Act IV scale notch (PLAN F11 + F12): the 8×8
 * fabric-native denoiser, its shipped weights, and the two figures. Same
 * two-tier shape as check-pbit-act4.ts, with one structural difference the
 * suite exists to dramatize: at 64 visible pixels the joint oracle is DEAD
 * (2^64 states; lib.MAX_EXACT stays 20), so the oracle tier is replaced by a
 * WITNESS tier — every assertion names the surviving witness it leans on:
 *
 *   W0 exact sub-oracle   — lib's frozen subModel + enumerate on a 4-node
 *                           fence, against which the fabric sampler is audited
 *   W1 fenced conditional — model vs true data-reverse on a pixel window,
 *                           both closed-form given the same context
 *   W2 pinned moments     — pairwise ⟨y_a y_b⟩ of dreams vs the glyph family
 *   W3 known-answer probe — corrupt a held-out draw, denoise, count pixels
 *   W4 autocorrelation    — integrated τ of the visible magnetization
 *
 * Plus: placement legality (one-color visible set, couplings only on real
 * fabric edges, the forced three-layer BFS architecture), the pretrained8.ts
 * regression guard (a full re-run of the generator's config must reproduce
 * the shipped constants), and the figure tier (inks, knobs to both ends,
 * legibility at 640 and 360). Ends with the MEASURED FACTS block that BINDS
 * Part 3 prose (PLAN §MEASURED FACTS #6).
 *
 * Run with `bun run scripts/check-part3b.ts`. (~2 min: the regression guard
 * replays the full offline training run.)
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { PALETTE } from '../src/sims/lib/palette'
import {
  MAX_EXACT,
  buildChromatic,
  buildModel,
  condProbPlus,
  countsToProbs,
  enumerate,
  stateIndex,
  subModel,
  sweep,
  tvDistance,
  u01,
  type Edge,
} from '../src/sims/pbits/lib'
import { corrError, N_LEVELS } from '../src/sims/pbits/denoise'
import {
  GLYPH8_LIST,
  GLYPH8_NAMES,
  GLYPH8_PIX,
  hamming8,
  nearestGlyph8Distance,
} from '../src/sims/pbits/glyphs8'
import {
  FABRIC_FOOTPRINT,
  FABRIC_TRAIN_DEFAULTS,
  autocorrTime,
  createFabricTrainer,
  dataFencedConditional,
  dream8,
  fabricField,
  forwardChain8,
  initFabricModel,
  modelFencedConditional,
  pairwiseCorr8,
  placeGlyph8,
  reverseStep8,
  sweepFabric,
  toPbitModel,
  type FabricModel,
  type FabricSampler,
} from '../src/sims/pbits/denoiseFabric'
import { PRETRAINED8, PRETRAINED8_SEED } from '../src/sims/pbits/pretrained8'
import { createFabricDream, type FabricDreamProbe } from '../src/sims/pbits/FabricDream'
import {
  ANCHOR_BITS,
  ANCHOR_PBITS,
  ANCHOR_SIDE,
  BAND_HI,
  BAND_LO,
  CEILING_PBITS,
  createCeilingChart,
  naiveCrossing,
  naivePbits,
  type CeilingProbe,
} from '../src/sims/pbits/CeilingChart'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const chrom: FabricSampler = { kind: 'chromatic' }
const facts: string[] = []
const fact = (s: string) => facts.push(s)

const pl = placeGlyph8()
const FENCE = [27, 28, 35, 36]

// ---------------------------------------------------------------------------
// Tier 0 — placement legality. The architecture is a placement decision;
// these assert the placement actually delivers what the prose will claim.
// ---------------------------------------------------------------------------

{
  ok(
    GLYPH8_PIX > MAX_EXACT,
    'placement/oracle-dead',
    `the suite's premise: ${GLYPH8_PIX} visible pixels > MAX_EXACT ${MAX_EXACT} — no joint oracle here`,
  )
  let oneColor = true
  for (const v of pl.visible) if (pl.g.colors[v] !== 0) oneColor = false
  ok(oneColor, 'placement/one-color', `all 64 visible cells on color class 0 (layering theorem's condition)`)
  const pop: number[] = []
  for (let i = 0; i < pl.g.n; i++) pop[pl.layer[i]] = (pop[pl.layer[i]] ?? 0) + 1
  ok(
    pl.nLayers === 3 && pop[0] === 64 && pop[1] === 128 && pop[2] === 64,
    'placement/forced-layers',
    `BFS layers [${pop.join(', ')}] — 64 pixels, 128 + 64 hidden, nobody designed it`,
  )
  let adjacent = true
  let pixelPixel = 0
  for (const [i, j] of pl.g.edges) {
    if (Math.abs(pl.layer[i] - pl.layer[j]) !== 1) adjacent = false
    if (pl.pixOf[i] >= 0 && pl.pixOf[j] >= 0) pixelPixel++
  }
  ok(adjacent, 'placement/adjacent-layers', `all ${pl.g.edges.length} edges span exactly one layer`)
  ok(
    pixelPixel === 0,
    'placement/no-pixel-wire',
    `pixel–pixel fabric edges: ${pixelPixel} — every correlation is hidden-mediated`,
  )
  // couplings only where the fabric routes them: the model's J is per-edge by
  // construction; assert the count so a dense-coupling regression cannot hide
  const m = PRETRAINED8[0]
  ok(
    m.J.length === pl.g.edges.length && m.b.length === pl.g.n && m.u.length === GLYPH8_PIX,
    'placement/couplings-on-edges',
    `J per real edge (${m.J.length}), b per node (${m.b.length}), u per pixel (${m.u.length}) — no other coupling storage exists`,
  )
  ok(
    FABRIC_FOOTPRINT === pl.g.n,
    'placement/footprint',
    `footprint ${FABRIC_FOOTPRINT} p-bits = the whole patch (pixels + hidden)`,
  )
  let minD = GLYPH8_PIX
  let maxD = 0
  for (let a = 0; a < GLYPH8_LIST.length; a++)
    for (let b = a + 1; b < GLYPH8_LIST.length; b++) {
      const d = hamming8(GLYPH8_LIST[a], GLYPH8_LIST[b])
      minD = Math.min(minD, d)
      maxD = Math.max(maxD, d)
    }
  ok(minD >= 12, 'placement/glyph-distances', `7 glyphs, pairwise Hamming ${minD}–${maxD}`)
  fact(`placement: 16×16 torus patch, ${pl.g.edges.length} edges, layers [${pop.join(', ')}], footprint ${FABRIC_FOOTPRINT} p-bits`)
  fact(`parameters per level: ${m.J.length} J + ${m.b.length} b + ${m.u.length} u = ${m.J.length + m.b.length + m.u.length} (×${N_LEVELS} levels)`)
  fact(`glyph family: ${GLYPH8_NAMES.join(', ')} — pairwise Hamming ${minD}–${maxD}`)
}

// ---------------------------------------------------------------------------
// Tier 1 — the witnesses, on the SHIPPED weights.
// ---------------------------------------------------------------------------

{
  // W0a: the fabric sampler's local rule IS the Gibbs rule of the model the
  // fence enumerator sees — fabricField vs lib's condProbPlus on toPbitModel.
  const x = forwardChain8(GLYPH8_LIST[3], 12, 0)[1]
  const pm = toPbitModel(PRETRAINED8[0], pl, x)
  const s = new Int8Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) s[i] = u01(5, 0, i, 1) < 0.5 ? -1 : 1
  let maxDiff = 0
  for (let k = 0; k < 40; k++) {
    const i = Math.floor(u01(6, 0, k, 2) * pl.g.n)
    const mine = 1 / (1 + Math.exp(-2 * fabricField(PRETRAINED8[0], pl, x, s, i)))
    maxDiff = Math.max(maxDiff, Math.abs(mine - condProbPlus(pm, s, i)))
  }
  ok(
    maxDiff < 1e-5,
    'W0/exact-sub-oracle (field)',
    `fabric local rule vs lib condProbPlus on 40 sites: max |Δ| ${maxDiff.toExponential(1)}`,
  )

  // W0b: the sub-oracle path itself — clamp all but a 4-node fence WITH
  // internal edges, sample with lib's frozen chromatic sweep, compare
  // occupancy to enumerate(subModel(...)). Validates the machinery every
  // fenced witness below stands on.
  const v0 = pl.visible[10]
  const n0 = pl.nbrNode[v0][0]
  const v1 = pl.visible[53]
  const n1 = pl.nbrNode[v1][3]
  const fenceNodes = [v0, n0, v1, n1]
  const clampArr = new Int8Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) clampArr[i] = s[i]
  for (const f of fenceNodes) clampArr[f] = 0
  const h = new Float64Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) {
    h[i] = PRETRAINED8[0].b[i]
    const p = pl.pixOf[i]
    if (p >= 0) h[i] += PRETRAINED8[0].u[p] * x[p]
  }
  const edges: Edge[] = pl.g.edges.map(([i, j], e) => ({ i, j, J: PRETRAINED8[0].J[e] }))
  const pmC = buildModel(pl.g.n, h, edges, 1, clampArr)
  const sched = buildChromatic(pmC, pl.g.colors, 2)
  const sSim = Int8Array.from(s)
  const counts = new Float64Array(16)
  for (let swp = 0; swp < 6000; swp++) {
    sweep(pmC, sSim, sched, (site, salt) => u01(77, swp, site, salt))
    if (swp >= 500) counts[stateIndex(sSim, fenceNodes)]++
  }
  const exactFence = enumerate(subModel(pm, s, fenceNodes))
  const tv0 = tvDistance(countsToProbs(counts), exactFence)
  ok(
    tv0 < 0.05,
    'W0/exact-sub-oracle (occupancy)',
    `chromatic occupancy on a 4-node fence (2 px + 2 hidden, internal edges) vs enumerate∘subModel: TV ${tv0.toFixed(3)}`,
  )
}

/** Mean fenced-conditional TV over probes (W1), for a given model set. */
function fencedTVMean(models: FabricModel[], t: number, probes = 6): number {
  let sum = 0
  for (let r = 0; r < probes; r++) {
    const frames = forwardChain8(GLYPH8_LIST[r % GLYPH8_LIST.length], 999, r)
    const s = new Int8Array(pl.g.n)
    for (let i = 0; i < pl.g.n; i++) {
      const p = pl.pixOf[i]
      s[i] = p >= 0 ? frames[t - 1][p] : u01(1, r, i, 5) < 0.5 ? -1 : 1
    }
    for (let sw = 0; sw < 20; sw++)
      sweepFabric(models[t - 1], pl, frames[t], s, false, chrom, (site, salt) => u01(88, sw * 8 + r, site, salt))
    sum += tvDistance(
      modelFencedConditional(models[t - 1], pl, frames[t], s, FENCE),
      dataFencedConditional(GLYPH8_LIST, t, frames[t], frames[t - 1], FENCE),
    )
  }
  return sum / probes
}

const initModels = Array.from({ length: N_LEVELS }, (_, t) => initFabricModel(pl, 500 + t))

{
  const tv1 = fencedTVMean(PRETRAINED8, 1)
  const tv2 = fencedTVMean(PRETRAINED8, 2)
  const tv1un = fencedTVMean(initModels, 1)
  ok(
    tv1 < 0.1,
    'W1/fenced-conditional t=1',
    `witness: fenced 2×2 exact conditional — model vs true reverse, mean TV ${tv1.toFixed(3)} over 6 probes`,
  )
  ok(
    tv2 < 0.35,
    'W1/fenced-conditional t=2',
    `witness: fenced 2×2 exact conditional — mean TV ${tv2.toFixed(3)}`,
  )
  ok(
    tv1 < 0.4 * tv1un,
    'W1/training-improves',
    `witness: fenced 2×2 exact conditional — untrained ${tv1un.toFixed(3)} → trained ${tv1.toFixed(3)}`,
  )
  fact(`W1 fenced 2×2 conditional TV: t=1 ${tv1.toFixed(3)}, t=2 ${tv2.toFixed(3)} (untrained baseline ${tv1un.toFixed(3)})`)
}

const dreamsOf = (models: FabricModel[], sweeps: number, n = 250) => {
  const out: Int8Array[] = []
  for (let r = 0; r < n; r++) out.push(dream8(models, pl, 4242, r, sweeps)[N_LEVELS])
  return out
}
const DATA_CORR = pairwiseCorr8(GLYPH8_LIST)

{
  const trained = dreamsOf(PRETRAINED8, 24)
  const untrained = dreamsOf(initModels, 24)
  const errT = corrError(pairwiseCorr8(trained), DATA_CORR)
  const errU = corrError(pairwiseCorr8(untrained), DATA_CORR)
  ok(
    errT < 0.16,
    'W2/pinned-moments',
    `witness: pairwise ⟨y_a y_b⟩ of 250 dreams vs the family — error ${errT.toFixed(3)}`,
  )
  ok(
    errT < 0.6 * errU,
    'W2/training-improves',
    `witness: pinned moments — untrained ${errU.toFixed(3)} → trained ${errT.toFixed(3)}`,
  )
  let distSum = 0
  let fam = 0
  const hist = new Array(GLYPH8_LIST.length).fill(0)
  for (const d of trained) {
    const dd = nearestGlyph8Distance(d)
    distSum += dd
    if (dd <= 10) fam++
    let best = 0
    for (let g = 1; g < GLYPH8_LIST.length; g++)
      if (hamming8(d, GLYPH8_LIST[g]) < hamming8(d, GLYPH8_LIST[best])) best = g
    hist[best]++
  }
  ok(
    fam / trained.length > 0.6,
    'W2/dream-family',
    `${fam}/${trained.length} dreams within 10 px of a glyph at 24 sweeps (mean dist ${(distSum / trained.length).toFixed(2)})`,
  )
  ok(
    Math.min(...hist) >= 8,
    'W2/no-mode-collapse',
    `every glyph dreamed: [${GLYPH8_NAMES.map((n2, i) => `${n2}:${hist[i]}`).join(' ')}]`,
  )
  fact(`W2 pinned moments: trained ${errT.toFixed(3)} vs untrained ${errU.toFixed(3)}; dreams ≤10 px of family ${fam}/${trained.length}, mean nearest-glyph dist ${(distSum / trained.length).toFixed(2)}`)
  fact(`dream diversity (250 dreams @ 24 sweeps): ${GLYPH8_NAMES.map((n2, i) => `${n2} ${hist[i]}`).join(', ')}`)
}

/** W3 — held-out reconstruction: corrupt to t=2, denoise down, count pixels. */
function reconProbe(models: FabricModel[], sweeps: number, trials = 60) {
  let corrupted = 0
  let recon = 0
  for (let trial = 0; trial < trials; trial++) {
    const g = GLYPH8_LIST[trial % GLYPH8_LIST.length]
    const frames = forwardChain8(g, 777, trial) // seed disjoint from training
    corrupted += hamming8(frames[2], g)
    let x = frames[2]
    for (let t = 2; t >= 1; t--) x = reverseStep8(models[t - 1], pl, x, sweeps, 555, trial * 8 + t)
    recon += hamming8(x, g)
  }
  return { corrupted: corrupted / trials, recon: recon / trials }
}

{
  const trained = reconProbe(PRETRAINED8, 24)
  const untrained = reconProbe(initModels, 24)
  ok(
    trained.recon < 0.4 * trained.corrupted,
    'W3/known-answer',
    `witness: held-out reconstruction — ${trained.corrupted.toFixed(2)} px astray corrupted → ${trained.recon.toFixed(2)} denoised`,
  )
  ok(
    trained.recon < 0.5 * untrained.recon,
    'W3/training-improves',
    `witness: known-answer probe — untrained leaves ${untrained.recon.toFixed(2)} px astray, trained ${trained.recon.toFixed(2)}`,
  )
  fact(`W3 held-out reconstruction (t=2, 24 sweeps): ${trained.corrupted.toFixed(2)} px corrupted → ${trained.recon.toFixed(2)} trained (${untrained.recon.toFixed(2)} untrained)`)
}

{
  // W4 — integrated autocorrelation of the visible magnetization under the
  // trained t=3 kernel (the level whose W's carry all the coherence work).
  const x3 = new Int8Array(GLYPH8_PIX)
  for (let i = 0; i < GLYPH8_PIX; i++) x3[i] = u01(9, 0, i, 999) < 0.5 ? -1 : 1
  const s = new Int8Array(pl.g.n)
  for (let i = 0; i < pl.g.n; i++) {
    const p = pl.pixOf[i]
    s[i] = p >= 0 ? x3[p] : u01(9, 1, i, 3) < 0.5 ? -1 : 1
  }
  const SWEEPS = 800
  const series = new Float64Array(SWEEPS)
  for (let sw = 0; sw < SWEEPS; sw++) {
    sweepFabric(PRETRAINED8[N_LEVELS - 1], pl, x3, s, true, chrom, (site, salt) => u01(9, sw, site, salt))
    let mag = 0
    for (const v of pl.visible) mag += s[v]
    series[sw] = mag / GLYPH8_PIX
  }
  const tau = autocorrTime(series.slice(100))
  ok(
    Number.isFinite(tau) && tau >= 1 && tau < 120,
    'W4/autocorrelation',
    `witness: integrated τ of visible magnetization at t=3 — ${tau.toFixed(1)} sweeps`,
  )
  fact(`W4 autocorrelation τ (t=3 kernel, visible magnetization): ${tau.toFixed(1)} sweeps over a 700-sweep chain`)

  // the schedule sum type earns its keep: the stale-field synchronous sweep
  // is measurably NOT the same sampler on this fabric either (denoise.ts's
  // §5 crime, still measurable at scale). Same start, same budget, compare
  // dream-moment statistics of the two handlers.
  const collect = (sampler: FabricSampler) => {
    const st = Int8Array.from(s)
    const samples: Int8Array[] = []
    for (let sw = 0; sw < 500; sw++) {
      sweepFabric(PRETRAINED8[N_LEVELS - 1], pl, x3, st, true, sampler, (site, salt) => u01(10, sw, site, salt))
      if (sw >= 100) {
        const y = new Int8Array(GLYPH8_PIX)
        for (let p = 0; p < GLYPH8_PIX; p++) y[p] = st[pl.visible[p]]
        samples.push(y)
      }
    }
    return pairwiseCorr8(samples)
  }
  const gap = corrError(collect(chrom), collect({ kind: 'synchronous' }))
  ok(
    gap > 0.01,
    'W4/sync-differs',
    `stale-field synchronous vs chromatic on the same chain: moment gap ${gap.toFixed(3)} (the §5 crime is measurable here too)`,
  )
  fact(`synchronous-vs-chromatic moment gap on the t=3 chain: ${gap.toFixed(3)}`)
}

// ---------------------------------------------------------------------------
// Tier 2 — the pretrained8.ts regression guard: the shipped constants ARE the
// generator's run. Replays the full config (the expensive part of this suite).
// ---------------------------------------------------------------------------

{
  const t0 = performance.now()
  const trainer = createFabricTrainer(GLYPH8_LIST, pl, {
    ...FABRIC_TRAIN_DEFAULTS,
    sampler: chrom,
    seed: PRETRAINED8_SEED,
  })
  trainer.runEpochs(FABRIC_TRAIN_DEFAULTS.epochs)
  const wall = (performance.now() - t0) / 1000
  let maxDiff = 0
  for (let t = 0; t < N_LEVELS; t++) {
    const a = PRETRAINED8[t]
    const b = trainer.models[t]
    for (let i = 0; i < a.b.length; i++) maxDiff = Math.max(maxDiff, Math.abs(a.b[i] - b.b[i]))
    for (let i = 0; i < a.u.length; i++) maxDiff = Math.max(maxDiff, Math.abs(a.u[i] - b.u[i]))
    for (let i = 0; i < a.J.length; i++) maxDiff = Math.max(maxDiff, Math.abs(a.J[i] - b.J[i]))
  }
  // 6-significant-digit storage of values ≤ ~4 rounds at ≤ ~2e-5
  ok(
    maxDiff < 1e-4,
    'guard/pretrained8-fidelity',
    `shipped constants vs a fresh run of the stated config: max |Δ| ${maxDiff.toExponential(1)} (retrained in ${wall.toFixed(1)} s)`,
  )
  fact(`offline training wall-clock (regression-guard replay): ${wall.toFixed(1)} s for ${FABRIC_TRAIN_DEFAULTS.epochs} epochs × ${N_LEVELS} levels`)
}

// ---------------------------------------------------------------------------
// Tier 3 — the figures.
// ---------------------------------------------------------------------------

function hexRGB(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
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

function renderStepper(name: string, w: number, h: number, stepper: Stepper): ImageData {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, w, h)
  writeFileSync(join(OUT, `${name}.png`), canvas.toBuffer('image/png'))
  return ctx.getImageData(0, 0, w, h)
}

{
  // FabricDream at 640: dreams finish, land in family, all three witnesses
  // print live numbers, both ink families present, cells legible.
  const probe: FabricDreamProbe = {
    finished: 0,
    withinFamily: 0,
    distSum: 0,
    fencedTV: NaN,
    momentsErr: NaN,
    recoverOk: 0,
    recoverTotal: 0,
    minCellPx: 0,
  }
  const stepper = createFabricDream({ current: { sweeps: 24 } }, probe)
  for (let i = 0; i < 150 * 60; i++) stepper.step(1 / 60)
  const img = renderStepper('part3-fabric-dream', 640, 300, stepper)
  ok(probe.finished >= 60, 'fig/dream-runs', `${probe.finished} dreams finished in 150 s`)
  ok(
    probe.withinFamily / probe.finished > 0.6,
    'fig/dream-family',
    `${probe.withinFamily}/${probe.finished} within 10 px of a glyph at 24 sweeps`,
  )
  ok(
    // higher than the data-context W1 above by nature: the figure reads the
    // fence on its own SAMPLED dreams, drifted contexts included (0.23 meas.)
    Number.isFinite(probe.fencedTV) && probe.fencedTV < 0.3,
    'fig/witness-fenced',
    `on-canvas W1 readout: mean fenced TV ${probe.fencedTV.toFixed(3)}`,
  )
  ok(
    Number.isFinite(probe.momentsErr) && probe.momentsErr < 0.2,
    'fig/witness-moments',
    `on-canvas W2 readout: moments err ${probe.momentsErr.toFixed(3)}`,
  )
  ok(
    probe.recoverTotal >= 10 && probe.recoverOk / probe.recoverTotal > 0.6,
    'fig/witness-recovery',
    `on-canvas W3 readout: ${probe.recoverOk}/${probe.recoverTotal} recoveries within 6 px`,
  )
  ok(probe.minCellPx >= 7, 'fig/dream-legible-640', `smallest glyph cell ${probe.minCellPx} px`)
  ok(inkCount(img, PALETTE.sUp) > 1500, 'fig/dream-ink-sUp', `sUp ink ${inkCount(img, PALETTE.sUp)} px`)
  ok(inkCount(img, PALETTE.sDn) > 1500, 'fig/dream-ink-sDn', `sDn ink ${inkCount(img, PALETTE.sDn)} px`)
  ok(inkCount(img, PALETTE.meter) > 150, 'fig/dream-ink-witnesses', `witness meter ink ${inkCount(img, PALETTE.meter)} px`)
  ok(inkCount(img, PALETTE.held) > 40, 'fig/dream-halo', `evidence halo ink ${inkCount(img, PALETTE.held)} px`)
  fact(`FabricDream (150 s, 24 sweeps): ${probe.finished} dreams, ${probe.withinFamily} in family; live witnesses — fenced TV ${probe.fencedTV.toFixed(3)}, moments err ${probe.momentsErr.toFixed(3)}, recovery ${probe.recoverOk}/${probe.recoverTotal}`)

  // 360-wide mount: re-flowed, still legible, witnesses still inked.
  const probeN: FabricDreamProbe = { ...probe, finished: 0, withinFamily: 0, distSum: 0, recoverOk: 0, recoverTotal: 0, minCellPx: 0 }
  const stepperN = createFabricDream({ current: { sweeps: 24 } }, probeN)
  for (let i = 0; i < 20 * 60; i++) stepperN.step(1 / 60)
  const imgN = renderStepper('part3-fabric-dream-360', 360, 300, stepperN)
  ok(probeN.minCellPx >= 7, 'fig/dream-legible-360', `smallest glyph cell ${probeN.minCellPx} px at 360 wide`)
  ok(inkCount(imgN, PALETTE.sUp) > 800, 'fig/dream-360-ink', `sUp ink ${inkCount(imgN, PALETTE.sUp)} px`)
  ok(inkCount(imgN, PALETTE.meter) > 60, 'fig/dream-360-witnesses', `witness meter ink ${inkCount(imgN, PALETTE.meter)} px`)
}

{
  // The sweeps knob to both ends — the coherence budget must move the thing
  // the claim depends on (dream quality), not just redraw.
  const at = (sweeps: number) => {
    const probe: FabricDreamProbe = {
      finished: 0,
      withinFamily: 0,
      distSum: 0,
      fencedTV: NaN,
      momentsErr: NaN,
      recoverOk: 0,
      recoverTotal: 0,
      minCellPx: 0,
    }
    const stepper = createFabricDream({ current: { sweeps } }, probe)
    for (let i = 0; i < 150 * 60; i++) stepper.step(1 / 60)
    // probe fields sync on draw (where layout is known) — draw once off-screen
    const canvas = createCanvas(640, 300)
    stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, 640, 300)
    return probe
  }
  const starved = at(4)
  const rich = at(24)
  const mS = starved.distSum / starved.finished
  const mR = rich.distSum / rich.finished
  ok(
    mS > mR + 0.8,
    'fig/dream-knob',
    `mean px from nearest glyph: ${mS.toFixed(2)} at 4 sweeps vs ${mR.toFixed(2)} at 24 — the mixing budget is visible at this scale`,
  )
  fact(`sweeps knob: mean nearest-glyph distance ${mS.toFixed(2)} @ 4 sweeps → ${mR.toFixed(2)} @ 24 sweeps`)
}

{
  // CeilingChart: every number is anchor arithmetic; the honest deviation
  // from PLAN's spec is asserted AS the honest version (see the component's
  // header comment): the naive crossing lands ABOVE the verified band, and
  // the canvas says so.
  const probe: CeilingProbe = { anchorValue: NaN, crossing: NaN, oursPbits: NaN, bandLo: 0, bandHi: 0 }
  const shared = { current: { bits: 8 as 1 | 4 | 8 } }
  const stepper = createCeilingChart(shared, probe)
  const img = renderStepper('part3-ceiling-chart', 640, 300, stepper)
  ok(
    probe.anchorValue === ANCHOR_PBITS,
    'ceiling/anchor',
    `8-bit curve reproduces the verified anchor: ${probe.anchorValue} p-bits at ${ANCHOR_SIDE}×${ANCHOR_SIDE}`,
  )
  const c8 = naiveCrossing(8)
  ok(
    Math.abs(c8 - ANCHOR_SIDE * Math.sqrt(CEILING_PBITS / ANCHOR_PBITS)) < 1e-9,
    'ceiling/crossing-arithmetic',
    `naive 8-bit crossing ${c8.toFixed(1)} = 16·√(250000/14000), computed not typed`,
  )
  ok(
    c8 > BAND_HI,
    'ceiling/honest-gap',
    `naive crossing ${c8.toFixed(1)} sits ABOVE the paper's verified ${BAND_LO}–${BAND_HI} band — the figure plots the paper's number and names the gap (PLAN's in-band expectation was measured false; narrative follows the measurement)`,
  )
  ok(
    probe.oursPbits === FABRIC_FOOTPRINT && FABRIC_FOOTPRINT === 256,
    'ceiling/self-consistency',
    `our 8×8 dot = FabricDream's actual footprint: ${probe.oursPbits} p-bits (pixels + hidden layers)`,
  )
  ok(inkCount(img, PALETTE.ferro) > 200, 'ceiling/ink-ceiling', `ceiling line ferro ink ${inkCount(img, PALETTE.ferro)} px`)
  ok(inkCount(img, PALETTE.meter) > 100, 'ceiling/ink-curves', `curve meter ink ${inkCount(img, PALETTE.meter)} px`)
  ok(inkCount(img, PALETTE.sUp, 40, 60) > 15, 'ceiling/ink-dots', `anchor + ours dots sUp ink ${inkCount(img, PALETTE.sUp, 40, 60)} px`)
  ok(inkCount(img, PALETTE.ghost, 40, 12) > 500, 'ceiling/ink-band', `verified-band ghost wash ${inkCount(img, PALETTE.ghost, 40, 12)} px`)
  // knob to both ends: bits = 1 vs 8 moves the crossing the arithmetic way
  shared.current.bits = 1
  renderStepper('part3-ceiling-chart-1bit', 640, 300, stepper)
  const c1 = probe.crossing
  ok(
    c1 > c8 + 50,
    'ceiling/knob',
    `bits knob: naive crossing ${c1.toFixed(0)} at 1-bit vs ${c8.toFixed(1)} at 8-bit`,
  )
  shared.current.bits = 8
  renderStepper('part3-ceiling-chart-360', 360, 300, stepper)
  fact(`ceiling: anchor ${ANCHOR_PBITS} @ ${ANCHOR_SIDE}×${ANCHOR_SIDE}/${ANCHOR_BITS}-bit; ceiling ${CEILING_PBITS}; naive crossings 1/4/8-bit = ${naiveCrossing(1).toFixed(0)}/${naiveCrossing(4).toFixed(0)}/${naiveCrossing(8).toFixed(0)}; paper's verified band ${BAND_LO}–${BAND_HI}; ours 8×8 = ${FABRIC_FOOTPRINT} p-bits`)
  fact(`naivePbits(16,8) self-check: ${naivePbits(16, 8)}`)
}

// ---------------------------------------------------------------------------

console.log('\nMEASURED FACTS (bind Part 3 prose — PLAN §MEASURED FACTS #6)')
for (const f of facts) console.log(`  · ${f}`)
console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
