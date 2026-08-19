import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FluidSolver, SolverRenderer } from '../lib/solver'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER } from '../lib/chrome'
import { HELD_OUT_CASES } from './cases'
import { CX, CY, NX, NY, makeActivations, propose, solidFraction } from './net'
import { relResidual, rms, sweep, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { fmtRes, lazyStepper, paneBorder, paneLabel, type Pane } from './figlib'

// The gate, removed.
//
// Both channels start from the SAME warmed-up flow and run the same solver with
// the same network in the same place. The only difference is what happens after
// the network speaks: on the left the proposal is the pressure field and nothing
// checks it; on the right the solver sweeps from it, as many times as the slider
// says.
//
// The left channel does not drift. It detonates — inside a second. The reason is
// visible in the wreckage: the proposal is stretched from a 12×8 grid, so its
// gradient has a step at every eighth cell, and that step is a velocity error
// injected on every timestep at exactly the wavelength the flow is least able to
// dissipate. The next step sees a larger divergence, proposes a larger pressure,
// and the loop closes on itself.
//
// So the honest reading is not "the network is bad" — the same network, one
// pane over, is saving two thirds of the work. It is that a component with no
// check on its output is load-bearing, and this one cannot bear load.
//
// Both panes reset together when the left one dies, so the comparison always
// restarts fair (the same discipline `AdvectionSchemes` uses in lesson 01).

const FIXED_DT = 1 / 40
const DYE_ROWS = [8, 16, 24, 32, 40, 48, 56]
const WARM = 120
const GATED_SWEEPS = 40
// A healthy 40-sweep channel sits near 0.43 on the divergence meter. The
// ungated one is called dead at 3 — seven times healthy — rather than at the
// hundreds it reaches a moment later, because the point of the figure is to be
// watched: let it run to saturation and every frame is the same flat violet,
// which reads as "the demo is broken" instead of "the flow is coming apart".
// The collapse takes about eight timesteps either way.
const RUINED = 3
const LINGER = 1.2
// Five frames per timestep. The failure is genuinely this fast — eight steps —
// and at full rate it happens between one glance and the next, so the figure
// would spend its whole life showing the aftermath. The physics timestep is
// unchanged; only the wall clock is stretched.
const FRAMES_PER_STEP = 5

/**
 * The lesson-01 solver with its pressure solve replaced. `sweepsAfter = 0` is
 * the ungated version — the proposal is accepted as the answer.
 */
class NetSolver extends FluidSolver {
  private act = makeActivations()
  private solidCoarse = new Float32Array(CX * CY)
  private grid: Grid
  lastDefect = 0

  constructor(
    public sweepsAfter: number,
    inflow: number,
    visc: number,
  ) {
    super(NX, NY, inflow, visc)
    this.grid = { nx: NX, ny: NY, solid: this.solid }
  }

  /** Called once, after the obstacle is stamped — the network needs to know about it. */
  bindGeometry() {
    solidFraction(this.solid, this.solidCoarse)
  }

  override project() {
    this.computeDivergence()
    propose(this.grid, WEIGHTS, this.div, this.solidCoarse, this.p, this.act)
    for (let n = 0; n < this.sweepsAfter; n++) sweep(this.grid, this.p, this.div)
    this.lastDefect = relResidual(this.grid, this.p, this.div)
    const nx = this.nx
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const k = i + j * nx
        if (this.solid[k]) continue
        this.u[k] -= 0.5 * (this.p[k + 1] - this.p[k - 1])
        this.v[k] -= 0.5 * (this.p[k + nx] - this.p[k - nx])
      }
    }
  }
}

/**
 * Headless probe for `scripts/check-learned.ts`: how much divergence is left in
 * the flow after `steps` timesteps when the proposal gets `sweeps` corrections.
 * Same class, same geometry, same warm-up as the figure — the check has to be
 * able to fail for the same reason the figure would.
 */
export function rolloutDivergence(sweeps: number, steps: number): number {
  const spec = HELD_OUT_CASES[0]
  const make = (n: number) => {
    const s = new NetSolver(n, spec.inflow, spec.visc)
    for (const d of spec.discs) s.addDisc(d.cx, d.cy, d.r)
    s.bindGeometry()
    return s
  }
  // Warm up GATED and then hand the state over, exactly as the figure does.
  // Warming up ungated would measure a channel that was already destroyed
  // before the clock started, which answers a different and much easier
  // question than "what happens to a healthy flow when the check is removed".
  const seed = make(40)
  for (let k = 0; k < WARM; k++) {
    seed.injectDyeStripe(DYE_ROWS, 1)
    seed.step(FIXED_DT)
  }
  const s = make(sweeps)
  s.u.set(seed.u)
  s.v.set(seed.v)
  s.dye.set(seed.dye)
  const grid: Grid = { nx: NX, ny: NY, solid: s.solid }
  for (let k = 0; k < steps; k++) {
    s.injectDyeStripe(DYE_ROWS, 1)
    s.step(FIXED_DT)
  }
  s.computeDivergence()
  return rms(grid, s.div)
}

export function createUngatedRollout(sweepsRef: { current: number }): Stepper {
  const spec = HELD_OUT_CASES[0]
  const build = (sweeps: number) => {
    const s = new NetSolver(sweeps, spec.inflow, spec.visc)
    for (const d of spec.discs) s.addDisc(d.cx, d.cy, d.r)
    s.bindGeometry()
    return s
  }
  const ungated = build(0)
  const gated = build(GATED_SWEEPS)
  const grid: Grid = { nx: NX, ny: NY, solid: ungated.solid }
  const rUngated = new SolverRenderer(ungated)
  const rGated = new SolverRenderer(gated)
  let acc = 0
  let elapsed = 0
  let divUngated = 0
  let divGated = 0
  let dead = 0

  const stepBoth = () => {
    gated.sweepsAfter = sweepsRef.current
    for (const s of [ungated, gated]) {
      s.injectDyeStripe(DYE_ROWS, 1)
      s.step(FIXED_DT)
    }
    // How incompressible is each flow, AFTER its projection had its say? This is
    // the lesson-01 crime meter, on the same footing for both panes.
    ungated.computeDivergence()
    gated.computeDivergence()
    divUngated = rms(grid, ungated.div)
    divGated = rms(grid, gated.div)
    elapsed += FIXED_DT
  }

  // Warm up ONE honest flow and seed both panes from it, so the only thing that
  // differs between the panes at t = 0 is what is about to happen to them.
  const seed = build(GATED_SWEEPS)
  for (let k = 0; k < WARM; k++) {
    seed.injectDyeStripe(DYE_ROWS, 1)
    seed.step(FIXED_DT)
  }
  const restart = () => {
    for (const s of [ungated, gated]) {
      s.u.set(seed.u)
      s.v.set(seed.v)
      s.dye.set(seed.dye)
      s.p.fill(0)
    }
    elapsed = 0
    dead = 0
    divUngated = 0
    divGated = 0
  }
  restart()

  return {
    step(dt) {
      if (dead > 0) {
        dead += dt
        if (dead > LINGER) restart()
        return
      }
      acc += dt
      const period = FIXED_DT * FRAMES_PER_STEP
      let guard = 0
      while (acc >= period && guard < 3) {
        stepBoth()
        if (divUngated > RUINED) {
          dead = 1e-6
          break
        }
        acc -= period
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 14
      const labelH = 16
      const meterH = 42
      const ph = Math.min(h - labelH - meterH, (((w - gap) / 2) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (2 * pw + gap)) / 2
      const panes: Pane[] = [0, 1].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      for (const [pane, renderer] of [
        [panes[0], rUngated] as const,
        [panes[1], rGated] as const,
      ]) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(pane.x, pane.y, pane.w, pane.h)
        ctx.clip()
        ctx.translate(pane.x, pane.y)
        renderer.draw(ctx, pane.w, pane.h, 'divergence')
        ctx.restore()
      }
      paneBorder(ctx, panes[0], true)
      paneLabel(ctx, panes[0], 'the proposal, accepted', PALETTE.dye)
      paneBorder(ctx, panes[1], false)
      paneLabel(ctx, panes[1], `the proposal, then ${gated.sweepsAfter} sweeps`)

      const l1 = labelH + ph + 19
      const l2 = l1 + 17
      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.div
      ctx.fillText(`divergence left in the flow: ${divUngated.toFixed(3)}`, panes[0].x, l1)
      ctx.fillStyle = divGated < RUINED ? PALETTE.visc : PALETTE.div
      ctx.fillText(`divergence left in the flow: ${divGated.toFixed(3)}`, panes[1].x, l1)
      ctx.font = FONT_LABEL
      ctx.fillStyle = dead > 0 ? PALETTE.div : PALETTE.wall
      ctx.fillText(
        dead > 0 ? `destroyed after ${elapsed.toFixed(1)} s — restarting both` : `nothing checked it · defect ${fmtRes(ungated.lastDefect)}`,
        panes[0].x,
        l2,
      )
      ctx.fillStyle = PALETTE.wall
      ctx.fillText(
        `${gated.sweepsAfter} correction sweeps · defect ${fmtRes(gated.lastDefect)} · ${elapsed.toFixed(1)} s of flow`,
        panes[1].x,
        l2,
      )
    },
  }
}

export function UngatedRollout({ height = 300 }: { height?: number }) {
  const [sweeps, setSweeps] = useState(40)
  const ref = useRef(sweeps)
  ref.current = sweeps
  return (
    <Sim height={height} create={() => lazyStepper(() => createUngatedRollout(ref))}>
      <label className="sim-slider">
        <span>0</span>
        <input type="range" min={0} max={40} step={1} value={sweeps} onChange={(e) => setSweeps(Number(e.target.value))} />
        <span>correction sweeps on the right</span>
      </label>
    </Sim>
  )
}
