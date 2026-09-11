import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Oscillatory Couette flow: u_t = nu u_yy, u(0,t)=0, u(1,t)=cos(omega t).
// The periodic solution is Re[H(y) exp(i omega t)],
// H = sinh(k y)/sinh(k), k=(1+i)sqrt(omega/(2 nu)).
// This is a continuum illustration of momentum transfer, NOT Navier's molecular
// model. It starts in the periodic regime; changing nu selects another periodic
// solution at the same phase, not a transient change of material properties.
// Analytic evaluation has no CFL/diffusion stability restriction. Fixed phase
// steps make playback independent of RAF cadence. Positions integrate the SAME
// analytic velocity; no kicks, random resets, or fake particle motion.
export const PERIOD = 6
const OMEGA = 2 * Math.PI / PERIOD
const FIXED_DT = 1 / 120
export const viscosity = (coupling: number) => 0.008 * 100 ** (coupling / 100)
export function response(y: number, nu: number): [number, number] {
  const a = Math.sqrt(OMEGA / (2 * nu))
  const r = Math.sinh(a * y) * Math.cos(a * y)
  const i = Math.cosh(a * y) * Math.sin(a * y)
  const dr = Math.sinh(a) * Math.cos(a), di = Math.cosh(a) * Math.sin(a)
  const d = dr * dr + di * di
  return [(r * dr + i * di) / d, (i * dr - r * di) / d]
}
export function layerMotion(y: number, coupling: number, time: number) {
  const [r, i] = response(y, viscosity(coupling))
  const c = Math.cos(OMEGA * time), s = Math.sin(OMEGA * time)
  return { velocity: r * c - i * s, displacement: (r * s + i * c) / OMEGA, amplitude: Math.hypot(r, i) }
}
export interface MomentumTransfer extends Stepper {
  setCoupling(value: number): void
  measure(): { time: number; coupling: number; middleAmplitude: number }
}
export function createMomentumTransfer(initialCoupling = 55): MomentumTransfer {
  let coupling = initialCoupling, ticks = 0, acc = 0
  return {
    setCoupling(value) { coupling = Math.max(0, Math.min(100, value)) },
    measure() { return { time: ticks * FIXED_DT, coupling, middleAmplitude: layerMotion(0.5, coupling, 0).amplitude } },
    step(dt) {
      acc += dt
      while (acc + 1e-12 >= FIXED_DT) { ticks++; acc -= FIXED_DT }
    },
    draw(ctx, w, h) {
      const time = ticks * FIXED_DT
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
      const stacked = w < 520, gap = 16
      const pw = stacked ? w : (w - gap) / 2, ph = stacked ? (h - gap) / 2 : h
      const font = (size: number, weight = 400) => { ctx.font = `${weight} ${size}px system-ui, sans-serif` }
      const arrow = (x: number, y: number, dx: number) => {
        if (Math.abs(dx) < 1.2) return
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y)
        const back = dx > 0 ? -4 : 4
        ctx.moveTo(x + dx + back, y - 3); ctx.lineTo(x + dx, y); ctx.lineTo(x + dx + back, y + 3)
        ctx.stroke()
      }
      for (let pane = 0; pane < 2; pane++) {
        ctx.save()
        ctx.translate(stacked ? 0 : pane * (pw + gap), stacked ? pane * (ph + gap) : 0)
        font(14, 600); ctx.fillStyle = '#303743'
        ctx.fillText(pane === 0 ? 'No coupling' : 'With coupling', 12, 20)
        const top = 51, bottom = ph - 58, fluidHeight = bottom - top
        const left = 12, right = pw - 12, span = right - left
        ctx.fillStyle = '#f5f8fc'; ctx.fillRect(left, top, span, fluidHeight)
        // Seven material layers; amber dots are parcels, blue arrows their velocity.
        const columns = 4, spacing = span / columns, travel = spacing * 0.29
        const arrowLength = spacing * 0.43
        for (let row = 1; row <= 7; row++) {
          const y = 1 - row / 8, py = top + row * fluidHeight / 8
          const m = pane === 0 ? { velocity: 0, displacement: 0, amplitude: 0 } : layerMotion(y, coupling, time)
          if (row === 4) { ctx.fillStyle = '#eaf0f8'; ctx.fillRect(left, py - fluidHeight / 16, span, fluidHeight / 8) }
          for (let col = 0; col < columns; col++) {
            const center = left + (col + 0.5) * spacing
            // Tracks mark the full excursion, so the comparison survives reversal.
            ctx.strokeStyle = '#ced7e4'; ctx.lineWidth = 2; ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(center - m.amplitude * travel, py); ctx.lineTo(center + m.amplitude * travel, py); ctx.stroke()
            const x = center + m.displacement * OMEGA * travel
            ctx.strokeStyle = PALETTE.vel; ctx.lineWidth = 1.8
            arrow(x, py, m.velocity * arrowLength)
            ctx.fillStyle = PALETTE.dye
            ctx.beginPath(); ctx.arc(x, py, 2.6, 0, 2 * Math.PI); ctx.fill()
          }
        }
        // Identical moving top plates and fixed bottom plates in both experiments.
        for (const moving of [true, false]) {
          const py = moving ? top : bottom
          ctx.fillStyle = PALETTE.wall; ctx.fillRect(left, py - 3, span, 6)
          ctx.save(); ctx.beginPath(); ctx.rect(left, py - 3, span, 6); ctx.clip()
          ctx.fillStyle = '#e4e8ef'
          const offset = moving ? Math.sin(OMEGA * time) * travel : 0
          for (let x = left - 40; x < right + 40; x += 18) ctx.fillRect(x + offset, py - 3, 2, 6)
          ctx.restore()
        }
        font(11); ctx.fillStyle = '#616b7a'
        ctx.fillText('Moving plate', left, top - 11)
        ctx.strokeStyle = PALETTE.vel; ctx.lineWidth = 1.8
        arrow(right - 28, top - 15, Math.cos(OMEGA * time) * 22)
        ctx.fillStyle = '#616b7a'; ctx.fillText('Fixed plate', left, bottom + 17)
        const amplitude = pane === 0 ? 0 : layerMotion(0.5, coupling, time).amplitude
        font(12); ctx.fillStyle = '#303743'; ctx.fillText('Mid-layer motion', left, ph - 9)
        font(12, 600); ctx.textAlign = 'right'; ctx.fillText(`${Math.round(amplitude * 100)}% of plate`, right, ph - 9); ctx.textAlign = 'left'
        ctx.restore()
      }
    },
  }
}

export function MolecularSprings() {
  const [coupling, setCoupling] = useState(55)
  const value = useRef(coupling), sim = useRef<MomentumTransfer | null>(null)
  value.current = coupling
  return (
    <Sim height={470} create={() => {
      const fresh = createMomentumTransfer(value.current); sim.current = fresh; return fresh
    }}>
      <label className="sim-slider">
        <span>Weak</span>
        <input aria-label="Momentum coupling" type="range" min={0} max={100} step={1}
          value={coupling} onChange={e => {
            const next = Number(e.target.value); setCoupling(next); sim.current?.setCoupling(next)
          }} />
        <span>Strong</span>
      </label>
    </Sim>
  )
}
