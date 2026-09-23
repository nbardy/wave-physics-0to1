import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §2 — a wave is a choice at every point (reuse-with-overlay family).
// The same 1-D string wave rendered at four one-delta stages:
//   'string'  — just the wave (lesson 01's object, re-taught)
//   'rails'   — + a vertical rail (the value space) over sample points
//   'section' — + the wave shown as one choice per rail (amber dots)
//   'strip'   — + the total space tinted: the strip every graph lives in
// and one stage for the history lesson (d'Alembert, 1747):
//   'plucked' — the string alone, pinned ends marked, with the acceleration
//               each point feels drawn from its local curvature: the equation
//               u_tt = c² u_xx as a picture, not amber dye.
//
// Physics: u_tt = c² u_xx, explicit central differences at Courant number
// C = c·dt/dx = 1, the step at which the scheme reproduces d'Alembert's
// travelling solution exactly (no numerical dispersion). Before 2026-09-23 this
// ran at C = 0.5 with the loss factor applied to the whole update, which is a
// Klein–Gordon mass term, not friction: long wavelengths outran the pulse and
// the string sagged into a diagonal with ripples behind it. Loss now acts on
// the velocity only.
const N = 160
const C = 1
const FIXED_DT = 1 / 120
const DAMP = 0.9999 // barely-there loss so Reset isn't required to keep shape
const SEPIA = '#78716c' // lesson-03 history furniture

export type StringStage = 'string' | 'rails' | 'section' | 'strip' | 'plucked'

function createString(stage: StringStage): Stepper {
  const u = new Float32Array(N)
  const uPrev = new Float32Array(N)
  const uNext = new Float32Array(N)
  // travelling raised-cosine pulse: u(x, t) = f(x − ct), so the previous step
  // is the pulse shifted C cells to the RIGHT, and the wave moves right.
  const shape = (x: number) => {
    const d = x - N * 0.3
    const hw = 16
    return Math.abs(d) < hw ? 0.5 * (1 + Math.cos((Math.PI * d) / hw)) : 0
  }
  for (let i = 0; i < N; i++) {
    u[i] = shape(i)
    uPrev[i] = shape(i + C)
  }

  let acc = 0
  const advance = () => {
    const c2 = C * C
    for (let i = 1; i < N - 1; i++) {
      uNext[i] = u[i] + (u[i] - uPrev[i]) * DAMP + c2 * (u[i + 1] - 2 * u[i] + u[i - 1])
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
      if (stage === 'rails' || stage === 'section' || stage === 'strip') {
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
      if (stage === 'plucked') {
        // acceleration ∝ curvature: at every eighth point, an arrow of the
        // second difference, pointing where that point is being pulled
        ctx.strokeStyle = SEPIA
        ctx.fillStyle = SEPIA
        ctx.lineWidth = 1.5
        for (let i = railStep; i < N - 1; i += railStep) {
          const curv = u[i + 1] - 2 * u[i] + u[i - 1]
          const len = curv * amp * 18
          if (Math.abs(len) < 2) continue
          const x0 = x(i), y0 = y(u[i]), y1 = y0 - len
          const dir = Math.sign(len)
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x0, y1)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(x0, y1)
          ctx.lineTo(x0 - 3, y1 + dir * 5)
          ctx.lineTo(x0 + 3, y1 + dir * 5)
          ctx.closePath()
          ctx.fill()
        }
      }
      // the string itself
      ctx.strokeStyle = stage === 'string' ? PALETTE.theta : stage === 'plucked' ? '#334155' : 'rgba(217,119,6,0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        if (i === 0) ctx.moveTo(x(i), y(u[i]))
        else ctx.lineTo(x(i), y(u[i]))
      }
      ctx.stroke()
      if (stage === 'plucked') {
        // pinned ends and the key
        ctx.fillStyle = PALETTE.wall
        for (const px of [x(0), x(N - 1)]) {
          ctx.fillRect(px - 3, mid - 14, 6, 28)
        }
        ctx.fillStyle = SEPIA
        ctx.font = '600 10px ui-sans-serif, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('fixed', x(0), mid + 26)
        ctx.fillText('fixed', x(N - 1), mid + 26)
        ctx.textAlign = 'left'
        ctx.font = '11px ui-sans-serif, system-ui'
        ctx.fillText('string', pad + 8, 16)
        ctx.fillText('arrows: acceleration, set by the local curvature', pad + 8, h - 8)
      }
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
