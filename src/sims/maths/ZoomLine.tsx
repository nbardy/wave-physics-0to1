import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { fmt, FONT_LABEL, FONT_METER } from './lib'

// PLAN figure 2 — the 1-D contract: zoom into any smooth curve and it becomes a
// line; the slope of that line is the one number the derivative ever was.
// The slope meter is measured from the two visible endpoints of the curve —
// a genuine secant across the window, not a printout of f′ — so watching it
// converge as the window shrinks IS the definition happening on screen.

const f = (x: number) => 0.55 * Math.sin(2.2 * x) + 0.35 * x * x - 0.1 * x
const fp = (x: number) => 0.55 * 2.2 * Math.cos(2.2 * x) + 0.7 * x - 0.1

const HALF0 = 1.6
const ZOOM_MAX = 120

interface Shared {
  a: number
  zoom: number // 0..1 → ×1..×ZOOM_MAX
}

function createZoomLine(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { a, zoom } = sharedRef.current
      const z = Math.pow(ZOOM_MAX, zoom)
      const halfX = HALF0 / z
      const cy = f(a)
      // vertical window matches horizontal so slopes render undistorted
      const halfY = halfX * (h / w)

      const px = (x: number) => ((x - a + halfX) / (2 * halfX)) * w
      const py = (y: number) => ((cy + halfY - y) / (2 * halfY)) * h

      // axes (only meaningful when visible in the window)
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      if (Math.abs(a) < halfX) {
        ctx.beginPath()
        ctx.moveTo(px(0), 0)
        ctx.lineTo(px(0), h)
        ctx.stroke()
      }
      if (Math.abs(cy) < halfY) {
        ctx.beginPath()
        ctx.moveTo(0, py(0))
        ctx.lineTo(w, py(0))
        ctx.stroke()
      }

      // the curve across the window
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2.4
      ctx.beginPath()
      const N = 160
      for (let i = 0; i <= N; i++) {
        const x = a - halfX + (i / N) * 2 * halfX
        const X = px(x)
        const Y = py(f(x))
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      }
      ctx.stroke()

      // the tangent line, faint, so convergence has a visible target
      ctx.strokeStyle = 'rgba(37,99,235,0.5)'
      ctx.lineWidth = 1.4
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(px(a - halfX), py(cy - fp(a) * halfX))
      ctx.lineTo(px(a + halfX), py(cy + fp(a) * halfX))
      ctx.stroke()
      ctx.setLineDash([])

      // the point we zoom on
      ctx.beginPath()
      ctx.arc(px(a), py(cy), 4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()

      // slope meter: measured secant across the visible window
      const secant = (f(a + halfX) - f(a - halfX)) / (2 * halfX)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.ex
      ctx.fillText(`slope across this window: ${fmt(secant, 3)}`, 12, 22)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`window ×${z < 10 ? z.toFixed(1) : Math.round(z)} — drag left/right to move the point`, 12, 40)
    },
  }
}

export function ZoomLine() {
  const [zoom, setZoom] = useState(0)
  const sharedRef = useRef<Shared>({ a: 0.4, zoom })
  sharedRef.current.zoom = zoom

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = (e.clientX - rect.left) / rect.width
    const { a, zoom: zz } = sharedRef.current
    const halfX = HALF0 / Math.pow(ZOOM_MAX, zz)
    const target = a - halfX + t * 2 * halfX
    sharedRef.current.a = Math.max(-1.4, Math.min(1.4, target))
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={260} animated={false} create={() => createZoomLine(sharedRef)}>
        <label className="sim-slider">
          <span>far</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span>close</span>
        </label>
      </Sim>
    </div>
  )
}
