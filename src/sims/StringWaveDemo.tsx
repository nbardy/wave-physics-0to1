import { Sim, type Stepper } from '../components/Sim'

// 1-D wave equation on a fixed-end string, solved with explicit central
// finite differences:   u_tt = c^2 u_xx
// Update:  u^{n+1}_i = 2u^n_i - u^{n-1}_i + C^2 (u_{i+1} - 2u_i + u_{i-1})
// with Courant number C = c·dt/dx < 1 for stability.
//
// This is a scaffold demo used by the Stack-check page to prove the sim
// framework works. It is NOT lesson content.

const N = 240 // spatial samples
const C = 0.5 // Courant number (must stay < 1)
const DAMP = 0.9997 // mild loss so a pluck eventually settles
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence

function createStringWave(): Stepper {
  const u = new Float32Array(N)
  const uPrev = new Float32Array(N)
  const uNext = new Float32Array(N)

  // initial condition: a raised-cosine pluck at ~1/3 span, zero velocity
  const center = Math.floor(N / 3)
  const halfWidth = 24
  for (let i = 0; i < N; i++) {
    const d = i - center
    u[i] = Math.abs(d) < halfWidth ? 0.5 * (1 + Math.cos((Math.PI * d) / halfWidth)) : 0
    uPrev[i] = u[i]
  }

  let acc = 0

  const advance = () => {
    for (let i = 1; i < N - 1; i++) {
      uNext[i] = DAMP * (2 * u[i] - uPrev[i] + C * C * (u[i + 1] - 2 * u[i] + u[i - 1]))
    }
    uNext[0] = 0
    uNext[N - 1] = 0 // fixed (Dirichlet) endpoints
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
      const mid = h / 2
      const amp = h * 0.38

      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(w, mid)
      ctx.stroke()

      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * w
        const y = mid - u[i] * amp
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    },
  }
}

export function StringWaveDemo() {
  return (
    <Sim
      height={220}
      create={createStringWave}
      caption="Plucked string — u_tt = c² u_xx via explicit finite differences."
    />
  )
}
