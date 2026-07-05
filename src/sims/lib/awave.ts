// The waving connection — shared physics core for §9, the hero figure, and the
// Universal Wave Machine (articles/02-fiber-bundles/PLAN.md). One transverse
// component A(x,t) of the connection on a 1-D base, obeying (Lorenz gauge)
//   A_tt = c² A_xx
// solved by explicit central differences (leapfrog):
//   A^{n+1}_i = 2A^n_i − A^{n−1}_i + C²(A_{i+1} − 2A_i + A_{i−1})
// Stability: Courant number C = c·dt/dx ≤ 1 — default C = 0.5 by construction.
// At C = 1 exactly (the scheme's "magic timestep") leapfrog propagates the
// d'Alembert solution with zero dispersion — the periodic hero runs there so
// its pulse can loop forever without degrading.
// The observable fields are derivatives of A, computed here so every figure
// draws the same physics: E = −∂A/∂t (in-phase with B for a traveling wave),
// B = ∂A/∂x. No quarter-cycle "leapfrogging" myth — the panes must agree.

export const AWAVE_N = 200
export const AWAVE_FIXED_DT = 1 / 240

/** How the ends of the line behave — a sum type, dispatched once per step. */
export type AWaveBoundary = 'absorbing' | 'periodic'

export interface AWave {
  a: Float32Array
  e: Float32Array // −∂A/∂t, scaled
  b: Float32Array // ∂A/∂x, scaled
  /** Advance by wall-clock dt (internally fixed-stepped). */
  step(dt: number): void
  /** Add a smooth pulse to the connection at fractional position f. */
  pluck(f: number, amp: number): void
  /** Zero everything (used by Reset via create). */
}

export interface AWaveOpts {
  boundary?: AWaveBoundary
  /** Courant number c·dt/dx ∈ (0, 1]; 1 is exact (and still stable). */
  courant?: number
}

export function createAWave(seedPulse = true, opts: AWaveOpts = {}): AWave {
  const n = AWAVE_N
  const C = opts.courant ?? 0.5
  const boundary: AWaveBoundary = opts.boundary ?? 'absorbing'
  const a = new Float32Array(n)
  const aPrev = new Float32Array(n)
  const aNext = new Float32Array(n)
  const e = new Float32Array(n)
  const b = new Float32Array(n)

  const pulse = (f: number, amp: number, into: Float32Array, shift = 0) => {
    const center = f * (n - 1) + shift
    const hw = 14
    for (let i = 0; i < n; i++) {
      const d = i - center
      if (Math.abs(d) < hw) into[i] += amp * 0.5 * (1 + Math.cos((Math.PI * d) / hw))
    }
  }

  if (seedPulse) {
    // exact right-traveling seed: uPrev is the same pulse shifted C samples left
    pulse(0.25, 1, a)
    pulse(0.25, 1, aPrev, -C)
  }

  // One handler per boundary variant (types as control flow) — chosen once here,
  // never re-asked inside the step loop.
  const applyEnds: Record<AWaveBoundary, () => void> = {
    absorbing: () => {
      // open ends: first-order absorbing boundaries so pulses leave the stage
      aNext[0] = a[1] + ((C - 1) / (C + 1)) * (aNext[1] - a[0])
      aNext[n - 1] = a[n - 2] + ((C - 1) / (C + 1)) * (aNext[n - 2] - a[n - 1])
    },
    periodic: () => {
      // the line is a ring: neighbors wrap, and a traveling pulse loops forever
      const c2 = C * C
      aNext[0] = 2 * a[0] - aPrev[0] + c2 * (a[1] - 2 * a[0] + a[n - 1])
      aNext[n - 1] = 2 * a[n - 1] - aPrev[n - 1] + c2 * (a[0] - 2 * a[n - 1] + a[n - 2])
    },
  }
  const ends = applyEnds[boundary]

  let acc = 0
  const advance = () => {
    const c2 = C * C
    for (let i = 1; i < n - 1; i++) {
      aNext[i] = 2 * a[i] - aPrev[i] + c2 * (a[i + 1] - 2 * a[i] + a[i - 1])
    }
    ends()
    aPrev.set(a)
    a.set(aNext)
  }

  const endsB: Record<AWaveBoundary, () => void> = {
    absorbing: () => {
      b[0] = b[1]
      b[n - 1] = b[n - 2]
    },
    periodic: () => {
      b[0] = (a[1] - a[n - 1]) / 2
      b[n - 1] = (a[0] - a[n - 2]) / 2
    },
  }
  const fieldEnds = endsB[boundary]

  const refreshFields = () => {
    // E = −∂A/∂t (backward difference over the fixed step), B = ∂A/∂x (centered)
    for (let i = 0; i < n; i++) e[i] = -(a[i] - aPrev[i]) / C // scaled to match b
    for (let i = 1; i < n - 1; i++) b[i] = (a[i + 1] - a[i - 1]) / 2
    fieldEnds()
  }
  refreshFields()

  return {
    a,
    e,
    b,
    step(dt: number) {
      acc += dt
      let guard = 0
      while (acc >= AWAVE_FIXED_DT && guard < 8) {
        advance()
        acc -= AWAVE_FIXED_DT
        guard++
      }
      refreshFields()
    },
    pluck(f: number, amp: number) {
      pulse(f, amp, a)
      pulse(f, amp, aPrev) // zero initial velocity: the pluck splits both ways
    },
  }
}
