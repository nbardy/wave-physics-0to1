import { useEffect, useMemo, useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { arrow, label, PAPER, INK, MUTED } from '../solver-lab/view'
import { PALETTE as C } from '../lib/palette'
import { similarity } from './physics'

export function createSimilarity(input: { current: ReturnType<typeof similarity> }): Stepper {
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const stacked = w < 620, gap = 18, pw = stacked ? w - 36 : (w - 4 * gap) / 3
    const ph = stacked ? (h - 4 * gap) / 3 : h - 2 * gap
    input.current.forEach((f, i) => {
      const x = stacked ? gap : gap + i * (pw + gap), y = stacked ? gap + i * (ph + gap) : gap
      label(ctx, ['Reference', 'Scale U and ν', 'Scale only U'][i], x, y + 15, INK, 14, true)
      label(ctx, `U ${f.speed.toFixed(2)} m/s · Re ${f.re.toFixed(0)}`, x, y + 38, C.vel, 12)
      label(ctx, `ν ${f.nu.toFixed(3)} m²/s`, x, y + 57, C.visc, 12)
      label(ctx, `Clock: ${f.time.toFixed(3)} s`, x, y + 76, MUTED, 12)
      const top = y + 91, fh = ph - 125
      ctx.fillStyle = '#fff'; ctx.fillRect(x, top, pw, fh)
      ctx.save(); ctx.beginPath(); ctx.rect(x, top, pw, fh); ctx.clip()
      for (let j = 0; j < f.u.length; j++) {
        const normalized = f.u[j] / f.speed
        ctx.fillStyle = `rgba(37,99,235,${Math.abs(normalized) * .18})`
        ctx.fillRect(x, top + j / f.u.length * fh, pw, fh / f.u.length + .2)
      }
      for (let j = 1; j < f.u.length; j += 4) for (let k = 0; k < 5; k++) {
        // Identical scale in all panes: arrows encode velocity / each pane's U.
        arrow(ctx, x + (k + .5) / 5 * pw, top + j / f.u.length * fh, f.u[j] / f.speed * 17, 17, C.vel, 1.4)
      }
      ctx.restore(); ctx.strokeStyle = '#cbd5e1'; ctx.strokeRect(x, top, pw, fh)
      label(ctx, `Sideways speed / U: ${Math.max(...f.u.map(v => Math.abs(v / f.speed))).toFixed(2)}`, x, y + ph - 10, C.vel, 12)
    })
  } }
}
export function ReynoldsSimilarity() {
  const [factor, setFactor] = useState(2), [tau, setTau] = useState(.4)
  const state = useMemo(() => similarity(factor, tau), [factor, tau]), ref = useRef(state); ref.current = state
  const host = useRef<HTMLDivElement>(null), [stacked, setStacked] = useState(true)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const update = () => setStacked((element.querySelector('canvas')?.clientWidth ?? 0) < 620)
    const observer = new ResizeObserver(update); observer.observe(element); update()
    return () => observer.disconnect()
  }, [])
  return <div ref={host} data-lab="reynolds-similarity"><Sim animated={false} resettable={false} height={stacked ? 910 : 390} create={() => createSimilarity(ref)}>
    <label className="sim-slider"><span>Speed multiplier</span><input aria-label="Similarity speed multiplier" type="range" min="1" max="4" step=".25" value={factor} onChange={e => setFactor(+e.target.value)} /><output>{factor.toFixed(2)}×</output></label>
    <label className="sim-slider"><span>Scaled time Ut/L</span><input aria-label="Similarity scaled time" type="range" min="0" max=".6" step=".01" value={tau} onChange={e => setTau(+e.target.value)} /><output>{tau.toFixed(2)}</output></label>
  </Sim></div>
}
