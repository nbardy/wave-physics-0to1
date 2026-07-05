import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { uniformField } from './lib/field'

// §4 — Following a Parcel: the material derivative made visible.
// A steady stream carries water past a patch of dye. Two instruments measure
// dye concentration: a probe bolted in place (gray) and a parcel drifting with
// the flow (amber). Dual pane: scene on the left, both concentration traces on
// the right — the same field, two histories. The field never changes in time;
// the drifting trace changes anyway. That gap IS (u·∇).

const FLOW = uniformField(0.11)
// steady dye patch: a Gaussian blob fixed in space
function dyeAt(x: number, y: number): number {
  return Math.exp(-(((x - 0.38) / 0.13) ** 2 + ((y - 0.5) / 0.2) ** 2))
}

const HISTORY = 240

function createParcelProbe(speedRef: { current: number }): Stepper {
  let px = 0.04 // the drifting parcel
  const py = 0.5
  const probeX = 0.38 // the bolted probe sits in the patch's heart
  const probeY = 0.5
  const probeTrace: number[] = []
  const parcelTrace: number[] = []
  let t = 0

  return {
    step(dt) {
      const s = speedRef.current
      t += dt * s
      const v = FLOW(px, py, t)
      px += v.x * dt * s
      if (px > 1.02) px = 0.02 // ride around again — the story repeats
      probeTrace.push(dyeAt(probeX, probeY))
      parcelTrace.push(dyeAt(px, py))
      if (probeTrace.length > HISTORY) probeTrace.shift()
      if (parcelTrace.length > HISTORY) parcelTrace.shift()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const sceneW = w * 0.56
      // dye patch as amber shading
      const cell = 8
      for (let yy = 0; yy < h; yy += cell) {
        for (let xx = 0; xx < sceneW; xx += cell) {
          const c = dyeAt(xx / sceneW, yy / h)
          if (c < 0.02) continue
          ctx.fillStyle = `rgba(217,119,6,${c * 0.55})`
          ctx.fillRect(xx, yy, cell, cell)
        }
      }
      // flow direction hint
      ctx.strokeStyle = 'rgba(37,99,235,0.35)'
      ctx.lineWidth = 1
      for (let yy = h * 0.15; yy < h; yy += h * 0.24) {
        ctx.beginPath()
        ctx.moveTo(sceneW * 0.05, yy)
        ctx.lineTo(sceneW * 0.14, yy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(sceneW * 0.14, yy)
        ctx.lineTo(sceneW * 0.12, yy - 3)
        ctx.moveTo(sceneW * 0.14, yy)
        ctx.lineTo(sceneW * 0.12, yy + 3)
        ctx.stroke()
      }
      // bolted probe (gray) and drifting parcel (amber)
      ctx.fillStyle = PALETTE.wall
      ctx.fillRect(0.38 * sceneW - 4, 0.5 * h - 4, 8, 8)
      ctx.fillStyle = PALETTE.dye
      ctx.beginPath()
      ctx.arc(px * sceneW, py * h, 5, 0, Math.PI * 2)
      ctx.fill()
      // divider
      ctx.strokeStyle = '#e5e8ee'
      ctx.beginPath()
      ctx.moveTo(sceneW + 8, 0)
      ctx.lineTo(sceneW + 8, h)
      ctx.stroke()
      // traces
      const plotX = sceneW + 20
      const plotW = w - plotX - 10
      const lane = (trace: number[], y0: number, laneH: number, color: string, label: string) => {
        ctx.strokeStyle = '#e5e8ee'
        ctx.strokeRect(plotX, y0, plotW, laneH)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.8
        ctx.beginPath()
        trace.forEach((val, i) => {
          const x = plotX + (i / (HISTORY - 1)) * plotW
          const y = y0 + laneH - val * (laneH - 6) - 3
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.fillStyle = color
        ctx.font = '11px ui-sans-serif, system-ui'
        ctx.fillText(label, plotX + 4, y0 + 13)
      }
      lane(probeTrace, 10, h / 2 - 20, PALETTE.wall, 'bolted probe reads…')
      lane(parcelTrace, h / 2 + 6, h / 2 - 20, PALETTE.dye, 'drifting parcel reads…')
    },
  }
}

export function ParcelProbe({ height = 260 }: { height?: number }) {
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim height={height} create={() => createParcelProbe(speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.1}
          max={2.5}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>speed of time</span>
      </label>
    </Sim>
  )
}
