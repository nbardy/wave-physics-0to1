/**
 * Renders every figure of the learned-solver lesson headlessly and asserts the
 * specific thing each one has to show. Run with `bun run check:learned`.
 *
 * Two jobs, not one:
 *
 *   1. The usual figure audit (AGENTS.md): sample for the named quantity, never
 *      for "did it paint", and exercise every knob to both ends.
 *   2. Guard the PROSE. Every number this lesson quotes — 2.77×, 0.106, 2.27,
 *      the six-times gap between cold conjugate gradients and warm Gauss–Seidel
 *      — is recomputed here from the shipped weights and asserted. A retrain
 *      that changes the story fails the build instead of quietly making the
 *      article false.
 *
 * Renders land in `_figure_check/` (gitignored) so a failure can be looked at.
 */

import { ImageData as NodeImageData, createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The field painters draw through a small offscreen canvas, which is how every
// grid figure in this repo gets a smooth upscale without a per-cell fillRect
// storm. Node has no `document`, so give it exactly the one method they call.
const g = globalThis as unknown as {
  document?: { createElement(tag: string): Canvas }
  ImageData?: typeof NodeImageData
}
g.document = {
  createElement(tag: string) {
    if (tag !== 'canvas') throw new Error(`headless shim: no <${tag}>`)
    return createCanvas(1, 1)
  },
}
// `SolverRenderer` (sims/lib/solver.ts, shared with lesson 01) constructs
// ImageData directly. Giving Node the constructor is a two-line shim; rewriting
// a published lesson's renderer to avoid it is not.
g.ImageData = NodeImageData

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

const W = 720
let failures = 0

export function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

export interface Shot {
  rgba(x: number, y: number): [number, number, number, number]
  isInk(x: number, y: number, hex: string, tol?: number): boolean
  /** how many pixels in the box carry (roughly) this quantity's colour */
  countInk(x0: number, y0: number, x1: number, y1: number, hex: string, tol?: number): number
  /** mean distance from white inside a box — "how much ink is here at all" */
  density(x0: number, y0: number, x1: number, y1: number): number
}

function hexRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

import type { Stepper } from '../src/components/Sim'

export function render(name: string, h: number, make: () => Stepper, seconds = 0, fps = 60): Shot {
  const canvas = createCanvas(W, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = make()
  const frames = Math.round(seconds * fps)
  for (let f = 0; f < frames; f++) stepper.step(1 / fps)
  stepper.draw(ctx, W, h)

  // Composite onto white AFTER drawing, not before. Every stepper opens `draw`
  // with clearRect, so a white fill laid down first is wiped to transparent
  // black — and transparent black reads, to a hue probe, as a perfect gray.
  // That silently turned "is the gray curve here?" into "is this a pixel?" and
  // every such check passed on empty canvas. (Found 2026-08-20, by a check that
  // matched exactly 30060 of 30060 pixels in its box.)
  const flat = createCanvas(W, h)
  const fctx = flat.getContext('2d')
  fctx.fillStyle = '#ffffff'
  fctx.fillRect(0, 0, W, h)
  fctx.drawImage(canvas, 0, 0)
  writeFileSync(join(OUT, `${name}.png`), flat.toBuffer('image/png'))
  const data = (fctx as unknown as { getImageData(a: number, b: number, c: number, d: number): ImageData }).getImageData(0, 0, W, h).data
  const at = (x: number, y: number): [number, number, number, number] => {
    const o = (Math.round(y) * W + Math.round(x)) * 4
    return [data[o], data[o + 1], data[o + 2], data[o + 3]]
  }
  const isInk = (x: number, y: number, hex: string, tol = 60) => {
    const [r, gg, b] = at(x, y)
    const [tr, tg, tb] = hexRgb(hex)
    // Fields are painted as a ramp from white toward the ink, so match the
    // HUE — the direction from white — not the saturated endpoint.
    const dr = 250 - r
    const dg = 250 - gg
    const db = 252 - b
    const mag = Math.hypot(dr, dg, db)
    if (mag < 22) return false
    const nr = 250 - tr
    const ng = 250 - tg
    const nb = 252 - tb
    const nmag = Math.hypot(nr, ng, nb)
    const cos = (dr * nr + dg * ng + db * nb) / (mag * nmag)
    return cos > 1 - tol / 1000
  }
  return {
    rgba: at,
    isInk,
    countInk(x0, y0, x1, y1, hex, tol) {
      let n = 0
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (isInk(x, y, hex, tol)) n++
      return n
    },
    density(x0, y0, x1, y1) {
      let s = 0
      let n = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const [r, gg, b] = at(x, y)
          s += Math.hypot(250 - r, 250 - gg, 252 - b)
          n++
        }
      }
      return n === 0 ? 0 : s / n
    },
  }
}

export function done() {
  console.log(failures === 0 ? '\nall learned-solver checks passed' : `\n${failures} FAILED`)
  if (failures > 0) process.exit(1)
}

// ===========================================================================
//  Part 1 — the numbers the prose quotes, recomputed from the shipped weights
// ===========================================================================

import { PALETTE } from '../src/sims/lib/palette'
import { HELD_OUT_CASES } from '../src/sims/learned/cases'
import { CX, CY, NX, NY, makeActivations, paramCount, propose } from '../src/sims/learned/net'
import { solveCG, solveToTolerance, sweep, type Grid } from '../src/sims/learned/poisson'
import { MANIFEST, WEIGHTS } from '../src/sims/learned/weights'
import { caseFor, maxAbs, relFieldError, solidCoarseFor } from '../src/sims/learned/figlib'
import { createWarmStartRace, RACE_CASES } from '../src/sims/learned/WarmStartRace'
import { createSlowModes } from '../src/sims/learned/SlowModes'
import { createSolveDebt } from '../src/sims/learned/SolveDebt'
import { createProposalAnatomy } from '../src/sims/learned/ProposalAnatomy'
import { createFourWays } from '../src/sims/learned/FourWays'
import { createImpulseResponse } from '../src/sims/learned/ImpulseResponse'
import { rolloutDivergence } from '../src/sims/learned/UngatedRollout'
import { sabotageReading } from '../src/sims/learned/SabotageGate'

const TOL = 1e-3
const CG_PASS = 3

const between = (x: number, lo: number, hi: number) => x >= lo && x <= hi

ok(paramCount() === 809 && MANIFEST.params === 809, 'model size', `${paramCount()} parameters — the lesson says 809`)

{
  const h = MANIFEST.heldOut
  const ratio = h.gsCold / h.gsWarm
  ok(between(ratio, 2.5, 3.1), 'held-out speedup', `sweeps ${h.gsCold.toFixed(0)} → ${h.gsWarm.toFixed(0)} = ${ratio.toFixed(2)}× (prose: 2330 → 840, 2.8×, "saves 64%")`)
  ok(between(h.proposalFieldError, 0.085, 0.125), 'proposal field error', `${h.proposalFieldError.toFixed(3)} — prose says "about 89% of the field is already right"`)
  ok(h.proposalResidual > 1.5, 'proposal residual', `${h.proposalResidual.toFixed(2)} > 1.00 — prose says an empty grid beats it on this meter`)
  const cg = h.cgCold / h.cgWarm
  ok(between(cg, 1.05, 1.3), 'held-out speedup on CG', `${cg.toFixed(2)}× — prose says "worth 1.1×" applied to the better solver`)
  ok(between(h.residualAt40Cold / h.residualAt40Warm, 3.5, 8), 'defect at the shipped budget', `${h.residualAt40Cold.toFixed(3)} → ${h.residualAt40Warm.toFixed(3)} after 40 sweeps`)
}

{
  const o = MANIFEST.ood
  const ratio = o.gsCold / o.gsWarm
  ok(between(ratio, 1.35, 1.85), 'out-of-distribution speedup', `${ratio.toFixed(2)}× — prose says "about 1.6×"`)
  ok(o.proposalFieldError > 2 * MANIFEST.heldOut.proposalFieldError, 'out-of-distribution error', `${o.proposalFieldError.toFixed(3)} vs held-out ${MANIFEST.heldOut.proposalFieldError.toFixed(3)} — the degradation the prose promises`)
}

// The article's central ordering claim, on the exact field the figures draw:
// cold conjugate gradients must cross the gate before warm Gauss–Seidel does,
// counted in passes over the grid.
{
  const spec = RACE_CASES[0]
  const f = caseFor(spec)
  const g: Grid = f.grid
  const sc = solidCoarseFor(spec, f.solid)
  const proposal = new Float32Array(NX * NY)
  propose(g, WEIGHTS, f.b, sc, proposal, makeActivations())

  const gsCold = new Float32Array(NX * NY)
  const gsColdN = solveToTolerance(g, gsCold, f.b, TOL, 20000).sweeps
  const gsWarm = Float32Array.from(proposal)
  const gsWarmN = solveToTolerance(g, gsWarm, f.b, TOL, 20000).sweeps
  const cgCold = new Float32Array(NX * NY)
  const cgColdN = solveCG(g, cgCold, f.b, TOL, 4000).sweeps * CG_PASS
  const cgWarm = Float32Array.from(proposal)
  const cgWarmN = solveCG(g, cgWarm, f.b, TOL, 4000).sweeps * CG_PASS

  ok(between(gsColdN, 2500, 2850), 'FourWays · sweeps from zero', `${gsColdN} passes — the lesson's table says 2679`)
  ok(between(gsWarmN, 700, 900), 'FourWays · sweeps from the network', `${gsWarmN} passes — the table says 792`)
  ok(between(cgColdN, 350, 500), 'FourWays · CG from zero', `${cgColdN} passes — the table says 420`)
  ok(between(cgWarmN, 320, 450), 'FourWays · CG from the network', `${cgWarmN} passes — the table says 378`)
  ok(cgColdN < gsWarmN, 'the ordering the whole section rests on', `cold conjugate gradients (${cgColdN}) finishes before warm sweeps (${gsWarmN})`)

  // …and both accepted answers are the same answer.
  const star = new Float32Array(NX * NY)
  solveCG(g, star, f.b, 1e-6, 4000)
  const peak = maxAbs(g, star)
  let worst = 0
  for (let k = 0; k < NX * NY; k++) if (!g.solid[k]) worst = Math.max(worst, Math.abs(gsCold[k] - gsWarm[k]))
  ok(worst / peak < 0.01, 'cold and warm agree', `${((worst / peak) * 100).toFixed(2)}% of peak pressure — prose says about a quarter of a percent`)
}

// Loosening the gate must inflate the speedup AND widen the disagreement — the
// figure's tolerance buttons are the evidence for "a speedup quoted without its
// tolerance is quoting nothing", so the claim has to be true at both ends.
{
  const spec = RACE_CASES[0]
  const f = caseFor(spec)
  const sc = solidCoarseFor(spec, f.solid)
  const proposal = new Float32Array(NX * NY)
  propose(f.grid, WEIGHTS, f.b, sc, proposal, makeActivations())
  const at = (tol: number) => {
    const cold = new Float32Array(NX * NY)
    const c = solveToTolerance(f.grid, cold, f.b, tol, 20000).sweeps
    const warm = Float32Array.from(proposal)
    const w = solveToTolerance(f.grid, warm, f.b, tol, 20000).sweeps
    const star = new Float32Array(NX * NY)
    solveCG(f.grid, star, f.b, 1e-6, 4000)
    let d = 0
    for (let k = 0; k < NX * NY; k++) if (!f.grid.solid[k]) d = Math.max(d, Math.abs(cold[k] - warm[k]))
    return { ratio: c / w, disagree: d / maxAbs(f.grid, star) }
  }
  const loose = at(1e-2)
  const tight = at(1e-4)
  ok(loose.ratio > 6, 'loose gate flatters the network', `${loose.ratio.toFixed(1)}× at 10⁻² — prose says "above eight times"`)
  ok(tight.ratio < 2.6, 'tight gate deflates it', `${tight.ratio.toFixed(1)}× at 10⁻⁴ — prose says "about two"`)
  ok(loose.disagree > 10 * tight.disagree, 'the gate is the contract', `answers differ by ${(loose.disagree * 100).toFixed(1)}% at 10⁻² and ${(tight.disagree * 100).toFixed(2)}% at 10⁻⁴`)
}

// Why Sweeping Is Slow: the decay rate must be monotone in roughness across the
// slider's whole range, or the figure's knob is decoration.
{
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const zero = new Float32Array(NX * NY)
  const survivingAfter = (m: number, n: number, sweeps: number) => {
    const f = new Float32Array(NX * NY)
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++)
        f[i + j * NX] = Math.sin((Math.PI * m * i) / (NX - 1)) * Math.sin((Math.PI * n * j) / (NY - 1))
    let a0 = 0
    for (let k = 0; k < f.length; k++) a0 += f[k] * f[k]
    for (let s = 0; s < sweeps; s++) sweep(grid, f, zero)
    let a = 0
    for (let k = 0; k < f.length; k++) a += f[k] * f[k]
    return Math.sqrt(a / a0)
  }
  const smooth = survivingAfter(1, 1, 40)
  const rough = survivingAfter(14, 9, 40)
  const roughest = survivingAfter(28, 19, 40)
  ok(smooth > 0.8, 'smooth error survives sweeping', `${(smooth * 100).toFixed(0)}% of the k = 1 mode is still there after 40 sweeps`)
  ok(rough < 0.02, 'rough error does not', `${(rough * 100).toFixed(2)}% of the k = 14 mode is left after 40 sweeps`)
  ok(roughest < rough, 'the slider is monotone', `k = 28 leaves ${(roughest * 100).toExponential(1)}%, less than k = 14`)
}

// What It Actually Learned: the impulse response must be MUCH worse than the
// wake response, or the section is telling the reader something untrue.
{
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const emptyCoarse = new Float32Array(CX * CY)
  const b = new Float32Array(NX * NY)
  const row = NY >> 1
  const i = Math.round(4 + 0.3 * (NX - 9))
  for (const dj of [0, 1]) for (const di of [0, 1]) b[i + di + (row + dj) * NX] = 1
  const star = new Float32Array(NX * NY)
  solveCG(grid, star, b, 1e-6, 4000)
  const p = new Float32Array(NX * NY)
  propose(grid, WEIGHTS, b, emptyCoarse, p, makeActivations())
  const err = relFieldError(grid, p, star)
  ok(err > 0.25, 'the impulse response is not the Green’s function', `${(err * 100).toFixed(0)}% wrong — prose says 40 to 45%, against 11% on wakes`)
  ok(err > 2 * MANIFEST.heldOut.proposalFieldError, 'and it is far worse than on a wake', `${(err * 100).toFixed(0)}% vs ${(MANIFEST.heldOut.proposalFieldError * 100).toFixed(0)}%`)
}

// The Gate Is the Architecture — both halves, measured.
{
  const gated = rolloutDivergence(40, 8)
  const ungated = rolloutDivergence(0, 8)
  const barely = rolloutDivergence(2, 8)
  ok(gated < 1, 'the gated rollout survives', `divergence ${gated.toFixed(3)} after 8 steps`)
  ok(ungated > 20 * gated, 'the ungated rollout does not', `divergence ${ungated.toFixed(1)} after the same 8 steps — ${(ungated / gated).toFixed(0)}× the gated channel`)
  ok(barely > 20 * gated, 'and two correction sweeps do not save it either', `divergence ${barely.toFixed(1)} — prose says the edge is "somewhere between two sweeps and forty"`)
  const early = rolloutDivergence(0, 3)
  ok(early < 3 && ungated > 20, 'the collapse takes a handful of steps, not one', `divergence ${early.toFixed(2)} at step 3, ${ungated.toFixed(0)} at step 8 — prose says "about eight timesteps"`)
}

{
  // Sweep the damage slider rather than sampling its ends: the claim is about
  // EVERY position of it, and the drift is not monotone in σ.
  const readings = [0, 20, 40, 60, 80, 100, 130, 160, 200].map((sig) => ({ sig, ...sabotageReading(sig) }))
  const clean = readings[0]
  const wrecked = readings[readings.length - 1]
  ok(clean.sweeps < clean.coldSweeps, 'trained weights accelerate', `${clean.sweeps} sweeps vs ${clean.coldSweeps} cold`)
  ok(wrecked.sweeps > wrecked.coldSweeps, 'the slider reaches decelerator', `${wrecked.sweeps} sweeps vs ${wrecked.coldSweeps} cold — the knob must cross this line or the figure is furniture`)
  ok(wrecked.proposalError > 1.5, 'and the proposal really is destroyed', `${(wrecked.proposalError * 100).toFixed(0)}% wrong`)
  const worst = Math.max(...readings.map((r) => r.acceptedError))
  ok(worst < 0.02, 'the accepted answer never moves', `worst drift from the cold-start answer across the whole slider is ${(worst * 100).toFixed(2)}% — prose says "about a percent", bounded by the gate and not by the weights`)
}

// ===========================================================================
//  Part 2 — the figures, sampled for the thing each one has to show
// ===========================================================================

// Pane boxes are quoted generously rather than recomputed from each component's
// layout: a check that duplicates the layout arithmetic fails when the layout is
// nudged and passes when the physics rots, which is exactly backwards.

{
  const tolRef = { current: TOL }
  const early = render('race-proposal', 250, () => createWarmStartRace({ spec: RACE_CASES[0], tolRef }), 0.2)
  // Count PRESSURE ink specifically, not "any ink": both panes contain the same
  // gray disc, and a density probe would score the obstacle as a pressure field.
  const pressureIn = (s: Shot, x0: number, x1: number) =>
    s.countInk(x0, 30, x1, 160, PALETTE.pLo, 45) + s.countInk(x0, 30, x1, 160, PALETTE.pHi, 45)
  const coldEarly = pressureIn(early, 260, 460)
  const warmEarly = pressureIn(early, 505, 700)
  ok(coldEarly < 200, 'race · the cold pane starts empty', `${coldEarly} pressure pixels before the first sweep`)
  ok(warmEarly > 8000, 'race · the warm pane starts full', `${warmEarly} pressure pixels — the proposal is there in frame one`)
  ok(warmEarly > 20 * Math.max(1, coldEarly), 'race · that contrast is the hero', `${(warmEarly / Math.max(1, coldEarly)).toFixed(0)}× more pressure ink on the network side`)

  const late = render('race-finished', 250, () => createWarmStartRace({ spec: RACE_CASES[0], tolRef }), 4.5)
  const coldLate = pressureIn(late, 260, 460)
  ok(coldLate > 8000, 'race · the cold pane fills in', `${coldLate} pressure pixels once it has swept`)
  ok(late.countInk(0, 200, 720, 250, PALETTE.visc) > 40, 'race · the gate opens', 'accepted chips painted in the gate green')
}

{
  const shot = render('slow-modes', 240, () => createSlowModes({ current: 14 }), 2.5)
  // The plot lives right of centre; the rough curve must reach its floor while
  // the smooth curve is still in the top third of the axis.
  const bottom = shot.countInk(320, 180, 700, 205, PALETTE.div)
  const smoothLow = shot.countInk(320, 180, 700, 205, PALETTE.pLo)
  const smoothHigh = shot.countInk(320, 10, 700, 70, PALETTE.pLo)
  ok(bottom > 100, 'slow modes · the rough curve bottoms out', `${bottom} violet pixels along the floor of the plot`)
  ok(smoothHigh > 100, 'slow modes · the smooth curve does not', `${smoothHigh} cyan pixels still in the top third`)
  ok(smoothLow < bottom / 5, 'slow modes · and the two do not overlap there', `${smoothLow} cyan pixels on the floor vs ${bottom} violet`)
}

{
  const low = render('solve-debt-4', 250, () => createSolveDebt({ current: 4 }), 4)
  const high = render('solve-debt-240', 250, () => createSolveDebt({ current: 240 }), 4)
  // The trace's height in the plot IS the leftover defect; a bigger budget must
  // push it down the log axis. Measure the topmost violet pixel in the plot.
  const traceTop = (s: Shot) => {
    for (let y = 8; y < 200; y++) for (let x = 400; x < 700; x += 3) if (s.isInk(x, y, PALETTE.div)) return y
    return 999
  }
  const a = traceTop(low)
  const b = traceTop(high)
  ok(a < 999 && b < 999, 'solve debt · the trace is drawn at both ends of the knob', `top pixel at y=${a} (4 sweeps) and y=${b} (240 sweeps)`)
  ok(b > a + 12, 'solve debt · more sweeps means less defect', `the trace sits ${b - a} px lower on the log axis at 240 sweeps`)
  ok(low.countInk(10, 20, 300, 200, PALETTE.dye) > 200, 'solve debt · the wake is actually there', 'dye ink in the flow pane')
}

{
  const shot = render('proposal-anatomy', 220, () => createProposalAnatomy(HELD_OUT_CASES[0]))
  // Four panes across. The proposal (3rd) must look like the answer (4th), and
  // the coarse restriction (2nd) must NOT — that gap is the section's argument.
  const box = (n: number) => [12 + n * 178, 30, 12 + n * 178 + 150, 130] as const
  const diff = (p: readonly [number, number, number, number], q: readonly [number, number, number, number]) => {
    let s = 0
    let n = 0
    for (let y = 0; y < p[3] - p[1]; y += 2) {
      for (let x = 0; x < p[2] - p[0]; x += 2) {
        const a = shot.rgba(p[0] + x, p[1] + y)
        const b = shot.rgba(q[0] + x, q[1] + y)
        s += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
        n++
      }
    }
    return s / n
  }
  const proposalVsAnswer = diff(box(2), box(3))
  const coarseVsAnswer = diff(box(1), box(3))
  ok(proposalVsAnswer < coarseVsAnswer / 2, 'anatomy · the proposal resembles the answer', `mean pixel gap ${proposalVsAnswer.toFixed(1)} vs ${coarseVsAnswer.toFixed(1)} for the coarse pane`)
  ok(shot.countInk(0, 0, 720, 220, PALETTE.pHi) > 300, 'anatomy · both pressure panes are painted', 'red lobes present')
}

{
  const shot = render('four-ways', 300, () => createFourWays(), 6)
  for (const [name, hex] of [
    ['sweeps from the network', PALETTE.dye],
    ['conjugate gradients from zero', PALETTE.vel],
    ['conjugate gradients from the network', PALETTE.visc],
  ] as const) {
    const n = shot.countInk(34, 8, 715, 200, hex, 18)
    ok(n > 200, `four ways · ${name} is drawn`, `${n} pixels of its curve`)
  }
  // The discriminating check: only the cold sweep curve is still descending in
  // the right-hand third of the axis. If a learned or Krylov curve appears out
  // there, something has stopped converging.
  // Tight hue tolerance here: at tol 35 the faint blue-gray gridlines read as
  // the gate green, and the check reported 360 phantom pixels of a curve that
  // had finished 300 passes earlier.
  const tail = (hex: string) => shot.countInk(520, 8, 700, 175, hex, 18)
  ok(tail(PALETTE.wall) > 60, 'four ways · only cold sweeps reach the far end', `${tail(PALETTE.wall)} gray pixels past the two-thirds mark`)
  ok(tail(PALETTE.vel) < 20 && tail(PALETTE.visc) < 20 && tail(PALETTE.dye) < 20, 'four ways · the other three have finished by then', `blue ${tail(PALETTE.vel)}, green ${tail(PALETTE.visc)}, amber ${tail(PALETTE.dye)} pixels out there`)
}

{
  const centroidOfWell = (s: Shot) => {
    let sx = 0
    let n = 0
    for (let y = 30; y < 230; y += 2)
      for (let x = 8; x < 350; x += 2)
        if (s.isInk(x, y, PALETTE.pLo, 40)) {
          sx += x
          n++
        }
    return n === 0 ? -1 : sx / n
  }
  const near = centroidOfWell(render('impulse-10', 330, () => createImpulseResponse({ current: 10 })))
  const far = centroidOfWell(render('impulse-90', 330, () => createImpulseResponse({ current: 90 })))
  ok(near > 0 && far > 0, 'impulse · the true well is painted at both slider ends', `centroids at x=${near.toFixed(0)} and x=${far.toFixed(0)}`)
  ok(far - near > 100, 'impulse · and it moves with the poke', `the well slides ${(far - near).toFixed(0)} px across the slider's range`)
}

done()
