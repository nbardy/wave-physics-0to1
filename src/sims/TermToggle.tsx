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
      const world = !t.advect && t.diffuse ? 'Stokes world (honey)' : !t.diffuse && t.advect ? 'Euler world (no smearing)' : !t.project ? 'the §9 catastrophe' : 'water'
      ctx.fillText(world, 10, h - 10)
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
