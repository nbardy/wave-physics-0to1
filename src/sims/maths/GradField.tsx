import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  landF,
  landGrad,
  landHess,
  drawArrow,
  paneFrame,
  clipPane,
  toPx,
  fromPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  INK,
  type View,
  type Rect,
} from './lib'

// PLAN figure 6 — the hinge. Left: the landscape and its gradient arrows
// (point ↦ arrow is itself a map of the plane). Right: the arrow loupe — the
// probe's arrow, plus how the arrowhead moves per unit step east (blue) and
// per unit step north (green). Those two motions, filed as columns, are the
// Hessian; the symmetric off-diagonal shows up as the blue and green vectors
// having each other's components. Landscape, gradient, and Hessian are all
// closed-form (lib.ts), so the panes cannot disagree.

const HALF = 1.9

interface Shared {
  probe: { x: number; y: number }
}

function panes(w: number, h: number): { left: Rect; right: Rect } {
  const gap = 12
  const side = Math.min((w - gap) / 2, h - 8)
  return {
    left: { x: w / 2 - gap / 2 - side, y: 4, w: side, h: side },
    right: { x: w / 2 + gap / 2, y: 4, w: side, h: side },
  }
}

function drawLandscape(ctx: CanvasRenderingContext2D, r: Rect, view: View) {
  const RX = 72
  const RY = 72
  const off = document.createElement('canvas')
  off.width = RX
  off.height = RY
  const img = new ImageData(RX, RY)
  const d = img.data
  for (let j = 0; j < RY; j++) {
    for (let i = 0; i < RX; i++) {
      const x = view.cx - view.half + ((i + 0.5) / RX) * 2 * view.half
      const y = view.cy + view.half - ((j + 0.5) / RY) * 2 * view.half
      const v = Math.max(-1, Math.min(1, landF(x, y) / 1.4))
      const o = (j * RX + i) * 4
      if (v >= 0) {
        d[o] = 247 + (220 - 247) * v
        d[o + 1] = 249 * (1 - 0.6 * v)
        d[o + 2] = 252 * (1 - 0.7 * v)
      } else {
        const q = -v
        d[o] = 247 * (1 - 0.7 * q)
        d[o + 1] = 249 + (145 - 249) * q * 0.55
        d[o + 2] = 252 + (178 - 252) * q * 0.3
      }
      d[o + 3] = 255
    }
  }
  const octx = off.getContext('2d')
  if (!octx) return
  octx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(off, r.x, r.y, r.w, r.h)
}

// cache the landscape once — the terrain never changes, only the probe does
let terrain: HTMLCanvasElement | null = null
function terrainCache(view: View): HTMLCanvasElement {
  if (terrain) return terrain
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 300
  const cx = c.getContext('2d')
  if (cx) drawLandscape(cx, { x: 0, y: 0, w: 300, h: 300 }, view)
  terrain = c
  return c
}

function createGradField(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { left, right } = panes(w, h)
      const view: View = { cx: 0, cy: 0, half: HALF }
      const p = sharedRef.current.probe
      const g = landGrad(p.x, p.y)
      const H = landHess(p.x, p.y)

      // ---- left: landscape + arrow field + probe ----
      ctx.save()
      clipPane(ctx, left)
      ctx.drawImage(terrainCache(view), left.x, left.y, left.w, left.h)
      const n = 9
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const x = -HALF + ((i + 0.5) / n) * 2 * HALF
          const y = -HALF + ((j + 0.5) / n) * 2 * HALF
          const [gx, gy] = landGrad(x, y)
          const [px, py] = toPx(view, left, x, y)
          const s = (left.w / (2 * HALF)) * 0.09
          drawArrow(ctx, px, py, px + gx * s, py - gy * s, 'rgba(219,39,119,0.55)', 1.4)
        }
      }
      const [ppx, ppy] = toPx(view, left, p.x, p.y)
      const S = (left.w / (2 * HALF)) * 0.18
      drawArrow(ctx, ppx, ppy, ppx + g[0] * S, ppy - g[1] * S, PALETTE.grad, 2.6)
      ctx.beginPath()
      ctx.arc(ppx, ppy, 10, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
      paneFrame(ctx, left)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the landscape and its arrows — drag the ring', left.x + 8, left.y + 16)

      // ---- right: the arrow loupe ----
      ctx.save()
      clipPane(ctx, right)
      const ox = right.x + right.w * 0.42
      const oy = right.y + right.h * 0.52
      const AS = right.w * 0.16 // pixels per unit of gradient
      // the arrow itself
      drawArrow(ctx, ox, oy, ox + g[0] * AS, oy - g[1] * AS, PALETTE.grad, 3)
      const tx = ox + g[0] * AS
      const ty = oy - g[1] * AS
      // how the arrowhead moves per unit step east / north (columns of H)
      drawArrow(ctx, tx, ty, tx + H[0] * AS * 0.5, ty - H[2] * AS * 0.5, PALETTE.ex, 2.2)
      drawArrow(ctx, tx, ty, tx + H[1] * AS * 0.5, ty - H[3] * AS * 0.5, PALETTE.ey, 2.2)
      ctx.beginPath()
      ctx.arc(ox, oy, 3.4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, right)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('this point’s arrow, and how it moves', right.x + 8, right.y + 16)

      // matrix readout — columns are the blue and green motions
      const mx = right.x + 10
      const my = right.y + right.h - 52
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      ctx.fillText('H =', mx, my + 24)
      const bx = mx + 34
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(bx + 6, my + 4)
      ctx.lineTo(bx, my + 4)
      ctx.lineTo(bx, my + 38)
      ctx.lineTo(bx + 6, my + 38)
      ctx.moveTo(bx + 96, my + 4)
      ctx.lineTo(bx + 102, my + 4)
      ctx.lineTo(bx + 102, my + 38)
      ctx.lineTo(bx + 96, my + 38)
      ctx.stroke()
      ctx.fillStyle = PALETTE.ex
      ctx.fillText(fmt(H[0]), bx + 10, my + 17)
      ctx.fillText(fmt(H[2]), bx + 10, my + 35)
      ctx.fillStyle = PALETTE.ey
      ctx.fillText(fmt(H[1]), bx + 56, my + 17)
      ctx.fillText(fmt(H[3]), bx + 56, my + 35)
    },
  }
}

export function GradField() {
  const sharedRef = useRef<Shared>({ probe: { x: 0.2, y: -0.6 } })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { left } = panes(rect.width, el.clientHeight)
    if (px < left.x || px > left.x + left.w || py < left.y || py > left.y + left.h) return
    const view: View = { cx: 0, cy: 0, half: HALF }
    const [x, y] = fromPx(view, left, px, py)
    const cap = HALF * 0.92
    sharedRef.current.probe = {
      x: Math.max(-cap, Math.min(cap, x)),
      y: Math.max(-cap, Math.min(cap, y)),
    }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={300} create={() => createGradField(sharedRef)} />
    </div>
  )
}
