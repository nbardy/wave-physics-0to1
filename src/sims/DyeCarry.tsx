import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { uniformField, vortexField, shearField, drawArrowGrid, type FlowField } from './lib/field'

// §5 — Advection alone: a prescribed field carries a dye blob. The field never
// reacts to the dye; the dye just rides. Grid advection is semi-Lagrangian
// (trace back, interpolate) — the same move the full solver uses later.
// One-delta across figures: only the field changes (uniform → shear → vortex).

const NX = 120
const NY = 76

const FIELDS: Record<string, FlowField> = {
  uniform: uniformField(0.12),
  shear: shearField(0.2, 0.03),
  vortex: vortexField(0.13),
}

// The blob is carried away and the figure would then sit empty — a reader who
// glances up a few seconds late sees a blank box and no advection at all. So
// each figure loops: it re-seeds once the blob has mostly left the domain
// (uniform, shear) or once the vortex has wound it past the point of being
// readable (the vortex keeps every gram of dye forever, so mass alone would
// never trigger). Re-seeding is a restart of the demonstration, not physics.
// vortex loops at 8 s, not longer: the spiral is legible from ~4–8 sim-s, and
// past ~10 s grid diffusion smears it into an amber fog (figure-audit finding —
// the reader would stare at fog for half of a longer cycle)
const LOOP_SECONDS: Record<string, number> = { uniform: 9, shear: 9, vortex: 8 }
const MASS_FLOOR = 0.4 // fraction of the initial blob still in the domain

function createDyeCarry(fieldName: keyof typeof FIELDS, speedRef: { current: number }): Stepper {
  const field = FIELDS[fieldName]
  let dye = new Float32Array(NX * NY)
  let next = new Float32Array(NX * NY)
  const loopAfter = LOOP_SECONDS[fieldName] ?? 9
  const seed = () => {
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const x = i / NX
        const y = j / NY
        dye[i + j * NX] = Math.exp(-(((x - 0.3) / 0.09) ** 2 + ((y - 0.5) / 0.13) ** 2))
      }
    }
  }
  const massOf = (f: Float32Array) => {
    let m = 0
    for (let k = 0; k < f.length; k++) m += f[k]
    return m
  }
  seed()
  const mass0 = massOf(dye)
  const off = document.createElement('canvas')
  off.width = NX
  off.height = NY
  const img = new ImageData(NX, NY)
  let t = 0
  let checkIn = 20
  const FIXED_DT = 1 / 60

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
      acc += dt * speedRef.current
      // guard must exceed max slider speed × (max frame dt / FIXED_DT), or the
      // top of the speed range silently caps at guard× real time
      let guard = 0
      while (acc >= FIXED_DT && guard < 32) {
        t += FIXED_DT
        for (let j = 0; j < NY; j++) {
          for (let i = 0; i < NX; i++) {
            const v = field(i / NX, j / NY, t)
            // backtrace in grid units: normalized velocity × grid dimension
            next[i + j * NX] = sample(dye, i - v.x * NX * FIXED_DT, j - v.y * NY * FIXED_DT)
          }
        }
        const swap = dye
        dye = next
        next = swap
        // mass check is O(N); once every ~0.3 s of sim time is plenty
        if (t > loopAfter || (checkIn-- <= 0 && massOf(dye) < MASS_FLOOR * mass0)) {
          seed()
          t = 0
        }
        if (checkIn < 0) checkIn = 20
        acc -= FIXED_DT
        guard++
      }
      // drop any backlog past one substep so a slow frame can't snowball
      acc = Math.min(acc, FIXED_DT)
    },
    draw(ctx, w, h) {
      const d = img.data
      for (let k = 0; k < dye.length; k++) {
        const c = Math.min(dye[k], 1)
        const o = k * 4
        d[o] = 247 + (217 - 247) * c
        d[o + 1] = 249 + (119 - 249) * c
        d[o + 2] = 252 + (6 - 252) * c
        d[o + 3] = 255
      }
      const octx = off.getContext('2d')
      if (!octx) return
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(off, 0, 0, w, h)
      drawArrowGrid(ctx, field, t, w, h, 40, 90, 'rgba(37,99,235,0.55)')
    },
  }
}

export function DyeCarry({ field, height = 240 }: { field: keyof typeof FIELDS; height?: number }) {
  const [speed, setSpeed] = useState(2)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim height={height} create={() => createDyeCarry(field, speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.1}
          max={10}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>speed of time</span>
      </label>
    </Sim>
  )
}
