// Trains the flux-correction network for the advection seam and writes
// src/sims/learned/advect_weights.ts.
//
//   bun run scripts/train-advect-net.ts
//
// Same contract as train-pressure-net.ts: first-party everything. The data is
// the lesson's own semi-Lagrangian scheme run at 96×64 and restricted to
// 24×16; the target is the restricted fine state one step later; the optimizer
// is the same ~150 lines of Adam; the analytic gradient is checked against
// finite differences before the first step is taken.
//
// TWO models come out of this script, same architecture, same data, same
// optimizer — the only difference is what the loss can see:
//
//   one-step   —  corrected state vs restricted fine, one step ahead. This is
//                 the obvious loss, its training score is spectacular, and its
//                 autonomous rollout detonates (measured below). It ships
//                 anyway, because the failure is the lesson.
//   in-the-loop — the same MSE summed over a K-step rollout in which the
//                 network rides its own outputs, with gradients carried back
//                 through the solver itself (the SL step is a fixed gather, so
//                 its adjoint is exact — see makeSLOp). This is Um et al.'s
//                 solver-in-the-loop move, at demonstration scale.
//
// Every rollout number in the manifests is from autonomous rollouts, never
// from one-step scores — one-step scores are exactly the numbers this article
// refuses to trust on their own.

import { writeFileSync } from 'node:fs'
import {
  ADVECT_HELD_OUT,
  ADVECT_OOD,
  ADVECT_TRAIN,
  A_CH,
  A_IN,
  CNX,
  CNY,
  DT,
  FLUX_SCALE,
  FNX,
  FNY,
  advectCorrection,
  advectParamCount,
  applySL,
  applySLAdjoint,
  makeSLOp,
  makeAdvectActs,
  makeSwirl,
  mulberry32,
  restrictTo,
  relErr,
  sampleVelocity,
  seedPattern,
  slStep,
  zeroAdvectWeights,
  type AdvectCase,
  type AdvectWeights,
} from '../src/sims/learned/advect'

const STEPS = 6000
const BATCH = 16
const LR = 3e-3
const T_TRAIN = 240 // coarse steps recorded per training case
const T_EVAL = 300 // rollout horizon for the honest evaluation

const rnd = mulberry32(20260821)
function gauss(): number {
  const u = Math.max(rnd(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
}

// ------------------------------------------------------------ trajectories

interface Trajectory {
  states: Float32Array[] // restricted fine dye at every step, 0..T
  u: Float32Array // coarse velocity
  v: Float32Array
  op: import('../src/sims/learned/advect').SLOp // the frozen coarse SL step
}

function runFine(spec: AdvectCase, T: number): Trajectory {
  const sw = makeSwirl(spec.seed, spec.peak, spec.nVortices)
  const fineVel = sampleVelocity(sw, FNX, FNY)
  const coarseVel = sampleVelocity(sw, CNX, CNY)
  let fine = new Float32Array(FNX * FNY)
  let next = new Float32Array(FNX * FNY)
  seedPattern(spec.pattern, FNX, FNY, fine)
  const states: Float32Array[] = []
  const first = new Float32Array(CNX * CNY)
  restrictTo(fine, CNX, CNY, first)
  states.push(first)
  for (let t = 0; t < T; t++) {
    slStep(FNX, FNY, fineVel.u, fineVel.v, DT, fine, next)
    ;[fine, next] = [next, fine]
    const s = new Float32Array(CNX * CNY)
    restrictTo(fine, CNX, CNY, s)
    states.push(s)
  }
  return { states, u: coarseVel.u, v: coarseVel.v, op: makeSLOp(CNX, CNY, coarseVel.u, coarseVel.v, DT) }
}

interface Sample {
  post: Float32Array // SL_c applied to the true coarse state at t
  target: Float32Array // true coarse state at t+1
  u: Float32Array
  v: Float32Array
}

function makeSamples(traj: Trajectory): Sample[] {
  const out: Sample[] = []
  for (let t = 0; t < traj.states.length - 1; t++) {
    const post = new Float32Array(CNX * CNY)
    slStep(CNX, CNY, traj.u, traj.v, DT, traj.states[t], post)
    out.push({ post, target: traj.states[t + 1], u: traj.u, v: traj.v })
  }
  return out
}

// ------------------------------------------------------------ conv adjoint

function convCBackward(
  x: Float32Array,
  w: Float32Array,
  dOut: Float32Array,
  inCh: number,
  outCh: number,
  dX: Float32Array | null,
  dW: Float32Array,
  dB: Float32Array,
): void {
  const n = CNX * CNY
  if (dX) dX.fill(0)
  for (let oc = 0; oc < outCh; oc++) {
    const obase = oc * n
    for (let cj = 0; cj < CNY; cj++) {
      for (let ci = 0; ci < CNX; ci++) {
        const go = dOut[obase + ci + cj * CNX]
        if (go === 0) continue
        dB[oc] += go
        for (let ic = 0; ic < inCh; ic++) {
          const ibase = ic * n
          const wbase = (oc * inCh + ic) * 9
          for (let dy = -1; dy <= 1; dy++) {
            const jj = cj + dy
            if (jj < 0 || jj >= CNY) continue
            for (let dx = -1; dx <= 1; dx++) {
              const ii = ci + dx
              if (ii < 0 || ii >= CNX) continue
              const wi = wbase + (dy + 1) * 3 + (dx + 1)
              dW[wi] += go * x[ibase + ii + jj * CNX]
              if (dX) dX[ibase + ii + jj * CNX] += go * w[wi]
            }
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------- fwd+loss

const act = makeAdvectActs()
const corr = new Float32Array(CNX * CNY)
const gCorr = new Float32Array(CNX * CNY)
const dFlux = new Float32Array(2 * CNX * CNY)
const dZf = new Float32Array(2 * CNX * CNY)
const dA2 = new Float32Array(A_CH * CNX * CNY)
const dZ2 = new Float32Array(A_CH * CNX * CNY)
const dA1 = new Float32Array(A_CH * CNX * CNY)
const dZ1 = new Float32Array(A_CH * CNX * CNY)

function lossAndGrad(w: AdvectWeights, s: Sample, g: AdvectWeights | null): number {
  const n = CNX * CNY
  advectCorrection(w, s.post, s.u, s.v, corr, act)
  let loss = 0
  const inv = 1 / n
  for (let k = 0; k < n; k++) {
    const e = s.post[k] + corr[k] - s.target[k]
    loss += e * e * inv
    gCorr[k] = 2 * e * inv
  }
  if (!g) return loss

  // adjoint of the flux divergence: Fx[k] enters corr[k] with −scale and
  // corr[k+1] with +scale (interior faces only; wall faces carry no gradient)
  dFlux.fill(0)
  for (let j = 0; j < CNY; j++) {
    for (let i = 0; i < CNX - 1; i++) {
      const k = i + j * CNX
      dFlux[k] = act.scale * (gCorr[k + 1] - gCorr[k])
    }
  }
  for (let j = 0; j < CNY - 1; j++) {
    for (let i = 0; i < CNX; i++) {
      const k = i + j * CNX
      dFlux[n + k] = act.scale * (gCorr[k + CNX] - gCorr[k])
    }
  }
  for (let k = 0; k < dZf.length; k++) dZf[k] = dFlux[k] * (1 - act.flux[k] * act.flux[k])
  convCBackward(act.a2, w.w3, dZf, A_CH, 2, dA2, g.w3, g.b3)
  for (let k = 0; k < dZ2.length; k++) dZ2[k] = dA2[k] * (1 - act.a2[k] * act.a2[k])
  convCBackward(act.a1, w.w2, dZ2, A_CH, A_CH, dA1, g.w2, g.b2)
  for (let k = 0; k < dZ1.length; k++) dZ1[k] = dA1[k] * (1 - act.a1[k] * act.a1[k])
  convCBackward(act.inp, w.w1, dZ1, A_IN, A_CH, null, g.w1, g.b1)
  return loss
}

// -------------------------------------------------------------------- Adam

type Key = keyof AdvectWeights
const KEYS: Key[] = ['w1', 'b1', 'w2', 'b2', 'w3', 'b3']

function zeroLike(): AdvectWeights {
  return zeroAdvectWeights()
}

function initWeights(): AdvectWeights {
  const w = zeroAdvectWeights()
  const fill = (a: Float32Array, fanIn: number, gain = 1) => {
    const s = gain * Math.sqrt(2 / fanIn)
    for (let k = 0; k < a.length; k++) a[k] = gauss() * s
  }
  fill(w.w1, 9 * A_IN)
  fill(w.w2, 9 * A_CH)
  fill(w.w3, 9 * A_CH, 0.2) // start with a quiet correction
  return w
}

// ----------------------------------------------------------------- rollout

/** Autonomous coarse rollout; returns relative error vs the true coarse path at each step. */
function rollout(
  traj: Trajectory,
  w: AdvectWeights | null,
  strength: number,
  T: number,
): number[] {
  let dye = Float32Array.from(traj.states[0])
  let post = new Float32Array(CNX * CNY)
  const errs: number[] = []
  const a = makeAdvectActs()
  const c = new Float32Array(CNX * CNY)
  for (let t = 1; t <= T; t++) {
    slStep(CNX, CNY, traj.u, traj.v, DT, dye, post)
    if (w) {
      advectCorrection(w, post, traj.u, traj.v, c, a)
      for (let k = 0; k < post.length; k++) post[k] += strength * c[k]
    }
    ;[dye, post] = [post, dye]
    errs.push(relErr(dye, traj.states[Math.min(t, traj.states.length - 1)]))
  }
  return errs
}

/** Plain SL at a different coarsening, errors measured on ITS grid vs restricted fine. */
function plainAtFactor(spec: AdvectCase, factor: number, T: number): number[] {
  const nx = FNX / factor
  const ny = FNY / factor
  const sw = makeSwirl(spec.seed, spec.peak, spec.nVortices)
  const fineVel = sampleVelocity(sw, FNX, FNY)
  const vel = sampleVelocity(sw, nx, ny)
  let fine = new Float32Array(FNX * FNY)
  let fnext = new Float32Array(FNX * FNY)
  seedPattern(spec.pattern, FNX, FNY, fine)
  let dye = new Float32Array(nx * ny)
  restrictTo(fine, nx, ny, dye)
  let next = new Float32Array(nx * ny)
  const ref = new Float32Array(nx * ny)
  const errs: number[] = []
  for (let t = 1; t <= T; t++) {
    slStep(FNX, FNY, fineVel.u, fineVel.v, DT, fine, fnext)
    ;[fine, fnext] = [fnext, fine]
    slStep(nx, ny, vel.u, vel.v, DT, dye, next)
    ;[dye, next] = [next, dye]
    restrictTo(fine, nx, ny, ref)
    errs.push(relErr(dye, ref))
  }
  return errs
}

// -------------------------------------------------- backward through the net
//
// Exact gradient of the correction with respect to the state it was computed
// from, RMS normalization included. Needed only by the in-the-loop phase; the
// one-step phase never differentiates through its own input.

const dA2b = new Float32Array(A_CH * CNX * CNY)
const dZ2b = new Float32Array(A_CH * CNX * CNY)
const dA1b = new Float32Array(A_CH * CNX * CNY)
const dZ1b = new Float32Array(A_CH * CNX * CNY)
const dInpB = new Float32Array(A_IN * CNX * CNY)
const dFluxB = new Float32Array(2 * CNX * CNY)
const dZfB = new Float32Array(2 * CNX * CNY)

import type { AdvectActs } from '../src/sims/learned/advect'

function correctionBackward(
  w: AdvectWeights,
  post: Float32Array,
  act: AdvectActs,
  corr: Float32Array,
  gC: Float32Array,
  g: AdvectWeights,
  dPost: Float32Array, // ACCUMULATED into
): void {
  const n = CNX * CNY
  const S = act.scale
  if (S === 0) return
  const s = S / FLUX_SCALE

  // c = A·S with A = −div F  ⇒  dL/dS = Σ g·c / S, dL/dA = g·S
  let dS = 0
  for (let k = 0; k < n; k++) dS += gC[k] * corr[k]
  dS /= S

  dFluxB.fill(0)
  for (let j = 0; j < CNY; j++) {
    for (let i = 0; i < CNX - 1; i++) {
      const k = i + j * CNX
      dFluxB[k] = S * (gC[k + 1] - gC[k])
    }
  }
  for (let j = 0; j < CNY - 1; j++) {
    for (let i = 0; i < CNX; i++) {
      const k = i + j * CNX
      dFluxB[n + k] = S * (gC[k + CNX] - gC[k])
    }
  }
  for (let k = 0; k < dZfB.length; k++) dZfB[k] = dFluxB[k] * (1 - act.flux[k] * act.flux[k])
  convCBackward(act.a2, w.w3, dZfB, A_CH, 2, dA2b, g.w3, g.b3)
  for (let k = 0; k < dZ2b.length; k++) dZ2b[k] = dA2b[k] * (1 - act.a2[k] * act.a2[k])
  convCBackward(act.a1, w.w2, dZ2b, A_CH, A_CH, dA1b, g.w2, g.b2)
  for (let k = 0; k < dZ1b.length; k++) dZ1b[k] = dA1b[k] * (1 - act.a1[k] * act.a1[k])
  convCBackward(act.inp, w.w1, dZ1b, A_IN, A_CH, dInpB, g.w1, g.b1)

  // inp₀ = post/s and S = s·FS, with ds/dpost_k = post_k/(n·s):
  //   dPost_k = dInp₀_k/s + (−⟨dInp₀,post⟩/s² + dS·FS) · post_k/(n·s)
  let dot = 0
  for (let k = 0; k < n; k++) dot += dInpB[k] * post[k]
  const common = (-dot / (s * s) + dS * FLUX_SCALE) / (n * s)
  for (let k = 0; k < n; k++) dPost[k] += dInpB[k] / s + common * post[k]
}

// ------------------------------------------------- the in-the-loop objective

// K = 6 was measured insufficient: the trained model still amplified its own
// error by ~2× every 60 steps — an order of magnitude slower than the one-step
// model, but the same death. Sixteen steps of visible rollout, reached by
// curriculum, plus a small perturbation of each window's start state (so the
// network must CONTRACT errors it did not make) is the recipe that stopped the
// corrected lane detonating inside the figures' horizon.
const K_MAX = 16

interface StepTape {
  post: Float32Array
  corr: Float32Array
  act: AdvectActs
}

function makeTape(): StepTape[] {
  return Array.from({ length: K_MAX }, () => ({
    post: new Float32Array(CNX * CNY),
    corr: new Float32Array(CNX * CNY),
    act: makeAdvectActs(),
  }))
}

const tape = makeTape()
const dyeBuf: Float32Array[] = Array.from({ length: K_MAX + 1 }, () => new Float32Array(CNX * CNY))
const gNext = new Float32Array(CNX * CNY)
const gPost = new Float32Array(CNX * CNY)

/**
 * L = (1/K) Σₜ MSE(dye_t, true_t) over an autonomous K-step window starting at
 * `t0`, gradients carried backward through both the network AND the solver.
 * `noise` perturbs the window's start state (σ relative to its RMS); the
 * targets stay the truth, so the only way to score is to pull perturbed
 * states back in.
 */
function unrolledLossAndGrad(
  w: AdvectWeights,
  traj: Trajectory,
  t0: number,
  g: AdvectWeights | null,
  K = K_MAX,
  noise = 0,
): number {
  const n = CNX * CNY
  dyeBuf[0].set(traj.states[t0])
  if (noise > 0) {
    let rms = 0
    for (let k = 0; k < n; k++) rms += dyeBuf[0][k] ** 2
    rms = Math.sqrt(rms / n)
    for (let k = 0; k < n; k++) dyeBuf[0][k] += noise * rms * gauss()
  }
  let loss = 0
  for (let t = 0; t < K; t++) {
    applySL(traj.op, dyeBuf[t], tape[t].post)
    advectCorrection(w, tape[t].post, traj.u, traj.v, tape[t].corr, tape[t].act)
    const truth = traj.states[t0 + t + 1]
    const next = dyeBuf[t + 1]
    for (let k = 0; k < n; k++) {
      next[k] = tape[t].post[k] + tape[t].corr[k]
      const e = next[k] - truth[k]
      loss += (e * e) / (n * K)
    }
  }
  if (!g) return loss

  gNext.fill(0)
  for (let t = K - 1; t >= 0; t--) {
    const truth = traj.states[t0 + t + 1]
    for (let k = 0; k < n; k++) gNext[k] += (2 * (dyeBuf[t + 1][k] - truth[k])) / (n * K)
    // next = post + corr(post): identity path plus the through-net path
    gPost.set(gNext)
    correctionBackward(w, tape[t].post, tape[t].act, tape[t].corr, gNext, g, gPost)
    // post = SL(dye_t): exact adjoint of the frozen gather
    gNext.fill(0)
    applySLAdjoint(traj.op, gPost, gNext)
  }
  return loss
}

// -------------------------------------------------------------------- main

console.log(`building trajectories from ${ADVECT_TRAIN.length} cases…`)
const trainTrajs = ADVECT_TRAIN.map((s) => runFine(s, T_TRAIN))
const train: Sample[] = []
for (let i = 0; i < trainTrajs.length; i++) {
  train.push(...makeSamples(trainTrajs[i]))
  console.log(`  ${ADVECT_TRAIN[i].id} ${ADVECT_TRAIN[i].label}: ${train.length} samples so far`)
}
const heldOutTraj = ADVECT_HELD_OUT.map((s) => runFine(s, T_EVAL))
const oodTraj = ADVECT_OOD.map((s) => runFine(s, T_EVAL))

// ---- gradient checks, both objectives
{
  const w = initWeights()
  const g = zeroLike()
  const base = lossAndGrad(w, train[3], g)
  let worst = 0
  for (const key of KEYS) {
    for (let t = 0; t < 3; t++) {
      const i = Math.floor(rnd() * w[key].length)
      const h = 1e-3
      const keep = w[key][i]
      w[key][i] = keep + h
      const lp = lossAndGrad(w, train[3], null)
      w[key][i] = keep - h
      const lm = lossAndGrad(w, train[3], null)
      w[key][i] = keep
      const rel = Math.abs((lp - lm) / (2 * h) - g[key][i]) / Math.max(1e-9, Math.abs((lp - lm) / (2 * h)) + Math.abs(g[key][i]))
      if (rel > worst) worst = rel
    }
  }
  console.log(`one-step gradient check: worst rel err ${worst.toExponential(2)} (loss ${base.toExponential(3)})`)
  if (worst > 3e-3) throw new Error('one-step gradient disagrees with finite differences')

  const g2 = zeroLike()
  const base2 = unrolledLossAndGrad(w, trainTrajs[1], 30, g2, 6, 0)
  // Per-coordinate finite differences through six chained float32 steps are
  // rounding-dominated (measured: the h-sweep bottoms out near 8e-4 at
  // h ≈ 1e-3–3e-3 and gets WORSE at smaller h), so an unlucky coordinate can
  // read ~1e-2 with a perfectly correct gradient. The per-coordinate bound is
  // therefore loose, and the load-bearing test is the directional derivative
  // along the full analytic gradient — an aggregate a genuinely wrong term
  // cannot sneak past.
  let worst2 = 0
  for (const key of KEYS) {
    for (let t = 0; t < 3; t++) {
      const i = Math.floor(rnd() * w[key].length)
      const h = 2e-3
      const keep = w[key][i]
      w[key][i] = keep + h
      const lp = unrolledLossAndGrad(w, trainTrajs[1], 30, null, 6, 0)
      w[key][i] = keep - h
      const lm = unrolledLossAndGrad(w, trainTrajs[1], 30, null, 6, 0)
      w[key][i] = keep
      const rel = Math.abs((lp - lm) / (2 * h) - g2[key][i]) / Math.max(1e-9, Math.abs((lp - lm) / (2 * h)) + Math.abs(g2[key][i]))
      if (rel > worst2) worst2 = rel
    }
  }
  let gnorm2 = 0
  for (const key of KEYS) for (let i = 0; i < g2[key].length; i++) gnorm2 += g2[key][i] ** 2
  const eps = 1e-2 / Math.sqrt(gnorm2)
  for (const key of KEYS) for (let i = 0; i < g2[key].length; i++) w[key][i] += eps * g2[key][i]
  const lp2 = unrolledLossAndGrad(w, trainTrajs[1], 30, null, 6, 0)
  for (const key of KEYS) for (let i = 0; i < g2[key].length; i++) w[key][i] -= 2 * eps * g2[key][i]
  const lm2 = unrolledLossAndGrad(w, trainTrajs[1], 30, null, 6, 0)
  for (const key of KEYS) for (let i = 0; i < g2[key].length; i++) w[key][i] += eps * g2[key][i]
  const dirRel = Math.abs((lp2 - lm2) / (2 * eps) - gnorm2) / gnorm2
  console.log(
    `in-the-loop gradient check (K=6, through the solver): per-coord worst ${worst2.toExponential(2)}, directional rel ${dirRel.toExponential(2)} (loss ${base2.toExponential(3)})`,
  )
  if (dirRel > 5e-3) throw new Error('unrolled gradient direction disagrees with finite differences')
  if (worst2 > 2e-2) throw new Error('unrolled per-coordinate gradients disagree beyond float32 noise')
}

// ---- shared Adam driver
function adamTrain(
  name: string,
  steps: number,
  batch: number,
  lr0: number,
  gradFn: (w: AdvectWeights, g: AdvectWeights) => number,
): AdvectWeights {
  const w = initWeights()
  const m = zeroLike()
  const v = zeroLike()
  const grad = zeroLike()
  console.log(`training ${name}: ${advectParamCount()} parameters, ${steps} steps…`)
  for (let step = 1; step <= steps; step++) {
    for (const k of KEYS) grad[k].fill(0)
    let loss = 0
    for (let b = 0; b < batch; b++) loss += gradFn(w, grad) / batch
    const bc1 = 1 - Math.pow(0.9, step)
    const bc2 = 1 - Math.pow(0.999, step)
    const lr = lr0 * Math.min(1, step / 200) * (0.05 + 0.95 * 0.5 * (1 + Math.cos((Math.PI * step) / steps)))
    for (const k of KEYS) {
      const p = w[k]
      const gk = grad[k]
      const mk = m[k]
      const vk = v[k]
      for (let i = 0; i < p.length; i++) {
        const gi = gk[i] / batch
        mk[i] = 0.9 * mk[i] + 0.1 * gi
        vk[i] = 0.999 * vk[i] + 0.001 * gi * gi
        p[i] -= (lr * (mk[i] / bc1)) / (Math.sqrt(vk[i] / bc2) + 1e-8)
      }
    }
    if (step % 600 === 0 || step === 1) console.log(`  step ${step}  loss ${loss.toExponential(3)}`)
  }
  return w
}

const wOneStep = adamTrain('one-step', STEPS, BATCH, LR, (w, g) =>
  lossAndGrad(w, train[Math.floor(rnd() * train.length)], g),
)
let phase2Calls = 0
const LOOP_STEPS = 4500
const LOOP_BATCH = 6
const wLoop = adamTrain('in-the-loop', LOOP_STEPS, LOOP_BATCH, 1.5e-3, (w, g) => {
  phase2Calls++
  const step = Math.ceil(phase2Calls / LOOP_BATCH)
  const K = Math.min(K_MAX, 2 + 2 * Math.floor(step / 250)) // curriculum: 2 → 16 by step 1750
  const traj = trainTrajs[Math.floor(rnd() * trainTrajs.length)]
  const t0 = Math.floor(rnd() * (T_TRAIN - K_MAX - 1))
  return unrolledLossAndGrad(w, traj, t0, g, K, 0.02)
})

// ------------------------------------------------------------- evaluation

interface ModelEval {
  plainErrEnd: number
  corrErrEnd: number
  /** first rollout step at which the corrected path is WORSE than plain (null = never) */
  crossStep: number | null
}

function evalModel(w0: AdvectWeights, trajs: Trajectory[]): ModelEval {
  let plainSum = 0
  let corrSum = 0
  let cross: number | null = null
  for (const traj of trajs) {
    const p = rollout(traj, null, 0, T_EVAL)
    const c = rollout(traj, w0, 1, T_EVAL)
    plainSum += p[T_EVAL - 1]
    corrSum += c[T_EVAL - 1]
    // "worse than plain" only counts once it is meaningfully worse on a
    // meaningfully wrong field — a 1.01× wobble at 2% error is measurement
    // noise, not a crossing.
    for (let t = 0; t < T_EVAL; t++) {
      if (c[t] > 1.2 * p[t] && p[t] > 0.05) {
        if (cross === null || t + 1 < cross) cross = t + 1
        break
      }
    }
  }
  return { plainErrEnd: plainSum / trajs.length, corrErrEnd: corrSum / trajs.length, crossStep: cross }
}

console.log('\n--- autonomous rollout, ' + T_EVAL + ' steps, error vs restricted fine ---')
const report = (label: string, e: ModelEval) =>
  console.log(
    `${label.padEnd(34)} plain ${e.plainErrEnd.toFixed(3)} → corrected ${e.corrErrEnd.toFixed(3)}` +
      (e.crossStep ? `   (goes worse than plain at step ${e.crossStep})` : '   (never worse than plain)'),
  )
const evalHeldOne = evalModel(wOneStep, heldOutTraj)
const evalHeldLoop = evalModel(wLoop, heldOutTraj)
const evalOodLoop = evalModel(wLoop, oodTraj)
const evalOodOne = evalModel(wOneStep, oodTraj)
report('one-step, held out', evalHeldOne)
report('in-the-loop, held out', evalHeldLoop)
report('one-step, out of distribution', evalOodOne)
report('in-the-loop, out of distribution', evalOodLoop)

// effective-resolution comparison on the held-out disc
const plain2x = plainAtFactor(ADVECT_HELD_OUT[0], 2, T_EVAL)
const plain4x = rollout(heldOutTraj[0], null, 0, T_EVAL)
const loop4x = rollout(heldOutTraj[0], wLoop, 1, T_EVAL)
console.log(
  `effective resolution (held-out disc, step ${T_EVAL}): plain 48×32 ${plain2x[T_EVAL - 1].toFixed(3)}   plain 24×16 ${plain4x[T_EVAL - 1].toFixed(3)}   in-the-loop 24×16 ${loop4x[T_EVAL - 1].toFixed(3)}`,
)

// conservation: both corrections' ledgers must be zero by construction
{
  const t = heldOutTraj[0]
  const post = new Float32Array(CNX * CNY)
  slStep(CNX, CNY, t.u, t.v, DT, t.states[40], post)
  const c = new Float32Array(CNX * CNY)
  for (const [label, w0] of [
    ['one-step', wOneStep],
    ['in-the-loop', wLoop],
  ] as const) {
    advectCorrection(w0, post, t.u, t.v, c, makeAdvectActs())
    let sum = 0
    for (let k = 0; k < c.length; k++) sum += c[k]
    console.log(`${label} correction mass ledger: ${sum.toExponential(2)} (zero by construction)`)
  }
}

// ------------------------------------------------------------------ export

const fmt = (a: Float32Array) => `new Float32Array([${Array.from(a).map((x) => Number(x.toFixed(6))).join(',')}])`
const manifest = {
  trainedAt: new Date().toISOString().slice(0, 10),
  params: advectParamCount(),
  samples: train.length,
  cases: ADVECT_TRAIN.map((c) => c.id),
  horizon: T_EVAL,
  kUnroll: K_MAX,
  oneStep: { steps: STEPS, batch: BATCH, heldOut: evalHeldOne, ood: evalOodOne },
  inTheLoop: { steps: LOOP_STEPS, batch: LOOP_BATCH, heldOut: evalHeldLoop, ood: evalOodLoop },
  effRes: {
    plain2x: Number(plain2x[T_EVAL - 1].toFixed(4)),
    plain4x: Number(plain4x[T_EVAL - 1].toFixed(4)),
    inTheLoop4x: Number(loop4x[T_EVAL - 1].toFixed(4)),
  },
}

const dump = (w0: AdvectWeights) =>
  `{
  w1: ${fmt(w0.w1)},
  b1: ${fmt(w0.b1)},
  w2: ${fmt(w0.w2)},
  b2: ${fmt(w0.b2)},
  w3: ${fmt(w0.w3)},
  b3: ${fmt(w0.b3)},
}`

writeFileSync(
  'src/sims/learned/advect_weights.ts',
  `// GENERATED by scripts/train-advect-net.ts — do not edit by hand.
//
// Two weight sets for the SAME ${manifest.params}-parameter flux-correction
// architecture, differing only in what their training loss could see:
// ONE_STEP saw a single step ahead; IN_THE_LOOP saw up to a ${K_MAX}-step
// autonomous rollout with gradients carried through the solver. The manifest
// records what each one does over ${T_EVAL}-step rollouts it steered itself.
// Retrain with:  bun run scripts/train-advect-net.ts

import type { AdvectWeights } from './advect'

export const ADVECT_ONE_STEP: AdvectWeights = ${dump(wOneStep)}

export const ADVECT_IN_THE_LOOP: AdvectWeights = ${dump(wLoop)}

export const ADVECT_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const
`,
)
console.log('\nwrote src/sims/learned/advect_weights.ts')
