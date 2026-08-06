/**
 * Part 2 §4 figure family — the REINFORCE ladder, the split-meter figures,
 * and the floor. Oracle tier first (exact numbers, no canvas), then figure
 * tier: render each stepper to @napi-rs/canvas, sample each quantity's OWN
 * ink, and drive every knob to both ends.
 * Run: bun run scripts/check-walk-figs.ts
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import {
  N_NODES,
  fit,
  fitReinforce,
  freshParams,
  reinforceGrad,
  targetStationary,
  trajectoryLoss,
  trajectoryReport,
  floorCurve,
} from '../src/sims/pbits/walkCompile'
import { VISIT, readSplitMeter } from '../src/sims/pbits/part2lib'
import {
  LEAK_ITERS,
  createWalkLeak,
  leakColumnX,
  leakMainRect,
  type LeakProbe,
  type LeakShared,
} from '../src/sims/pbits/WalkLeak'
import {
  LADDER_FD_ITERS,
  LADDER_FD_LR,
  LADDER_NH,
  LADDER_RF_ITERS,
  LADDER_RF_LR,
  LADDER_T,
  createWalkLadder,
  ladderBarX,
  ladderBarsRect,
  type LadderProbe,
} from '../src/sims/pbits/WalkLadder'
import {
  createWalkFloor,
  floorPlotRect,
  type FloorProbe,
  type FloorShared,
} from '../src/sims/pbits/WalkFloor'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const uniformQ = new Float64Array(N_NODES).fill(1 / N_NODES)
const qTarget = targetStationary()

// === oracle tier ===========================================================

{
  // The score-function identity, held to numbers: the exact REINFORCE
  // gradient must equal the finite-difference gradient of trajectoryLoss.
  // This is the tripwire for the whole §III D derivation (Φ̂, the backward
  // reward-to-go, the causality cut, the baseline collapse) — any sign or
  // indexing slip in reinforceGrad lands here.
  const p = fit(freshParams(3, true), uniformQ, 40, 0.35)
  const T = 8
  const g = reinforceGrad(p, T)
  const pairs: Array<[Float64Array, Float64Array]> = [
    [p.U, g.U],
    [p.b, g.b],
    [p.c, g.c],
    [p.A, g.A],
    [p.B, g.B],
  ]
  let worst = 0
  for (const [arr, grad] of pairs) {
    for (let k = 0; k < arr.length; k++) {
      const keep = arr[k]
      const eps = 1e-5
      arr[k] = keep + eps
      const up = trajectoryLoss(p, T)
      arr[k] = keep - eps
      const dn = trajectoryLoss(p, T)
      arr[k] = keep
      worst = Math.max(worst, Math.abs((up - dn) / (2 * eps) - grad[k]))
    }
  }
  ok(worst < 1e-6, 'rf/gradient-identity', `exact REINFORCE vs FD of trajectoryLoss: worst |Δ| ${worst.toExponential(2)}`)
}

// the three-stage ladder, with the figure's own constants
const s1 = fit(freshParams(LADDER_NH, true), uniformQ, LADDER_FD_ITERS, LADDER_FD_LR)
const s2 = fit(freshParams(LADDER_NH, true), qTarget, LADDER_FD_ITERS, LADDER_FD_LR)
const s3 = fitReinforce(structuredClone(s2), LADDER_T, LADDER_RF_ITERS, LADDER_RF_LR)
{
  const tv1 = trajectoryReport(s1, LADDER_T).tv
  const tv2 = trajectoryReport(s2, LADDER_T).tv
  const tv3 = trajectoryReport(s3, LADDER_T).tv
  console.log(`    measured ladder: trajectory TV ${tv1.toFixed(3)} → ${tv2.toFixed(3)} → ${tv3.toFixed(3)} (papers' shape target 5.64 → 0.30 → 0.08)`)
  ok(tv1 > tv2 && tv2 > tv3, 'ladder/descends', `each stage improves: ${tv1.toFixed(3)} > ${tv2.toFixed(3)} > ${tv3.toFixed(3)}`)
  // THE ORACLE: REINFORCE improves trajectory TV over context matching alone
  // — measured 0.491 → 0.144 (2026-08-06), a 0.29× drop; guard at 0.6×.
  ok(tv3 < 0.6 * tv2, 'ladder/reinforce-wins', `REINFORCE trajectory TV ${tv3.toFixed(3)} < 0.6 × context-matched ${tv2.toFixed(3)}`)
  // The split-meter's honest fine print, guarded as a measured fact:
  // REINFORCE buys its trajectory drop by WORSENING per-step KL (measured
  // 2026-08-06: qTarget-weighted KL 0.44 → ~2.5). The article may say "the
  // panes move in opposite directions in stage 3"; it may NOT say REINFORCE
  // improves the per-step fit.
  const kl2 = readSplitMeter(s2, qTarget, LADDER_T).klWeighted
  const kl3 = readSplitMeter(s3, qTarget, LADDER_T).klWeighted
  ok(kl3 > 1.3 * kl2, 'ladder/per-step-price', `per-step KL rises under REINFORCE: ${kl2.toFixed(3)} → ${kl3.toFixed(3)}`)
}

// the floor, at both capacity ends (the figure's own regimes)
{
  const pTwo = fit(freshParams(2), uniformQ, 220, 0.35)
  const pNone = fit(freshParams(0), uniformQ, 220, 0.35)
  const fcTwo = floorCurve(pTwo, 40)
  const fcNone = floorCurve(pNone, 40)
  const maxOf = (a: Float64Array) => Math.max(...a)
  console.log(
    `    measured floor: nh=2 ε̄ ${fcTwo.epsBar.toFixed(3)} ρ ${fcTwo.rho.toFixed(3)} bound ${fcTwo.bound.toFixed(3)} tail ${fcTwo.tvByDepth[39].toFixed(3)}; ` +
      `nh=0 bound ${fcNone.bound.toFixed(2)} tail ${fcNone.tvByDepth[39].toFixed(3)}`,
  )
  // the bound must actually bound the measured curve — at BOTH ends
  ok(fcTwo.bound >= maxOf(fcTwo.tvByDepth), 'floor/bounds-nh2', `bound ${fcTwo.bound.toFixed(3)} ≥ max measured TV ${maxOf(fcTwo.tvByDepth).toFixed(3)}`)
  ok(fcNone.bound >= maxOf(fcNone.tvByDepth), 'floor/bounds-nh0', `bound ${fcNone.bound.toFixed(3)} ≥ max measured TV ${maxOf(fcNone.tvByDepth).toFixed(3)}`)
  // with two hidden spins the bound is informative (< 1) and the curve
  // genuinely saturates at a nonzero floor beneath it
  ok(fcTwo.bound < 1, 'floor/informative', `nh=2 bound ${fcTwo.bound.toFixed(3)} sits inside the TV axis`)
  const flat = Math.abs(fcTwo.tvByDepth[39] - fcTwo.tvByDepth[19])
  ok(flat < 0.01, 'floor/saturates', `TV(40) − TV(20) = ${flat.toExponential(1)} — the curve is flat, not climbing`)
  ok(fcTwo.tvByDepth[39] > 0.15, 'floor/nonzero', `the floor is real: tail TV ${fcTwo.tvByDepth[39].toFixed(3)}`)
  // the measured truth at the starved end: the guarantee goes VACUOUS
  // (bound > 1) while the curve still saturates — the figure says so on
  // canvas instead of drawing a line off-axis
  ok(fcNone.bound > 1, 'floor/vacuous-end', `nh=0 bound ${fcNone.bound.toFixed(2)} — past 1, exactly what the figure confesses`)
  ok(Math.abs(fcNone.tvByDepth[39] - fcTwo.tvByDepth[39]) > 0.15, 'floor/knob-moves', `capacity knob moves the floor: tail ${fcNone.tvByDepth[39].toFixed(3)} vs ${fcTwo.tvByDepth[39].toFixed(3)}`)
}

// === figure tier ===========================================================

const W = 640
const H = 320

function render(stepper: { step: (dt: number) => void; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }, name: string) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, H)
  writeFileSync(join(OUT, name), canvas.toBuffer('image/png'))
  return ctx.getImageData(0, 0, W, H)
}

type Img = ReturnType<CanvasRenderingContext2D['getImageData']>

function inkIn(img: Img, hex: string, x0 = 0, y0 = 0, x1 = W, y1 = H, tol = 40): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let y = Math.floor(y0); y < y1; y++) {
    for (let x = Math.floor(x0); x < x1; x++) {
      const i = (y * W + x) * 4
      if (img.data[i + 3] < 60) continue
      if (Math.abs(img.data[i] - r) < tol && Math.abs(img.data[i + 1] - g) < tol && Math.abs(img.data[i + 2] - b) < tol) count++
    }
  }
  return count
}

/** topmost y (smallest) holding the given ink inside a column — bar height probe */
function inkTop(img: Img, hex: string, x0: number, x1: number, y0: number, y1: number): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  for (let y = Math.floor(y0); y < y1; y++) {
    for (let x = Math.floor(x0); x < x1; x++) {
      const i = (y * W + x) * 4
      if (img.data[i + 3] < 60) continue
      if (Math.abs(img.data[i] - r) < 40 && Math.abs(img.data[i + 1] - g) < 40 && Math.abs(img.data[i + 2] - b) < 40) return y
    }
  }
  return y1
}

const drive = (stepper: { step: (dt: number) => void }, calls: number) => {
  for (let i = 0; i < calls; i++) stepper.step(0.5)
}

// --- WalkLeak: both toggle ends ---------------------------------------------
{
  const shared: { current: LeakShared } = { current: { q: 'uniform' } }
  const probe: LeakProbe = { iters: 0, kl: 0, tv: 0, offGraph: 0 }
  const stepper = createWalkLeak(shared, probe)
  drive(stepper, 80)
  ok(probe.iters === LEAK_ITERS, 'fig/leak-trained', `uniform regime trained to ${probe.iters}/${LEAK_ITERS}`)
  const imgU = render(stepper, 'walk-leak-uniform.png')
  const klUniform = probe.kl
  const mr = leakMainRect(W, H)
  ok(inkIn(imgU, PALETTE.ghost) > 150, 'fig/leak-ghost', `${inkIn(imgU, PALETTE.ghost)} px of target-law ghost ink`)
  ok(inkIn(imgU, PALETTE.meter) > 300, 'fig/leak-meter', `${inkIn(imgU, PALETTE.meter)} px of meter ink`)
  const offCol = leakColumnX(mr, N_NODES)
  const offInk = inkIn(imgU, PALETTE.ferro, offCol.x0, mr.y, offCol.x1, mr.y + mr.h + 40)
  ok(offInk > 40 && probe.offGraph > 0.05, 'fig/leak-off-bucket', `off-graph bucket wears its own ferro ink (${offInk} px, mass ${probe.offGraph.toFixed(3)})`)
  // visitation glow: solid visit ticks on the context axis. Column 1 is the
  // discriminating region — its tick is full-height under uniform q and
  // shrinks under target-visited q (ticks scale by q/max q; the sticky
  // node's own column is the max in both regimes, so it cannot move).
  const col1 = leakColumnX(mr, 1)
  const visitU = inkIn(imgU, VISIT, col1.x0, mr.y, col1.x1, mr.y + mr.h)
  ok(inkIn(imgU, VISIT) > 100, 'fig/leak-glow', `${inkIn(imgU, VISIT)} px of visitation ink`)

  shared.current.q = 'visited'
  drive(stepper, 80)
  const imgV = render(stepper, 'walk-leak-visited.png')
  const visitV = inkIn(imgV, VISIT, col1.x0, mr.y, col1.x1, mr.y + mr.h)
  ok(visitV < visitU * 0.75, 'fig/leak-glow-knob', `column-1 visit ink shrinks under target-visited q: ${visitU} → ${visitV} px`)
  ok(Math.abs(probe.kl - klUniform) > 1e-3, 'fig/leak-kl-knob', `weighted KL moves with the toggle: ${klUniform.toFixed(3)} vs ${probe.kl.toFixed(3)}`)
}

// --- WalkLadder: run to completion, bars descend in their own ink -----------
{
  const probe: LadderProbe = { stage: 0, done: false, tvs: [], kls: [] }
  const stepper = createWalkLadder(probe)
  drive(stepper, Math.ceil((2 * LADDER_FD_ITERS + LADDER_RF_ITERS) / 8) + 20)
  ok(probe.done && probe.tvs.length === 3, 'fig/ladder-complete', `all three stages trained (${probe.tvs.map((t) => t.toFixed(3)).join(' → ')})`)
  const img = render(stepper, 'walk-ladder.png')
  const br = ladderBarsRect(W, H)
  const tops: number[] = []
  for (let i = 0; i < 3; i++) {
    const { x0, x1 } = ladderBarX(br, i)
    tops.push(inkTop(img, PALETTE.meter, x0, x1, br.y, br.y + br.h))
  }
  // bar 1 tallest (smallest top-y), bar 3 shortest — the ladder descends in
  // the meter's own ink, not just in printed digits
  ok(tops[0] < tops[1] && tops[1] < tops[2], 'fig/ladder-bars-descend', `meter-ink bar tops at y = ${tops.join(', ')}`)
  ok(probe.tvs[0] > probe.tvs[1] && probe.tvs[1] > probe.tvs[2], 'fig/ladder-probe-descends', `probe TVs ${probe.tvs.map((t) => t.toFixed(3)).join(' > ')}`)
}

// --- WalkFloor: both capacity ends ------------------------------------------
{
  const shared: { current: FloorShared } = { current: { cap: 'two' } }
  const probe: FloorProbe = { iters: 0, epsBar: 0, rho: 0, bound: 0, maxTV: 0, tail: 0 }
  const stepper = createWalkFloor(shared, probe)
  drive(stepper, 80)
  const imgTwo = render(stepper, 'walk-floor-two.png')
  const pr = floorPlotRect(W, H)
  ok(inkIn(imgTwo, PALETTE.meter, pr.x, pr.y, pr.x + pr.w, pr.y + pr.h) > 120, 'fig/floor-curve', `${inkIn(imgTwo, PALETTE.meter, pr.x, pr.y, pr.x + pr.w, pr.y + pr.h)} px of trajectory-TV curve ink`)
  ok(inkIn(imgTwo, PALETTE.cutoff) > 60, 'fig/floor-bound-ink', `${inkIn(imgTwo, PALETTE.cutoff)} px of bound-line ink`)
  ok(probe.bound < 1 && probe.bound >= probe.maxTV, 'fig/floor-two-holds', `bound ${probe.bound.toFixed(3)} ≥ max TV ${probe.maxTV.toFixed(3)}, inside the axis`)
  const tailTwo = probe.tail
  // the bound line must sit ABOVE the curve's tail in pixels too: the
  // cutoff ink's topmost row is higher (smaller y) than the curve's tail row
  const boundY = inkTop(imgTwo, PALETTE.cutoff, pr.x, pr.x + pr.w, pr.y, pr.y + pr.h)
  const curveTailY = inkTop(imgTwo, PALETTE.meter, pr.x + pr.w - 12, pr.x + pr.w, pr.y, pr.y + pr.h)
  ok(boundY < curveTailY, 'fig/floor-line-above-curve', `bound ink at y=${boundY}, curve tail ink at y=${curveTailY}`)

  shared.current.cap = 'none'
  drive(stepper, 80)
  const imgNone = render(stepper, 'walk-floor-none.png')
  ok(probe.bound > 1 && probe.bound >= probe.maxTV, 'fig/floor-none-vacuous', `starved end: bound ${probe.bound.toFixed(2)} past 1 (still ≥ max TV ${probe.maxTV.toFixed(3)})`)
  ok(inkIn(imgNone, PALETTE.cutoff) > 40, 'fig/floor-none-confesses', `${inkIn(imgNone, PALETTE.cutoff)} px of cutoff ink — the vacuous bound is said on canvas`)
  ok(Math.abs(probe.tail - tailTwo) > 0.15, 'fig/floor-knob-moves', `capacity knob moves the measured floor: ${tailTwo.toFixed(3)} vs ${probe.tail.toFixed(3)}`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
