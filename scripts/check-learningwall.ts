/**
 * LearningWall checks — the series' hero, second version (2026-09-06):
 * Part 3's fabric-native model shown first, training live from coin-toss
 * weights while twenty chains dream on whatever weights exist right now.
 * Run: bun run scripts/check-learningwall.ts   (two full 700-epoch training
 * runs — the ring assertion and the render tier — ≈ 50 s on an idle
 * Apple Silicon laptop, minutes under CPU contention; cannot be shortened)
 *
 * Tiers.
 *   1. THE RING: the hero's feed at PRETRAINED8_SEED, run to TRAIN_EPOCHS in
 *      the worker's 20-epoch chunks with a probe between each, replays the
 *      generator's single runEpochs(700) to storage precision (max |Δ| <
 *      1e-4, pretrained8.ts holds 6 significant digits; measured 4.9e-6) —
 *      the wall the reader watches learn in Part 1 is the wall Part 3 bills.
 *      Also: the wall's pre-first-post weights (coinTossModels) equal the
 *      trainer's own epoch-0 models, so the curve's first point scores what
 *      the wall is actually dreaming on before the worker lands.
 *   2. THE CURVE (the figure's claim, "improving over time", as numbers, at
 *      the wall's 24-sweep budget): epoch 0 is static (≥ 20 px wrong, ≤ 10%
 *      recognizable); by epoch 100 ≤ 13 px; the final point ≤ 8.5 px and
 *      ≥ 60% recognizable; the last ten points sit ≥ 15 px below the first.
 *      Measured 2026-09-06: 26.8 → 8.8 (epoch 100) → 4.6 px / 88% (700).
 *   3. THE INSTRUMENT SCORES THE WALL: on frozen final weights, every dream a
 *      chain finishes across frames equals dreamOnWall() for its run — sig
 *      for sig — and the wall's own dreams (all of them, its own seed) score
 *      within 2.5 px of the probe's forty.
 *   4. STATIC IS STATIC: a wall fed only coin-toss weights (epochs = 0)
 *      dreams ≥ 20 px from any glyph — nothing on the opening frame is a
 *      picture yet.
 *   5. RENDERING, one wall photographed at 640 and 360, twice: at epoch 20
 *      and trained. Cells ≥ 7 px; spin inks on the wall and on the
 *      training-set row; the fabric inset paints (wide); meter ink in the
 *      curve pane, and MORE of it trained than at epoch 20 (the curve is
 *      drawn progressively — the knob driven to both ends); the curve's last
 *      point falls; blocks do not overlap and the last text line sits inside
 *      the canvas.
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import type { Rect } from '../src/sims/lib/chrome'
import { placeGlyph8, type FabricModel } from '../src/sims/pbits/denoiseFabric'
import { PRETRAINED8, PRETRAINED8_SEED } from '../src/sims/pbits/pretrained8'
import { nearestGlyph8Distance } from '../src/sims/pbits/glyphs8'
import {
  FAMILY_PX,
  PROBE_DREAMS,
  TRAIN_EPOCHS,
  coinTossModels,
  createInlineFeed,
  dreamOnWall,
  sigOf,
  type TrainUpdate,
  type WeightFeed,
} from '../src/sims/pbits/learnFeed'
import {
  createLearningWall,
  learningWallLayout,
  type LearningWallProbe,
} from '../src/sims/pbits/LearningWall'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}
const facts: string[] = []
const fact = (s: string) => facts.push(s)

const H = 420
const pl = placeGlyph8()
const freshProbe = (): LearningWallProbe => ({}) as LearningWallProbe
const freshShared = () => ({ current: { wantRestart: false } })

function hexRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}
function inkInRegion(canvas: Canvas, hex: string, r: Rect, tol = 40): number {
  const [cr, cg, cb] = hexRgb(hex)
  const ctx = canvas.getContext('2d')
  const x = Math.max(0, Math.floor(r.x))
  const y = Math.max(0, Math.floor(r.y))
  const w = Math.min(canvas.width - x, Math.ceil(r.w))
  const h = Math.min(canvas.height - y, Math.ceil(r.h))
  if (w <= 0 || h <= 0) return 0
  const d = ctx.getImageData(x, y, w, h).data
  let n = 0
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue
    if (Math.abs(d[i] - cr) + Math.abs(d[i + 1] - cg) + Math.abs(d[i + 2] - cb) <= tol) n++
  }
  return n
}
function maxModelDiff(a: FabricModel[], b: FabricModel[]): number {
  if (a.length !== b.length) return Infinity
  let d = 0
  for (let t = 0; t < a.length; t++) {
    for (const k of ['b', 'u', 'J'] as const) {
      const x = a[t][k]
      const y = b[t][k]
      if (x.length !== y.length) return Infinity
      for (let i = 0; i < x.length; i++) d = Math.max(d, Math.abs(x[i] - y[i]))
    }
  }
  return d
}
const sameModels = (a: FabricModel[], b: FabricModel[]) => maxModelDiff(a, b) === 0
/** A feed that hands the stepper one prepared update, then nothing. */
function cannedFeed(u: TrainUpdate): WeightFeed {
  let given = false
  return {
    poll() {
      if (given) return []
      given = true
      return [u]
    },
    restart() {},
    dispose() {},
  }
}

// ---------------------------------------------------------------------------
// Tier 1 + 2 — one full run through the feed: the ring, and the curve.
// ---------------------------------------------------------------------------

console.log('--- the ring: the hero trains the finale\'s weights ---')

const cfg = { gen: 0, seed: PRETRAINED8_SEED, epochs: TRAIN_EPOCHS }
const curve: TrainUpdate[] = []
let finalUpdate: TrainUpdate | null = null
{
  const feed = createInlineFeed(pl, cfg, 20) // the worker's own cadence
  const t0 = performance.now()
  for (;;) {
    const us = feed.poll()
    if (!us.length) break
    curve.push(...us)
    finalUpdate = us[us.length - 1]
  }
  const wall = (performance.now() - t0) / 1000
  const first = curve[0]
  ok(first.epoch === 0 && sameModels(first.models, coinTossModels(pl, PRETRAINED8_SEED)), 'ring/epoch-0', 'the wall\'s coin-toss weights are the trainer\'s own epoch-0 models')
  ok(finalUpdate !== null && finalUpdate.epoch === TRAIN_EPOCHS, 'ring/complete', `feed ran to epoch ${finalUpdate?.epoch} of ${TRAIN_EPOCHS} in ${curve.length} posts`)
  // pretrained8.ts stores 6 significant digits; check-part3b's fidelity guard
  // uses the same 1e-4 — chunked-with-probes training must replay the
  // generator's single runEpochs(700) call to storage precision
  const ringDiff = finalUpdate ? maxModelDiff(finalUpdate.models, PRETRAINED8) : Infinity
  ok(ringDiff < 1e-4, 'ring/same-weights', `epoch-700 weights at seed 11 vs pretrained8.ts: max |Δ| ${ringDiff.toExponential(1)} — Part 3 bills the wall Part 1 trained`)
  fact(`hero training run (inline replay): ${TRAIN_EPOCHS} epochs in ${(finalUpdate!.trainMs / 1000).toFixed(1)} s of trainer time (${wall.toFixed(1)} s incl. probes), ${curve.length} posts`)
}

console.log('--- the curve: improving over time ---')
{
  const at = (e: number) => curve.find((u) => u.epoch === e)!
  const q0 = at(0).quality
  const q100 = at(100).quality
  const qF = finalUpdate!.quality
  ok(q0.meanPx >= 20 && q0.family <= 0.1, 'curve/static-at-0', `epoch 0: ${q0.meanPx.toFixed(1)} px wrong, ${Math.round(q0.family * 100)}% in family — static`)
  ok(q100.meanPx <= 13, 'curve/by-100', `epoch 100: ${q100.meanPx.toFixed(1)} px`)
  ok(qF.meanPx <= 8.5 && qF.family >= 0.6, 'curve/final', `epoch ${TRAIN_EPOCHS}: ${qF.meanPx.toFixed(1)} px, ${Math.round(qF.family * 100)}% within ${FAMILY_PX} px`)
  const tail = curve.slice(-10).reduce((a, u) => a + u.quality.meanPx, 0) / 10
  ok(q0.meanPx - tail >= 15, 'curve/falls', `last-ten mean ${tail.toFixed(1)} px sits ${(q0.meanPx - tail).toFixed(1)} px below epoch 0`)
  const firstFamily = curve.find((u) => u.quality.family >= 0.4)!
  fact(`learning curve: ${q0.meanPx.toFixed(1)} px / ${Math.round(q0.family * 100)}% at epoch 0 → ${q100.meanPx.toFixed(1)} px at epoch 100 → ${qF.meanPx.toFixed(1)} px / ${Math.round(qF.family * 100)}% at ${TRAIN_EPOCHS}; 40% in family first reached at epoch ${firstFamily.epoch} (${(firstFamily.trainMs / 1000).toFixed(1)} s)`)
}

// ---------------------------------------------------------------------------
// Tier 3 — frozen final weights: the wall runs what the instrument scores.
// ---------------------------------------------------------------------------

console.log('--- the instrument scores the wall ---')
{
  const probe = freshProbe()
  const stepper = createLearningWall(freshShared(), probe, PRETRAINED8_SEED, {
    feed: () => cannedFeed(finalUpdate!),
  })
  for (let i = 0; i < 600; i++) stepper.step(0.05) // 30 s of wall time
  const canvas = createCanvas(640, H)
  stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, 640, H)
  ok(probe.finished >= 60, 'wall/dreams', `${probe.finished} dreams finished in 30 s`)
  let mismatches = 0
  for (const d of probe.dreams) {
    if (sigOf(dreamOnWall(finalUpdate!.models, pl, PRETRAINED8_SEED, d.run)) !== d.sig) mismatches++
  }
  ok(mismatches === 0, 'wall/schedule', `${probe.dreams.length} finished dreams equal the straight-line dream for their run — 0 mismatches`)
  // the wall's own dreams (all of them, different seed from the probe's) score
  // like the probe's forty — the on-canvas "last 20" is the same quantity,
  // noisier by design
  let wallDist = 0
  for (const d of probe.dreams) {
    const x = Int8Array.from(d.sig, (c) => (c === '1' ? 1 : -1))
    wallDist += nearestGlyph8Distance(x)
  }
  const wallMean = wallDist / probe.dreams.length
  ok(
    Math.abs(wallMean - finalUpdate!.quality.meanPx) <= 2.5,
    'wall/agrees-with-probe',
    `wall's ${probe.dreams.length} dreams: ${wallMean.toFixed(1)} px vs probe's ${PROBE_DREAMS}: ${finalUpdate!.quality.meanPx.toFixed(1)} px`,
  )
  ok(probe.epoch === TRAIN_EPOCHS && probe.updatesApplied === 1, 'wall/applied', `applied ${probe.updatesApplied} update, epoch ${probe.epoch}`)
}

// ---------------------------------------------------------------------------
// Tier 4 — coin-toss weights only: static is static.
// ---------------------------------------------------------------------------

console.log('--- static is static ---')
{
  const probe = freshProbe()
  const stepper = createLearningWall(freshShared(), probe, PRETRAINED8_SEED, {
    feed: (p, gen, seed) => createInlineFeed(p, { gen, seed, epochs: 0 }, 10),
  })
  for (let i = 0; i < 400; i++) stepper.step(0.05)
  const canvas = createCanvas(640, H)
  stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, 640, H)
  const m = probe.recent.reduce((a, b) => a + b, 0) / probe.recent.length
  ok(probe.finished >= 40 && m >= 20, 'static/untrained', `${probe.finished} coin-toss dreams, last ${probe.recent.length} mean ${m.toFixed(1)} px from any glyph`)
}

// ---------------------------------------------------------------------------
// Tier 5 — rendering, mid-training, both widths.
// ---------------------------------------------------------------------------

console.log('--- rendering ---')

interface Frame {
  canvas: Canvas
  probe: LearningWallProbe
}

/** One wall, trained at the worker's own 20-epoch cadence (one epoch chunk
 *  per frame), photographed at both widths twice: two steps in (epoch 20,
 *  two curve points) and after 160 steps (trained, 6 s of dreams behind
 *  it). draw() lays out from (w, h), so one training run serves both widths. */
function renderFrames(): Record<number, { early: Frame; late: Frame }> {
  const probe = freshProbe()
  const stepper = createLearningWall(freshShared(), probe, PRETRAINED8_SEED, {
    feed: (p, gen, seed) => createInlineFeed(p, { gen, seed, epochs: TRAIN_EPOCHS }, 20),
  })
  const shoot = (w: number): Frame => {
    const canvas = createCanvas(w, H)
    stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, w, H)
    return { canvas, probe: { ...probe, curve: probe.curve.slice() } }
  }
  for (let i = 0; i < 2; i++) stepper.step(0.05)
  const early = { 640: shoot(640), 360: shoot(360) }
  for (let i = 0; i < 158; i++) stepper.step(0.05)
  const late = { 640: shoot(640), 360: shoot(360) }
  return { 640: { early: early[640], late: late[640] }, 360: { early: early[360], late: late[360] } }
}

const frames = renderFrames()

for (const w of [640, 360]) {
  const L = learningWallLayout(w, H)
  const { early, late } = frames[w]
  writeFileSync(join(OUT, `learningwall-early-${w}.png`), early.canvas.toBuffer('image/png'))
  writeFileSync(join(OUT, `learningwall-${w}.png`), late.canvas.toBuffer('image/png'))

  ok(late.probe.minCellPx >= 7, `fig${w}/cells`, `glyph cells ${late.probe.minCellPx} px ≥ 7`)
  // first poll is the epoch-0 snapshot, second the first 20-epoch chunk
  ok(early.probe.epoch === 20 && early.probe.curve.length === 2, `fig${w}/early-frame`, `early frame at epoch ${early.probe.epoch}, ${early.probe.curve.length} curve points`)
  ok(late.probe.epoch === TRAIN_EPOCHS && late.probe.curve.length === 36, `fig${w}/trained`, `late frame at epoch ${late.probe.epoch} of ${late.probe.epochs}, ${late.probe.curve.length} curve points`)
  ok(inkInRegion(late.canvas, PALETTE.sUp, L.wall) > 300 && inkInRegion(late.canvas, PALETTE.sDn, L.wall) > 300, `fig${w}/wall-inks`, 'dreams paint in both spin inks')
  ok(inkInRegion(late.canvas, PALETTE.sUp, L.set) > 40 && inkInRegion(late.canvas, PALETTE.sDn, L.set) > 40, `fig${w}/set-inks`, 'the seven training pictures paint in spin inks')
  if (!L.narrow) {
    ok(inkInRegion(late.canvas, PALETTE.sUp, L.inset) + inkInRegion(late.canvas, PALETTE.sDn, L.inset) > 100, `fig${w}/inset-paints`, 'the live fabric inset paints')
    ok(L.wall.y + L.wall.h <= L.set.y - 8, `fig${w}/wall-above-set`, 'wall block ends above the training-set row')
    ok(L.set.y + L.set.h <= H - 4, `fig${w}/set-fits`, `set row bottom ${L.set.y + L.set.h} inside ${H}`)
    ok(382 <= H - 4, `fig${w}/head-fits`, 'last head line inside the canvas')
  } else {
    ok(L.wall.y + L.wall.h <= L.curve.y - 14, `fig${w}/wall-above-curve`, 'wall block ends above the curve strip')
    ok(L.curve.y + L.curve.h + 14 <= H, `fig${w}/curve-fits`, `curve tick line at ${L.curve.y + L.curve.h + 12} inside ${H}`)
    ok(L.set.y + L.set.h <= L.wall.y + L.wall.h, `fig${w}/set-fits`, 'stacked set glyphs end within the wall\'s height')
  }
  const meterEarly = inkInRegion(early.canvas, PALETTE.meter, L.curve)
  const meterLate = inkInRegion(late.canvas, PALETTE.meter, L.curve)
  ok(meterLate > 40, `fig${w}/curve-ink`, `${meterLate} px of meter ink in the curve pane`)
  ok(meterLate > meterEarly + 20, `fig${w}/curve-grows`, `curve ink ${meterEarly} px at epoch 20 → ${meterLate} px trained — drawn progressively`)
  ok(inkInRegion(late.canvas, PALETTE.meter, L.head) > 40, `fig${w}/readouts`, 'epoch and wall readouts in meter ink')
  const lastEarly = early.probe.curve[early.probe.curve.length - 1].meanPx
  const lastLate = late.probe.curve[late.probe.curve.length - 1].meanPx
  ok(lastLate < lastEarly - 5, `fig${w}/curve-falls`, `curve's last point ${lastEarly.toFixed(1)} px at epoch 20 → ${lastLate.toFixed(1)} px trained`)
}

// ---------------------------------------------------------------------------

console.log('\n--- MEASURED FACTS (for the prose) ---')
for (const f of facts) console.log(`  ${f}`)
console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
