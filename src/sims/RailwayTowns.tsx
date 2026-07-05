import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §5's household anchor, given its own figure (plan fig-gap): a row of towns,
// each setting noon by its own sun. All the clocks tick at the same true rate;
// only their zero conventions differ — solar noon shifts with longitude. The
// one knob sweeps between the two historical conventions: local solar time
// (every town its own zero) and railway time (one shared zero). Nothing
// physical changes as you drag — which is the entire point, and exactly the
// regauge freedom the section is about to weaponize. No integrator: the hands
// are a closed-form function of time, so there is no scheme and no stability
// condition to state.

const TOWNS = 7
const SOLAR_SPREAD = 2.1 // radians of zero-mark spread across the row (confessed: exaggerated for legibility)

function createTowns(reformRef: { current: number }): Stepper {
  let t = 0

  return {
    step(dt) {
      t += dt
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 26
      const gap = (w - 2 * pad) / TOWNS
      const r = Math.min(gap * 0.36, h * 0.22)
      const cy = h * 0.42
      const reform = reformRef.current // 0 = every town its own sun, 1 = railway time

      // the rail line the convention travels along
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(pad, h - 34)
      ctx.lineTo(w - pad, h - 34)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(107,114,128,0.5)'
      ctx.lineWidth = 1
      for (let x = pad; x < w - pad; x += 11) {
        ctx.beginPath()
        ctx.moveTo(x, h - 38)
        ctx.lineTo(x, h - 30)
        ctx.stroke()
      }

      for (let i = 0; i < TOWNS; i++) {
        const cx = pad + gap * (i + 0.5)
        // each town's zero convention: its own solar noon, blended toward the shared one
        const solarZero = (i / (TOWNS - 1) - 0.5) * SOLAR_SPREAD
        const zero = solarZero * (1 - reform)

        // the town: a little station house at the foot of its clock
        ctx.fillStyle = 'rgba(107,114,128,0.25)'
        ctx.fillRect(cx - 9, h - 56, 18, 18)
        ctx.beginPath()
        ctx.moveTo(cx - 12, h - 56)
        ctx.lineTo(cx, h - 66)
        ctx.lineTo(cx + 12, h - 56)
        ctx.closePath()
        ctx.fill()

        // fiber stem
        ctx.strokeStyle = 'rgba(107,114,128,0.5)'
        ctx.beginPath()
        ctx.moveTo(cx, h - 66)
        ctx.lineTo(cx, cy + r)
        ctx.stroke()

        // clock face
        ctx.strokeStyle = PALETTE.wall
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()

        // the zero-mark — the town's noon convention, in gauge green
        ctx.strokeStyle = PALETTE.gauge
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(-zero) * r * 0.75, cy + Math.sin(-zero) * r * 0.75)
        ctx.lineTo(cx + Math.cos(-zero) * r * 1.08, cy + Math.sin(-zero) * r * 1.08)
        ctx.stroke()

        // the hand — true time, identical in every town, drawn relative to the
        // town's own convention (the same needle-vs-zero-mark rendering the
        // clock-row uses: marks move, the sky doesn't)
        const trueTime = t * 0.5
        const hand = -(zero + trueTime)
        ctx.strokeStyle = PALETTE.theta
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(hand) * r * 0.82, cy + Math.sin(hand) * r * 0.82)
        ctx.stroke()
      }

      ctx.fillStyle = '#55606f'
      ctx.font = '12px system-ui, sans-serif'
      const label =
        reform < 0.05
          ? 'every town: noon by its own sun'
          : reform > 0.95
            ? 'railway time: one shared convention'
            : 'the reform, spreading'
      ctx.fillText(label, pad, 20)
    },
  }
}

export function RailwayTowns() {
  const [reform, setReform] = useState(0)
  const reformRef = useRef(reform)
  reformRef.current = reform
  return (
    <Sim height={230} create={() => createTowns(reformRef)}>
      <label className="sim-slider">
        <span>solar noons</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={reform}
          onChange={(e) => setReform(Number(e.target.value))}
        />
        <span>railway time</span>
      </label>
    </Sim>
  )
}
