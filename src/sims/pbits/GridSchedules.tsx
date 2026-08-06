import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame } from '../lib/chrome'
import {
  buildChromatic,
  countsToProbs,
  drawLayerRail,
  drawMeter,
  enumerate,
  freshSpins,
  gridModel,
  stateIndex,
  subModel,
  sweep,
  twoColorGrid,
  u01,
  type Schedule,
} from './lib'

// PLAN F11/F14 — the grid and its schedules. A 16×16 lattice runs live under
// the chosen schedule. At its center, a fenced 2×2 patch whose eight outside
// neighbors are held (halos) — a domain wall runs through the fence, so the
// patch stays honestly undecided. Because the fence is held, the patch's exact
// conditional distribution is computable, and the meter audits the running
// schedule against it. Sequential sits at the floor; all-at-once pins high
// while the lattice itself blinks; chromatic (when offered) rejoins the floor
// at parallel speed.

// Exported for Dashboard.tsx (F15): one fenced grid, defined once.
export const GRID_W = 16
export const GRID_H = 16
const GW = GRID_W
const GH = GRID_H
const BETA = 0.45
const SWEEPS_PER_SEC = 240

// The fenced patch: 2×2 interior, its 8 grid-neighbors clamped across a
// vertical domain wall (west of the wall up, east down).
const IX = 7
const IY = 7
export const FENCED_INTERIOR: number[] = [
  IY * GW + IX,
  IY * GW + IX + 1,
  (IY + 1) * GW + IX,
  (IY + 1) * GW + IX + 1,
]
const FENCE: Array<{ site: number; value: 1 | -1 }> = [
  { site: IY * GW + IX - 1, value: 1 },
  { site: (IY + 1) * GW + IX - 1, value: 1 },
  { site: IY * GW + IX + 2, value: -1 },
  { site: (IY + 1) * GW + IX + 2, value: -1 },
  { site: (IY - 1) * GW + IX, value: 1 },
  { site: (IY - 1) * GW + IX + 1, value: -1 },
  { site: (IY + 2) * GW + IX, value: 1 },
  { site: (IY + 2) * GW + IX + 1, value: -1 },
]

export function buildFencedGrid() {
  const clamp = new Int8Array(GW * GH)
  for (const { site, value } of FENCE) clamp[site] = value
  return gridModel(GW, GH, 1, BETA, clamp)
}

export type GridScheduleKind = 'sequential' | 'synchronous' | 'chromatic'

export interface GridShared {
  schedule: GridScheduleKind
}

export interface GridProbe {
  tv: number
  samples: number
}

export function createGridSchedules(
  shared: { current: GridShared },
  probe?: GridProbe,
  seed = 97,
): Stepper {
  const m = buildFencedGrid()
  const s = freshSpins(m, seed)
  // the fence is clamped, so the patch's conditional target never moves
  const exact = enumerate(subModel(m, s, FENCED_INTERIOR))
  const chromatic = buildChromatic(m, twoColorGrid(GW, GH), 2)
  let counts = new Float64Array(16)
  let sweepN = 0
  let acc = 0
  let lastSchedule = shared.current.schedule

  const scheduleOf = (k: GridScheduleKind): Schedule =>
    k === 'chromatic' ? chromatic : { kind: k }

  return {
    step(dt) {
      if (shared.current.schedule !== lastSchedule) {
        lastSchedule = shared.current.schedule
        counts = new Float64Array(16) // new experiment, fresh evidence
      }
      const sched = scheduleOf(shared.current.schedule)
      acc += dt * SWEEPS_PER_SEC
      // cap the debt so a background tab doesn't demand thousands of sweeps
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        sweep(m, s, sched, (site, salt) => u01(seed, sweepN, site, salt))
        counts[stateIndex(s, FENCED_INTERIOR)]++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')

      // the lattice
      const cell = Math.min((w * 0.52) / GW, (h - 60) / GH)
      const gx = 20
      const gy = 34
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x
          ctx.fillStyle = s[i] > 0 ? PALETTE.sUp : PALETTE.sDn
          ctx.globalAlpha = 0.85
          ctx.fillRect(gx + x * cell, gy + y * cell, cell - 1, cell - 1)
          ctx.globalAlpha = 1
        }
      }
      // halos on the fence, and the audited patch outlined
      for (const { site } of FENCE) {
        const x = site % GW
        const y = Math.floor(site / GW)
        ctx.strokeStyle = PALETTE.held
        ctx.lineWidth = 2
        ctx.strokeRect(gx + x * cell + 1, gy + y * cell + 1, cell - 3, cell - 3)
      }
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 2
      ctx.strokeRect(gx + IX * cell - 1, gy + IY * cell - 1, cell * 2 + 1, cell * 2 + 1)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the fenced patch is the auditable corner', gx, gy + GH * cell + 16)

      // the meter on the patch's 16 states
      const mr = { x: w * 0.6, y: 40, w: w * 0.36, h: h - 96 }
      paneFrame(ctx, { x: mr.x - 8, y: mr.y - 10, w: mr.w + 16, h: mr.h + 24 })
      let total = 0
      for (let i = 0; i < counts.length; i++) total += counts[i]
      const tv = drawMeter(ctx, mr, exact, countsToProbs(counts), { samples: total })
      if (probe) {
        probe.tv = tv
        probe.samples = total
      }
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(
        `${(SWEEPS_PER_SEC * GW * GH).toLocaleString()} cell updates/sec`,
        w * 0.6 - 8,
        26,
      )
    },
  }
}

const LABEL: Record<GridScheduleKind, string> = {
  sequential: 'one at a time',
  synchronous: 'all at once',
  chromatic: 'red / black',
}

export function GridSchedules({ chromatic = false }: { chromatic?: boolean }) {
  const kinds: GridScheduleKind[] = chromatic
    ? ['sequential', 'synchronous', 'chromatic']
    : ['sequential', 'synchronous']
  const [schedule, setSchedule] = useState<GridScheduleKind>('sequential')
  const shared = useRef<GridShared>({ schedule })
  shared.current.schedule = schedule

  return (
    <Sim height={320} create={() => createGridSchedules(shared)}>
      {kinds.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setSchedule(k)}
          style={schedule === k ? { fontWeight: 700 } : undefined}
        >
          {LABEL[k]}
        </button>
      ))}
    </Sim>
  )
}
