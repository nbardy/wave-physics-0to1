import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { projectionInput, relaxationFrames } from './core'
import { field, label, meter, panes, useLabHeight, MUTED, PAPER } from './view'

export function createProjectionLab(value: { current: number }, iterations = false): Stepper {
  const original = projectionInput(), solved = original.clone(); solved.project()
  const frames = iterations ? relaxationFrames() : Array.from({ length: 151 }, (_, n) => {
    const f = original.clone(); f.correct(solved.pressure, n / 100); return f
  })
  const reference = original.metrics().divergence
  return {
    step() {},
    draw(ctx, w, h) {
      const f = frames[Math.min(frames.length - 1, Math.round(value.current))]
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
      const [a, b] = panes(w, h)
      label(ctx, 'Proposed velocity', a.x, a.y + 14, undefined, 15, true)
      label(ctx, iterations ? `${Math.round(value.current)} pressure sweeps` : `${Math.round(value.current)}% correction`, b.x, b.y + 14, undefined, 15, true)
      label(ctx, 'Violet: local imbalance', a.x, a.y + 34, MUTED, 12)
      label(ctx, iterations ? 'Same input, corrected again' : 'Cyan: lower pressure', b.x, b.y + 34, MUTED, 12)
      field(ctx, original, { x: a.x, y: a.y + 48, w: a.w, h: a.h - 103 }, 'divergence', true)
      field(ctx, f, { x: b.x, y: b.y + 48, w: b.w, h: b.h - 103 }, iterations ? 'divergence' : 'pressure', true)
      meter(ctx, a, reference, reference)
      meter(ctx, b, f.metrics().divergence, reference)
    },
  }
}
export function ProjectionLab({ iterations = false }: { iterations?: boolean }) {
  const [value, setValue] = useState(iterations ? 0 : 35), ref = useRef(value); ref.current = value
  const height = useLabHeight()
  return <div data-lab={iterations ? 'iterations' : 'projection'}>
    <Sim animated={false} resettable={false} height={height} create={() => createProjectionLab(ref, iterations)}>
      <label className="sim-slider"><span>{iterations ? 'Pressure sweeps' : 'Correction'}</span>
        <input aria-label={iterations ? 'Pressure sweeps' : 'Pressure correction'} type="range" min="0" max={iterations ? 160 : 150} step="1" value={value} onChange={e => setValue(+e.target.value)} />
        <output>{value}{iterations ? '' : '%'}</output>
      </label>
      <div className="sim-seg">{(iterations ? [0, 10, 40, 160] : [0, 100, 150]).map(n =>
        <button type="button" key={n} aria-pressed={value === n} onClick={() => setValue(n)}>{n}{iterations ? '' : '%'}</button>)}</div>
    </Sim>
  </div>
}
