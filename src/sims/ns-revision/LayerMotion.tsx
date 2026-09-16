import { useMemo, useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, panes, useLabHeight, PAPER, INK, MUTED } from '../solver-lab/view'
import { PALETTE as C } from '../lib/palette'
import { layerMotion } from './physics'

export function createLayerMotion(input: { current: ReturnType<typeof layerMotion> }): Stepper {
  const free = layerMotion(0)
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    panes(w, h).forEach((p, pane) => {
      const f = pane ? input.current : free, x0 = p.x + 8, scale = (p.w - 26) / 2
      const top = p.y + 68, hh = p.h - 108
      label(ctx, pane ? 'With viscosity' : 'Without viscosity', p.x, p.y + 17, INK, 15, true)
      label(ctx, 'Parcel travel after 2 seconds', p.x, p.y + 39, MUTED, 12)
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, top + hh); ctx.stroke(); ctx.setLineDash([])
      for (let i = 1; i < 31; i++) {
        const y = top + i / 31 * hh, x = x0 + scale * f.travel[i]
        ctx.strokeStyle = '#d9770640'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x, y); ctx.stroke()
        ctx.strokeStyle = C.wall; ctx.strokeRect(x0 + scale * free.travel[i] - 2, y - 2, 4, 4)
        ctx.fillStyle = C.dye; ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI * 2); ctx.fill()
        if (i % 3 === 1) arrow(ctx, x, y, f.velocity[i] * 15, 0, C.vel, 1.2)
      }
      label(ctx, 'Horizontal distance · 0–2 cells', p.x, p.y + p.h - 14, MUTED, 12)
    })
  } }
}
export function LayerMotion() {
  const [nu, setNu] = useState(3), f = useMemo(() => layerMotion(nu), [nu]), ref = useRef(f); ref.current = f
  const height = useLabHeight(340, 610)
  return <div data-lab="layer-motion"><Sim animated={false} resettable={false} height={height} create={() => createLayerMotion(ref)}>
    <label className="sim-slider"><span>Viscosity ν</span><input aria-label="Layer viscosity" type="range" min="0" max="8" step=".1" value={nu} onChange={e => setNu(+e.target.value)} /><output>{nu.toFixed(1)} cells²/s</output></label>
  </Sim></div>
}
