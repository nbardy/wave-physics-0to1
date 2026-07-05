import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { vortexField, drawArrowGrid, type FlowField } from './lib/field'

// §9 — ∇·u = 0, measured before it is written. A resizable test loop counts
// flux: velocity·outward-normal summed around the circle (numerically, 64
// samples). For the swirling field the ins cancel the outs at ANY size or
// position of the loop; switch on the source and the loop caught around it
// reads a stubborn surplus. Violet shading marks nonzero divergence
// (computed analytically for the source: only its Gaussian core diverges).

const SWIRL = vortexField(0.15)
const SRC = { x: 0.62, y: 0.45, q: 0.05, w: 0.09 }

function sourceField(x: number, y: number): { x: number; y: number } {
  const dx = x - SRC.x
  const dy = y - SRC.y
  const r2 = dx * dx + dy * dy
  const g = SRC.q * Math.exp(-r2 / (SRC.w * SRC.w))
  return { x: dx * g * 60, y: dy * g * 60 }
}

function makeField(withSource: boolean): FlowField {
  return (x, y, t) => {
    const s = SWIRL(x, y, t)
    if (!withSource) return s
    const src = sourceField(x, y)
    return { x: s.x + src.x, y: s.y + src.y }
  }
}

function createLoop(
  srcRef: { current: boolean },
  loopRef: { current: { x: number; y: number; r: number } },
): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const withSource = srcRef.current
      const field = makeField(withSource)
      if (withSource) {
        // violet divergence shading around the source core
        for (let yy = 0; yy < h; yy += 4) {
          for (let xx = 0; xx < w; xx += 4) {
            const dx = xx / w - SRC.x
            const dy = yy / h - SRC.y
            const dvg = Math.exp(-((dx * dx + dy * dy) / (SRC.w * SRC.w)))
            if (dvg < 0.05) continue
            ctx.fillStyle = `rgba(124,58,237,${dvg * 0.35})`
            ctx.fillRect(xx, yy, 4, 4)
          }
        }
      }
      drawArrowGrid(ctx, field, 0, w, h, 34, 90)
      // the test loop + flux ticks
      const loop = loopRef.current
      const cx = loop.x * w
      const cy = loop.y * h
      const R = loop.r * Math.min(w, h)
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()
      let flux = 0
      const S = 64
      for (let k = 0; k < S; k++) {
        const a = (k / S) * Math.PI * 2
        const nx = Math.cos(a)
        const ny = Math.sin(a)
        const v = field((cx + nx * R) / w, (cy + ny * R) / h, 0)
        const f = v.x * nx + v.y * ny
        flux += f
        // tick: outward green-ish for out, inward for in — use vel blue ticks
        const tx = cx + nx * R
        const ty = cy + ny * R
        ctx.strokeStyle = f > 0 ? PALETTE.vel : PALETTE.pLo
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(tx + nx * f * 120, ty + ny * f * 120)
        ctx.stroke()
      }
      flux /= S
      ctx.fillStyle = Math.abs(flux) > 0.004 ? PALETTE.div : '#55606f'
      ctx.font = '600 13px ui-sans-serif, system-ui'
      ctx.fillText(
        `net flux through the loop: ${flux >= 0 ? '+' : ''}${(flux * 1000).toFixed(1)}`,
        10,
        20,
      )
    },
  }
}

export function DivergenceLoop({ withSource, height = 260 }: { withSource: boolean; height?: number }) {
  const srcRef = useRef(withSource)
  srcRef.current = withSource
  const loopRef = useRef({ x: 0.4, y: 0.5, r: 0.18 })
  const [r, setR] = useState(0.18)
  loopRef.current.r = r

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    loopRef.current.x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0.05), 0.95)
    loopRef.current.y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0.05), 0.95)
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim
        height={height}
        create={() => createLoop(srcRef, loopRef)}
        caption="Drag to move the loop; the ticks show flow crossing it, in or out."
      >
        <label className="sim-slider">
          <span>loop size</span>
          <input
            type="range"
            min={0.06}
            max={0.34}
            step={0.005}
            value={r}
            onChange={(e) => setR(Number(e.target.value))}
          />
        </label>
      </Sim>
    </div>
  )
}
