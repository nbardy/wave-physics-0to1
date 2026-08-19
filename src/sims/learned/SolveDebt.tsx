import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FluidSolver, SolverRenderer } from '../lib/solver'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { relResidual, type Grid } from './poisson'
import { fmtRes, lazyStepper, meter, paneBorder, type Pane } from './figlib'

// The debt the lesson-01 solver has been carrying since lesson 01.
//
// `FluidSolver.project` does a FIXED number of sweeps and then stops. It does
// not check anything. So there is a leftover defect in the pressure field at the
// end of every timestep, it rides forward into the next one, and nothing in the
// solver has ever told you how big it is. This figure tells you: it is the same
// solver, the same wake, plus one extra pass over the grid to measure
// ‖b − Ap‖/‖b‖ after the budget runs out.
//
// The slider is the budget. It is the honest knob for this claim, because the
// leftover is a function of it and of nothing else the reader can see — and at
// the low end the wake itself comes apart, which is what an unpaid pressure
// debt actually looks like in the dye.

// Lesson 01's cylinder, at lesson 01's numbers — this figure is about the
// CLASSICAL solver's budget and nothing else, so it is not tied to the 96×64
// grid the network was trained on, and a wake that actually sheds is worth the
// larger grid. The disc sits one cell off the centre-line for the same reason
// it does in `CylinderFlow`: a perfectly symmetric solve sits unstable forever.
const NX = 144
const NY = 88
const INFLOW = 26
const DISC_R = 7
const RE = 500
const VISC = (INFLOW * DISC_R * 2) / RE
const FIXED_DT = 1 / 40
const DYE_ROWS = [10, 18, 26, 34, 44, 54, 62, 70, 78]
const TRACE = 220
const GATE = 1e-3

export function createSolveDebt(itersRef: { current: number }): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, VISC)
  solver.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, DISC_R)
  const grid: Grid = { nx: NX, ny: NY, solid: solver.solid }
  const renderer = new SolverRenderer(solver)
  const trace: number[] = []
  let acc = 0
  let last = 0
  for (let k = 0; k < 260; k++) {
    solver.injectDyeStripe(DYE_ROWS, 1)
    solver.step(FIXED_DT)
  }

  return {
    step(dt) {
      solver.pressureIters = itersRef.current
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.injectDyeStripe(DYE_ROWS, 1)
        solver.step(FIXED_DT)
        // After `step`, solver.div holds the divergence the projection faced and
        // solver.p holds the pressure it settled for. One pass, no interference.
        last = relResidual(grid, solver.p, solver.div)
        trace.push(last)
        // `solver.div` still holds the PRE-projection divergence at this point,
        // which is what the residual had to be measured against. Recompute it
        // from the corrected velocity so the violet in the pane is the crime
        // that SURVIVED the projection — that is the thing the budget controls,
        // and it is the thing the reader is being asked to watch.
        solver.computeDivergence()
        if (trace.length > TRACE) trace.shift()
        acc -= FIXED_DT
        guard++
      }
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 16
      const labelH = 14
      const meterH = 34
      const availH = h - labelH - meterH
      const flowW = Math.min(w * 0.52, (availH * NX) / NY)
      const flow: Pane = { x: 0, y: labelH, w: flowW, h: (flowW * NY) / NX }
      const plot: Pane = { x: flowW + gap, y: labelH, w: w - flowW - gap, h: availH }

      ctx.save()
      ctx.beginPath()
      ctx.rect(flow.x, flow.y, flow.w, flow.h)
      ctx.clip()
      ctx.translate(flow.x, flow.y)
      // Dye only. An earlier version tinted this pane by the leftover
      // divergence and it taught the wrong thing twice over: the untouched
      // border cells glowed violet whatever the budget was, and — worse — a
      // reader could believe the debt is something you can SEE. You cannot.
      // That is why it needs a meter, and the meter is the plot beside it.
      renderer.draw(ctx, flow.w, flow.h, 'none')
      ctx.restore()
      paneBorder(ctx, flow, false)

      // ---- the leftover-defect trace, log y from 1 down to the gate
      const yOf = (v: number) => {
        const t = Math.max(-3.4, Math.log10(Math.max(v, 1e-4))) / -3.4
        return plot.y + t * plot.h
      }
      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      for (const dec of [0, 1, 2, 3]) {
        const y = yOf(Math.pow(10, -dec))
        ctx.strokeStyle = 'rgba(120,140,170,0.28)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(plot.x, y)
        ctx.lineTo(plot.x + plot.w, y)
        ctx.stroke()
        ctx.fillStyle = PALETTE.wall
        ctx.fillText(dec === 0 ? '1' : `10⁻${dec}`, plot.x - 4, y + 3)
      }

      // the gate the solver never even looks at
      const gy = yOf(GATE)
      ctx.save()
      ctx.strokeStyle = PALETTE.visc
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(plot.x, gy)
      ctx.lineTo(plot.x + plot.w, gy)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.visc
      ctx.fillText('the gate this solver never checks', plot.x + 6, gy - 5)

      ctx.strokeStyle = PALETTE.div
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < trace.length; i++) {
        const x = plot.x + (i / (TRACE - 1)) * plot.w
        const y = yOf(trace[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('timesteps →', plot.x + plot.w - 4, plot.y + plot.h - 5)

      const my = labelH + availH + 20
      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = INK
      ctx.fillText(`${itersRef.current} sweeps spent`, 0, my)
      meter(ctx, plot.x, my, `defect left behind: ${fmtRes(last)}`, PALETTE.div)
      meter(ctx, w, my, `${(last / GATE).toFixed(0)}× the gate`, PALETTE.div, 'right')
    },
  }
}

export function SolveDebt({ height = 250 }: { height?: number }) {
  const [iters, setIters] = useState(40)
  const ref = useRef(iters)
  ref.current = iters
  return (
    <Sim height={height} create={() => lazyStepper(() => createSolveDebt(ref))}>
      <label className="sim-slider">
        <span>4</span>
        <input type="range" min={4} max={240} step={4} value={iters} onChange={(e) => setIters(Number(e.target.value))} />
        <span>pressure sweeps per timestep</span>
      </label>
    </Sim>
  )
}
