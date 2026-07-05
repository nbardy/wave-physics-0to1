import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §6 — two streams meet: fast water over slow water, and viscosity blends the
// seam. 1-D momentum diffusion u_t = ν u_yy on the velocity profile u(y),
// same FTCS scheme and stability discipline as ViscosityDemo (r = ν·dt/dy²
// mapped directly from the slider, r ≤ R_MAX < 1/2 by construction).
// Rendering: each row drifts at its own u(y) — amber row-markers show the
// motion, the blue profile shows the seam smearing.

const N = 110
const R_MAX = 0.4
const FIXED_DT = 1 / 240
const U_FAST = 1
const U_SLOW = 0.25

function createShearBlend(rRef: { current: number }): Stepper {
  const u = new Float32Array(N)
  const uNext = new Float32Array(N)
  for (let i = 0; i < N; i++) u[i] = i < N / 2 ? U_FAST : U_SLOW
  // row markers: one per few layers, x position advected by that layer's u
  const mx = new Float32Array(N)

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        const r = rRef.current
        for (let i = 1; i < N - 1; i++) {
          uNext[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1])
        }
        // free ends: the far field on each side keeps its speed
        uNext[0] = uNext[1]
        uNext[N - 1] = uNext[N - 2]
        u.set(uNext)
        for (let i = 0; i < N; i++) {
          mx[i] += u[i] * FIXED_DT * 0.3
          if (mx[i] > 1) mx[i] -= 1
        }
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 10
      const y = (i: number) => pad + (i / (N - 1)) * (h - 2 * pad)
      // row markers, drifting at their layer's speed
      ctx.fillStyle = PALETTE.dye
      for (let i = 2; i < N - 2; i += 4) {
        const yy = y(i)
        for (let k = 0; k < 3; k++) {
          const xx = ((mx[i] + k / 3) % 1) * w * 0.72
          ctx.fillRect(xx, yy - 1, 5, 2)
        }
      }
      // velocity profile at the right edge
      const x0 = w * 0.76
      const amp = w * 0.2
      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.beginPath()
      ctx.moveTo(x0, pad)
      ctx.lineTo(x0, h - pad)
      ctx.stroke()
      ctx.strokeStyle = PALETTE.vel
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const px = x0 + u[i] * amp
        if (i === 0) ctx.moveTo(px, y(i))
        else ctx.lineTo(px, y(i))
      }
      ctx.stroke()
    },
  }
}

export function ShearBlend({ height = 240 }: { height?: number }) {
  const [frac, setFrac] = useState(0.3)
  const rRef = useRef(frac * R_MAX)
  rRef.current = frac * R_MAX
  return (
    <Sim
      height={height}
      create={() => createShearBlend(rRef)}
      caption="Fast water over slow water. Viscosity diffuses momentum across the seam — u_t = ν u_yy."
    >
      <label className="sim-slider">
        <span>water</span>
        <input
          type="range"
          min={0.02}
          max={1}
          step={0.01}
          value={frac}
          onChange={(e) => setFrac(Number(e.target.value))}
        />
        <span>honey</span>
      </label>
    </Sim>
  )
}
