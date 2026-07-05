import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §13 coda — linearize Navier–Stokes about rest and waves fall out.
// Both modes solve the same 1-D wave equation q_tt = c² q_xx (explicit central
// differences, Courant number C < 1 — the string demo's scheme):
//   sound   — q is a pressure disturbance; rendered as a red/cyan pressure
//             stripe with the profile above it
//   surface — q is the water height; rendered as a free surface with amber
//             floats bobbing (they move up and down, not along — the wave
//             travels, the water mostly doesn't)
// The linearization is the point: tiny disturbances of the big equation obey
// this small one. The prose owns the simplification.

const N = 220
const C = 0.5
const FIXED_DT = 1 / 240

export type WaveMode = 'sound' | 'surface'

function createRipple(mode: WaveMode): Stepper {
  const q = new Float32Array(N)
  const qPrev = new Float32Array(N)
  const qNext = new Float32Array(N)
  // initial pulse in the middle
  const center = Math.floor(N / 2)
  for (let i = 0; i < N; i++) {
    const d = i - center
    q[i] = Math.abs(d) < 16 ? 0.5 * (1 + Math.cos((Math.PI * d) / 16)) : 0
    qPrev[i] = q[i]
  }
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        for (let i = 1; i < N - 1; i++) {
          qNext[i] = 2 * q[i] - qPrev[i] + C * C * (q[i + 1] - 2 * q[i] + q[i - 1])
        }
        // open ends for sound (waves leave); fixed walls for the tank
        if (mode === 'sound') {
          qNext[0] = qNext[1]
          qNext[N - 1] = qNext[N - 2]
        } else {
          qNext[0] = 0
          qNext[N - 1] = 0
        }
        qPrev.set(q)
        q.set(qNext)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      if (mode === 'sound') {
        // pressure stripe
        const stripeY = h * 0.62
        const stripeH = h * 0.28
        for (let i = 0; i < N; i++) {
          const p = Math.max(-1, Math.min(1, q[i] * 1.6))
          ctx.fillStyle =
            p >= 0 ? `rgba(220,38,38,${p * 0.75})` : `rgba(8,145,178,${-p * 0.75})`
          ctx.fillRect((i / N) * w, stripeY, w / N + 1, stripeH)
        }
        // profile
        ctx.strokeStyle = PALETTE.vel
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = (i / (N - 1)) * w
          const y = h * 0.35 - q[i] * h * 0.25
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      } else {
        // free surface + floats
        const mid = h * 0.45
        ctx.fillStyle = 'rgba(37,99,235,0.12)'
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let i = 0; i < N; i++) {
          ctx.lineTo((i / (N - 1)) * w, mid - q[i] * h * 0.3)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = PALETTE.vel
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < N; i++) {
          const x = (i / (N - 1)) * w
          const y = mid - q[i] * h * 0.3
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.fillStyle = PALETTE.dye
        for (let k = 0; k < 7; k++) {
          const i = Math.floor(((k + 0.5) / 7) * N)
          const x = (i / (N - 1)) * w
          const y = mid - q[i] * h * 0.3
          ctx.beginPath()
          ctx.arc(x, y - 4, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  }
}

export function RippleWaves({ mode, height = 200 }: { mode: WaveMode; height?: number }) {
  const [key, setKey] = useState(0)
  void setKey
  return <Sim height={height} create={() => createRipple(mode)} key={`${mode}-${key}`} />
}
