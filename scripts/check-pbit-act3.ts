/**
 * Headless checks for the p-bit lesson's Act III (§7 the machine, §8 the
 * compiler). Same two tiers as check-pbit-figures.ts:
 *
 *  1. ORACLE TIER — the act's numeric claims, computed by running the same
 *     routines the figures run: the noisy threshold IS σ; J = ½·ln 9 puts the
 *     copy gate at 10% exactly and the measured circuit lands there; the
 *     visible-only XOR fit refuses while one hidden p-bit collapses the
 *     floor; the triangle's chain knob degrades the measured marginal at
 *     BOTH extremes; gain jitter has a real, priced cost.
 *
 *  2. FIGURE TIER — steppers rendered into @napi-rs/canvas, knobs driven to
 *     both ends, each figure's claim probed in its own quantity's ink.
 *     Renders land in `_figure_check/` for eyeballing.
 *
 * Run with `bun run scripts/check-pbit-act3.ts`.
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
  stateIndex,
  sweep,
  tvDistance,
  u01,
} from '../src/sims/pbits/lib'
import { logisticNoise, sigma, xorTarget, XOR_INPUTS } from '../src/sims/pbits/act3'
import { createMicroscope, type MicroProbe } from '../src/sims/pbits/Microscope'
import {
  attemptCouple,
  createManual,
  fabricEdgeOf,
  freshFabric,
} from '../src/sims/pbits/Manual'
import {
  createTriangle,
  embeddedMarginal,
  embeddedSquare,
  SQUARE_COLORS,
  triangleTarget,
  TRI_MID_JC,
  type TriProbe,
} from '../src/sims/pbits/Triangle'
import {
  createNonideality,
  GAIN_PATTERN,
  sweepJitter,
  type JitterProbe,
} from '../src/sims/pbits/Nonideality'
import { adjustKernel, createKernelTable, freshKernel } from '../src/sims/pbits/KernelTable'
import { createCompileCopy, J_STAR, type CopyProbe } from '../src/sims/pbits/CompileCopy'
import { createXorHidden, runFit, type XorProbe } from '../src/sims/pbits/XorHidden'
import { createStackFigure, STACK } from '../src/sims/pbits/StackFigure'

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
  // the compile closed form: at J = ½·ln 9 (β = 1) the copy gate's flip
  // probability is exactly 10% — σ(2J) = 0.9 to machine precision, and the
  // library's own conditional agrees.
  ok(Math.abs(sigma(2 * J_STAR) - 0.9) < 1e-12, 'oracle/half-log-nine', `σ(2·½ln9) = ${sigma(2 * J_STAR)}`)
  const m = buildModel(2, [0, 0], [{ i: 0, j: 1, J: J_STAR }], 1, [1, 0])
  const s = Int8Array.from([1, 1])
  // lib stores couplings as Float32, so the conditional matches to single
  // precision, not double — 1e-6 is the honest tolerance here.
  ok(
    Math.abs(condProbPlus(m, s, 1) - 0.9) < 1e-6,
    'oracle/copy-conditional',
    `P(y=+|x=+) = ${condProbPlus(m, s, 1).toFixed(6)} at J = ½·ln 9`,
  )
}

{
  // the noisy threshold IS the sigmoid: measured flip rates from raw
  // logistic-noise threshold events match σ(2βI) at several currents.
  for (const I of [-1.5, -0.4, 0.7, 2]) {
    let up = 0
    const N = 200_000
    for (let n = 1; n <= N; n++) if (I + logisticNoise(u01(17, n, 0, 0), 1) > 0) up++
    const rate = up / N
    ok(
      Math.abs(rate - sigma(2 * I)) < 0.006,
      'oracle/noisy-threshold',
      `I=${I}: measured ${rate.toFixed(4)} vs σ(2I) ${sigma(2 * I).toFixed(4)}`,
    )
  }
}

{
  // XOR: the visible-only fit floors far from the target (its best kernel is
  // the coin, mean error 0.4); one hidden p-bit collapses the floor. Both
  // numbers computed by running the figure's own fit routine.
  const vis = runFit('visible', 3_000)
  const hid = runFit('hidden', 12_000)
  ok(vis.err > 0.3, 'oracle/xor-visible-floor', `mean kernel error ${vis.err.toFixed(3)} after 3k steps`)
  ok(hid.err < 0.03, 'oracle/xor-hidden-collapse', `mean kernel error ${hid.err.toFixed(4)} after 12k steps`)
  // and the target itself is what the prose claims: y = "inputs differ", 90%
  let parity = true
  for (const [a, b] of XOR_INPUTS) if (xorTarget(a, b) !== (a !== b ? 0.9 : 0.1)) parity = false
  ok(parity, 'oracle/xor-target', 'K*(y=+|x) = 0.9 exactly when inputs differ')
}

function sampledLogicalTV(Jc: number, sweeps: number, seed: number): number {
  const m = embeddedSquare(Jc)
  const sched = buildChromatic(m, SQUARE_COLORS, 2)
  const s = freshSpins(m, seed)
  const counts = new Float64Array(8)
  for (let t = 1; t <= sweeps; t++) {
    sweep(m, s, sched, (site, salt) => u01(seed, t, site, salt))
    counts[stateIndex(s, [0, 1, 2])]++
  }
  return tvDistance(enumerate(triangleTarget()), countsToProbs(counts))
}

{
  // the triangle chain knob: BOTH extremes degrade the measured marginal.
  // Weak chains are biased even in the exact marginal; strong chains freeze
  // mixing so a fixed evidence budget stays far from the target.
  const target = enumerate(triangleTarget())
  const weakExact = tvDistance(target, embeddedMarginal(0.3))
  const midExact = tvDistance(target, embeddedMarginal(TRI_MID_JC))
  ok(
    weakExact > 4 * midExact && weakExact > 0.03,
    'oracle/triangle-weak-bias',
    `exact-marginal TV: weak ${weakExact.toFixed(3)} vs mid ${midExact.toFixed(3)}`,
  )
  const BUDGET = 4_000
  const weak = sampledLogicalTV(0.3, BUDGET, 3)
  const mid = sampledLogicalTV(TRI_MID_JC, BUDGET, 3)
  const strong = sampledLogicalTV(8, BUDGET, 3)
  ok(
    weak > 2 * mid,
    'oracle/triangle-weak',
    `sampled TV at ${BUDGET} sweeps: weak ${weak.toFixed(3)} vs mid ${mid.toFixed(3)}`,
  )
  ok(
    strong > 2 * mid,
    'oracle/triangle-strong-freeze',
    `sampled TV at ${BUDGET} sweeps: strong ${strong.toFixed(3)} vs mid ${mid.toFixed(3)}`,
  )
  ok(mid < 0.06, 'oracle/triangle-mid-works', `mid-chain TV ${mid.toFixed(3)} — the embedding works between the extremes`)
}

{
  // gain jitter has a real cost, priced against the IDEAL law.
  const m = buildModel(
    4,
    [0, 0, 0, 0],
    [
      { i: 0, j: 1, J: 1 },
      { i: 1, j: 2, J: 1 },
      { i: 2, j: 3, J: 1 },
      { i: 3, j: 0, J: -1 },
    ],
    0.8,
  )
  const exact = enumerate(m)
  const run = (jitter: number) => {
    const gains = GAIN_PATTERN.map((d) => 1 + jitter * d)
    const s = freshSpins(m, 9)
    const counts = new Float64Array(16)
    for (let t = 1; t <= 150_000; t++) {
      sweepJitter(m, s, gains, (site, salt) => u01(9, t, site, salt))
      if (t > 10_000) counts[stateIndex(s)]++
    }
    return tvDistance(exact, countsToProbs(counts))
  }
  const ideal = run(0)
  const scattered = run(0.6)
  ok(ideal < 0.02, 'oracle/jitter-ideal', `TV ${ideal.toFixed(4)} at zero scatter`)
  ok(
    scattered > 3 * ideal && scattered > 0.03,
    'oracle/jitter-priced',
    `TV ${scattered.toFixed(4)} at ±60% scatter vs ${ideal.toFixed(4)} ideal`,
  )
}

{
  // the manual's type discipline: wired pairs cycle, unwired pairs refuse.
  const st = freshFabric()
  ok(fabricEdgeOf(0, 1) !== null && fabricEdgeOf(0, 5) === null, 'oracle/fabric-wires', 'adjacency is the wiring')
  const before = st.J[fabricEdgeOf(1, 2)!]
  ok(attemptCouple(st, 1, 2) === 'cycled' && st.J[fabricEdgeOf(1, 2)!] !== before, 'oracle/manual-couple', 'wired pair cycles its J')
  ok(attemptCouple(st, 0, 5) === 'refused' && st.refusal !== null, 'oracle/manual-refuse', 'diagonal pair refused, refusal staged')
}

{
  // kernel table rows stay normalized under any edit
  const k = freshKernel()
  adjustKernel(k, 0, 1, 0.37)
  adjustKernel(k, 1, 0, -0.6)
  ok(
    Math.abs(k[0][0] + k[0][1] - 1) < 1e-12 && Math.abs(k[1][0] + k[1][1] - 1) < 1e-12,
    'oracle/kernel-rows',
    `rows sum to 1 after edits (${k[0][1].toFixed(2)}, ${k[1][1].toFixed(2)})`,
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
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
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
  // Microscope: sweep the bias knob across its range and hold the measured
  // dots to σ(2I) — the trace is generated by real threshold events.
  const shared = { current: { h: -3 } }
  const probe: MicroProbe = { bins: [] }
  const stepper = createMicroscope(shared, probe)
  for (let k = 0; k <= 24; k++) {
    shared.current.h = -3 + (k / 24) * 6
    for (let i = 0; i < 240; i++) stepper.step(1 / 60) // 4s of samples per stop
  }
  let worst = 0
  let bins = 0
  for (const [I, up, total] of probe.bins) {
    if (total < 200) continue
    bins++
    worst = Math.max(worst, Math.abs(up / total - sigma(2 * I)))
  }
  ok(bins >= 15, 'fig/microscope-coverage', `${bins} bins carry ≥200 events`)
  ok(worst < 0.05, 'fig/microscope-sigma', `worst measured-vs-σ gap ${worst.toFixed(3)}`)
  const canvas = createCanvas(W, 280)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  shared.current.h = 0.5
  stepper.draw(ctx, W, 280)
  writeFileSync(join(OUT, 'act3-microscope.png'), canvas.toBuffer('image/png'))
  const img = ctx.getImageData(0, 0, W, 280)
  ok(inkCount(img, PALETTE.meter) > 60, 'fig/microscope-ink', 'measured dots painted in meter violet')
  ok(inkCount(img, PALETTE.ghost) > 40, 'fig/microscope-ghost', 'exact σ curve painted in ghost gray')
}

{
  // Manual: a refused coupling attempt paints its snap-back in refusal red;
  // the fabric itself sweeps and paints both spin inks.
  const st = freshFabric()
  const shared = { current: st }
  const img = render('act3-manual', 300, () => createManual(shared), 3)
  ok(
    inkCount(img, PALETTE.sUp) + inkCount(img, PALETTE.sDn) > 2_000,
    'fig/manual-fabric',
    'cells painted in both state inks',
  )
  attemptCouple(st, 0, 10) // diagonal — must refuse
  const img2 = render('act3-manual-refused', 300, () => {
    const s2 = createManual(shared)
    return s2
  }, 0.15)
  ok(
    inkCount(img2, PALETTE.ferro) > inkCount(img, PALETTE.ferro) + 30,
    'fig/manual-refusal-ink',
    'refused wire painted red over baseline',
  )
}

{
  // Triangle: figure probe at both knob ends after a fixed watch — the meter
  // number itself degrades at both extremes relative to the middle.
  const run = (Jc: number) => {
    const shared = { current: { embedded: true, Jc, paint: [0, 0, 0] } }
    const probe: TriProbe = { tv: 0, samples: 0 }
    render(`act3-triangle-${Jc}`, 290, () => createTriangle(shared, probe), 14)
    return probe
  }
  const weak = run(0.3)
  const mid = run(TRI_MID_JC)
  const strong = run(8)
  ok(weak.samples > 3_000, 'fig/triangle-samples', `${weak.samples} samples accumulated`)
  ok(
    weak.tv > 2 * mid.tv && strong.tv > 2 * mid.tv,
    'fig/triangle-both-ends',
    `TV weak ${weak.tv.toFixed(3)} / mid ${mid.tv.toFixed(3)} / strong ${strong.tv.toFixed(3)}`,
  )
  // the pre-embed coloring pane: a full same-color attempt shows conflicts
  const shared = { current: { embedded: false, Jc: TRI_MID_JC, paint: [1, 1, 2] } }
  const img = render('act3-triangle-coloring', 290, () => createTriangle(shared), 0.1)
  ok(inkCount(img, PALETTE.ferro) > 200, 'fig/triangle-conflict-ink', 'same-color wire glows red')
}

{
  // Nonideality: knob at both ends through the figure's own probe.
  const run = (jitter: number) => {
    const shared = { current: { jitter } }
    const probe: JitterProbe = { tv: 0, samples: 0 }
    render(`act3-jitter-${jitter}`, 260, () => createNonideality(shared, probe), 20)
    return probe
  }
  const ideal = run(0)
  const scattered = run(0.6)
  ok(ideal.tv < 0.05, 'fig/jitter-ideal', `TV ${ideal.tv.toFixed(3)} at zero scatter`)
  ok(
    scattered.tv > 2 * ideal.tv,
    'fig/jitter-scattered',
    `TV ${scattered.tv.toFixed(3)} at full scatter vs ${ideal.tv.toFixed(3)}`,
  )
}

{
  // KernelTable renders its heatmap in meter ink and reacts to edits.
  const shared = { current: { k: freshKernel() } }
  const img = render('act3-kernel-table', 250, () => createKernelTable(shared), 0)
  const base = inkCount(img, PALETTE.meter)
  ok(base > 500, 'fig/kernel-ink', `heatmap painted (${base} px of meter ink)`)
}

{
  // CompileCopy: J at both ends. Low J: flip rate near 50%, no reveal. At
  // ½·ln 9: both rows measure ~10% and the reveal fires.
  const runCopy = (J: number, seconds: number) => {
    const shared = { current: { J, showX: 1 as const } }
    const probe: CopyProbe = { rate: [0, 0], samples: 0, revealed: false }
    const img = render(`act3-compile-${J.toFixed(2)}`, 280, () => createCompileCopy(shared, probe), seconds)
    return { probe, img }
  }
  const loose = runCopy(0, 8)
  ok(
    Math.abs(loose.probe.rate[1] - 0.5) < 0.05 && !loose.probe.revealed,
    'fig/compile-loose',
    `J=0: flip rate ${(loose.probe.rate[1] * 100).toFixed(1)}%, no reveal`,
  )
  const tight = runCopy(J_STAR, 12)
  ok(
    Math.abs(tight.probe.rate[0] - 0.1) < 0.025 && Math.abs(tight.probe.rate[1] - 0.1) < 0.025,
    'fig/compile-ten-percent',
    `J=½ln9: measured flips ${(tight.probe.rate[0] * 100).toFixed(1)}% / ${(tight.probe.rate[1] * 100).toFixed(1)}%`,
  )
  ok(tight.probe.revealed, 'fig/compile-reveal', 'the ½·ln 9 reveal fired at the mark')
  ok(inkCount(tight.img, PALETTE.meter) > 300, 'fig/compile-ink', 'meter + heatmaps painted')
}

{
  // XorHidden: run both modes through the live stepper; the visible floor
  // refuses on-screen and the hidden fit collapses on-screen.
  const runXor = (mode: 'visible' | 'hidden', seconds: number) => {
    const shared = { current: { mode } }
    const probe: XorProbe = { err: 1, step: 0 }
    const img = render(`act3-xor-${mode}`, 300, () => createXorHidden(shared, probe), seconds)
    return { probe, img }
  }
  const vis = runXor('visible', 4)
  const hid = runXor('hidden', 10)
  ok(vis.probe.step > 2_000 && vis.probe.err > 0.3, 'fig/xor-visible', `err ${vis.probe.err.toFixed(3)} after ${vis.probe.step} live steps`)
  ok(hid.probe.err < 0.05, 'fig/xor-hidden', `err ${hid.probe.err.toFixed(4)} after ${hid.probe.step} live steps`)
  ok(
    inkCount(vis.img, PALETTE.ferro) > inkCount(hid.img, PALETTE.ferro) + 200,
    'fig/xor-error-ink',
    'error heatmap visibly redder in the refused fit',
  )
}

{
  // StackFigure: each layer lights its own rail slot (probe + render).
  const shared = { current: { active: 0 } }
  const rails = STACK.map((l) => l.rail).join(' · ')
  ok(
    new Set(STACK.map((l) => l.rail)).size === 4,
    'fig/stack-rail-map',
    `four layers, four distinct rail slots (${rails})`,
  )
  for (let k = 0; k < STACK.length; k++) {
    shared.current.active = k
    render(`act3-stack-${STACK[k].name.toLowerCase()}`, 300, () => createStackFigure(shared), 0)
  }
  shared.current.active = 1
  const img = render('act3-stack', 300, () => createStackFigure(shared), 0)
  ok(inkCount(img, PALETTE.meter) > 60, 'fig/stack-active-ink', 'active layer outlined in meter violet')
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
