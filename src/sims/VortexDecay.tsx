import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §6 — a vortex dying of viscosity. Azimuthal velocity u_θ(r) obeys the
// axisymmetric momentum-diffusion equation
//   ∂u_θ/∂t = ν ( u_θ'' + u_θ'/r − u_θ/r² )
// solved explicitly on a 1-D radial grid. Stability: the r²-term is stiffest
// at small r; the slider maps to s = ν·dt/dr² ≤ S_MAX < 1/2 by construction,
// and the innermost cells are pinned (u_θ(0) = 0 by symmetry).
// Rendering: amber tracers ride circles at their radius's current speed.

const NR = 90
const S_MAX = 0.35
const FIXED_DT = 1 / 240
const N_TRACERS = 42

function createVortexDecay(sRef: { current: number }): Stepper {
  const u = new Float32Array(NR) // u_θ at radius index r
  const uNext = new Float32Array(NR)
  // initial vortex: solid-body core, 1/r-ish tail (a Lamb–Oseen-like shape)
  for (let r = 1; r < NR; r++) {
    const x = r / (NR * 0.25)
    u[r] = (1 - Math.exp(-x * x)) / x
  }
  // tracers: (radius index, angle)
  const tr = new Float32Array(N_TRACERS)
  const ta = new Float32Array(N_TRACERS)
  for (let i = 0; i < N_TRACERS; i++) {
    tr[i] = 6 + (i / N_TRACERS) * (NR - 10)
    ta[i] = (i * 2.399963) % (Math.PI * 2) // golden-angle scatter
  }

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        const s = sRef.current
        for (let r = 1; r < NR - 1; r++) {
          const lap = u[r + 1] - 2 * u[r] + u[r - 1] + (u[r + 1] - u[r - 1]) / (2 * r) - u[r] / (r * r)
          uNext[r] = u[r] + s * lap
        }
        uNext[0] = 0
        uNext[NR - 1] = uNext[NR - 2]
        u.set(uNext)
        for (let i = 0; i < N_TRACERS; i++) {
          const r = Math.round(tr[i])
          ta[i] += (u[r] / Math.max(r, 1)) * FIXED_DT * 55
        }
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const scale = (Math.min(w, h) / 2 - 8) / NR
      // speed shading: ring color by u_θ
      for (let r = 2; r < NR - 1; r += 2) {
        const sp = Math.min(u[r], 1)
        if (sp < 0.02) continue
        ctx.strokeStyle = `rgba(37,99,235,${sp * 0.5})`
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2)
        ctx.stroke()
      }
      // tracers
      ctx.fillStyle = PALETTE.dye
      for (let i = 0; i < N_TRACERS; i++) {
        const x = cx + Math.cos(ta[i]) * tr[i] * scale
        const y = cy + Math.sin(ta[i]) * tr[i] * scale
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

export function VortexDecay({ height = 280 }: { height?: number }) {
  const [frac, setFrac] = useState(0.25)
  const sRef = useRef(frac * S_MAX)
  sRef.current = frac * S_MAX
  return (
    <Sim
      height={height}
      create={() => createVortexDecay(sRef)}
      caption="A vortex decaying by momentum diffusion. Honey erases it in moments; water lets it live."
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
