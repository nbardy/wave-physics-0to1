import { useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { HELD_OUT_CASES, OOD_CASES, type CaseSpec } from './cases'
import { CX, CY, NX, NY, makeActivations, propose, restrict } from './net'
import { relResidual, rms, solveCG, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { caseFor, FieldPainter, lazyStepper, maxAbs, paneBorder, paneLabel, relFieldError, robustScale, solidCoarseFor, type Pane } from './figlib'

// The forward pass, opened up. Four panes, left to right:
//
//   ∇·u*            what the projection is handed
//   12 × 8          everything the network is allowed to look at
//   p₀              its proposal, stretched back to the full grid
//   p*              the answer, from conjugate gradients run to 10⁻⁶
//
// The second pane is the argument. Ninety-eight percent of the numbers in the
// first pane are gone before the first multiply — and the proposal is still
// most of the answer, because the part that survived averaging is the part the
// sweeps were going to be slowest to find.
//
// The two meters underneath are the article's central contradiction and they
// are computed from the same forward pass: how much of the FIELD is missing,
// and what the RESIDUAL says about it. They disagree violently, and both are
// correct.

const ANATOMY_CASES: readonly CaseSpec[] = [HELD_OUT_CASES[0], HELD_OUT_CASES[1], OOD_CASES[0], OOD_CASES[2]]

export function createProposalAnatomy(spec: CaseSpec): Stepper {
  const fields = caseFor(spec)
  const g: Grid = fields.grid
  const solidCoarse = solidCoarseFor(spec, fields.solid)

  const p0 = new Float32Array(NX * NY)
  propose(g, WEIGHTS, fields.b, solidCoarse, p0, makeActivations())

  const star = new Float32Array(NX * NY)
  solveCG(g, star, fields.b, 1e-6, 4000)

  const coarse = new Float32Array(CX * CY)
  restrict(fields.b, coarse)
  const coarseSolid = new Uint8Array(CX * CY)

  const bScale = robustScale(g, fields.b)
  const pScale = maxAbs(g, star)
  const cScale = Math.max(...Array.from(coarse, Math.abs))

  const fieldError = relFieldError(g, p0, star)
  const residual = relResidual(g, p0, fields.b)
  const kept = rms(g, fields.b) === 0 ? 0 : 1

  const fine = new FieldPainter()
  const small = new FieldPainter(CX, CY)

  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 10
      const labelH = 16
      const meterH = 52
      const ph = Math.min(h - labelH - meterH, (((w - 3 * gap) / 4) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (4 * pw + 3 * gap)) / 2
      const panes: Pane[] = [0, 1, 2, 3].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      fine.paint(ctx, panes[0], fields.b, 'divergence', bScale, fields.solid)
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], 'the defect  ∇·u*', PALETTE.div)

      small.paint(ctx, panes[1], coarse, 'divergence', cScale, coarseSolid, false)
      paneBorder(ctx, panes[1], true)
      paneLabel(ctx, panes[1], 'all the network sees  (12 × 8)', PALETTE.dye)

      fine.paint(ctx, panes[2], p0, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[2], true)
      paneLabel(ctx, panes[2], 'what the network proposes', PALETTE.dye)

      fine.paint(ctx, panes[3], star, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[3], false)
      paneLabel(ctx, panes[3], 'the answer')

      const l1 = labelH + ph + 19
      const l2 = l1 + 18
      ctx.font = FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText(`${(6144 * kept).toFixed(0)} numbers in`, panes[0].x, l1)
      ctx.fillText('96 survive the averaging', panes[1].x, l1)

      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.pLo
      ctx.fillText(`${((1 - fieldError) * 100).toFixed(0)}% of the field, already right`, panes[2].x, l1)
      ctx.fillStyle = PALETTE.div
      ctx.fillText(`residual ${residual.toFixed(2)} — worse than nothing`, panes[2].x, l2)
      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('conjugate gradients, a thousand', panes[3].x, l1)
      ctx.fillText('times past the gate', panes[3].x, l2)
      ctx.fillStyle = INK
      ctx.fillText('a cold start scores exactly 1.00', panes[0].x, l2)
    },
  }
}

export function ProposalAnatomy({ height = 220 }: { height?: number }) {
  const [pick, setPick] = useState(ANATOMY_CASES[0].id)
  const spec = ANATOMY_CASES.find((c) => c.id === pick) ?? ANATOMY_CASES[0]
  return (
    <Sim height={height} animated={false} key={pick} create={() => lazyStepper(() => createProposalAnatomy(spec))}>
      <div className="sim-seg">
        {ANATOMY_CASES.map((c) => (
          <button key={c.id} type="button" className={pick === c.id ? 'seg-active' : ''} onClick={() => setPick(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
    </Sim>
  )
}
