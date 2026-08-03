// Figure chrome shared by every field's sims: the pane rectangle, the world
// window mapped into it, the frame/clip, arrows, and the two type sizes every
// meter and knob label uses.
//
// These lived in `sims/maths/lib.ts` until the physics track needed the same
// pane vocabulary. Moved here rather than copied — `sims/maths/lib.ts` re-exports
// the names so the maths figures are untouched.

/** A pixel rectangle a figure draws into. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A square world window: center (cx, cy), half-width `half`. */
export interface View {
  cx: number
  cy: number
  half: number
}

export function toPx(v: View, r: Rect, x: number, y: number): [number, number] {
  return [
    r.x + ((x - v.cx + v.half) / (2 * v.half)) * r.w,
    r.y + ((v.cy + v.half - y) / (2 * v.half)) * r.h,
  ]
}

export function fromPx(v: View, r: Rect, px: number, py: number): [number, number] {
  return [
    v.cx - v.half + ((px - r.x) / r.w) * 2 * v.half,
    v.cy + v.half - ((py - r.y) / r.h) * 2 * v.half,
  ]
}

export function paneFrame(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.strokeStyle = 'rgba(120,140,170,0.45)'
  ctx.lineWidth = 1
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
}

export function clipPane(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.beginPath()
  ctx.rect(r.x, r.y, r.w, r.h)
  ctx.clip()
}

/** A grid spacing that keeps roughly `target` lines visible in the window. */
export function niceStep(half: number, target = 8): number {
  const raw = (2 * half) / target
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p
  return 10 * p
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 2,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  if (len < 1) return
  const ux = dx / len
  const uy = dy / len
  const head = Math.min(7, len * 0.4)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1 - ux * head * 0.6, y1 - uy * head * 0.6)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - ux * head - uy * head * 0.45, y1 - uy * head + ux * head * 0.45)
  ctx.lineTo(x1 - ux * head + uy * head * 0.45, y1 - uy * head - ux * head * 0.45)
  ctx.closePath()
  ctx.fill()
}

export const INK = '#1a1f2b'
export const FONT_METER = '600 13px ui-sans-serif, system-ui'
export const FONT_LABEL = '500 11px ui-sans-serif, system-ui'

export function fmt(x: number, digits = 2): string {
  const v = x.toFixed(digits)
  return v === '-0.00' ? '0.00' : v
}
