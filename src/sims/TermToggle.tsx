import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'

// §11 — the marquee figure: the assembled equation with removable organs.
// Same channel, same cylinder, live solver; three switches kill one term each:
//   advection off  → Stokes world: honey physics, eerily reversible-looking
//   viscosity off  → Euler world: sharp filaments that never smear (until the
//                    grid's own numerical diffusion quietly intervenes — the
//                    prose confesses this)
//   pressure off   → §9's catastrophe, replayed knowingly (violet overlay)
// This figure earns its "sliders galore" flag — the one deliberate exception
// to the one-knob law, at the moment the reader can handle all of it.

// Every switch combination named, keyed advect/diffuse/project. This replaced an
// if/else ladder that mislabelled states: with BOTH carrying and smoothing off it
// printed "water" — the one case where nothing is computed at all, since the field
// then stays at the uniform inflow forever and only the dye drifts. Exhaustive
// table, no fallback branch. (The old string for pressure-off also named another
// lesson's section number, which no reader of that lesson can resolve.)
const WORLD: Record<string, string> = {
  '111': 'water',
  '110': 'the broken fluid — no pressure',
  '101': 'Euler world (no smearing)',
  '100': 'no smoothing, no pressure',
  '011': 'Stokes world (honey)',
  '010': 'no carrying, no pressure',
  '001': 'pressure only — the field never changes',
  '000': 'nothing but the dye drifting',
}

const NX = 128
const NY = 80
const INFLOW = 24
const FIXED_DT = 1 / 40
const DYE_ROWS = [10, 20, 30, 40, 50, 60, 70]

interface Toggles {
  advect: boolean
  diffuse: boolean
  project: boolean
}

function createTermToggle(tRef: { current: Toggles }): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, 8)
  solver.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 6)
  const renderer = new SolverRenderer(solver)
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.toggles = { ...tRef.current }
        solver.injectDyeStripe(DYE_ROWS, 1)
        solver.step(FIXED_DT)
        if (!tRef.current.project) solver.computeDivergence()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, tRef.current.project ? 'none' : 'divergence')
      const t = tRef.current
      ctx.fillStyle = 'rgba(26,31,43,0.65)'
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(WORLD[`${+t.advect}${+t.diffuse}${+t.project}`], 10, h - 10)
    },
  }
}

export function TermToggle({ height = 280 }: { height?: number }) {
  const [t, setT] = useState<Toggles>({ advect: true, diffuse: true, project: true })
  const tRef = useRef(t)
  tRef.current = t
  const flip = (k: keyof Toggles) => setT((prev) => ({ ...prev, [k]: !prev[k] }))
  return (
    <Sim height={height} create={() => createTermToggle(tRef)}>
      <div className="sim-toggles">
        <label>
          <input type="checkbox" checked={t.advect} onChange={() => flip('advect')} />
          −(u·∇)u carry
        </label>
        <label>
          <input type="checkbox" checked={t.diffuse} onChange={() => flip('diffuse')} />
          ν∇²u smooth
        </label>
        <label>
          <input type="checkbox" checked={t.project} onChange={() => flip('project')} />
          −∇p/ρ with ∇·u=0
        </label>
      </div>
    </Sim>
  )
}
