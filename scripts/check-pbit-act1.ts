/**
 * Headless checks for Act I of the p-bit lesson (PLAN rev. 2, §1–§4). Two
 * tiers, modeled on check-pbit-figures.ts:
 *
 *  1. ORACLE TIER — the State Atlas's own arithmetic against `enumerate` and
 *     `condProbPlus` (the atlas recomputes E, e^{−βE}, Z, p and the
 *     conditional slice from `energy`; here the independent route must agree
 *     to machine precision), the connected-correlation identity that
 *     quantifies §3's cheat, and an EMPIRICAL test of the ±√(p(1−p)/N)
 *     sampling band (std across independent runs must match the formula's
 *     order and its √N scaling — not the formula restated to itself).
 *
 *  2. FIGURE TIER — steppers rendered into @napi-rs/canvas: knobs driven to
 *     both ends, each assertion sampling one quantity's own palette ink,
 *     never "any ink". Renders land in `_figure_check/` for eyeballing.
 *
 * Run with `bun run scripts/check-pbit-act1.ts`.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { PALETTE } from '../src/sims/lib/palette'
import {
  buildModel,
  condProbPlus,
  countsToProbs,
  enumerate,
  freshSpins,
  frustratedLoop,
  stateIndex,
  sweep,
  tvDistance,
  u01,
  type PbitModel,
  type Schedule,
} from '../src/sims/pbits/lib'
import {
  atlasEnergies,
  atlasExact,
  atlasSlice,
  createStateAtlas,
  exactPairCorr,
  freshAtlasProbe,
  pairSign,
  pinsAllow,
  spinsOf,
  type AtlasShared,
} from '../src/sims/pbits/StateAtlas'
import { createMeterForge, type MeterProbe } from '../src/sims/pbits/MeterForge'
import { createPairCoupler, type PairProbe } from '../src/sims/pbits/PairCoupler'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const SEQ: Schedule = { kind: 'sequential' }

/** Long-run empirical distribution of the sequential schedule on a model. */
function longRun(m: PbitModel, sweeps: number, seed: number): Float64Array {
  const s = freshSpins(m, seed)
  const counts = new Float64Array(1 << m.n)
  const burn = Math.floor(sweeps / 10)
  for (let t = 1; t <= sweeps; t++) {
    sweep(m, s, SEQ, (site, salt) => u01(seed, t, site, salt))
    if (t > burn) counts[stateIndex(s)]++
  }
  return countsToProbs(counts)
}

// ---------------------------------------------------------------------------
// Tier 1 — the oracle.
// ---------------------------------------------------------------------------

{
  // atlas p = enumerate, at three coldnesses — the atlas's own route
  // (energy → e^{−βE} → ÷Z) against the library's enumerator.
  for (const beta of [0.3, 0.8, 2.0]) {
    const { p, Z, w } = atlasExact(beta)
    const truth = enumerate(frustratedLoop(beta))
    const tv = tvDistance(p, truth)
    ok(tv < 1e-12, 'oracle/atlas-vs-enumerate', `β=${beta}: TV ${tv.toExponential(1)}`)
    let sum = 0
    let wSum = 0
    for (let i = 0; i < 16; i++) {
      sum += p[i]
      wSum += w[i]
    }
    ok(
      Math.abs(sum - 1) < 1e-12 && Math.abs(wSum - Z) < 1e-9 * Z,
      'oracle/atlas-Z',
      `β=${beta}: Σp=${sum.toFixed(12)}, Σw−Z=${(wSum - Z).toExponential(1)}`,
    )
  }
}

{
  // energy ladder boundary facts the prose leans on: the frustrated loop's
  // ground level is −2 (one wire always unhappy — never −4), and flipping one
  // end of a satisfied unit wire costs exactly 2J = 2 in E.
  const E = atlasEnergies()
  const eMin = Math.min(...Array.from(E))
  ok(eMin === -2, 'oracle/frustration-floor', `min E = ${eMin} (a happy loop would reach −4)`)
  const s = spinsOf(15) // all up
  const e0 = E[15]
  s[1] = -1 // breaks the two satisfied unit agree-wires at spin 1, heals nothing
  const flippedIdx = stateIndex(s)
  ok(
    E[flippedIdx] - e0 === 4,
    'oracle/wire-cost',
    `flipping one spin of all-up breaks two unit agree-wires: ΔE = ${E[flippedIdx] - e0} = 2J + 2J`,
  )
}

{
  // β boundaries: hot → sixteen fair columns; cold → all mass on the ground
  // states. These are the two sanity checks §4's prose performs.
  const hot = atlasExact(1e-9).p
  const spread = Math.max(...Array.from(hot)) / Math.min(...Array.from(hot))
  ok(spread < 1 + 1e-6, 'oracle/beta-to-zero', `β→0: tallest/shortest = ${spread.toFixed(9)}`)
  const cold = atlasExact(6)
  const E = atlasEnergies()
  const eMin = Math.min(...Array.from(E))
  let ground = 0
  for (let i = 0; i < 16; i++) if (E[i] === eMin) ground += cold.p[i]
  ok(ground > 0.99, 'oracle/beta-to-inf', `β=6: ground states hold ${ground.toFixed(4)} of the mass`)
}

{
  // the conditional slice IS the update rule: for every choice of three pins,
  // the renormalized two-column ratio must equal σ(2β·field) exactly.
  for (const beta of [0.6, 1.0, 1.7]) {
    const m = frustratedLoop(beta)
    let worst = 0
    for (let free = 0; free < 4; free++) {
      for (let ctxIdx = 0; ctxIdx < 8; ctxIdx++) {
        const pins = new Int8Array(4)
        let b = 0
        for (let k = 0; k < 4; k++) {
          if (k === free) continue
          pins[k] = (ctxIdx >> b) & 1 ? 1 : -1
          b++
        }
        const { p } = atlasSlice(beta, pins)
        let slice = 0
        for (let i = 0; i < 16; i++) if ((i >> free) & 1) slice += p[i]
        const s = Int8Array.from(pins)
        s[free] = 1 // its own value never enters its own field
        worst = Math.max(worst, Math.abs(slice - condProbPlus(m, s, free)))
      }
    }
    ok(worst < 1e-12, 'oracle/slice-is-rule', `β=${beta}: max |slice − σ(2β·field)| = ${worst.toExponential(1)}`)
  }
}

{
  // slices renormalize, and pinned-out columns are exactly zero
  const pins = Int8Array.from([1, 0, 0, -1])
  const { p, mass } = atlasSlice(0.8, pins)
  let sum = 0
  let deadMass = 0
  for (let i = 0; i < 16; i++) {
    sum += p[i]
    if (!pinsAllow(i, pins)) deadMass += p[i]
  }
  ok(
    Math.abs(sum - 1) < 1e-12 && deadMass === 0 && mass > 0 && mass < 1,
    'oracle/slice-normalizes',
    `Σ slice = ${sum.toFixed(12)}, dead columns ${deadMass}, prior mass ${mass.toFixed(3)}`,
  )
}

{
  // the observable pane's number: Σ p·s₁s₂ against enumerate, plus its own
  // boundary (β→0 → 0) and a long-run sampled estimate landing on it.
  const beta = 0.8
  const truth = enumerate(frustratedLoop(beta))
  let direct = 0
  for (let i = 0; i < 16; i++) direct += truth[i] * pairSign(i)
  const atlas = exactPairCorr(beta)
  ok(Math.abs(atlas - direct) < 1e-12, 'oracle/pair-corr', `⟨s₁s₂⟩ atlas ${atlas.toFixed(6)} vs enumerate ${direct.toFixed(6)}`)
  ok(Math.abs(exactPairCorr(1e-9)) < 1e-6, 'oracle/pair-corr-hot', `β→0: ⟨s₁s₂⟩ = ${exactPairCorr(1e-9).toExponential(1)}`)
  const p = longRun(frustratedLoop(beta), 120_000, 17)
  let sampled = 0
  for (let i = 0; i < 16; i++) sampled += p[i] * pairSign(i)
  ok(Math.abs(sampled - atlas) < 0.02, 'oracle/pair-corr-sampled', `sampled ${sampled.toFixed(3)} vs exact ${atlas.toFixed(3)}`)
}

{
  // the connected-correlation identity that quantifies §3's cheat, from EXACT
  // distributions (no sampling noise): independent pinned coins fake raw
  // agreement with Cov exactly 0; the wire earns Cov ≈ its agreement.
  const covOf = (m: PbitModel) => {
    const p = enumerate(m)
    const corr = p[0] + p[3] - p[1] - p[2]
    const m1 = p[1] + p[3] - (p[0] + p[2])
    const m2 = p[2] + p[3] - (p[0] + p[1])
    return { corr, cov: corr - m1 * m2 }
  }
  const pinned = covOf(buildModel(2, [2, 2], [], 1))
  ok(
    pinned.corr > 0.85 && Math.abs(pinned.cov) < 1e-12,
    'oracle/cov-independence',
    `h=(2,2): ⟨s₁s₂⟩ ${pinned.corr.toFixed(3)} but Cov ${pinned.cov.toExponential(1)}`,
  )
  const wired = covOf(buildModel(2, [0, 0], [{ i: 0, j: 1, J: 1.5 }], 1))
  ok(
    wired.cov > 0.85,
    'oracle/cov-wire',
    `J=1.5: Cov ${wired.cov.toFixed(3)} = agreement ${wired.corr.toFixed(3)} (fair coins)`,
  )
}

{
  // the sampling band, empirically: across independent runs the per-state std
  // of p̂ must sit near √(p(1−p)/N) (correlated sweeps inflate it a little —
  // hold it inside [0.6, 2]× the iid band), and quadrupling N must halve it.
  const beta = 0.8
  const m = frustratedLoop(beta)
  const exact = enumerate(m)
  const stdAtN = (N: number, reps: number, seedBase: number) => {
    const acc = new Float64Array(16)
    const acc2 = new Float64Array(16)
    for (let r = 0; r < reps; r++) {
      const s = freshSpins(m, seedBase + r)
      const counts = new Float64Array(16)
      for (let t = 1; t <= N; t++) {
        sweep(m, s, SEQ, (site, salt) => u01(seedBase + r, t, site, salt))
        counts[stateIndex(s)]++
      }
      const p = countsToProbs(counts)
      for (let i = 0; i < 16; i++) {
        acc[i] += p[i]
        acc2[i] += p[i] * p[i]
      }
    }
    let ratioSum = 0
    for (let i = 0; i < 16; i++) {
      const mean = acc[i] / reps
      const sd = Math.sqrt(Math.max(0, acc2[i] / reps - mean * mean))
      ratioSum += sd / Math.sqrt((exact[i] * (1 - exact[i])) / N)
    }
    return ratioSum / 16 // mean measured-std / iid-band ratio
  }
  const r2k = stdAtN(2_000, 48, 100)
  const r8k = stdAtN(8_000, 48, 900)
  ok(
    r2k > 0.6 && r2k < 2 && r8k > 0.6 && r8k < 2,
    'oracle/band-order',
    `measured std / √(p(1−p)/N): ${r2k.toFixed(2)}× at N=2k, ${r8k.toFixed(2)}× at N=8k`,
  )
  ok(
    Math.abs(r8k / r2k - 1) < 0.25,
    'oracle/band-scaling',
    `ratio constant across 4× N (${(r8k / r2k).toFixed(2)}) — std really falls as 1/√N`,
  )
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
function inkCount(img: ImageData, hex: string, tol = 40): number {
  const [r, g, b] = hexRGB(hex)
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (
      Math.abs(img.data[i] - r) < tol &&
      Math.abs(img.data[i + 1] - g) < tol &&
      Math.abs(img.data[i + 2] - b) < tol
    )
      n++
  }
  return n
}

const H = 310

function atlasShared(beta: number, pins?: number[]): { current: AtlasShared } {
  return {
    current: {
      beta,
      selected: 15,
      pins: Int8Array.from(pins ?? [0, 0, 0, 0]),
    },
  }
}

{
  // Atlas / energy: the selected state's loop must show its wires in their
  // own inks (three ferro, one anti), and the probe's heights must be the
  // exact energies.
  const probe = freshAtlasProbe()
  const img = render('atlas-energy', H, () => createStateAtlas(atlasShared(1), 'energy', probe), 0)
  ok(inkCount(img, PALETTE.ferro) > 60, 'fig/atlas-energy-ferro', `${inkCount(img, PALETTE.ferro)} px of agree-wire ink`)
  ok(inkCount(img, PALETTE.anti) > 20, 'fig/atlas-energy-anti', `${inkCount(img, PALETTE.anti)} px of disagree-wire ink`)
  const E = atlasEnergies()
  let match = true
  for (let i = 0; i < 16; i++) if (probe.heights[i] !== E[i]) match = false
  ok(match, 'fig/atlas-energy-ladder', 'drawn ladder = exact energies, all 16 states')
}

{
  // Atlas / weight: β to both ends. Cold concentrates the raw weight into few
  // columns, so the total ghost ink shrinks; hot spreads it across sixteen.
  const hotProbe = freshAtlasProbe()
  const hotImg = render('atlas-weight-hot', H, () => createStateAtlas(atlasShared(0.05), 'weight', hotProbe), 0)
  const coldProbe = freshAtlasProbe()
  const coldImg = render('atlas-weight-cold', H, () => createStateAtlas(atlasShared(2.5), 'weight', coldProbe), 0)
  const hotInk = inkCount(hotImg, PALETTE.ghost)
  const coldInk = inkCount(coldImg, PALETTE.ghost)
  ok(hotInk > 1.6 * coldInk, 'fig/atlas-weight-knob', `ghost ink hot ${hotInk} vs cold ${coldInk}`)
  const spread = (p: Float64Array) => Math.max(...Array.from(p)) / Math.min(...Array.from(p))
  ok(
    spread(hotProbe.heights) < 1.5 && spread(coldProbe.heights) > 50,
    'fig/atlas-weight-spread',
    `tallest/shortest: hot ${spread(hotProbe.heights).toFixed(2)}×, cold ${spread(coldProbe.heights).toFixed(0)}×`,
  )
}

{
  // Atlas / normalize: columns are the exact p, the token (its own amber ink)
  // stands on a live column, and Z prints from the same weights the stack
  // draws.
  const probe = freshAtlasProbe()
  const img = render('atlas-normalize', H, () => createStateAtlas(atlasShared(0.8), 'normalize', probe), 6)
  ok(inkCount(img, PALETTE.sUp) > 30, 'fig/atlas-normalize-token', `${inkCount(img, PALETTE.sUp)} px of token ink`)
  const truth = enumerate(frustratedLoop(0.8))
  ok(
    tvDistance(probe.heights, truth) < 1e-12,
    'fig/atlas-normalize-columns',
    `drawn columns = enumerate (TV ${tvDistance(probe.heights, truth).toExponential(1)})`,
  )
  ok(
    probe.tokenState >= 0 && probe.tokenState < 16,
    'fig/atlas-normalize-live',
    `token on column ${probe.tokenState} after 6 s`,
  )
}

{
  // Atlas / observable: the live sampled mean (meter ink on canvas) converges
  // on the exact ⟨s₁s₂⟩ at β=0.8 and dies at the hot end.
  const probe = freshAtlasProbe()
  const img = render('atlas-observable', H, () => createStateAtlas(atlasShared(0.8), 'observable', probe), 20)
  ok(inkCount(img, PALETTE.meter) > 150, 'fig/atlas-observable-ink', `${inkCount(img, PALETTE.meter)} px of sampled ink`)
  const exact = exactPairCorr(0.8)
  ok(
    probe.samples > 2_000 && Math.abs(probe.sampleMean - exact) < 0.1,
    'fig/atlas-observable-mean',
    `sampled ⟨s₁s₂⟩ ${probe.sampleMean.toFixed(3)} vs exact ${exact.toFixed(3)} (${probe.samples} samples)`,
  )
  const hotProbe = freshAtlasProbe()
  render('atlas-observable-hot', H, () => createStateAtlas(atlasShared(0.05), 'observable', hotProbe), 20)
  ok(
    Math.abs(hotProbe.sampleMean) < 0.12,
    'fig/atlas-observable-hot',
    `β=0.05: sampled ⟨s₁s₂⟩ ${hotProbe.sampleMean.toFixed(3)} — hot kills the correlation`,
  )
}

{
  // Atlas / conditional: pins wear the held ink; pinning three spins leaves
  // two live columns (less ghost ink than the free atlas), and the figure's
  // own two printed routes to P(s_free = +1) agree to machine precision.
  const freeProbe = freshAtlasProbe()
  const freeImg = render('atlas-cond-free', H, () => createStateAtlas(atlasShared(1, [0, 0, 0, 0]), 'conditional', freeProbe), 0)
  const pinProbe = freshAtlasProbe()
  // pins chosen so the free spin's field is nonzero — a 0.500 readout would
  // let a broken slice and a broken rule agree by symmetry alone
  const pinImg = render('atlas-cond-pinned', H, () => createStateAtlas(atlasShared(1, [1, 1, 0, 1]), 'conditional', pinProbe), 0)
  ok(inkCount(pinImg, PALETTE.held) > 60, 'fig/atlas-cond-halo', `${inkCount(pinImg, PALETTE.held)} px of held ink`)
  const freeInk = inkCount(freeImg, PALETTE.ghost)
  const pinInk = inkCount(pinImg, PALETTE.ghost)
  ok(pinInk < 0.7 * freeInk, 'fig/atlas-cond-collapse', `ghost ink ${freeInk} free → ${pinInk} with 3 pins`)
  ok(
    Number.isFinite(pinProbe.sliceP) &&
      Math.abs(pinProbe.sliceP - pinProbe.ruleP) < 1e-12 &&
      pinProbe.sliceP > 0 &&
      pinProbe.sliceP < 1,
    'fig/atlas-cond-two-routes',
    `slice ${pinProbe.sliceP.toFixed(6)} = rule ${pinProbe.ruleP.toFixed(6)}`,
  )
}

{
  // MeterForge: the band exists, shrinks as √N between a short and a long
  // run, and after the long run the live bars mostly sit inside ±2 bands.
  // β driven to both ends on the short runs.
  const run = (beta: number, seconds: number, name: string) => {
    const probe: MeterProbe = { tv: 0, samples: 0, band: 0, inBand: 0 }
    const img = render(name, 260, () => createMeterForge({ current: { beta } }, probe), seconds)
    return { probe, img }
  }
  const short = run(0.8, 10, 'meter-band-short')
  const long = run(0.8, 40, 'meter-band-long')
  ok(short.probe.band > 0, 'fig/meter-band', `band half-width ${short.probe.band.toFixed(4)} at N=${short.probe.samples}`)
  const scale =
    (short.probe.band / long.probe.band) /
    Math.sqrt(long.probe.samples / short.probe.samples)
  ok(
    Math.abs(scale - 1) < 0.01,
    'fig/meter-band-shrinks',
    `band ${short.probe.band.toFixed(4)} → ${long.probe.band.toFixed(4)} over ${short.probe.samples} → ${long.probe.samples} samples (√N-consistent, ×${scale.toFixed(3)})`,
  )
  ok(
    long.probe.inBand >= 12,
    'fig/meter-bars-in-band',
    `${long.probe.inBand}/16 live bars inside ±2 band-widths after ${long.probe.samples} samples`,
  )
  for (const beta of [0.1, 2.0]) {
    const end = run(beta, 12, `meter-band-beta-${beta}`)
    ok(
      end.probe.tv < 0.08 && end.probe.band > 0,
      'fig/meter-knob-ends',
      `β=${beta}: TV ${end.probe.tv.toFixed(3)}, band ${end.probe.band.toFixed(4)}`,
    )
  }
}

{
  // PairCoupler: the on-canvas connected gauge. Biases mode with both knobs
  // at the rail: raw agreement high, connected part near zero (the cheat,
  // quantified). Wire mode: connected part carries the whole agreement.
  const cheat: PairProbe = { corr: 0, cov: 0, meanL: 0, meanR: 0 }
  render('pair-cheat-cov', 240, () => createPairCoupler({ current: { h1: 2, h2: 2, J: 0 } }, 'biases', false, cheat), 30)
  ok(
    cheat.corr > 0.8 && Math.abs(cheat.cov) < 0.08,
    'fig/pair-cheat-cov',
    `h=(2,2): agreement ${cheat.corr.toFixed(2)}, connected ${cheat.cov.toFixed(3)}, leans ${cheat.meanL.toFixed(2)}/${cheat.meanR.toFixed(2)}`,
  )
  const wire: PairProbe = { corr: 0, cov: 0, meanL: 0, meanR: 0 }
  render('pair-wire-cov', 240, () => createPairCoupler({ current: { h1: 0, h2: 0, J: 1.5 } }, 'wire', false, wire), 30)
  ok(
    wire.cov > 0.75 && Math.abs(wire.corr - wire.cov) < 0.1,
    'fig/pair-wire-cov',
    `J=1.5: agreement ${wire.corr.toFixed(2)} ≈ connected ${wire.cov.toFixed(2)} (leans ${wire.meanL.toFixed(2)}/${wire.meanR.toFixed(2)})`,
  )
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
