import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'

// Beat E — viscosity as momentum diffusion:  u_t = ν u_yy
// A 1-D jet between two stationary walls. Each layer drifts toward the average
// of its neighbours (explicit FTCS):
//   u^{n+1}_i = u^n_i + r (u_{i+1} - 2u_i + u_{i-1}),   r = ν·dt/dy²
// FTCS is stable only for r ≤ 1/2. The slider maps onto r ∈ (0, R_MAX] directly,
// so stability holds by construction — no runtime check downstream.

const N = 120 // fluid layers between the walls
const R_MAX = 0.4 // ceiling on r = ν·dt/dy², safely under the 1/2 stability bound
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence

function createJet(rRef: { current: number }): Stepper {
  const u = new Float32Array(N)
  const uNext = new Float32Array(N)

  // initial condition: a sharp-edged jet in the middle, still fluid outside
  for (let i = Math.floor(N * 0.4); i < Math.ceil(N * 0.6); i++) u[i] = 1

  let acc = 0

  const advance = () => {
    const r = rRef.current
    for (let i = 1; i < N - 1; i++) {
      uNext[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1])
    }
    uNext[0] = 0
    uNext[N - 1] = 0 // no-slip: the fluid sticks to the stationary walls
    u.set(uNext)
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 14
      const x0 = Math.round(w * 0.08)
      const amp = w * 0.78
      const y = (i: number) => pad + (i / (N - 1)) * (h - 2 * pad)

      // stationary walls, top and bottom
      ctx.strokeStyle = '#a9b1bd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, pad)
      ctx.lineTo(w, pad)
      ctx.moveTo(0, h - pad)
      ctx.lineTo(w, h - pad)
      ctx.stroke()

      // rest position (u = 0)
      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x0, pad)
      ctx.lineTo(x0, h - pad)
      ctx.stroke()

      // one arrow per few layers — that layer's velocity
      ctx.strokeStyle = '#55606f'
      ctx.fillStyle = '#55606f'
      ctx.lineWidth = 1
      for (let i = 3; i < N - 3; i += 6) {
        const len = u[i] * amp
        if (len < 2) continue
        const yy = y(i)
        ctx.beginPath()
        ctx.moveTo(x0, yy)
        ctx.lineTo(x0 + len, yy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x0 + len + 4, yy)
        ctx.lineTo(x0 + len - 2, yy - 3)
        ctx.lineTo(x0 + len - 2, yy + 3)
        ctx.closePath()
        ctx.fill()
      }

      // the velocity profile u(y)
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const px = x0 + u[i] * amp
        const py = y(i)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    },
  }
}

export function ViscosityDemo() {
  const [frac, setFrac] = useState(0.35)
  // mirror state into a ref so the running stepper reads the live value
  const rRef = useRef(frac * R_MAX)
  rRef.current = frac * R_MAX

  // inline closure is fine: <Sim> only calls create on mount/Reset, and rRef is stable
  return (
    <Sim
      height={260}
      create={() => createJet(rRef)}
      caption="A jet smoothed by viscosity — u_t = ν u_yy. The fluid sticks to the stationary walls, which slowly drain the momentum away."
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
