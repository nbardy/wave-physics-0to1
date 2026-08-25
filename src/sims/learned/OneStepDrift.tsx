import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { ADVECT_HELD_OUT, CNX, CNY, DT, relErr } from './advect'
import { ADVECT_IN_THE_LOOP, ADVECT_ONE_STEP } from './advect_weights'
import { CoarseLane, FineLane } from './advectRun'
import { FieldPainter, lazyStepper, meter, paneBorder, paneLabel, type Pane } from './figlib'

// Same architecture, same data, same optimizer — two losses.
//
// The one-step model was trained to match the very next state, and its
// training score is spectacular (~10⁻⁶). The in-the-loop model was trained
// inside a rollout of the solver it lives in — sixteen steps of riding its own
// outputs, gradients carried through the advection itself — and its training
// loss settles about a hundred times HIGHER. Run free on a held-out flow, the
// one-step lane detonates (error in the hundreds by the end of the window)
// while the in-the-loop lane stays in the plain solver's neighborhood the
// whole way: ahead of it for the first couple hundred steps, trading places
// after, never blowing up. Every number is recomputed live; nothing is
// replayed.
//
// Two slots in the lesson, one stepper: 'failure' shows only the one-step
// model coming apart next to the ghost (the naive loss, before any repair is
// on the table); 'both' adds the in-the-loop lane for the direct comparison.

export type DriftMode = 'failure' | 'both'

const T_SHOW = 380
const HOLD = 2.4

export function createOneStepDrift(mode: DriftMode = 'both'): Stepper {
  const spec = ADVECT_HELD_OUT[0]
  const coarseSolid = new Uint8Array(CNX * CNY)
  const painter = new FieldPainter(CNX, CNY)
  let fine!: FineLane
  let oneStep!: CoarseLane
  let inLoop!: CoarseLane
  let ghost = new Float32Array(CNX * CNY)
  let errPlainTrace: number[] = []
  let errOne: number[] = []
  let errLoop: number[] = []
  let plain!: CoarseLane
  let hold = 0
  let acc = 0

  const restart = () => {
    fine = new FineLane(spec)
    plain = new CoarseLane(spec, 4, null)
    oneStep = new CoarseLane(spec, 4, ADVECT_ONE_STEP)
    inLoop = new CoarseLane(spec, 4, ADVECT_IN_THE_LOOP)
    ghost = new Float32Array(CNX * CNY)
    errPlainTrace = []
    errOne = []
    errLoop = []
    hold = 0
  }
  restart()

  return {
    step(dt) {
      if (errOne.length >= T_SHOW) {
        hold += dt
        if (hold > HOLD) restart()
        return
      }
      acc += dt
      let guard = 0
      while (acc >= DT && guard < 4) {
        fine.step()
        plain.step()
        oneStep.step()
        inLoop.step()
        fine.restrictInto(CNX, CNY, ghost)
        errPlainTrace.push(relErr(plain.dye, ghost))
        errOne.push(relErr(oneStep.dye, ghost))
        errLoop.push(relErr(inLoop.dye, ghost))
        acc -= DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 12
      const labelH = 16
      const plotH = 96
      const meterH = 22
      const nPanes = mode === 'both' ? 3 : 2
      const availH = h - labelH - plotH - meterH
      const ph = Math.min(availH, (((w - (nPanes - 1) * gap) / nPanes) * CNY) / CNX)
      const pw = (ph * CNX) / CNY
      const x0 = (w - (nPanes * pw + (nPanes - 1) * gap)) / 2
      const panes: Pane[] = Array.from({ length: nPanes }, (_, i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))
      const ghostPane = panes[nPanes - 1]

      painter.paint(ctx, panes[0], oneStep.dye, 'dye', 1, coarseSolid, false)
      paneBorder(ctx, panes[0], true)
      paneLabel(ctx, panes[0], 'trained one step ahead', PALETTE.div)
      if (mode === 'both') {
        painter.paint(ctx, panes[1], inLoop.dye, 'dye', 1, coarseSolid, false)
        paneBorder(ctx, panes[1], true)
        paneLabel(ctx, panes[1], 'trained inside the rollout', PALETTE.dye)
      }
      painter.paint(ctx, ghostPane, ghost, 'dye', 1, coarseSolid, false)
      paneBorder(ctx, ghostPane, false)
      paneLabel(ctx, ghostPane, 'the ghost')

      const plot = { x: 34, y: labelH + ph + 12, w: w - 40, h: plotH - 18 }
      const yOf = (v: number) => {
        const l = Math.min(1, Math.max(-2, Math.log10(Math.max(v, 1e-3))))
        return plot.y + ((1 - l) / 3) * plot.h
      }
      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      for (const [val, lab] of [
        [10, '10'],
        [1, '1'],
        [0.1, '0.1'],
        [0.01, '0.01'],
      ] as const) {
        const y = yOf(val)
        ctx.strokeStyle = 'rgba(120,140,170,0.28)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(plot.x, y)
        ctx.lineTo(plot.x + plot.w, y)
        ctx.stroke()
        ctx.fillStyle = PALETTE.wall
        ctx.fillText(lab, plot.x - 4, y + 3)
      }
      const curve = (trace: number[], color: string, dash: number[]) => {
        if (trace.length < 2) return
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i < trace.length; i++) {
          const x = plot.x + (i / (T_SHOW - 1)) * plot.w
          const y = yOf(trace[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
      }
      curve(errPlainTrace, PALETTE.wall, [])
      curve(errOne, PALETTE.div, [5, 3])
      if (mode === 'both') curve(errLoop, PALETTE.dye, [5, 3])
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('no correction', plot.x + 6, yOf(0.5) - 4)

      const my = plot.y + plot.h + 15
      const eo = errOne[errOne.length - 1] ?? 0
      const el = errLoop[errLoop.length - 1] ?? 0
      const ep = errPlainTrace[errPlainTrace.length - 1] ?? 0
      ctx.font = FONT_METER
      meter(ctx, panes[0].x, my, `error ${eo > 2 ? eo.toFixed(0) + '×' : (eo * 100).toFixed(0) + '%'}`, PALETTE.div)
      // green only while the corrected lane is genuinely ahead of plain — the
      // meter must not congratulate a lane for merely not detonating
      if (mode === 'both') meter(ctx, panes[1].x, my, `error ${(el * 100).toFixed(0)}%`, el <= ep ? PALETTE.visc : INK)
      meter(ctx, ghostPane.x + pw, my, `${errOne.length} steps`, INK, 'right')
    },
  }
}

export function OneStepDrift({ height = 330, mode = 'both' }: { height?: number; mode?: DriftMode }) {
  return <Sim height={height} create={() => lazyStepper(() => createOneStepDrift(mode))} />
}
