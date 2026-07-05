// The clock kit — shared rendering for lesson 02's bundle figures
// (articles/02-fiber-bundles/PLAN.md §Production). A "clock row" is N circle
// fibers standing over a base line, each with a needle at angle θ[i]; a graph
// lane plots any per-fiber scalar against the same x-mapping, so the bundle
// picture and its graph read as one object (dual-pane: the mapping is the lesson).

import type * as React from 'react'
import { PALETTE } from './palette'

/** A horizontal band of the canvas that one pane draws into. */
export interface Lane {
  x0: number
  x1: number
  y0: number
  y1: number
}

/** Split the canvas into vertical lanes by fractional heights (must sum to ~1). */
export function laneSplit(w: number, h: number, fracs: number[], pad = 12): Lane[] {
  const lanes: Lane[] = []
  let y = 0
  for (const f of fracs) {
    const y1 = y + f * h
    lanes.push({ x0: pad, x1: w - pad, y0: y + pad * 0.5, y1: y1 - pad * 0.5 })
    y = y1
  }
  return lanes
}

/** Geometry of a row of clock fibers inside a lane. */
export interface ClockRow {
  n: number
  cx: Float32Array // face centers, canvas x
  cy: number // face centers, canvas y
  r: number // face radius
}

export function clockRow(lane: Lane, n: number): ClockRow {
  const span = lane.x1 - lane.x0
  const gap = span / n
  const r = Math.min(gap * 0.42, (lane.y1 - lane.y0) * 0.38)
  const cx = new Float32Array(n)
  for (let i = 0; i < n; i++) cx[i] = lane.x0 + gap * (i + 0.5)
  return { n, cx, cy: (lane.y0 + lane.y1) / 2, r }
}

/** Wrap an angle to (-π, π]. */
export function wrapPi(a: number): number {
  const t = ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  return t - Math.PI
}

/** The gray base line under a clock row, with a tick at every fiber's foot. */
export function drawBase(ctx: CanvasRenderingContext2D, row: ClockRow, lane: Lane): void {
  const y = lane.y1
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(lane.x0, y)
  ctx.lineTo(lane.x1, y)
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(107,114,128,0.5)'
  for (let i = 0; i < row.n; i++) {
    ctx.beginPath()
    ctx.moveTo(row.cx[i], y - 3)
    ctx.lineTo(row.cx[i], y + 3)
    ctx.stroke()
    // the fiber: a faint stem from base point up to its clock face
    ctx.beginPath()
    ctx.moveTo(row.cx[i], y - 3)
    ctx.lineTo(row.cx[i], row.cy + row.r)
    ctx.stroke()
  }
}

export interface ClockStyle {
  needle?: string // needle color (defaults to θ amber)
  zeros?: Float32Array | null // per-clock zero-mark angle (the gauge choice); null = no marks
  zeroColor?: string
  faceAlpha?: number
}

/** Draw every clock face with its needle at angle θ[i] (measured from the zero mark's frame). */
export function drawClocks(
  ctx: CanvasRenderingContext2D,
  row: ClockRow,
  theta: ArrayLike<number>,
  style: ClockStyle = {},
): void {
  const needle = style.needle ?? PALETTE.theta
  const zeroColor = style.zeroColor ?? PALETTE.gauge
  const faceAlpha = style.faceAlpha ?? 1
  for (let i = 0; i < row.n; i++) {
    const x = row.cx[i]
    // face
    ctx.globalAlpha = faceAlpha
    ctx.strokeStyle = PALETTE.wall
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(x, row.cy, row.r, 0, Math.PI * 2)
    ctx.stroke()
    // zero mark — the (re)gaugeable convention, drawn as a short outer tick
    const z = style.zeros ? style.zeros[i] : 0
    ctx.strokeStyle = style.zeros ? zeroColor : 'rgba(107,114,128,0.7)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(-z) * row.r * 0.78, row.cy + Math.sin(-z) * row.r * 0.78)
    ctx.lineTo(x + Math.cos(-z) * row.r * 1.05, row.cy + Math.sin(-z) * row.r * 1.05)
    ctx.stroke()
    // needle at θ[i], measured counterclockwise from the zero mark
    const a = -(z + theta[i]) // canvas y grows downward; negate for CCW
    ctx.strokeStyle = needle
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, row.cy)
    ctx.lineTo(x + Math.cos(a) * row.r * 0.85, row.cy + Math.sin(a) * row.r * 0.85)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

export interface GraphStyle {
  color: string
  yMin: number
  yMax: number
  label?: string
  dashed?: boolean
  axis?: boolean // draw the y=0 line (default true)
}

/** Plot a per-fiber scalar as a polyline in a lane, x-aligned with a clock row. */
export function drawGraph(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  row: ClockRow,
  values: ArrayLike<number>,
  style: GraphStyle,
): void {
  const { color, yMin, yMax } = style
  const toY = (v: number) => {
    const t = (v - yMin) / (yMax - yMin)
    return lane.y1 - t * (lane.y1 - lane.y0)
  }
  if (style.axis !== false && yMin < 0 && yMax > 0) {
    ctx.strokeStyle = 'rgba(120,140,170,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(lane.x0, toY(0))
    ctx.lineTo(lane.x1, toY(0))
    ctx.stroke()
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  if (style.dashed) ctx.setLineDash([5, 4])
  ctx.beginPath()
  for (let i = 0; i < row.n; i++) {
    const y = toY(values[i])
    if (i === 0) ctx.moveTo(row.cx[i], y)
    else ctx.lineTo(row.cx[i], y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  if (style.label) {
    ctx.fillStyle = color
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(style.label, lane.x0 + 4, lane.y0 + 12)
  }
}

/**
 * Plot a circle-valued field θ(x) without fake cliffs: consecutive samples that
 * wrap across ±π are drawn as separate strokes instead of a vertical jump.
 * (The graph of an angle lives on a cylinder; this is the honest flat drawing.)
 */
export function drawAngleGraph(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  row: ClockRow,
  theta: ArrayLike<number>,
  color: string,
  label?: string,
): void {
  const toY = (v: number) => {
    const t = (v + Math.PI) / (2 * Math.PI)
    return lane.y1 - t * (lane.y1 - lane.y0)
  }
  ctx.strokeStyle = 'rgba(120,140,170,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(lane.x0, toY(0))
  ctx.lineTo(lane.x1, toY(0))
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  let prev = wrapPi(theta[0])
  ctx.moveTo(row.cx[0], toY(prev))
  for (let i = 1; i < row.n; i++) {
    const cur = wrapPi(theta[i])
    if (Math.abs(cur - prev) > Math.PI) {
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(row.cx[i], toY(cur))
    } else {
      ctx.lineTo(row.cx[i], toY(cur))
    }
    prev = cur
  }
  ctx.stroke()
  if (label) {
    ctx.fillStyle = color
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(label, lane.x0 + 4, lane.y0 + 12)
  }
}

/** Canvas-relative pointer position in [0,1]² from a wrapper-div pointer event. */
export function canvasFrac(e: React.PointerEvent<HTMLElement>): { fx: number; fy: number } | null {
  const el = e.currentTarget.querySelector('canvas')
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return {
    fx: (e.clientX - rect.left) / rect.width,
    fy: (e.clientY - rect.top) / rect.height,
  }
}

/**
 * Apply a smooth local bump to a per-fiber field around fractional position fx —
 * the shared primitive behind the regauge brush and the connection tuner.
 * Gaussian of half-width `sigma` (fraction of the row), amplitude `amp` (radians).
 */
export function brushField(
  field: Float32Array,
  fx: number,
  amp: number,
  sigma = 0.08,
): void {
  const n = field.length
  for (let i = 0; i < n; i++) {
    const d = i / (n - 1) - fx
    field[i] += amp * Math.exp(-(d * d) / (2 * sigma * sigma))
  }
}
