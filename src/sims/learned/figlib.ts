// Shared drawing and caching for the learned-solver figures.
//
// Two rules this file exists to enforce:
//
//   1. Panes that are compared share a color scale. A cold-start pressure field
//      and a warm-start pressure field auto-scaled independently would look
//      equally converged at every moment, which is the exact opposite of what
//      the figures claim. Every paint call takes its scale explicitly.
//   2. Building a case runs the lesson-01 solver for ~200 steps (~0.5 s). Cases
//      are memoized per spec id, so the page pays that once per distinct case no
//      matter how many figures ask for it, and pays it lazily — on the first
//      step after the figure scrolls into view, not at mount.

import type { Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { buildCase, type CaseFields, type CaseSpec } from './cases'
import { NX, NY, solidFraction } from './net'
import type { FloatArr, Grid } from './poisson'

export interface Pane {
  x: number
  y: number
  w: number
  h: number
}

// ------------------------------------------------------------------ caching

const CASES = new Map<string, CaseFields>()
const SOLID_COARSE = new Map<string, Float32Array>()

/** The case, built on first ask and kept. Blocks for ~0.5 s exactly once. */
export function caseFor(spec: CaseSpec): CaseFields {
  const hit = CASES.get(spec.id)
  if (hit) return hit
  const built = buildCase(spec)
  CASES.set(spec.id, built)
  return built
}

export function solidCoarseFor(spec: CaseSpec, solid: Uint8Array): Float32Array {
  const hit = SOLID_COARSE.get(spec.id)
  if (hit) return hit
  const sc = new Float32Array((NX / 8) * (NY / 8))
  solidFraction(solid, sc)
  SOLID_COARSE.set(spec.id, sc)
  return sc
}

// ------------------------------------------------------------------ painting

function hexRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

const P_HI = hexRgb(PALETTE.pHi)
const P_LO = hexRgb(PALETTE.pLo)
const DIV = hexRgb(PALETTE.div)
const WALL = hexRgb(PALETTE.wall)
const PROP = hexRgb(PALETTE.dye)

/** `signed` ramps cyan→white→red about zero; `magnitude` ramps white→ink. */
export type FieldMode = 'pressure' | 'divergence' | 'proposal' | 'dye'

export class FieldPainter {
  private off: HTMLCanvasElement
  private octx: CanvasRenderingContext2D
  private img: ImageData

  constructor(
    private nx = NX,
    private ny = NY,
  ) {
    this.off = document.createElement('canvas')
    this.off.width = nx
    this.off.height = ny
    const octx = this.off.getContext('2d')
    if (!octx) throw new Error('no 2d context for the field painter')
    this.octx = octx
    // `octx.createImageData` rather than `new ImageData` — the headless figure
    // check has a canvas but no DOM globals, and this way the painter needs
    // exactly one shimmed function instead of two.
    this.img = octx.createImageData(nx, ny)
  }

  /**
   * Paint `f` into `r`. `scale` is the value that saturates the ramp — pass the
   * SAME scale to panes a reader is meant to compare.
   */
  paint(
    ctx: CanvasRenderingContext2D,
    r: Pane,
    f: FloatArr,
    mode: FieldMode,
    scale: number,
    solid: Uint8Array,
    smooth = true,
  ): void {
    const d = this.img.data
    const inv = scale === 0 ? 0 : 1 / scale
    for (let k = 0; k < this.nx * this.ny; k++) {
      const o = k * 4
      d[o + 3] = 255
      if (solid[k]) {
        d[o] = WALL[0]
        d[o + 1] = WALL[1]
        d[o + 2] = WALL[2]
        continue
      }
      const t = Math.max(-1, Math.min(1, f[k] * inv))
      if (mode === 'pressure') {
        const c = t >= 0 ? P_HI : P_LO
        const a = Math.abs(t)
        d[o] = 250 + (c[0] - 250) * a
        d[o + 1] = 250 + (c[1] - 250) * a
        d[o + 2] = 252 + (c[2] - 252) * a
      } else if (mode === 'dye') {
        // dye is amber, as everywhere in the series — and NEGATIVE dye, which
        // cannot exist, is violet: the same confession AdvectionSchemes wears
        // when a scheme invents impossible ink
        const c = t >= 0 ? PROP : DIV
        const a = Math.abs(t)
        d[o] = 250 + (c[0] - 250) * a
        d[o + 1] = 250 + (c[1] - 250) * a
        d[o + 2] = 252 + (c[2] - 252) * a
      } else {
        const c = mode === 'divergence' ? DIV : PROP
        const a = Math.abs(t)
        d[o] = 250 + (c[0] - 250) * a
        d[o + 1] = 250 + (c[1] - 250) * a
        d[o + 2] = 252 + (c[2] - 252) * a
      }
    }
    this.octx.putImageData(this.img, 0, 0)
    // The coarse pane draws blocky on purpose: 12×8 cells smoothed into a soft
    // gradient would hide exactly what the restriction threw away.
    ctx.imageSmoothingEnabled = smooth
    ctx.drawImage(this.off, r.x, r.y, r.w, r.h)
  }
}

// -------------------------------------------------------------------- chrome

/** A solid border means a classical operation; dashed means a learned proposal. */
export function paneBorder(ctx: CanvasRenderingContext2D, r: Pane, learned: boolean): void {
  ctx.save()
  ctx.lineWidth = learned ? 1.6 : 1
  ctx.strokeStyle = learned ? PALETTE.dye : 'rgba(120,140,170,0.55)'
  if (learned) ctx.setLineDash([5, 3])
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
  ctx.restore()
}

export function paneLabel(ctx: CanvasRenderingContext2D, r: Pane, text: string, color = INK): void {
  ctx.font = FONT_LABEL
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, r.x, r.y - 5)
}

export function meter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color = INK,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font = FONT_METER
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

/** The gate: a green bar when the residual is under tolerance, gray while it is not. */
export function gateChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: boolean,
  text: string,
): void {
  ctx.font = FONT_LABEL
  const w = ctx.measureText(text).width + 14
  ctx.fillStyle = open ? 'rgba(5,150,105,0.14)' : 'rgba(107,114,128,0.12)'
  ctx.beginPath()
  ctx.roundRect(x, y - 11, w, 16, 8)
  ctx.fill()
  ctx.fillStyle = open ? PALETTE.visc : PALETTE.wall
  ctx.textAlign = 'left'
  ctx.fillText(text, x + 7, y + 1)
}

/**
 * The value that should saturate a color ramp. NOT the maximum: divergence
 * fields have a handful of extreme cells hard against the obstacle, and scaling
 * to those washes the entire wake out to white — the figure then shows a gray
 * disc on a blank page and teaches nothing. The 98th percentile keeps the
 * structure visible and clips only the cells the reader was never reading.
 */
export function robustScale(g: Grid, f: FloatArr, q = 0.98): number {
  const vals: number[] = []
  for (let j = 1; j < g.ny - 1; j++) {
    for (let i = 1; i < g.nx - 1; i++) {
      const k = i + j * g.nx
      if (g.solid[k]) continue
      vals.push(Math.abs(f[k]))
    }
  }
  if (vals.length === 0) return 0
  vals.sort((a, b) => a - b)
  return vals[Math.min(vals.length - 1, Math.floor(q * vals.length))]
}

/** Residuals span 2.4 → 0.0009 in one figure; one format has to read at both ends. */
export function fmtRes(x: number): string {
  return x >= 0.01 ? x.toFixed(3) : x.toPrecision(2)
}

export function maxAbs(g: Grid, f: FloatArr): number {
  let m = 0
  for (let j = 1; j < g.ny - 1; j++) {
    for (let i = 1; i < g.nx - 1; i++) {
      const k = i + j * g.nx
      if (g.solid[k]) continue
      const a = Math.abs(f[k])
      if (a > m) m = a
    }
  }
  return m
}

/** ‖a − ref‖₂ / ‖ref‖₂ over updated cells — "what fraction of the answer is missing". */
export function relFieldError(g: Grid, a: FloatArr, ref: FloatArr): number {
  let num = 0
  let den = 0
  for (let j = 1; j < g.ny - 1; j++) {
    for (let i = 1; i < g.nx - 1; i++) {
      const k = i + j * g.nx
      if (g.solid[k]) continue
      num += (a[k] - ref[k]) ** 2
      den += ref[k] ** 2
    }
  }
  return den === 0 ? 0 : Math.sqrt(num / den)
}

/**
 * Defer a stepper's construction to its first step or draw.
 *
 * `<Sim>` builds every figure's stepper when the component mounts, but only
 * steps and draws the ones on screen. The figures in this lesson are unusually
 * expensive to construct — a case is 200 timesteps of the lesson-01 solver, and
 * several of them also want a converged reference solve — so building all nine
 * at mount froze the page for about four seconds before a word could be
 * scrolled. Wrapping the build in this defers it to the IntersectionObserver's
 * first frame, which is the moment the reader is actually looking.
 */
export function lazyStepper(build: () => Stepper): Stepper {
  let inner: Stepper | null = null
  const ensure = () => (inner ??= build())
  return {
    step: (dt) => ensure().step(dt),
    draw: (ctx, w, h) => ensure().draw(ctx, w, h),
    dispose: () => inner?.dispose?.(),
  }
}
