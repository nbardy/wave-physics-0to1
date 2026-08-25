/**
 * BilledWall checks — the series' hero and ring-closer (07 PLAN F1 = F13).
 * Run: bun run scripts/check-billedwall.ts
 *
 * Three tiers.
 *   1. Library arithmetic: the hero's printed numbers (per-dream bill,
 *      samples per joule, the clamp floor) re-derived here from CostStrip's
 *      constants as independent closed forms, plus regression pins to the
 *      exact figures check-part3a's MEASURED FACTS ledger binds prose to
 *      (naive ~36,264 samples/J, conditioned amortized ~287,801 — recorded
 *      2026-08-25; a change to any cost constant trips these first).
 *   2. The drained wall vs part3lib's composers: run each mode to a
 *      quiescent point (every chain stops after 3 dreams) and assert the
 *      op-by-op accumulated bill equals scheduleBill() for exactly 60
 *      samples — the wall charges precisely what the schedule model
 *      composes, line item by line item. Then the hero's core claim: the
 *      two modes' dreams are BIT-IDENTICAL (the schedule changes the bill,
 *      never the samples) — asserted on the finished-dream signatures and
 *      on every witness number.
 *   3. Rendering: both modes at 640 and 360, knobless but mode-driven —
 *      violation ink (ferro) present in the naive strip and absent from the
 *      whole settled canvas; bill ink on the strip; dreams painting in spin
 *      amber; the wall region PIXEL-IDENTICAL between modes in one frame
 *      while the strip region differs; cells ≥ 7 px at both widths and the
 *      strip inside the canvas (un-mashed).
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import { JOULES_PER_ITER, READOUT_ITERS, REFLASH_ITERS } from '../src/sims/pbits/CostStrip'
import {
  CLAMP_ITERS_PER_NODE,
  floorBill,
  scheduleBill,
} from '../src/sims/pbits/part3lib'
import { N_LEVELS, NV } from '../src/sims/pbits/denoise'
import { N_IN } from '../src/sims/pbits/denoiseCond'
import {
  AMORTIZE_BATCH,
  COND_CHAIN,
  NAIVE_CHAIN,
  billedWallLayout,
  createBilledWall,
  naivePlan,
  perDreamOf,
  samplesPerJouleOf,
  settledPlan,
  type BilledWallProbe,
} from '../src/sims/pbits/BilledWall'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}
const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

const freshProbe = (): BilledWallProbe => ({}) as BilledWallProbe

// ---------------------------------------------------------------------------
// Tier 1 — the printed numbers, from independent closed forms.
// ---------------------------------------------------------------------------

console.log('--- library arithmetic (the hero prints these) ---')

const T = N_LEVELS
const K = 6
// written here from the raw constants — NOT read back from part3lib's chains
const clampNaive = NV * (REFLASH_ITERS / 144)
const clampCond = N_IN * (REFLASH_ITERS / 144)
const NAIVE_PS = T * (REFLASH_ITERS + clampNaive + READOUT_ITERS + K) // 91,918
const SETTLED_PS = T * (clampCond + READOUT_ITERS + K) + REFLASH_ITERS / AMORTIZE_BATCH // 11,582.06

{
  ok(
    NAIVE_CHAIN.levels === T && NAIVE_CHAIN.sweepsPerLevel === K && NAIVE_CHAIN.clampNodes === NV,
    'chain/naive-spec',
    `the billed chain is check-part3a's specChain: T=${T}, k=${K}, ${NV}-px clamp`,
  )
  ok(COND_CHAIN.clampNodes === N_IN, 'chain/cond-spec', `conditioned clamp = ${N_IN} nodes (pixels + τ code)`)
  ok(near(perDreamOf({ kind: 'naive' }), NAIVE_PS, 1e-9), 'bill/naive-per-dream', `${NAIVE_PS} iters/dream, the ledger's naive bill`)
  ok(
    near(perDreamOf({ kind: 'settled' }), SETTLED_PS, 1e-9),
    'bill/settled-per-dream',
    `${SETTLED_PS.toFixed(2)} iters/dream amortized over ${AMORTIZE_BATCH}-dream batches`,
  )
  const spjNaive = samplesPerJouleOf({ kind: 'naive' })
  const spjSettled = samplesPerJouleOf({ kind: 'settled' })
  ok(near(spjNaive, 1 / (NAIVE_PS * JOULES_PER_ITER), 1e-6), 'spj/naive-arithmetic', `${spjNaive.toFixed(1)} samples/J = 1/(bill × §II B estimate)`)
  ok(near(spjSettled, 1 / (SETTLED_PS * JOULES_PER_ITER), 1e-3), 'spj/settled-arithmetic', `${spjSettled.toFixed(1)} samples/J`)
  // regression pins to check-part3a MEASURED FACTS #1b (recorded 2026-08-25):
  // if either trips, a cost constant or chain spec moved and the prose's
  // quoted numbers are stale
  ok(Math.abs(spjNaive - 36_264) < 1, 'spj/naive-ledger', `${spjNaive.toFixed(0)} vs ledger 36,264 — absurd, and computed`)
  ok(Math.abs(spjSettled - 287_801) < 1.5, 'spj/settled-ledger', `${spjSettled.toFixed(0)} vs ledger 287,801`)
  ok(NAIVE_PS / SETTLED_PS > 7.9 && NAIVE_PS / SETTLED_PS < 8.0, 'spj/ratio', `bill cut ×${(NAIVE_PS / SETTLED_PS).toFixed(2)} — the measured factor the finale claims`)
  // the clamp floor the settled strip names
  const fb = floorBill(COND_CHAIN)
  ok(
    near(fb.clampIters / fb.total, (T * clampCond) / (T * (clampCond + READOUT_ITERS + K)), 1e-12),
    'floor/clamp-share',
    `clamps are ${((fb.clampIters / fb.total) * 100).toFixed(1)}% of the no-flash bill — the irreducible line item`,
  )
}

// ---------------------------------------------------------------------------
// Tier 2 — the drained wall equals the composers; the dreams never change.
// ---------------------------------------------------------------------------

console.log('--- wall vs composer (drained to 60 exact dreams) ---')

function runDrained(settled: boolean): BilledWallProbe {
  const probe = freshProbe()
  const stepper = createBilledWall(settled, probe, 2027, { dreamsPerChain: 3 })
  for (let i = 0; i < 80; i++) stepper.step(0.5) // 40 s of sim — 3 dreams/chain take ≤ ~12 s
  const canvas = createCanvas(640, 420)
  stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, 640, 420)
  return probe
}

const dn = runDrained(false)
const ds = runDrained(true)

{
  const S = 60
  ok(dn.finished === S && ds.finished === S, 'drain/finished', `both walls drained at exactly ${S} dreams`)
  // naive: op counts are the schedule's, verbatim
  ok(
    dn.bill.counts.reflashes === S * T && dn.bill.counts.clamps === S * T && dn.bill.counts.readouts === S * T && dn.bill.counts.sweeps === S * T * K,
    'drain/naive-counts',
    `${dn.bill.counts.reflashes} reflashes, ${dn.bill.counts.clamps} clamps, ${dn.bill.counts.readouts} readouts, ${dn.bill.counts.sweeps} sweeps`,
  )
  const cn = scheduleBill(naivePlan(S))
  ok(near(dn.bill.total, cn.total, 1e-4), 'drain/naive-total', `accumulated ${dn.bill.total.toFixed(1)} = composer ${cn.total.toFixed(1)} (= ${S} × ${NAIVE_PS})`)
  ok(
    near(dn.bill.sweepIters, cn.sweepIters, 1e-6) &&
      near(dn.bill.readoutIters, cn.readoutIters, 1e-6) &&
      near(dn.bill.clampIters, cn.clampIters, 1e-4) &&
      near(dn.bill.reflashIters, cn.reflashIters, 1e-6),
    'drain/naive-line-items',
    `sweep ${dn.bill.sweepIters} · readout ${dn.bill.readoutIters} · clamp ${dn.bill.clampIters.toFixed(1)} · reflash ${dn.bill.reflashIters}`,
  )
  ok(dn.bill.reflashIters / dn.bill.total > 0.85, 'drain/naive-reflash-owns', `reflash owns ${((dn.bill.reflashIters / dn.bill.total) * 100).toFixed(1)}% of the naive bill`)
  // settled: one flash, ever
  ok(ds.bill.counts.reflashes === 1, 'drain/settled-one-flash', 'settled wall reflashed exactly once (the setup flash)')
  const cs = scheduleBill(settledPlan(S))
  ok(near(ds.bill.total, cs.total, 1e-4), 'drain/settled-total', `accumulated ${ds.bill.total.toFixed(1)} = composer ${cs.total.toFixed(1)}`)
  ok(
    near(ds.bill.clampIters, cs.clampIters, 1e-4) && near(ds.bill.reflashIters, REFLASH_ITERS, 1e-9),
    'drain/settled-line-items',
    `clamp ${ds.bill.clampIters.toFixed(1)} · reflash ${ds.bill.reflashIters} — the rest is sweeps+readouts`,
  )
  ok(
    ds.clampShare > 0.8,
    'drain/settled-clamp-floor',
    `clamps are ${(ds.clampShare * 100).toFixed(1)}% of the settled bill — the floor, visible`,
  )
  ok(near(dn.bill.total / ds.bill.total, cn.total / cs.total, 1e-9), 'drain/ratio', `wall-measured bill cut ×${(dn.bill.total / ds.bill.total).toFixed(2)}`)

  // THE HERO'S CLAIM: same seeds → bit-identical dreams; only the bill moved
  ok(dn.dreamSigs.length === S && ds.dreamSigs.length === S, 'dreams/logged', `${dn.dreamSigs.length} signatures per wall`)
  let identical = true
  for (let i = 0; i < S; i++) if (dn.dreamSigs[i] !== ds.dreamSigs[i]) identical = false
  ok(identical, 'dreams/bit-identical', 'all 60 finished dreams identical between naive and settled, bit for bit')
  ok(
    near(dn.fencedTV, ds.fencedTV, 1e-12) && dn.withinFamily === ds.withinFamily && near(dn.meanDist, ds.meanDist, 1e-12),
    'dreams/witnesses-identical',
    `fenced TV ${dn.fencedTV.toFixed(3)} · ${dn.withinFamily}/${S} in family · mean ${dn.meanDist.toFixed(2)} px — same numbers, both walls`,
  )
  // witness sanity bands (recorded 2026-08-25 at the billed k=6 budget,
  // 1 warm + 5 free sweeps: mean ≈ 11.5 px, family ≈ 45%, fenced TV ≈ 0.40 —
  // quality is what k=6 honestly buys; see BilledWall.tsx header)
  ok(dn.fencedTV < 0.5, 'witness/fenced-band', `fenced 2×2 TV ${dn.fencedTV.toFixed(3)} < 0.5`)
  ok(dn.meanDist > 8 && dn.meanDist < 14, 'witness/dist-band', `mean nearest-glyph distance ${dn.meanDist.toFixed(2)} px`)
  ok(dn.withinFamily / S > 0.25, 'witness/family-band', `${((dn.withinFamily / S) * 100).toFixed(0)}% within 10 px`)
}

// ---------------------------------------------------------------------------
// Tier 3 — rendering: inks, identity in one frame, legibility at both widths.
// ---------------------------------------------------------------------------

console.log('--- rendering ---')

function inkInRegion(canvas: Canvas, hex: string, r: { x: number; y: number; w: number; h: number }, tol = 40): number {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(Math.max(0, Math.round(r.x)), Math.max(0, Math.round(r.y)), Math.round(r.w), Math.round(r.h))
  const cr = parseInt(hex.slice(1, 3), 16)
  const cg = parseInt(hex.slice(3, 5), 16)
  const cb = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (Math.abs(img.data[i] - cr) < tol && Math.abs(img.data[i + 1] - cg) < tol && Math.abs(img.data[i + 2] - cb) < tol) count++
  }
  return count
}

function regionDiff(a: Canvas, b: Canvas, r: { x: number; y: number; w: number; h: number }): number {
  const ia = a.getContext('2d').getImageData(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)).data
  const ib = b.getContext('2d').getImageData(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)).data
  let diff = 0
  for (let i = 0; i < ia.length; i += 4) {
    if (ia[i] !== ib[i] || ia[i + 1] !== ib[i + 1] || ia[i + 2] !== ib[i + 2] || ia[i + 3] !== ib[i + 3]) diff++
  }
  return diff
}

const H = 420

function renderRunning(settled: boolean, w: number): { canvas: Canvas; probe: BilledWallProbe } {
  const probe = freshProbe()
  const stepper = createBilledWall(settled, probe, 2027)
  // identical dt sequence for every render so naive/settled walls can be
  // compared pixel for pixel — 6 s of schedule time
  for (let i = 0; i < 120; i++) stepper.step(0.05)
  const canvas = createCanvas(w, H)
  stepper.draw(canvas.getContext('2d') as unknown as CanvasRenderingContext2D, w, H)
  return { canvas, probe }
}

let naiveRate640 = NaN

for (const w of [640, 360]) {
  const L = billedWallLayout(w, H)
  const rn = renderRunning(false, w)
  if (w === 640) naiveRate640 = rn.probe.reflashRate
  const rs = renderRunning(true, w)
  writeFileSync(join(OUT, `billedwall-naive-${w}.png`), rn.canvas.toBuffer('image/png'))
  writeFileSync(join(OUT, `billedwall-settled-${w}.png`), rs.canvas.toBuffer('image/png'))

  // legibility
  ok(rn.probe.minCellPx >= 7, `fig${w}/cells`, `glyph cells ${rn.probe.minCellPx} px ≥ 7`)
  ok(L.stripTextY + 43 <= H - 2, `fig${w}/strip-fits`, `strip's last line at y=${L.stripTextY + 43} inside the ${H}px canvas — not mashed`)
  ok(L.wall.y + L.wall.h <= L.strip.y, `fig${w}/no-overlap`, 'wall block ends above the strip block')

  // the dreams paint in their own inks
  ok(inkInRegion(rn.canvas, PALETTE.sUp, L.wall) > 300, `fig${w}/wall-amber`, `${inkInRegion(rn.canvas, PALETTE.sUp, L.wall)} px of spin amber on the wall`)
  ok(inkInRegion(rn.canvas, PALETTE.sDn, L.wall) > 300, `fig${w}/wall-blue`, 'spin blue present too')
  if (!L.narrow) {
    ok(
      inkInRegion(rn.canvas, PALETTE.sUp, L.inset) + inkInRegion(rn.canvas, PALETTE.sDn, L.inset) > 100,
      `fig${w}/inset-paints`,
      'the live fabric inset paints in spin inks',
    )
  }

  // the bill wears the bill ink; the witnesses wear the meter ink
  ok(inkInRegion(rn.canvas, PALETTE.bill, L.strip) > 40, `fig${w}/strip-bill-ink`, `${inkInRegion(rn.canvas, PALETTE.bill, L.strip)} px of bill ink on the strip`)
  ok(inkInRegion(rn.canvas, PALETTE.meter, L.head) > 40, `fig${w}/witness-ink`, 'witness row present in meter ink')
  ok(inkInRegion(rs.canvas, PALETTE.meter, L.head) > 40, `fig${w}/witness-ink-settled`, 'witness row present in settled mode too')

  // violation ink: burning in naive, absent from the whole settled canvas
  const full = { x: 0, y: 0, w, h: H }
  const ferroNaive = inkInRegion(rn.canvas, PALETTE.ferro, full)
  const ferroSettled = inkInRegion(rs.canvas, PALETTE.ferro, full)
  ok(ferroNaive > 100, `fig${w}/naive-burns-red`, `${ferroNaive} px of violation ink (rate readout + headline) in naive`)
  ok(ferroSettled < 20, `fig${w}/settled-no-red`, `${ferroSettled} px of violation ink anywhere in settled`)
  ok(rn.probe.reflashRate > 1, `fig${w}/naive-rate`, `naive reflash rate ${rn.probe.reflashRate.toFixed(1)}/s — the once-per-second rule, broken on sight`)
  ok(rs.probe.reflashRate === 0, `fig${w}/settled-rate`, 'settled reflash rate 0/s — one flash, at commissioning')

  // headline inks and values
  ok(inkInRegion(rn.canvas, PALETTE.ferro, L.head) > 30, `fig${w}/naive-headline-ink`, 'naive samples/J printed in error tint')
  ok(inkInRegion(rs.canvas, PALETTE.bill, L.head) > 30, `fig${w}/settled-headline-ink`, 'settled samples/J printed in bill ink')
  ok(
    near(rn.probe.samplesPerJoule, 1 / (NAIVE_PS * JOULES_PER_ITER), 1e-6) &&
      near(rs.probe.samplesPerJoule, 1 / (SETTLED_PS * JOULES_PER_ITER), 1e-3),
    `fig${w}/spj-readouts`,
    `printed samples/J = library arithmetic (${rn.probe.samplesPerJoule.toFixed(0)} / ${rs.probe.samplesPerJoule.toFixed(0)})`,
  )

  // THE ONE-FRAME CONTRAST: same wall, different bill — pixel-identical
  // dreams, visibly different strip
  ok(regionDiff(rn.canvas, rs.canvas, L.wall) === 0, `fig${w}/wall-identical`, '0 px differ across the whole wall of dreams between modes')
  if (!L.narrow) ok(regionDiff(rn.canvas, rs.canvas, L.inset) === 0, `fig${w}/inset-identical`, 'the live fabric inset is identical too')
  ok(regionDiff(rn.canvas, rs.canvas, L.strip) > 100, `fig${w}/strip-differs`, `${regionDiff(rn.canvas, rs.canvas, L.strip)} px differ on the strip — the bill is the only thing that moved`)
}

// ---------------------------------------------------------------------------
// Facts block — what the hero prints, for the prose to quote.
// ---------------------------------------------------------------------------

console.log(`
=== BILLED WALL FACTS (2026-08-25 — as rendered) ===
naive: ${NAIVE_PS} iters/dream → ${(1 / (NAIVE_PS * JOULES_PER_ITER)).toFixed(0)} samples/J (reflash ${((T * REFLASH_ITERS) / NAIVE_PS * 100).toFixed(1)}% of the bill; rate ~${naiveRate640.toFixed(0)}/s vs the once-per-second rule)
settled (batched + conditioned, ÷${AMORTIZE_BATCH}): ${SETTLED_PS.toFixed(2)} iters/dream → ${(1 / (SETTLED_PS * JOULES_PER_ITER)).toFixed(0)} samples/J — bill cut ×${(NAIVE_PS / SETTLED_PS).toFixed(2)}; clamps ${((floorBill(COND_CHAIN).clampIters / floorBill(COND_CHAIN).total) * 100).toFixed(1)}% of the no-flash floor
dreams (both modes, bit-identical, 60 drained): fenced 2×2 TV ${dn.fencedTV.toFixed(3)} · ${dn.withinFamily}/60 within 10 px · mean nearest-glyph ${dn.meanDist.toFixed(2)} px (k=6 budget: 1 warm + 5 free sweeps/level)
wall: 20 chains of 8×8 dreams on 16×16 Z1 patches · billing basis: the article's canonical chain (clamp ${CLAMP_ITERS_PER_NODE.toFixed(2)}/node × ${NV} px)
=== end FACTS ===
`)

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`)
  process.exit(1)
}
console.log('all billedwall checks green')
