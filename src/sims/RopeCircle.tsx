import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { clockRow, drawAngleGraph, drawBase, drawClocks, laneSplit } from './lib/clocks'

// §3 — the phase clock (reuse-with-overlay family). A rope whirled in a helix:
// every point travels a circle, so the wave's value is an angle.
//   'rope'    — the whirled rope, with the circles a few points trace made visible
//   'extract' — + one circle lifted out: the fiber over that point
//   'clocks'  — the clock-row picture: needles at θ(x,t), the θ graph beneath,
//               and the energy meter (the string's recipe — planted here, §5
//               breaks it, §6 repairs it).
//
// The wave is the exact traveling solution θ = kx − ωt (no integrator needed;
// nothing to go unstable). The time-speed slider is the house-default knob.

const N = 28 // clock fibers
const ROPE_SAMPLES = 140
const K = (2 * Math.PI * 2.2) / 1 // ~2.2 turns across the span (x in [0,1])
const OMEGA = 2.6

export type RopeStage = 'rope' | 'extract' | 'clocks'

function createRope(stage: RopeStage, speedRef: { current: number }): Stepper {
  let t = 0
  const theta = new Float32Array(N)

  return {
    step(dt) {
      t += dt * speedRef.current
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      if (stage === 'clocks') {
        for (let i = 0; i < N; i++) theta[i] = K * (i / (N - 1)) - OMEGA * t

        const [top, bottom] = laneSplit(w, h, [0.62, 0.38])
        const row = clockRow(top, N)
        drawBase(ctx, row, top)
        drawClocks(ctx, row, theta)
        drawAngleGraph(ctx, bottom, row, theta, PALETTE.theta, 'θ(x) — needle angle')

        // the energy meter, computed by the string's recipe: (∂θ/∂t)² + c²(∂θ/∂x)².
        // The rate term uses the wave's own physical ω (not playback frames — the
        // meter must not care about the time-speed slider); the twist term is
        // measured numerically from the drawn needles, because that is exactly the
        // term §5's regauge brush will corrupt. Steady wave → the meter holds still.
        const dx = 1 / (N - 1)
        const cScale = OMEGA / K // wave speed: makes both terms comparable
        let e = 0
        for (let i = 0; i < N - 1; i++) {
          const twist = (theta[i + 1] - theta[i]) / dx
          e += (OMEGA * OMEGA + cScale * cScale * twist * twist) * dx
        }
        e /= OMEGA * OMEGA * 2 // normalize: steady wave reads 1.0
        ctx.fillStyle = '#55606f'
        ctx.font = '13px system-ui, sans-serif'
        ctx.fillText(`energy (the string's recipe): ${e.toFixed(2)}`, 12, 20)
        return
      }

      // 'rope' and 'extract': the whirled rope. Each point x sits at angle
      // θ = kx − ωt on a circle in the plane transverse to the rope; we draw the
      // vertical component as the rope's shape and the traced circles beside it.
      const pad = 20
      const midY = h * 0.5
      const amp = h * 0.26
      const x = (f: number) => pad + f * (w - 2 * pad)

      // circles a few points trace (the value spaces, seen edge-on as ellipses)
      const marks = stage === 'extract' ? [0.25, 0.55, 0.85] : [0.25, 0.55, 0.85]
      for (const f of marks) {
        ctx.strokeStyle = 'rgba(107,114,128,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(x(f), midY, amp * 0.32, amp, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // the rope: y = amp·sin(θ), with the depth component drawn as lightness
      for (let i = 0; i < ROPE_SAMPLES - 1; i++) {
        const f0 = i / (ROPE_SAMPLES - 1)
        const f1 = (i + 1) / (ROPE_SAMPLES - 1)
        const th0 = K * f0 - OMEGA * t
        const th1 = K * f1 - OMEGA * t
        const depth = (Math.cos(th0) + 1) / 2 // 0 = far, 1 = near
        ctx.strokeStyle = `rgba(217,119,6,${0.35 + 0.65 * depth})`
        ctx.lineWidth = 1.5 + depth * 1.5
        ctx.beginPath()
        ctx.moveTo(x(f0), midY + Math.sin(th0) * amp)
        ctx.lineTo(x(f1), midY + Math.sin(th1) * amp)
        ctx.stroke()
      }

      // current position of the marked points on their circles
      for (const f of marks) {
        const th = K * f - OMEGA * t
        ctx.fillStyle = PALETTE.theta
        ctx.beginPath()
        ctx.arc(x(f) + Math.cos(th) * amp * 0.32, midY + Math.sin(th) * amp, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      if (stage === 'extract') {
        // one fiber lifted out: the middle circle enlarged at the right, face-on,
        // with its needle — the clock face this section's figures will draw from now on
        const cx = w - 74
        const cy = 64
        const r = 40
        ctx.strokeStyle = PALETTE.wall
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
        const th = K * 0.55 - OMEGA * t
        ctx.strokeStyle = PALETTE.theta
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(-th) * r * 0.85, cy + Math.sin(-th) * r * 0.85)
        ctx.stroke()
        ctx.fillStyle = '#55606f'
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillText('the fiber over x = 0.55, face-on', cx - 70, cy + r + 18)
        // tie it to its home
        ctx.strokeStyle = 'rgba(107,114,128,0.5)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(x(0.55), midY - amp)
        ctx.lineTo(cx, cy + r)
        ctx.stroke()
        ctx.setLineDash([])
      }
    },
  }
}

export function RopeCircle({ stage }: { stage: RopeStage }) {
  const [speed, setSpeed] = useState(0.6)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim height={stage === 'clocks' ? 300 : 240} create={() => createRope(stage, speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.05}
          max={1.5}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}
