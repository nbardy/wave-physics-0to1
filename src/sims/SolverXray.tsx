import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'

// §12 — the solver x-ray: one stage of Stable Fluids at a time, applied over
// and over to the same live channel so the reader sees what each stage alone
// does to the flow. 'full' runs the real cycle.
//   advect  → structures ride and stretch, nothing smooths, divergence grows
//   diffuse → everything melts toward uniform, nothing moves
//   project → pile-ups get pushed apart, swirls survive untouched
// Same math as every previous section; this figure only changes which line
// of the loop runs.

const NX = 120
const NY = 72
const INFLOW = 22
const FIXED_DT = 1 / 40
const DYE_ROWS = [9, 18, 27, 36, 45, 54, 63]

export type XrayStage = 'advect' | 'diffuse' | 'project' | 'full'

function createXray(stage: XrayStage): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, 10)
  solver.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 6)
  // warm up with the full cycle so every stage starts from interesting flow
  for (let k = 0; k < 120; k++) {
    solver.injectDyeStripe(DYE_ROWS, 1)
    solver.step(FIXED_DT)
  }
  solver.toggles = {
    advect: stage === 'advect' || stage === 'full',
    diffuse: stage === 'diffuse' || stage === 'full',
    project: stage === 'project' || stage === 'full',
  }
  const renderer = new SolverRenderer(solver)
  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        if (stage === 'full' || stage === 'advect') solver.injectDyeStripe(DYE_ROWS, 1)
        solver.step(FIXED_DT)
        solver.computeDivergence()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, stage === 'project' || stage === 'advect' ? 'divergence' : 'none')
    },
  }
}

export function SolverXray({ height = 260 }: { height?: number }) {
  const [stage, setStage] = useState<XrayStage>('advect')
  return (
    <Sim height={height} create={() => createXray(stage)} key={stage}>
      <div className="sim-seg">
        {(['advect', 'diffuse', 'project', 'full'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={stage === s ? 'seg-active' : ''}
            onClick={() => setStage(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </Sim>
  )
}
