import { useEffect, useState } from 'react'
import { PALETTE as C } from '../lib/palette'
import type { LabFluid } from './core'

export const INK = '#263348', MUTED = '#64748b', PAPER = '#f7f9fc'
export type Pane = { x: number; y: number; w: number; h: number }
export function useLabHeight(wide = 340, narrow = 540) {
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 650)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 649px)'), update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return compact ? narrow : wide
}
export function panes(w: number, h: number): [Pane, Pane] {
  return w < 530
    ? [{ x: 14, y: 12, w: w - 28, h: (h - 36) / 2 }, { x: 14, y: (h + 12) / 2, w: w - 28, h: (h - 36) / 2 }]
    : [{ x: 18, y: 16, w: (w - 54) / 2, h: h - 32 }, { x: (w + 18) / 2, y: 16, w: (w - 54) / 2, h: h - 32 }]
}
export function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = INK, size = 13, bold = false) {
  ctx.fillStyle = color; ctx.font = `${bold ? '600 ' : ''}${size}px ui-sans-serif, system-ui`; ctx.fillText(s, x, y)
}
export function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, width = 1.6) {
  const len = Math.hypot(dx, dy)
  if (len < .5) return
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke()
  const a = Math.atan2(dy, dx), head = Math.min(5, len * .4)
  ctx.beginPath(); ctx.moveTo(x + dx, y + dy)
  ctx.lineTo(x + dx - head * Math.cos(a - .5), y + dy - head * Math.sin(a - .5))
  ctx.lineTo(x + dx - head * Math.cos(a + .5), y + dy - head * Math.sin(a + .5)); ctx.fill()
}
// 'pressure-residual' is the pressure wash with the remaining divergence laid
// over it in violet, so a partial or over-correction shows where its leftover
// imbalance sits instead of only reporting a meter number (audit 2026-09-23, IV 08).
export type FieldView = 'dye' | 'divergence' | 'pressure' | 'pressure-residual' | 'velocity'
const divergenceInk = (d: number) => `rgba(124,58,237,${Math.min(.72, Math.abs(d) * 1.2)})`
const pressureInk = (p: number) => p < 0 ? `rgba(8,145,178,${Math.min(.7, Math.abs(p) / 25)})` : `rgba(220,38,38,${Math.min(.7, p / 25)})`
const dyeInk = (amber: number, rose: number) => {
  const a = amber * .8, b = rose * .8, t = Math.min(1, a + b), mix = b / Math.max(1e-8, a + b)
  return `rgb(${255 * (1 - t) + (217 * (1 - mix) + 219 * mix) * t},${255 * (1 - t) + (119 * (1 - mix) + 39 * mix) * t},${255 * (1 - t) + (6 * (1 - mix) + 119 * mix) * t})`
}
// One cell painter per view; each returns the fills for a cell, back to front.
const painters: Record<FieldView, (f: LabFluid, div: Float64Array, k: number) => string[]> = {
  dye: (f, _, k) => [dyeInk(f.dye[k], f.rose[k])],
  divergence: (_, div, k) => [divergenceInk(div[k])],
  pressure: (f, _, k) => [pressureInk(f.pressure[k])],
  'pressure-residual': (f, div, k) => [pressureInk(f.pressure[k]), divergenceInk(div[k])],
  velocity: () => ['#fff'],
}
export function field(ctx: CanvasRenderingContext2D, f: LabFluid, box: Pane, mode: FieldView, grid = false) {
  const { x, y, w, h } = box, cw = w / f.nx, ch = h / f.ny
  const div = f.divergence(), paint = painters[mode]
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h)
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  for (let j = 0; j < f.ny; j++) for (let i = 0; i < f.nx; i++) {
    for (const ink of paint(f, div, f.index(i, j))) { ctx.fillStyle = ink; ctx.fillRect(x + i * cw, y + j * ch, cw + .3, ch + .3) }
  }
  if (grid) {
    ctx.strokeStyle = '#cbd5e155'; ctx.lineWidth = .6; ctx.beginPath()
    for (let i = 0; i <= f.nx; i++) { ctx.moveTo(x + i * cw, y); ctx.lineTo(x + i * cw, y + h) }
    for (let j = 0; j <= f.ny; j++) { ctx.moveTo(x, y + j * ch); ctx.lineTo(x + w, y + j * ch) }
    ctx.stroke()
  }
  const stride = Math.max(2, Math.ceil(f.nx / 12)), scale = Math.min(cw, ch) * .24
  for (let j = 1; j < f.ny; j += stride) for (let i = 1; i < f.nx; i += stride) {
    const [u, v] = f.velocity(i + .5, j + .5)
    arrow(ctx, x + (i + .5) * cw, y + (j + .5) * ch, u * scale, v * scale, C.vel, 1.2)
  }
  ctx.restore()
  ctx.strokeStyle = '#d9e1ec'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h)
}
export function meter(ctx: CanvasRenderingContext2D, pane: Pane, value: number, reference: number, title = 'Unbalanced flow', color: string = C.div) {
  const ratio = value / Math.max(1e-12, reference), y = pane.y + pane.h - 23
  label(ctx, title, pane.x, y - 8, MUTED, 12)
  const valueText = `${(100 * ratio).toFixed(ratio < .01 ? 2 : 0)}%`
  ctx.textAlign = 'right'; label(ctx, valueText, pane.x + pane.w, y - 8, color, 14, true); ctx.textAlign = 'left'
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(pane.x, y, pane.w, 5)
  ctx.fillStyle = color; ctx.fillRect(pane.x, y, pane.w * Math.min(1, ratio), 5)
}
