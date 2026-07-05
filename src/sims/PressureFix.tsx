import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { drawArrowGrid, type FlowField } from './lib/field'

// §10 — the reader as inverse-solver. A source keeps pumping fluid into one
// spot (violet: divergence). The slider adds a pressure hill on the same spot;
// the hill's gradient pushes fluid away. Both fields share the same Gaussian
// profile, so at strength 1 the cancellation is exact — too weak still piles,
// too strong hollows out. Nature runs this knob automatically, every instant.

const CX = 0.5
const CY = 0.5
const W = 0.16

function fieldOf(strength: number): FlowField {
  return (x, y) => {
    const dx = x - CX
    const dy = y - CY
    const e = Math.exp(-((dx * dx + dy * dy) / (W * W)))
    // source: radial out. pressure fix: −∇p of a hill = radial in, same shape.
    const net = (1 - strength) * e * 4
    return { x: dx * net, y: dy * net }
  }
}

function createPressureFix(sRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const s = sRef.current
      const residual = 1 - s // signed leftover divergence
      // violet shading for |residual| divergence; cyan-ish tint if overshooting
      for (let yy = 0; yy < h; yy += 4) {
        for (let xx = 0; xx < w; xx += 4) {
          const dx = xx / w - CX
          const dy = yy / h - CY
          const e = Math.exp(-((dx * dx + dy * dy) / (W * W)))
          const mag = Math.abs(residual) * e
          if (mag < 0.04) continue
          ctx.fillStyle = `rgba(124,58,237,${Math.min(mag, 1) * 0.4})`
          ctx.fillRect(xx, yy, 4, 4)
        }
      }
      // pressure hill (red) proportional to slider
      for (let yy = 0; yy < h; yy += 4) {
        for (let xx = 0; xx < w; xx += 4) {
          const dx = xx / w - CX
          const dy = yy / h - CY
          const e = Math.exp(-((dx * dx + dy * dy) / (W * W))) * s
          if (e < 0.05) continue
          ctx.fillStyle = `rgba(220,38,38,${e * 0.18})`
          ctx.fillRect(xx, yy, 4, 4)
        }
      }
      drawArrowGrid(ctx, fieldOf(s), 0, w, h, 32, 140)
      ctx.fillStyle = Math.abs(residual) < 0.03 ? PALETTE.visc : PALETTE.div
      ctx.font = '600 13px ui-sans-serif, system-ui'
      const msg =
        Math.abs(residual) < 0.03
          ? 'divergence cancelled — the fluid stays honest'
          : residual > 0
            ? 'too weak: fluid still piling up'
            : 'too strong: the hill is hollowing the spot out'
      ctx.fillText(msg, 10, 20)
    },
  }
}

export function PressureFix({ height = 260 }: { height?: number }) {
  const [s, setS] = useState(0.2)
  const sRef = useRef(s)
  sRef.current = s
  return (
    <Sim
      height={height}
      create={() => createPressureFix(sRef)}
      caption="A source pumps fluid in (violet). You are the pressure field: raise the hill until the crime stops."
    >
      <label className="sim-slider">
        <span>no hill</span>
        <input
          type="range"
          min={0}
          max={1.6}
          step={0.01}
          value={s}
          onChange={(e) => setS(Number(e.target.value))}
        />
        <span>pressure hill</span>
      </label>
    </Sim>
  )
}
