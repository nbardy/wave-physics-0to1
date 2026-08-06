/**
 * Headless checks for the p-bit lesson's Act II rev. 2 figures (F12 write
 * conflicts, F13 race, F15 dashboard, F16 chip fabric). Two tiers, modeled on
 * check-pbit-figures.ts:
 *
 *  1. ORACLE TIER — the rev-2 claims in numbers, computed from lib's own
 *     schedules and the figures' own models (never hand-typed):
 *     conflict counts (sequential 0, chromatic 0, synchronous = every edge);
 *     the race outcome (synchronous reaches the certified ground energy, ≤
 *     chromatic's best, while its energy-level TV is > 3× chromatic's);
 *     dashboard columns moving the right way; fabric degree histogram = 16
 *     everywhere and a legal two-coloring.
 *
 *  2. FIGURE TIER — steppers rendered into @napi-rs/canvas, sampling each
 *     quantity's own ink (AGENTS.md), toggles exercised to both ends.
 *     Renders land in `_figure_check/` for eyeballing failures.
 *
 * Run with `bun run scripts/check-pbit-act2.ts`.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { PALETTE } from '../src/sims/lib/palette'
import {
  buildChromatic,
  freshSpins,
  stateIndex,
  sweep,
  twoColorGrid,
  tvDistance,
  countsToProbs,
  u01,
  type Schedule,
} from '../src/sims/pbits/lib'
import {
  conflictEdges,
  conflictGridModel,
  createWriteConflict,
  writtenSites,
  type ConflictKind,
} from '../src/sims/pbits/WriteConflict'
import { createRace, raceGlassModel, raceLevels, type RaceProbe } from '../src/sims/pbits/Race'
import { createDashboard, type DashboardProbe } from '../src/sims/pbits/Dashboard'
import { createChipFabric, fabricColors, fabricModel, FABRIC_H, FABRIC_W } from '../src/sims/pbits/ChipFabric'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

// ---------------------------------------------------------------------------
// Tier 1 — the oracle.
// ---------------------------------------------------------------------------

{
  // F12: write conflicts, computed from the grid's own edge list and the
  // schedules' own write sets. The rev-2 discriminator in numbers.
  const m = conflictGridModel()
  const colors = twoColorGrid(16, 16)
  buildChromatic(m, colors, 2) // the coloring the figure uses is legal
  const count = (kind: ConflictKind) => {
    const written = writtenSites(m, kind, colors)
    let writers = 0
    for (const b of written) if (b) writers++
    return { writers, conflicts: conflictEdges(m, written).length }
  }
  const seq = count('sequential')
  const chr = count('chromatic')
  const syn = count('synchronous')
  ok(
    seq.writers === 1 && seq.conflicts === 0,
    'oracle/conflicts-sequential',
    `${seq.writers} writer, ${seq.conflicts} conflicts`,
  )
  ok(
    chr.writers > m.n / 4 && chr.conflicts === 0,
    'oracle/conflicts-chromatic',
    `${chr.writers} writers, ${chr.conflicts} conflicts — many writers, still zero`,
  )
  ok(
    syn.conflicts > 0 && syn.conflicts === m.edges.length,
    'oracle/conflicts-synchronous',
    `${syn.writers} writers, ${syn.conflicts}/${m.edges.length} wires in conflict`,
  )
}

{
  // F13: the race, run exactly as the figure runs it (tick-fair: synchronous
  // one sweep per tick, chromatic one sweep per two ticks). Synchronous must
  // reach the CERTIFIED ground energy — optimization success — at an energy-
  // level TV more than 3× chromatic's — sampling failure. Both sides of the
  // verdict from one run.
  const m = raceGlassModel()
  const lv = raceLevels(m)
  const chrom = buildChromatic(m, twoColorGrid(4, 4), 2)
  const TICKS = 6000
  const run = (sched: Schedule, sweeps: number, seed: number) => {
    const s = freshSpins(m, seed)
    const counts = new Float64Array(lv.levels.length)
    let minE = Infinity
    for (let t = 1; t <= sweeps; t++) {
      sweep(m, s, sched, (site, salt) => u01(seed, t, site, salt))
      const idx = stateIndex(s)
      counts[lv.stateLevel[idx]]++
      if (lv.stateE[idx] < minE) minE = lv.stateE[idx]
    }
    return { minE, tv: tvDistance(lv.exactHist, countsToProbs(counts)) }
  }
  const syn = run({ kind: 'synchronous' }, TICKS, 5)
  const chr = run(chrom, TICKS / 2, 5)
  ok(
    syn.minE === lv.eMin && syn.minE <= chr.minE,
    'oracle/race-energy',
    `synchronous found ${syn.minE} (certified minimum ${lv.eMin}); chromatic found ${chr.minE}`,
  )
  ok(
    syn.tv > 3 * chr.tv && chr.tv < 0.08,
    'oracle/race-distribution',
    `energy-level TV ${syn.tv.toFixed(3)} (synchronous) vs ${chr.tv.toFixed(3)} (chromatic)`,
  )
}

{
  // F16: the fabric's two published-property claims, from the model itself.
  const m = fabricModel()
  const degrees = m.nbr.map((nb) => nb.length)
  const off = degrees.filter((d) => d !== 16).length
  ok(off === 0, 'oracle/fabric-degree', `all ${m.n} cells have degree 16 (histogram {16: ${m.n}})`)
  ok(
    m.edges.length === (FABRIC_W * FABRIC_H * 16) / 2,
    'oracle/fabric-edges',
    `${m.edges.length} wires = n·16/2`,
  )
  let threw = false
  try {
    buildChromatic(m, fabricColors(), 2)
  } catch {
    threw = true
  }
  ok(!threw, 'oracle/fabric-two-colorable', 'checkerboard coloring has no intra-color wire')
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

const CONFLICT_RED = '#dc2626'

{
  // WriteConflict at all three toggle positions: conflict-red wire ink must
  // flood the synchronous frame and be near-absent under the two legal
  // schedules (the residual is the red counter text itself, so compare inks,
  // not zero).
  const imgs = {} as Record<ConflictKind, ImageData>
  for (const kind of ['sequential', 'chromatic', 'synchronous'] as const) {
    imgs[kind] = render(`write-conflict-${kind}`, 300, () =>
      createWriteConflict({ current: { kind } }),
      0,
    )
  }
  const red = {
    sequential: inkCount(imgs.sequential, CONFLICT_RED),
    chromatic: inkCount(imgs.chromatic, CONFLICT_RED),
    synchronous: inkCount(imgs.synchronous, CONFLICT_RED),
  }
  ok(
    red.synchronous > 5 * Math.max(red.sequential, red.chromatic, 1),
    'fig/write-conflict-red-ink',
    `red ink seq ${red.sequential} / chr ${red.chromatic} / syn ${red.synchronous}`,
  )
  const upSeq = inkCount(imgs.sequential, PALETTE.sUp)
  const dnSeq = inkCount(imgs.sequential, PALETTE.sDn)
  ok(upSeq > 100 && dnSeq > 100, 'fig/write-conflict-spins', `spin ink up ${upSeq} / down ${dnSeq}`)
}

{
  // Race: after ~90 figure-seconds the probe must hold the verdict the prose
  // claims, and both meters' inks must be on canvas.
  const probe: RaceProbe = { synMinE: 0, chrMinE: 0, synTV: 0, chrTV: 0, sweeps: 0 }
  const img = render('race', 290, () => createRace(probe), 90)
  const lv = raceLevels(raceGlassModel())
  ok(
    probe.synMinE === lv.eMin && probe.synMinE <= probe.chrMinE,
    'fig/race-energy',
    `figure probe: synchronous at ${probe.synMinE} (certified ${lv.eMin}), chromatic at ${probe.chrMinE}`,
  )
  ok(
    probe.synTV > 3 * probe.chrTV,
    'fig/race-meters',
    `figure probe: TV ${probe.synTV.toFixed(3)} vs ${probe.chrTV.toFixed(3)} after ${probe.sweeps} chromatic sweeps`,
  )
  ok(inkCount(img, PALETTE.meter) > 300, 'fig/race-meter-ink', 'violet sampled bars painted')
  ok(inkCount(img, PALETTE.ghost) > 100, 'fig/race-ghost-ink', 'exact ghost painted')
}

{
  // Dashboard: the three columns move the right way — parallel width up the
  // rows, chromatic's evidence rate far above sequential's, synchronous
  // splendid on evidence and failed on distance (the gate's whole point).
  const probe: DashboardProbe = { writes: [], essPerKtick: [], tv: [] }
  const img = render('dashboard', 240, () => createDashboard(probe), 60)
  const [seqW, chrW, synW] = probe.writes
  const [seqE, chrE, synE] = probe.essPerKtick
  const [seqTV, chrTV, synTV] = probe.tv
  ok(synW > chrW && chrW > seqW, 'fig/dashboard-writes', `writes/tick ${seqW} < ${chrW} < ${synW}`)
  ok(
    chrE > 10 * seqE && seqE > 0,
    'fig/dashboard-ess',
    `samples/1k ticks: chromatic ${chrE.toFixed(1)} vs sequential ${seqE.toFixed(1)} — parallelism honestly buys evidence`,
  )
  ok(
    synE > seqE,
    'fig/dashboard-ess-splendid',
    `synchronous posts ${synE.toFixed(1)} samples/1k ticks — splendid, and for the wrong law`,
  )
  ok(
    synTV > 3 * Math.max(seqTV, chrTV) && Math.max(seqTV, chrTV) < 0.08,
    'fig/dashboard-tv',
    `distance ${seqTV.toFixed(3)} / ${chrTV.toFixed(3)} / ${synTV.toFixed(3)}`,
  )
  ok(inkCount(img, CONFLICT_RED) > 30, 'fig/dashboard-strike', 'the failed row is struck in red')
  ok(inkCount(img, PALETTE.meter) > 200, 'fig/dashboard-bars', 'violet columns painted')
}

{
  // ChipFabric: both phases render; the red class ring ink must swing with
  // the clock (bold on red-writing frames, faint on black-writing frames),
  // and spins of both inks are alive on the fabric.
  const imgA = render('chip-fabric-red', 340, () => createChipFabric(), 0) // pass 0 → writing red
  const stepperB = (() => {
    const s = createChipFabric()
    return s
  })()
  // advance an odd number of half-sweeps so the black phase is writing
  const canvasB = createCanvas(W, 340)
  const ctxB = canvasB.getContext('2d') as unknown as CanvasRenderingContext2D
  stepperB.step(1 / 6 + 0.01)
  stepperB.draw(ctxB, W, 340)
  writeFileSync(join(OUT, 'chip-fabric-black.png'), canvasB.toBuffer('image/png'))
  const imgB = ctxB.getImageData(0, 0, W, 340)
  const redA = inkCount(imgA, CONFLICT_RED)
  const redB = inkCount(imgB, CONFLICT_RED)
  ok(
    redA > 1.5 * redB && redB > 0,
    'fig/fabric-clock',
    `red-class ring ink ${redA} (red writing) vs ${redB} (black writing)`,
  )
  ok(
    inkCount(imgA, PALETTE.sUp) > 100 && inkCount(imgA, PALETTE.sDn) > 100,
    'fig/fabric-spins',
    'both spin inks alive on the fabric',
  )
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
