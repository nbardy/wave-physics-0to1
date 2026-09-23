import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, INK, MUTED, PAPER } from './view'
import { PALETTE as C } from '../lib/palette'

// `pressureMark` draws the "p" at the cell centre. Versions I/II introduce it
// here ("Pressure will live at the centre"); IV has not met pressure yet at
// this figure, so it passes false (audit 2026-09-23, IV 07).
export function createCellFlux(outflow: { current: number }, pressureMark = true): Stepper {
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const s = Math.min(112, w * .3), x = (w - s) / 2, y = 91, r = outflow.current
    label(ctx, 'One cell · volume 1 m³', 16, 26, INK, 15, true)
    label(ctx, 'Flow rates through its four faces', 16, 47, MUTED, 12)
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, s, s); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, s, s)
    const scale = Math.min(36, w * .09)
    arrow(ctx, x - scale, y + s / 2, scale, 0, C.vel, 2.5)
    arrow(ctx, x + s, y + s / 2, scale * r, 0, C.vel, 2.5)
    arrow(ctx, x + s / 2, y, 0, -scale * .5, C.vel, 2.5)
    arrow(ctx, x + s / 2, y + s + scale * .5, 0, -scale * .5, C.vel, 2.5)
    ctx.textAlign = 'center'
    label(ctx, 'OUT 0.5', w / 2, y - 27, MUTED, 12)
    label(ctx, 'IN 0.5', w / 2, y + s + 40, MUTED, 12)
    // Side labels hang off the cell border rather than centring on the arrow,
    // which at 390 px put "OUT 1.7" across the border.
    ctx.textAlign = 'right'; label(ctx, 'IN 1.0', x - 5, y + s / 2 + 23, MUTED, 12)
    ctx.textAlign = 'left'; label(ctx, `OUT ${r.toFixed(1)}`, x + s + 5, y + s / 2 + 23, MUTED, 12)
    if (pressureMark) {
      ctx.textAlign = 'center'
      label(ctx, 'p', w / 2, y + s / 2 + 2, C.pHi, 22)
      label(ctx, 'pressure', w / 2, y + s / 2 + 18, MUTED, 11)
    }
    ctx.textAlign = 'left'
    label(ctx, `Total in: 1.5 m³/s     Total out: ${(r + .5).toFixed(1)} m³/s`, 16, h - 59, INK, 13)
    label(ctx, `Net outflow: ${r - 1 > 0 ? '+' : ''}${(r - 1).toFixed(1)} m³/s`, 16, h - 34, C.div, 16, true)
    label(ctx, r === 1 ? 'Balanced' : r > 1 ? 'More leaves than enters' : 'More enters than leaves', 16, h - 13, MUTED, 12)
  } }
}
export function CellFlux({ pressureMark = true }: { pressureMark?: boolean }) {
  const [outflow, setOutflow] = useState(1.7), ref = useRef(outflow); ref.current = outflow
  return <div data-lab="cell"><Sim animated={false} resettable={false} height={340} create={() => createCellFlux(ref, pressureMark)}>
    <label className="sim-slider"><span>Right-face outflow</span><input aria-label="Right-face outflow" type="range" min="0" max="2" step="0.1" value={outflow} onChange={e => setOutflow(+e.target.value)} /><output>{outflow.toFixed(1)} m³/s</output></label>
    <button type="button" onClick={() => setOutflow(1)}>Balance the cell</button>
  </Sim></div>
}
