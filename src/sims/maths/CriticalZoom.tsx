import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  landF,
  landHess,
  eigSym,
  CRITICAL,
  type CriticalKind,
  paneFrame,
  clipPane,
  toPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type View,
  type Rect,
} from './lib'

// PLAN figure 7 — zoom at a critical point. Contours are marching-dot
// iso-lines of the REAL landscape (never of the quadric), with levels chosen
// from the values actually present in the window — so ellipses and crossing
// hyperbolas emerge from f itself as the window shrinks. Overlaid: the
// Hessian's eigen axes with signed curvature readouts.

const ZOOM_MAX = 30

interface Shared {
  kind: CriticalKind
  zoom: number
}

function createCriticalZoom(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { kind, zoom } = sharedRef.current
      const [cx, cy] = CRITICAL[kind]
      const half = 0.85 / Math.pow(ZOOM_MAX, zoom)
      const view: View = { cx, cy, half }
      const size = Math.min(w, h - 8)
      const r: Rect = { x: (w - size) / 2, y: 4, w: size, h: size }

      // find the value spread actually present in this window
      const fc = landF(cx, cy)
      let dev = 0
      for (let j = 0; j <= 12; j++) {
        for (let i = 0; i <= 12; i++) {
          const x = cx - half + (i / 12) * 2 * half
          const y = cy - half + (j / 12) * 2 * half
          dev = Math.max(dev, Math.abs(landF(x, y) - fc))
        }
      }
      // include the critical level itself: at the pass it draws the two
      // crossing contour lines the prose stakes its Predict on
      const levels: number[] = [fc]
      for (let k = 1; k <= 4; k++) {
        levels.push(fc + (k / 4.5) * dev)
        levels.push(fc - (k / 4.5) * dev)
      }

      ctx.save()
      clipPane(ctx, r)
      // faint hi/lo wash so up and down stay readable while zooming
      const RX = 48
      for (let j = 0; j < RX; j++) {
        for (let i = 0; i < RX; i++) {
          const x = cx - half + ((i + 0.5) / RX) * 2 * half
          const y = cy + half - ((j + 0.5) / RX) * 2 * half
          const v = Math.max(-1, Math.min(1, (landF(x, y) - fc) / (dev + 1e-12)))
          ctx.fillStyle =
            v >= 0 ? `rgba(220,38,38,${0.10 * v})` : `rgba(8,145,178,${0.10 * -v})`
          ctx.fillRect(r.x + (i / RX) * r.w, r.y + (j / RX) * r.h, r.w / RX + 1, r.h / RX + 1)
        }
      }
      // marching-dot contours of the real f
      ctx.fillStyle = 'rgba(26,31,43,0.5)'
      const step = 3
      for (let yy = 0; yy < r.h; yy += step) {
        for (let xx = 0; xx < r.w; xx += step) {
          const x = cx - half + (xx / r.w) * 2 * half
          const y = cy + half - (yy / r.h) * 2 * half
          const v = landF(x, y)
          for (const L of levels) {
            if (Math.abs(v - L) < dev * 0.012) {
              ctx.fillRect(r.x + xx, r.y + yy, 1.6, 1.6)
              break
            }
          }
        }
      }
      // eigen axes of H at the critical point
      const H = landHess(cx, cy)
      const { l1, l2, v1, v2 } = eigSym(H)
      const [ox, oy] = toPx(view, r, cx, cy)
      const L = r.w * 0.42
      for (const [vec, lam] of [
        [v1, l1],
        [v2, l2],
      ] as Array<[[number, number], number]>) {
        ctx.strokeStyle = PALETTE.area
        ctx.lineWidth = 2
        ctx.setLineDash(lam >= 0 ? [] : [6, 5])
        ctx.beginPath()
        ctx.moveTo(ox - vec[0] * L, oy + vec[1] * L)
        ctx.lineTo(ox + vec[0] * L, oy - vec[1] * L)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(ox, oy, 3.4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, r)

      // curvature readouts — solid axis first, dashed axis second
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.area
      ctx.fillText(`along the solid axis: λ = ${fmt(l1, 1)}`, r.x + 8, r.y + 20)
      ctx.fillText(`along the dashed axis: λ = ${fmt(l2, 1)}`, r.x + 8, r.y + 38)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`det H = ${fmt(l1 * l2, 1)}`, r.x + 8, r.y + 56)
    },
  }
}

const KINDS: Array<{ key: CriticalKind; label: string }> = [
  { key: 'pit', label: 'the pit' },
  { key: 'peak', label: 'the peak' },
  { key: 'pass', label: 'the pass' },
]

export function CriticalZoom() {
  const [kind, setKind] = useState<CriticalKind>('pit')
  const [zoom, setZoom] = useState(0.35)
  const sharedRef = useRef<Shared>({ kind, zoom })
  sharedRef.current.kind = kind
  sharedRef.current.zoom = zoom

  return (
    <Sim height={320} create={() => createCriticalZoom(sharedRef)}>
      <select className="sim-select" value={kind} onChange={(e) => setKind(e.target.value as CriticalKind)}>
        {KINDS.map((k) => (
          <option key={k.key} value={k.key}>
            {k.label}
          </option>
        ))}
      </select>
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
  )
}
