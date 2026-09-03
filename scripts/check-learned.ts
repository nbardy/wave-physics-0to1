/**
 * Renders every figure of the learned-solver lesson headlessly and asserts the
 * specific thing each one has to show. Run with `bun run check:learned`.
 *
 * Two jobs, not one:
 *
 *   1. The usual figure audit (AGENTS.md): sample for the named quantity, never
 *      for "did it paint", and exercise every knob to both ends.
 *   2. Guard the PROSE. Every number the lesson prints — 5,631 unknowns, 2.42,
 *      792 against 2,679, the 1.24% worst drift and the 1.24% bound it sits
 *      under, 4.6/λ, the 0.91 floor of the meter along the painting — is
 *      recomputed here from the shipped weights and the shipped solver and
 *      asserted, on the case and at the gate the sentence names. A retrain
 *      that changes the story fails the build instead of quietly making the
 *      article false.
 *
 * Renders land in `_figure_check/` (gitignored) so a failure can be looked at.
 */

import { ImageData as NodeImageData, createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '_figure_check')
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
//  Part 1 — the numbers the prose prints, recomputed from the shipped code
// ===========================================================================

import { PALETTE } from '../src/sims/lib/palette'
import { FluidSolver } from '../src/sims/lib/solver'
import { HELD_OUT_CASES, OOD_CASES, sampleCase } from '../src/sims/learned/cases'
import { CH, CX, CY, IN_CH, NX, NY, makeActivations, paramCount, propose } from '../src/sims/learned/net'
import { applyLaplacian, relResidual, solveCG, solveToTolerance, sweep, type Grid } from '../src/sims/learned/poisson'
import { MANIFEST, WEIGHTS } from '../src/sims/learned/weights'
import { caseFor, maxAbs, relFieldError, solidCoarseFor } from '../src/sims/learned/figlib'
import { createWarmStartRace, RACE_CASES } from '../src/sims/learned/WarmStartRace'
import { createSlowModes } from '../src/sims/learned/SlowModes'
import { createSolveDebt, solveDebtReading } from '../src/sims/learned/SolveDebt'
import { createProposalAnatomy } from '../src/sims/learned/ProposalAnatomy'
import { CG_PASS_COST, createFourWays } from '../src/sims/learned/FourWays'
import { createImpulseResponse } from '../src/sims/learned/ImpulseResponse'
import { GATED_SWEEPS, RUINED, WARM, rolloutDivergence } from '../src/sims/learned/UngatedRollout'
import { sabotageReading } from '../src/sims/learned/SabotageGate'
import { bestPainting, createPaintTheBulge, makePaintRef, paintReading } from '../src/sims/learned/PaintTheBulge'

const TOL = 1e-3
const between = (x: number, lo: number, hi: number) => x >= lo && x <= hi
const pct = (x: number, d = 2) => `${(x * 100).toFixed(d)}%`

/** ‖f‖₂ over the cells the solver updates. */
function norm2(grid: Grid, f: ArrayLike<number>): number {
  let s = 0
  for (let j = 1; j < grid.ny - 1; j++)
    for (let i = 1; i < grid.nx - 1; i++) {
      const k = i + j * grid.nx
      if (grid.solid[k]) continue
      s += f[k] * f[k]
    }
  return Math.sqrt(s)
}

// ---- the intro: the machine as described
ok(paramCount() === 809 && MANIFEST.params === 809, 'model size', `${paramCount()} parameters — the lesson says 809`)
{
  const s = new FluidSolver(NX, NY, 20, 1)
  ok(s.pressureIters === 40, 'lesson 01 stops at forty', `FluidSolver.pressureIters = ${s.pressureIters}`)
}
{
  const src = readFileSync(join(ROOT, 'src/lessons/lesson-01-navier-stokes.mdx'), 'utf8').replace(/\s+/g, ' ')
  ok(src.includes('the divergence is gone') && src.includes('Jacobi iterations'), 'what lesson 01 said', 'lesson 01 still says the divergence is gone after a few dozen sweeps and calls them Jacobi iterations — §Forty sweeps quotes it')
}

// The hero's field (h1) — everything the top of the page and the closing figure print.
const hero = RACE_CASES[0]
const hf = caseFor(hero)
const hg: Grid = hf.grid
const hsc = solidCoarseFor(hero, hf.solid)
const proposal = new Float32Array(NX * NY)
propose(hg, WEIGHTS, hf.b, hsc, proposal, makeActivations())
const star = new Float32Array(NX * NY)
solveCG(hg, star, hf.b, 1e-6, 4000)
const peak = maxAbs(hg, star)
{
  let unknowns = 0
  for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) if (!hg.solid[i + j * NX]) unknowns++
  ok(unknowns === 5631, 'intro · unknowns', `${unknowns} pressure values on the hero's channel — the intro says 5,631`)
  ok(relResidual(hg, new Float32Array(NX * NY), hf.b) === 1, 'intro · the empty grid scores 1', `${relResidual(hg, new Float32Array(NX * NY), hf.b)}`)
  const pr = relResidual(hg, proposal, hf.b)
  const pe = relFieldError(hg, proposal, star)
  ok(between(pr, 2.35, 2.5), 'intro · the proposal scores 2.42', `${pr.toFixed(3)} on the hero's field`)
  ok(between(pe, 0.06, 0.13), 'intro · about nine tenths right', `${pct(pe, 1)} of the field missing on the hero's field`)
  ok(Math.round((1 - pe) * 100) === 92, 'anatomy · "92% of the field, already right"', `${Math.round((1 - pe) * 100)}% — what ProposalAnatomy prints for h1`)
}

// ---- the race at the three gates, on the hero's field
const gateReading = (tol: number) => {
  const cold = new Float32Array(NX * NY)
  const c = solveToTolerance(hg, cold, hf.b, tol, 30000).sweeps
  const warm = Float32Array.from(proposal)
  const w = solveToTolerance(hg, warm, hf.b, tol, 30000).sweeps
  let d = 0
  for (let k = 0; k < NX * NY; k++) if (!hg.solid[k]) d = Math.max(d, Math.abs(cold[k] - warm[k]))
  return { cold: c, warm: w, ratio: c / w, lead: c - w, disagree: d / peak, coldField: cold, warmField: warm }
}
const g2 = gateReading(1e-2)
const g3 = gateReading(1e-3)
const g4 = gateReading(1e-4)
ok(between(g3.cold, 2600, 2760), 'race · sweeps from zero at 10⁻³', `${g3.cold} — the prose says 2,679`)
ok(between(g3.warm, 770, 815), 'race · sweeps from the network at 10⁻³', `${g3.warm} — the prose says 792`)
ok(between(g3.ratio, 3.3, 3.5), 'race · the 3.4×', `${g3.ratio.toFixed(2)}×`)
ok(between(g3.disagree, 0.002, 0.003), 'race · agreement at 10⁻³', `${pct(g3.disagree)} of peak pressure — the prose says 0.24%`)
ok(between(g2.ratio, 7.9, 8.7), 'race · 8.3× at 10⁻²', `${g2.ratio.toFixed(2)}× (${g2.cold} vs ${g2.warm})`)
ok(between(g4.ratio, 1.95, 2.2), 'race · 2.1× at 10⁻⁴', `${g4.ratio.toFixed(2)}× (${g4.cold} vs ${g4.warm})`)
ok(between(g2.disagree, 0.05, 0.07), 'race · 6% at 10⁻²', `${pct(g2.disagree, 1)} of peak pressure`)
ok(g4.disagree < 1e-4, 'race · 0.003% at 10⁻⁴', `${pct(g4.disagree, 4)} of peak pressure`)
ok(between(g2.lead, 1150, 1350) && between(g3.lead, 1800, 1980) && between(g4.lead, 1950, 2150), 'closing · the lead in sweeps', `${g2.lead} at 10⁻², ${g3.lead} at 10⁻³, ${g4.lead} at 10⁻⁴ — the prose says 1,246 / 1,887 / 2,037`)
ok(g3.lead - g2.lead > 3 * (g4.lead - g3.lead), 'closing · the lead stops growing', `grew ${g3.lead - g2.lead} from 10⁻² to 10⁻³ and only ${g4.lead - g3.lead} from 10⁻³ to 10⁻⁴`)

// ---- the two residual curves, sweep by sweep, at 10⁻³
{
  const cold = new Float32Array(NX * NY)
  const warm = Float32Array.from(proposal)
  const tc = [relResidual(hg, cold, hf.b)]
  const tw = [relResidual(hg, warm, hf.b)]
  for (let s = 1; s <= 2000; s++) {
    sweep(hg, cold, hf.b)
    sweep(hg, warm, hf.b)
    tc.push(relResidual(hg, cold, hf.b))
    tw.push(relResidual(hg, warm, hf.b))
  }
  const cross = tw.findIndex((v, i) => v < tc[i])
  ok(between(cross, 3, 7), 'closing · the warm curve drops under the cold one by sweep five', `crossing at sweep ${cross}`)
  const slope = (t: number[]) => (Math.log10(t[1000]) - Math.log10(t[2000])) / 10
  const sc = slope(tc)
  const sw = slope(tw)
  ok(between(sc, 0.07, 0.09) && between(sw / sc, 0.9, 1.12), 'closing · one rate past a thousand sweeps', `${sc.toFixed(3)} and ${sw.toFixed(3)} decades per hundred sweeps — the prose says 0.08, the same for both`)
  ok(between(tc[2000] / tw[2000], 30, 55), 'closing · the warm curve forty times lower', `${(tc[2000] / tw[2000]).toFixed(0)}× at sweep 2000`)
  ok(between(tc[40], 0.22, 0.25) && between(tw[40], 0.035, 0.05), 'the network paints · inside the forty-sweep budget', `${tc[40].toFixed(3)} from zero, ${tw[40].toFixed(3)} from the network — the prose says 0.236 and 0.041`)
}

// ---- four runners on the hero's field, in passes over the grid
{
  const cgCold = new Float32Array(NX * NY)
  const cgColdIt = solveCG(hg, cgCold, hf.b, TOL, 4000).sweeps
  const cgWarm = Float32Array.from(proposal)
  const cgWarmIt = solveCG(hg, cgWarm, hf.b, TOL, 4000).sweeps
  ok(CG_PASS_COST === 3, 'denominator · three touches per cell', `a conjugate-gradient step is counted as ${CG_PASS_COST} passes`)
  ok(between(cgColdIt, 135, 145), 'denominator · CG from zero', `${cgColdIt} iterations, ${cgColdIt * CG_PASS_COST} passes — the prose says 140 and 420`)
  ok(between(cgWarmIt, 120, 132), 'denominator · CG from the network', `${cgWarmIt} iterations, ${cgWarmIt * CG_PASS_COST} passes — the prose says 126 and 378`)
  const share = (cgColdIt * CG_PASS_COST) / g3.warm
  ok(between(share, 0.5, 0.56), 'denominator · cold CG beats warm sweeps', `cold conjugate gradients crosses in ${pct(share, 0)} of the warm sweeps’ passes — the prose says 53%`)
  ok(between(cgColdIt / cgWarmIt, 1.05, 1.18), 'denominator · 1.1× on CG', `${(cgColdIt / cgWarmIt).toFixed(2)}×`)
  ok(between(g3.cold / (cgColdIt * CG_PASS_COST), 6.1, 6.7), 'denominator · 6.4× from the linear algebra alone', `${(g3.cold / (cgColdIt * CG_PASS_COST)).toFixed(2)}×`)
}

// ---- the damage slider, and the bound the worst drift sits under
{
  const readings = [0, 10, 20, 30, 40, 60, 80, 100, 130, 160, 200].map((sig) => ({ sig, ...sabotageReading(sig) }))
  const at = (sig: number) => readings.find((r) => r.sig === sig)!
  ok(at(10).sweeps < at(0).sweeps && between(at(10).proposalError, 0.15, 0.22), 'gate · 10% noise', `${pct(at(10).proposalError, 0)} wrong, ${at(10).sweeps} sweeps against ${at(0).sweeps} trained — the prose says 18% and 760`)
  ok(between(at(20).proposalError, 0.7, 0.82) && between(at(20).sweeps, 2250, 2400), 'gate · 20% noise', `${pct(at(20).proposalError, 0)} wrong, ${at(20).sweeps} sweeps — the prose says 76% and 2,326`)
  ok(at(60).sweeps < at(60).coldSweeps && at(80).sweeps > at(80).coldSweeps && between(at(80).proposalError, 1.5, 1.75), 'gate · past cold at 80%', `${at(80).sweeps} sweeps against ${at(80).coldSweeps} cold, ${pct(at(80).proposalError, 0)} wrong — the prose says 2,714 and 162%`)
  ok(between(at(200).proposalError, 2.4, 2.8) && between(at(200).sweeps, 2950, 3150), 'gate · the right end', `${pct(at(200).proposalError, 0)} wrong, ${at(200).sweeps} sweeps — the prose says 258% and 3,059`)
  ok(between(at(200).acceptedError, 4e-6, 1.2e-5), 'gate · seven millionths at the right end', `accepted field ${at(200).acceptedError.toExponential(2)} from the cold start’s`)
  ok(between(at(0).acceptedError, 0.002, 0.0026), 'gate · 0.23% at the trained end', `${pct(at(0).acceptedError)}`)
  const worst = readings.reduce((a, b) => (b.acceptedError > a.acceptedError ? b : a))
  ok(worst.sig === 20 && between(worst.acceptedError, 0.0115, 0.013), 'gate · the worst drift is 1.24%, at 20%', `${pct(worst.acceptedError)} at σ = ${worst.sig}%`)

  // λ_min of −A on THIS grid, by inverse iteration, so the bound is the grid's
  // own and not the empty rectangle's.
  let x = new Float64Array(NX * NY)
  for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) if (!hg.solid[i + j * NX]) x[i + j * NX] = Math.sin((Math.PI * i) / (NX - 1)) * Math.sin((Math.PI * j) / (NY - 1))
  let lmin = 0
  for (let it = 0; it < 25; it++) {
    const nx = norm2(hg, x)
    for (let k = 0; k < x.length; k++) x[k] /= nx
    const rhs = new Float64Array(NX * NY)
    for (let k = 0; k < x.length; k++) rhs[k] = -x[k]
    const y = new Float64Array(NX * NY)
    solveCG(hg, y, rhs, 1e-10, 20000)
    let xy = 0
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) { const k = i + j * NX; if (!hg.solid[k]) xy += x[k] * y[k] }
    lmin = 1 / xy
    x = y
  }
  ok(between(lmin, 0.0035, 0.0038), 'gate · λ_min on the hero’s grid', `${lmin.toFixed(5)} — the prose says 0.0037`)
  // λ_max by power iteration, for the denominator section's square root.
  let z = new Float64Array(NX * NY)
  for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) if (!hg.solid[i + j * NX]) z[i + j * NX] = (i + j) % 2 ? 1 : -1
  const az = new Float64Array(NX * NY)
  let lmax = 0
  for (let it = 0; it < 200; it++) {
    const nz = norm2(hg, z)
    for (let k = 0; k < z.length; k++) z[k] /= nz
    applyLaplacian(hg, z, az)
    for (let k = 0; k < az.length; k++) az[k] = -az[k]
    let zz = 0
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) { const k = i + j * NX; if (!hg.solid[k]) zz += z[k] * az[k] }
    lmax = zz
    z = Float64Array.from(az)
  }
  const root = Math.sqrt(lmax / lmin)
  ok(between(root, 45, 49), 'denominator · the square root of λ_max/λ_min is 47', `√(${lmax.toFixed(2)} / ${lmin.toFixed(5)}) = ${root.toFixed(1)}`)
  const coldField = g3.coldField
  const bound = (eps: number) => (2 * eps * norm2(hg, hf.b)) / lmin / norm2(hg, coldField)
  ok(between(bound(1e-3), 0.012, 0.013), 'gate · the bound at 10⁻³ is 1.24%', `${pct(bound(1e-3))} of the answer`)
  ok(worst.acceptedError <= bound(1e-3) * 1.01, 'gate · the worst drift sits under the bound', `${pct(worst.acceptedError, 3)} measured, ${pct(bound(1e-3), 3)} allowed`)
  ok(between(bound(1e-2), 0.115, 0.13), 'gate · the bound at 10⁻² is 12%', `${pct(bound(1e-2), 1)} allowed, ${pct(g2.disagree, 1)} of peak measured`)
  // "the noise at 20% found the one direction the gate is loosest in": the two
  // accepted answers differ along the smoothest pattern, or the sentence is false.
  ok(worst.rayleigh < 1.6 * lmin, 'gate · the worst drift is along the bulge', `Rayleigh quotient of the difference ${worst.rayleigh.toFixed(5)} against λ_min ${lmin.toFixed(5)}`)
}

// ---- the sixteen held-out fields and the figure's own out-of-distribution fields
{
  const set: Array<{ grid: Grid; b: Float32Array; solid: Uint8Array }> = []
  for (const s of HELD_OUT_CASES) set.push(...sampleCase(s, 8, 9))
  let cold = 0
  let warm = 0
  let pres = 0
  let perr = 0
  for (const s of set) {
    const sc = new Float32Array(CX * CY)
    // the coarse solid fraction, as `solidCoarseFor` computes it for a spec
    const inv = 1 / 64
    for (let cj = 0; cj < CY; cj++)
      for (let ci = 0; ci < CX; ci++) {
        let t = 0
        for (let dy = 0; dy < 8; dy++) {
          const row = (cj * 8 + dy) * NX + ci * 8
          for (let dx = 0; dx < 8; dx++) t += s.solid[row + dx]
        }
        sc[ci + cj * CX] = t * inv
      }
    const p = new Float32Array(NX * NY)
    propose(s.grid, WEIGHTS, s.b, sc, p, makeActivations())
    const st = new Float32Array(NX * NY)
    solveCG(s.grid, st, s.b, 1e-5, 4000)
    cold += solveToTolerance(s.grid, new Float32Array(NX * NY), s.b, TOL, 20000).sweeps
    warm += solveToTolerance(s.grid, Float32Array.from(p), s.b, TOL, 20000).sweeps
    pres += relResidual(s.grid, p, s.b)
    perr += relFieldError(s.grid, p, st)
  }
  const n = set.length
  const r = { gsCold: cold / n, gsWarm: warm / n, residual: pres / n, fieldError: perr / n }
  ok(n === 16, 'held out · sixteen fields', `${n} fields from ${HELD_OUT_CASES.length} held-out channels`)
  ok(between(r.gsCold, 2250, 2400) && between(r.gsWarm, 810, 870), 'held out · 2330 → 840', `${r.gsCold.toFixed(0)} → ${r.gsWarm.toFixed(0)} sweeps, ${(r.gsCold / r.gsWarm).toFixed(2)}×`)
  ok(between(r.fieldError, 0.1, 0.115) && between(r.residual, 2.2, 2.35), 'held out · 89% right, reads 2.27', `${pct(1 - r.fieldError, 0)} right, residual ${r.residual.toFixed(2)}`)
  ok(Math.abs(r.gsCold - MANIFEST.heldOut.gsCold) < 0.01 * r.gsCold && Math.abs(r.fieldError - MANIFEST.heldOut.proposalFieldError) < 0.002, 'held out · the manifest is a measurement', `recomputed ${r.gsCold.toFixed(1)} / ${r.fieldError.toFixed(4)} against manifest ${MANIFEST.heldOut.gsCold.toFixed(1)} / ${MANIFEST.heldOut.proposalFieldError.toFixed(4)}`)
  ok(Math.round(r.fieldError * 100) === 11, 'impulse · "on a wake it was 11%"', `${Math.round(r.fieldError * 100)}% — the string ImpulseResponse prints for the held-out average`)
  ok(MANIFEST.samples === 240 && MANIFEST.cases.length === 6 && MANIFEST.steps === 8000 && MANIFEST.batch === 12, 'training · the three sentences', `${MANIFEST.samples} fields from ${MANIFEST.cases.length} channels, ${MANIFEST.steps} steps in batches of ${MANIFEST.batch}`)
}
{
  const expect: Record<string, { ratio: [number, number]; missing: [number, number]; prose: string }> = {
    h2: { ratio: [1.35, 1.5], missing: [0.2, 0.24], prose: '22% missing, 1.4×' },
    o1: { ratio: [1.85, 2.0], missing: [0.24, 0.28], prose: '26% missing, 1.9×' },
    o2: { ratio: [1.9, 2.1], missing: [0.18, 0.22], prose: '20% missing, 2.0×' },
    o3: { ratio: [1.15, 1.3], missing: [0.39, 0.43], prose: '41% missing, 1.2×' },
  }
  for (const spec of [HELD_OUT_CASES[1], ...OOD_CASES]) {
    const f = caseFor(spec)
    const sc = solidCoarseFor(spec, f.solid)
    const p = new Float32Array(NX * NY)
    propose(f.grid, WEIGHTS, f.b, sc, p, makeActivations())
    const st = new Float32Array(NX * NY)
    solveCG(f.grid, st, f.b, 1e-6, 4000)
    const c = solveToTolerance(f.grid, new Float32Array(NX * NY), f.b, TOL, 20000).sweeps
    const w = solveToTolerance(f.grid, Float32Array.from(p), f.b, TOL, 20000).sweeps
    const e = relFieldError(f.grid, p, st)
    const x = expect[spec.id]
    ok(between(c / w, ...x.ratio) && between(e, ...x.missing), `case knob · ${spec.label}`, `${pct(e, 0)} missing, ${(c / w).toFixed(2)}× (${c} vs ${w}) — the prose says ${x.prose}`)
  }
  ok(MANIFEST.ood.proposalFieldError > 2 * MANIFEST.heldOut.proposalFieldError, 'out of distribution · the manifest agrees', `${MANIFEST.ood.proposalFieldError.toFixed(3)} against held-out ${MANIFEST.heldOut.proposalFieldError.toFixed(3)}`)
}

// ---- the shape of the leftover: λ per pattern, sweeps per pattern, the meter
{
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const zero = new Float32Array(NX * NY)
  const nOf = (k: number) => Math.max(1, Math.round((k * NY) / NX))
  const mode = (m: number, n: number) => {
    const f = new Float32Array(NX * NY)
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) f[i + j * NX] = Math.sin((Math.PI * m * i) / (NX - 1)) * Math.sin((Math.PI * n * j) / (NY - 1))
    return f
  }
  const lambda = (m: number, n: number) => {
    const phi = mode(m, n)
    const ap = new Float32Array(NX * NY)
    applyLaplacian(grid, phi, ap)
    return norm2(grid, ap) / norm2(grid, phi)
  }
  const tenth = (m: number, n: number, cap = 5000) => {
    const f = mode(m, n)
    const b0 = Float32Array.from(f)
    const amp = () => { let nu = 0; let de = 0; for (let k = 0; k < f.length; k++) { nu += f[k] * b0[k]; de += b0[k] * b0[k] } return Math.abs(nu / de) }
    let s = 0
    while (s < cap && amp() > 0.1) { sweep(grid, f, zero); s++ }
    return s
  }
  const wave = (k: number) => (2 * (NX - 1)) / k
  ok(between(wave(14), 13, 14.5) && between(wave(28), 6.5, 7.2) && between(wave(3), 62, 65), 'leftover · the slider’s wavelengths', `k = 14 → ${wave(14).toFixed(1)} cells, k = 28 → ${wave(28).toFixed(1)}, k = 3 → ${wave(3).toFixed(1)} — the prose says fourteen, seven, sixty-three`)
  const L = { bulge: lambda(1, 1), k3: lambda(3, nOf(3)), k14: lambda(14, nOf(14)), k28: lambda(28, nOf(28)), board: lambda(NX - 2, NY - 2) }
  ok(between(L.bulge, 0.0035, 0.0037) && between(L.k3, 0.019, 0.021) && between(L.k14, 0.4, 0.42) && between(L.k28, 1.6, 1.66) && between(L.board, 7.9, 8.05), 'leftover · λ per pattern', `bulge ${L.bulge.toFixed(4)}, 63-cell ${L.k3.toFixed(3)}, 14-cell ${L.k14.toFixed(2)}, 7-cell ${L.k28.toFixed(2)}, checkerboard ${L.board.toFixed(2)}`)
  ok(between(L.board / L.bulge, 2100, 2300), 'leftover · 2,200 times louder', `${(L.board / L.bulge).toFixed(0)}× between the checkerboard and the bulge`)
  const S = { bulge: tenth(1, 1), k3: tenth(3, nOf(3)), k14: tenth(14, nOf(14)), k28: tenth(28, nOf(28)) }
  ok(between(S.bulge, 1200, 1400) && between(S.k3, 215, 255) && between(S.k14, 11, 13) && between(S.k28, 2, 4), 'leftover · sweeps to remove nine tenths', `bulge ${S.bulge}, 63-cell ${S.k3}, 14-cell ${S.k14}, 7-cell ${S.k28} — the prose says 1,287, 233, 12, 3`)
  const prods = [S.bulge * L.bulge, S.k3 * L.k3, S.k14 * L.k14, S.k28 * L.k28]
  ok(prods.every((p) => between(p, 4.4, 5.1)), 'leftover · sweeps × λ between 4.6 and 4.9', prods.map((p) => p.toFixed(2)).join(', '))
  // the figure at its default: the meter against the error actually left
  const smooth = mode(1, 1)
  const rough = mode(14, nOf(14))
  const err = new Float32Array(NX * NY)
  for (let k = 0; k < err.length; k++) err[k] = smooth[k] + rough[k]
  const ae = new Float32Array(NX * NY)
  applyLaplacian(grid, err, ae)
  const r0 = norm2(grid, ae)
  const e0 = norm2(grid, err)
  let r30 = 0
  let e30 = 0
  let s600 = 0
  for (let s = 1; s <= 600; s++) {
    sweep(grid, err, zero)
    if (s === 30) {
      applyLaplacian(grid, err, ae)
      r30 = norm2(grid, ae) / r0
      e30 = norm2(grid, err) / e0
    }
  }
  {
    let nu = 0
    let de = 0
    for (let k = 0; k < err.length; k++) { nu += err[k] * smooth[k]; de += smooth[k] * smooth[k] }
    s600 = Math.abs(nu / de)
  }
  ok(r30 < 0.012 && e30 > 0.6, 'leftover · the meter follows the ripple', `after 30 sweeps the meter reads ${pct(r30)} of its start while ${pct(e30, 0)} of the error is still in the field`)
  ok(between(s600, 0.3, 0.38), 'leftover · a third of the bulge at six hundred', `${pct(s600, 0)} of the bulge left after 600 sweeps`)
}

// ---- paint the bulge
{
  const best = bestPainting()
  const mx = Math.max(...Array.from(best, Math.abs))
  const singles: number[] = []
  let worstMissing = 1
  for (let k = 0; k < CX * CY; k++) {
    if (Math.abs(best[k]) < 0.5 * mx) continue
    const one = new Float32Array(CX * CY)
    one[k] = best[k]
    const rd = paintReading(one)
    singles.push(rd.residual)
    worstMissing = Math.min(worstMissing, rd.fieldError)
  }
  ok(singles.length >= 20 && Math.min(...singles) >= 1.08 && Math.max(...singles) <= 1.4 && worstMissing >= 0.96, 'paint · one block', `${singles.length} blocks carry half the peak; alone, each reads ${Math.min(...singles).toFixed(2)}–${Math.max(...singles).toFixed(2)} with ≥ ${pct(worstMissing, 0)} of the field missing — the prose says 1.10–1.35 and 96%`)
  const full = paintReading(best)
  ok(between(full.fieldError, 0.1, 0.12) && between(full.residual, 2.6, 2.8), 'paint · the best painting', `${pct(full.fieldError, 0)} missing, residual ${full.residual.toFixed(2)} — the prose says 11% and 2.68`)
  const scaled = (t: number) => { const c = new Float32Array(CX * CY); for (let k = 0; k < c.length; k++) c[k] = best[k] * t; return paintReading(c) }
  const r20 = scaled(0.2)
  const r30 = scaled(0.3)
  ok(r20.residual < 1 && r30.residual > 1 && r30.fieldError > 0.7, 'paint · above 1.00 before three tenths of the way', `residual ${r20.residual.toFixed(3)} at 20%, ${r30.residual.toFixed(3)} at 30% with ${pct(r30.fieldError, 0)} missing`)
  let minR = 1
  let argT = 0
  for (let t = 0; t <= 0.4; t += 0.02) { const r = scaled(t).residual; if (r < minR) { minR = r; argT = t } }
  ok(between(minR, 0.9, 0.93) && between(argT, 0.11, 0.17), 'paint · the meter’s floor along the way', `lowest reading ${minR.toFixed(3)} at ${pct(argT, 0)} of the bulge painted — the prose says 0.91 at a seventh`)
  // 99% of ‖A p₀‖² on the seam lines (through the block centres, eight apart, plus the border rows)
  const p0 = new Float32Array(NX * NY)
  {
    const { prolong } = await import('../src/sims/learned/net')
    prolong(best, p0)
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = i + j * NX; if (i === 0 || j === 0 || i === NX - 1 || j === NY - 1 || hg.solid[k]) p0[k] = 0 }
  }
  const ap = new Float32Array(NX * NY)
  applyLaplacian(hg, p0, ap)
  let tot = 0
  let onLines = 0
  for (let j = 1; j < NY - 1; j++)
    for (let i = 1; i < NX - 1; i++) {
      const k = i + j * NX
      if (hg.solid[k]) continue
      const v = ap[k] * ap[k]
      tot += v
      if (i % 8 === 3 || i % 8 === 4 || j % 8 === 3 || j % 8 === 4 || i === 1 || j === 1 || i === NX - 2 || j === NY - 2) onLines += v
    }
  ok(onLines / tot > 0.97, 'paint · the spikes sit on the seams', `${pct(onLines / tot, 1)} of ‖A p₀‖² on the lines through the block centres — the prose says 99%`)
  const w = Float32Array.from(p0)
  const n = solveToTolerance(hg, w, hf.b, TOL, 20000).sweeps
  ok(between(n, 880, 950), 'paint · sweeps from the best painting', `${n} — the prose says 915`)
}

// ---- forty sweeps, on lesson 01's own cylinder
{
  const d40 = solveDebtReading(40)
  const d4 = solveDebtReading(4)
  const d240 = solveDebtReading(240)
  ok(between(d40.mean, 0.25, 0.32), 'forty sweeps · a quarter of the defect survives', `${d40.mean.toFixed(3)} at forty sweeps, ${(d40.mean / 1e-3).toFixed(0)}× the gate — the prose says 0.28 and 280`)
  ok(between(d4.mean, 0.7, 0.85), 'forty sweeps · three quarters at four', `${d4.mean.toFixed(3)}`)
  ok(between(d240.mean, 0.075, 0.1), 'forty sweeps · 87 times the gate at 240', `${d240.mean.toFixed(3)}, ${(d240.mean / 1e-3).toFixed(0)}× the gate`)
  ok(between(1 - d240.mean / d40.mean, 0.6, 0.75), 'forty sweeps · two thirds of what forty left', `the next two hundred sweeps remove ${pct(1 - d240.mean / d40.mean, 0)} of the leftover`)
}

// ---- take the guess
{
  ok(WARM === 120 && GATED_SWEEPS === 40 && RUINED === 3, 'take the guess · the figure’s constants', `warm-up ${WARM} steps at ${GATED_SWEEPS} sweeps, called dead at ${RUINED}`)
  const trail = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => rolloutDivergence(0, k))
  ok(between(trail[0], 0.6, 0.8) && trail[7] > 60 && trail.every((v, i) => i === 0 || v > trail[i - 1]), 'take the guess · the ungated channel', `${trail.map((v) => v.toFixed(2)).join(', ')} — the prose says 0.70 … 84`)
  const gated = rolloutDivergence(GATED_SWEEPS, 8)
  ok(between(gated, 0.38, 0.5), 'take the guess · the gated channel stays at 0.43', `${gated.toFixed(3)} after 8 steps`)
  ok(rolloutDivergence(20, 60) < 0.7, 'take the guess · twenty sweeps hold', `${rolloutDivergence(20, 60).toFixed(3)} after 60 steps`)
  let died = -1
  for (let s = 1; s <= 30; s++) if (rolloutDivergence(10, s) > RUINED) { died = s; break }
  ok(between(died, 9, 14), 'take the guess · ten sweeps last eleven steps', `called dead at step ${died}`)
}

// ---- what the weights hold
{
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const empty = new Float32Array(CX * CY)
  const errAt = (pos: number) => {
    const b = new Float32Array(NX * NY)
    const i = Math.round(4 + (pos / 100) * (NX - 9))
    const row = NY >> 1
    for (const dj of [0, 1]) for (const di of [0, 1]) b[i + di + (row + dj) * NX] = 1
    const st = new Float32Array(NX * NY)
    solveCG(grid, st, b, 1e-6, 4000)
    const p = new Float32Array(NX * NY)
    propose(grid, WEIGHTS, b, empty, p, makeActivations())
    return relFieldError(grid, p, st)
  }
  const mid = [10, 20, 30, 40, 50, 60, 70, 80, 90].map(errAt)
  ok(mid.every((e) => between(e, 0.33, 0.47)), 'impulse · 35 to 45% wrong across the middle', mid.map((e) => pct(e, 0)).join(' '))
  ok(errAt(0) > 0.8 && errAt(100) > 0.8, 'impulse · worse than the empty grid at the ends', `${pct(errAt(0), 0)} at the inlet, ${pct(errAt(100), 0)} at the outlet`)
}

// ---- the forward pass, in arithmetic
{
  const cells = CX * CY
  const macs = (CH * IN_CH + CH * CH + 1 * CH) * 9 * cells
  const sweepFlops = 5631 * 5
  ok(macs === 76032 && between(macs / sweepFlops, 2.3, 3.3), 'the network paints · 76,032 multiply-adds', `${macs} in the three convolutions, ${(macs / sweepFlops).toFixed(1)} sweeps’ worth — the prose says about three`)
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

  // The closing figure: both curves and the gate line, under the ledger.
  const plot = render('race-plot', 350, () => createWarmStartRace({ spec: RACE_CASES[0], tolRef, plot: true }), 4.5)
  const band = (hex: string, tol: number) => plot.countInk(40, 240, 715, 320, hex, tol)
  ok(band(PALETTE.wall, 18) > 150, 'closing · the cold curve is drawn', `${band(PALETTE.wall, 18)} gray pixels in the plot band`)
  ok(band(PALETTE.dye, 18) > 100, 'closing · the warm curve is drawn', `${band(PALETTE.dye, 18)} amber pixels in the plot band`)
  ok(band(PALETTE.visc, 18) > 60, 'closing · the gate is a line', `${band(PALETTE.visc, 18)} green pixels in the plot band`)
  // The one fact the plot exists for: at the left edge the amber curve starts
  // ABOVE the gray one. Topmost amber pixel above topmost gray pixel, first columns.
  const topOf = (hex: string) => { for (let y = 236; y < 320; y++) for (let x = 36; x < 60; x++) if (plot.isInk(x, y, hex, 18)) return y; return 999 }
  ok(topOf(PALETTE.dye) < topOf(PALETTE.wall), 'closing · the warm curve starts above the cold one', `amber first at y=${topOf(PALETTE.dye)}, gray at y=${topOf(PALETTE.wall)}`)
}

{
  const shot = render('slow-modes', 250, () => createSlowModes({ current: 14 }), 2.5)
  // The plot lives right of centre. The ripple (red) must reach the floor while
  // the bulge (cyan) is still in the top third; the meter (violet) is low with it.
  const floor = (hex: string) => shot.countInk(320, 170, 700, 200, hex, 30)
  const high = (hex: string) => shot.countInk(320, 10, 700, 70, hex, 30)
  ok(floor(PALETTE.pHi) > 100, 'slow modes · the ripple bottoms out', `${floor(PALETTE.pHi)} red pixels along the floor of the plot`)
  ok(high(PALETTE.pLo) > 100, 'slow modes · the bulge does not', `${high(PALETTE.pLo)} cyan pixels still in the top third`)
  ok(floor(PALETTE.pLo) < floor(PALETTE.pHi) / 5, 'slow modes · and the two do not overlap there', `${floor(PALETTE.pLo)} cyan pixels on the floor vs ${floor(PALETTE.pHi)} red`)
  // The violet legend sits top-right, and the curve's first twenty sweeps fall
  // through the top third at the plot's left edge; probe the top third between.
  const meterLow = shot.countInk(320, 110, 700, 200, PALETTE.div, 30)
  const meterHigh = shot.countInk(340, 10, 600, 70, PALETTE.div, 30)
  ok(meterLow > 100 && meterHigh < 40, 'slow modes · the meter is drawn, and drawn low', `${meterLow} violet pixels in the lower half of the plot, ${meterHigh} in the top third past the first sweeps`)
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
  // "the wake behind the disc changes shape": the two flow panes, same frames
  // from the same warm-up, differ only by the budget.
  let diff = 0
  let n = 0
  for (let y = 20; y < 200; y += 2)
    for (let x = 110; x < 340; x += 2) {
      const p = low.rgba(x, y)
      const q = high.rgba(x, y)
      diff += Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])
      n++
    }
  ok(diff / n > 12, 'solve debt · the wake changes shape with the budget', `mean pixel gap ${(diff / n).toFixed(1)} between the 4-sweep and 240-sweep wakes`)
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

{
  // Paint the bulge: blank, then the best painting written straight into the
  // ref — the same path a drag takes, minus the pointer.
  const ref = makePaintRef()
  const blank = render('paint-blank', 250, () => createPaintTheBulge(ref), 0.1)
  const guessInk = (s: Shot) => s.countInk(5, 20, 227, 165, PALETTE.pLo, 45) + s.countInk(5, 20, 227, 165, PALETTE.pHi, 45)
  const hearInk = (s: Shot) => s.countInk(249, 20, 471, 165, PALETTE.div, 45)
  ok(guessInk(blank) < 200, 'paint · a fresh painting is blank', `${guessInk(blank)} pressure pixels in the guess pane`)
  const painted = render('paint-best', 250, () => {
    const st = createPaintTheBulge(ref)
    ref.coarse.set(bestPainting())
    ref.version++
    return st
  }, 0.1)
  ok(guessInk(painted) > 5000, 'paint · the painting shows', `${guessInk(painted)} pressure pixels in the guess pane`)
  ok(hearInk(painted) > 1.3 * hearInk(blank), 'paint · the meter pane lights up as the painting improves', `${hearInk(painted)} violet pixels against ${hearInk(blank)} on the blank painting`)
}

done()
