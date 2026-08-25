import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { N_LEVELS, NV } from './denoise'
import { N_IN, TAU_SPINS } from './denoiseCond'
import {
  drawBillStrip,
  floorBill,
  scheduleBill,
  type ChainSpec,
  REFLASH_ITERS,
  CLAMP_ITERS_PER_NODE,
} from './part3lib'

// Part 3, PLAN F5 — the floor is the clamps. The conditioned kernel bought
// the best possible reflash line: ONE flash, ever. This figure prices that
// schedule honestly and watches the bill's floor emerge: as the one setup
// flash amortizes over the samples produced (left pane, 1/S), what remains
// per sample is the part no schedule escapes — re-clamping the evidence x_t
// (plus the two τ-code spins riding along) at every level, flash-priced per
// node, with sweeps and readouts underneath. The right pane decomposes that
// floor, and the headline is the measured share: the clamps own it.
//
// The knob is sweeps-per-level — the only line item the reader can inflate —
// and the claim survives it: drive sweeps two orders of magnitude past the
// dream default and the clamp item still holds the majority of the floor.
// Pure arithmetic on the schedule model; the check holds every band to the
// closed forms and drives the knob to both ends.

export const CF_SWEEP_GRID: readonly number[] = [6, 12, 24, 60, 120, 300, 600]
export const CF_MAX_SAMPLES = 64

export function cfChain(sweepsPerLevel: number): ChainSpec {
  return { levels: N_LEVELS, sweepsPerLevel, clampNodes: N_IN }
}

export interface ClampFloorShared {
  sweepsIdx: number
}

export interface ClampFloorProbe {
  sweepsPerLevel: number
  floorTotal: number
  clampShare: number
  perSampleAt1: number
  perSampleAt64: number
}

export function clampFloorRegions(w: number, h: number): { amort: Rect; decomp: Rect } {
  const y = 64
  const paneH = h - y - 92
  return {
    amort: { x: 16, y, w: w * 0.54, h: paneH },
    decomp: { x: w * 0.6, y, w: w * 0.4 - 16, h: paneH },
  }
}

export function createClampFloor(shared: { current: ClampFloorShared }, probe?: ClampFloorProbe): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const k = CF_SWEEP_GRID[shared.current.sweepsIdx]
      const chain = cfChain(k)
      const floor = floorBill(chain)
      const clampShare = floor.clampIters / floor.total
      const psAt = (S: number) => scheduleBill({ kind: 'conditioned', chain, samples: S }).total / S
      if (probe) {
        probe.sweepsPerLevel = k
        probe.floorTotal = floor.total
        probe.clampShare = clampShare
        probe.perSampleAt1 = psAt(1)
        probe.perSampleAt64 = psAt(CF_MAX_SAMPLES)
      }

      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(
        `conditioned schedule: one flash ever · ${k} sweeps per level · clamp = ${NV}+${TAU_SPINS} nodes × ${fmt(CLAMP_ITERS_PER_NODE, 1)} per level`,
        16,
        w < 520 ? 40 : 28,
      )

      const { amort, decomp } = clampFloorRegions(w, h)

      // -- left: per-sample bill vs samples produced — the wedge collapses --
      paneFrame(ctx, amort)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('per-sample bill as the one flash amortizes (samples produced →)', amort.x, amort.y - 4)
      const top = psAt(1) * 1.05
      const xOf = (S: number) => amort.x + 8 + (Math.log2(S) / Math.log2(CF_MAX_SAMPLES)) * (amort.w - 16)
      const yOf = (v: number) => amort.y + 6 + (1 - v / top) * (amort.h - 26)
      // stacked bands at S = 1, 2, 4, … 64: floor components solid, the
      // amortizing reflash wedge above them in pale bill ink
      const grid: number[] = []
      for (let S = 1; S <= CF_MAX_SAMPLES; S *= 2) grid.push(S)
      const bandW = (amort.w - 16) / (grid.length * 1.4)
      grid.forEach((S) => {
        const x = xOf(S) - bandW / 2
        let acc = 0
        const bands: Array<[number, string, number]> = [
          [floor.clampIters, PALETTE.bill, 1],
          [floor.readoutIters, PALETTE.meter, 0.8],
          [floor.sweepIters, PALETTE.ghost, 1],
          [REFLASH_ITERS / S, PALETTE.bill, 0.28],
        ]
        for (const [v, ink, alpha] of bands) {
          const y0 = yOf(acc + v)
          const y1 = yOf(acc)
          ctx.fillStyle = ink
          ctx.globalAlpha = alpha
          ctx.fillRect(x, y0, bandW, Math.max(y1 - y0, v > 0 ? 1 : 0))
          ctx.globalAlpha = 1
          acc += v
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(String(S), x + bandW / 2, amort.y + amort.h - 4)
        ctx.textAlign = 'left'
      })
      // the floor line the wedge collapses onto
      ctx.strokeStyle = '#1a1f2b'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(amort.x + 4, yOf(floor.total))
      ctx.lineTo(amort.x + amort.w - 4, yOf(floor.total))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`the floor: ${fmt(floor.total, 0)}`, amort.x + 8, yOf(floor.total) - 5)
      ctx.fillStyle = 'rgba(85,96,111,0.8)'
      ctx.fillText('pale band: the setup flash, ÷ samples produced', amort.x + 8, amort.y + 14)

      // -- right: the floor, decomposed -------------------------------------
      paneFrame(ctx, decomp)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('the floor, decomposed', decomp.x, decomp.y - 4)
      const items: Array<[string, number, string, number]> = [
        ['clamps', floor.clampIters, PALETTE.bill, 1],
        ['readouts', floor.readoutIters, PALETTE.meter, 0.8],
        ['sweeps', floor.sweepIters, PALETTE.ghost, 1],
      ]
      const rowH = (decomp.h - 30) / items.length
      items.forEach(([label, v, ink, alpha], i) => {
        const y = decomp.y + 8 + i * rowH
        const bw = (v / floor.total) * (decomp.w - 96)
        ctx.fillStyle = ink
        ctx.globalAlpha = alpha
        ctx.fillRect(decomp.x + 58, y + rowH * 0.2, Math.max(bw, 2), rowH * 0.5)
        ctx.globalAlpha = 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(label, decomp.x + 4, y + rowH * 0.55)
        ctx.fillText(`${fmt(v, 0)}`, decomp.x + 62 + Math.max(bw, 2), y + rowH * 0.55)
      })
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.bill
      ctx.fillText(`the floor is the clamps: ${fmt(clampShare * 100, 1)}%`, decomp.x + 4, decomp.y + decomp.h - 6)

      // -- bottom: the strip, at the floor ---------------------------------
      drawBillStrip(ctx, 16, h - 56, w - 32, floor, { headline: 'per sample, amortized' })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.75)'
      ctx.fillText(
        'no schedule escapes re-clamping the evidence — clamping is flash-priced per node (§II B 2)',
        16,
        h - 8,
      )
    },
  }
}

export function ClampFloor() {
  const [sweepsIdx, setSweepsIdx] = useState(0)
  const shared = useRef<ClampFloorShared>({ sweepsIdx })
  shared.current.sweepsIdx = sweepsIdx

  return (
    <Sim height={360} animated={false} create={() => createClampFloor(shared)}>
      <label className="sim-slider">
        <span>{CF_SWEEP_GRID[0]} sweeps/level</span>
        <input
          type="range"
          min={0}
          max={CF_SWEEP_GRID.length - 1}
          step={1}
          value={sweepsIdx}
          onChange={(e) => setSweepsIdx(Number(e.target.value))}
        />
        <span>{CF_SWEEP_GRID[CF_SWEEP_GRID.length - 1]}</span>
      </label>
    </Sim>
  )
}
