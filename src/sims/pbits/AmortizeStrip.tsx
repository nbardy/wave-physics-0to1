import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { N_LEVELS, NV } from './denoise'
import { N_IN } from './denoiseCond'
import {
  disjointRegionPlan,
  PATCH_NODES,
  perSample,
  type ChainSpec,
  type SchedulePlan,
} from './part3lib'

// Part 3, PLAN F7 — the verdict strip. Three amortizations of the reflash
// wall on one canvas, against the naive schedule they repair:
//
//   batched      — loop reorder: T reflashes per batch of B, recurring
//   conditioned  — one kernel, all levels: ONE flash ever (τ-code clamped in,
//                  so its clamp events write 16+2 nodes — the honest wrinkle)
//   disjoint     — T kernels flashed once onto disjoint fabric regions:
//                  zero reflashes after setup, paid for in FABRIC
//
// The two axes of the trade sit side by side: cost per sample (left, bill
// ink) and fabric footprint in physical p-bits (right — the counter that
// prices disjoint's trade the other way). The knob is samples demanded S:
// the recurring schedules keep paying as S grows while the setup schedules
// amortize toward the floor. The verdict is printed, not implied: batched +
// conditioned wins the finale — near-cheapest at every S on ONE patch of
// fabric — and disjoint is deferred WITH ITS REGIME NAMED: it wins when T is
// small and fabric is idle. Measured wrinkle the check pins down (2026-08-25):
// at large S disjoint's per-sample cost actually edges out conditioned by a
// few percent, because the conditioned kernel's clamp events carry the two
// τ-code spins (18 nodes vs 16) while disjoint's specialists clamp bare
// evidence — but it pays T× the fabric to get there. The verdict text below
// states the trade, not a false sweep.
//
// All bars are arithmetic on the schedule model; the footprint comes from
// counting node sets on a real z1 graph (vertex-disjoint, check-asserted).

export const AS_SAMPLE_GRID: readonly number[] = [1, 2, 4, 8, 16, 32, 64]
export const AS_BATCH = 8 // the batched schedule's fixed batch size, stated on canvas
export const AS_SWEEPS = 6

const SPEC_CHAIN: ChainSpec = { levels: N_LEVELS, sweepsPerLevel: AS_SWEEPS, clampNodes: NV }
const COND_CHAIN: ChainSpec = { levels: N_LEVELS, sweepsPerLevel: AS_SWEEPS, clampNodes: N_IN }

export interface AmortizeRow {
  label: string
  plan: (samples: number) => SchedulePlan
  footprint: number
}

const DISJOINT_FOOTPRINT = disjointRegionPlan(N_LEVELS).footprint

export const AS_ROWS: AmortizeRow[] = [
  {
    label: 'naive',
    plan: (samples) => ({ kind: 'naive', chain: SPEC_CHAIN, samples }),
    footprint: PATCH_NODES,
  },
  {
    label: `batched (B=${AS_BATCH})`,
    plan: (samples) => ({ kind: 'batched', chain: SPEC_CHAIN, samples, batch: AS_BATCH }),
    footprint: PATCH_NODES,
  },
  {
    label: 'conditioned',
    plan: (samples) => ({ kind: 'conditioned', chain: COND_CHAIN, samples }),
    footprint: PATCH_NODES,
  },
  {
    label: `disjoint (T=${N_LEVELS})`,
    plan: (samples) => ({ kind: 'disjoint', chain: SPEC_CHAIN, samples }),
    footprint: DISJOINT_FOOTPRINT,
  },
]

export interface AmortizeShared {
  samplesIdx: number
}

export interface AmortizeProbe {
  samples: number
  perSample: number[] // by AS_ROWS order
  footprint: number[]
}

export function amortizeRegions(w: number, h: number): { cost: Rect; fabric: Rect } {
  const y = 58
  const paneH = h - y - 74
  return {
    cost: { x: 16, y, w: w * 0.56, h: paneH },
    fabric: { x: w * 0.62, y, w: w * 0.38 - 16, h: paneH },
  }
}

export function createAmortizeStrip(shared: { current: AmortizeShared }, probe?: AmortizeProbe): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const S = AS_SAMPLE_GRID[shared.current.samplesIdx]
      const ps = AS_ROWS.map((r) => perSample(r.plan(S)))
      if (probe) {
        probe.samples = S
        probe.perSample = ps
        probe.footprint = AS_ROWS.map((r) => r.footprint)
      }

      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(`the three amortizations · ${S} sample${S > 1 ? 's' : ''} demanded`, 16, 28)

      const { cost, fabric } = amortizeRegions(w, h)
      const rowH = cost.h / AS_ROWS.length

      // -- left: cost per sample -------------------------------------------
      paneFrame(ctx, cost)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('cost per sample (iteration-equivalents)', cost.x, cost.y - 4)
      const peak = Math.max(...ps)
      AS_ROWS.forEach((r, i) => {
        const y = cost.y + i * rowH
        const bw = (ps[i] / peak) * (cost.w - 190)
        ctx.fillStyle = PALETTE.bill
        ctx.globalAlpha = i === 0 ? 0.45 : 1
        ctx.fillRect(cost.x + 108, y + rowH * 0.24, Math.max(bw, 2), rowH * 0.5)
        ctx.globalAlpha = 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(r.label, cost.x + 4, y + rowH * 0.6)
        ctx.fillStyle = PALETTE.bill
        ctx.fillText(fmt(ps[i], 0), cost.x + 112 + Math.max(bw, 2), y + rowH * 0.6)
      })

      // -- right: fabric footprint ------------------------------------------
      paneFrame(ctx, fabric)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('fabric footprint (physical p-bits)', fabric.x, fabric.y - 4)
      const fpPeak = Math.max(...AS_ROWS.map((r) => r.footprint))
      AS_ROWS.forEach((r, i) => {
        const y = fabric.y + i * rowH
        const bw = (r.footprint / fpPeak) * (fabric.w - 70)
        ctx.fillStyle = PALETTE.anti
        ctx.fillRect(fabric.x + 8, y + rowH * 0.24, Math.max(bw, 2), rowH * 0.5)
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(String(r.footprint), fabric.x + 12 + Math.max(bw, 2), y + rowH * 0.6)
      })

      // -- the verdict, printed --------------------------------------------
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(
        `verdict: batched + conditioned — ${fmt(ps[2], 0)}/sample on one ${PATCH_NODES}-node patch.`,
        16,
        h - 46,
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        `disjoint buys zero reflashes for ${N_LEVELS}× the fabric (${DISJOINT_FOOTPRINT} p-bits) — its regime: few levels, idle fabric.`,
        16,
        h - 28,
      )
      ctx.fillStyle = 'rgba(85,96,111,0.75)'
      ctx.fillText(
        'modeled rates from verified constants (§II B, App. B) — not hardware measurements',
        16,
        h - 10,
      )
    },
  }
}

export function AmortizeStrip() {
  const [samplesIdx, setSamplesIdx] = useState(3)
  const shared = useRef<AmortizeShared>({ samplesIdx })
  shared.current.samplesIdx = samplesIdx

  return (
    <Sim height={330} animated={false} create={() => createAmortizeStrip(shared)}>
      <label className="sim-slider">
        <span>1 sample</span>
        <input
          type="range"
          min={0}
          max={AS_SAMPLE_GRID.length - 1}
          step={1}
          value={samplesIdx}
          onChange={(e) => setSamplesIdx(Number(e.target.value))}
        />
        <span>{AS_SAMPLE_GRID[AS_SAMPLE_GRID.length - 1]}</span>
      </label>
    </Sim>
  )
}
