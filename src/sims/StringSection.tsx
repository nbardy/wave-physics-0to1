import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §2 — a wave is a choice at every point (reuse-with-overlay family).
// The same 1-D string wave rendered at four one-delta stages:
//   'string'  — just the wave (lesson 01's object, re-taught)
//   'rails'   — + a vertical rail (the value space) over sample points
//   'section' — + the wave shown as one choice per rail (amber dots)
//   'strip'   — + the total space tinted: the strip every graph lives in
//
// Physics: u_tt = c² u_xx, explicit central differences,
// stability: Courant number C = c·dt/dx ≤ 1 — C = 0.5 by construction.
const N = 160
const C = 0.5
const FIXED_DT = 1 / 240
const DAMP = 0.99995 // barely-there loss so Reset isn't required to keep shape

export type StringStage = 'string' | 'rails' | 'section' | 'strip'

function createString(stage: StringStage): Stepper {
  const u = new Float32Array(N)
  const uPrev = new Float32Array(N)
  const uNext = new Float32Array(N)
  // travelling raised-cosine pulse: set u and uPrev to the same pulse shifted
  // one step left, so the wave moves right from the first frame
  const shape = (x: number) => {
    const d = x - N * 0.3
    const hw = 16
    return Math.abs(d) < hw ? 0.5 * (1 + Math.cos((Math.PI * d) / hw)) : 0
  }
  for (let i = 0; i < N; i++) {
    u[i] = shape(i)
    uPrev[i] = shape(i - C) // exact traveling-wave seed for the scheme
  }

  let acc = 0
  const advance = () => {
    const c2 = C * C
    for (let i = 1; i < N - 1; i++) {
      uNext[i] = (2 * u[i] - uPrev[i] + c2 * (u[i + 1] - 2 * u[i] + u[i - 1])) * DAMP
    }
    uNext[0] = 0
    uNext[N - 1] = 0
    uPrev.set(u)
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
      const pad = 16
      const x = (i: number) => pad + (i / (N - 1)) * (w - 2 * pad)
      const mid = h * 0.55
      const amp = h * 0.32
      const y = (v: number) => mid - v * amp

      if (stage === 'strip') {
        // the total space: every (position, value) pair the wave could occupy
        ctx.fillStyle = 'rgba(107,114,128,0.08)'
        ctx.fillRect(pad, mid - amp, w - 2 * pad, 2 * amp)
      }
      const railStep = 8
      if (stage !== 'string') {
        // the rails: each point's own value space, drawn over a sample of points
        ctx.strokeStyle = 'rgba(107,114,128,0.45)'
        ctx.lineWidth = 1
        for (let i = 0; i < N; i += railStep) {
          ctx.beginPath()
          ctx.moveTo(x(i), mid - amp)
          ctx.lineTo(x(i), mid + amp)
          ctx.stroke()
        }
      }
      // rest position
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.beginPath()
      ctx.moveTo(pad, mid)
      ctx.lineTo(w - pad, mid)
      ctx.stroke()
      // the string itself
      ctx.strokeStyle = stage === 'string' ? PALETTE.theta : 'rgba(217,119,6,0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        if (i === 0) ctx.moveTo(x(i), y(u[i]))
        else ctx.lineTo(x(i), y(u[i]))
      }
      ctx.stroke()
      if (stage === 'section' || stage === 'strip') {
        // the section: one committed choice per rail
        ctx.fillStyle = PALETTE.theta
        for (let i = 0; i < N; i += railStep) {
          ctx.beginPath()
          ctx.arc(x(i), y(u[i]), 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  }
}

export function StringSection({ stage }: { stage: StringStage }) {
  return <Sim height={220} create={() => createString(stage)} />
}
