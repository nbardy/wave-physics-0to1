import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { LabFluid, LAB_DT, cycleFrames, type Operation } from './core'
import { field, label, panes, useLabHeight, INK, MUTED, PAPER, type FieldView } from './view'
import { PALETTE as C } from '../lib/palette'

export const STAGES = ['Stored state', 'Add a push', 'Carry velocity', 'Smooth velocity', 'Correct pressure', 'Carry dye'] as const
export function createCycle(stage: { current: number }, showChange: { current: boolean }): Stepper {
  const frames = cycleFrames()
  return { step() {}, draw(ctx, w, h) {
    const s = stage.current, before = frames[Math.max(0, s - 1)], after = frames[s], delta = after.clone()
    const scalar = s === 5
    for (let k = 0; k < after.n; k++) {
      delta.u[k] = 10 * (after.u[k] - before.u[k]); delta.v[k] = 10 * (after.v[k] - before.v[k])
    }
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const [a, b] = panes(w, h)
    label(ctx, s ? `Input to step ${s}` : 'Stored state', a.x, a.y + 15, INK, 15, true)
    label(ctx, showChange.current && !scalar ? 'Velocity change ×10' : 'Result of this step', b.x, b.y + 15, INK, 15, true)
    const mode: FieldView = scalar || s === 0 ? 'dye' : 'divergence'
    field(ctx, before, { x: a.x, y: a.y + 34, w: a.w, h: a.h - 103 }, mode, true)
    field(ctx, showChange.current && !scalar ? delta : after, { x: b.x, y: b.y + 34, w: b.w, h: b.h - 103 }, showChange.current && !scalar ? 'velocity' : mode, true)
    const maxDelta = Math.max(...after.u.map((u, k) => Math.abs(u - before.u[k])), ...after.v.map((v, k) => Math.abs(v - before.v[k])))
    label(ctx, `Imbalance ${before.metrics().divergence.toFixed(4)} /s`, a.x, a.y + a.h - 43, C.div, 12)
    label(ctx, `Imbalance ${after.metrics().divergence.toFixed(4)} /s`, b.x, b.y + b.h - 43, C.div, 12)
    label(ctx, 'Opposite edges join', a.x, a.y + a.h - 20, MUTED, 12)
    label(ctx, `Largest Δvelocity: ${maxDelta.toFixed(3)} cells/s`, b.x, b.y + b.h - 20, MUTED, 12)
  } }
}
export function SolverCycle() {
  const [stage, setStage] = useState(1), ref = useRef(stage); ref.current = stage
  const [change, setChange] = useState(false), cRef = useRef(change); cRef.current = change
  const height = useLabHeight(335, 510)
  return <div data-lab="cycle">
    <Sim animated={false} resettable={false} height={height} create={() => createCycle(ref, cRef)}>
      <div className="lab-stages">{STAGES.map((name, i) => <button type="button" key={name} className={i === stage ? 'seg-active' : ''} aria-pressed={i === stage} onClick={() => setStage(i)}><span>{i}</span>{name}</button>)}</div>
      <label className="lab-check"><input type="checkbox" checked={change} onChange={e => setChange(e.target.checked)} /> Enlarge velocity change ×10</label>
    </Sim>
  </div>
}

export function comparisonFrames() {
  const base = new LabFluid(32, 20).seed(); base.push()
  const full = base.clone(), variants = { carry: base.clone(), smooth: base.clone(), pressure: base.clone() }
  const frames = [{ full: full.clone(), carry: variants.carry.clone(), smooth: variants.smooth.clone(), pressure: variants.pressure.clone() }]
  // All four runs have identical initial conditions, viscosity and elapsed time.
  // Only one velocity operation is omitted. Dye advection stays on in every run.
  for (let step = 1; step <= 120; step++) {
    full.tick(8)
    for (const omit of ['carry', 'smooth', 'pressure'] as const) variants[omit].tick(8, omit)
    if (step % 4 === 0) frames.push({ full: full.clone(), carry: variants.carry.clone(), smooth: variants.smooth.clone(), pressure: variants.pressure.clone() })
  }
  return frames
}
const OMIT_LABEL: Record<Operation, string> = { carry: 'No velocity advection', smooth: 'No viscosity', pressure: 'No pressure correction' }
export function createComparison(time: { current: number }, omit: { current: Operation }, view: { current: FieldView }): Stepper {
  const frames = comparisonFrames()
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    const pair = frames[time.current]
    panes(w, h).forEach((p, i) => {
      const f = i === 0 ? pair.full : pair[omit.current]
      label(ctx, i === 0 ? 'All three operations' : OMIT_LABEL[omit.current], p.x, p.y + 15, INK, 14, true)
      label(ctx, `${(time.current / 10).toFixed(1)} seconds · same start`, p.x, p.y + 35, MUTED, 12)
      field(ctx, f, { x: p.x, y: p.y + 48, w: p.w, h: p.h - 111 }, view.current, true)
      label(ctx, `Imbalance ${f.metrics().divergence.toFixed(4)} /s`, p.x, p.y + p.h - 38, C.div, 12)
      label(ctx, `Energy/mass ${f.metrics().energy.toFixed(1)} cells²/s²`, p.x, p.y + p.h - 16, MUTED, 12)
    })
  } }
}
export function TermExperiment() {
  const [time, setTime] = useState(6), tRef = useRef(time); tRef.current = time
  const [omit, setOmit] = useState<Operation>('pressure'), oRef = useRef(omit); oRef.current = omit
  const [view, setView] = useState<FieldView>('divergence'), vRef = useRef(view); vRef.current = view
  const height = useLabHeight(340, 520)
  return <div data-lab="comparison"><Sim animated={false} resettable={false} height={height} create={() => createComparison(tRef, oRef, vRef)}>
    <div className="sim-seg">{(['carry', 'smooth', 'pressure'] as const).map(op => <button type="button" key={op} aria-pressed={op === omit} className={op === omit ? 'seg-active' : ''} onClick={() => { setOmit(op); setView(op === 'pressure' ? 'divergence' : 'dye') }}>{OMIT_LABEL[op]}</button>)}</div>
    <label className="sim-slider"><span>Elapsed time</span><input aria-label="Comparison elapsed time" type="range" min="0" max="30" step="1" value={time} onChange={e => setTime(+e.target.value)} /><output>{(time / 10).toFixed(1)} s</output></label>
    <label className="lab-check"><input type="checkbox" checked={view === 'divergence'} onChange={e => setView(e.target.checked ? 'divergence' : 'dye')} /> Show local imbalance</label>
  </Sim></div>
}

type Stir = { x: number; y: number; dx: number; dy: number }
export interface LiveLabStepper extends Stepper {
  push: (impulse: Stir) => void
  addDye: () => void
  measure: () => { divergence: number; energy: number; dye: number }
}
export function createLiveLab(viscosity: { current: number }, grid: { current: boolean }): LiveLabStepper {
  const f = new LabFluid().seed()
  let accumulator = 0
  return {
    // Interventions are explicit state changes, so they also work while paused.
    // Project an impulse immediately to respect the incompressibility constraint.
    push(s) { f.push(s.x, s.y, s.dx, s.dy); f.project() },
    addDye() {
      for (let j = 0; j < f.ny; j++) for (let i = 0; i < f.nx; i++) {
        if ((i / f.nx - .5) ** 2 + (j / f.ny - .5) ** 2 < .007) f.dye[f.index(i, j)] = 1
      }
    },
    measure() { return { ...f.metrics(), dye: f.dye.reduce((a, b) => a + b, 0) } },
    step(dt) {
    accumulator += dt
    while (accumulator + 1e-12 >= LAB_DT) {
      f.tick(viscosity.current); accumulator -= LAB_DT
    }
  }, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    label(ctx, 'A grid of velocities carries two dyes', 16, 26, INK, w < 400 ? 13 : 15, true)
    field(ctx, f, { x: 16, y: 43, w: w - 32, h: h - 89 }, 'dye', grid.current)
    label(ctx, `${f.nx} × ${f.ny} cells · opposite edges join`, 16, h - 23, MUTED, 12)
    // IV's prose calls this "the imbalance readout in the corner"; it was an unlabelled number.
    ctx.textAlign = 'right'; label(ctx, `Imbalance ${f.metrics().divergence.toExponential(1)} /s`, w - 16, h - 6, C.div, 11); ctx.textAlign = 'left'
  } }
}
export function LiveSolverLab() {
  const [viscosity, setViscosity] = useState(1), vRef = useRef(viscosity); vRef.current = viscosity
  const [grid, setGrid] = useState(true), gRef = useRef(grid); gRef.current = grid
  const engine = useRef<LiveLabStepper | null>(null), last = useRef<{ x: number; y: number } | null>(null)
  const position = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget.querySelector('canvas')
    if (!canvas) return null
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left - 16) / (r.width - 32), y = (e.clientY - r.top - 43) / (r.height - 89)
    return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null
  }
  return <div data-lab="live" className="lab-stir" onPointerDown={e => { const p = position(e); if (p) { last.current = p; e.currentTarget.setPointerCapture(e.pointerId) } }} onPointerMove={e => {
    if (!last.current) return
    const p = position(e); if (p) { engine.current?.push({ ...p, dx: Math.max(-10, Math.min(10, (p.x - last.current.x) * 300)), dy: Math.max(-10, Math.min(10, (p.y - last.current.y) * 300)) }); last.current = p }
  }} onPointerUp={() => { last.current = null }} onPointerCancel={() => { last.current = null }}>
    <Sim height={340} create={() => { const f = createLiveLab(vRef, gRef); engine.current = f; return f }} resetLabel="Start again">
      <button type="button" onClick={() => engine.current?.push({ x: .5, y: .5, dx: 0, dy: -10 })}>Push upward</button>
      <button type="button" onClick={() => engine.current?.addDye()}>Add dye</button>
      <label className="sim-slider"><span>Viscosity</span><input aria-label="Lab viscosity" type="range" min="0" max="8" step="0.1" value={viscosity} onChange={e => setViscosity(+e.target.value)} /><output>{viscosity.toFixed(1)}</output></label>
      <label className="lab-check"><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} /> Show cells</label>
    </Sim>
  </div>
}
