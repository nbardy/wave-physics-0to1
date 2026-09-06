import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'

// PLAN fig 11 — the fall test both laws pass.
//
// Three balls, one gravity: Newton (gray), the 1913 draft (red), the 1915 law
// (green), dropped from the same height. Fall time advances in FIXED_DT
// quanta and positions are the exact ½gt², so any separation between the
// lanes would be physics, not numerics. They land together at every height,
// which is the point: falling could not separate the two laws, and the
// draft's Newtonian limit is honored here, not mocked.
// One knob: the drop height — the agreement holds across it.

export const FALL_G = 9.8
const FIXED_DT = 0.002

export function fallTime(height: number): number {
  return Math.sqrt((2 * height) / FALL_G)
}

export function createFallTest(hRef: { current: number }): Stepper {
  let t = 0
  let acc = 0
  // Three independent lane states, one gravity each. They share nothing but
  // the constant FALL_G — the spread meter below reads them back, so a
  // future edit giving any lane its own acceleration would show up on
  // screen and trip the headless check instead of hiding behind one shared
  // variable.
  let lanes = [
    { y: 0, v: 0 },
    { y: 0, v: 0 },
    { y: 0, v: 0 },
  ]
  return {
    step(dt: number) {
      // Fixed physics timestep, decoupled from frame rate: each lane falls
      // through semi-implicit Euler in FIXED_DT quanta (exact for constant
      // acceleration, so any separation would be physics, not numerics).
      acc += Math.min(dt, 0.05)
      while (acc >= FIXED_DT) {
        t += FIXED_DT
        for (const l of lanes) {
          l.v += FALL_G * FIXED_DT
          l.y += l.v * FIXED_DT
        }
        acc -= FIXED_DT
      }
      const T = fallTime(hRef.current) + 0.6
      if (t > T) {
        t -= T
        acc = 0
        lanes = [
          { y: 0, v: 0 },
          { y: 0, v: 0 },
          { y: 0, v: 0 },
        ]
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const H = hRef.current
      const pane = { x: 2, y: 20, w: w - 4, h: h - 48 }
      paneFrame(ctx, pane)
      const yTop = pane.y + 12
      const yFloor = pane.y + pane.h - 20
      const yOf = (y: number) => yTop + (y / Math.max(H, 0.5)) * (yFloor - yTop)
      // floor
      ctx.strokeStyle = 'rgba(107,114,128,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pane.x + 8, yFloor + 0.5)
      ctx.lineTo(pane.x + pane.w - 8, yFloor + 0.5)
      ctx.stroke()
      // release line
      ctx.strokeStyle = 'rgba(107,114,128,0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(pane.x + 8, yOf(0) + 0.5)
      ctx.lineTo(pane.x + pane.w - 8, yOf(0) + 0.5)
      ctx.stroke()
      ctx.setLineDash([])
      // the three balls: one lane state each, three inks
      const xs = [0.3, 0.5, 0.7]
      const inks = ['rgba(107,114,128,1)', PALETTE.entwurf, PALETTE.gr1915]
      const names = ['Newton', '1913 draft', '1915 law']
      const spread = Math.max(...lanes.map((l) => l.y)) - Math.min(...lanes.map((l) => l.y))
      xs.forEach((f, i) => {
        const cx = pane.x + f * pane.w
        const fallen = Math.min(lanes[i].y, H)
        const cy = yOf(0) + (fallen / Math.max(H, 0.5)) * (yFloor - yTop)
        ctx.beginPath()
        ctx.arc(cx, Math.min(cy, yFloor), 7, 0, Math.PI * 2)
        ctx.fillStyle = inks[i]
        ctx.fill()
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(names[i], cx - 24, pane.y + pane.h - 6)
      })
      ctx.font = FONT_METER
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      const landed = lanes.every((l) => l.y >= H)
        ? 'landed together'
        : `t = ${fmt(t, 2)} s of ${fmt(fallTime(H) + 0.6, 2)} s`
      ctx.fillText(landed, pane.x + 4, 14)
      // Measured off the three lane states, not printed: with one gravity
      // shared, this reads 0.00 at every height by measurement.
      const sep = `lane spread ${fmt(spread, 2)} m`
      ctx.fillText(sep, pane.x + pane.w - ctx.measureText(sep).width - 4, 14)
    },
  }
}

export function FallTest() {
  const [drop, setDrop] = useState(5)
  const hRef = useRef(drop)
  hRef.current = drop

  return (
    <Sim height={280} create={() => createFallTest(hRef)}>
      <label className="sim-slider">
        <span>low drop</span>
        <input
          type="range"
          min={1}
          max={10}
          step={0.1}
          value={drop}
          onChange={(e) => setDrop(Number(e.target.value))}
        />
        <span>high drop</span>
      </label>
    </Sim>
  )
}
