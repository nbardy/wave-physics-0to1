import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { vortexField, drawArrow } from './lib/field'

// §5 — the named-solver beat (METHODOLOGY deviation #4). Two ways to move dye
// on a grid, same field, same timestep:
//   naive     — explicit centered differences: q += -dt·(u·∇q) evaluated with
//               centered stencils. Unconditionally UNSTABLE for pure advection
//               (no amount of timestep shrinking makes centered-explicit
//               transport stable) — ripples grow until the field is garbage.
//               We show the explosion on purpose, then auto-reset.
//   backtrace — semi-Lagrangian: ask "whose dye arrives here?", trace the
//               velocity backward one step, bilinearly interpolate. Stable at
//               any timestep; the price is a little smearing.
// The highlighted cell draws its backtrace arrow so the reader can see the
// question the stable scheme asks.

const NX = 100
const NY = 64
const FIXED_DT = 1 / 60
const FIELD = vortexField(0.13)

export type AdvectScheme = 'naive' | 'backtrace'

function createAdvectDemo(scheme: AdvectScheme): Stepper {
  let dye = new Float32Array(NX * NY)
  let next = new Float32Array(NX * NY)
  let blownUp = false
  let sinceReset = 0

  const seed = () => {
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const x = i / NX
        const y = j / NY
        dye[i + j * NX] = Math.exp(-(((x - 0.34) / 0.09) ** 2 + ((y - 0.5) / 0.13) ** 2))
      }
    }
    blownUp = false
    sinceReset = 0
  }
  seed()

  const off = document.createElement('canvas')
  off.width = NX
  off.height = NY
  const img = new ImageData(NX, NY)

  const sample = (f: Float32Array, x: number, y: number) => {
    const cx = Math.min(Math.max(x, 0), NX - 1.001)
    const cy = Math.min(Math.max(y, 0), NY - 1.001)
    const i0 = Math.floor(cx)
    const j0 = Math.floor(cy)
    const tx = cx - i0
    const ty = cy - j0
    const a = f[i0 + j0 * NX]
    const b = f[Math.min(i0 + 1, NX - 1) + j0 * NX]
    const c = f[i0 + Math.min(j0 + 1, NY - 1) * NX]
    const d = f[Math.min(i0 + 1, NX - 1) + Math.min(j0 + 1, NY - 1) * NX]
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 6) {
        sinceReset += FIXED_DT
        if (blownUp) {
          if (sinceReset > 1.2) seed() // linger on the wreckage, then restart
          acc -= FIXED_DT
          guard++
          continue
        }
        if (scheme === 'naive') {
          let maxAbs = 0
          for (let j = 1; j < NY - 1; j++) {
            for (let i = 1; i < NX - 1; i++) {
              const k = i + j * NX
              const v = FIELD(i / NX, j / NY, 0)
              const dqdx = (dye[k + 1] - dye[k - 1]) / 2
              const dqdy = (dye[k + NX] - dye[k - NX]) / 2
              next[k] = dye[k] - FIXED_DT * (v.x * NX * dqdx + v.y * NY * dqdy)
              const m = Math.abs(next[k])
              if (m > maxAbs) maxAbs = m
            }
          }
          if (maxAbs > 8) {
            blownUp = true
            sinceReset = 0
          }
        } else {
          for (let j = 0; j < NY; j++) {
            for (let i = 0; i < NX; i++) {
              const v = FIELD(i / NX, j / NY, 0)
              next[i + j * NX] = sample(dye, i - v.x * NX * FIXED_DT, j - v.y * NY * FIXED_DT)
            }
          }
        }
        const swap = dye
        dye = next
        next = swap
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      const d = img.data
      for (let k = 0; k < dye.length; k++) {
        const c = Math.min(Math.max(dye[k], -1), 1)
        const o = k * 4
        if (c >= 0) {
          d[o] = 247 + (217 - 247) * c
          d[o + 1] = 249 + (119 - 249) * c
          d[o + 2] = 252 + (6 - 252) * c
        } else {
          // negative dye — physically impossible, the scheme's confession
          d[o] = 247 + (124 - 247) * -c
          d[o + 1] = 249 + (58 - 249) * -c
          d[o + 2] = 252 + (237 - 252) * -c
        }
        d[o + 3] = 255
      }
      const octx = off.getContext('2d')
      if (!octx) return
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(off, 0, 0, w, h)

      if (scheme === 'backtrace') {
        // one highlighted cell asks: whose dye arrives here?
        const hx = 0.62
        const hy = 0.36
        const v = FIELD(hx, hy, 0)
        const px = hx * w
        const py = hy * h
        ctx.strokeStyle = PALETTE.vel
        ctx.setLineDash([4, 3])
        drawArrow(ctx, px, py, -v.x * w * 0.55, -v.y * h * 0.55, PALETTE.vel)
        ctx.setLineDash([])
        ctx.strokeStyle = PALETTE.wall
        ctx.strokeRect(px - 4, py - 4, 8, 8)
      }
      if (blownUp) {
        ctx.fillStyle = 'rgba(26,31,43,0.75)'
        ctx.font = '600 14px ui-sans-serif, system-ui'
        ctx.fillText('the scheme has destroyed the field — restarting…', 14, 24)
      }
    },
  }
}

export function AdvectionSchemes({ height = 240 }: { height?: number }) {
  const [scheme, setScheme] = useState<AdvectScheme>('naive')
  return (
    <Sim height={height} create={() => createAdvectDemo(scheme)} key={scheme}>
      <div className="sim-seg">
        {(['naive', 'backtrace'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={scheme === s ? 'seg-active' : ''}
            onClick={() => setScheme(s)}
          >
            {s === 'naive' ? 'obvious update' : 'trace backward'}
          </button>
        ))}
      </div>
    </Sim>
  )
}
