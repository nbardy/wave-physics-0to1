import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'

// §10 — scrubbing the Poisson solve. A frozen velocity field with a pile-up
// (a divergent impulse) is stored once; the slider chooses how many Jacobi
// sweeps to run ON A COPY, so dragging is deterministic scrubbing, not
// accumulation. Left pane: divergence (violet, the crime). Right pane:
// the pressure field the sweeps discover (red hill / cyan hollow).

const NX = 72
const NY = 44

function createJacobi(itersRef: { current: number }): Stepper {
  const base = new FluidSolver(NX, NY, 0, 0.5)
  // a divergent impulse: fluid pushed outward from a spot (an outflow "pile")
  for (let j = 1; j < NY - 1; j++) {
    for (let i = 1; i < NX - 1; i++) {
      const dx = i - NX * 0.5
      const dy = j - NY * 0.5
      const e = Math.exp(-((dx * dx + dy * dy) / 40))
      base.u[base.idx(i, j)] = dx * e * 2
      base.v[base.idx(i, j)] = dy * e * 2
    }
  }
  const work = new FluidSolver(NX, NY, 0, 0.5)
  const renderer = new SolverRenderer(work)
  let lastIters = -1

  return {
    step() {
      const iters = itersRef.current
      if (iters === lastIters) return
      lastIters = iters
      work.u.set(base.u)
      work.v.set(base.v)
      work.p.fill(0)
      if (iters > 0) work.project(iters)
      work.computeDivergence()
    },
    draw(ctx, w, h) {
      const half = w / 2 - 6
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, half, h)
      ctx.clip()
      renderer.draw(ctx, half, h, 'divergence')
      ctx.restore()
      ctx.save()
      ctx.translate(half + 12, 0)
      ctx.beginPath()
      ctx.rect(0, 0, half, h)
      ctx.clip()
      renderer.draw(ctx, half, h, 'pressure')
      ctx.restore()
      ctx.fillStyle = '#55606f'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('divergence', 8, h - 8)
      ctx.fillText('pressure', half + 20, h - 8)
      ctx.fillText(`${itersRef.current} sweeps`, w - 70, h - 8)
    },
  }
}

export function JacobiRelax({ height = 220 }: { height?: number }) {
  const [iters, setIters] = useState(0)
  const itersRef = useRef(iters)
  itersRef.current = iters
  return (
    <Sim
      height={height}
      create={() => createJacobi(itersRef)}
      caption="Scrub the sweeps: each Jacobi pass lets every cell renegotiate with its neighbours; the crime dies as the hill rises."
    >
      <label className="sim-slider">
        <span>0</span>
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={iters}
          onChange={(e) => setIters(Number(e.target.value))}
        />
        <span>Jacobi sweeps</span>
      </label>
    </Sim>
  )
}
