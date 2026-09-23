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
//
// The history lesson mounts `arrows` with the `eddy` field and a probe: the
// breeze is near-uniform, so a still of it showed nothing of "at THIS point,
// how fast" (visual audit 2026-09-23). An eddy carried past a fixed probe does.

export type FlowVisMode = 'creek' | 'arrows' | 'markers' | 'speed' | 'combo'

// A train of eddies carried downstream at the base speed, periodic in x so
// one is always in frame. Each eddy is the vortexField kernel about a moving
// centre; the sum of divergence-free fields is divergence-free.
function eddyField(base: number, strength: number, r0: number): FlowField {
  return (x, y, t) => {
    const cx = ((0.5 + base * t) % 1 + 1) % 1
    const dx = ((x - cx + 0.5) % 1 + 1) % 1 - 0.5
    const dy = y - 0.5
    const fall = Math.exp(-((Math.hypot(dx, dy) / r0) ** 2))
    return { x: base - dy * strength * fall, y: dx * strength * fall }
  }
}

const FIELDS: Record<string, FlowField> = {
  breeze: breezeField(0.16, 0.05),
  uniform: uniformField(0.18),
  vortex: vortexField(0.16),
  eddy: eddyField(0.1, 1.4, 0.26),
}

const N_REEDS = 26
const SEPIA = '#78716c'

function createFlowVis(
  mode: FlowVisMode,
  fieldName: keyof typeof FIELDS,
  speedRef: { current: number },
  probeRef: { current: { x: number; y: number } | null },
): Stepper {
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
      const probe = probeRef.current
      if (probe) {
        // one fixed point, its velocity right now: a ring, a heavier arrow,
        // and the reading. Drag the ring to ask about a different point.
        const px = probe.x * w, py = probe.y * h
        const v = field(probe.x, probe.y, t)
        ctx.strokeStyle = '#17191d'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(px, py, 7, 0, Math.PI * 2)
        ctx.stroke()
        // drawArrow fixes its own 1.4 px line; the probe's arrow is heavier
        const ax = v.x * 110, ay = v.y * 110, al = Math.hypot(ax, ay) || 1
        ctx.strokeStyle = PALETTE.vel
        ctx.fillStyle = PALETTE.vel
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + ax, py + ay)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(px + ax + (ax / al) * 6, py + ay + (ay / al) * 6)
        ctx.lineTo(px + ax - (ay / al) * 4, py + ay + (ax / al) * 4)
        ctx.lineTo(px + ax + (ay / al) * 4, py + ay - (ax / al) * 4)
        ctx.closePath()
        ctx.fill()
        const speed = Math.hypot(v.x, v.y)
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace'
        const line1 = 'at the ring, now'
        const line2 = `speed ${speed.toFixed(2)} widths/s`
        const tw = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 16
        const bx = w - tw - 10, by = 10
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillRect(bx, by, tw, 40)
        ctx.strokeStyle = SEPIA
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, tw, 40)
        ctx.fillStyle = SEPIA
        ctx.font = '600 10px ui-sans-serif, system-ui'
        ctx.fillText(line1, bx + 8, by + 15)
        ctx.fillStyle = '#17191d'
        ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace'
        ctx.fillText(line2, bx + 8, by + 31)
        ctx.fillStyle = SEPIA
        ctx.font = '10px ui-sans-serif, system-ui'
        ctx.fillText('drag the ring', 10, h - 8)
      }
    },
  }
}

export function FlowVis({
  mode,
  field = 'breeze',
  height = 240,
  probe = false,
}: {
  mode: FlowVisMode
  field?: keyof typeof FIELDS
  height?: number
  /** Show a draggable fixed point with its instantaneous velocity and speed. */
  probe?: boolean
}) {
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const probeRef = useRef<{ x: number; y: number } | null>(probe ? { x: 0.5, y: 0.5 } : null)
  const dragging = useRef(false)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!probeRef.current) return
    const canvas = e.currentTarget.querySelector('canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (e.type === 'pointerdown') dragging.current = true
    else if (e.type === 'pointerup' || e.type === 'pointercancel') dragging.current = false
    if (dragging.current) probeRef.current = { x: Math.min(0.98, Math.max(0.02, x)), y: Math.min(0.98, Math.max(0.02, y)) }
  }

  return (
    <div
      className={probe ? 'sim-stir' : undefined}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      onPointerCancel={onPointer}
    >
      <Sim height={height} create={() => createFlowVis(mode, field, speedRef, probeRef)}>
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
    </div>
  )
}
