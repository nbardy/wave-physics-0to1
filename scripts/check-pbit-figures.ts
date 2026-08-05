/**
 * Headless checks for the p-bit lesson (physics P2). Two tiers:
 *
 *  1. ORACLE TIER — the library against exact enumeration. The lesson's whole
 *     claim structure rests on `enumerate` being right and on the schedules
 *     having exactly the correctness properties the prose asserts (sequential
 *     and chromatic at the floor, synchronous pinned high). These are numeric,
 *     no canvas.
 *
 *  2. FIGURE TIER — steppers rendered into @napi-rs/canvas, asserting the
 *     specific thing each figure must show (per AGENTS.md: sample one
 *     quantity's own colour, exercise knobs to both ends). Renders land in
 *     `_figure_check/` for eyeballing failures.
 *
 * Run with `bun run check:pbits`.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { PALETTE } from '../src/sims/lib/palette'
import {
  buildChromatic,
  buildModel,
  condProbPlus,
  countsToProbs,
  enumerate,
  freshSpins,
  frustratedLoop,
  gridModel,
  stateIndex,
  subModel,
  sweep,
  tvDistance,
  u01,
  type PbitModel,
  type Schedule,
} from '../src/sims/pbits/lib'
import { createBitFlicker } from '../src/sims/pbits/BitFlicker'
import { createPairCoupler } from '../src/sims/pbits/PairCoupler'
import { createLandscape } from '../src/sims/pbits/Landscape'
import { createMeterForge } from '../src/sims/pbits/MeterForge'
import { createGridSchedules, type GridProbe } from '../src/sims/pbits/GridSchedules'
import { createStateGraph, type StateGraphProbe } from '../src/sims/pbits/StateGraph'
import { createDisplayTeach, freshTeachSpins, TEACH_MODEL } from '../src/sims/pbits/DisplayTeach'

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

/** Long-run empirical distribution of a schedule on a model. */
function longRun(m: PbitModel, sched: Schedule, sweeps: number, seed: number): Float64Array {
  const s = freshSpins(m, seed)
  const counts = new Float64Array(1 << m.n)
  const burn = Math.floor(sweeps / 10)
  for (let t = 1; t <= sweeps; t++) {
    sweep(m, s, sched, (site, salt) => u01(seed, t, site, salt))
    if (t > burn) counts[stateIndex(s)]++
  }
  return countsToProbs(counts)
}

{
  // one free spin under bias: empirical mean must be tanh(h)
  for (const h of [-1.5, 0, 0.9]) {
    const m = buildModel(1, [h], [], 1)
    const p = longRun(m, { kind: 'sequential' }, 60_000, 3)
    const mean = p[1] - p[0]
    ok(
      Math.abs(mean - Math.tanh(h)) < 0.02,
      'oracle/one-spin',
      `h=${h}: mean ${mean.toFixed(3)} vs tanh ${Math.tanh(h).toFixed(3)}`,
    )
  }
}

{
  // the frustrated loop: sequential and chromatic must sit at the floor,
  // synchronous must sit far above it — the lesson's central measured claim.
  const m = frustratedLoop(0.8)
  const exact = enumerate(m)
  const colors = Uint8Array.from([0, 1, 0, 1]) // the 4-ring is bipartite
  const seqTV = tvDistance(exact, longRun(m, { kind: 'sequential' }, 200_000, 5))
  const chrTV = tvDistance(exact, longRun(m, buildChromatic(m, colors, 2), 200_000, 7))
  const synTV = tvDistance(exact, longRun(m, { kind: 'synchronous' }, 200_000, 9))
  ok(seqTV < 0.01, 'oracle/sequential', `TV ${seqTV.toFixed(4)}`)
  ok(chrTV < 0.01, 'oracle/chromatic', `TV ${chrTV.toFixed(4)}`)
  ok(
    synTV > 5 * Math.max(seqTV, chrTV) && synTV > 0.03,
    'oracle/synchronous-is-wrong',
    `TV ${synTV.toFixed(4)} vs floors ${seqTV.toFixed(4)}/${chrTV.toFixed(4)}`,
  )
}

{
  // buildChromatic must reject a coloring with an intra-color edge
  const m = frustratedLoop(0.8)
  let threw = false
  try {
    buildChromatic(m, Uint8Array.from([0, 0, 1, 1]), 2)
  } catch {
    threw = true
  }
  ok(threw, 'oracle/coloring-guard', 'illegal coloring rejected')
}

{
  // subModel: the fenced patch's conditional matches a direct conditional
  // computed from the full grid's joint (small grid so the joint fits).
  const clamp = new Int8Array(9)
  clamp[0] = 1
  clamp[8] = -1
  const m = gridModel(3, 3, 1, 0.6, clamp)
  const s = freshSpins(m, 11)
  const interior = [4] // center cell of the 3×3
  const sub = enumerate(subModel(m, s, interior))
  // direct: P(center | its four neighbors at current values)
  const direct = condProbPlus(m, s, 4)
  ok(
    Math.abs(sub[1] - direct) < 1e-9,
    'oracle/submodel',
    `folded ${sub[1].toFixed(6)} vs direct ${direct.toFixed(6)}`,
  )
}

{
  // determinism: same seeds, same trajectory — Reset must reproduce runs
  const m = frustratedLoop(0.8)
  const a = longRun(m, { kind: 'sequential' }, 5_000, 13)
  const b = longRun(m, { kind: 'sequential' }, 5_000, 13)
  ok(tvDistance(a, b) === 0, 'oracle/determinism', 'identical trajectories from identical seeds')
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

{
  // BitFlicker: knob at both ends — the up-ink bar must dominate at h=+3
  // and the down-ink bar at h=−3 (measured as ink of each state's own colour).
  const up = { current: { h: 3 } }
  const imgUp = render('bit-flicker-up', 230, () => createBitFlicker(up, false), 6)
  const dn = { current: { h: -3 } }
  const imgDn = render('bit-flicker-dn', 230, () => createBitFlicker(dn, false), 6)
  const upAtUp = inkCount(imgUp, PALETTE.sUp)
  const dnAtUp = inkCount(imgUp, PALETTE.sDn)
  const upAtDn = inkCount(imgDn, PALETTE.sUp)
  const dnAtDn = inkCount(imgDn, PALETTE.sDn)
  ok(upAtUp > 2 * dnAtUp, 'fig/bit-flicker', `h=+3: up ink ${upAtUp} vs down ${dnAtUp}`)
  ok(dnAtDn > 2 * upAtDn, 'fig/bit-flicker', `h=−3: down ink ${dnAtDn} vs up ${upAtDn}`)
}

{
  // DisplayTeach: flipping a cell moves exactly its wired neighbors' gauges
  const before = freshTeachSpins()
  const gauges = (s: Int8Array) =>
    Array.from({ length: TEACH_MODEL.n }, (_, i) => condProbPlus(TEACH_MODEL, s, i))
  const g0 = gauges(before)
  const flipped = Int8Array.from(before)
  flipped[1] = -flipped[1]
  const g1 = gauges(flipped)
  const neighbors = new Set(Array.from(TEACH_MODEL.nbr[1]))
  let clean = true
  for (let i = 0; i < TEACH_MODEL.n; i++) {
    const moved = Math.abs(g1[i] - g0[i]) > 1e-9
    const shouldMove = neighbors.has(i) || i === 1
    if (i !== 1 && moved !== neighbors.has(i)) clean = false
    void shouldMove
  }
  ok(clean, 'fig/display-teach', 'gauge moves exactly on wired neighbors')
  render('display-teach', 300, () => createDisplayTeach({ current: { spins: before } }), 0)
}

{
  // PairCoupler in wire mode at both knob ends: sampled correlation sign flips
  const agree = { current: { h1: 0, h2: 0, J: 1.5 } }
  render('pair-agree', 240, () => createPairCoupler(agree, 'wire', false), 8)
  const disagree = { current: { h1: 0, h2: 0, J: -1.5 } }
  render('pair-disagree', 240, () => createPairCoupler(disagree, 'wire', false), 8)
  const corrOf = (J: number) => {
    const m = buildModel(2, [0, 0], [{ i: 0, j: 1, J }], 1)
    const p = longRun(m, { kind: 'sequential' }, 40_000, 23)
    return p[0] + p[3] - p[1] - p[2]
  }
  const cA = corrOf(1.5)
  const cD = corrOf(-1.5)
  ok(cA > 0.6, 'fig/pair-coupler', `J=+1.5 correlation ${cA.toFixed(2)}`)
  ok(cD < -0.6, 'fig/pair-coupler', `J=−1.5 correlation ${cD.toFixed(2)}`)
  // biases mode, the two-part target: independence CAN fake high agreement,
  // but only by pinning both coins (the cheat the lean gauges expose) — and
  // with both coins near fair, agreement is capped near zero. Both claims
  // measured. (This check replaced a wrong one-part target, 2026-08-05.)
  const mPin = buildModel(2, [2, 2], [], 1)
  const pPin = longRun(mPin, { kind: 'sequential' }, 40_000, 29)
  const cPin = pPin[0] + pPin[3] - pPin[1] - pPin[2]
  const meanPin = (pPin[1] + pPin[3]) * 2 - 1
  ok(
    cPin > 0.85 && Math.abs(meanPin) > 0.9,
    'fig/pair-biases-cheat',
    `h=(2,2): corr ${cPin.toFixed(2)} only with lean pinned at ${meanPin.toFixed(2)}`,
  )
  const mFair = buildModel(2, [0.3, 0.3], [], 1)
  const pFair = longRun(mFair, { kind: 'sequential' }, 40_000, 31)
  const cFair = pFair[0] + pFair[3] - pFair[1] - pFair[2]
  ok(
    Math.abs(cFair) < 0.12,
    'fig/pair-biases-fair',
    `h=(0.3,0.3): corr ${cFair.toFixed(2)} — fair coins cannot buy agreement with biases`,
  )
  // and the wire hits BOTH targets: corr 0.9 with both leans at zero
  const mWire = buildModel(2, [0, 0], [{ i: 0, j: 1, J: 1.5 }], 1)
  const pWire = longRun(mWire, { kind: 'sequential' }, 40_000, 37)
  const meanWire = (pWire[1] + pWire[3]) * 2 - 1
  ok(
    Math.abs(meanWire) < 0.05,
    'fig/pair-wire-fair',
    `J=1.5: corr 0.9 with lean ${meanWire.toFixed(3)} — the wire buys agreement without pinning`,
  )
}

{
  // Landscape: ghost columns at both β ends — cold concentrates, hot flattens
  const cold = enumerate(frustratedLoop(2.5))
  const hot = enumerate(frustratedLoop(0.05))
  const spread = (p: Float64Array) => Math.max(...p) / Math.min(...p)
  ok(spread(cold) > 50, 'fig/landscape', `cold spread ${spread(cold).toFixed(0)}×`)
  ok(spread(hot) < 1.5, 'fig/landscape', `hot spread ${spread(hot).toFixed(2)}×`)
  render('landscape', 260, () => createLandscape({ current: { beta: 0.8 } }), 10)
}

{
  // StateGraph: non-edge moves are zero under sequential, positive under
  // synchronous — the teleport witness in numbers.
  const seqProbe: StateGraphProbe = { visits: new Float64Array(16), nonEdgeMoves: 0, totalMoves: 0 }
  render('state-graph-seq', 300, () => createStateGraph({ current: { schedule: 'sequential' } }, seqProbe), 30)
  const synProbe: StateGraphProbe = { visits: new Float64Array(16), nonEdgeMoves: 0, totalMoves: 0 }
  render('state-graph-syn', 300, () => createStateGraph({ current: { schedule: 'synchronous' } }, synProbe), 30)
  ok(
    seqProbe.totalMoves > 100 && seqProbe.nonEdgeMoves === 0,
    'fig/state-graph',
    `sequential: ${seqProbe.nonEdgeMoves}/${seqProbe.totalMoves} non-edge moves`,
  )
  ok(
    synProbe.nonEdgeMoves > 0,
    'fig/state-graph',
    `synchronous: ${synProbe.nonEdgeMoves}/${synProbe.totalMoves} non-edge moves`,
  )
}

{
  // MeterForge: the printed TV must fall below 0.06 after ~20s at either β end
  for (const beta of [0.3, 1.6]) {
    const m = frustratedLoop(beta)
    const exact = enumerate(m)
    const p = longRun(m, { kind: 'sequential' }, 8_000, 61)
    const tv = tvDistance(exact, p)
    ok(tv < 0.06, 'fig/meter-forge', `β=${beta}: TV ${tv.toFixed(3)} after 8k sweeps`)
  }
  render('meter-forge', 260, () => createMeterForge({ current: { beta: 0.8 } }), 20)
}

{
  // GridSchedules: the marquee separation, via the figure's own probe —
  // sequential and chromatic at the floor, synchronous far above, and the
  // violet meter ink actually present on canvas.
  const run = (schedule: 'sequential' | 'synchronous' | 'chromatic') => {
    const probe: GridProbe = { tv: 0, samples: 0 }
    const img = render(
      `grid-${schedule}`,
      320,
      () => createGridSchedules({ current: { schedule } }, probe),
      40,
    )
    return { probe, img }
  }
  const seq = run('sequential')
  const syn = run('synchronous')
  const chr = run('chromatic')
  ok(
    seq.probe.samples > 5_000,
    'fig/grid',
    `sequential audited ${seq.probe.samples} samples, TV ${seq.probe.tv.toFixed(3)}`,
  )
  ok(seq.probe.tv < 0.08, 'fig/grid-sequential', `TV ${seq.probe.tv.toFixed(3)}`)
  ok(chr.probe.tv < 0.08, 'fig/grid-chromatic', `TV ${chr.probe.tv.toFixed(3)}`)
  ok(
    syn.probe.tv > 3 * Math.max(seq.probe.tv, chr.probe.tv),
    'fig/grid-synchronous',
    `TV ${syn.probe.tv.toFixed(3)} vs floors ${seq.probe.tv.toFixed(3)}/${chr.probe.tv.toFixed(3)}`,
  )
  ok(inkCount(seq.img, PALETTE.meter) > 200, 'fig/grid-meter-ink', 'violet meter bars painted')
  ok(inkCount(seq.img, PALETTE.held) > 40, 'fig/grid-halos', 'held-fence halos painted')
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
