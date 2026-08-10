// Shared kit for the maths-01 figures (articles/maths/01-jacobian-hessian/PLAN.md).
// Everything here is closed-form: maps carry their analytic Jacobians, the
// landscape carries its analytic gradient and Hessian. No PDE is integrated
// anywhere in this article — honesty lives in the formulas being exact.

import { PALETTE } from '../lib/palette'
import { toPx, niceStep, type Rect, type View } from '../lib/chrome'

// ---------------------------------------------------------------------------
// Maps of the plane, each with its exact Jacobian.
// Row-major 2×2: [a, b, c, d] means  [∂f₁/∂x  ∂f₁/∂y ; ∂f₂/∂x  ∂f₂/∂y].
// ---------------------------------------------------------------------------

export type Mat2 = [number, number, number, number]

export interface Map2 {
  f(x: number, y: number): [number, number]
  jac(x: number, y: number): Mat2
}

export function det2(m: Mat2): number {
  return m[0] * m[3] - m[1] * m[2]
}

export const identityMap: Map2 = {
  f: (x, y) => [x, y],
  jac: () => [1, 0, 0, 1],
}

export function rotateMap(angle: number): Map2 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    f: (x, y) => [c * x - s * y, s * x + c * y],
    jac: () => [c, -s, s, c],
  }
}

export function shearMap(k: number): Map2 {
  return {
    f: (x, y) => [x + k * y, y],
    jac: () => [1, k, 0, 1],
  }
}

/**
 * The swirl: rotate each point about the origin by θ(r) = k·exp(−r²/σ²).
 * In polar it is (r, φ) ↦ (r, φ + θ(r)), which preserves the area element
 * r·dr·dφ — so det J = 1 identically. It is also the time-k flow map of the
 * divergence-free velocity field u = θ′-swirl, which the coda confesses.
 */
export function swirlMap(k: number, sigma = 0.75): Map2 {
  const s2 = sigma * sigma
  const theta = (r2: number) => k * Math.exp(-r2 / s2)
  return {
    f(x, y) {
      const a = theta(x * x + y * y)
      const c = Math.cos(a)
      const s = Math.sin(a)
      return [c * x - s * y, s * x + c * y]
    },
    jac(x, y) {
      const r2 = x * x + y * y
      const a = theta(r2)
      const c = Math.cos(a)
      const s = Math.sin(a)
      // da/dx = θ′(r²)·2x with θ′(r²) = −θ/σ² ; likewise for y.
      const dadx = (-a / s2) * 2 * x
      const dady = (-a / s2) * 2 * y
      const u = -s * x - c * y // ∂/∂a of first component
      const v = c * x - s * y //  ∂/∂a of second component
      return [c + u * dadx, -s + u * dady, s + v * dadx, c + v * dady]
    },
  }
}

/**
 * The fold: x ↦ x − s·sin(πx)/π, y untouched. det J = 1 − s·cos(πx), so the
 * slider s drives det at the origin linearly through zero: 1 − s. Past s = 1
 * the map folds the middle of the plane over itself.
 */
export function foldMap(s: number): Map2 {
  return {
    f: (x, y) => [x - (s * Math.sin(Math.PI * x)) / Math.PI, y],
    jac: (x) => [1 - s * Math.cos(Math.PI * x), 0, 0, 1],
  }
}

// ---------------------------------------------------------------------------
// The landscape: a rotated, ANISOTROPIC separable cubic with four clean
// critical points. g(u,v) = u³/3 − u + VSCALE·(v³/3 − v) in coordinates (u,v)
// rotated by BETA from world (x,y). Critical points at u,v = ±1 regardless of
// VSCALE: one pit, one peak, two passes. The rotation forces honest
// off-diagonal Hessian entries; the anisotropy (λ magnitudes 2.0 vs 0.9)
// makes the level sets true ellipses whose tilt the eigen-axes must earn —
// with VSCALE = 1 the pit is a perfect circle and the axes are degenerate
// (caught by the 2026-07-30 reader pass; don't reintroduce).
// ---------------------------------------------------------------------------

export const BETA = (25 * Math.PI) / 180
const CB = Math.cos(BETA)
const SB = Math.sin(BETA)
const VSCALE = 0.45

function toInternal(x: number, y: number): [number, number] {
  return [CB * x + SB * y, -SB * x + CB * y]
}
function toWorld(u: number, v: number): [number, number] {
  return [CB * u - SB * v, SB * u + CB * v]
}

export function landF(x: number, y: number): number {
  const [u, v] = toInternal(x, y)
  return (u * u * u) / 3 - u + VSCALE * ((v * v * v) / 3 - v)
}

export function landGrad(x: number, y: number): [number, number] {
  const [u, v] = toInternal(x, y)
  const gu = u * u - 1
  const gv = VSCALE * (v * v - 1)
  // ∇f = Rᵀ∇g with R the world→internal rotation
  return [CB * gu - SB * gv, SB * gu + CB * gv]
}

export function landHess(x: number, y: number): Mat2 {
  const [u, v] = toInternal(x, y)
  const hu = 2 * u
  const hv = VSCALE * 2 * v
  // H = Rᵀ · diag(hu, hv) · R
  return [
    CB * CB * hu + SB * SB * hv,
    CB * SB * (hu - hv),
    CB * SB * (hu - hv),
    SB * SB * hu + CB * CB * hv,
  ]
}

/** The three critical points the article visits, in world coordinates. */
export const CRITICAL = {
  pit: toWorld(1, 1), //  λ = (+2.0, +0.9)
  peak: toWorld(-1, -1), // λ = (−2.0, −0.9)
  pass: toWorld(1, -1), // λ = (+2.0, −0.9)
  pass2: toWorld(-1, 1), // the twin pass — λ = (−2.0, +0.9)
} as const
export type CriticalKind = keyof typeof CRITICAL

/** Eigen-decomposition of a symmetric 2×2 (closed form, no iteration). */
export function eigSym(m: Mat2): { l1: number; l2: number; v1: [number, number]; v2: [number, number] } {
  const [a, b, , d] = m
  const tr = a + d
  const diff = a - d
  const disc = Math.sqrt(diff * diff + 4 * b * b)
  const l1 = (tr + disc) / 2
  const l2 = (tr - disc) / 2
  // eigenvector for l1: (b, l1 − a) unless b ≈ 0 (already diagonal)
  let v1: [number, number] = Math.abs(b) > 1e-9 ? [b, l1 - a] : a >= d ? [1, 0] : [0, 1]
  const n = Math.hypot(v1[0], v1[1])
  v1 = [v1[0] / n, v1[1] / n]
  const v2: [number, number] = [-v1[1], v1[0]]
  return { l1, l2, v1, v2 }
}

// ---------------------------------------------------------------------------
// Views and drawing helpers. A View is a square world window rendered into a
// pixel rectangle; all figures share it so panes stay comparable.
// ---------------------------------------------------------------------------

// The pane vocabulary now lives in `sims/lib/chrome.ts` — shared with the
// physics track. Re-exported here so every maths figure's imports stay put.
export {
  toPx,
  fromPx,
  paneFrame,
  clipPane,
  niceStep,
  drawArrow,
  INK,
  FONT_METER,
  FONT_LABEL,
  fmt,
} from '../lib/chrome'
export type { Rect, View } from '../lib/chrome'

/**
 * Draw the image under `map` of the domain grid lines covering the window
 * centered at (cx0, cy0) — each line sampled finely so curvature shows.
 * With map = identity this draws a plain square grid.
 *
 * `baseStep` is how a loupe pane stays honest with its overview pane: pass the
 * OVERVIEW's grid step and this pane draws that same family (same absolute
 * lines, heavier weight) plus power-of-two subdivisions of it down to the
 * zoom-appropriate density (lighter weight). Without it, each pane picks its
 * own niceStep and the two panes draw DIFFERENT line families — a probe
 * sitting on a grid line in the overview then sits between lines in the
 * loupe, which reads as the loupe looking at some other place entirely
 * (found by Nick, 2026-08-03, on the WarpLoupe hero).
 */
export function drawGridImage(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  view: View,
  map: Map2,
  domCx: number,
  domCy: number,
  domHalf: number,
  color = 'rgba(37,99,235,0.5)',
  emphasizeAxes = false,
  baseStep?: number,
) {
  const fine = niceStep(domHalf)
  let h = fine
  if (baseStep !== undefined) {
    const k = Math.max(0, Math.ceil(Math.log2(baseStep / fine)))
    h = baseStep / Math.pow(2, k)
  }
  const lo = -Math.ceil((domHalf * 1.6) / h)
  const hiN = -lo
  const S = 48
  ctx.strokeStyle = color
  const x0 = Math.round(domCx / h) * h
  const y0 = Math.round(domCy / h) * h
  const isBase = (v: number) =>
    baseStep === undefined || Math.abs(v / baseStep - Math.round(v / baseStep)) < 1e-6
  const weight = (v: number) => {
    if (emphasizeAxes && Math.abs(v) < h / 2) return 1.8
    return isBase(v) ? 1 : 0.55
  }
  for (let i = lo; i <= hiN; i++) {
    // vertical domain line x = x0 + i·h
    const xv = x0 + i * h
    ctx.beginPath()
    ctx.lineWidth = weight(xv)
    for (let j = 0; j <= S; j++) {
      const t = domCy - domHalf * 1.6 + ((j / S) * domHalf * 3.2)
      const [X, Y] = map.f(xv, t)
      const [px, py] = toPx(view, r, X, Y)
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    // horizontal domain line y = y0 + i·h
    const yv = y0 + i * h
    ctx.beginPath()
    ctx.lineWidth = weight(yv)
    for (let j = 0; j <= S; j++) {
      const t = domCx - domHalf * 1.6 + ((j / S) * domHalf * 3.2)
      const [X, Y] = map.f(t, yv)
      const [px, py] = toPx(view, r, X, Y)
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
}

/** The stamp: a square of side `side` at (cx, cy), pushed through `map`; its
 * orientation dot rides the north-east corner. Filled translucent amber. */
export function drawStampImage(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  view: View,
  map: Map2,
  cx: number,
  cy: number,
  side: number,
  opts: { fill?: string; stroke?: string; dot?: boolean } = {},
) {
  const s = side / 2
  const corners: Array<[number, number]> = [
    [cx - s, cy - s],
    [cx + s, cy - s],
    [cx + s, cy + s],
    [cx - s, cy + s],
  ]
  const S = 12
  ctx.beginPath()
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e]
    const [bx, by] = corners[(e + 1) % 4]
    for (let j = 0; j <= S; j++) {
      const t = j / S
      const [X, Y] = map.f(ax + (bx - ax) * t, ay + (by - ay) * t)
      const [px, py] = toPx(view, r, X, Y)
      if (e === 0 && j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fillStyle = opts.fill ?? 'rgba(217,119,6,0.18)'
  ctx.fill()
  ctx.strokeStyle = opts.stroke ?? PALETTE.stamp
  ctx.lineWidth = 1.8
  ctx.stroke()
  if (opts.dot !== false) {
    // ON the north-east corner — the prose says "a dot on one corner", and at
    // the old 0.62 offset it floated in the interior, reading as a misplaced
    // center dot rather than a chirality marker (flagged by Nick, 2026-08-05)
    const [X, Y] = map.f(cx + s, cy + s)
    const [px, py] = toPx(view, r, X, Y)
    ctx.beginPath()
    ctx.arc(px, py, 3.4, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.stamp
    ctx.fill()
  }
}

/** Signed area ratio of the stamp's image to the stamp — the receipt the
 * article reads. Shoelace over the sampled boundary, so it is a measurement
 * of the picture, not a restatement of the formula. */
export function stampAreaRatio(map: Map2, cx: number, cy: number, side: number): number {
  const s = side / 2
  const corners: Array<[number, number]> = [
    [cx - s, cy - s],
    [cx + s, cy - s],
    [cx + s, cy + s],
    [cx - s, cy + s],
  ]
  const pts: Array<[number, number]> = []
  const S = 16
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e]
    const [bx, by] = corners[(e + 1) % 4]
    for (let j = 0; j < S; j++) {
      const t = j / S
      pts.push(map.f(ax + (bx - ax) * t, ay + (by - ay) * t))
    }
  }
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2 / (side * side)
}

