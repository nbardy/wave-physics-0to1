/**
 * Part-2 remaining-figure checks (F1 hero, F2 neighborhood, F3 parity,
 * F5 asymmetric loop, F6 partition). Idiom of check-z1.ts: every figure is
 * rendered headlessly with its knob driven to both ends, every printed
 * number is recomputed through an independent route, and every ink sampled
 * is the specific quantity's own palette hex — never "any ink".
 * Run: bun run scripts/check-part2b.ts
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import { buildModel, enumerate, tvDistance, subModel, type Edge } from '../src/sims/pbits/lib'
import { Z1_RULES } from '../src/sims/pbits/z1'
import {
  N_NODES,
  compiledKernel,
  fit,
  fitReinforce,
  freshParams,
  invalidMass,
  oneHotConfig,
  targetKernel,
  targetStationary,
  trajectoryReport,
  worstStepTV,
} from '../src/sims/pbits/walkCompile'
import { LADDER_FD_ITERS, LADDER_FD_LR, LADDER_NH, LADDER_RF_ITERS, LADDER_RF_LR } from '../src/sims/pbits/WalkLadder'
import { stepKLByContext, VISIT } from '../src/sims/pbits/part2lib'
import { createWalkHero, heroStripRect, HERO_ITERS, type HeroProbe } from '../src/sims/pbits/WalkHero'
import {
  createNeighborhood,
  probeWires,
  RULE_INK,
  type NeighborhoodProbe,
} from '../src/sims/pbits/Neighborhood'
import {
  createParityToggle,
  EVEN_RULES,
  parityEdges,
  REAL_RULES,
  type ParityProbe,
} from '../src/sims/pbits/ParityToggle'
import {
  createAsymmetricLoop,
  exactRingFlux,
  RING_BETA,
  RING_N,
  ringWeights,
  type AsymProbe,
} from '../src/sims/pbits/AsymmetricLoop'
import {
  createPartitionFigure,
  freshPartitionShared,
  HID_INK,
  kernelConditional,
  PART_N,
  partitionModel,
  type PartitionProbe,
} from '../src/sims/pbits/PartitionFigure'
import type { Stepper } from '../src/components/Sim'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const W = 640
const H = 340

function render(stepper: Stepper, name: string, h = H): Canvas {
  const canvas = createCanvas(W, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.draw(ctx, W, h)
  writeFileSync(join(OUT, `${name}.png`), canvas.toBuffer('image/png'))
  return canvas
}

function inkCount(canvas: Canvas, hex: string, tol = 40): number {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (
      Math.abs(img.data[i] - r) < tol &&
      Math.abs(img.data[i + 1] - g) < tol &&
      Math.abs(img.data[i + 2] - b) < tol
    )
      count++
  }
  return count
}

function regionDiff(a: Canvas, b: Canvas, rx: number, ry: number, rw: number, rh: number): number {
  const ia = a.getContext('2d').getImageData(rx, ry, rw, rh)
  const ib = b.getContext('2d').getImageData(rx, ry, rw, rh)
  let diff = 0
  for (let i = 0; i < ia.data.length; i += 4) {
    if (
      Math.abs(ia.data[i] - ib.data[i]) > 12 ||
      Math.abs(ia.data[i + 1] - ib.data[i + 1]) > 12 ||
      Math.abs(ia.data[i + 2] - ib.data[i + 2]) > 12
    )
      diff++
  }
  return diff
}

function drive(stepper: Stepper, calls: number, dt: number) {
  for (let k = 0; k < calls; k++) stepper.step(dt)
}

// ---------------------------------------------------------------------------
// F1 — WalkHero: one-step TVs converge; the trajectory readout disagrees.
// ---------------------------------------------------------------------------

console.log('— F1 WalkHero —')
{
  // independent route: the check's own fit at the hero's settings
  const uniformQ = new Float64Array(N_NODES).fill(1 / N_NODES)
  const early = fit(freshParams(3), uniformQ, 40, 0.35)
  const p = fit(freshParams(3), uniformQ, 220, 0.35)
  const earlyWorst = worstStepTV(early)
  const worst = worstStepTV(p)
  const stepTVs: number[] = []
  for (let i = 0; i < N_NODES; i++) {
    const target = targetKernel(i)
    const model = compiledKernel(p, oneHotConfig(i))
    let tv = invalidMass(p, oneHotConfig(i))
    for (let j = 0; j < N_NODES; j++) tv += Math.abs(target[j] - model[oneHotConfig(j)])
    stepTVs.push(tv / 2)
  }
  const traj = trajectoryReport(p, 30)
  // The bound facts (06 PLAN, measured 2026-08-05): worst step 0.329, T=30
  // trajectory TV 0.421 = 1.28× — "exceeds any single step's", NOT "dwarfs".
  ok(worst < earlyWorst * 0.75, 'hero/one-step-converges', `worst step TV ${earlyWorst.toFixed(3)} @40 iters → ${worst.toFixed(3)} @220`)
  ok(Math.abs(traj.tv - 0.421) < 0.03, 'hero/unrevealed-anchor', `T=30 TV ${traj.tv.toFixed(3)} — the opening's bound number is 0.421`)
  ok(worst < 0.35, 'hero/one-step-level', `per-context TVs [${stepTVs.map((v) => v.toFixed(3)).join(', ')}]`)
  ok(traj.tv > 0.4 && traj.tv > 1.15 * worst, 'hero/trajectory-lies', `T=30 TV ${traj.tv.toFixed(3)} = ${(traj.tv / worst).toFixed(2)}× worst step ${worst.toFixed(3)} — exceeds every single step`)
  ok(traj.offGraph > 0.15, 'hero/off-graph', `off-graph occupancy ${traj.offGraph.toFixed(3)}`)

  // the figure's own numbers must be the same numbers (same seed, same fit)
  const probe: HeroProbe = { iters: 0, hops: 0, histTV: -1, trajTV: -1, offGraph: -1, worstStep: -1 }
  const hero = createWalkHero(false, probe)
  drive(hero, 70, 0.5) // compile: ≤4 iters per call
  ok(probe.iters === HERO_ITERS, 'hero/fig-compiled', `${probe.iters}/${HERO_ITERS} gradient steps`)
  drive(hero, 180, 4) // sampling: ≤24 one-step draws per call
  ok(
    Math.abs(probe.trajTV - traj.tv) < 1e-9 && Math.abs(probe.offGraph - traj.offGraph) < 1e-9,
    'hero/fig-matches-oracle',
    `figure readout TV ${probe.trajTV.toFixed(3)} = check's own fit`,
  )
  ok(
    probe.hops > 3000 && probe.histTV < 0.32 && probe.histTV < probe.trajTV - 0.1,
    'hero/one-step-histograms-closer',
    `one-step hist TV ${probe.histTV.toFixed(3)} after ${probe.hops} draws — the T=30 readout sits at ${probe.trajTV.toFixed(3)}`,
  )
  const plain = render(hero, 'walk-hero')
  ok(inkCount(plain, PALETTE.meter) > 300, 'fig/hero-meter-ink', `${inkCount(plain, PALETTE.meter)} px of sampled-bar ink`)
  ok(inkCount(plain, PALETTE.ghost) > 80, 'fig/hero-ghost-ink', `${inkCount(plain, PALETTE.ghost)} px of ghost ink`)
  ok(inkCount(plain, PALETTE.ferro) > 30, 'fig/hero-off-ink', `${inkCount(plain, PALETTE.ferro)} px of off-graph ink`)
  ok(inkCount(plain, VISIT, 24) === 0, 'fig/hero-quiet', `no split-meter glow before the reveal (${inkCount(plain, VISIT, 24)} px)`)

  // F17 return: the revealed figure continues through the ladder's remaining
  // rungs (WalkLadder's exact calls) and converges to the HEALED kernel —
  // trajectory pane agreeing, per-step pane measurably WORSE than the
  // opening's kernel. Independent route: replicate rung 2 + rung 3 here.
  const pHealed = fit(freshParams(LADDER_NH, true), targetStationary(), LADDER_FD_ITERS, LADDER_FD_LR)
  fitReinforce(pHealed, 30, LADDER_RF_ITERS, LADDER_RF_LR)
  const healedTraj = trajectoryReport(pHealed, 30)
  const healedWorst = worstStepTV(pHealed)

  const driveRevealed = (pr: HeroProbe) => {
    const h = createWalkHero(true, pr)
    drive(h, 280, 0.5) // rungs: 220@≤4 + 220@≤4 + 800@≤8 iters per call
    drive(h, 180, 4) // sampling on the healed kernel
    return h
  }
  const probeR: HeroProbe = { iters: 0, hops: 0, histTV: -1, trajTV: -1, offGraph: -1, worstStep: -1 }
  const heroR = driveRevealed(probeR)
  ok(
    Math.abs(probeR.trajTV - healedTraj.tv) < 1e-9 && Math.abs(probeR.worstStep - healedWorst) < 1e-9,
    'hero/revealed-matches-oracle',
    `figure's final kernel TV ${probeR.trajTV.toFixed(3)}, worst step ${probeR.worstStep.toFixed(3)} = check's own rung-2+3 replicate`,
  )
  ok(probeR.trajTV < 0.2, 'hero/revealed-heals', `T=30 trajectory TV ${probeR.trajTV.toFixed(3)} < 0.2 (ladder's measured 0.144)`)
  ok(probeR.offGraph < 0.06, 'hero/revealed-off-graph-sliver', `off-graph occupancy ${probeR.offGraph.toFixed(3)} (the opening's was 0.190)`)
  ok(
    probeR.worstStep > worst * 1.15,
    'hero/revealed-per-step-worse',
    `healed worst step TV ${probeR.worstStep.toFixed(3)} vs the opening kernel's ${worst.toFixed(3)} — the trade is real`,
  )
  // Measured surprise (2026-08-11): the healed kernel's live one-step
  // marginal histogram sits CLOSER to the left pane than the opening's did
  // (exact visitation-weighted marginal TV 0.265 → 0.140), even though its
  // conditionals are far worse — REINFORCE warps them so the errors cancel
  // in aggregate. The histograms matching-while-the-table-is-warped is the
  // guarded fact; per-step damage is visible ONLY in the split-meter's KL.
  ok(
    probeR.hops > 3000 && probeR.histTV < 0.2 && probeR.histTV < probe.histTV,
    'hero/revealed-histograms-still-match',
    `one-step hist TV ${probeR.histTV.toFixed(3)} after ${probeR.hops} draws (unrevealed ${probe.histTV.toFixed(3)}) — the marginal cannot see the warp`,
  )
  {
    const kls = stepKLByContext(pHealed)
    const klsOpen = stepKLByContext(p)
    const qT = targetStationary()
    let klHealed = 0
    let klOpen = 0
    for (let i = 0; i < N_NODES; i++) {
      klHealed += qT[i] * kls[i]
      klOpen += qT[i] * klsOpen[i]
    }
    ok(
      klHealed > 3 * klOpen && klHealed > 1.5,
      'hero/revealed-kl-price',
      `q-weighted per-step KL ${klOpen.toFixed(3)} (opening) → ${klHealed.toFixed(3)} (healed) — the split-meter's left pane carries the price`,
    )
  }
  // determinism: a second revealed run must land on bit-identical numbers
  const probeR2: HeroProbe = { iters: 0, hops: 0, histTV: -1, trajTV: -1, offGraph: -1, worstStep: -1 }
  driveRevealed(probeR2)
  ok(
    probeR2.trajTV === probeR.trajTV && probeR2.worstStep === probeR.worstStep && probeR2.histTV === probeR.histTV && probeR2.hops === probeR.hops,
    'hero/revealed-deterministic',
    `second run: TV ${probeR2.trajTV.toFixed(3)}, hist TV ${probeR2.histTV.toFixed(3)} — bit-identical`,
  )
  const revealed = render(heroR, 'walk-hero-revealed')
  ok(inkCount(revealed, VISIT, 24) > 20, 'fig/hero-revealed-glow', `${inkCount(revealed, VISIT, 24)} px of visitation ink in the split-meter`)
  const strip = heroStripRect(W, H)
  const d = regionDiff(plain, revealed, Math.round(strip.x), Math.round(strip.y - 16), Math.round(strip.w), Math.round(strip.h + 16))
  ok(d > 500, 'fig/hero-reveal-differs', `${d} px changed in the strip between plain and revealed`)
}

// ---------------------------------------------------------------------------
// F2 — Neighborhood: 16 wires interior, deficient at truncated borders.
// ---------------------------------------------------------------------------

console.log('— F2 Neighborhood —')
{
  const GW = 13
  const GH = 13
  // independent recount of every cell's in-grid degree, straight from rules
  const bruteDegree = (x: number, y: number): number => {
    let d = 0
    for (const [a, b] of Z1_RULES) {
      for (const [dx, dy] of [
        [a, b],
        [-b, a],
        [-a, -b],
        [b, -a],
      ]) {
        if (x + dx >= 0 && x + dx < GW && y + dy >= 0 && y + dy < GH) d++
      }
    }
    return d
  }
  let allMatch = true
  let interior16 = true
  let deficientBorder = 0
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const wires = probeWires(GW, GH, x, y)
      const deg = wires.filter((wi) => wi.inGrid).length
      if (deg !== bruteDegree(x, y)) allMatch = false
      const interior = x >= 4 && x < GW - 4 && y >= 4 && y < GH - 4
      if (interior && deg !== 16) interior16 = false
      if (!interior && deg < 16) deficientBorder++
    }
  }
  ok(allMatch, 'nbhd/counts-vs-brute-force', `all ${GW * GH} cells agree with an independent offset loop`)
  ok(interior16, 'nbhd/interior-16', 'every interior cell has all 16 wires')
  ok(deficientBorder > 0, 'nbhd/border-truncated', `${deficientBorder} border-band cells lose wires (corner keeps ${bruteDegree(0, 0)})`)

  const probeC: NeighborhoodProbe = { degree: -1, perRule: [] }
  const center = render(createNeighborhood({ current: { cx: 6, cy: 6 } }, probeC), 'neighborhood-center', 300)
  ok(probeC.degree === 16, 'nbhd/fig-center-degree', `probe cell (6,6): degree ${probeC.degree}`)
  for (let r = 0; r < 4; r++) {
    const px = inkCount(center, RULE_INK[r], 30)
    ok(px > 60, `fig/nbhd-rule-${r}-ink`, `rule (${Z1_RULES[r][0]},${Z1_RULES[r][1]}) ink: ${px} px`)
  }
  const probeK: NeighborhoodProbe = { degree: -1, perRule: [] }
  const corner = render(createNeighborhood({ current: { cx: 0, cy: 0 } }, probeK), 'neighborhood-corner', 300)
  ok(probeK.degree === bruteDegree(0, 0) && probeK.degree < 16, 'nbhd/fig-corner-degree', `probe cell (0,0): degree ${probeK.degree} of 16`)
  ok(inkCount(corner, '#dc2626') > 20, 'fig/nbhd-deficit-ink', `${inkCount(corner, '#dc2626')} px of deficit ink at the corner`)
  const d = regionDiff(center, corner, 0, 0, W, 300)
  ok(d > 500, 'fig/nbhd-probe-moves', `${d} px changed moving the probe center → corner`)
}

// ---------------------------------------------------------------------------
// F3 — ParityToggle: 0 illegal wires under the real rules, >0 with (2,2).
// ---------------------------------------------------------------------------

console.log('— F3 ParityToggle —')
{
  const GW = 10
  const GH = 10
  const real = parityEdges(GW, GH, REAL_RULES)
  const even = parityEdges(GW, GH, EVEN_RULES)
  ok(real.illegal.length === 0, 'parity/real-clean', `${real.illegal.length} same-color wires of ${real.edges.length}`)
  ok(even.illegal.length > 0, 'parity/even-dies', `${even.illegal.length} same-color wires of ${even.edges.length} with (2,2)`)
  // independent recount: the illegal set must be exactly the (2,2) wires,
  // counted by a separate loop over that rule's rotations alone
  const seen = new Set<number>()
  let evenRuleEdges = 0
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      for (const [dx, dy] of [
        [2, 2],
        [-2, 2],
        [-2, -2],
        [2, -2],
      ]) {
        const tx = x + dx
        const ty = y + dy
        if (tx < 0 || tx >= GW || ty < 0 || ty >= GH) continue
        const i = y * GW + x
        const j = ty * GW + tx
        const key = Math.min(i, j) * GW * GH + Math.max(i, j)
        if (seen.has(key)) continue
        seen.add(key)
        evenRuleEdges++
      }
    }
  }
  ok(even.illegal.length === evenRuleEdges, 'parity/illegal-is-the-even-rule', `${even.illegal.length} illegal = ${evenRuleEdges} (2,2)-wires, counted independently`)
  const sameColor = even.illegal.every(([i, j]) => {
    const ci = ((i % GW) + Math.floor(i / GW)) & 1
    const cj = ((j % GW) + Math.floor(j / GW)) & 1
    return ci === cj
  })
  ok(sameColor, 'parity/illegal-verified', 'every flagged wire joins two same-color cells')

  const probeR: ParityProbe = { illegal: -1, total: -1 }
  const cReal = render(createParityToggle({ current: { even: false } }, probeR), 'parity-real', 300)
  const probeE: ParityProbe = { illegal: -1, total: -1 }
  const cEven = render(createParityToggle({ current: { even: true } }, probeE), 'parity-even', 300)
  ok(probeR.illegal === 0 && probeR.total === real.edges.length, 'parity/fig-real-count', `figure prints ${probeR.illegal} of ${probeR.total}`)
  ok(probeE.illegal === even.illegal.length, 'parity/fig-even-count', `figure prints ${probeE.illegal} same-color wires`)
  ok(inkCount(cReal, '#dc2626') < 30, 'fig/parity-real-no-glow', `${inkCount(cReal, '#dc2626')} px of illegal ink under real rules`)
  ok(inkCount(cEven, '#dc2626') > 400, 'fig/parity-even-glow', `${inkCount(cEven, '#dc2626')} px of illegal ink with (2,2)`)
  ok(inkCount(cEven, PALETTE.sUp) > 100 && inkCount(cEven, PALETTE.sDn) > 100, 'fig/parity-checkerboard', `${inkCount(cEven, PALETTE.sUp)}/${inkCount(cEven, PALETTE.sDn)} px of the two cell inks`)
}

// ---------------------------------------------------------------------------
// F5 — AsymmetricLoop: flux ≈ 0 symmetric, nonzero asymmetric; symmetric
// mode still sits on lib's exact Boltzmann law.
// ---------------------------------------------------------------------------

console.log('— F5 AsymmetricLoop —')
{
  const exactSym = exactRingFlux(ringWeights('symmetric'))
  const exactAsym = exactRingFlux(ringWeights('asymmetric'))
  ok(Math.abs(exactSym) < 1e-8, 'asym/exact-sym-zero', `exact stationary flux ${exactSym.toExponential(2)} symmetric`)
  ok(Math.abs(exactAsym) > 1e-3, 'asym/exact-asym-nonzero', `exact stationary flux ${exactAsym.toExponential(3)} asymmetric`)

  const probeS: AsymProbe = { updates: 0, flux: -1, hist: new Float64Array(0) }
  const symStepper = createAsymmetricLoop({ current: { mode: 'symmetric' } }, probeS)
  drive(symStepper, 20, 1)
  const probeA: AsymProbe = { updates: 0, flux: -1, hist: new Float64Array(0) }
  const asymStepper = createAsymmetricLoop({ current: { mode: 'asymmetric' } }, probeA)
  drive(asymStepper, 20, 1)
  ok(
    Math.abs(probeS.flux) < Math.abs(exactAsym) * 0.15,
    'asym/measured-sym-zero',
    `measured flux ${probeS.flux.toExponential(2)} over ${probeS.updates} updates`,
  )
  ok(
    Math.sign(probeA.flux) === Math.sign(exactAsym) && Math.abs(probeA.flux) > Math.abs(exactAsym) * 0.5,
    'asym/measured-asym-nonzero',
    `measured flux ${probeA.flux.toExponential(3)} vs exact ${exactAsym.toExponential(3)}`,
  )

  // the exact-conditional floor: symmetric mode is plain Glauber, so its
  // visit histogram must sit on the Boltzmann law lib enumerates
  const edges: Edge[] = Array.from({ length: RING_N }, (_, i) => ({ i, j: (i + 1) % RING_N, J: 0.6 }))
  const m = buildModel(RING_N, new Float64Array(RING_N), edges, RING_BETA)
  const exact = enumerate(m)
  let total = 0
  for (let i = 0; i < probeS.hist.length; i++) total += probeS.hist[i]
  const emp = new Float64Array(probeS.hist.length)
  for (let i = 0; i < emp.length; i++) emp[i] = probeS.hist[i] / total
  const tv = tvDistance(exact, emp)
  ok(tv < 0.03, 'asym/symmetric-floor', `symmetric histogram vs lib's exact law: TV ${tv.toFixed(4)} (${Math.round(total)} updates)`)

  const cSym = render(symStepper, 'asym-symmetric', 280)
  const cAsym = render(asymStepper, 'asym-asymmetric', 280)
  ok(inkCount(cAsym, PALETTE.meter) > 100, 'fig/asym-flux-ink', `${inkCount(cAsym, PALETTE.meter)} px of flux-meter ink`)
  ok(inkCount(cAsym, PALETTE.ferro) > 100 && inkCount(cAsym, PALETTE.anti) > 60, 'fig/asym-coupling-inks', `${inkCount(cAsym, PALETTE.ferro)} px J>0, ${inkCount(cAsym, PALETTE.anti)} px J<0`)
  ok(inkCount(cSym, PALETTE.anti) < 40, 'fig/sym-no-negative-ink', `${inkCount(cSym, PALETTE.anti)} px of J<0 ink in symmetric mode`)
  const d = regionDiff(cSym, cAsym, Math.round(W * 0.42), 40, Math.round(W * 0.55), 150)
  ok(d > 300, 'fig/asym-modes-differ', `${d} px changed between the two modes' readouts`)
}

// ---------------------------------------------------------------------------
// F6 — PartitionFigure: K̃(y|x) matches lib's subModel + enumerate route.
// ---------------------------------------------------------------------------

console.log('— F6 PartitionFigure —')
{
  const independentConditional = (roles: ArrayLike<number>, xVals: ArrayLike<number>): Float64Array => {
    const inp: number[] = []
    const hid: number[] = []
    const outs: number[] = [] // `out` trips bun's variance-modifier parsing
    for (let i = 0; i < PART_N; i++) {
      if (roles[i] === 0) inp.push(i)
      else if (roles[i] === 1) hid.push(i)
      else outs.push(i)
    }
    const m = partitionModel()
    const s = new Int8Array(PART_N)
    for (const i of inp) s[i] = xVals[i] >= 0 ? 1 : -1
    const sites = [...hid, ...outs]
    const pFree = enumerate(subModel(m, s, sites))
    const p = new Float64Array(1 << outs.length)
    for (let idx = 0; idx < pFree.length; idx++) p[idx >> hid.length] += pFree[idx]
    return p
  }

  const cases: Array<{ name: string; roles: number[]; x: number[] }> = [
    { name: 'default', roles: [0, 0, 1, 1, 2, 2], x: [1, 1, 1, 1, 1, 1] },
    { name: 'default-x-flipped', roles: [0, 0, 1, 1, 2, 2], x: [1, -1, 1, -1, 1, -1] },
    { name: 'interleaved', roles: [0, 1, 2, 0, 1, 2], x: [1, 1, -1, -1, 1, 1] },
    { name: 'three-outputs', roles: [1, 0, 0, 2, 2, 2], x: [1, -1, 1, 1, 1, 1] },
    { name: 'no-hidden', roles: [0, 0, 0, 0, 2, 2], x: [1, 1, -1, 1, 1, 1] },
  ]
  for (const c of cases) {
    const cond = kernelConditional(Uint8Array.from(c.roles), Int8Array.from(c.x))
    if (cond.kind !== 'ok') {
      ok(false, `part/${c.name}`, 'unexpected noOutput')
      continue
    }
    const indep = independentConditional(c.roles, c.x)
    let maxDiff = 0
    let sum = 0
    for (let y = 0; y < cond.p.length; y++) {
      maxDiff = Math.max(maxDiff, Math.abs(cond.p[y] - indep[y]))
      sum += cond.p[y]
    }
    ok(
      maxDiff < 1e-10 && Math.abs(sum - 1) < 1e-12,
      `part/${c.name}`,
      `max |K̃ − subModel route| = ${maxDiff.toExponential(2)} over ${cond.p.length} outputs, Σ = ${sum.toFixed(12)}`,
    )
  }
  const none = kernelConditional(Uint8Array.from([0, 0, 1, 1, 1, 0]), Int8Array.from([1, 1, 1, 1, 1, 1]))
  ok(none.kind === 'noOutput', 'part/no-output-typed', 'zero output spins is a typed case, not a crash')

  // roles knob and x knob both move the readout; every role ink present
  const shared = { current: freshPartitionShared() }
  const probe: PartitionProbe = { nOut: -1, p: new Float64Array(0) }
  const stepper = createPartitionFigure(shared, probe)
  const c0 = render(stepper, 'partition-default', 320)
  ok(probe.nOut === 2 && probe.p.length === 4, 'part/fig-default', `figure reads ${probe.p.length} outputs: [${Array.from(probe.p).map((v) => v.toFixed(3)).join(', ')}]`)
  ok(inkCount(c0, PALETTE.held) > 150, 'fig/part-input-ink', `${inkCount(c0, PALETTE.held)} px of input green`)
  ok(inkCount(c0, HID_INK) > 150, 'fig/part-hidden-ink', `${inkCount(c0, HID_INK)} px of hidden pink`)
  ok(inkCount(c0, PALETTE.meter) > 300, 'fig/part-output-ink', `${inkCount(c0, PALETTE.meter)} px of output/readout violet`)
  shared.current.xVals = Int8Array.from([1, -1, 1, -1, 1, -1])
  const c1 = render(stepper, 'partition-x-flipped', 320)
  const dx = regionDiff(c0, c1, Math.round(W * 0.42), 46, Math.round(W * 0.52), 200)
  ok(dx > 100, 'fig/part-x-moves-bars', `${dx} px changed in the readout when x flipped`)
  shared.current.roles = Uint8Array.from([1, 0, 0, 2, 2, 2])
  const c2 = render(stepper, 'partition-reroled', 320)
  ok(probe.nOut === 3 && probe.p.length === 8, 'part/fig-reroled', `tap-cycled roles: ${probe.p.length} output columns`)
  const dr = regionDiff(c1, c2, Math.round(W * 0.42), 46, Math.round(W * 0.52), 200)
  ok(dr > 100, 'fig/part-roles-move-bars', `${dr} px changed re-partitioning the spins`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
