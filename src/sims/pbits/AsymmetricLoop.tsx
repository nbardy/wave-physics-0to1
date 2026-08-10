import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK, drawArrow, fmt } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'

// Part 2, PLAN F5 — the fenced curiosity. Z1's programming model is
// directional: "each node supports two different couplings per edge (one per
// direction)" (Thermalizers §II B, VERIFIED). This figure is the one place
// the series turns that knob. A 5-spin ring with J_{u→v} ≠ J_{v→u} has no
// scalar energy; its Gibbs dynamics break detailed balance, and the broken
// symmetry is MEASURED, not asserted: the cycle-flux meter totals the net
// probability current around oriented flip-squares of the state space,
// straight from transition counts. Symmetric mode reads ≈ 0 (and its state
// histogram sits on lib's exact Boltzmann law — the check holds it there);
// asymmetric mode reads visibly nonzero.
//
// The sweep handler lives HERE, not in lib (lib.ts is frozen, and its
// handlers assume a symmetric edge list): a random-scan single-site update
// whose local field reads the INCOMING weights W[u→v]. In symmetric mode
// this is exactly Glauber dynamics for the ring Ising model; in asymmetric
// mode it is a perfectly well-defined Markov chain that is simply not
// reversible — which is the entire point of the figure.
//
// VERIFIED facts on the label (Thermalizers §II B): a stationary law exists
// (all couplings finite) but "generally does not admit a closed-form
// expression"; detailed balance is broken; a training rule "appears
// intractable". One figure, then retired.

export const RING_N = 5
export const RING_BETA = 0.7
const N_STATES = 1 << RING_N

export type CouplingMode = 'symmetric' | 'asymmetric'

/** Directional weights, W[u*RING_N + v] = coupling from u INTO v's field. */
export function ringWeights(mode: CouplingMode): Float64Array {
  const W = new Float64Array(RING_N * RING_N)
  for (let i = 0; i < RING_N; i++) {
    const j = (i + 1) % RING_N
    if (mode === 'symmetric') {
      W[i * RING_N + j] = 0.6
      W[j * RING_N + i] = 0.6
    } else {
      W[i * RING_N + j] = 1.1 // clockwise push
      W[j * RING_N + i] = -0.7 // counter-clockwise pull the other way
    }
  }
  return W
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

/** Local field at site v: the INCOMING weights only (h = 0 on this ring). */
export function asymField(W: Float64Array, s: Int8Array, v: number): number {
  let f = 0
  for (let u = 0; u < RING_N; u++) f += W[u * RING_N + v] * s[u]
  return f
}

const cfgOf = (s: Int8Array): number => {
  let c = 0
  for (let k = 0; k < RING_N; k++) if (s[k] > 0) c |= 1 << k
  return c
}

/** One random-scan single-site update; returns the new configuration. */
export function asymUpdate(W: Float64Array, s: Int8Array, seed: number, t: number): number {
  const i = Math.min(RING_N - 1, Math.floor(u01(seed, t, 0, 0) * RING_N))
  const pPlus = sigmoid(2 * RING_BETA * asymField(W, s, i))
  s[i] = u01(seed, t, 1, 0) < pPlus ? 1 : -1
  return cfgOf(s)
}

/**
 * The cycle-flux meter, from transition counts. For every ring-adjacent pair
 * (i, i+1) and every rest-configuration of the other spins, the four states
 * {−−, +−, ++, −+} form an oriented square in flip space; the antisymmetric
 * empirical current c(X→Y) = (N(X→Y) − N(Y→X)) / total is summed around each
 * square with a consistent orientation. Under detailed balance every edge
 * current vanishes in expectation, so the total reads ≈ 0; a nonzero total
 * is direct evidence of stationary probability current — no energy exists.
 */
export function ringFluxFromCurrents(current: (a: number, b: number) => number): number {
  let flux = 0
  for (let i = 0; i < RING_N; i++) {
    const j = (i + 1) % RING_N
    const bi = 1 << i
    const bj = 1 << j
    for (let m = 0; m < N_STATES; m++) {
      if (m & bi || m & bj) continue // m ranges over rest-configs only
      const A = m
      const B = m | bi
      const C = m | bi | bj
      const D = m | bj
      flux += current(A, B) + current(B, C) + current(C, D) + current(D, A)
    }
  }
  return flux
}

export function measuredRingFlux(counts: Float64Array, total: number): number {
  if (total === 0) return 0
  return ringFluxFromCurrents((a, b) => (counts[a * N_STATES + b] - counts[b * N_STATES + a]) / total)
}

/** The exact random-scan transition matrix P[a*32+b] of one update. */
export function asymTransitionMatrix(W: Float64Array): Float64Array {
  const P = new Float64Array(N_STATES * N_STATES)
  const s = new Int8Array(RING_N)
  for (let a = 0; a < N_STATES; a++) {
    for (let k = 0; k < RING_N; k++) s[k] = (a >> k) & 1 ? 1 : -1
    for (let i = 0; i < RING_N; i++) {
      const pPlus = sigmoid(2 * RING_BETA * asymField(W, s, i))
      const up = a | (1 << i)
      const dn = a & ~(1 << i)
      P[a * N_STATES + up] += pPlus / RING_N
      P[a * N_STATES + dn] += (1 - pPlus) / RING_N
    }
  }
  return P
}

/** Stationary law of the update chain, by power iteration (exact enough). */
export function asymStationary(P: Float64Array): Float64Array {
  let pi = new Float64Array(N_STATES).fill(1 / N_STATES)
  for (let it = 0; it < 4000; it++) {
    const next = new Float64Array(N_STATES)
    for (let a = 0; a < N_STATES; a++) {
      if (pi[a] === 0) continue
      for (let b = 0; b < N_STATES; b++) next[b] += pi[a] * P[a * N_STATES + b]
    }
    pi = next
  }
  return pi
}

/** The flux the counts converge to: exact stationary currents π(a)P(a→b) − π(b)P(b→a). */
export function exactRingFlux(W: Float64Array): number {
  const P = asymTransitionMatrix(W)
  const pi = asymStationary(P)
  return ringFluxFromCurrents(
    (a, b) => pi[a] * P[a * N_STATES + b] - pi[b] * P[b * N_STATES + a],
  )
}

// --- the figure -------------------------------------------------------------

const UPDATES_PER_SEC = 30_000

export interface AsymShared {
  mode: CouplingMode
}

export interface AsymProbe {
  updates: number
  /** measured flux, per-update units (multiply by FLUX_SCALE for the printed number) */
  flux: number
  /** state-visit histogram over the 32 configurations (counts) */
  hist: Float64Array
}

export function createAsymmetricLoop(shared: { current: AsymShared }, probe?: AsymProbe): Stepper {
  let mode = shared.current.mode
  let W = ringWeights(mode)
  const s = Int8Array.from({ length: RING_N }, (_, i) => (u01(17, 0, i, 3) < 0.5 ? -1 : 1))
  let cfg = cfgOf(s)
  let counts = new Float64Array(N_STATES * N_STATES)
  let hist = new Float64Array(N_STATES)
  let t = 0
  let updates = 0
  let flux = 0

  const reset = () => {
    W = ringWeights(mode)
    counts = new Float64Array(N_STATES * N_STATES)
    hist = new Float64Array(N_STATES)
    updates = 0
    flux = 0
  }

  const publish = () => {
    flux = measuredRingFlux(counts, updates)
    if (probe) {
      probe.updates = updates
      probe.flux = flux
      probe.hist = hist
    }
  }

  return {
    step(dt) {
      if (shared.current.mode !== mode) {
        mode = shared.current.mode
        reset()
      }
      const n = Math.min(Math.round(dt * UPDATES_PER_SEC), 120_000)
      for (let k = 0; k < n; k++) {
        t++
        const prev = cfg
        cfg = asymUpdate(W, s, 23, t)
        counts[prev * N_STATES + cfg]++
        hist[cfg]++
        updates++
      }
      if (n > 0) publish()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const cx = w * 0.22
      const cy = 30 + (h - 70) / 2
      const r = Math.min(w * 0.14, (h - 90) / 2)
      const pos = Array.from({ length: RING_N }, (_, k) => {
        const ang = -Math.PI / 2 + (k * 2 * Math.PI) / RING_N
        return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)] as [number, number]
      })

      // two directed arrows per wire, offset to either side of the chord
      for (let i = 0; i < RING_N; i++) {
        const j = (i + 1) % RING_N
        const [x0, y0] = pos[i]
        const [x1, y1] = pos[j]
        const len = Math.hypot(x1 - x0, y1 - y0)
        const nx = -(y1 - y0) / len
        const ny = (x1 - x0) / len
        const trim = 14 / len
        const arrow = (from: [number, number], to: [number, number], J: number, side: number) => {
          const ox = nx * 4 * side
          const oy = ny * 4 * side
          const ax = from[0] + (to[0] - from[0]) * trim + ox
          const ay = from[1] + (to[1] - from[1]) * trim + oy
          const bx = to[0] - (to[0] - from[0]) * trim + ox
          const by = to[1] - (to[1] - from[1]) * trim + oy
          drawArrow(ctx, ax, ay, bx, by, J >= 0 ? PALETTE.ferro : PALETTE.anti, 0.8 + 1.8 * Math.abs(J))
        }
        arrow(pos[i], pos[j], W[i * RING_N + j], 1)
        arrow(pos[j], pos[i], W[j * RING_N + i], -1)
      }
      for (let k = 0; k < RING_N; k++) {
        const [x, y] = pos[k]
        ctx.beginPath()
        ctx.arc(x, y, 11, 0, Math.PI * 2)
        ctx.fillStyle = s[k] > 0 ? PALETTE.sUp : PALETTE.sDn
        ctx.fill()
      }

      // the cycle-flux meter: a circular arrow at the ring's center. The
      // directional arc only appears above the sampling-noise floor —
      // symmetric mode's measured flux is ~5e-4 (600k updates) while the
      // asymmetric stationary flux is 0.416, so 0.02 cleanly separates them.
      const mag = Math.min(Math.abs(flux) * 30, 12)
      const fr = r * 0.42
      if (Math.abs(flux) > 0.02) {
        const dir = flux > 0 ? 1 : -1
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 1.5 + mag * 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, fr, -Math.PI * 0.4, Math.PI, dir < 0)
        ctx.stroke()
        const endAng = dir < 0 ? -Math.PI * 0.4 : Math.PI
        const ex = cx + fr * Math.cos(endAng)
        const ey = cy + fr * Math.sin(endAng)
        const tx = -Math.sin(endAng) * dir
        const ty = Math.cos(endAng) * dir
        drawArrow(ctx, ex - tx * 12, ey - ty * 12, ex + tx * 2, ey + ty * 2, PALETTE.meter, 1.5 + mag * 0.5)
      } else {
        ctx.strokeStyle = PALETTE.meter
        ctx.globalAlpha = 0.4
        ctx.setLineDash([3, 4])
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(cx, cy, fr, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }

      // readouts
      const tx = w * 0.46
      ctx.textAlign = 'left'
      // Mobile guard (figure audit, 2026-08-11): the full fact lines ran
      // ~180px past a 360px canvas. Narrow canvases carry the same facts in
      // shorter clothes.
      const narrow = w < 520
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(narrow ? `cycle flux: ${fmt(flux, 3)}/update` : `cycle flux: ${fmt(flux, 3)} per update`, tx, 56)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        narrow
          ? `${Math.round(updates).toLocaleString()} transitions`
          : `net current around the ring's flip-squares, from ${Math.round(updates).toLocaleString()} transitions`,
        tx,
        72,
      )

      ctx.font = FONT_METER
      ctx.fillStyle = INK
      if (shared.current.mode === 'asymmetric') {
        ctx.fillText(narrow ? 'J→ ≠ J← : two couplings/wire' : 'J→ ≠ J← : two couplings per wire, one per direction', tx, 108)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        if (narrow) {
          ctx.fillText('stationary law: no closed form', tx, 128)
          ctx.fillText('detailed balance: broken', tx, 144)
          ctx.fillText('training: "appears intractable"', tx, 160)
          ctx.fillText('(Thermalizers §II B)', tx, 176)
        } else {
          ctx.fillText('stationary law: exists — closed form: none', tx, 128)
          ctx.fillText('detailed balance: broken — no scalar energy', tx, 144)
          ctx.fillText('training such a model: "appears intractable"', tx, 160)
          ctx.fillText('(Thermalizers §II B)', tx, 176)
        }
      } else {
        ctx.fillText(narrow ? 'J→ = J← : one coupling/wire' : 'J→ = J← : one coupling per wire, both directions', tx, 108)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        if (narrow) {
          ctx.fillText('detailed balance holds', tx, 128)
          ctx.fillText('flux settles to zero', tx, 144)
          ctx.fillText('Part 1 applies unchanged', tx, 160)
        } else {
          ctx.fillText('detailed balance holds — flux settles to zero', tx, 128)
          ctx.fillText('everything Part 1 proved applies unchanged', tx, 144)
        }
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('arrow weight = |J| · red J > 0 · teal J < 0', 20, h - 10)
    },
  }
}

export function AsymmetricLoop() {
  const [mode, setMode] = useState<CouplingMode>('asymmetric')
  const shared = useRef<AsymShared>({ mode })
  shared.current.mode = mode

  return (
    <Sim height={280} create={() => createAsymmetricLoop(shared)}>
      {(['symmetric', 'asymmetric'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          style={mode === m ? { fontWeight: 700 } : undefined}
        >
          {m === 'symmetric' ? 'J→ = J←' : 'J→ ≠ J←'}
        </button>
      ))}
    </Sim>
  )
}
