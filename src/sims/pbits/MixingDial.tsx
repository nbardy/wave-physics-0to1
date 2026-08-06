import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import {
  buildModel,
  drawLayerRail,
  drawMeter,
  enumerate,
  freshSpins,
  sweep,
  u01,
  type Edge,
  type PbitModel,
} from './lib'

// Part 2, PLAN F11 — the mixing–expressivity dial (Thermalizers App. L as one
// knob; claims ledger in articles/06-z1-compiler/RESEARCH.md, J_max sweep
// line). One knob: the coupling cap J_max. A 4-spin fully-connected model is
// FIT to a fixed strongly-coupled target under the cap (projected gradient
// descent — couplings clipped to ±J_max after every step), then the fitted
// model's own Gibbs sampler is RUN and interrogated. Three readouts against
// the knob, every one measured, none sketched:
//
//   KL(target ‖ fitted)          — falls as the cap rises (capacity granted)
//   integrated autocorrelation τ — rises (the granted couplings are stiff)
//   effective samples per sweep  — collapses (= 1/τ; what a sweep now buys)
//
// KL is exact (enumeration on both sides — the lesson's oracle); τ and ESS
// come from a 40,000-sweep sequential-Gibbs run on the fitted model with the
// counter RNG, so every number is deterministic and the check script can hold
// the figure to the same values.

const N = 4
const BETA = 1
const TARGET_J = 0.9
const TARGET_H = [0.2, -0.1, 0.15, -0.05]

/** The cap grid the dial snaps to — top of the grid reaches the target's own J. */
export const MIX_CAPS: readonly number[] = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]

const PAIRS: ReadonlyArray<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
]

function edgesOf(J: ArrayLike<number>): Edge[] {
  return PAIRS.map(([i, j], k) => ({ i, j, J: Number(J[k]) }))
}

/** The fixed target: strong uniform ferro couplings + small tilting fields —
 *  bimodal enough that matching it demands the very couplings that mix slowly. */
export function mixTargetModel(): PbitModel {
  return buildModel(N, TARGET_H, edgesOf(new Array(6).fill(TARGET_J)), BETA)
}

// params p = [h0..h3, J01, J02, J03, J12, J13, J23]
function modelOf(p: Float64Array): PbitModel {
  return buildModel(N, p.subarray(0, 4), edgesOf(p.subarray(4)), BETA)
}

function klToTarget(target: Float64Array, p: Float64Array): number {
  const m = enumerate(modelOf(p))
  let kl = 0
  for (let i = 0; i < target.length; i++) {
    kl += target[i] * Math.log(target[i] / Math.max(m[i], 1e-300))
  }
  return kl
}

const FD_EPS = 1e-4
const FIT_ITERS = 300
const FIT_LR = 0.4

/** Fit under the cap. The FD loop copies walkCompile.ts's fitting pattern
 *  (frozen base per iteration, full gradient applied in one step — updating
 *  in place against a stale base diverges, found there 2026-08-05); the cap
 *  enters as projection: couplings clipped to ±J_max after every step. */
export function fitUnderCap(cap: number): Float64Array {
  const target = enumerate(mixTargetModel())
  const p = new Float64Array(10)
  for (let it = 0; it < FIT_ITERS; it++) {
    const base = klToTarget(target, p)
    const grad = new Float64Array(10)
    for (let k = 0; k < 10; k++) {
      const keep = p[k]
      p[k] = keep + FD_EPS
      grad[k] = (klToTarget(target, p) - base) / FD_EPS
      p[k] = keep
    }
    for (let k = 0; k < 10; k++) p[k] -= FIT_LR * grad[k]
    for (let k = 4; k < 10; k++) p[k] = Math.max(-cap, Math.min(cap, p[k]))
  }
  return p
}

const MEASURE_SWEEPS = 40_000
const BURN_SWEEPS = 2_000
const MAX_LAG = 1_500

/** Integrated autocorrelation time of the magnetization, from an actual
 *  sequential-Gibbs run: τ = 1 + 2·Σρ(t), summed to the first non-positive
 *  ρ (the standard initial-positive-sequence window). Deterministic seed. */
export function measureMixing(p: Float64Array, seed = 17): { tau: number; ess: number } {
  const m = modelOf(p)
  const s = freshSpins(m, seed)
  const series = new Float64Array(MEASURE_SWEEPS)
  for (let t = 1; t <= BURN_SWEEPS + MEASURE_SWEEPS; t++) {
    sweep(m, s, { kind: 'sequential' }, (site, salt) => u01(seed, t, site, salt))
    if (t > BURN_SWEEPS) {
      let mag = 0
      for (let i = 0; i < N; i++) mag += s[i]
      series[t - BURN_SWEEPS - 1] = mag
    }
  }
  let mean = 0
  for (let i = 0; i < series.length; i++) mean += series[i]
  mean /= series.length
  let c0 = 0
  for (let i = 0; i < series.length; i++) c0 += (series[i] - mean) ** 2
  c0 /= series.length
  if (c0 === 0) throw new Error('measureMixing: frozen chain — magnetization never moved')
  let tau = 1
  for (let lag = 1; lag <= MAX_LAG; lag++) {
    let c = 0
    for (let i = 0; i + lag < series.length; i++) c += (series[i] - mean) * (series[i + lag] - mean)
    c /= series.length - lag
    const rho = c / c0
    if (rho <= 0) break
    tau += 2 * rho
  }
  return { tau, ess: 1 / tau }
}

export interface MixPoint {
  cap: number
  kl: number
  tau: number
  ess: number
  /** The fitted model's exact distribution (16 states) — the meter's bars. */
  dist: Float64Array
}

const pointCache = new Map<number, MixPoint>()

/** Fit + measure at one cap, cached — the check script and the figure share it. */
export function mixPoint(cap: number): MixPoint {
  const hit = pointCache.get(cap)
  if (hit) return hit
  const p = fitUnderCap(cap)
  const target = enumerate(mixTargetModel())
  const { tau, ess } = measureMixing(p)
  const point: MixPoint = { cap, kl: klToTarget(target, p), tau, ess, dist: enumerate(modelOf(p)) }
  pointCache.set(cap, point)
  return point
}

export interface MixShared {
  capIdx: number
}

export interface MixProbe {
  kl: number
  tau: number
  ess: number
}

export function createMixingDial(shared: { current: MixShared }, probe?: MixProbe): Stepper {
  const target = enumerate(mixTargetModel())
  // grid points fill in lazily, current cap first — each is a real fit + run
  const pending = () => MIX_CAPS.filter((c) => !pointCache.has(c))

  return {
    step() {
      const want = MIX_CAPS[shared.current.capIdx]
      if (!pointCache.has(want)) mixPoint(want)
      else {
        const rest = pending()
        if (rest.length > 0) mixPoint(rest[0])
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const cap = MIX_CAPS[shared.current.capIdx]
      const cur = pointCache.get(cap)

      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(`coupling cap J_max = ${fmt(cap, 2)}`, 16, 24)

      // left: the fit itself — target ghost vs fitted model's exact bars
      const mr: Rect = { x: 16, y: 46, w: w * 0.42, h: h - 100 }
      if (cur) {
        drawMeter(ctx, mr, target, cur.dist, { label: 'fit' })
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('target (ghost) vs model fit under the cap (exact)', mr.x, mr.y + mr.h + 16)
        if (probe) {
          probe.kl = cur.kl
          probe.tau = cur.tau
          probe.ess = cur.ess
        }
      } else {
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('fitting under the cap…', mr.x, mr.y + 20)
      }

      // right: the three readouts vs the whole cap grid
      const quantities: Array<{
        label: string
        of: (pt: MixPoint) => number
        ink: string
        log: boolean
      }> = [
        { label: 'KL(target ‖ fit)', of: (pt) => pt.kl, ink: PALETTE.meter, log: false },
        { label: 'autocorrelation time τ (sweeps)', of: (pt) => pt.tau, ink: PALETTE.ferro, log: true },
        { label: 'effective samples per sweep = 1/τ', of: (pt) => pt.ess, ink: PALETTE.anti, log: true },
      ]
      const px0 = w * 0.48
      const paneH = (h - 66) / 3
      const points = MIX_CAPS.map((c) => pointCache.get(c)).filter((p): p is MixPoint => !!p)
      quantities.forEach((q, qi) => {
        const r: Rect = { x: px0, y: 40 + qi * paneH, w: w - px0 - 16, h: paneH - 26 }
        paneFrame(ctx, r)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.95)'
        ctx.fillText(q.label, r.x, r.y - 4)
        if (points.length > 0) {
          const vals = points.map((pt) => (q.log ? Math.log(q.of(pt)) : q.of(pt)))
          let lo = Math.min(...vals)
          let hi = Math.max(...vals)
          if (hi - lo < 1e-9) {
            hi += 1
            lo -= 1
          }
          const xOf = (c: number) =>
            r.x + 8 + ((c - MIX_CAPS[0]) / (MIX_CAPS[MIX_CAPS.length - 1] - MIX_CAPS[0])) * (r.w - 16)
          const yOf = (v: number) => r.y + 6 + (1 - (v - lo) / (hi - lo)) * (r.h - 12)
          ctx.strokeStyle = q.ink
          ctx.lineWidth = 1.6
          ctx.beginPath()
          points.forEach((pt, i) => {
            const x = xOf(pt.cap)
            const y = yOf(q.log ? Math.log(q.of(pt)) : q.of(pt))
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
          for (const pt of points) {
            ctx.beginPath()
            ctx.arc(xOf(pt.cap), yOf(q.log ? Math.log(q.of(pt)) : q.of(pt)), pt.cap === cap ? 4.5 : 2.5, 0, Math.PI * 2)
            ctx.fillStyle = q.ink
            ctx.fill()
          }
        }
        if (cur) {
          ctx.font = FONT_METER
          ctx.fillStyle = q.ink
          ctx.textAlign = 'right'
          const v = q.of(cur)
          ctx.fillText(v >= 100 ? fmt(v, 0) : v >= 1 ? fmt(v, 1) : fmt(v, 3), r.x + r.w - 6, r.y + 16)
          ctx.textAlign = 'left'
        }
      })
    },
  }
}

export function MixingDial() {
  const [capIdx, setCapIdx] = useState(0)
  const shared = useRef<MixShared>({ capIdx })
  shared.current.capIdx = capIdx

  return (
    <Sim height={330} create={() => createMixingDial(shared)}>
      <label className="sim-slider">
        <span>tight cap</span>
        <input
          type="range"
          min={0}
          max={MIX_CAPS.length - 1}
          step={1}
          value={capIdx}
          onChange={(e) => setCapIdx(Number(e.target.value))}
        />
        <span>loose</span>
      </label>
    </Sim>
  )
}
