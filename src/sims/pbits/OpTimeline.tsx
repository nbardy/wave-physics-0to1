import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'
import { N_LEVELS, NV, reverseStep } from './denoise'
import { GLYPH_SIDE, drawGlyph } from './glyphs'
import { PRETRAINED } from './pretrained'
import {
  drawBillStrip,
  floorBill,
  perSample,
  scheduleBill,
  type Bill,
  type ChainSpec,
  type Op,
  opCost,
  REFLASH_ITERS,
} from './part3lib'

// Part 3, PLAN F2+F3 — the billed reprise. Part 1's dream chain runs again,
// same PRETRAINED weights, same reverse steps — nothing about correctness is
// in question — but now every operation ticks a bill: clamp the evidence
// (flash-priced per node), sweep (one iteration each), read the answer out,
// and swap kernels (a reflash, 27,300 iteration-equivalents). The one knob is
// the loop order: batch size N. At N = 1 this is Part 1's naive schedule —
// kernel-per-level swapped inside every dream, N·T reflashes — and the
// composition bars show the reflash line item owning the total while the
// once-per-second rate readout burns red. Reorder the loops (all samples
// through a level before any swap) and the reflash item falls as 1/N onto a
// drawn floor that no batch size pierces: the clamps + sweeps + readouts
// every schedule still owes. The cost curve shows both ends at once; the
// running bill below prices the wall the reader is actually watching.
//
// The figure is honest because the model is the claim: the bars and the
// curve are pure arithmetic on the schedule-as-data (part3lib), the check
// script holds them to independently written closed forms, and the running
// strip accrues the very ops the animation performs.

export const OT_BATCH_GRID: readonly number[] = [1, 2, 4, 8, 16, 32, 64]
export const OT_SWEEPS_PER_LEVEL = 6 // Part 1's dream default — the reader's old knob value
export const OT_CHAIN: ChainSpec = {
  levels: N_LEVELS,
  sweepsPerLevel: OT_SWEEPS_PER_LEVEL,
  clampNodes: NV,
}

/** Demo pace: sample-level steps per second of animation. The rate readout
 *  is the schedule's own structure at this stated pace — at N = 1 every step
 *  carries a reflash (rate ≈ pace, red); batching divides it by N. */
const STEPS_PER_SEC = 2
const TICKER_KEEP = 44

export interface OpTimelineShared {
  batchIdx: number
}

export interface OpTimelineProbe {
  batchN: number
  perSampleTotal: number
  floorTotal: number
  reflashShare: number
  rate: number
  wallTotal: number
  completed: number
}

export function opTimelineRegions(w: number, h: number): { comp: Rect; curve: Rect } {
  const midY = 158
  const midH = h - midY - 78
  return {
    comp: { x: 16, y: midY, w: w * 0.46, h: midH },
    curve: { x: w * 0.52, y: midY, w: w * 0.48 - 16, h: midH },
  }
}

export function createOpTimeline(
  shared: { current: OpTimelineShared },
  probe?: OpTimelineProbe,
  seed = 31,
): Stepper {
  let batchN = OT_BATCH_GRID[shared.current.batchIdx]
  // run state — reset whenever the knob reorders the loops (the bill is a
  // property of the schedule; mixing two schedules' charges in one total
  // would print a bill no schedule owes)
  let states: Int8Array[] = []
  let level = N_LEVELS
  let sampleIdx = 0
  let needReflash = true
  let runCounter = 0
  let completed = 0
  let simTime = 0
  let acc = 0
  const wall: Bill = {
    sweepIters: 0,
    readoutIters: 0,
    clampIters: 0,
    reflashIters: 0,
    total: 0,
    counts: { sweeps: 0, readouts: 0, clamps: 0, reflashes: 0 },
  }
  const ticker: Op[] = []

  const charge = (op: Op) => {
    const c = opCost(op)
    wall.total += c
    switch (op.kind) {
      case 'sweep':
        wall.sweepIters += c
        wall.counts.sweeps += op.count
        break
      case 'readout':
        wall.readoutIters += c
        wall.counts.readouts++
        break
      case 'clamp':
        wall.clampIters += c
        wall.counts.clamps++
        break
      case 'reflash':
        wall.reflashIters += c
        wall.counts.reflashes++
        break
    }
    ticker.push(op)
    if (ticker.length > TICKER_KEEP) ticker.shift()
  }

  const freshBatch = () => {
    states = Array.from({ length: batchN }, (_, s) => {
      const x = new Int8Array(NV)
      for (let i = 0; i < NV; i++) x[i] = u01(seed, runCounter * 128 + s, i, 999) < 0.5 ? -1 : 1
      return x
    })
    level = N_LEVELS
    sampleIdx = 0
    needReflash = true
  }

  const reset = () => {
    runCounter = 0
    completed = 0
    simTime = 0
    acc = 0
    wall.sweepIters = wall.readoutIters = wall.clampIters = wall.reflashIters = wall.total = 0
    wall.counts = { sweeps: 0, readouts: 0, clamps: 0, reflashes: 0 }
    ticker.length = 0
    freshBatch()
  }
  reset()

  const stepOnce = () => {
    if (needReflash) {
      charge({ kind: 'reflash' }) // flash this level's kernel — batched: once per level
      needReflash = false
    }
    const x = states[sampleIdx]
    charge({ kind: 'clamp', nodes: OT_CHAIN.clampNodes })
    charge({ kind: 'sweep', count: OT_SWEEPS_PER_LEVEL })
    const run = (runCounter * 128 + sampleIdx) * 8 + level
    states[sampleIdx] = reverseStep(PRETRAINED[level - 1], x, OT_SWEEPS_PER_LEVEL, seed, run)
    charge({ kind: 'readout' })
    sampleIdx++
    if (sampleIdx >= batchN) {
      sampleIdx = 0
      level--
      needReflash = true
      if (level < 1) {
        completed += batchN
        runCounter++
        freshBatch()
      }
    }
  }

  return {
    step(dt) {
      const wantN = OT_BATCH_GRID[shared.current.batchIdx]
      if (wantN !== batchN) {
        batchN = wantN
        reset()
      }
      simTime += dt
      acc += dt * STEPS_PER_SEC
      acc = Math.min(acc, 4)
      while (acc >= 1) {
        acc -= 1
        stepOnce()
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const plan = { kind: 'batched' as const, chain: OT_CHAIN, samples: batchN, batch: batchN }
      const psBill = scheduleBill(plan)
      const ps = psBill.total / batchN
      const floor = floorBill(OT_CHAIN).total
      const reflashShare = psBill.reflashIters / psBill.total
      const rate = simTime > 0.5 ? wall.counts.reflashes / simTime : STEPS_PER_SEC / batchN
      if (probe) {
        probe.batchN = batchN
        probe.perSampleTotal = ps
        probe.floorTotal = floor
        probe.reflashShare = reflashShare
        probe.rate = rate
        probe.wallTotal = wall.total
        probe.completed = completed
      }

      // -- header + the running batch --------------------------------------
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(
        `batch of ${batchN} · level ${level} of ${N_LEVELS} · ${completed} dreams delivered`,
        16,
        30,
      )
      const cell = 9
      const shown = Math.min(batchN, 8)
      for (let s = 0; s < shown; s++) {
        drawGlyph(ctx, 16 + s * (GLYPH_SIDE * cell + 10), 40, cell, states[s], s === sampleIdx ? 1 : 0.75)
      }
      if (batchN > shown) {
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(`… +${batchN - shown} more`, 16 + shown * (GLYPH_SIDE * cell + 10), 60)
      }

      // -- op ticker --------------------------------------------------------
      const ty = 92
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the schedule, op by op (newest right):', 16, ty)
      let tx = 16
      for (const op of ticker) {
        switch (op.kind) {
          case 'sweep':
            ctx.fillStyle = PALETTE.ghost
            ctx.fillRect(tx, ty + 18, 3, 10)
            tx += 5
            break
          case 'clamp':
            ctx.fillStyle = PALETTE.held
            ctx.fillRect(tx, ty + 14, 6, 14)
            tx += 8
            break
          case 'readout':
            ctx.fillStyle = PALETTE.meter
            ctx.fillRect(tx, ty + 14, 6, 14)
            tx += 8
            break
          case 'reflash':
            ctx.fillStyle = PALETTE.bill
            ctx.fillRect(tx, ty + 6, 10, 22)
            tx += 13
            break
        }
        if (tx > w - 30) break
      }
      ctx.fillStyle = 'rgba(85,96,111,0.75)'
      ctx.fillText('clamp (green) · sweeps (gray) · readout (violet) · reflash (the tall one)', 16, ty + 42)

      const { comp, curve } = opTimelineRegions(w, h)

      // -- left: per-sample composition at this N ---------------------------
      paneFrame(ctx, comp)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText(`per-sample bill at N = ${batchN}`, comp.x, comp.y - 4)
      const naivePs = perSample({ kind: 'naive', chain: OT_CHAIN, samples: 1 })
      const items: Array<[string, number]> = [
        ['reflash', psBill.reflashIters / batchN],
        ['clamp', psBill.clampIters / batchN],
        ['readout', psBill.readoutIters / batchN],
        ['sweep', psBill.sweepIters / batchN],
      ]
      const rowH = comp.h / items.length
      items.forEach(([label, iters], i) => {
        const y = comp.y + i * rowH
        const bw = (iters / naivePs) * (comp.w - 120)
        ctx.fillStyle = PALETTE.bill
        ctx.globalAlpha = label === 'reflash' ? 1 : 0.55
        ctx.fillRect(comp.x + 62, y + rowH * 0.28, Math.max(bw, iters > 0 ? 2 : 0), rowH * 0.44)
        ctx.globalAlpha = 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(label, comp.x + 4, y + rowH * 0.62)
        ctx.fillStyle = PALETTE.bill
        ctx.fillText(
          `${fmt(iters, 0)} (${fmt((100 * iters) / ps, 0)}%)`,
          comp.x + 66 + Math.max(bw, 2),
          y + rowH * 0.62,
        )
      })

      // -- right: cost per sample vs N, with the floor ----------------------
      paneFrame(ctx, curve)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('cost per sample vs batch size', curve.x, curve.y - 4)
      const top = naivePs * 1.06
      const xOf = (n: number) => curve.x + 10 + (Math.log2(n) / 6) * (curve.w - 20)
      const yOf = (v: number) => curve.y + 6 + (1 - v / top) * (curve.h - 24)
      // floor line
      ctx.strokeStyle = PALETTE.ghost
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(curve.x + 4, yOf(floor))
      ctx.lineTo(curve.x + curve.w - 4, yOf(floor))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`floor: ${fmt(floor, 0)} — clamps + sweeps + readouts`, curve.x + 8, yOf(floor) - 4)
      // curve
      ctx.strokeStyle = PALETTE.bill
      ctx.lineWidth = 1.8
      ctx.beginPath()
      OT_BATCH_GRID.forEach((n, i) => {
        const v = perSample({ kind: 'batched', chain: OT_CHAIN, samples: n, batch: n })
        if (i === 0) ctx.moveTo(xOf(n), yOf(v))
        else ctx.lineTo(xOf(n), yOf(v))
      })
      ctx.stroke()
      for (const n of OT_BATCH_GRID) {
        const v = perSample({ kind: 'batched', chain: OT_CHAIN, samples: n, batch: n })
        ctx.beginPath()
        ctx.arc(xOf(n), yOf(v), n === batchN ? 4.5 : 2.5, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.bill
        ctx.fill()
      }
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.bill
      ctx.textAlign = 'right'
      ctx.fillText(`${fmt(ps, 0)} / sample`, curve.x + curve.w - 6, curve.y + 16)
      ctx.textAlign = 'left'

      // -- bottom: the running bill of the wall the reader is watching ------
      // strip head at h−66 keeps its rate line clear of the pace note below
      // (the h−52 placement overprinted them — own-eyes render, 2026-08-25)
      drawBillStrip(ctx, 16, h - 66, w - 32, wall, {
        reflashRate: rate,
        headline: 'this run',
      })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.75)'
      ctx.fillText(
        `animated at ${STEPS_PER_SEC} sample-levels/s (demo pace, stated) · reflash charged at ${REFLASH_ITERS.toLocaleString()} per swap`,
        16,
        h - 6,
      )
    },
  }
}

export function OpTimeline() {
  const [batchIdx, setBatchIdx] = useState(0)
  const shared = useRef<OpTimelineShared>({ batchIdx })
  shared.current.batchIdx = batchIdx

  return (
    <Sim height={410} create={() => createOpTimeline(shared)}>
      <label className="sim-slider">
        <span>one at a time</span>
        <input
          type="range"
          min={0}
          max={OT_BATCH_GRID.length - 1}
          step={1}
          value={batchIdx}
          onChange={(e) => setBatchIdx(Number(e.target.value))}
        />
        <span>batch of {OT_BATCH_GRID[OT_BATCH_GRID.length - 1]}</span>
      </label>
    </Sim>
  )
}
