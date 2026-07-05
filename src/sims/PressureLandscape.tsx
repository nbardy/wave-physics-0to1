import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §8 — pressure differences push. Draggable high (red) and low (cyan) blobs
// build a pressure field p(x,y) = Σ sᵢ·exp(−r²/wᵢ²); the acceleration of a
// parcel is −∇p, computed analytically from the same expression (no hidden
// smoothing — the arrows and the marbles feel exactly the field you see).
// modes: 'map' (colors) → 'contours' (+iso-lines) → 'parcels' (+marbles).

interface Blob {
  x: number
  y: number
  s: number // + = high pressure, − = low
  w: number
}

export type LandscapeMode = 'map' | 'contours' | 'parcels'

function pressureAt(blobs: Blob[], x: number, y: number): number {
  let p = 0
  for (const b of blobs) {
    p += b.s * Math.exp(-(((x - b.x) ** 2 + (y - b.y) ** 2) / (b.w * b.w)))
  }
  return p
}
function gradAt(blobs: Blob[], x: number, y: number): { x: number; y: number } {
  let gx = 0
  let gy = 0
  for (const b of blobs) {
    const e = b.s * Math.exp(-(((x - b.x) ** 2 + (y - b.y) ** 2) / (b.w * b.w)))
    gx += e * (-2 * (x - b.x)) / (b.w * b.w)
    gy += e * (-2 * (y - b.y)) / (b.w * b.w)
  }
  return { x: gx, y: gy }
}

function createLandscape(mode: LandscapeMode, blobsRef: { current: Blob[] }): Stepper {
  const NP = 26
  const px = new Float32Array(NP)
  const py = new Float32Array(NP)
  const pvx = new Float32Array(NP)
  const pvy = new Float32Array(NP)
  const seedParcel = (i: number) => {
    px[i] = 0.03
    py[i] = ((i % 13) + 0.5) / 13
    pvx[i] = 0.06
    pvy[i] = 0
  }
  for (let i = 0; i < NP; i++) seedParcel(i)

  const off = document.createElement('canvas')
  const RX = 96
  const RY = 60
  off.width = RX
  off.height = RY
  const img = new ImageData(RX, RY)

  return {
    step(dt) {
      if (mode !== 'parcels') return
      const blobs = blobsRef.current
      for (let i = 0; i < NP; i++) {
        const g = gradAt(blobs, px[i], py[i])
        pvx[i] += -g.x * dt * 0.5
        pvy[i] += -g.y * dt * 0.5
        px[i] += pvx[i] * dt
        py[i] += pvy[i] * dt
        if (px[i] > 1.02 || px[i] < -0.02 || py[i] > 1.02 || py[i] < -0.02) seedParcel(i)
      }
    },
    draw(ctx, w, h) {
      const blobs = blobsRef.current
      const d = img.data
      for (let j = 0; j < RY; j++) {
        for (let i = 0; i < RX; i++) {
          const p = Math.max(-1, Math.min(1, pressureAt(blobs, (i + 0.5) / RX, (j + 0.5) / RY)))
          const o = (j * RX + i) * 4
          if (p >= 0) {
            d[o] = 247 + (220 - 247) * p
            d[o + 1] = 249 * (1 - 0.6 * p)
            d[o + 2] = 252 * (1 - 0.7 * p)
          } else {
            const q = -p
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
      ctx.drawImage(off, 0, 0, w, h)

      if (mode !== 'map') {
        // iso-lines by marching through a coarse grid (draw as dots — cheap, honest)
        ctx.fillStyle = 'rgba(26,31,43,0.4)'
        const levels = [-0.6, -0.3, -0.1, 0.1, 0.3, 0.6]
        for (let yy = 0; yy < h; yy += 3) {
          for (let xx = 0; xx < w; xx += 3) {
            const p = pressureAt(blobs, xx / w, yy / h)
            for (const L of levels) {
              if (Math.abs(p - L) < 0.008) {
                ctx.fillRect(xx, yy, 1.4, 1.4)
                break
              }
            }
          }
        }
      }
      // blob handles
      for (const b of blobs) {
        ctx.strokeStyle = b.s > 0 ? PALETTE.pHi : PALETTE.pLo
        ctx.lineWidth = 2
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.arc(b.x * w, b.y * h, 12, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = ctx.strokeStyle
        ctx.font = '600 14px ui-sans-serif, system-ui'
        ctx.fillText(b.s > 0 ? '+' : '−', b.x * w - 4, b.y * h + 5)
      }
      if (mode === 'parcels') {
        ctx.fillStyle = PALETTE.dye
        for (let i = 0; i < NP; i++) {
          ctx.beginPath()
          ctx.arc(px[i] * w, py[i] * h, 2.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  }
}

export function PressureLandscape({ mode, height = 260 }: { mode: LandscapeMode; height?: number }) {
  const [blobs] = useState<Blob[]>([
    { x: 0.32, y: 0.42, s: 1, w: 0.2 },
    { x: 0.68, y: 0.6, s: -0.9, w: 0.24 },
  ])
  const blobsRef = { current: blobs }
  const dragging = useState<{ i: number } | null>(null)
  const [drag, setDrag] = dragging

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (e.type === 'pointerdown') {
      let best = -1
      let bestD = 0.006
      blobs.forEach((b, i) => {
        const dd = (b.x - x) ** 2 + (b.y - y) ** 2
        if (dd < bestD) {
          best = i
          bestD = dd
        }
      })
      if (best >= 0) setDrag({ i: best })
    } else if (e.type === 'pointermove' && drag && e.buttons > 0) {
      blobs[drag.i].x = Math.min(Math.max(x, 0.02), 0.98)
      blobs[drag.i].y = Math.min(Math.max(y, 0.02), 0.98)
    } else if (e.type === 'pointerup') {
      setDrag(null)
    }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer}>
      <Sim
        height={height}
        create={() => createLandscape(mode, blobsRef)}
        caption="Drag the + and − regions. Red pushes, cyan yields."
      />
    </div>
  )
}
