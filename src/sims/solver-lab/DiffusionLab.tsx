import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, panes, useLabHeight, INK, MUTED, PAPER } from './view'
import { PALETTE as C } from '../lib/palette'

export type Profile = 'jet' | 'layers' | 'stripes'
export function diffuseProfile(shape: Profile, viscosity: number) {
  const initial: number[] = Array.from({ length: 32 }, (_, i) => i === 0 || i === 31 ? 0 : shape === 'jet' ? (i >= 12 && i < 20 ? 1 : 0) : shape === 'layers' ? (i < 16 ? 1 : .2) : (i % 4 < 2 ? 1 : .2))
  let u = initial.slice()
  // Fixed observation time 2 s, dt=.025 s, unit layer spacing. alpha <= .2 <
  // 1/2 throughout the slider's 0..8 range, so the 1D explicit scheme is stable.
  const alpha = viscosity / 40
  for (let step = 0; step < 80; step++) u = u.map((v, i) => i === 0 || i === 31 ? 0 : v + alpha * (u[i - 1] - 2 * v + u[i + 1]))
  return { initial, u }
}
/**
 * What the meter under each profile reports, relative to the start.
 * 'energy': total kinetic energy (versions I/II: "viscosity also dissipates
 * kinetic energy, shown beneath the profiles"). It is dominated by the mean
 * flow, so at high viscosity the stripes keep MORE of it than the jet (42% vs
 * 37%), which contradicts a story about stripes losing their differences.
 * 'differences': the total layer-to-layer speed difference, sum of |u[i+1]-u[i]|.
 * Stripes fall to 9% at any viscosity above 1 while the jet keeps over half, so
 * this is the meter for "stripes lose their sharp velocity differences quickly"
 * (version IV; audit 2026-09-23, IV 06).
 */
export type Readout = 'energy' | 'differences'
const readouts: Record<Readout, { title: string; measure: (u: number[]) => number }> = {
  energy: { title: 'Kinetic energy', measure: u => u.reduce((s, v) => s + v * v, 0) },
  differences: { title: 'Speed differences between layers', measure: u => u.reduce((s, v, i) => i ? s + Math.abs(v - u[i - 1]) : s, 0) },
}
export function createDiffusion(value: { current: number }, shape: { current: Profile }, readout: Readout = 'energy'): Stepper {
  const frames = Object.fromEntries((['jet', 'layers', 'stripes'] as const).map(s => [s, Array.from({ length: 81 }, (_, n) => diffuseProfile(s, n / 10))])) as Record<Profile, ReturnType<typeof diffuseProfile>[]>
  const { title, measure } = readouts[readout]
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const f = frames[shape.current][Math.round(value.current * 10)]
    panes(w, h).forEach((p, n) => {
      const values = n === 0 ? f.initial : f.u, top = p.y + 56, height = p.h - 115, x0 = p.x + 10, amp = p.w - 29
      label(ctx, n === 0 ? 'Before' : 'After 2 seconds', p.x, p.y + 15, INK, 15, true)
      label(ctx, 'Horizontal speed · same scale', p.x, p.y + 35, MUTED, 12)
      for (const y of [top, top + height]) { ctx.strokeStyle = C.wall; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); ctx.stroke() }
      const curve = (a: number[], ghost: boolean) => {
        ctx.strokeStyle = ghost ? '#b1bdcc' : C.vel; ctx.lineWidth = ghost ? 1.2 : 2.5; ctx.setLineDash(ghost ? [4, 4] : [])
        ctx.beginPath(); a.forEach((u, i) => { const x = x0 + amp * u, y = top + i / 31 * height; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }); ctx.stroke(); ctx.setLineDash([])
      }
      if (n) curve(f.initial, true)
      curve(values, false)
      for (let i = 2; i < 31; i += 2) arrow(ctx, x0, top + i / 31 * height, amp * values[i], 0, C.vel, 1)
      const remaining = measure(values) / measure(f.initial)
      label(ctx, `${title}: ${(remaining * 100).toFixed(0)}%`, p.x, p.y + p.h - 28, C.visc, 13, true)
      label(ctx, 'Stationary walls · zero speed', p.x, p.y + p.h - 7, MUTED, 12)
    })
  } }
}
export function DiffusionLab({ readout = 'energy' }: { readout?: Readout }) {
  const [viscosity, setViscosity] = useState(3), vRef = useRef(viscosity); vRef.current = viscosity
  const [shape, setShape] = useState<Profile>('jet'), sRef = useRef(shape); sRef.current = shape
  const height = useLabHeight(330, 530)
  return <div data-lab="diffusion"><Sim animated={false} resettable={false} height={height} create={() => createDiffusion(vRef, sRef, readout)}>
    <div className="sim-seg">{([['jet', 'A jet'], ['layers', 'Two layers'], ['stripes', 'Thin stripes']] as const).map(([key, name]) => <button type="button" key={key} aria-pressed={shape === key} className={shape === key ? 'seg-active' : ''} onClick={() => setShape(key)}>{name}</button>)}</div>
    <label className="sim-slider"><span>Viscosity ν</span><input aria-label="Diffusion viscosity" type="range" min="0" max="8" step="0.1" value={viscosity} onChange={e => setViscosity(+e.target.value)} /><output>{viscosity.toFixed(1)} cells²/s</output></label>
  </Sim></div>
}
