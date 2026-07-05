import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { drawArrow } from './lib/field'

// §3 / §8 — the molecular picture, visited once and then formally abandoned.
// Modes (one-delta per figure):
//   still   — thermal motion only; resizable averaging box; mean ≈ 0
//   wind    — thermal motion + a drift far smaller than thermal speed;
//             the drift is invisible per-particle, undeniable in the average
//   collide — a solid block in the box; collisions flash on its surface
//             (pressure as bombardment)
//
// Honesty note: particles bounce off walls but do not collide with each other;
// direction is instead re-randomized at a fixed rate as a statistical stand-in
// for intermolecular collisions. The prose confesses this.

const N = 700
const THERMAL = 90 // px/s — thermal speed scale
const RESHUFFLE = 0.8 // per-second probability of a "collision" redirect

export type ParticleBoxMode = 'still' | 'wind' | 'collide'

function createParticleBox(
  mode: ParticleBoxMode,
  boxRef: { current: number },
  windRef: { current: number },
): Stepper {
  const xs = new Float32Array(N)
  const ys = new Float32Array(N)
  const vx = new Float32Array(N)
  const vy = new Float32Array(N)
  const flashes: { x: number; y: number; age: number }[] = []

  let s = 42
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let z = Math.imul(s ^ (s >>> 15), 1 | s)
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 0; i < N; i++) {
    xs[i] = rand()
    ys[i] = rand()
    const a = rand() * Math.PI * 2
    const sp = THERMAL * (0.5 + rand())
    vx[i] = Math.cos(a) * sp
    vy[i] = Math.sin(a) * sp
  }

  return {
    step(dt) {
      const wind = mode === 'wind' ? windRef.current : 0
      for (let i = 0; i < N; i++) {
        if (Math.random() < RESHUFFLE * dt) {
          const a = Math.random() * Math.PI * 2
          const sp = THERMAL * (0.5 + Math.random())
          vx[i] = Math.cos(a) * sp
          vy[i] = Math.sin(a) * sp
        }
        xs[i] += ((vx[i] + wind) * dt) / 560
        ys[i] += (vy[i] * dt) / 560
        if (xs[i] < 0) {
          xs[i] = -xs[i]
          vx[i] = Math.abs(vx[i])
        }
        if (xs[i] > 1) {
          xs[i] = 2 - xs[i]
          vx[i] = -Math.abs(vx[i])
        }
        if (ys[i] < 0) {
          ys[i] = -ys[i]
          vy[i] = Math.abs(vy[i])
        }
        if (ys[i] > 1) {
          ys[i] = 2 - ys[i]
          vy[i] = -Math.abs(vy[i])
        }
        if (mode === 'collide') {
          // solid block in the middle: reflect, and record the impact
          const bx0 = 0.42
          const bx1 = 0.58
          const by0 = 0.35
          const by1 = 0.65
          if (xs[i] > bx0 && xs[i] < bx1 && ys[i] > by0 && ys[i] < by1) {
            const dl = xs[i] - bx0
            const dr = bx1 - xs[i]
            const dd = ys[i] - by0
            const du = by1 - ys[i]
            const m = Math.min(dl, dr, dd, du)
            if (m === dl) {
              xs[i] = bx0
              vx[i] = -Math.abs(vx[i])
            } else if (m === dr) {
              xs[i] = bx1
              vx[i] = Math.abs(vx[i])
            } else if (m === dd) {
              ys[i] = by0
              vy[i] = -Math.abs(vy[i])
            } else {
              ys[i] = by1
              vy[i] = Math.abs(vy[i])
            }
            flashes.push({ x: xs[i], y: ys[i], age: 0 })
          }
        }
      }
      for (let f = flashes.length - 1; f >= 0; f--) {
        flashes[f].age += dt
        if (flashes[f].age > 0.5) flashes.splice(f, 1)
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      // particles
      ctx.fillStyle = 'rgba(85,96,111,0.55)'
      for (let i = 0; i < N; i++) {
        ctx.fillRect(xs[i] * w - 1, ys[i] * h - 1, 2, 2)
      }
      if (mode === 'collide') {
        ctx.fillStyle = PALETTE.wall
        ctx.fillRect(0.42 * w, 0.35 * h, 0.16 * w, 0.3 * h)
        ctx.fillStyle = PALETTE.pHi
        for (const f of flashes) {
          ctx.globalAlpha = 1 - f.age * 2
          ctx.beginPath()
          ctx.arc(f.x * w, f.y * h, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        return
      }
      // averaging box + mean-velocity arrow
      const half = boxRef.current / 2
      const cx = 0.5
      const cy = 0.5
      let sumx = 0
      let sumy = 0
      let count = 0
      const wind = mode === 'wind' ? windRef.current : 0
      for (let i = 0; i < N; i++) {
        if (Math.abs(xs[i] - cx) < half && Math.abs(ys[i] - cy) < half) {
          sumx += vx[i] + wind
          sumy += vy[i]
          count++
        }
      }
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect((cx - half) * w, (cy - half) * h, half * 2 * w, half * 2 * h)
      ctx.setLineDash([])
      if (count > 0) {
        // the average arrow is drawn 6× larger than a single particle's arrow
        // would be — confessed in the prose
        drawArrow(ctx, cx * w, cy * h, (sumx / count) * 0.55, (sumy / count) * 0.55, PALETTE.vel)
      }
      ctx.fillStyle = '#55606f'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(`${count} particles in the box`, 10, h - 10)
      if (mode === 'wind') {
        ctx.fillText(`drift: ${wind.toFixed(0)} (thermal speed ≈ ${THERMAL})`, 10, h - 26)
      }
    },
  }
}

export function ParticleBox({ mode, height = 300 }: { mode: ParticleBoxMode; height?: number }) {
  const [box, setBox] = useState(0.3)
  const [wind, setWind] = useState(6)
  const boxRef = useRef(box)
  const windRef = useRef(wind)
  boxRef.current = box
  windRef.current = wind

  return (
    <Sim height={height} create={() => createParticleBox(mode, boxRef, windRef)}>
      {mode !== 'collide' && (
        <label className="sim-slider">
          <span>box size</span>
          <input
            type="range"
            min={0.08}
            max={0.9}
            step={0.01}
            value={box}
            onChange={(e) => setBox(Number(e.target.value))}
          />
        </label>
      )}
      {mode === 'wind' && (
        <label className="sim-slider">
          <span>still</span>
          <input
            type="range"
            min={0}
            max={18}
            step={0.5}
            value={wind}
            onChange={(e) => setWind(Number(e.target.value))}
          />
          <span>wind</span>
        </label>
      )}
    </Sim>
  )
}
