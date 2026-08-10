import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL, FONT_METER, INK, paneFrame } from '../lib/chrome'
import { PALETTE } from '../lib/palette'
import {
  buildChromatic,
  buildModel,
  countsToProbs,
  drawLayerRail,
  drawMeter,
  energy,
  enumerate,
  freshSpins,
  stateIndex,
  sweep,
  twoColorGrid,
  u01,
  type Edge,
  type PbitModel,
  type Schedule,
} from './lib'

// PLAN F13 (rev. 2) — the race. One frustrated problem, two parallel
// schedules, and the lesson's central verdict made visible in a single frame:
// the all-at-once sampler reaches the certified ground energy too — optimizing
// is the thing it does fine — while its meter pins an order of magnitude and
// more above the red/black floor. Optimization success is not sampling
// correctness, and only the meter can tell them apart.
//
// The problem is a 4×4 ±J spin glass — 16 spins, 65,536 states, small enough
// that `enumerate` certifies BOTH claims exactly: the true minimum energy
// (the dashed floor in each trace) and the exact Boltzmann weight of every
// energy level (the meter's ghost). The audited distribution is over energy
// levels, not raw states, so the sampled bars converge in seconds instead of
// starving across 65,536 columns; the ghost is still computed from the full
// joint, term by term.
//
// Tick fairness: the chip clock. All-at-once writes the whole lattice every
// tick (one sweep per tick); red/black needs two ticks per sweep. Both panes
// advance by ticks, so the race is fair in hardware time.
//
// Constants below were tuned headlessly (2026-08-05): β = 1.0, 25% ferro
// wires, J-seed 71 → E_min = −20, reached by BOTH schedules within tens of
// sweeps; energy-level TV ≈ 0.65 (synchronous) vs ≈ 0.03 (chromatic).

const GW = 4
const GH = 4
export const RACE_BETA = 1.0
const P_FERRO = 0.25
const J_SEED = 71
const RUN_SEED = 5
const TICKS_PER_SEC = 60
const TRACE_LEN = 240

export function raceGlassModel(): PbitModel {
  const edges: Edge[] = []
  let k = 0
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x
      if (x + 1 < GW) edges.push({ i, j: i + 1, J: u01(J_SEED, 0, k++, 0) < P_FERRO ? 1 : -1 })
      if (y + 1 < GH) edges.push({ i, j: i + GW, J: u01(J_SEED, 0, k++, 0) < P_FERRO ? 1 : -1 })
    }
  }
  return buildModel(GW * GH, new Float32Array(GW * GH), edges, RACE_BETA)
}

export interface RaceLevels {
  /** Energy of every joint state, indexed by stateIndex. */
  stateE: Float64Array
  /** Distinct energy levels, ascending — stateE quantized. */
  levels: number[]
  /** Level index of every joint state. */
  stateLevel: Int32Array
  /** Exact Boltzmann probability of each level (summed from the full joint). */
  exactHist: Float64Array
  /** The certified ground energy: levels[0]. */
  eMin: number
}

/** Exact energy-level structure of the race model, from full enumeration. */
export function raceLevels(m: PbitModel): RaceLevels {
  const size = 1 << m.n
  const stateE = new Float64Array(size)
  const s = new Int8Array(m.n)
  const seen = new Set<number>()
  for (let idx = 0; idx < size; idx++) {
    for (let k = 0; k < m.n; k++) s[k] = (idx >> k) & 1 ? 1 : -1
    stateE[idx] = energy(m, s)
    seen.add(stateE[idx])
  }
  const levels = [...seen].sort((a, b) => a - b)
  const lvlOf = new Map(levels.map((e, i) => [e, i]))
  const stateLevel = new Int32Array(size)
  for (let idx = 0; idx < size; idx++) stateLevel[idx] = lvlOf.get(stateE[idx])!
  const exact = enumerate(m)
  const exactHist = new Float64Array(levels.length)
  for (let idx = 0; idx < size; idx++) exactHist[stateLevel[idx]] += exact[idx]
  return { stateE, levels, stateLevel, exactHist, eMin: levels[0] }
}

export interface RaceProbe {
  synMinE: number
  chrMinE: number
  synTV: number
  chrTV: number
  sweeps: number
}

interface Runner {
  label: string
  sched: Schedule
  ticksPerSweep: number
  s: Int8Array
  sweepN: number
  counts: Float64Array
  minE: number
  trace: number[]
  best: number[]
}

export function createRace(probe?: RaceProbe): Stepper {
  const m = raceGlassModel()
  const lv = raceLevels(m)
  const chrom = buildChromatic(m, twoColorGrid(GW, GH), 2)
  const mkRunner = (label: string, sched: Schedule, ticksPerSweep: number): Runner => ({
    label,
    sched,
    ticksPerSweep,
    s: freshSpins(m, RUN_SEED),
    sweepN: 0,
    counts: new Float64Array(lv.levels.length),
    minE: Infinity,
    trace: [],
    best: [],
  })
  const runners: Runner[] = [
    mkRunner('all at once', { kind: 'synchronous' }, 1),
    mkRunner('red / black', chrom, 2),
  ]
  let tick = 0
  let acc = 0

  const advance = (r: Runner) => {
    r.sweepN++
    sweep(m, r.s, r.sched, (site, salt) => u01(RUN_SEED, r.sweepN, site, salt))
    const idx = stateIndex(r.s)
    const e = lv.stateE[idx]
    r.counts[lv.stateLevel[idx]]++
    if (e < r.minE) r.minE = e
    r.trace.push(e)
    r.best.push(r.minE)
    if (r.trace.length > TRACE_LEN) {
      r.trace.shift()
      r.best.shift()
    }
  }

  return {
    step(dt) {
      acc += dt * TICKS_PER_SEC
      acc = Math.min(acc, TICKS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        tick++
        for (const r of runners) if (tick % r.ticksPerSweep === 0) advance(r)
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const paneW = w / 2 - 12
      const eTop = lv.levels[lv.levels.length - 1]
      const tvs: number[] = []
      runners.forEach((r, k) => {
        const x0 = 8 + k * (paneW + 8)
        paneFrame(ctx, { x: x0, y: 24, w: paneW, h: h - 32 })
        ctx.font = FONT_METER
        ctx.fillStyle = INK
        ctx.textAlign = 'left'
        ctx.fillText(r.label, x0 + 10, 42)

        // the lattice, small — the racer itself
        const cell = 13
        const lx = x0 + 10
        const ly = 52
        for (let i = 0; i < m.n; i++) {
          ctx.fillStyle = r.s[i] > 0 ? PALETTE.sUp : PALETTE.sDn
          ctx.fillRect(lx + (i % GW) * cell, ly + Math.floor(i / GW) * cell, cell - 1, cell - 1)
        }

        // energy trace: instantaneous (faint) + best-so-far (bold) over the
        // certified ground line — the race, read left to right
        const tr = { x: lx + GW * cell + 14, y: 50, w: paneW - GW * cell - 40, h: 62 }
        // low energy DOWN — the race is a fall to the certified floor
        const yOf = (e: number) => tr.y + tr.h - ((e - lv.eMin) / (eTop - lv.eMin)) * tr.h
        ctx.strokeStyle = PALETTE.ghost
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(tr.x, yOf(lv.eMin))
        ctx.lineTo(tr.x + tr.w, yOf(lv.eMin))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        // below the floor line — no trace can ever reach down here
        ctx.fillText(`certified minimum ${lv.eMin}`, tr.x, yOf(lv.eMin) + 13)
        const plot = (ys: number[], alpha: number, width: number) => {
          if (ys.length < 2) return
          ctx.strokeStyle = INK
          ctx.globalAlpha = alpha
          ctx.lineWidth = width
          ctx.beginPath()
          ys.forEach((e, i) => {
            const x = tr.x + (i / (TRACE_LEN - 1)) * tr.w
            if (i === 0) ctx.moveTo(x, yOf(e))
            else ctx.lineTo(x, yOf(e))
          })
          ctx.stroke()
          ctx.globalAlpha = 1
        }
        plot(r.trace, 0.3, 1)
        plot(r.best, 1, 2)
        if (r.minE < Infinity) {
          ctx.font = FONT_METER
          ctx.fillStyle = INK
          ctx.textAlign = 'right'
          // narrow: 'lowest found' overprinted the pane title at 360px
          // (figure audit, 2026-08-11)
          ctx.fillText(w < 520 ? `low: ${r.minE}` : `lowest found: ${r.minE}`, tr.x + tr.w, tr.y + 10)
          ctx.textAlign = 'left'
        }

        // the meter, on the exact energy-level distribution
        const mr = { x: x0 + 12, y: 150, w: paneW - 24, h: h - 168 }
        const tv = drawMeter(ctx, mr, lv.exactHist, countsToProbs(r.counts), {
          samples: r.sweepN,
        })
        tvs.push(tv)
      })
      if (probe) {
        probe.synMinE = runners[0].minE
        probe.chrMinE = runners[1].minE
        probe.synTV = tvs[0]
        probe.chrTV = tvs[1]
        probe.sweeps = runners[1].sweepN
      }
    },
  }
}

export function Race() {
  const probe = useRef<RaceProbe>({ synMinE: 0, chrMinE: 0, synTV: 0, chrTV: 0, sweeps: 0 })
  return <Sim height={290} create={() => createRace(probe.current)} />
}
