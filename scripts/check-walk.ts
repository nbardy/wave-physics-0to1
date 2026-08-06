/**
 * Part 2 §4 — context-matching leakage lab, oracle tier. Everything here is
 * exact (enumeration + exact chain propagation, no sampling), so these are
 * the measured facts the article's prose will be allowed to claim.
 * Run: bun run scripts/check-walk.ts
 */

import {
  N_NODES,
  compiledKernel,
  contextLoss,
  fit,
  freshParams,
  invalidMass,
  modelVisitedQ,
  oneHotConfig,
  targetKernel,
  targetStationary,
  trajectoryReport,
} from '../src/sims/pbits/walkCompile'

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const uniformQ = new Float64Array(N_NODES).fill(1 / N_NODES)

{
  // sanity: target kernel rows normalize; stationary law is a law
  let rows = true
  for (let i = 0; i < N_NODES; i++) {
    const k = targetKernel(i)
    let s = 0
    for (let j = 0; j < N_NODES; j++) s += k[j]
    if (Math.abs(s - 1) > 1e-12) rows = false
  }
  const pi = targetStationary()
  let piSum = 0
  for (let i = 0; i < N_NODES; i++) piSum += pi[i]
  ok(rows && Math.abs(piSum - 1) > 0 && Math.abs(piSum - 1) < 1e-9, 'walk/target', `rows normalized, stationary sums ${piSum.toFixed(9)}`)
  ok(pi[0] > 0.3, 'walk/sticky', `sticky node holds ${pi[0].toFixed(3)} of the stationary law`)
}

// --- the factorized leak: nh = 0 cannot concentrate on one-hots ------------
const flat0 = fit(freshParams(0), uniformQ, 220, 0.35)
{
  let leak = 0
  for (let i = 0; i < N_NODES; i++) leak = Math.max(leak, invalidMass(flat0, oneHotConfig(i)))
  ok(leak > 0.25, 'walk/factorized-leak', `nh=0: worst per-context off-graph mass ${leak.toFixed(3)}`)
}

// --- hidden spins buy back concentration -----------------------------------
const hid = fit(freshParams(3), uniformQ, 220, 0.35)
{
  let leak0 = 0
  let leakH = 0
  for (let i = 0; i < N_NODES; i++) {
    leak0 = Math.max(leak0, invalidMass(flat0, oneHotConfig(i)))
    leakH = Math.max(leakH, invalidMass(hid, oneHotConfig(i)))
  }
  ok(leakH < leak0 * 0.6, 'walk/hidden-buyback', `worst off-graph mass ${leak0.toFixed(3)} → ${leakH.toFixed(3)} with 3 hidden spins`)
  const l0 = contextLoss(flat0, uniformQ)
  const lH = contextLoss(hid, uniformQ)
  ok(lH < l0 * 0.7, 'walk/hidden-kl', `uniform-q context KL ${l0.toFixed(3)} → ${lH.toFixed(3)}`)
}

// --- per-step honesty is not trajectory honesty ----------------------------
{
  // The apples-to-apples statement: worst SINGLE-step TV (per valid context,
  // off-graph mass counted as error) vs the T-step trajectory TV. The
  // article's claim is accumulation: the chain's error exceeds any one
  // step's — not a vague "dwarfs" (first threshold was folklore; replaced
  // with the measured ratio, 2026-08-05).
  const T = 30
  let stepTV = 0
  for (let i = 0; i < N_NODES; i++) {
    const target = targetKernel(i)
    const model = compiledKernel(hid, oneHotConfig(i))
    let tv = invalidMass(hid, oneHotConfig(i))
    for (let j = 0; j < N_NODES; j++) tv += Math.abs(target[j] - model[oneHotConfig(j)])
    stepTV = Math.max(stepTV, tv / 2)
  }
  const rep = trajectoryReport(hid, T)
  console.log(
    `    measured: worst single-step TV ${stepTV.toFixed(3)}, T=${T} trajectory TV ${rep.tv.toFixed(3)}, off-graph occupancy ${rep.offGraph.toFixed(3)}`,
  )
  // Measured 1.28× on first honest run — the claim the article may make is
  // "the chain's error exceeds any single step's", not a large multiplier.
  ok(
    rep.tv > 1.15 * stepTV,
    'walk/trajectory-gap',
    `trajectory TV ${rep.tv.toFixed(3)} exceeds worst single-step TV ${stepTV.toFixed(3)} (×${(rep.tv / stepTV).toFixed(2)}) — the leak accumulates`,
  )
}

// --- context weighting reallocates real error ------------------------------
{
  // target-visited q: the walk lives mostly at the sticky node. Capacity is
  // TIED (ring-shared U) so the contexts genuinely compete — see the
  // KernelParams.tied comment for why private capacity would nullify this.
  const qTarget = targetStationary()
  const uni = fit(freshParams(2, true), uniformQ, 220, 0.35)
  const tgt = fit(freshParams(2, true), qTarget, 220, 0.35)
  // error ON THE CONTEXTS THE PROGRAM VISITS, weighted by visitation:
  const visitedError = (p: typeof uni) => contextLoss(p, qTarget)
  const eUni = visitedError(uni)
  const eTgt = visitedError(tgt)
  ok(
    eTgt < eUni * 0.85,
    'walk/context-weighting',
    `visitation-weighted KL: uniform-trained ${eUni.toFixed(4)} vs target-visited-trained ${eTgt.toFixed(4)}`,
  )
  // Measured surprise (2026-08-05): the expected no-free-lunch trade does
  // NOT appear at this size — with ring-tied capacity the sticky-node
  // improvements spill POSITIVELY into the cold contexts (0.66 → 0.60 on
  // first measurement). The article may not claim "error pools in unvisited
  // contexts" for this model; the honest claim is "weighting helps where it
  // counts, and here the shared wires helped everywhere." This tripwire
  // only guards against silent regressions of that measured fact.
  const coldQ = new Float64Array(N_NODES)
  let coldTotal = 0
  for (let i = 0; i < N_NODES; i++) {
    coldQ[i] = Math.max(0, 1 / N_NODES - qTarget[i])
    coldTotal += coldQ[i]
  }
  for (let i = 0; i < N_NODES; i++) coldQ[i] /= coldTotal
  const coldUni = contextLoss(uni, coldQ)
  const coldTgt = contextLoss(tgt, coldQ)
  console.log(`    measured: cold-context KL uniform-trained ${coldUni.toFixed(4)}, target-visited-trained ${coldTgt.toFixed(4)}`)
  ok(
    coldTgt < coldUni * 1.5,
    'walk/cold-spillover',
    `cold contexts not sacrificed at this size (${coldUni.toFixed(3)} → ${coldTgt.toFixed(3)})`,
  )
}

// --- model-visited q closes the trajectory gap (one self-consistent round) -
{
  const T = 30
  const round0 = fit(freshParams(3, true), uniformQ, 220, 0.35)
  const drift0 = trajectoryReport(round0, T).tv
  const q1 = modelVisitedQ(round0, T)
  const round1 = fit(round0, q1, 160, 0.25)
  const drift1 = trajectoryReport(round1, T).tv
  ok(
    drift1 < drift0,
    'walk/model-visited',
    `trajectory TV ${drift0.toFixed(3)} → ${drift1.toFixed(3)} after one model-visited refit`,
  )
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
