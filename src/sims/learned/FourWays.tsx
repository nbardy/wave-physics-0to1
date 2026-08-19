import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { HELD_OUT_CASES, type CaseSpec } from './cases'
import { NX, NY, makeActivations, propose } from './net'
import { applyLaplacian, relResidual, sweep, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { caseFor, fmtRes, lazyStepper, solidCoarseFor } from './figlib'

// Four ways to solve the same linear system, racing to the same gate on one
// axis of honest work.
//
// The x axis is PASSES OVER THE GRID, not iterations, because iterations are not
// comparable: a Gauss–Seidel sweep touches every cell once, and a conjugate
// gradient step touches it about three times (one stencil application plus the
// vector arithmetic that makes CG what it is). Counting iterations would flatter
// CG by a factor of three, and this figure exists to be un-flattering to
// whichever method the reader arrived rooting for.
//
// The thing that has to be visible in one frame is the ordering: cold conjugate
// gradients crosses the gate while WARM Gauss–Seidel is still going. The
// network's 2.8× is real. It is also smaller than the gap between the solver we
// have and the solver a library would have handed us.

const CG_PASS_COST = 3
const TOL = 1e-3
const TARGET_FRAMES = 200
const HOLD = 3.5

type Kind = 'gs-cold' | 'gs-warm' | 'cg-cold' | 'cg-warm'

interface Runner {
  kind: Kind
  label: string
  color: string
  dash: number[]
  p: Float32Array
  passes: number
  residual: number
  done: boolean
  trace: Array<[number, number]>
  advance(passes: number): void
}

/** Conjugate gradients, one step at a time, so the figure can interleave it. */
class CgState {
  r: Float64Array
  d: Float64Array
  q: Float64Array
  x: Float64Array
  rr: number
  constructor(
    private g: Grid,
    b: Float32Array,
    p: Float32Array,
  ) {
    const n = g.nx * g.ny
    this.x = Float64Array.from(p)
    this.r = new Float64Array(n)
    this.d = new Float64Array(n)
    this.q = new Float64Array(n)
    const ap = new Float64Array(n)
    applyLaplacian(g, this.x, ap)
    for (let k = 0; k < n; k++) this.r[k] = -b[k] + ap[k]
    this.d.set(this.r)
    this.rr = this.dot(this.r, this.r)
  }
  private dot(a: Float64Array, c: Float64Array) {
    let s = 0
    for (let j = 1; j < this.g.ny - 1; j++)
      for (let i = 1; i < this.g.nx - 1; i++) {
        const k = i + j * this.g.nx
        if (this.g.solid[k]) continue
        s += a[k] * c[k]
      }
    return s
  }
  step(out: Float32Array) {
    const { g } = this
    applyLaplacian(g, this.d, this.q)
    for (let k = 0; k < this.q.length; k++) this.q[k] = -this.q[k]
    const dq = this.dot(this.d, this.q)
    if (dq === 0) return
    const alpha = this.rr / dq
    for (let j = 1; j < g.ny - 1; j++)
      for (let i = 1; i < g.nx - 1; i++) {
        const k = i + j * g.nx
        if (g.solid[k]) continue
        this.x[k] += alpha * this.d[k]
        this.r[k] -= alpha * this.q[k]
      }
    const rr2 = this.dot(this.r, this.r)
    const beta = rr2 / this.rr
    this.rr = rr2
    for (let j = 1; j < g.ny - 1; j++)
      for (let i = 1; i < g.nx - 1; i++) {
        const k = i + j * g.nx
        if (g.solid[k]) continue
        this.d[k] = this.r[k] + beta * this.d[k]
        out[k] = this.x[k]
      }
  }
}

export function createFourWays(spec: CaseSpec = HELD_OUT_CASES[0]): Stepper {
  const fields = caseFor(spec)
  const g = fields.grid
  const b = fields.b
  const solidCoarse = solidCoarseFor(spec, fields.solid)
  const proposal = new Float32Array(NX * NY)
  propose(g, WEIGHTS, b, solidCoarse, proposal, makeActivations())

  let runners: Runner[] = []
  let maxPasses = 1
  let perFrame = 1
  let hold = 0

  const makeRunner = (kind: Kind, label: string, color: string, dash: number[]): Runner => {
    const p = new Float32Array(NX * NY)
    if (kind === 'gs-warm' || kind === 'cg-warm') p.set(proposal)
    const cg = kind.startsWith('cg') ? new CgState(g, b, p) : null
    const r: Runner = {
      kind,
      label,
      color,
      dash,
      p,
      passes: 0,
      residual: relResidual(g, p, b),
      done: false,
      trace: [[0, relResidual(g, p, b)]],
      advance(passes: number) {
        let spent = 0
        while (spent < passes && !r.done) {
          if (cg) {
            cg.step(r.p)
            spent += CG_PASS_COST
            r.passes += CG_PASS_COST
          } else {
            sweep(g, r.p, b)
            spent += 1
            r.passes += 1
          }
          r.residual = relResidual(g, r.p, b)
          r.trace.push([r.passes, r.residual])
          if (r.residual < TOL) r.done = true
        }
      },
    }
    return r
  }

  const restart = () => {
    runners = [
      makeRunner('gs-cold', 'sweeps, from zero', PALETTE.wall, []),
      makeRunner('gs-warm', 'sweeps, from the network', PALETTE.dye, [5, 3]),
      makeRunner('cg-cold', 'conjugate gradients, from zero', PALETTE.vel, []),
      makeRunner('cg-warm', 'conjugate gradients, from the network', PALETTE.visc, [5, 3]),
    ]
    // Pace to the slowest method so the whole comparison fits one viewing.
    const probe = new Float32Array(NX * NY)
    let n = 0
    while (n < 20000 && relResidual(g, probe, b) >= TOL) {
      sweep(g, probe, b)
      n++
    }
    maxPasses = n
    perFrame = Math.max(1, Math.ceil(n / TARGET_FRAMES))
    hold = 0
  }
  restart()

  return {
    step(dt) {
      if (runners.every((r) => r.done)) {
        hold += dt
        if (hold > HOLD) restart()
        return
      }
      for (const r of runners) r.advance(perFrame)
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const rowH = 17
      const legendH = rowH * 4 + 22
      const plot = { x: 34, y: 8, w: w - 40, h: h - legendH - 20 }

      // The axis reaches ABOVE 1 on purpose: both warm starts begin around 2.4,
      // and an axis topping out at 1 would clip away the single most important
      // fact in the figure — that the two curves which finish first are the two
      // that start out looking worst.
      const TOP = 0.55 // log₁₀ of the top of the axis
      const BOT = -3.2
      const yOf = (v: number) => {
        const l = Math.min(TOP, Math.max(BOT, Math.log10(Math.max(v, 1e-4))))
        return plot.y + ((TOP - l) / (TOP - BOT)) * plot.h
      }
      const xOf = (p: number) => plot.x + (p / maxPasses) * plot.w

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
        ctx.fillText(dec === 0 ? '1' : `10⁻${dec}`, plot.x - 5, y + 3)
      }
      const gy = yOf(TOL)
      ctx.save()
      ctx.strokeStyle = PALETTE.visc
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(plot.x, gy)
      ctx.lineTo(plot.x + plot.w, gy)
      ctx.stroke()
      ctx.restore()

      for (const r of runners) {
        ctx.save()
        ctx.strokeStyle = r.color
        ctx.lineWidth = 2
        ctx.setLineDash(r.dash)
        ctx.beginPath()
        for (let i = 0; i < r.trace.length; i++) {
          const [p, v] = r.trace[i]
          const x = xOf(p)
          const y = yOf(v)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
        if (r.done) {
          ctx.fillStyle = r.color
          ctx.beginPath()
          ctx.arc(xOf(r.passes), gy, 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('passes over the grid →', plot.x + plot.w - 2, plot.y + plot.h + 13)

      let y = plot.y + plot.h + 34
      for (const r of runners) {
        ctx.save()
        ctx.strokeStyle = r.color
        ctx.lineWidth = 2.4
        ctx.setLineDash(r.dash)
        ctx.beginPath()
        ctx.moveTo(0, y - 4)
        ctx.lineTo(22, y - 4)
        ctx.stroke()
        ctx.restore()
        ctx.font = FONT_LABEL
        ctx.textAlign = 'left'
        ctx.fillStyle = INK
        ctx.fillText(r.label, 30, y)
        ctx.font = FONT_METER
        ctx.textAlign = 'right'
        ctx.fillStyle = r.done ? PALETTE.visc : PALETTE.div
        ctx.fillText(r.done ? `${r.passes} passes · accepted` : `${r.passes} passes · ‖r‖ ${fmtRes(r.residual)}`, w, y)
        y += rowH
      }
    },
  }
}

export function FourWays({ height = 300 }: { height?: number }) {
  return <Sim height={height} create={() => lazyStepper(() => createFourWays())} />
}
