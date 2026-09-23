import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE as C } from '../lib/palette'
import { arrow, label, panes, useLabHeight, INK, MUTED, PAPER } from './view'

const SOURCE = [0, 0, .05, .2, .65, 1, .9, .35, .05, 0, 0, 0, 0, 0]
export function interpolate(a: readonly number[], x: number) {
  const i = Math.floor(x), t = x - i, n = a.length
  return a[(i % n + n) % n] * (1 - t) + a[((i + 1) % n + n) % n] * t
}
export function createBacktrace(distance: { current: number }): Stepper {
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const dx = distance.current, cell = (w - 32) / SOURCE.length, x0 = 16, top = 65, bottom = 212, target = 8, departure = target - dx
    const row = (values: number[], y: number) => values.forEach((q, i) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(x0 + i * cell, y, cell, 48)
      ctx.fillStyle = C.dye; ctx.globalAlpha = .8; ctx.fillRect(x0 + i * cell + 1, y + 48 - 46 * q, cell - 2, 46 * q); ctx.globalAlpha = 1
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = .7; ctx.strokeRect(x0 + i * cell, y, cell, 48)
    })
    label(ctx, 'Stored dye · before', x0, 27, INK, 15, true)
    label(ctx, 'Each bar is one cell’s concentration', x0, 46, MUTED, 12)
    row(SOURCE, top)
    label(ctx, 'Stored dye · after', x0, bottom - 13, INK, 15, true)
    row(SOURCE.map((_, i) => interpolate(SOURCE, i - dx)), bottom)
    const tx = x0 + (target + .5) * cell, sx = x0 + (departure + .5) * cell
    ctx.strokeStyle = C.vel; ctx.lineWidth = 2; ctx.strokeRect(x0 + target * cell, bottom, cell, 48)
    arrow(ctx, tx, bottom - 23, sx - tx, top + 57 - (bottom - 23), C.vel, 2)
    ctx.fillStyle = C.vel; ctx.beginPath(); ctx.arc(sx, top + 52, 4, 0, Math.PI * 2); ctx.fill()
    const i = Math.floor(departure), fraction = departure - i
    for (const [at, weight] of [[i, 1 - fraction], [i + 1, fraction]]) {
      if (weight < .001) continue
      ctx.strokeStyle = C.vel; ctx.lineWidth = 2; ctx.strokeRect(x0 + at * cell, top, cell, 48)
    }
    label(ctx, `${Math.round(100 * (1 - fraction))}% × ${SOURCE[i].toFixed(2)} + ${Math.round(100 * fraction)}% × ${SOURCE[i + 1].toFixed(2)}`, 16, h - 39, MUTED, 13)
    label(ctx, `Selected cell = ${interpolate(SOURCE, departure).toFixed(2)}`, 16, h - 17, C.vel, 15, true)
  } }
}
export function BacktraceLab() {
  const [distance, setDistance] = useState(1.4), ref = useRef(distance); ref.current = distance
  return <div data-lab="backtrace"><Sim animated={false} resettable={false} height={325} create={() => createBacktrace(ref)}>
    <label className="sim-slider"><span>Travel per step</span><input aria-label="Travel per step" type="range" min="0" max="4" step="0.05" value={distance} onChange={e => setDistance(+e.target.value)} /><output>{distance.toFixed(2)} cells</output></label>
  </Sim></div>
}

export function transportFrames(n = 64, steps = 80) {
  const initial: number[] = Array.from({ length: n }, (_, i) => i >= n / 8 && i < n / 3 ? 1 : 0)
  let centered = initial.slice(), traced = initial.slice()
  const frames = [{ centered, traced, exact: initial }]
  // FTCS has |1 - i C sin(k dx)| > 1 for nontrivial modes; reducing C slows,
  // but cannot remove, the instability. SL interpolation is a convex average.
  const courant = .65
  for (let s = 1; s <= steps; s++) {
    centered = centered.map((v, i) => v - .5 * courant * (centered[(i + 1) % n] - centered[(i - 1 + n) % n]))
    traced = traced.map((_, i) => interpolate(traced, i - courant))
    const shift = s * courant
    const exact = initial.map((_, i) => {
      // Exact cell average of the translated piecewise-constant initial field.
      return interpolate(initial, i - shift)
    })
    frames.push({ centered, traced, exact })
  }
  return frames
}
export function createTransportErrors(step: { current: number }): Stepper {
  const frames = transportFrames()
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const f = frames[step.current]
    panes(w, h).forEach((p, n) => {
      const a = n === 0 ? f.centered : f.traced, ymin = -.4, ymax = 1.4
      label(ctx, n === 0 ? 'Local slope update' : 'Trace backward', p.x, p.y + 15, INK, 15, true)
      label(ctx, 'Dye concentration · fixed scale', p.x, p.y + 35, MUTED, 12)
      const top = p.y + 53, ph = p.h - 109, toY = (v: number) => top + ph * (ymax - v) / (ymax - ymin)
      ctx.fillStyle = '#fff'; ctx.fillRect(p.x, top, p.w, ph)
      ctx.lineWidth = 1
      for (const v of [0, 1]) { ctx.strokeStyle = '#d5dee9'; ctx.beginPath(); ctx.moveTo(p.x, toY(v)); ctx.lineTo(p.x + p.w, toY(v)); ctx.stroke(); label(ctx, `${v}`, p.x + 3, toY(v) - 4, MUTED, 11) }
      const curve = (values: number[], color: string, dashed = false) => {
        ctx.strokeStyle = color; ctx.lineWidth = dashed ? 1.6 : 2.3; ctx.setLineDash(dashed ? [4, 4] : [])
        ctx.beginPath(); values.forEach((v, i) => { const x = p.x + i / (values.length - 1) * p.w, y = toY(Math.max(ymin, Math.min(ymax, v))); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }); ctx.stroke(); ctx.setLineDash([])
      }
      // Both curves are dye concentration, so both wear the dye colour. The
      // unstable pane used to be violet, which the lesson reserves for divergence.
      curve(f.exact, '#94a3b8', true); curve(a, C.dye)
      const error = a.reduce((sum, q, i) => sum + Math.abs(q - f.exact[i]), 0) / a.length
      const peak = Math.max(...a), low = Math.min(...a)
      label(ctx, `Range ${low.toFixed(2)} to ${peak.toFixed(2)}`, p.x, p.y + p.h - 27, C.dye, 13, true)
      label(ctx, `Mean error ${error.toFixed(3)}${peak > ymax || low < ymin ? ' · curve clipped' : ''}`, p.x, p.y + p.h - 7, MUTED, 12)
    })
  } }
}
export function TransportErrors() {
  const [step, setStep] = useState(8), ref = useRef(step); ref.current = step
  const height = useLabHeight(310, 500)
  return <div data-lab="transport"><Sim animated={false} resettable={false} height={height} create={() => createTransportErrors(ref)}>
    <label className="sim-slider"><span>Update count</span><input aria-label="Transport updates" type="range" min="0" max="80" step="1" value={step} onChange={e => setStep(+e.target.value)} /><output>{step}</output></label>
    <div className="sim-seg">{[0, 8, 40, 80].map(s => <button type="button" key={s} aria-pressed={step === s} onClick={() => setStep(s)}>{s}</button>)}</div>
  </Sim></div>
}
