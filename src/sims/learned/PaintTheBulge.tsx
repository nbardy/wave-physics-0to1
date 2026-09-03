import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { HELD_OUT_CASES } from './cases'
import { CX, CY, NX, NY, POOL, prolong, restrict } from './net'
import { applyLaplacian, relResidual, solveCG, type Grid } from './poisson'
import { caseFor, FieldPainter, lazyStepper, maxAbs, meter, paneBorder, paneLabel, relFieldError, robustScale, type Pane } from './figlib'

// The reader supplies the smooth part of the pressure field by hand.
//
// Ninety-six blocks, 12 × 8, dragged up or down; the same bilinear prolongation
// the network uses stretches them to 96 × 64, and that is the guess p₀. Three
// panes: the guess, the residual field |b − A p₀| (what the meter hears), and
// the converged answer to paint toward. Two meters, computed from the same
// p₀: how much of the FIELD is still missing, and the residual.
//
// The thing the figure has to show: every block set closer to the answer makes
// the field error fall and the residual RISE. A bilinear ramp has zero
// Laplacian inside a block, so A p₀ is a lattice of spikes along the lines
// where the ramps meet — eight cells apart — and those spikes are the roughest
// thing the grid holds. Raising a single block to its correct height already
// puts the meter above the empty grid's 1.00. The residual pane lights along
// the seams and nowhere else; that is the whole argument, made by the
// reader's own hand.
//
// The case is the hero's field, so the bulge being painted is the one the
// network paints two sections later.

export interface PaintRef {
  /** The 12 × 8 guess. Reset (fresh `create`) zeroes it. */
  coarse: Float32Array
  /** Where the guess pane was last drawn, in canvas CSS pixels — the pointer handler needs it. */
  layout: { pane: Pane | null }
  /** Bumped by the pointer handler so the stepper knows to recompute. */
  version: number
}

export function makePaintRef(): PaintRef {
  return { coarse: new Float32Array(CX * CY), layout: { pane: null }, version: 0 }
}

/** The reading the harness asserts on: the two meters for an arbitrary painting. */
export function paintReading(coarse: Float32Array): { fieldError: number; residual: number } {
  const spec = HELD_OUT_CASES[0]
  const fields = caseFor(spec)
  const g: Grid = fields.grid
  const star = new Float32Array(NX * NY)
  solveCG(g, star, fields.b, 1e-6, 4000)
  const p0 = new Float32Array(NX * NY)
  guessFrom(g, coarse, p0)
  return { fieldError: relFieldError(g, p0, star), residual: relResidual(g, p0, fields.b) }
}

/** The best painting there is: the answer's own 8 × 8 box averages. */
export function bestPainting(): Float32Array {
  const spec = HELD_OUT_CASES[0]
  const fields = caseFor(spec)
  const star = new Float32Array(NX * NY)
  solveCG(fields.grid, star, fields.b, 1e-6, 4000)
  const coarse = new Float32Array(CX * CY)
  restrict(star, coarse)
  return coarse
}

/** Prolong the blocks, then zero the frame and the solid — the same masking `propose` applies. */
function guessFrom(g: Grid, coarse: Float32Array, p0: Float32Array): void {
  prolong(coarse, p0)
  for (let j = 0; j < g.ny; j++) {
    for (let i = 0; i < g.nx; i++) {
      const k = i + j * g.nx
      if (i === 0 || j === 0 || i === g.nx - 1 || j === g.ny - 1 || g.solid[k]) p0[k] = 0
    }
  }
}

export function createPaintTheBulge(ref: PaintRef): Stepper {
  const spec = HELD_OUT_CASES[0]
  const fields = caseFor(spec)
  const g: Grid = fields.grid
  const star = new Float32Array(NX * NY)
  solveCG(g, star, fields.b, 1e-6, 4000)
  const pScale = maxAbs(g, star)
  const bScale = robustScale(g, fields.b)

  // A fresh stepper is a blank painting — Reset re-runs `create`.
  ref.coarse.fill(0)
  ref.version++

  const p0 = new Float32Array(NX * NY)
  const ap = new Float32Array(NX * NY)
  const res = new Float32Array(NX * NY)
  const painter = new FieldPainter()
  let seen = -1
  let fieldError = 1
  let residual = 1

  const recompute = () => {
    seen = ref.version
    guessFrom(g, ref.coarse, p0)
    applyLaplacian(g, p0, ap)
    for (let k = 0; k < res.length; k++) res[k] = g.solid[k] ? 0 : Math.abs(fields.b[k] - ap[k])
    fieldError = relFieldError(g, p0, star)
    residual = relResidual(g, p0, fields.b)
  }
  recompute()

  return {
    step() {
      if (ref.version !== seen) recompute()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 12
      const labelH = 16
      const meterH = 56
      const ph = Math.min(h - labelH - meterH, (((w - 2 * gap) / 3) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (3 * pw + 2 * gap)) / 2
      const panes: Pane[] = [0, 1, 2].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))
      ref.layout.pane = panes[0]

      painter.paint(ctx, panes[0], p0, 'pressure', pScale, fields.solid)
      // The block lattice, faint: the reader has to see what a block is to drag one.
      ctx.save()
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let ci = 1; ci < CX; ci++) {
        const x = panes[0].x + (ci * POOL * pw) / NX
        ctx.moveTo(x, panes[0].y)
        ctx.lineTo(x, panes[0].y + ph)
      }
      for (let cj = 1; cj < CY; cj++) {
        const y = panes[0].y + (cj * POOL * ph) / NY
        ctx.moveTo(panes[0].x, y)
        ctx.lineTo(panes[0].x + pw, y)
      }
      ctx.stroke()
      ctx.restore()
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], 'your guess — drag a block up or down')

      painter.paint(ctx, panes[1], res, 'divergence', bScale, fields.solid)
      paneBorder(ctx, panes[1], false)
      paneLabel(ctx, panes[1], 'what the meter hears  |b − A p₀|', PALETTE.div)

      painter.paint(ctx, panes[2], star, 'pressure', pScale, fields.solid)
      paneBorder(ctx, panes[2], false)
      paneLabel(ctx, panes[2], 'the answer')

      const l1 = labelH + ph + 19
      const l2 = l1 + 18
      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.pLo
      ctx.fillText(`${(fieldError * 100).toFixed(0)}% of the field still missing`, panes[0].x, l1)
      meter(ctx, panes[1].x, l1, `residual ${residual.toFixed(2)}`, residual > 1 ? PALETTE.div : INK)
      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('an empty grid scores 1.00', panes[1].x, l2)
      ctx.fillStyle = INK
      ctx.fillText('96 numbers, stretched to 96 × 64', panes[0].x, l2)
    },
  }
}

export function PaintTheBulge({ height = 240 }: { height?: number }) {
  const ref = useRef<PaintRef>(makePaintRef())
  const drag = useRef<{ k: number; y0: number; v0: number } | null>(null)
  // Drag range: half again the tallest block the answer itself needs, so the
  // reader can overshoot and watch the meter punish that too.
  const range = useRef<number | null>(null)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const r = ref.current
    const pane = r.layout.pane
    if (!pane) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (e.type === 'pointerdown') {
      if (x < pane.x || x > pane.x + pane.w || y < pane.y || y > pane.y + pane.h) return
      const ci = Math.min(CX - 1, Math.floor(((x - pane.x) / pane.w) * CX))
      const cj = Math.min(CY - 1, Math.floor(((y - pane.y) / pane.h) * CY))
      const k = ci + cj * CX
      range.current ??= 1.5 * Math.max(...Array.from(bestPainting(), Math.abs))
      drag.current = { k, y0: y, v0: r.coarse[k] }
      el.setPointerCapture?.(e.pointerId)
      return
    }
    if (e.type === 'pointerup' || e.type === 'pointercancel') {
      drag.current = null
      return
    }
    const d = drag.current
    if (!d || e.buttons === 0) return
    const rng = range.current ?? 1
    // Dragging the full height of the pane runs a block across its whole range.
    const v = d.v0 + ((d.y0 - y) / pane.h) * 2 * rng
    r.coarse[d.k] = Math.max(-rng, Math.min(rng, v))
    r.version++
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer} onPointerCancel={onPointer}>
      <Sim height={height} animated={false} create={() => lazyStepper(() => createPaintTheBulge(ref.current))} />
    </div>
  )
}
