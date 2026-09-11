import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// A dye-transport illustration, NOT a pipe-transition or Navier–Stokes solver.
// Prescribed streamfunction: psi = U(y-y³/3) + a U (1-y²)² g(x,t).
// u=psi_y, v=-psi_x: incompressible by construction, both velocities vanish
// at y=±1. The disturbance envelope vanishes at the inlet and outlet.
export const FILAMENT_DT = 1 / 120
export const FILAMENT_LENGTH = 3
const U = .75
// |g|<=1 and a<=.22 imply u>=.12 U(1-y²): downstream transport cannot reverse.
// Midpoint particle integration at dt=1/120 resolves the shortest prescribed
// spatial wavelength (>1) and temporal period (>2s). No random kicks, wall
// reflection, empirical Re threshold, or exponential amplitude growth is used.
const MAX_AMPLITUDE = .22
const MODES = [
  { weight: .65, k: 2 * Math.PI / 1.6, omega: 1.7, phase: 0 },
  { weight: .35, k: 2 * Math.PI / 1.05, omega: 2.5, phase: 1.2 },
]

export function filamentVelocity(x: number, y: number, time: number, strength: number) {
  const phase = Math.PI * x / FILAMENT_LENGTH
  const envelope = Math.sin(phase) ** 2
  const envelopeDx = Math.PI / FILAMENT_LENGTH * Math.sin(2 * phase)
  let wave = 0, waveDx = 0
  for (const mode of MODES) {
    const angle = mode.k * x - mode.omega * time + mode.phase
    wave += mode.weight * Math.sin(angle)
    waveDx += mode.weight * mode.k * Math.cos(angle)
  }
  const a = MAX_AMPLITUDE * Math.max(0, Math.min(1, strength))
  const wall = 1 - y * y
  return {
    u: U * wall * (1 - 4 * a * y * envelope * wave),
    v: -a * U * wall * wall * (envelopeDx * wave + envelope * waveDx),
  }
}

type Particle = { id: number; x: number; y: number; rose: boolean }
export interface FilamentStepper extends Stepper {
  pulse: () => void
  measure: () => { time: number; lanes: Particle[][] }
}

export function createFilament(strength: number): FilamentStepper {
  let time = 0, acc = 0, nextId = 0, pulseFor = 0
  let lanes: Particle[][] = [[], []]
  function advance() {
    const rose = pulseFor > 0
    pulseFor = Math.max(0, pulseFor - FILAMENT_DT)
    for (let lane = 0; lane < 2; lane++) {
      const amount = lane === 0 ? 0 : strength
      lanes[lane].push({ id: nextId, x: 0, y: 0, rose })
      for (const p of lanes[lane]) {
        const a = filamentVelocity(p.x, p.y, time, amount)
        const b = filamentVelocity(p.x + a.u * FILAMENT_DT / 2,
          p.y + a.v * FILAMENT_DT / 2, time + FILAMENT_DT / 2, amount)
        p.x += b.u * FILAMENT_DT
        p.y += b.v * FILAMENT_DT
      }
      // Individual parcels leave naturally. Never connect unrelated particles,
      // reorder by x, or erase a developed filament with a timed global reset.
      lanes[lane] = lanes[lane].filter(p => p.x < FILAMENT_LENGTH)
    }
    nextId++
    time += FILAMENT_DT
  }
  // Developed first frame, including when the reader changes a paused control.
  for (let i = 0; i < 12 / FILAMENT_DT; i++) advance()
  return {
    pulse() {
      pulseFor = .35
      for (const lane of lanes) for (const p of lane) if (p.x < .18) p.rose = true
    },
    measure: () => ({ time, lanes: lanes.map(lane => lane.map(p => ({ ...p }))) }),
    step(dt) {
      acc += dt
      while (acc + 1e-12 >= FILAMENT_DT) { advance(); acc -= FILAMENT_DT }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 18, laneH = (h - 16) / 2, left = 25, right = w - 20
      const px = (x: number) => left + x / FILAMENT_LENGTH * (right - left)
      for (let lane = 0; lane < 2; lane++) {
        const top = lane * laneH + pad
        const cy = top + (laneH + 20) / 2, half = (laneH - 68) / 2
        ctx.fillStyle = '#475569'
        ctx.font = '600 13px system-ui, sans-serif'
        ctx.fillText(lane === 0 ? 'Straight flow' : 'With sideways motion', left, top + 8)
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.2
        for (const y of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(left, cy + y * half)
          ctx.lineTo(right, cy + y * half); ctx.stroke()
        }
        ctx.save()
        ctx.beginPath(); ctx.rect(left - 3, cy - half, right - left + 6, 2 * half); ctx.clip()
        // Each disc represents one injected parcel. No x-sorted polyline.
        for (const rose of [false, true]) {
          ctx.fillStyle = rose ? PALETTE.dye2 : PALETTE.dye
          ctx.beginPath()
          for (const p of lanes[lane]) if (p.rose === rose) {
            const x = px(p.x), y = cy + p.y * half
            ctx.moveTo(x + 1.6, y); ctx.arc(x, y, 1.6, 0, 2 * Math.PI)
          }
          ctx.fill()
        }
        ctx.restore()
        ctx.fillStyle = PALETTE.dye
        ctx.beginPath(); ctx.arc(left, cy, 3.5, 0, 2 * Math.PI); ctx.fill()
      }
    },
  }
}

export function ReynoldsTube({ height = 380 }: { height?: number }) {
  const [strength, setStrength] = useState(.8)
  const current = useRef<FilamentStepper | null>(null)
  return (
    <Sim height={height} resetToken={strength} create={() => {
      const stepper = createFilament(strength)
      current.current = stepper
      return stepper
    }}>
      <button type="button" onClick={() => current.current?.pulse()}>Send pink pulse</button>
      <label className="sim-slider">
        <span>Sideways motion</span>
        <input aria-label="Sideways motion" type="range" min={0} max={1} step={.05}
          value={strength} onChange={e => setStrength(Number(e.target.value))} />
        <span>{Math.round(strength * 100)}%</span>
      </label>
    </Sim>
  )
}
