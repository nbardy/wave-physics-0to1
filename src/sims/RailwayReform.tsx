import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §10's second railway rhyme, given its own figure (plan fig-gap, the §9→§10
// dictionary anchor). The article states it in prose only: "news of a time
// reform running down the telegraph line is a ripple in the convention itself."
// Here it is, drawn — a companion/variant of RailwayTowns.tsx (which shows the
// static before/after of the reform); this one shows the reform ARRIVING, town
// by town, late, as a wavefront travelling down the line.
//
// The one knob sweeps the reform front from the left end of the line to the
// right. Towns the front has already passed have flipped their green zero-mark
// from their own solar noon to the shared railway convention; towns ahead of it
// still keep their old one. Not one amber hand ever changes its motion — the
// reform is pure gauge, exactly §8's boundary check, and carries nothing
// physical. That is the whole point of the rhyme: a convention every town
// eventually adopts is the brush's work, and light is the part no reform can
// remove.
//
// No integrator: the hands are a closed-form function of time and the front is a
// closed-form function of the slider, so there is no scheme and no stability
// condition to state (RailwayTowns precedent).

const TOWNS = 8
const SOLAR_SPREAD = 2.1 // radians of zero-mark spread across the row (confessed: exaggerated for legibility)
const FRONT_SOFT = 0.09 // how sharply the reform front switches a town, in fraction-of-row units
const TRUE_RATE = 0.5 // rad/s — every town's hand ticks at this same true rate

function townReform(townFrac: number, front: number): number {
  // 0 = the town still keeps its solar noon; 1 = it has switched to railway time.
  // A smooth step so the front reads as a travelling wavefront, not a hard edge.
  return 1 / (1 + Math.exp(-(front - townFrac) / FRONT_SOFT))
}

function createReform(frontRef: { current: number }): Stepper {
  let t = 0

  return {
    step(dt) {
      t += dt // playback time — exact solution, not an integrator
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 26
      const gap = (w - 2 * pad) / TOWNS
      const r = Math.min(gap * 0.36, h * 0.22)
      const cy = h * 0.42
      const front = frontRef.current // 0 = front at the left end, 1 = it has swept the whole line

      // the telegraph line the reform travels along, with the wavefront marked
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
      // the reform wavefront: a green pulse running down the wire (the ripple in
      // the convention itself — drawn in gauge green because that is exactly what
      // it is: α travelling)
      const frontX = pad + front * (w - 2 * pad)
      ctx.strokeStyle = PALETTE.gauge
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(frontX, h - 44)
      ctx.lineTo(frontX, h - 24)
      ctx.stroke()
      ctx.fillStyle = PALETTE.gauge
      ctx.beginPath()
      ctx.moveTo(frontX, h - 44)
      ctx.lineTo(frontX - 5, h - 50)
      ctx.lineTo(frontX + 5, h - 50)
      ctx.closePath()
      ctx.fill()

      for (let i = 0; i < TOWNS; i++) {
        const cx = pad + gap * (i + 0.5)
        const townFrac = (cx - pad) / (w - 2 * pad)
        // each town's zero convention blends from its own solar noon toward the
        // shared one as the reform front passes it
        const solarZero = (i / (TOWNS - 1) - 0.5) * SOLAR_SPREAD
        const switched = townReform(townFrac, front)
        const zero = solarZero * (1 - switched)

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

        // the zero-mark — the town's noon convention, in gauge green; a town the
        // front has just reached glows a touch brighter as it flips
        const glow = 0.55 + 0.45 * (switched < 0.5 ? switched * 2 : (1 - switched) * 2)
        ctx.strokeStyle = PALETTE.gauge
        ctx.globalAlpha = Math.min(1, glow)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(-zero) * r * 0.75, cy + Math.sin(-zero) * r * 0.75)
        ctx.lineTo(cx + Math.cos(-zero) * r * 1.08, cy + Math.sin(-zero) * r * 1.08)
        ctx.stroke()
        ctx.globalAlpha = 1

        // the hand — true time, identical in every town, drawn relative to the
        // town's own convention (marks move, the sky doesn't): NOTHING here
        // changes as the reform passes — that is the pure-gauge point
        const trueTime = t * TRUE_RATE
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
        front < 0.02
          ? 'every town: noon by its own sun — the reform has not left the capital'
          : front > 0.98
            ? 'railway time reached every town — one shared convention'
            : 'the reform, running down the wire — town by town, late'
      ctx.fillText(label, pad, 20)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('the green marks flip as the front passes; not one hand changes — a reform carries nothing', pad, h - 8)
    },
  }
}

export function RailwayReform() {
  const [front, setFront] = useState(0)
  const frontRef = useRef(front)
  frontRef.current = front
  return (
    <Sim height={250} create={() => createReform(frontRef)}>
      <label className="sim-slider">
        <span>reform sent</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={front}
          onChange={(e) => setFront(Number(e.target.value))}
        />
        <span>reform arrived</span>
      </label>
    </Sim>
  )
}
