import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { NX, NY } from './net'
import { applyLaplacian, sweep, type Grid } from './poisson'
import { FieldPainter, lazyStepper, meter, paneBorder, paneLabel, type Pane } from './figlib'

// Why sweeping is slow — the fact the whole article turns on.
//
// The exact answer to A p = 0 is p = 0, so whatever we put in the field IS the
// error, and we can watch it die. Seed a sum of two modes with equal amplitude:
// one that spans the whole box, one that wiggles every few cells. Sweep. The
// rough one is gone before the eye can follow; the smooth one is still visibly
// there hundreds of sweeps later.
//
// The pane and the plot say the same thing twice on purpose. The pane is the
// felt version — a noisy field becoming a clean blob that then refuses to leave.
// The plot is the measured version, and it is the one that carries the number.
//
// The third curve is the meter. The exact answer is zero, so the residual is
// ‖A e‖ outright; plotted relative to its start, it falls two orders of
// magnitude in the sweeps that kill the ripple and then flattens while the
// bulge — two thirds of the error — is still on screen. That is the article's
// central fact drawn on one axis: the meter reads nearly done, the field is
// mostly error. Inks: the two modes wear pressure's red and cyan because they
// are errors IN pressure; the meter wears violet, as every residual here does.

const SWEEP_MAX = 600
const PER_FRAME = 5
const HOLD = 2.0

interface Mode {
  m: number
  n: number
}

function modeField(mode: Mode, out: Float32Array): void {
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      out[i + j * NX] =
        Math.sin((Math.PI * mode.m * i) / (NX - 1)) * Math.sin((Math.PI * mode.n * j) / (NY - 1))
    }
  }
}

/** Amplitude of `f` along `basis` — ⟨f,φ⟩/⟨φ,φ⟩, the honest way to ask "how much of this mode is left". */
function amplitude(f: Float32Array, basis: Float32Array): number {
  let num = 0
  let den = 0
  for (let k = 0; k < f.length; k++) {
    num += f[k] * basis[k]
    den += basis[k] * basis[k]
  }
  return den === 0 ? 0 : num / den
}

// `meter` adds the third curve — the residual ‖A e‖ in violet, with its reading —
// on top of the two error curves. Off by default so the baseline draft's figure
// stays the figure its prose describes; the v3 draft turns it on.
export function createSlowModes(roughRef: { current: number }, { showMeter = false }: { showMeter?: boolean } = {}): Stepper {
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const zero = new Float32Array(NX * NY)
  const smooth = new Float32Array(NX * NY)
  const rough = new Float32Array(NX * NY)
  const err = new Float32Array(NX * NY)
  const painter = new FieldPainter()

  let k = roughRef.current
  let sweeps = 0
  let hold = 0
  // Both curves are live and on screen together, which is the whole contrast —
  // no ghost reference is needed, and an earlier version's faint k = 1 / k = 16
  // ghosts only crowded the corner the legend wanted.
  const smoothTrace: number[] = []
  const roughTrace: number[] = []
  const resTrace: number[] = []
  const ae = new Float32Array(NX * NY)
  /** ‖A e‖ over the interior — the residual meter with b = 0. */
  const resNorm = () => {
    applyLaplacian(grid, err, ae)
    let s = 0
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) s += ae[i + j * NX] ** 2
    return Math.sqrt(s)
  }
  let r0 = 1

  const reseed = () => {
    k = roughRef.current
    modeField({ m: 1, n: 1 }, smooth)
    modeField({ m: k, n: Math.max(1, Math.round((k * NY) / NX)) }, rough)
    for (let i = 0; i < err.length; i++) err[i] = smooth[i] + rough[i]
    sweeps = 0
    hold = 0
    smoothTrace.length = 0
    roughTrace.length = 0
    resTrace.length = 0
    smoothTrace.push(1)
    roughTrace.push(1)
    resTrace.push(1)
    r0 = resNorm()
  }
  reseed()
  const a0s = amplitude(err, smooth)
  const a0r = amplitude(err, rough)
  let e0sq = 0
  for (let i = 0; i < err.length; i++) e0sq += err[i] * err[i]

  /** First sweep count at which a trace is under 10% of where it started. */
  const tenth = (trace: number[]) => {
    for (let i = 0; i < trace.length; i++) if (trace[i] < 0.1) return i
    return -1
  }

  return {
    step(dt) {
      if (roughRef.current !== k) {
        reseed()
        return
      }
      if (sweeps >= SWEEP_MAX) {
        hold += dt
        if (hold > HOLD) reseed()
        return
      }
      for (let s = 0; s < PER_FRAME && sweeps < SWEEP_MAX; s++) {
        sweep(grid, err, zero)
        sweeps++
        smoothTrace.push(Math.abs(amplitude(err, smooth) / a0s))
        roughTrace.push(Math.abs(amplitude(err, rough) / a0r))
        resTrace.push(resNorm() / r0)
      }
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 18
      const labelH = 16
      const meterH = 56
      const availH = h - labelH - meterH
      const fieldW = Math.min(w * 0.42, (availH * NX) / NY)
      const fh = (fieldW * NY) / NX
      const field: Pane = { x: 0, y: labelH, w: fieldW, h: fh }
      const plot: Pane = { x: fieldW + gap, y: labelH, w: w - fieldW - gap, h: availH }

      // The field is an error IN pressure, so it wears pressure's ramp. The
      // scale is fixed at the seeded amplitude rather than auto-fitted: an
      // auto-fit pane would renormalize the remnant back to full contrast every
      // frame and hide the very decay the figure is about.
      painter.paint(ctx, field, err, 'pressure', 2, grid.solid)
      paneBorder(ctx, field, false)
      paneLabel(ctx, field, 'the error still in the field')

      // ---- decay plot, log y from 1 down to 10⁻³
      const yOf = (v: number) => {
        const t = Math.max(-3, Math.log10(Math.max(v, 1e-4))) / -3
        return plot.y + t * plot.h
      }
      const xOf = (s: number) => plot.x + (s / SWEEP_MAX) * plot.w

      ctx.strokeStyle = 'rgba(120,140,170,0.30)'
      ctx.lineWidth = 1
      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      for (const dec of [0, 1, 2, 3]) {
        const y = yOf(Math.pow(10, -dec))
        ctx.beginPath()
        ctx.moveTo(plot.x, y)
        ctx.lineTo(plot.x + plot.w, y)
        ctx.stroke()
        ctx.fillStyle = PALETTE.wall
        ctx.fillText(dec === 0 ? '1' : `10⁻${dec}`, plot.x - 4, y + 3)
      }

      const curve = (trace: number[], color: string, width: number, dash: number[] = []) => {
        if (trace.length < 2) return
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 0; i < trace.length; i++) {
          const x = xOf(i)
          const y = yOf(trace[i])
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
      }
      curve(smoothTrace, PALETTE.pLo, 2.2)
      curve(roughTrace, PALETTE.pHi, 2.2)
      if (showMeter) curve(resTrace, PALETTE.div, 2.2, [5, 3])

      ctx.font = FONT_LABEL
      ctx.textAlign = 'right'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('sweeps →', plot.x + plot.w - 4, plot.y + plot.h - 5)
      ctx.fillStyle = PALETTE.pHi
      ctx.fillText(`rough mode, k = ${k}`, plot.x + plot.w - 4, plot.y + 12)
      ctx.fillStyle = PALETTE.pLo
      ctx.fillText('smooth mode, k = 1', plot.x + plot.w - 4, plot.y + 26)
      if (showMeter) {
        ctx.fillStyle = PALETTE.div
        ctx.fillText('the meter  ‖A e‖', plot.x + plot.w - 4, plot.y + 40)
      }

      // ---- the number
      const tr = tenth(roughTrace)
      const ts = tenth(smoothTrace)
      const my = labelH + availH + 18
      const my2 = my + 17
      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.pHi
      ctx.fillText(`rough: 90% gone in ${tr < 0 ? '—' : tr} sweeps`, 0, my)
      ctx.fillStyle = PALETTE.pLo
      const smoothTxt = ts < 0 ? `still ${(smoothTrace[smoothTrace.length - 1] * 100).toFixed(0)}% there after ${sweeps}` : `${ts}`
      ctx.fillText(`smooth: ${ts < 0 ? smoothTxt : `90% gone in ${ts} sweeps`}`, plot.x, my)
      // The reading that matters: the meter against the error actually left.
      let e2 = 0
      for (let i = 0; i < err.length; i++) e2 += err[i] * err[i]
      const errLeft = Math.sqrt(e2 / e0sq)
      if (showMeter) {
        ctx.fillStyle = PALETTE.div
        ctx.fillText(`the meter reads ${(resTrace[resTrace.length - 1] * 100).toFixed(1)}% of its start`, 0, my2)
      }
      ctx.fillStyle = INK
      ctx.fillText(`error still in the field: ${(errLeft * 100).toFixed(0)}%`, plot.x, my2)
      meter(ctx, w, my2, `${sweeps} sweeps`, INK, 'right')
    },
  }
}

export function SlowModes({ height = 240, meter = false }: { height?: number; meter?: boolean }) {
  const [k, setK] = useState(14)
  const kRef = useRef(k)
  kRef.current = k
  return (
    <Sim height={height} create={() => lazyStepper(() => createSlowModes(kRef, { showMeter: meter }))}>
      <label className="sim-slider">
        <span>3</span>
        <input type="range" min={3} max={28} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        <span>roughness of the second mode</span>
      </label>
    </Sim>
  )
}
