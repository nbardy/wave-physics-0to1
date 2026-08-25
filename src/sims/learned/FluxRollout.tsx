import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { ADVECT_HELD_OUT, ADVECT_OOD, CNX, CNY, DT, relErr, type AdvectCase } from './advect'
import { ADVECT_IN_THE_LOOP } from './advect_weights'
import { CoarseLane, FineLane } from './advectRun'
import { FieldPainter, lazyStepper, meter, paneBorder, paneLabel, type Pane } from './figlib'

// The flux correction at work, over a rollout it steers itself.
//
// Three lanes from one seed: plain coarse semi-Lagrangian, the same scheme
// plus the trained correction, and the fine reference averaged down to the
// same 24×16 — the ghost both coarse lanes are trying to be. The plot is the
// article's honest axis: error against the ghost, per step, for the whole run.
//
// Two things the knobs must be able to prove:
//   — the case selector reaches out of distribution. Measured surprise, kept:
//     on the faster-than-trained swirl the correction's lead LASTS LONGER than
//     on held-out cases (more smear per step means more for a smear-repairer
//     to repair), while on held-out swirls the lead fades near the end of the
//     window. Either way the reader sees the advantage move with the case;
//   — the strength slider reaches past 100%, where an overdriven correction
//     invents dye that does not exist (violet) while its mass ledger still
//     reads zero — a component passing its only check while wrong.

const T_SHOW = 380
const HOLD = 2.2
// The ring leads the selector because it is where the correction's advantage is
// most visible (about 2× around step 100); the disc and stripes are subtler and
// the reader can visit them.
export const ROLLOUT_CASES: readonly AdvectCase[] = [ADVECT_HELD_OUT[1], ADVECT_HELD_OUT[0], ADVECT_HELD_OUT[2], ...ADVECT_OOD]

export interface FluxRolloutOpts {
  caseRef: { current: string }
  strengthRef: { current: number } // percent
}

export function createFluxRollout({ caseRef, strengthRef }: FluxRolloutOpts): Stepper {
  const coarseSolid = new Uint8Array(CNX * CNY)
  const painter = new FieldPainter(CNX, CNY)
  let caseId = ''
  let strength = -1
  let fine!: FineLane
  let plain!: CoarseLane
  let corrected!: CoarseLane
  let ghost = new Float32Array(CNX * CNY)
  let errPlain: number[] = []
  let errCorr: number[] = []
  let hold = 0
  let acc = 0

  const restart = () => {
    caseId = caseRef.current
    strength = strengthRef.current
    const spec = ROLLOUT_CASES.find((c) => c.id === caseId) ?? ROLLOUT_CASES[0]
    fine = new FineLane(spec)
    plain = new CoarseLane(spec, 4, null)
    corrected = new CoarseLane(spec, 4, ADVECT_IN_THE_LOOP, strength / 100)
    ghost = new Float32Array(CNX * CNY)
    errPlain = []
    errCorr = []
    hold = 0
  }
  restart()

  return {
    step(dt) {
      if (caseRef.current !== caseId || strengthRef.current !== strength) {
        restart()
        return
      }
      if (errPlain.length >= T_SHOW) {
        hold += dt
        if (hold > HOLD) restart()
        return
      }
      acc += dt
      let guard = 0
      while (acc >= DT && guard < 4) {
        fine.step()
        plain.step()
        corrected.step()
        fine.restrictInto(CNX, CNY, ghost)
        errPlain.push(relErr(plain.dye, ghost))
        errCorr.push(relErr(corrected.dye, ghost))
        acc -= DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 12
      const labelH = 16
      const plotH = 84
      const meterH = 40
      const availH = h - labelH - plotH - meterH
      const ph = Math.min(availH, (((w - 2 * gap) / 3) * CNY) / CNX)
      const pw = (ph * CNX) / CNY
      const x0 = (w - (3 * pw + 2 * gap)) / 2
      const panes: Pane[] = [0, 1, 2].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      painter.paint(ctx, panes[0], plain.dye, 'dye', 1, coarseSolid, false)
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], 'coarse, as shipped')
      painter.paint(ctx, panes[1], corrected.dye, 'dye', 1, coarseSolid, false)
      paneBorder(ctx, panes[1], true)
      paneLabel(ctx, panes[1], 'coarse + the correction', PALETTE.dye)
      painter.paint(ctx, panes[2], ghost, 'dye', 1, coarseSolid, false)
      paneBorder(ctx, panes[2], false)
      paneLabel(ctx, panes[2], 'the fine run, averaged down')

      // ---- the error plot, log y
      const plot = { x: 34, y: labelH + ph + 12, w: w - 40, h: plotH - 18 }
      const yOf = (v: number) => {
        const l = Math.min(0.3, Math.max(-2, Math.log10(Math.max(v, 1e-3))))
        return plot.y + ((0.3 - l) / 2.3) * plot.h
      }
      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      for (const [val, lab] of [
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
      curve(errPlain, PALETTE.wall, [])
      curve(errCorr, PALETTE.dye, [5, 3])
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('error vs the ghost →', plot.x + 4, plot.y + 10)

      // ---- meters
      const my = plot.y + plot.h + 16
      const ep = errPlain[errPlain.length - 1] ?? 0
      const ec = errCorr[errCorr.length - 1] ?? 0
      ctx.font = FONT_METER
      meter(ctx, panes[0].x, my, `error ${(ep * 100).toFixed(0)}%`, INK)
      meter(ctx, panes[1].x, my, `error ${(ec * 100).toFixed(0)}%`, ec < ep ? PALETTE.visc : PALETTE.div)
      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.wall
      ctx.fillText(`mass drift ${(plain.massDrift() * 100).toFixed(2)}%`, panes[0].x, my + 15)
      ctx.fillText(`mass drift ${(corrected.massDrift() * 100).toFixed(2)}% — the correction's share: 0`, panes[1].x, my + 15)
      meter(ctx, panes[2].x + pw, my, `${errPlain.length} steps`, INK, 'right')
    },
  }
}

export function FluxRollout({ height = 330 }: { height?: number }) {
  const [pick, setPick] = useState(ROLLOUT_CASES[0].id)
  const [strength, setStrength] = useState(100)
  const caseRef = useRef(pick)
  const strengthRef = useRef(strength)
  caseRef.current = pick
  strengthRef.current = strength
  return (
    <Sim height={height} create={() => lazyStepper(() => createFluxRollout({ caseRef, strengthRef }))}>
      <div className="sim-seg">
        {ROLLOUT_CASES.map((c) => (
          <button key={c.id} type="button" className={pick === c.id ? 'seg-active' : ''} onClick={() => setPick(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <label className="sim-slider">
        <span>0%</span>
        <input type="range" min={0} max={150} step={5} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        <span>correction strength ({strength}%)</span>
      </label>
    </Sim>
  )
}
