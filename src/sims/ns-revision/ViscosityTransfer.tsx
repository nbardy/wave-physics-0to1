import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, panes, useLabHeight, PAPER, INK, MUTED } from '../solver-lab/view'
import { PALETTE as C } from '../lib/palette'
import { APPARATUS as A, inferViscosity, plateForce, pipeComparison, pipeFlux, pipeVelocity } from './physics'

type Stage = 'plate' | 'pipes' | 'slip'
export type TransferState = { stage: Stage; speed: number; mu: number; count: number; slip: number; time: number }
export function createTransfer(input: { current: TransferState }): Stepper {
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const s = input.current
    panes(w, h).forEach((p, pane) => {
      if (s.stage === 'plate') {
        const speed = pane ? s.speed : .02, force = plateForce(speed)
        label(ctx, pane ? 'Adjustable plate' : 'Reference plate', p.x, p.y + 18, INK, 15, true)
        label(ctx, `Speed U: ${speed.toFixed(2)} m/s`, p.x, p.y + 42, C.vel, 13)
        label(ctx, 'Gap h: 1 mm · Area A: 0.01 m²', p.x, p.y + 64, MUTED, 12)
        const top = p.y + 109, height = p.h - 205, x0 = p.x + 14, length = p.w - 32
        ctx.fillStyle = '#e6eefb'; ctx.fillRect(p.x, top, p.w, height)
        ctx.fillStyle = C.wall; ctx.fillRect(p.x, top - 6, p.w, 6); ctx.fillRect(p.x, top + height, p.w, 6)
        arrow(ctx, x0, top - 17, length * speed / .1, 0, C.vel, 2.5)
        for (let row = 1; row < 9; row++) {
          const fraction = row / 9, y = top + (1 - fraction) * height
          arrow(ctx, x0, y, fraction * speed / .1 * length, 0, C.vel, 1.4)
        }
        label(ctx, 'Steady velocity profile', p.x, top + height + 28, MUTED, 12)
        const bottom = p.y + p.h - 31
        label(ctx, `Drag F: ${force.toFixed(3)} N`, p.x, bottom - 22, C.visc, 14, true)
        ctx.fillStyle = '#d9e6e0'; ctx.fillRect(p.x, bottom - 10, p.w, 8)
        ctx.fillStyle = C.visc; ctx.fillRect(p.x, bottom - 10, p.w * force / .1, 8)
        label(ctx, 'Calculated reading · scale 0–0.1 N', p.x, bottom + 19, MUTED, 12)
        return
      }
      const slip = s.stage === 'slip' ? s.slip : 0
      const comparison = pipeComparison(s.count, s.mu, slip, s.time)
      const count = pane ? s.count : 1, radius = pane ? comparison.radius : A.radius, b = pane ? slip : 0
      const volume = pane ? comparison.bundleVolume : comparison.referenceVolume
      label(ctx, pane ? `${count} ${count === 1 ? 'tube' : 'tubes'} · adjustable walls` : '1 tube · no-slip walls', p.x, p.y + 18, INK, 14, true)
      label(ctx, `Radius: ${(radius * 1000).toFixed(2)} mm`, p.x, p.y + 41, MUTED, 12)
      const diameter = Math.min(58, p.w / 4), columns = Math.sqrt(count), centreX = p.x + diameter / 2 + 4, centreY = p.y + 85
      for (let row = 0; row < columns; row++) for (let col = 0; col < columns; col++) {
        const r = (diameter / 2 - 2) / columns
        const x = centreX - diameter / 2 + (col + .5) * diameter / columns, y = centreY - diameter / 2 + (row + .5) * diameter / columns
        ctx.fillStyle = '#e6eefb'; ctx.strokeStyle = C.wall; ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
      label(ctx, 'Equal total', p.x + diameter + 14, p.y + 80, MUTED, 12)
      label(ctx, 'open area', p.x + diameter + 14, p.y + 98, MUTED, 12)
      const profileTop = p.y + 134, profileHeight = 65, x0 = p.x + 5, speedScale = (p.w - 12) / .05
      label(ctx, 'Axial velocity · 0–0.05 m/s', p.x, profileTop - 9, C.vel, 12)
      ctx.strokeStyle = C.wall; ctx.lineWidth = 1
      for (const y of [profileTop, profileTop + profileHeight]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(p.x + p.w - 7, y); ctx.stroke() }
      ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(x0, profileTop); ctx.lineTo(x0, profileTop + profileHeight); ctx.stroke(); ctx.setLineDash([])
      const curve = (wallSlip: number, ghost: boolean) => {
        ctx.strokeStyle = ghost ? C.wall : C.vel; ctx.lineWidth = ghost ? 1 : 2.5; ctx.setLineDash(ghost ? [3, 3] : [])
        ctx.beginPath()
        for (let i = 0; i <= 40; i++) { const r = radius * (2 * i / 40 - 1), x = x0 + speedScale * pipeVelocity(r, radius, s.mu, wallSlip), y = profileTop + i / 40 * profileHeight; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y) } ctx.stroke(); ctx.setLineDash([])
      }
      if (pane) curve(0, true)
      curve(b, false)
      const vesselTop = p.y + 243, vesselBottom = p.y + p.h - 40, vesselHeight = vesselBottom - vesselTop
      const capacity = 2 * pipeFlux(A.radius, s.mu) * A.interval, fill = volume / capacity * vesselHeight
      label(ctx, `Collected: ${(volume * 1e6).toFixed(3)} mL`, p.x, vesselTop - 17, C.dye, 13, true)
      ctx.fillStyle = C.dye; ctx.fillRect(p.x + 10, vesselBottom - fill, p.w - 20, fill)
      ctx.strokeStyle = C.wall; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x + 8, vesselTop); ctx.lineTo(p.x + 8, vesselBottom); ctx.lineTo(p.x + p.w - 8, vesselBottom); ctx.lineTo(p.x + p.w - 8, vesselTop); ctx.stroke()
      label(ctx, `b: ${(b * 1e6).toFixed(0)} μm · t: ${s.time.toFixed(1)} s`, p.x, p.y + p.h - 12, MUTED, 12)
    })
  } }
}
export function ViscosityTransfer() {
  const [stage, setStage] = useState<Stage>('plate'), [speed, setSpeed] = useState(.05), [mu, setMu] = useState<number>(A.mu)
  const [count, setCount] = useState(4), [slip, setSlip] = useState(.000125), [time, setTime] = useState<number>(A.interval)
  const ref = useRef<TransferState>({ stage, speed, mu, count, slip, time }); ref.current = { stage, speed, mu, count, slip, time }
  const height = useLabHeight(stage === 'plate' ? 390 : 450, stage === 'plate' ? 750 : 890)
  const select = (next: Stage) => { if (stage === 'plate') setMu(inferViscosity(plateForce(speed), speed)); setStage(next) }
  return <div data-lab="viscosity-transfer"><Sim animated={false} resettable={false} height={height} create={() => createTransfer(ref)}>
    <div className="sim-seg">{([['plate', '1. Plate'], ['pipes', '2. Pipes'], ['slip', '3. Wall slip']] as const).map(([key, title]) => <button key={key} type="button" aria-pressed={stage === key} className={stage === key ? 'seg-active' : ''} onClick={() => select(key)}>{title}</button>)}</div>
    <output>μ = {(stage === 'plate' ? inferViscosity(plateForce(speed), speed) : mu).toFixed(3)} Pa·s · fixed fluid and temperature</output>
    {stage === 'plate' ? <label className="sim-slider"><span>Plate speed U</span><input aria-label="Plate speed" type="range" min=".02" max=".1" step=".01" value={speed} onChange={e => setSpeed(+e.target.value)} /><output>{speed.toFixed(2)} m/s</output></label> : <>
      <div className="sim-seg">{[1, 4, 16].map(n => <button key={n} type="button" aria-pressed={count === n} className={count === n ? 'seg-active' : ''} onClick={() => setCount(n)}>{n} {n === 1 ? 'tube' : 'tubes'}</button>)}</div>
      {stage === 'slip' && <label className="sim-slider"><span>Slip length b</span><input aria-label="Pipe slip length" type="range" min="0" max=".00025" step=".000025" value={slip} onChange={e => setSlip(+e.target.value)} /><output>{(slip * 1e6).toFixed(0)} μm</output></label>}
      <label className="sim-slider"><span>Collection time</span><input aria-label="Pipe collection time" type="range" min="0" max="10" step=".1" value={time} onChange={e => setTime(+e.target.value)} /><output>{time.toFixed(1)} s</output></label>
    </>}
  </Sim></div>
}
