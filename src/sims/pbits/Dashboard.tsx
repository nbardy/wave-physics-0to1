import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL, FONT_METER, INK, fmt } from '../lib/chrome'
import { PALETTE } from '../lib/palette'
import {
  buildChromatic,
  countsToProbs,
  drawLayerRail,
  enumerate,
  freshSpins,
  stateIndex,
  subModel,
  sweep,
  twoColorGrid,
  tvDistance,
  u01,
  type Schedule,
} from './lib'
import { buildFencedGrid, FENCED_INTERIOR, GRID_H, GRID_W } from './GridSchedules'

// PLAN F15 (rev. 2) — the dashboard. All three schedules run the same fenced
// 16×16 grid at once, and each is scored on three ORTHOGONAL columns:
//
//   writes/tick   — raw parallel width (the hardware brag);
//   samples/1k ticks — independent evidence per clock, from the measured
//                   autocorrelation of the audited patch (correlated sweeps
//                   are not fresh evidence, so this discounts them);
//   distance      — TV between the patch's running histogram and its exact
//                   conditional (the fenced-patch oracle, as in F11/F14).
//
// The gate: a row whose distance column fails has its first two columns drawn
// struck and dimmed — throughput and ESS are properties of the sampler you
// HAVE, and if it samples the wrong law they are speed and evidence toward
// the wrong answer. Synchronous posts a splendid samples/1k-ticks figure
// (its oscillation decorrelates fast) and it is the row that gets struck.
//
// Tick accounting (the chip clock): sequential writes 1 spin/tick → 248 ticks
// per sweep of the 248 free spins; chromatic writes one color class/tick →
// 2 ticks/sweep; synchronous writes everything → 1 tick/sweep.
//
// Dependence estimate: lag-1 autocorrelation ρ of the patch magnetization per
// sweep, integrated time τ = (1+ρ)/(1−ρ) clamped to ≥1 (an AR(1) reading —
// crude but honest for this observable, and stated as such in prose).

const SWEEPS_PER_SEC = 120
const OBS_WINDOW = 1024
const TV_GATE = 0.08

interface Runner {
  label: string
  sched: Schedule
  writes: number
  ticksPerSweep: number
  s: Int8Array
  sweepN: number
  counts: Float64Array
  obs: number[]
}

export interface DashboardProbe {
  /** Per schedule, in [sequential, chromatic, synchronous] order. */
  writes: number[]
  essPerKtick: number[]
  tv: number[]
}

function patchMag(s: Int8Array): number {
  let mSum = 0
  for (const site of FENCED_INTERIOR) mSum += s[site]
  return mSum
}

/** τ = (1+ρ)/(1−ρ) from lag-1 autocorrelation of the observable series. */
function integratedTau(obs: number[]): number {
  const n = obs.length
  if (n < 64) return Infinity // not enough evidence yet
  let mean = 0
  for (const v of obs) mean += v
  mean /= n
  let c0 = 0
  let c1 = 0
  for (let i = 0; i < n; i++) {
    const d = obs[i] - mean
    c0 += d * d
    if (i > 0) c1 += d * (obs[i - 1] - mean)
  }
  if (c0 === 0) return Infinity // frozen observable: no evidence at all
  const rho = Math.max(-0.999, Math.min(0.999, c1 / c0))
  return Math.max(1, (1 + rho) / (1 - rho))
}

export function createDashboard(probe?: DashboardProbe): Stepper {
  const m = buildFencedGrid()
  let free = 0
  for (let i = 0; i < m.n; i++) if (m.clamp[i] === 0) free++
  const colors = twoColorGrid(GRID_W, GRID_H)
  const chromatic = buildChromatic(m, colors, 2)
  let colorZero = 0
  for (let i = 0; i < m.n; i++) if (m.clamp[i] === 0 && colors[i] === 0) colorZero++

  const mk = (label: string, sched: Schedule, writes: number, ticksPerSweep: number): Runner => ({
    label,
    sched,
    writes,
    ticksPerSweep,
    s: freshSpins(m, 173),
    sweepN: 0,
    counts: new Float64Array(16),
    obs: [],
  })
  const runners: Runner[] = [
    mk('one at a time', { kind: 'sequential' }, 1, free),
    mk('red / black', chromatic, colorZero, 2),
    mk('all at once', { kind: 'synchronous' }, free, 1),
  ]
  const exact = enumerate(subModel(m, runners[0].s, FENCED_INTERIOR))
  let acc = 0

  return {
    step(dt) {
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        for (const r of runners) {
          r.sweepN++
          sweep(m, r.s, r.sched, (site, salt) => u01(211 + r.writes, r.sweepN, site, salt))
          r.counts[stateIndex(r.s, FENCED_INTERIOR)]++
          r.obs.push(patchMag(r.s))
          if (r.obs.length > OBS_WINDOW) r.obs.shift()
        }
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')

      const rows = runners.map((r) => {
        const tau = integratedTau(r.obs)
        const ess = Number.isFinite(tau) ? 1000 / (r.ticksPerSweep * tau) : 0
        const tv = tvDistance(exact, countsToProbs(r.counts))
        return { r, ess, tv }
      })
      if (probe) {
        probe.writes = rows.map((x) => x.r.writes)
        probe.essPerKtick = rows.map((x) => x.ess)
        probe.tv = rows.map((x) => x.tv)
      }

      const col = [
        { x: 150, w: 130, title: 'writes / tick', peak: Math.max(...rows.map((x) => x.r.writes)) },
        {
          x: 310,
          w: 130,
          title: 'samples / 1k ticks',
          peak: Math.max(1, ...rows.map((x) => x.ess)),
        },
        { x: 470, w: 130, title: 'distance from exact', peak: Math.max(...rows.map((x) => x.tv), 0.02) },
      ]
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      for (const c of col) ctx.fillText(c.title, c.x, 40)

      rows.forEach(({ r, ess, tv }, k) => {
        const y = 64 + k * 52
        ctx.font = FONT_METER
        ctx.fillStyle = INK
        ctx.fillText(r.label, 16, y + 14)
        const failed = tv > TV_GATE
        const bar = (c: (typeof col)[number], value: number, text: string, ink: string, gated: boolean) => {
          const bw = Math.max(2, (value / c.peak) * c.w)
          ctx.globalAlpha = gated ? 0.25 : 1
          ctx.fillStyle = ink
          ctx.fillRect(c.x, y, bw, 16)
          ctx.font = FONT_METER
          ctx.fillStyle = ink === PALETTE.meter && !gated ? INK : ink
          if (gated) ctx.fillStyle = INK
          ctx.fillText(text, c.x, y + 32)
          ctx.globalAlpha = 1
          if (gated) {
            // the strike: this number is real, and it does not count
            ctx.strokeStyle = '#dc2626'
            ctx.lineWidth = 1.6
            ctx.beginPath()
            ctx.moveTo(c.x - 4, y + 8)
            ctx.lineTo(c.x + c.w * 0.72, y + 8)
            ctx.stroke()
          }
        }
        bar(col[0], r.writes, `${r.writes}`, PALETTE.meter, failed)
        bar(col[1], ess, ess > 0 ? fmt(ess, 1) : '—', PALETTE.meter, failed)
        bar(col[2], tv, fmt(tv, 3), failed ? '#dc2626' : INK, false)
      })

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`red strike = distance above ${TV_GATE}`, 16, h - 12)
    },
  }
}

export function Dashboard() {
  const probe = useRef<DashboardProbe>({ writes: [], essPerKtick: [], tv: [] })
  return <Sim height={240} create={() => createDashboard(probe.current)} />
}
