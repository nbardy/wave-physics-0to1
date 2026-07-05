import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import {
  breezeField,
  uniformField,
  vortexField,
  drawArrowGrid,
  MarkerSystem,
  SpeedMap,
  type FlowField,
} from './lib/field'

// §2 — Seeing Flow. One scene (a breezy stream), four instruments:
//   reeds   — stalks bending with the local flow (the physical tell)
//   arrows  — velocity sampled at fixed points (the Eulerian view)
//   markers — parcels riding the flow, with ghost trails (the Lagrangian view)
//   speed   — speed as color (direction traded for coverage)
// One component, one-delta per figure: only the instrument changes.

export type FlowVisMode = 'creek' | 'arrows' | 'markers' | 'speed' | 'combo'

const FIELDS: Record<string, FlowField> = {
  breeze: breezeField(0.16, 0.05),
  uniform: uniformField(0.18),
  vortex: vortexField(0.16),
}

const N_REEDS = 26

function createFlowVis(mode: FlowVisMode, fieldName: keyof typeof FIELDS, speedRef: { current: number }): Stepper {
  const field = FIELDS[fieldName]
  const markers = new MarkerSystem(mode === 'creek' ? 26 : 60, 7)
  const speedMap = new SpeedMap()
  let t = 0

  return {
    step(dt) {
      const s = speedRef.current
      t += dt * s
      if (mode === 'creek' || mode === 'markers' || mode === 'combo') {
        markers.step(dt * s, field, t)
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      if (mode === 'speed' || mode === 'combo') {
        speedMap.draw(ctx, field, t, w, h, 0.25)
      }
      if (mode === 'creek') {
        // reeds: stalks anchored at the bottom, tips deflected by the local flow
        ctx.lineWidth = 2
        ctx.strokeStyle = PALETTE.visc
        for (let i = 0; i < N_REEDS; i++) {
          const x = ((i + 0.5) / N_REEDS) * w
          const base = h - 4
          const len = h * 0.28
          const v = field(x / w, (base - len / 2) / h, t)
          const bend = v.x * 220
          ctx.beginPath()
          ctx.moveTo(x, base)
          ctx.quadraticCurveTo(x + bend * 0.3, base - len * 0.6, x + bend, base - len)
          ctx.stroke()
        }
        markers.draw(ctx, w, h, true)
      }
      if (mode === 'arrows' || mode === 'combo') {
        drawArrowGrid(ctx, field, t, w, h, 36, 110)
      }
      if (mode === 'markers') {
        markers.draw(ctx, w, h, true)
      }
    },
  }
}

export function FlowVis({
  mode,
  field = 'breeze',
  height = 240,
}: {
  mode: FlowVisMode
  field?: keyof typeof FIELDS
  height?: number
}) {
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed

  return (
    <Sim height={height} create={() => createFlowVis(mode, field, speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.05}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>speed of time</span>
      </label>
    </Sim>
  )
}
