import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { HELD_OUT_CASES } from './cases'
import { NX, NY, makeActivations, propose, zeroWeights, type NetWeights } from './net'
import { relResidual, solveCG, solveToTolerance, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { caseFor, FieldPainter, gateChip, lazyStepper, maxAbs, meter, paneBorder, paneLabel, relFieldError, solidCoarseFor, type Pane } from './figlib'

// The contract, stress-tested.
//
// The slider adds noise to every weight in the shipped network. At the left end
// it is the trained model; at the right end it is a random function of the
// divergence field. Three numbers move, and they do not move together:
//
//   the proposal's error   climbs, and keeps climbing
//   sweeps to the gate     climbs, past the cold-start line, and keeps going
//   the accepted answer    does not move
//
// The third one is the point. There is no setting of this slider that makes the
// pressure field wrong. There are plenty that make it slow — the network can go
// from saving two thirds of the work to costing double, and it does, well before
// the slider runs out. That is the trade a residual gate buys you: a learned
// component behind it can spend your time and cannot spend your correctness.
//
// Scrubbing is deterministic (the noise is seeded from the slider position), so
// dragging back and forth re-runs the same experiment rather than a new one.

const TOL = 1e-3
const MAX_SWEEPS = 8000

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Key = keyof NetWeights
const KEYS: Key[] = ['w1', 'b1', 'w2', 'b2', 'w3', 'b3']

/** The shipped weights plus σ · (this tensor's own RMS) · gaussian noise. */
function corrupt(sigma: number, seed: number): NetWeights {
  const out = zeroWeights()
  const rnd = mulberry32(seed)
  for (const k of KEYS) {
    const src = WEIGHTS[k]
    let s = 0
    for (let i = 0; i < src.length; i++) s += src[i] * src[i]
    const scale = Math.sqrt(s / Math.max(1, src.length)) * sigma
    const dst = new Float32Array(src.length)
    for (let i = 0; i < src.length; i++) {
      const u = Math.max(rnd(), 1e-12)
      dst[i] = src[i] + scale * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
    }
    out[k] = dst
  }
  return out
}

export interface SabotageReading {
  proposalError: number
  sweeps: number
  coldSweeps: number
  /** How far the ACCEPTED answer moved, relative to a pure cold-start solve. */
  acceptedError: number
}

/**
 * Headless probe for `scripts/check-learned.ts` — the same three numbers the
 * figure prints, at any damage level, so the article's central claim (the clock
 * moves, the answer does not) is asserted rather than asserted-in-prose.
 */
export function sabotageReading(sigmaPercent: number): SabotageReading {
  const spec = HELD_OUT_CASES[0]
  const fields = caseFor(spec)
  const g: Grid = fields.grid
  const solidCoarse = solidCoarseFor(spec, fields.solid)
  const star = new Float32Array(NX * NY)
  solveCG(g, star, fields.b, 1e-6, 4000)
  const cold = new Float32Array(NX * NY)
  const coldSweeps = solveToTolerance(g, cold, fields.b, TOL, MAX_SWEEPS).sweeps
  const w = sigmaPercent === 0 ? WEIGHTS : corrupt(sigmaPercent / 100, 1000 + Math.round(sigmaPercent))
  const p = new Float32Array(NX * NY)
  propose(g, w, fields.b, solidCoarse, p, makeActivations())
  const proposalError = relFieldError(g, p, star)
  const sweeps = solveToTolerance(g, p, fields.b, TOL, MAX_SWEEPS).sweeps
  return { proposalError, sweeps, coldSweeps, acceptedError: relFieldError(g, p, cold) }
}

export function createSabotageGate(sigmaRef: { current: number }): Stepper {
  const spec = HELD_OUT_CASES[0]
  const fields = caseFor(spec)
  const g: Grid = fields.grid
  const solidCoarse = solidCoarseFor(spec, fields.solid)

  const star = new Float32Array(NX * NY)
  solveCG(g, star, fields.b, 1e-6, 4000)
  const pScale = maxAbs(g, star)

  // The cold-start line every reading is measured against.
  const coldRef = new Float32Array(NX * NY)
  const coldSweeps = solveToTolerance(g, coldRef, fields.b, TOL, MAX_SWEEPS).sweeps

  const proposal = new Float32Array(NX * NY)
  const accepted = new Float32Array(NX * NY)
  const act = makeActivations()
  const painter = new FieldPainter()

  let sigma = -1
  let proposalError = 0
  let sweeps = 0
  let acceptedError = 0
  let acceptedRes = 0

  const recompute = () => {
    sigma = sigmaRef.current
    const w = sigma === 0 ? WEIGHTS : corrupt(sigma / 100, 1000 + Math.round(sigma))
    propose(g, w, fields.b, solidCoarse, proposal, act)
    proposalError = relFieldError(g, proposal, star)
    accepted.set(proposal)
    const rep = solveToTolerance(g, accepted, fields.b, TOL, MAX_SWEEPS)
    sweeps = rep.sweeps
    acceptedRes = relResidual(g, accepted, fields.b)
    acceptedError = relFieldError(g, accepted, coldRef)
  }
  recompute()

  return {
    step() {
      if (sigmaRef.current !== sigma) recompute()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 14
      const labelH = 16
      const barH = 40
      const meterH = 56
      const ph = Math.min(h - labelH - barH - meterH, (((w - gap) / 2) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (2 * pw + gap)) / 2
      const panes: Pane[] = [0, 1].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      painter.paint(ctx, panes[0], proposal, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[0], true)
      paneLabel(ctx, panes[0], 'what the damaged network proposes', PALETTE.dye)
      painter.paint(ctx, panes[1], accepted, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[1], false)
      paneLabel(ctx, panes[1], 'what the gate accepts')

      // ---- the cost bar: sweeps, against the cold-start line
      const bar = { x: x0, y: labelH + ph + 20, w: 2 * pw + gap, h: 12 }
      const full = Math.max(coldSweeps * 1.6, sweeps * 1.05)
      ctx.fillStyle = 'rgba(120,140,170,0.16)'
      ctx.beginPath()
      ctx.roundRect(bar.x, bar.y, bar.w, bar.h, 6)
      ctx.fill()
      const slower = sweeps > coldSweeps
      ctx.fillStyle = slower ? PALETTE.div : PALETTE.dye
      ctx.beginPath()
      ctx.roundRect(bar.x, bar.y, Math.max(3, (sweeps / full) * bar.w), bar.h, 6)
      ctx.fill()
      const cx = bar.x + (coldSweeps / full) * bar.w
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, bar.y - 4)
      ctx.lineTo(cx, bar.y + bar.h + 4)
      ctx.stroke()
      ctx.font = FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = INK
      ctx.fillText(`cold start: ${coldSweeps}`, cx + 5, bar.y - 6)

      const l1 = bar.y + bar.h + 20
      const l2 = l1 + 17
      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = proposalError > 0.5 ? PALETTE.div : PALETTE.dye
      ctx.fillText(`${(proposalError * 100).toFixed(0)}% of the proposal is wrong`, panes[0].x, l1)
      ctx.fillStyle = slower ? PALETTE.div : PALETTE.visc
      meter(
        ctx,
        panes[0].x,
        l2,
        slower ? `${sweeps} sweeps — slower than no guess at all` : `${sweeps} sweeps — ${(coldSweeps / Math.max(1, sweeps)).toFixed(1)}× faster`,
        slower ? PALETTE.div : PALETTE.visc,
      )
      gateChip(ctx, panes[1].x, l1, true, `accepted · ‖r‖ ${acceptedRes.toExponential(1)}`)
      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.wall
      ctx.textAlign = 'left'
      ctx.fillText(
        `differs from the cold-start answer by ${(acceptedError * 100).toFixed(2)}%`,
        panes[1].x,
        l2,
      )
    },
  }
}

export function SabotageGate({ height = 300 }: { height?: number }) {
  const [sigma, setSigma] = useState(0)
  const ref = useRef(sigma)
  ref.current = sigma
  return (
    <Sim height={height} animated={false} create={() => lazyStepper(() => createSabotageGate(ref))}>
      <label className="sim-slider">
        <span>trained</span>
        <input type="range" min={0} max={200} step={5} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} />
        <span>damage to every weight</span>
      </label>
    </Sim>
  )
}
