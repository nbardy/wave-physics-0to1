// Act III shared kit (lib.ts is frozen — per-act helpers live here).
// Kernel tables as canonical values, the logistic noise draw that makes a
// noisy threshold BE the sigmoid, and the one heatmap vocabulary every §8
// figure speaks. Nothing here samples; the figures own their samplers.

import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'

// ---------------------------------------------------------------------------
// Kernels as tables. A row is a conditional distribution over y ∈ {−1,+1},
// stored as [P(y=−1|x), P(y=+1|x)] and kept normalized by construction.
// ---------------------------------------------------------------------------

/** K(y|x) for one binary input: rows ordered x = −1, +1. */
export type Kernel2 = [[number, number], [number, number]]

/** Noisy-copy: y repeats x, flipped 10% of the time. */
export function noisyCopyTarget(flip = 0.1): Kernel2 {
  return [
    [1 - flip, flip],
    [flip, 1 - flip],
  ]
}

/** P(y=+1 | x1, x2) for noisy-XOR: y says "the inputs differ", wrong 10%. */
export function xorTarget(x1: number, x2: number, flip = 0.1): number {
  return x1 !== x2 ? 1 - flip : flip
}

/** The four input pairs, in display order (−−, −+, +−, ++). */
export const XOR_INPUTS: ReadonlyArray<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

// ---------------------------------------------------------------------------
// The noise that makes a comparator a p-bit. If the noise added to the summed
// current has the logistic distribution with scale 1/(2β), then
// P(I + n > 0) = σ(2βI) exactly — the S-curve is not drawn on top of the
// circuit, it IS the circuit's threshold statistics.
// ---------------------------------------------------------------------------

export function logisticNoise(u: number, beta: number): number {
  const v = Math.min(Math.max(u, 1e-9), 1 - 1e-9)
  return Math.log(v / (1 - v)) / (2 * beta)
}

export function sigma(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// ---------------------------------------------------------------------------
// Heatmap vocabulary — one renderer for every kernel table in §8.
// ---------------------------------------------------------------------------

export interface HeatOptions {
  title?: string
  rowLabels: string[]
  colLabels: string[]
  /** Ink for the fills; defaults to the meter violet. Error maps pass ferro red. */
  ink?: string
  /** Print each cell's number. */
  numbers?: boolean
}

export function drawKernelHeat(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  rows: number[][],
  opts: HeatOptions,
): void {
  const nr = rows.length
  const nc = rows[0].length
  const labelW = 26
  const headH = opts.title ? 16 : 0
  const grid: Rect = {
    x: r.x + labelW,
    y: r.y + headH + 14,
    w: r.w - labelW,
    h: r.h - headH - 14,
  }
  const cw = grid.w / nc
  const ch = grid.h / nr
  const ink = opts.ink ?? PALETTE.meter
  ctx.save()
  ctx.font = FONT_LABEL
  if (opts.title) {
    ctx.fillStyle = 'rgba(85,96,111,0.95)'
    ctx.textAlign = 'left'
    ctx.fillText(opts.title, r.x, r.y + 10)
  }
  for (let c = 0; c < nc; c++) {
    ctx.fillStyle = 'rgba(85,96,111,0.9)'
    ctx.textAlign = 'center'
    ctx.fillText(opts.colLabels[c], grid.x + (c + 0.5) * cw, grid.y - 4)
  }
  for (let rI = 0; rI < nr; rI++) {
    ctx.fillStyle = 'rgba(85,96,111,0.9)'
    ctx.textAlign = 'right'
    ctx.fillText(opts.rowLabels[rI], grid.x - 5, grid.y + (rI + 0.5) * ch + 4)
    for (let c = 0; c < nc; c++) {
      const v = rows[rI][c]
      const cx = grid.x + c * cw
      const cy = grid.y + rI * ch
      ctx.globalAlpha = 0.08 + 0.8 * Math.min(1, Math.max(0, v))
      ctx.fillStyle = ink
      ctx.fillRect(cx + 1, cy + 1, cw - 2, ch - 2)
      ctx.globalAlpha = 1
      if (opts.numbers !== false) {
        ctx.fillStyle = v > 0.55 ? '#ffffff' : '#1a1f2b'
        ctx.textAlign = 'center'
        ctx.font = ch > 26 ? FONT_METER : FONT_LABEL
        ctx.fillText(fmt(v, 2), cx + cw / 2, cy + ch / 2 + 4)
        ctx.font = FONT_LABEL
      }
    }
  }
  paneFrame(ctx, grid)
  ctx.restore()
}
