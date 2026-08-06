// Part 2 §4 core — the context-matching leakage lab (Thermalizers §III B/G,
// IV.A; claims ledger in articles/06-z1-compiler/RESEARCH.md).
//
// Target program: a biased random walk on a 5-node ring, deliberately
// NON-uniform per node (node 0 is "sticky") so that a capacity-limited
// compiled kernel cannot serve every context equally and context weighting
// has something real to reallocate.
//
// State encoding: one-hot over 5 p-bits (spin +1 marks the token's node,
// the other four sit at −1) — the Torx walk encoding. The compiled object
// is a thermodynamic kernel over V_in (5 spins, clamped) ∪ V_hid (nh free)
// ∪ V_out (5 spins, read):
//
//   E(x, w, y) = − xᵀU y − b·y − c·w − xᵀA w − wᵀB y
//   K̃(y|x)    = Σ_w e^{−E} / Σ_{y',w} e^{−E}
//
// computed EXACTLY by enumeration (2^5 outputs × 2^nh hidden — no sampling
// anywhere in the fit). Two leaks fall out and both are measured:
//
//   1. OFF-GRAPH MASS: the EBM normalizes over all 2^5 output configs, not
//      the 5 one-hots — with nh = 0 the output bits are conditionally
//      independent (logits linear in y), so mass MUST leak to invalid
//      configs (the factorized failure of Part 1, recurring). Hidden spins
//      buy back concentration.
//   2. TRAJECTORY DRIFT: feeding K̃'s output back as the next input makes a
//      Markov chain on all 32 configs; its occupancy drifts off the graph
//      and away from the target walk's law even when every per-context KL
//      looks small. Per-step honesty ≠ trajectory honesty.
//
// Context weighting: the fit minimizes Σ_x q(x)·KL(K(·|x) ‖ K̃(·|x)) over
// the 5 valid contexts, with q ∈ {uniform, target-visited (the walk's
// stationary law), model-visited (the compiled chain's own occupancy,
// projected onto valid contexts and renormalized)}. The papers' principled
// fix for off-graph contexts is trajectory-level REINFORCE (§III D) — NOT
// implemented here; model-visited-projected is the honest v0 and the
// figure will say so.

export const N_NODES = 5
export const N_CONF = 1 << N_NODES

// --- the target program ----------------------------------------------------

/** P(next | node): right/left/stay on the ring; node 0 is sticky. */
export function targetKernel(i: number): Float64Array {
  const p = new Float64Array(N_NODES)
  const stay = i === 0 ? 0.7 : 0.1
  const right = i === 0 ? 0.2 : 0.6
  const left = 1 - stay - right
  p[i] += stay
  p[(i + 1) % N_NODES] += right
  p[(i + N_NODES - 1) % N_NODES] += left
  return p
}

/** Stationary law of the target walk (power iteration, exact enough). */
export function targetStationary(): Float64Array {
  let pi = new Float64Array(N_NODES).fill(1 / N_NODES)
  for (let it = 0; it < 500; it++) {
    const next = new Float64Array(N_NODES)
    for (let i = 0; i < N_NODES; i++) {
      const k = targetKernel(i)
      for (let j = 0; j < N_NODES; j++) next[j] += pi[i] * k[j]
    }
    pi = next
  }
  return pi
}

export function oneHotConfig(i: number): number {
  return 1 << i
}

/** Which node a config marks, or −1 if it is not a valid one-hot. */
export function nodeOfConfig(cfg: number): number {
  if (cfg === 0 || (cfg & (cfg - 1)) !== 0) return -1
  return Math.log2(cfg) | 0
}

// --- the thermodynamic kernel ---------------------------------------------

export interface KernelParams {
  nh: number
  /** Tied-ring capacity: U is constrained to U[i,k] = u[(k−i) mod 5], five
   *  shared numbers instead of twenty-five private ones. This is the v0
   *  stand-in for the real capacity limit (a kernel placed on the fabric
   *  only owns the wires the fabric routes) — with a private U row per
   *  context, every context fits independently and context weighting can
   *  reallocate nothing (measured: identical losses under any q,
   *  2026-08-05). Fabric-sparse U is the honest final version (Part 2 F12). */
  tied: boolean
  U: Float64Array // 5×5, U[i*5+k]
  b: Float64Array // 5
  c: Float64Array // nh
  A: Float64Array // 5×nh
  B: Float64Array // nh×5
}

/** Deterministic tiny init on every hidden-touching parameter: at exactly
 *  zero the ±w symmetry makes all hidden gradients vanish and nh > 0 stays
 *  numerically identical to nh = 0 forever (measured, 2026-08-05). */
export function freshParams(nh: number, tied = false, seed = 5): KernelParams {
  const jitter = (arr: Float64Array, salt: number) => {
    for (let k = 0; k < arr.length; k++) {
      arr[k] = 0.05 * Math.sin(seed * 12.9898 + salt * 78.233 + k * 37.719)
    }
    return arr
  }
  return {
    nh,
    tied,
    U: new Float64Array(N_NODES * N_NODES),
    b: new Float64Array(N_NODES),
    c: jitter(new Float64Array(nh), 1),
    A: jitter(new Float64Array(N_NODES * nh), 2),
    B: jitter(new Float64Array(nh * N_NODES), 3),
  }
}

/** Project U onto the tied-ring subspace (average by ring offset). */
function projectTied(U: Float64Array): void {
  const byOffset = new Float64Array(N_NODES)
  for (let i = 0; i < N_NODES; i++) {
    for (let k = 0; k < N_NODES; k++) byOffset[(k - i + N_NODES) % N_NODES] += U[i * N_NODES + k]
  }
  for (let d = 0; d < N_NODES; d++) byOffset[d] /= N_NODES
  for (let i = 0; i < N_NODES; i++) {
    for (let k = 0; k < N_NODES; k++) U[i * N_NODES + k] = byOffset[(k - i + N_NODES) % N_NODES]
  }
}

const spin = (cfg: number, k: number) => ((cfg >> k) & 1 ? 1 : -1)

/** Exact K̃(·|x) over all 2^5 output configs, hidden marginalized.
 *  Normalized in log space — couplings grow during the fit and a naive
 *  exp(−E) overflows to NaN (found by check-walk.ts, 2026-08-05). */
export function compiledKernel(p: KernelParams, xCfg: number): Float64Array {
  const nhStates = 1 << p.nh
  const energies = new Float64Array(N_CONF * nhStates)
  let eMin = Infinity
  for (let y = 0; y < N_CONF; y++) {
    for (let w = 0; w < nhStates; w++) {
      let e = 0
      for (let i = 0; i < N_NODES; i++) {
        const xi = spin(xCfg, i)
        for (let k = 0; k < N_NODES; k++) e -= xi * p.U[i * N_NODES + k] * spin(y, k)
        for (let h = 0; h < p.nh; h++) e -= xi * p.A[i * p.nh + h] * spin(w, h)
      }
      for (let k = 0; k < N_NODES; k++) e -= p.b[k] * spin(y, k)
      for (let h = 0; h < p.nh; h++) {
        e -= p.c[h] * spin(w, h)
        for (let k = 0; k < N_NODES; k++) e -= p.B[h * N_NODES + k] * spin(w, h) * spin(y, k)
      }
      energies[y * nhStates + w] = e
      if (e < eMin) eMin = e
    }
  }
  const out = new Float64Array(N_CONF)
  let z = 0
  for (let y = 0; y < N_CONF; y++) {
    let sum = 0
    for (let w = 0; w < nhStates; w++) sum += Math.exp(-(energies[y * nhStates + w] - eMin))
    out[y] = sum
    z += sum
  }
  for (let y = 0; y < N_CONF; y++) out[y] /= z
  return out
}

/** Mass the compiled kernel puts outside the 5 valid one-hot outputs. */
export function invalidMass(p: KernelParams, xCfg: number): number {
  const k = compiledKernel(p, xCfg)
  let valid = 0
  for (let i = 0; i < N_NODES; i++) valid += k[oneHotConfig(i)]
  return 1 - valid
}

// --- fitting ---------------------------------------------------------------

/** Σ_i q(i) · KL(K(·|i) ‖ K̃(·|onehot_i)), target mass 0 on invalid configs. */
export function contextLoss(p: KernelParams, q: Float64Array): number {
  let loss = 0
  for (let i = 0; i < N_NODES; i++) {
    if (q[i] === 0) continue
    const target = targetKernel(i)
    const model = compiledKernel(p, oneHotConfig(i))
    let kl = 0
    for (let j = 0; j < N_NODES; j++) {
      if (target[j] === 0) continue
      kl += target[j] * Math.log(target[j] / Math.max(model[oneHotConfig(j)], 1e-12))
    }
    loss += q[i] * kl
  }
  return loss
}

const FD_EPS = 1e-4

/** Plain finite-difference gradient descent; exact loss, no sampling.
 *  The full gradient is measured against one frozen base per iteration and
 *  applied in a single step — updating coordinates in place against a stale
 *  base diverges (found by check-walk.ts, 2026-08-05). */
export function fit(p: KernelParams, q: Float64Array, iters: number, lr: number): KernelParams {
  const arrays: Array<Float64Array> = [p.U, p.b, p.c, p.A, p.B]
  for (let it = 0; it < iters; it++) {
    const base = contextLoss(p, q)
    const grads = arrays.map((arr) => new Float64Array(arr.length))
    arrays.forEach((arr, a) => {
      for (let k = 0; k < arr.length; k++) {
        const keep = arr[k]
        arr[k] = keep + FD_EPS
        grads[a][k] = (contextLoss(p, q) - base) / FD_EPS
        arr[k] = keep
      }
    })
    arrays.forEach((arr, a) => {
      for (let k = 0; k < arr.length; k++) arr[k] -= lr * grads[a][k]
    })
    if (p.tied) projectTied(p.U)
  }
  return p
}

// --- trajectory truth ------------------------------------------------------

/**
 * Exact occupancy of the compiled chain after T steps from node 0, over all
 * 32 configs — the kernel is defined for every input config, valid or not,
 * so the chain is free to wander off the graph and we let it.
 */
export function chainOccupancy(p: KernelParams, T: number): Float64Array {
  let occ = new Float64Array(N_CONF)
  occ[oneHotConfig(0)] = 1
  for (let t = 0; t < T; t++) {
    const next = new Float64Array(N_CONF)
    for (let x = 0; x < N_CONF; x++) {
      if (occ[x] === 0) continue
      const k = compiledKernel(p, x)
      for (let y = 0; y < N_CONF; y++) next[y] += occ[x] * k[y]
    }
    occ = next
  }
  return occ
}

export interface TrajectoryReport {
  /** occupancy on each of the 5 nodes */
  onGraph: Float64Array
  /** total occupancy on invalid configs */
  offGraph: number
  /** TV between (node-projected, renormalized… NO — raw) occupancy and the
   *  target walk's T-step law, with off-graph mass counted as pure error */
  tv: number
}

export function trajectoryReport(p: KernelParams, T: number): TrajectoryReport {
  const occ = chainOccupancy(p, T)
  const onGraph = new Float64Array(N_NODES)
  let off = 0
  for (let cfg = 0; cfg < N_CONF; cfg++) {
    const node = nodeOfConfig(cfg)
    if (node >= 0) onGraph[node] += occ[cfg]
    else off += occ[cfg]
  }
  // target occupancy after T steps from node 0
  let pi = new Float64Array(N_NODES)
  pi[0] = 1
  for (let t = 0; t < T; t++) {
    const next = new Float64Array(N_NODES)
    for (let i = 0; i < N_NODES; i++) {
      const k = targetKernel(i)
      for (let j = 0; j < N_NODES; j++) next[j] += pi[i] * k[j]
    }
    pi = next
  }
  let tv = off // off-graph mass is entirely error
  for (let i = 0; i < N_NODES; i++) tv += Math.abs(onGraph[i] - pi[i])
  return { onGraph, offGraph: off, tv: tv / 2 }
}

/** The model-visited context distribution: the compiled chain's occupancy,
 *  projected onto valid contexts and renormalized (v0 — the papers'
 *  REINFORCE trajectory correction is the principled treatment of the
 *  off-graph remainder). */
export function modelVisitedQ(p: KernelParams, T: number): Float64Array {
  const { onGraph } = trajectoryReport(p, T)
  let total = 0
  for (let i = 0; i < N_NODES; i++) total += onGraph[i]
  const q = new Float64Array(N_NODES)
  for (let i = 0; i < N_NODES; i++) q[i] = total > 0 ? onGraph[i] / total : 1 / N_NODES
  return q
}

// --- REINFORCE post-training (Thermalizers §III D) --------------------------
//
// The trajectory-level correction the context-matching story ends on: treat
// the compiled chain as a stochastic policy, the per-step occupancy mismatch
// as (negative) reward, and descend the score-function gradient
//
//   ∇L = E[ F_eff · (Φ − E[Φ | parent]) ],   Φ = −∇_θ E,
//
// where the reward-shaped weight for squared error against per-step
// occupancy targets is F_eff = 2 Σ_{t,b} (m_b(t) − t_b(t)) · f_b(t)  (f = the
// trajectory's own visit indicators). On hardware this needs ONLY the
// negative-phase clamping pattern — sampling the trajectory step z_{ℓ−1}→z_ℓ
// IS an in-clamped free run, so the sampled (w, y) supplies Φ and the parent
// conditional supplies the baseline E[Φ | z_{ℓ−1}]; no in+out-clamped phase
// is ever run, which is what makes this cheaper than CD.
//
// HERE THE EXPECTATIONS ARE EXACT, NOT SAMPLED: the chain has 32 configs and
// ≤ 2^nh hidden states, so every expectation in the estimator is enumerated
// in closed form — forward occupancies occ_ℓ(x), backward reward-to-go
// W_ℓ(y), and the clamped hidden means E[w_h | x, y]. Exact REINFORCE is the
// exact gradient of `trajectoryLoss` (the score-function identity is an
// identity), and check-walk-figs.ts holds this code to that claim against a
// finite-difference gradient.

/** Bucket of a config: node index 0..4, or N_NODES for "off-graph". */
export const bucketOf = (cfg: number): number => {
  const node = nodeOfConfig(cfg)
  return node >= 0 ? node : N_NODES
}

/** Target walk occupancy at steps 0..T from node 0: (T+1) × N_NODES. */
export function targetOccupancies(T: number): Float64Array {
  const out = new Float64Array((T + 1) * N_NODES)
  out[0] = 1 // node 0 at t = 0
  let pi = new Float64Array(N_NODES)
  pi[0] = 1
  for (let t = 1; t <= T; t++) {
    const next = new Float64Array(N_NODES)
    for (let i = 0; i < N_NODES; i++) {
      const k = targetKernel(i)
      for (let j = 0; j < N_NODES; j++) next[j] += pi[i] * k[j]
    }
    pi = next
    for (let i = 0; i < N_NODES; i++) out[t * N_NODES + i] = pi[i]
  }
  return out
}

/** All T+1 exact occupancies of the compiled chain over 32 configs. */
export function chainOccupancies(p: KernelParams, T: number): Float64Array {
  const rows = kernelRows(p).k
  const out = new Float64Array((T + 1) * N_CONF)
  out[oneHotConfig(0)] = 1
  for (let t = 1; t <= T; t++) {
    for (let x = 0; x < N_CONF; x++) {
      const mass = out[(t - 1) * N_CONF + x]
      if (mass === 0) continue
      for (let y = 0; y < N_CONF; y++) out[t * N_CONF + y] += mass * rows[x * N_CONF + y]
    }
  }
  return out
}

/** The REINFORCE objective, exactly: Σ_{t=1..T} Σ_b (m_b(t) − target_b(t))²
 *  over the six buckets (five nodes + off-graph, whose target is 0). */
export function trajectoryLoss(p: KernelParams, T: number): number {
  const occ = chainOccupancies(p, T)
  const targ = targetOccupancies(T)
  let L = 0
  for (let t = 1; t <= T; t++) {
    const m = new Float64Array(N_NODES + 1)
    for (let cfg = 0; cfg < N_CONF; cfg++) m[bucketOf(cfg)] += occ[t * N_CONF + cfg]
    for (let b = 0; b <= N_NODES; b++) {
      const tb = b < N_NODES ? targ[t * N_NODES + b] : 0
      L += (m[b] - tb) * (m[b] - tb)
    }
  }
  return L
}

/** Every kernel row K̃(·|x) plus the clamped hidden means E[w_h | x, y] —
 *  the two exact quantities the estimator needs (log-space, same overflow
 *  guard as compiledKernel). */
function kernelRows(p: KernelParams): { k: Float64Array; ew: Float64Array } {
  const nhStates = 1 << p.nh
  const k = new Float64Array(N_CONF * N_CONF) // k[x*32+y]
  const ew = new Float64Array(N_CONF * N_CONF * p.nh) // ew[(x*32+y)*nh+h]
  const weights = new Float64Array(nhStates)
  for (let x = 0; x < N_CONF; x++) {
    const energies = new Float64Array(N_CONF * nhStates)
    let eMin = Infinity
    for (let y = 0; y < N_CONF; y++) {
      for (let w = 0; w < nhStates; w++) {
        let e = 0
        for (let i = 0; i < N_NODES; i++) {
          const xi = spin(x, i)
          for (let kk = 0; kk < N_NODES; kk++) e -= xi * p.U[i * N_NODES + kk] * spin(y, kk)
          for (let h = 0; h < p.nh; h++) e -= xi * p.A[i * p.nh + h] * spin(w, h)
        }
        for (let kk = 0; kk < N_NODES; kk++) e -= p.b[kk] * spin(y, kk)
        for (let h = 0; h < p.nh; h++) {
          e -= p.c[h] * spin(w, h)
          for (let kk = 0; kk < N_NODES; kk++) e -= p.B[h * N_NODES + kk] * spin(w, h) * spin(y, kk)
        }
        energies[y * nhStates + w] = e
        if (e < eMin) eMin = e
      }
    }
    let z = 0
    for (let y = 0; y < N_CONF; y++) {
      let sum = 0
      for (let w = 0; w < nhStates; w++) {
        const wgt = Math.exp(-(energies[y * nhStates + w] - eMin))
        weights[w] = wgt
        sum += wgt
      }
      k[x * N_CONF + y] = sum
      z += sum
      for (let h = 0; h < p.nh; h++) {
        let acc = 0
        for (let w = 0; w < nhStates; w++) acc += weights[w] * spin(w, h)
        ew[(x * N_CONF + y) * p.nh + h] = sum > 0 ? acc / sum : 0
      }
    }
    for (let y = 0; y < N_CONF; y++) k[x * N_CONF + y] /= z
  }
  return { k, ew }
}

/** One exact evaluation of ∇L = E[F_eff·(Φ − E[Φ|parent])], enumerated.
 *  Returns gradients in the same order fit() walks its arrays. */
export function reinforceGrad(
  p: KernelParams,
  T: number,
): { U: Float64Array; b: Float64Array; c: Float64Array; A: Float64Array; B: Float64Array } {
  const { k, ew } = kernelRows(p)
  const targ = targetOccupancies(T)
  // forward: occ_0..occ_T, and the bucketed residual r_t(y) = 2(m_b(t) − t_b(t))
  const occ = new Float64Array((T + 1) * N_CONF)
  occ[oneHotConfig(0)] = 1
  const resid = new Float64Array((T + 1) * N_CONF)
  for (let t = 1; t <= T; t++) {
    for (let x = 0; x < N_CONF; x++) {
      const mass = occ[(t - 1) * N_CONF + x]
      if (mass === 0) continue
      for (let y = 0; y < N_CONF; y++) occ[t * N_CONF + y] += mass * k[x * N_CONF + y]
    }
    const m = new Float64Array(N_NODES + 1)
    for (let cfg = 0; cfg < N_CONF; cfg++) m[bucketOf(cfg)] += occ[t * N_CONF + cfg]
    for (let cfg = 0; cfg < N_CONF; cfg++) {
      const b = bucketOf(cfg)
      const tb = b < N_NODES ? targ[t * N_NODES + b] : 0
      resid[t * N_CONF + cfg] = 2 * (m[b] - tb)
    }
  }
  // backward reward-to-go: W_T(y) = r_T(y); W_ℓ(y) = r_ℓ(y) + Σ_y' K̃(y'|y)·W_{ℓ+1}(y')
  const W = new Float64Array((T + 1) * N_CONF)
  for (let y = 0; y < N_CONF; y++) W[T * N_CONF + y] = resid[T * N_CONF + y]
  for (let t = T - 1; t >= 1; t--) {
    for (let y = 0; y < N_CONF; y++) {
      let acc = resid[t * N_CONF + y]
      for (let y2 = 0; y2 < N_CONF; y2++) acc += k[y * N_CONF + y2] * W[(t + 1) * N_CONF + y2]
      W[t * N_CONF + y] = acc
    }
  }
  // per-edge weight: causality kills every t < ℓ term, so
  //   ∇L = Σ_{x,y} K̃(y|x) · (ω(x,y) − ω̄(x)) · Φ̂(x,y),
  //   ω(x,y) = Σ_ℓ occ_{ℓ−1}(x)·W_ℓ(y),  ω̄(x) = Σ_y K̃(y|x)·ω(x,y),
  // where the ω̄ subtraction IS the baseline E[Φ|parent] term, collapsed.
  const gU = new Float64Array(N_NODES * N_NODES)
  const gb = new Float64Array(N_NODES)
  const gc = new Float64Array(p.nh)
  const gA = new Float64Array(N_NODES * p.nh)
  const gB = new Float64Array(p.nh * N_NODES)
  const omega = new Float64Array(N_CONF)
  for (let x = 0; x < N_CONF; x++) {
    omega.fill(0)
    let parentMass = 0
    for (let t = 1; t <= T; t++) {
      const mass = occ[(t - 1) * N_CONF + x]
      if (mass === 0) continue
      parentMass += mass
      for (let y = 0; y < N_CONF; y++) omega[y] += mass * W[t * N_CONF + y]
    }
    if (parentMass === 0) continue
    let omegaBar = 0
    for (let y = 0; y < N_CONF; y++) omegaBar += k[x * N_CONF + y] * omega[y]
    for (let y = 0; y < N_CONF; y++) {
      const cWeight = k[x * N_CONF + y] * (omega[y] - omegaBar)
      if (cWeight === 0) continue
      // Φ̂(x,y): Φ_U = x_i y_k, Φ_b = y_k, Φ_c = E[w_h], Φ_A = x_i E[w_h], Φ_B = E[w_h] y_k
      for (let kk = 0; kk < N_NODES; kk++) {
        const yk = spin(y, kk)
        gb[kk] += cWeight * yk
        for (let i = 0; i < N_NODES; i++) gU[i * N_NODES + kk] += cWeight * spin(x, i) * yk
      }
      for (let h = 0; h < p.nh; h++) {
        const wh = ew[(x * N_CONF + y) * p.nh + h]
        gc[h] += cWeight * wh
        for (let i = 0; i < N_NODES; i++) gA[i * p.nh + h] += cWeight * spin(x, i) * wh
        for (let kk = 0; kk < N_NODES; kk++) gB[h * N_NODES + kk] += cWeight * wh * spin(y, kk)
      }
    }
  }
  // Sign: Φ = −∇θE and our energies enter as e^{−E}; with the parametrization
  // above, ∂log K̃/∂θ = +(Φ̂ − Φ̄), so the DESCENT direction is −g. Callers
  // subtract lr·g, exactly as fit() does with its FD gradient.
  return { U: gU, b: gb, c: gc, A: gA, B: gB }
}

/** REINFORCE post-training: exact score-function descent on trajectoryLoss.
 *  Same calling shape as fit(); starts from (and mutates) the given params —
 *  the ladder hands it the context-matched stage-2 kernel. */
export function fitReinforce(p: KernelParams, T: number, iters: number, lr: number): KernelParams {
  for (let it = 0; it < iters; it++) {
    const g = reinforceGrad(p, T)
    const pairs: Array<[Float64Array, Float64Array]> = [
      [p.U, g.U],
      [p.b, g.b],
      [p.c, g.c],
      [p.A, g.A],
      [p.B, g.B],
    ]
    for (const [arr, grad] of pairs) for (let k = 0; k < arr.length; k++) arr[k] -= lr * grad[k]
    if (p.tied) projectTied(p.U)
  }
  return p
}

// --- the floor: per-step error + contraction ⇒ depth-independent bound ------

/** Worst single-step TV over the five valid contexts, off-graph mass counted
 *  as pure error — the ε̄ of the floor bound δ̃ ≤ ε̄/(1−ρ). */
export function worstStepTV(p: KernelParams): number {
  let worst = 0
  for (let i = 0; i < N_NODES; i++) {
    const target = targetKernel(i)
    const model = compiledKernel(p, oneHotConfig(i))
    let tv = invalidMass(p, oneHotConfig(i))
    for (let j = 0; j < N_NODES; j++) tv += Math.abs(target[j] - model[oneHotConfig(j)])
    worst = Math.max(worst, tv / 2)
  }
  return worst
}

/** Contraction of the compiled 32×32 chain, measured two ways.
 *
 *  `dobrushin` — the Dobrushin coefficient max_{x,x'} TV(K̃(·|x), K̃(·|x')):
 *  a universal contraction ratio (TV(pM, qM) ≤ ρ·TV(p, q) for ALL p, q), so
 *  the bound ε̄/(1−ρ_dob) is airtight — but it maximizes over garbage input
 *  configs the chain barely visits, so it is loose.
 *
 *  `slem` — second-largest-eigenvalue modulus by power iteration on the
 *  sum-zero subspace (the all-ones right eigenvector is projected out each
 *  step): the asymptotic contraction rate. THIS is the ρ the figure draws,
 *  and the check script asserts the resulting ε̄/(1−ρ_slem) line actually
 *  sits above the measured trajectory curve — the bound is honest because it
 *  is audited, not because SLEM gives step-one guarantees. */
export function chainContraction(p: KernelParams): { dobrushin: number; slem: number } {
  const rows = kernelRows(p).k
  let dob = 0
  for (let a = 0; a < N_CONF; a++) {
    for (let b = a + 1; b < N_CONF; b++) {
      let tv = 0
      for (let y = 0; y < N_CONF; y++) tv += Math.abs(rows[a * N_CONF + y] - rows[b * N_CONF + y])
      dob = Math.max(dob, tv / 2)
    }
  }
  // SLEM: iterate a sum-zero row vector v ← vM, renormalizing; the growth
  // ratio over a long window averages out complex-pair oscillation.
  let v = new Float64Array(N_CONF)
  for (let i = 0; i < N_CONF; i++) v[i] = Math.sin(i * 1.7) // arbitrary, then de-meaned
  const deMean = (u: Float64Array) => {
    let s = 0
    for (let i = 0; i < N_CONF; i++) s += u[i]
    for (let i = 0; i < N_CONF; i++) u[i] -= s / N_CONF
  }
  const norm = (u: Float64Array) => {
    let s = 0
    for (let i = 0; i < N_CONF; i++) s += u[i] * u[i]
    return Math.sqrt(s)
  }
  deMean(v)
  const stepOnce = (u: Float64Array) => {
    const next = new Float64Array(N_CONF)
    for (let x = 0; x < N_CONF; x++) {
      if (u[x] === 0) continue
      for (let y = 0; y < N_CONF; y++) next[y] += u[x] * rows[x * N_CONF + y]
    }
    deMean(next)
    return next
  }
  for (let it = 0; it < 60; it++) {
    v = stepOnce(v)
    const n = norm(v)
    if (n > 0) for (let i = 0; i < N_CONF; i++) v[i] /= n
  }
  const WINDOW = 24
  let start = norm(v)
  let u = v
  for (let it = 0; it < WINDOW; it++) u = stepOnce(u)
  const slem = start > 0 ? Math.pow(norm(u) / start, 1 / WINDOW) : 0
  return { dobrushin: dob, slem }
}

/** Trajectory TV vs depth (t = 1..T), plus the drawn floor ε̄/(1−ρ_slem). */
export function floorCurve(p: KernelParams, T: number): { tvByDepth: Float64Array; epsBar: number; rho: number; bound: number } {
  const occ = chainOccupancies(p, T)
  const targ = targetOccupancies(T)
  const tvByDepth = new Float64Array(T)
  for (let t = 1; t <= T; t++) {
    const onGraph = new Float64Array(N_NODES)
    let off = 0
    for (let cfg = 0; cfg < N_CONF; cfg++) {
      const node = nodeOfConfig(cfg)
      if (node >= 0) onGraph[node] += occ[t * N_CONF + cfg]
      else off += occ[t * N_CONF + cfg]
    }
    let tv = off
    for (let i = 0; i < N_NODES; i++) tv += Math.abs(onGraph[i] - targ[t * N_NODES + i])
    tvByDepth[t - 1] = tv / 2
  }
  const epsBar = worstStepTV(p)
  const rho = chainContraction(p).slem
  return { tvByDepth, epsBar, rho, bound: rho < 1 ? epsBar / (1 - rho) : Infinity }
}
