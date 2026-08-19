import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, INK } from '../lib/chrome'
import { HELD_OUT_CASES, OOD_CASES, type CaseSpec } from './cases'
import { makeActivations, propose, NX, NY } from './net'
import { maxAbsDiff, relResidual, solveCG, sweep, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { caseFor, FieldPainter, fmtRes, gateChip, lazyStepper, maxAbs, meter, paneBorder, paneLabel, relFieldError, robustScale, solidCoarseFor, type Pane } from './figlib'

// The article's hero and its coda. One frozen divergence field; two pressure
// solves on the same matrix, to the same gate. Left starts from zero, right
// starts from the network.
//
// Three things have to be visible in a single frame or the figure has failed:
//   — the cold field is EMPTY at sweep zero and fills inward from the frame,
//     one cell per sweep, because that is literally how information travels
//     through a Gauss–Seidel sweep;
//   — the warm field is fully formed before a single sweep has run;
//   — the warm pane's residual meter reads WORSE than the cold pane's at that
//     same moment. The figure would be a lie without that third one: the whole
//     article is about a guess that the residual meter cannot see the value of.
//
// Both panes share one color scale (the converged field's peak), so "looks
// converged" and "is converged" cannot come apart.

const PROPOSAL_HOLD = 0.55 // s spent showing the proposal before sweeping starts
const DONE_HOLD = 3.2 // s spent on the finished race before it restarts
const TARGET_FRAMES = 165 // how long the cold path should take to cross the gate

export const RACE_CASES: readonly CaseSpec[] = [...HELD_OUT_CASES, ...OOD_CASES]

class Racer {
  p: Float32Array
  sweeps = 0
  residual = 1
  done = false
  constructor(
    private g: Grid,
    private b: Float32Array,
    seed: Float32Array | null,
  ) {
    this.p = new Float32Array(NX * NY)
    if (seed) this.p.set(seed)
    this.residual = relResidual(g, this.p, b)
  }
  advance(n: number, tol: number) {
    for (let k = 0; k < n && !this.done; k++) {
      sweep(this.g, this.p, this.b)
      this.sweeps++
      this.residual = relResidual(this.g, this.p, this.b)
      if (this.residual < tol) this.done = true
    }
  }
}

export interface RaceOpts {
  spec: CaseSpec
  tolRef: { current: number }
}

export function createWarmStartRace({ spec, tolRef }: RaceOpts): Stepper {
  const fields = caseFor(spec)
  const g = fields.grid
  const b = fields.b
  const solidCoarse = solidCoarseFor(spec, fields.solid)

  // The proposal is computed once — it is a single forward pass and it does not
  // change while the sweeps run. 809 multiplies and adds, then it is done.
  const proposal = new Float32Array(NX * NY)
  propose(g, WEIGHTS, b, solidCoarse, proposal, makeActivations())

  // The converged answer, for the shared color scale and the agreement meter.
  const star = new Float32Array(NX * NY)
  solveCG(g, star, b, 1e-6, 4000)
  const pScale = maxAbs(g, star)
  const bScale = robustScale(g, b)
  const proposalResidual = relResidual(g, proposal, b)
  const proposalError = relFieldError(g, proposal, star)

  const painter = new FieldPainter()
  let cold = new Racer(g, b, null)
  let warm = new Racer(g, b, proposal)
  let tol = tolRef.current
  let perFrame = 20
  let phase: 'proposing' | 'racing' | 'done' = 'proposing'
  let clock = 0
  let agreement = 0

  const restart = () => {
    tol = tolRef.current
    cold = new Racer(g, b, null)
    warm = new Racer(g, b, proposal)
    // Calibrate the animation to the problem rather than to a guessed constant:
    // one throwaway cold solve says how many sweeps this tolerance costs, and
    // the race is paced to cross the line in about the same wall time whatever
    // the reader picks. The COUNTERS still report real sweeps.
    const probe = new Float32Array(NX * NY)
    let n = 0
    while (n < 20000 && relResidual(g, probe, b) >= tol) {
      sweep(g, probe, b)
      n++
    }
    perFrame = Math.max(1, Math.ceil(n / TARGET_FRAMES))
    phase = 'proposing'
    clock = 0
    agreement = 0
  }
  restart()

  return {
    step(dt) {
      if (tolRef.current !== tol) {
        restart()
        return
      }
      clock += dt
      if (phase === 'proposing') {
        if (clock >= PROPOSAL_HOLD) {
          phase = 'racing'
          clock = 0
        }
        return
      }
      if (phase === 'racing') {
        cold.advance(perFrame, tol)
        warm.advance(perFrame, tol)
        if (cold.done && warm.done) {
          agreement = maxAbsDiff(g, cold.p, warm.p) / (pScale || 1)
          phase = 'done'
          clock = 0
        }
        return
      }
      if (clock >= DONE_HOLD) restart()
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 12
      const labelH = 16
      const meterH = 80
      // Aspect first, then fit: a squashed 96×64 field would misreport the
      // shape of a pressure lobe, and the shape is the thing being compared.
      const ph = Math.min(h - labelH - meterH, (((w - 2 * gap) / 3) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (3 * pw + 2 * gap)) / 2
      const top = labelH
      const panes: Pane[] = [0, 1, 2].map((i) => ({ x: x0 + i * (pw + gap), y: top, w: pw, h: ph }))

      painter.paint(ctx, panes[0], b, 'divergence', bScale, fields.solid)
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], 'the defect  ∇·u*', PALETTE.div)

      painter.paint(ctx, panes[1], cold.p, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[1], false)
      paneLabel(ctx, panes[1], 'sweeping from zero')

      painter.paint(ctx, panes[2], warm.p, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[2], true)
      paneLabel(ctx, panes[2], 'sweeping from the network', PALETTE.dye)

      // Three ledger lines under the panes. Line 1 is what each solver has
      // spent, line 2 is whether its gate has opened, line 3 is the verdict.
      const l1 = top + ph + 17
      const l2 = l1 + 16
      const l3 = l2 + 17

      for (const [pane, r] of [
        [cold, panes[1]] as const,
        [warm, panes[2]] as const,
      ]) {
        meter(ctx, r.x, l1, `${pane.sweeps} sweep${pane.sweeps === 1 ? '' : 's'}`, pane.done ? PALETTE.visc : INK)
        meter(ctx, r.x + r.w, l1, `‖r‖ ${fmtRes(pane.residual)}`, PALETTE.div, 'right')
        if (pane.done) gateChip(ctx, r.x, l2, true, `accepted · ‖r‖ < ${tol}`)
      }

      ctx.font = FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.dye
      ctx.fillText('the network\u2019s one guess', panes[0].x, l1)
      ctx.fillStyle = PALETTE.wall
      ctx.fillText(`${(proposalError * 100).toFixed(0)}% of the field still missing`, panes[0].x, l2)
      ctx.fillText(`its own residual: ${proposalResidual.toFixed(2)}`, panes[0].x, l3)

      if (phase === 'done') {
        const ratio = cold.sweeps / Math.max(1, warm.sweeps)
        ctx.font = '600 13px ui-sans-serif, system-ui'
        ctx.fillStyle = PALETTE.visc
        ctx.textAlign = 'left'
        ctx.fillText(`${ratio.toFixed(1)}\u00d7 fewer sweeps`, panes[2].x, l3)
        ctx.fillStyle = PALETTE.wall
        ctx.font = FONT_LABEL
        ctx.fillText(
          `both accepted answers agree to ${(agreement * 100).toFixed(2)}% of peak pressure`,
          panes[0].x,
          l3 + 16,
        )
      }
    },
  }
}

const TOLS = [1e-2, 1e-3, 1e-4] as const

export function WarmStartRace({
  height = 230,
  caseId = 'h1',
  knobs = false,
}: {
  height?: number
  caseId?: string
  knobs?: boolean
}) {
  const [pick, setPick] = useState(caseId)
  const [tol, setTol] = useState<number>(1e-3)
  const tolRef = useRef(tol)
  tolRef.current = tol
  const spec = RACE_CASES.find((c) => c.id === pick) ?? RACE_CASES[0]
  return (
    <Sim height={height} key={pick} create={() => lazyStepper(() => createWarmStartRace({ spec, tolRef }))}>
      {knobs && (
        <>
          <div className="sim-seg">
            {RACE_CASES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={pick === c.id ? 'seg-active' : ''}
                onClick={() => setPick(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="sim-seg">
            {TOLS.map((t) => (
              <button
                key={t}
                type="button"
                className={tol === t ? 'seg-active' : ''}
                onClick={() => setTol(t)}
              >
                gate {t}
              </button>
            ))}
          </div>
        </>
      )}
    </Sim>
  )
}
