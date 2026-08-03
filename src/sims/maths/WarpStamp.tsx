import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  swirlMap,
  drawGridImage,
  drawStampImage,
  stampAreaRatio,
  paneFrame,
  clipPane,
  toPx,
  fromPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type View,
  type Rect,
} from './lib'

// PLAN figure 3 — the one-number meter fails in one frame: three stamps under
// the same swirl, three wildly different landed shapes, three identical area
// receipts. The receipts are shoelace measurements of the drawn boundaries
// (lib.stampAreaRatio), not printouts of det J — the meter is honestly earned,
// and honestly useless.

const MAP = swirlMap(2.2)
const INV = swirlMap(-2.2)
const HALF = 1.3
const SIDE = 0.3

interface Shared {
  probe: { x: number; y: number }
}

// one pinned near the vortex (bent around it), one pinned far out where the
// swirl has died (lands nearly square) — with the draggable stamp mid-radius,
// the one frame holds all three shapes the prose names
const GHOSTS: Array<{ x: number; y: number }> = [
  { x: 0.18, y: 0.12 },
  { x: 0.92, y: -0.88 },
]

function createWarpStamp(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const r: Rect = { x: Math.max(0, (w - h * 1.55) / 2), y: 4, w: Math.min(w, h * 1.55), h: h - 8 }
      const view: View = { cx: 0, cy: 0, half: HALF }
      ctx.save()
      clipPane(ctx, r)
      drawGridImage(ctx, r, view, MAP, 0, 0, HALF, 'rgba(37,99,235,0.35)', true)

      const all = [...GHOSTS, sharedRef.current.probe]
      for (let i = 0; i < all.length; i++) {
        const p = all[i]
        const isLive = i === all.length - 1
        drawStampImage(ctx, r, view, MAP, p.x, p.y, SIDE, {
          fill: isLive ? 'rgba(217,119,6,0.22)' : 'rgba(217,119,6,0.10)',
          stroke: isLive ? PALETTE.stamp : 'rgba(217,119,6,0.55)',
        })
        const ratio = stampAreaRatio(MAP, p.x, p.y, SIDE)
        const [fx, fy] = MAP.f(p.x, p.y)
        const [px, py] = toPx(view, r, fx, fy)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.area
        // keep the receipt inside the pane even for stamps near the edge
        const tx = Math.min(px + 12, r.x + r.w - 86)
        const ty = Math.max(py - 12, r.y + 30)
        ctx.fillText(`area ×${fmt(ratio)}`, tx, ty)
      }
      ctx.restore()
      paneFrame(ctx, r)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('drag the bright stamp anywhere', r.x + 8, r.y + 16)
    },
  }
}

export function WarpStamp() {
  const sharedRef = useRef<Shared>({ probe: { x: 0.62, y: 0.5 } })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = el.clientHeight
    const r: Rect = { x: Math.max(0, (w - h * 1.55) / 2), y: 4, w: Math.min(w, h * 1.55), h: h - 8 }
    const view: View = { cx: 0, cy: 0, half: HALF }
    const [ix, iy] = fromPx(view, r, e.clientX - rect.left, e.clientY - rect.top)
    const [dx, dy] = INV.f(ix, iy)
    const rad = Math.hypot(dx, dy)
    const cap = HALF * 0.85
    const k = rad > cap ? cap / rad : 1
    sharedRef.current.probe = { x: dx * k, y: dy * k }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={300} create={() => createWarpStamp(sharedRef)} />
    </div>
  )
}
