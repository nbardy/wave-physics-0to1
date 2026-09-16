import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, PAPER, MUTED, INK } from '../solver-lab/view'
import { PALETTE as C } from '../lib/palette'
import { channelHalfWidth, channelVelocity, parcelAt, PARCEL_END } from './physics'

export function createParcelAcceleration(time: { current: number }): Stepper {
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const left = 26, width = w - 52, cy = 116, scaleY = 98
    const px = (x: number) => left + x / 3 * width, py = (y: number) => cy - y * scaleY
    label(ctx, 'Steady current', left, 23, INK, 15, true)
    for (const sign of [-1, 1]) {
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) { const x = i * .03; if (!i) ctx.moveTo(px(x), py(sign * channelHalfWidth(x))); else ctx.lineTo(px(x), py(sign * channelHalfWidth(x))) }
      ctx.strokeStyle = C.wall; ctx.lineWidth = 3; ctx.stroke()
    }
    for (let i = 0; i < 10; i++) for (const fraction of [-.6, 0, .6]) {
      const x = .08 + i * .28, y = fraction * channelHalfWidth(x), [u, v] = channelVelocity(x, y)
      arrow(ctx, px(x), py(y), u * width / 3 * .035, -v * scaleY * .035, C.vel, 1.2)
    }
    const fixed = { x: 1.2, y: -.15 }, now = parcelAt(time.current), start = parcelAt(0)
    ctx.strokeStyle = C.dye; ctx.lineWidth = 2; ctx.beginPath()
    for (let i = 0; i <= 80; i++) { const p = parcelAt(time.current * i / 80); if (!i) ctx.moveTo(px(p.x), py(p.y)); else ctx.lineTo(px(p.x), py(p.y)) } ctx.stroke()
    ctx.strokeRect(px(start.x) - 4, py(start.y) - 4, 8, 8)
    ctx.fillStyle = C.dye; ctx.beginPath(); ctx.arc(px(now.x), py(now.y), 6, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = C.wall; ctx.fillRect(px(fixed.x) - 5, py(fixed.y) - 5, 10, 10)
    label(ctx, `Fixed probe: 2.20 m/s`, left, 220, C.wall, 13, true)
    label(ctx, `Parcel: ${(1 + now.x).toFixed(2)} m/s`, left, 242, C.dye, 13, true)
    const top = 276, bottom = h - 42, gh = bottom - top
    const gx = (t: number) => left + t / PARCEL_END * width, gy = (u: number) => bottom - u / 4 * gh
    label(ctx, 'Horizontal speed · 0–4 m/s', left, top - 12, MUTED, 12)
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(w - left, bottom); ctx.stroke()
    ctx.strokeStyle = C.wall; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(left, gy(2.2)); ctx.lineTo(w - left, gy(2.2)); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = C.dye; ctx.lineWidth = 2.5; ctx.beginPath()
    for (let i = 0; i <= 80; i++) { const t = time.current * i / 80; if (!i) ctx.moveTo(gx(t), gy(1 + parcelAt(t).x)); else ctx.lineTo(gx(t), gy(1 + parcelAt(t).x)) } ctx.stroke()
    label(ctx, '0', left, bottom + 20, MUTED, 12)
    ctx.textAlign = 'right'; label(ctx, '1.2 seconds', w - left, bottom + 20, MUTED, 12); ctx.textAlign = 'left'
  } }
}
export function ParcelAcceleration() {
  const [time, setTime] = useState(.6), ref = useRef(time); ref.current = time
  return <div data-lab="parcel-acceleration"><Sim animated={false} resettable={false} height={422} create={() => createParcelAcceleration(ref)}>
    <label className="sim-slider"><span>Elapsed time</span><input aria-label="Parcel elapsed time" type="range" min="0" max={PARCEL_END} step=".01" value={time} onChange={e => setTime(+e.target.value)} /><output>{time.toFixed(2)} s</output></label>
  </Sim></div>
}
