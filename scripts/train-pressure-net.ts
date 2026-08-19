// Trains the pressure warm-start network and writes src/sims/learned/weights.ts.
//
//   bun run scripts/train-pressure-net.ts
//
// Everything here is first-party: the data comes from the lesson-01 CPU solver,
// the targets come from conjugate gradients on the same matrix the browser will
// use, and the optimizer is ~120 lines of Adam below. There is no framework and
// no downloaded checkpoint, which is the point — the article claims a trained
// model and the repo has to be able to show its work end to end.
//
// AGENTS.md, honesty rules: "no model is labeled as trained unless the shipped
// weights and training manifest exist in the repository."

import { writeFileSync } from 'node:fs'
import {
  CH,
  CX,
  CY,
  IN_CH,
  NX,
  NY,
  SCALE,
  makeActivations,
  paramCount,
  propose,
  solidFraction,
  zeroWeights,
  type NetWeights,
} from '../src/sims/learned/net'
import { relResidual, rms, solveCG, solveToTolerance, sweep, type Grid } from '../src/sims/learned/poisson'
import { HELD_OUT_CASES, OOD_CASES, TRAIN_CASES, sampleCase, type CaseFields } from '../src/sims/learned/cases'

const TOL = 1e-3 // the residual gate every figure in the article uses
const SNAPSHOTS_PER_CASE = 40
const SNAPSHOT_EVERY = 6
const STEPS = 8000
const BATCH = 12
const LR = 4e-3

// ------------------------------------------------------------ random source

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260820)
function gauss(): number {
  const u = Math.max(rnd(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
}

// -------------------------------------------------------------- conv adjoint

/** dX, dW, dB for a 3×3 zero-padded conv. Mirrors `conv2d` in net.ts exactly. */
function conv2dBackward(
  x: Float32Array,
  w: Float32Array,
  dOut: Float32Array,
  inCh: number,
  outCh: number,
  dX: Float32Array | null,
  dW: Float32Array,
  dB: Float32Array,
): void {
  if (dX) dX.fill(0)
  for (let oc = 0; oc < outCh; oc++) {
    const obase = oc * CX * CY
    for (let cj = 0; cj < CY; cj++) {
      for (let ci = 0; ci < CX; ci++) {
        const go = dOut[obase + ci + cj * CX]
        if (go === 0) continue
        dB[oc] += go
        for (let ic = 0; ic < inCh; ic++) {
          const ibase = ic * CX * CY
          const wbase = (oc * inCh + ic) * 9
          for (let dy = -1; dy <= 1; dy++) {
            const jj = cj + dy
            if (jj < 0 || jj >= CY) continue
            for (let dx = -1; dx <= 1; dx++) {
              const ii = ci + dx
              if (ii < 0 || ii >= CX) continue
              const wi = wbase + (dy + 1) * 3 + (dx + 1)
              dW[wi] += go * x[ibase + ii + jj * CX]
              if (dX) dX[ibase + ii + jj * CX] += go * w[wi]
            }
          }
        }
      }
    }
  }
}

/** Adjoint of `prolong`: scatter fine-grid gradient back onto the coarse samples. */
function prolongBackward(dFine: Float32Array, dCoarse: Float32Array): void {
  dCoarse.fill(0)
  const half = (8 - 1) / 2
  const POOL = NX / CX
  for (let j = 0; j < NY; j++) {
    const y = Math.min(Math.max((j - half) / POOL, 0), CY - 1)
    const j0 = Math.min(Math.floor(y), CY - 1)
    const j1 = Math.min(j0 + 1, CY - 1)
    const ty = y - j0
    for (let i = 0; i < NX; i++) {
      const g = dFine[i + j * NX]
      if (g === 0) continue
      const x = Math.min(Math.max((i - half) / POOL, 0), CX - 1)
      const i0 = Math.min(Math.floor(x), CX - 1)
      const i1 = Math.min(i0 + 1, CX - 1)
      const tx = x - i0
      dCoarse[i0 + j0 * CX] += g * (1 - tx) * (1 - ty)
      dCoarse[i1 + j0 * CX] += g * tx * (1 - ty)
      dCoarse[i0 + j1 * CX] += g * (1 - tx) * ty
      dCoarse[i1 + j1 * CX] += g * tx * ty
    }
  }
}

// ---------------------------------------------------------------- the model

function initWeights(): NetWeights {
  const w = zeroWeights()
  const fill = (a: Float32Array, fanIn: number) => {
    const s = Math.sqrt(2 / fanIn)
    for (let k = 0; k < a.length; k++) a[k] = gauss() * s
  }
  fill(w.w1, 9 * IN_CH)
  fill(w.w2, 9 * CH)
  fill(w.w3, 9 * CH)
  for (let k = 0; k < w.w3.length; k++) w.w3[k] *= 0.3 // start quiet: a small proposal beats a wild one
  return w
}

interface Sample {
  grid: Grid
  b: Float32Array
  solidCoarse: Float32Array
  /** p* / (RMS(b) · h²) — the normalized field the network is asked to produce. */
  target: Float32Array
  mask: Float32Array // 1 where the loss is counted
  maskCount: number
}

function makeSample(f: CaseFields): Sample {
  const sc = new Float32Array(CX * CY)
  solidFraction(f.solid, sc)
  const pStar = new Float32Array(NX * NY)
  // 1e-5 is a hundred times tighter than the article's 1e-3 gate and is where
  // float32 conjugate gradients stagnate on this grid — asking for 1e-8 asks the
  // arithmetic for digits it does not have.
  const rep = solveCG(f.grid, pStar, f.b, 1e-5, 4000)
  if (!rep.hit) throw new Error(`reference solve failed: residual ${rep.residual}`)
  const s = rms(f.grid, f.b)
  const target = new Float32Array(NX * NY)
  const mask = new Float32Array(NX * NY)
  let count = 0
  for (let j = 1; j < NY - 1; j++) {
    for (let i = 1; i < NX - 1; i++) {
      const k = i + j * NX
      if (f.solid[k]) continue
      target[k] = pStar[k] / (s * SCALE)
      mask[k] = 1
      count++
    }
  }
  return { grid: f.grid, b: f.b, solidCoarse: sc, target, mask, maskCount: count }
}

// ------------------------------------------------------------ forward+loss

const act = makeActivations()
const p0 = new Float32Array(NX * NY)
const dFine = new Float32Array(NX * NY)
const dOut = new Float32Array(CX * CY)
const dA2 = new Float32Array(CH * CX * CY)
const dZ2 = new Float32Array(CH * CX * CY)
const dA1 = new Float32Array(CH * CX * CY)
const dZ1 = new Float32Array(CH * CX * CY)

function lossAndGrad(w: NetWeights, s: Sample, g: NetWeights | null): number {
  propose(s.grid, w, s.b, s.solidCoarse, p0, act)
  let loss = 0
  dFine.fill(0)
  const inv = 1 / s.maskCount
  for (let k = 0; k < NX * NY; k++) {
    if (s.mask[k] === 0) continue
    const e = act.fine[k] - s.target[k]
    loss += e * e * inv
    dFine[k] = 2 * e * inv
  }
  if (!g) return loss

  prolongBackward(dFine, dOut)
  conv2dBackward(act.a2, w.w3, dOut, CH, 1, dA2, g.w3, g.b3)
  for (let k = 0; k < dZ2.length; k++) dZ2[k] = dA2[k] * (1 - act.a2[k] * act.a2[k])
  conv2dBackward(act.a1, w.w2, dZ2, CH, CH, dA1, g.w2, g.b2)
  for (let k = 0; k < dZ1.length; k++) dZ1[k] = dA1[k] * (1 - act.a1[k] * act.a1[k])
  conv2dBackward(act.inp, w.w1, dZ1, IN_CH, CH, null, g.w1, g.b1)
  return loss
}

// ------------------------------------------------------------------- Adam

type Key = keyof NetWeights
const KEYS: Key[] = ['w1', 'b1', 'w2', 'b2', 'w3', 'b3']

function zeroLike(w: NetWeights): NetWeights {
  const z = zeroWeights()
  for (const k of KEYS) z[k] = new Float32Array(w[k].length)
  return z
}

// ----------------------------------------------------------------- measure

function sweepsFor(f: CaseFields, w: NetWeights | null, cg: boolean): number {
  const sc = new Float32Array(CX * CY)
  solidFraction(f.solid, sc)
  const p = new Float32Array(NX * NY)
  if (w) propose(f.grid, w, f.b, sc, p, makeActivations())
  const rep = cg ? solveCG(f.grid, p, f.b, TOL, 3000) : solveToTolerance(f.grid, p, f.b, TOL, 6000)
  if (!rep.hit) throw new Error('gate never opened')
  return rep.sweeps
}

// -------------------------------------------------------------------- main

console.log(`building training data from ${TRAIN_CASES.length} cases…`)
const train: Sample[] = []
for (const spec of TRAIN_CASES) {
  for (const f of sampleCase(spec, SNAPSHOTS_PER_CASE, SNAPSHOT_EVERY)) train.push(makeSample(f))
  console.log(`  ${spec.id} ${spec.label}: ${train.length} samples so far`)
}

const heldOut: CaseFields[] = []
for (const spec of HELD_OUT_CASES) heldOut.push(...sampleCase(spec, 8, 9))
const ood: CaseFields[] = []
for (const spec of OOD_CASES) ood.push(...sampleCase(spec, 6, 9))
console.log(`held-out ${heldOut.length}, out-of-distribution ${ood.length}`)

// ---- gradient check before trusting a single step of training
{
  const w = initWeights()
  const g = zeroLike(w)
  const base = lossAndGrad(w, train[0], g)
  let worst = 0
  for (const key of KEYS) {
    for (let t = 0; t < 3; t++) {
      const i = Math.floor(rnd() * w[key].length)
      // h = 10⁻³: the forward pass keeps activations in Float32Array, so a
      // smaller step drowns the difference quotient in rounding noise rather
      // than sharpening it.
      const h = 1e-3
      const keep = w[key][i]
      w[key][i] = keep + h
      const lp = lossAndGrad(w, train[0], null)
      w[key][i] = keep - h
      const lm = lossAndGrad(w, train[0], null)
      w[key][i] = keep
      const num = (lp - lm) / (2 * h)
      const ana = g[key][i]
      const rel = Math.abs(num - ana) / Math.max(1e-9, Math.abs(num) + Math.abs(ana))
      if (rel > worst) worst = rel
      if (rel > 1e-3) console.log(`    ${key}[${i}] num ${num.toExponential(4)} ana ${ana.toExponential(4)} rel ${rel.toExponential(2)}`)
    }
  }
  console.log(`gradient check: worst relative error ${worst.toExponential(2)} (loss ${base.toExponential(3)})`)
  if (worst > 2e-3) throw new Error('analytic gradient disagrees with finite differences')
}

const w = initWeights()
const m = zeroLike(w)
const v = zeroLike(w)
const grad = zeroLike(w)
let lastLoss = 0
console.log(`training ${paramCount()} parameters for ${STEPS} steps…`)
for (let step = 1; step <= STEPS; step++) {
  for (const k of KEYS) grad[k].fill(0)
  let loss = 0
  for (let n = 0; n < BATCH; n++) {
    loss += lossAndGrad(w, train[Math.floor(rnd() * train.length)], grad) / BATCH
  }
  const bc1 = 1 - Math.pow(0.9, step)
  const bc2 = 1 - Math.pow(0.999, step)
  // linear warm-up, then cosine decay to 5% — the last few hundred steps are
  // what fix the weights that actually ship, so the run must not end mid-bounce.
  const lr = LR * Math.min(1, step / 200) * (0.05 + 0.95 * 0.5 * (1 + Math.cos((Math.PI * step) / STEPS)))
  for (const k of KEYS) {
    const p = w[k]
    const gk = grad[k]
    const mk = m[k]
    const vk = v[k]
    for (let i = 0; i < p.length; i++) {
      const gi = gk[i] / BATCH
      mk[i] = 0.9 * mk[i] + 0.1 * gi
      vk[i] = 0.999 * vk[i] + 0.001 * gi * gi
      p[i] -= (lr * (mk[i] / bc1)) / (Math.sqrt(vk[i] / bc2) + 1e-8)
    }
  }
  lastLoss = loss
  if (step % 400 === 0 || step === 1) console.log(`  step ${step}  loss ${loss.toExponential(3)}`)
}

// ------------------------------------------------------------- evaluation

const BUDGET = 40 // the sweeps the lesson-01 solver actually spends per step

function report(name: string, set: CaseFields[]) {
  let cold = 0
  let warm = 0
  let cgCold = 0
  let cgWarm = 0
  let proposalRes = 0
  let proposalErr = 0
  let budgetCold = 0
  let budgetWarm = 0
  for (const f of set) {
    cold += sweepsFor(f, null, false)
    warm += sweepsFor(f, w, false)
    cgCold += sweepsFor(f, null, true)
    cgWarm += sweepsFor(f, w, true)

    const sc = new Float32Array(CX * CY)
    solidFraction(f.solid, sc)
    const p = new Float32Array(NX * NY)
    propose(f.grid, w, f.b, sc, p, makeActivations())
    proposalRes += relResidual(f.grid, p, f.b)

    // How wrong is the proposal as a FIELD, versus starting from zero? A cold
    // start has relative error 1 by definition, so this number is directly
    // "the fraction of the answer the network already knew".
    const pStar = new Float32Array(NX * NY)
    solveCG(f.grid, pStar, f.b, 1e-5, 4000)
    let num = 0
    let den = 0
    for (let k = 0; k < NX * NY; k++) {
      if (f.solid[k]) continue
      num += (p[k] - pStar[k]) ** 2
      den += pStar[k] ** 2
    }
    proposalErr += Math.sqrt(num / den)

    // And the comparison a fixed-budget solver actually faces: same 40 sweeps,
    // two starting points, which answer is closer?
    const a = new Float32Array(NX * NY)
    for (let n = 0; n < BUDGET; n++) sweep(f.grid, a, f.b)
    budgetCold += relResidual(f.grid, a, f.b)
    const c = new Float32Array(NX * NY)
    propose(f.grid, w, f.b, sc, c, makeActivations())
    for (let n = 0; n < BUDGET; n++) sweep(f.grid, c, f.b)
    budgetWarm += relResidual(f.grid, c, f.b)
  }
  const n = set.length
  const r = {
    name,
    n,
    gsCold: cold / n,
    gsWarm: warm / n,
    cgCold: cgCold / n,
    cgWarm: cgWarm / n,
    proposalResidual: proposalRes / n,
    proposalFieldError: proposalErr / n,
    residualAt40Cold: budgetCold / n,
    residualAt40Warm: budgetWarm / n,
  }
  console.log(
    `${name.padEnd(22)} GS ${r.gsCold.toFixed(0)} → ${r.gsWarm.toFixed(0)} (${(r.gsCold / r.gsWarm).toFixed(2)}×)   ` +
      `CG ${r.cgCold.toFixed(0)} → ${r.cgWarm.toFixed(0)} (${(r.cgCold / r.cgWarm).toFixed(2)}×)   ` +
      `proposal: residual ${r.proposalResidual.toFixed(2)}, field error ${r.proposalFieldError.toFixed(3)}   ` +
      `@40 sweeps ${r.residualAt40Cold.toFixed(3)} → ${r.residualAt40Warm.toFixed(3)}`,
  )
  return r
}

console.log('\n--- sweeps to ‖b − Ap‖/‖b‖ < ' + TOL + ' ---')
const rTrain = report('training family', train.slice(0, 24).map((s) => ({ grid: s.grid, b: s.b, solid: s.grid.solid })))
const rHeld = report('held out', heldOut)
const rOod = report('out of distribution', ood)

// ------------------------------------------------------------------ export

const fmt = (a: Float32Array) => `new Float32Array([${Array.from(a).map((x) => Number(x.toFixed(6))).join(',')}])`
const manifest = {
  trainedAt: new Date().toISOString().slice(0, 10),
  params: paramCount(),
  samples: train.length,
  cases: TRAIN_CASES.map((c) => c.id),
  steps: STEPS,
  batch: BATCH,
  finalLoss: Number(lastLoss.toExponential(4)),
  tol: TOL,
  train: rTrain,
  heldOut: rHeld,
  ood: rOod,
}

writeFileSync(
  'src/sims/learned/weights.ts',
  `// GENERATED by scripts/train-pressure-net.ts — do not edit by hand.
//
// ${manifest.params} trained parameters and the manifest of the run that produced them.
// Retrain with:  bun run scripts/train-pressure-net.ts
//
// The numbers in MANIFEST are measurements, not aspirations: they are what this
// exact weight vector scored on held-out and out-of-distribution divergence
// fields at the moment it was written, and the figures in the lesson recompute
// them live in the reader's browser.

import type { NetWeights } from './net'

export const WEIGHTS: NetWeights = {
  w1: ${fmt(w.w1)},
  b1: ${fmt(w.b1)},
  w2: ${fmt(w.w2)},
  b2: ${fmt(w.b2)},
  w3: ${fmt(w.w3)},
  b3: ${fmt(w.b3)},
}

export const MANIFEST = ${JSON.stringify(manifest, null, 2)} as const
`,
)
console.log('\nwrote src/sims/learned/weights.ts')
