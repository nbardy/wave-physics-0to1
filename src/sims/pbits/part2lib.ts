// Part 2 shared figure chrome: the split-meter (the series' signature
// instrument for compiled figures — per-step KL beside trajectory-occupancy
// TV) and the visitation glow. Every §4 figure mounts the same instrument so
// the reader learns to read it once.
//
// The split-meter exists because the two panes can DISAGREE: a kernel can
// hold every per-step conditional close (left pane low) while its trajectory
// occupancy drifts (right pane high) — and REINFORCE post-training does the
// reverse, warping per-step conditionals to buy trajectory honesty
// (measured: weighted KL 0.42 → 2.47 while trajectory TV 0.49 → 0.14,
// 2026-08-06). Neither number alone is the truth; the instrument shows both.

import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { PALETTE } from '../lib/palette'
import {
  N_NODES,
  compiledKernel,
  oneHotConfig,
  targetKernel,
  targetOccupancies,
  trajectoryReport,
  type KernelParams,
} from './walkCompile'

/** The article's one new color: visitation glow q(x) — how often the
 *  upstream program shows an input. Warm, adjacent to nothing in the p-bit
 *  set (sUp amber marks a spin, this marks attention). Local constant
 *  because palette.ts is FROZEN this round — ASSEMBLER: promote to
 *  PALETTE.visit at the next palette edit and re-point these imports. */
export const VISIT = '#fb923c'

/** Per-context per-step KL(K(·|i) ‖ K̃(·|i)) over the five valid contexts —
 *  the left pane's bars, exact (target mass on invalid outputs is zero). */
export function stepKLByContext(p: KernelParams): Float64Array {
  const kl = new Float64Array(N_NODES)
  for (let i = 0; i < N_NODES; i++) {
    const target = targetKernel(i)
    const model = compiledKernel(p, oneHotConfig(i))
    for (let j = 0; j < N_NODES; j++) {
      if (target[j] === 0) continue
      kl[i] += target[j] * Math.log(target[j] / Math.max(model[oneHotConfig(j)], 1e-12))
    }
  }
  return kl
}

/** Everything one split-meter frame needs, computed once (exact — the
 *  chain propagation is the expensive part, so figures cache this and
 *  redraw it every frame while refreshing it every few fit iterations). */
export interface SplitMeterData {
  /** the visitation law the glow shows (5 contexts) */
  q: Float64Array
  stepKL: Float64Array
  klWeighted: number
  trajTarget: Float64Array
  trajModel: Float64Array
  offGraph: number
  tv: number
  depth: number
}

export function readSplitMeter(p: KernelParams, q: Float64Array, T: number): SplitMeterData {
  const stepKL = stepKLByContext(p)
  let klWeighted = 0
  for (let i = 0; i < N_NODES; i++) klWeighted += q[i] * stepKL[i]
  const rep = trajectoryReport(p, T)
  const targ = targetOccupancies(T)
  const trajTarget = new Float64Array(N_NODES)
  for (let i = 0; i < N_NODES; i++) trajTarget[i] = targ[T * N_NODES + i]
  return {
    q: Float64Array.from(q),
    stepKL,
    klWeighted,
    trajTarget,
    trajModel: rep.onGraph,
    offGraph: rep.offGraph,
    tv: rep.tv,
    depth: T,
  }
}

/** The visitation glow on a column pane: a warm wash per column with alpha
 *  keyed to q, plus a SOLID visit-ink tick on the axis (height ∝ q) — the
 *  solid tick is the samplable ink the checks bind to; the wash alone
 *  blends with the background and can't be color-matched. */
export function drawVisitGlow(ctx: CanvasRenderingContext2D, r: Rect, q: ArrayLike<number>): void {
  const n = q.length
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, q[i])
  if (peak === 0) return
  const cw = r.w / n
  ctx.fillStyle = VISIT
  for (let i = 0; i < n; i++) {
    const rel = q[i] / peak
    ctx.globalAlpha = 0.15 * rel
    ctx.fillRect(r.x + i * cw + 1, r.y, cw - 2, r.h)
    ctx.globalAlpha = 1
    const tick = Math.max(2, 10 * rel)
    ctx.fillRect(r.x + i * cw + cw * 0.2, r.y + r.h - tick, cw * 0.6, tick)
  }
}

export interface SplitMeterReading {
  kl: number
  tv: number
}

/**
 * THE SPLIT-METER — one compact instrument, two panes. Left: per-step KL per
 * context, bars in meter ink over the visitation glow, weighted mean printed.
 * Right: trajectory occupancy at depth T — target law as ghost outlines,
 * compiled chain as meter bars, off-graph mass as its own ferro bucket — TV
 * printed. Returns the two numbers it printed so checks and probes hold the
 * pixels and the numbers to the same values.
 */
export function drawSplitMeter(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  d: SplitMeterData,
): SplitMeterReading {
  const gap = 10
  const lw = r.w * 0.42
  const left: Rect = { x: r.x, y: r.y + 14, w: lw, h: r.h - 46 }
  const right: Rect = { x: r.x + lw + gap, y: r.y + 14, w: r.w - lw - gap, h: r.h - 46 }
  ctx.textAlign = 'left'
  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('per-step KL', left.x, r.y + 8)
  ctx.fillText(`trajectory occupancy, T=${d.depth}`, right.x, r.y + 8)
  paneFrame(ctx, left)
  paneFrame(ctx, right)

  // left: glow under KL bars, one column per context
  drawVisitGlow(ctx, left, d.q)
  let klPeak = 0.7
  for (let i = 0; i < N_NODES; i++) klPeak = Math.max(klPeak, d.stepKL[i])
  const cw = left.w / N_NODES
  ctx.fillStyle = PALETTE.meter
  for (let i = 0; i < N_NODES; i++) {
    const bh = (d.stepKL[i] / klPeak) * (left.h - 4)
    ctx.globalAlpha = 0.55
    ctx.fillRect(left.x + i * cw + cw * 0.28, left.y + left.h - bh, cw * 0.44, bh)
    ctx.globalAlpha = 1
  }
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.meter
  ctx.fillText(`q-avg KL: ${fmt(d.klWeighted, 3)}`, left.x, left.y + left.h + 16)

  // right: 6 buckets — 5 nodes + the off-graph bucket
  const nb = N_NODES + 1
  const bw = right.w / nb
  let peak = 0.35
  for (let i = 0; i < N_NODES; i++) peak = Math.max(peak, d.trajTarget[i], d.trajModel[i])
  peak = Math.max(peak, d.offGraph)
  for (let i = 0; i < N_NODES; i++) {
    const x = right.x + i * bw
    const gh = (d.trajTarget[i] / peak) * (right.h - 4)
    ctx.strokeStyle = PALETTE.ghost
    ctx.lineWidth = 1.4
    ctx.strokeRect(x + bw * 0.14, right.y + right.h - gh, bw * 0.72, gh)
    const mh = (d.trajModel[i] / peak) * (right.h - 4)
    ctx.fillStyle = PALETTE.meter
    ctx.globalAlpha = 0.55
    ctx.fillRect(x + bw * 0.26, right.y + right.h - mh, bw * 0.48, mh)
    ctx.globalAlpha = 1
  }
  const ox = right.x + N_NODES * bw
  const oh = (d.offGraph / peak) * (right.h - 4)
  ctx.fillStyle = PALETTE.ferro
  ctx.globalAlpha = 0.7
  ctx.fillRect(ox + bw * 0.26, right.y + right.h - oh, bw * 0.48, Math.max(oh, d.offGraph > 1e-4 ? 2 : 0))
  ctx.globalAlpha = 1
  ctx.font = FONT_LABEL
  ctx.fillStyle = PALETTE.ferro
  ctx.fillText('off', ox + bw * 0.2, right.y + 10)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.meter
  // Right-align the TV readout at its pane's right edge: at 360px article
  // width the two panes sit close enough that left-aligned KL and TV labels
  // mashed into one string (figure audit, 2026-08-11).
  ctx.textAlign = 'right'
  ctx.fillText(`TV: ${fmt(d.tv, 3)}`, right.x + right.w, right.y + right.h + 16)
  ctx.textAlign = 'left'

  return { kl: d.klWeighted, tv: d.tv }
}
