import { useRef, useState, type ReactElement } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import {
  brushField,
  canvasFrac,
  clockRow,
  drawAngleGraph,
  drawBase,
  drawClocks,
  laneSplit,
  type ClockRow,
  type Lane,
} from './lib/clocks'

// §6 — the connection tuner: the reader as inverse-solver (PLAN figs 26–33).
// One component, three figure configs on a typed mode prop:
//   'stage1' — the prankster's mangle comes from ONE fixed-shape bump (the §5
//              brush kernel); the rule A is the same bump with a single
//              amplitude slider — the figure's one knob.
//   'stage2' — the mangle stacks 2–3 strokes; A gets three draggable handles
//              (fat ≥44 px hit targets) with tap-select + ▲/▼ tap-steps —
//              the plan's flagged exception to the one-knob law.
//   'law'    — the compensating law: brush a fresh α over the repaired wave.
//              The brush writes gauge data ONLY: α gets the stroke and A gets
//              ∂α simultaneously (math #5 made literal, per the clock-kit
//              state contract), so the Dθ trace sits perfectly still and the
//              §5 energy meter rebuilt from Dθ holds still — the invariance
//              shown, not asserted.
//
// State contract (PLAN §Production): θ_phys(t) = Ω·t — a uniform rotation over
// a CALM scene (∂θ₀/∂x = 0, so the meter is plain RMS(Dθ)). θ_phys is exact
// kinematics; there is NO integrator anywhere in this figure, so, like the
// globe figure, it carries no stability-condition obligation. The needles draw
// at θ_phys; only the green zero-marks carry α; the plotted label is
// θ = θ_phys + α. "The tuner repairs the reading, not the labels" therefore
// holds by construction: no editor in this file can touch the raw θ trace —
// it keeps writhing (Ω·t sweeps it through the ±π wrap) while the read-through
// calms onto the ghost.
//
// Winnable BY CONSTRUCTION (the sim-inventory rule): A lives on the N−1 links,
// α on the N nodes, tied by one discrete pair used everywhere —
//   α = cumsum(A·dx)   and   Dθ = Δθ/dx − A.
// The target A* is drawn in the editor's own basis (stage1: the bump;
// stage2/law: Catmull-Rom through the same three knots) and α* = cumsum(A*·dx),
// so setting A = A* zeroes Dθ to float precision: no representability gap, no
// spatial-frequency cap. Win: RMS(Dθ) < 10% of its A = 0 value — and at A = 0,
// Dθ ≡ A* exactly, so the reference is RMS(A*). The calm meter is neutral
// ink — NOT green (α owns green from §5) and NOT violet (curvature does not
// first-appear until §8). There is no snap-to-answer button — the relief beat
// is the adjacent math #5 figure.

const N = 33 // clock fibers = graph nodes; links (A, Dθ) number N − 1
const DX = 1 / (N - 1)
const OMEGA = 1.1 // uniform needle rotation (rad/s) — keeps the raw trace writhing
const SIGMA = 0.08 // the §5 brush kernel width; one constant serves the
// winnability construction AND the touch kernel (PLAN §Feasibility)
const WIN_FRAC = 0.1 // the stated threshold: lock below 10% of the A = 0 residual
const UNLOCK_FRAC = 0.15 // hysteresis so the lock doesn't flicker at the line

const A1_MAX = 10 // stage-1 slider ceiling (rad per unit x)
const A2_MAX = 6 // stage-2 handle range
const KNOT_X = [0, 0.2, 0.5, 0.8, 1] // the editor's knots (ends pinned to 0)
const HANDLE_X = [0.2, 0.5, 0.8] // the three interior knots the reader drives
const HIT_R = 24 // handle hit radius in px — 48 px diameter, over the 44 px floor
const NUDGE = 0.25 // tap-step: one ▲/▼ press moves the selected handle this much

const BRUSH_GAIN = 2.0 // law: rad of α per full-width stroke — a visual gain, confessed
const TAP_AMP = 0.4 // law: rad added by one tap (the brush's tap-step equivalent)
const BRUSH_CAP = 0.8 // law: per-clock cap on the fresh α so every curve stays on stage
const C_ENERGY = 0.25 // law meter's c — cosmetic scale only; Dθ ≡ 0 keeps it at 1.00

const Y1 = A1_MAX * 1.15 // stage-1 A-pane range: covers A, and Dθ = A* − A worst case
const Y2 = A2_MAX * 1.3 // stage-2 A-pane range (drawLinkCurve clips to its lane)
const Y_LAW_A = 10 // law A-pane: |A| ≤ |A*| + max|∂α_brush| ≈ 3.6 + 6.1
const Y_LAW_OVER = 7 // law overlay: max|∂α_brush| = CAP·e^{−1/2}/σ ≈ 6.1

const INK = '#55606f' // neutral ink for the calm meter and Dθ
const INK_DARK = '#374151'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const linkFrac = (i: number) => (i + 0.5) * DX

/** ∂: node field → link field, the forward difference Δf/dx. */
function diffNodes(f: Float32Array, out: Float32Array): void {
  for (let i = 0; i < N - 1; i++) out[i] = (f[i + 1] - f[i]) / DX
}

/** ∫: link field → node field, cumsum(a·dx) — the exact inverse of diffNodes. */
function cumLinks(a: Float32Array, out: Float32Array): void {
  out[0] = 0
  for (let i = 0; i < N - 1; i++) out[i + 1] = out[i] + a[i] * DX
}

function rmsOf(v: Float32Array): number {
  let s = 0
  for (let i = 0; i < v.length; i++) s += v[i] * v[i]
  return Math.sqrt(s / v.length)
}

/** The §5 brush kernel shape, unit amplitude, centered on the row. */
function bumpAt(f: number): number {
  const d = f - 0.5
  return Math.exp(-(d * d) / (2 * SIGMA * SIGMA))
}

/**
 * Catmull-Rom through (KNOT_X, [0, y0, y1, y2, 0]), sampled at the link
 * midpoints — the stage-2/law editor basis. The target uses the SAME
 * evaluation, so matching the three knot values reproduces A* exactly.
 */
function catmullRom(ys3: ArrayLike<number>, out: Float32Array): void {
  const ys = [0, ys3[0], ys3[1], ys3[2], 0]
  for (let i = 0; i < out.length; i++) {
    const f = linkFrac(i)
    let k = 0
    while (k < 3 && f > KNOT_X[k + 1]) k++
    const u = (f - KNOT_X[k]) / (KNOT_X[k + 1] - KNOT_X[k])
    const p0 = ys[Math.max(k - 1, 0)]
    const p1 = ys[k]
    const p2 = ys[k + 1]
    const p3 = ys[Math.min(k + 2, 4)]
    const u2 = u * u
    const u3 = u2 * u
    out[i] =
      0.5 *
      (2 * p1 +
        (p2 - p0) * u +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
        (3 * p1 - p0 - 3 * p2 + p3) * u3)
  }
}

// ————— per-frame kinematics (shared by all three handlers) —————

interface Scratch {
  label: Float32Array // θ = θ_phys + α — the plotted label (nodes)
  negAlpha: Float32Array // zero-mark angles for drawClocks (needle stays at θ_phys)
  ghost: Float32Array // the pre-mangle wave: flat at θ_phys (the standing target)
  accA: Float32Array // cumsum(A·dx) — the accumulated transport (nodes)
  read: Float32Array // θ unwound by the transport rule: label − accA
  dtheta: Float32Array // Dθ = Δθ/dx − A on links — the number driven to zero
}

function makeScratch(): Scratch {
  return {
    label: new Float32Array(N),
    negAlpha: new Float32Array(N),
    ghost: new Float32Array(N),
    accA: new Float32Array(N),
    read: new Float32Array(N),
    dtheta: new Float32Array(N - 1),
  }
}

/** Fill the scratch buffers from (t, α, A) and return RMS(Dθ). */
function computeFrame(t: number, alpha: Float32Array, aLinks: Float32Array, s: Scratch): number {
  const base = OMEGA * t
  for (let i = 0; i < N; i++) {
    s.label[i] = base + alpha[i]
    s.negAlpha[i] = -alpha[i] // needle absolute angle = zeros + label = θ_phys
    s.ghost[i] = base
  }
  cumLinks(aLinks, s.accA)
  for (let i = 0; i < N; i++) s.read[i] = s.label[i] - s.accA[i]
  for (let i = 0; i < N - 1; i++) s.dtheta[i] = (s.label[i + 1] - s.label[i]) / DX - aLinks[i]
  return rmsOf(s.dtheta)
}

// ————— drawing helpers —————

function laneToY(lane: Lane, yMin: number, yMax: number): (v: number) => number {
  return (v) => lane.y1 - ((v - yMin) / (yMax - yMin)) * (lane.y1 - lane.y0)
}

interface LinkStyle {
  color: string
  yMin: number
  yMax: number
  width?: number
  dashed?: boolean
}

/** Plot a link field (N−1 values at link midpoints), clipped to its lane. */
function drawLinkCurve(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  row: ClockRow,
  values: ArrayLike<number>,
  style: LinkStyle,
): void {
  const toY = laneToY(lane, style.yMin, style.yMax)
  ctx.save()
  ctx.beginPath()
  ctx.rect(lane.x0 - 2, lane.y0 - 2, lane.x1 - lane.x0 + 4, lane.y1 - lane.y0 + 4)
  ctx.clip()
  if (style.yMin < 0 && style.yMax > 0) {
    ctx.strokeStyle = 'rgba(120,140,170,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(lane.x0, toY(0))
    ctx.lineTo(lane.x1, toY(0))
    ctx.stroke()
  }
  const x0 = row.cx[0]
  const span = row.cx[row.n - 1] - x0
  const m = values.length
  ctx.strokeStyle = style.color
  ctx.lineWidth = style.width ?? 2
  if (style.dashed) ctx.setLineDash([5, 4])
  ctx.beginPath()
  for (let i = 0; i < m; i++) {
    const x = x0 + ((i + 0.5) / m) * span
    const y = toY(values[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { text: string; color: string }[],
): void {
  ctx.font = '12px system-ui, sans-serif'
  let cx = x
  for (const it of items) {
    ctx.fillStyle = it.color
    ctx.fillText(it.text, cx, y)
    cx += ctx.measureText(it.text).width + 14
  }
}

/**
 * The calm meter: a small residual bar in neutral ink. Bar length is
 * RMS(Dθ) as a fraction of its A = 0 value (a confessed normalization — the
 * meter reads percent-of-initial, not radians); the tick marks the 10% win
 * line; below it the bar locks (gray → filled dark ink).
 */
function drawCalmMeter(
  ctx: CanvasRenderingContext2D,
  w: number,
  rms: number,
  rms0: number,
  locked: boolean,
): void {
  const bw = 110
  const bh = 11
  const x = w - 210
  const y = 8
  ctx.font = '12px system-ui, sans-serif'
  if (locked) {
    ctx.fillStyle = INK_DARK
    ctx.fillRect(x, y, bw, bh)
    ctx.fillText('calm — locked', x + bw + 8, y + bh - 1)
    return
  }
  ctx.strokeStyle = 'rgba(107,114,128,0.6)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, bw, bh)
  const frac = Math.min(rms / rms0, 1)
  ctx.fillStyle = 'rgba(107,114,128,0.5)'
  ctx.fillRect(x, y, bw * frac, bh)
  ctx.strokeStyle = INK_DARK
  ctx.beginPath()
  ctx.moveTo(x + bw * WIN_FRAC, y - 2)
  ctx.lineTo(x + bw * WIN_FRAC, y + bh + 2)
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.fillText(`RMS(Dθ) ${(frac * 100).toFixed(0)}%`, x + bw + 8, y + bh - 1)
}

/** Clocks pane + θ pane (raw label, ghost, read-through), shared by all modes. */
function drawClockAndTheta(
  ctx: CanvasRenderingContext2D,
  top: Lane,
  mid: Lane,
  row: ClockRow,
  s: Scratch,
): void {
  drawBase(ctx, row, top)
  drawClocks(ctx, row, s.label, { zeros: s.negAlpha })
  // raw label first (faded — the trace no editor here can move), then the
  // ghost target, then the read-through the reader is calming, on top
  drawAngleGraph(ctx, mid, row, s.label, 'rgba(217,119,6,0.38)')
  drawAngleGraph(ctx, mid, row, s.ghost, 'rgba(107,114,128,0.55)')
  drawAngleGraph(ctx, mid, row, s.read, PALETTE.theta)
  drawLegend(ctx, mid.x0 + 4, mid.y0 + 11, [
    { text: 'θ raw', color: 'rgba(217,119,6,0.55)' },
    { text: 'read through A', color: PALETTE.theta },
    { text: 'pre-mangle ghost', color: 'rgba(107,114,128,0.8)' },
  ])
}

function drawHint(ctx: CanvasRenderingContext2D, h: number, text: string): void {
  ctx.fillStyle = 'rgba(85,96,111,0.7)'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText(text, 12, h - 6)
}

// ————— stage 1: one bump, one amplitude slider —————

function createStage1(ampRef: { current: number }): Stepper {
  // The target in the editor's own basis: A* = a*·bump, a* inside the slider's
  // range — reachable by construction. Random per create(): Reset deals a new round.
  const aStarAmp = A1_MAX * (0.45 + 0.4 * Math.random())
  const basis = new Float32Array(N - 1)
  for (let i = 0; i < N - 1; i++) basis[i] = bumpAt(linkFrac(i))
  const aStar = new Float32Array(N - 1)
  for (let i = 0; i < N - 1; i++) aStar[i] = aStarAmp * basis[i]
  const alpha = new Float32Array(N)
  cumLinks(aStar, alpha) // the prankster's mangle: α* = ∫A* — already applied
  const aLinks = new Float32Array(N - 1)
  const s = makeScratch()
  const rms0 = rmsOf(aStar) // Dθ at A = 0 is exactly A*
  let locked = false
  let t = 0

  return {
    step(dt) {
      t += dt // exact kinematics θ_phys = Ω·t: RAF cadence cannot change the physics
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < N - 1; i++) aLinks[i] = ampRef.current * basis[i]
      const rms = computeFrame(t, alpha, aLinks, s)
      locked = rms < (locked ? UNLOCK_FRAC : WIN_FRAC) * rms0

      const [top, mid, bot] = laneSplit(w, h, [0.36, 0.32, 0.32])
      const row = clockRow(top, N)
      drawClockAndTheta(ctx, top, mid, row, s)
      drawLinkCurve(ctx, bot, row, aLinks, { color: PALETTE.conn, yMin: -Y1, yMax: Y1 })
      drawLinkCurve(ctx, bot, row, s.dtheta, { color: INK, yMin: -Y1, yMax: Y1, width: 1.5 })
      drawLegend(ctx, bot.x0 + 4, bot.y0 + 11, [
        { text: 'A(x) — your rule', color: PALETTE.conn },
        { text: 'Dθ — measured minus expected twist', color: INK },
      ])
      drawCalmMeter(ctx, w, rms, rms0, locked)
      drawHint(ctx, h, 'one slider: too little, still writhing — too much, over-corrected')
    },
  }
}

// ————— stage 2: three handles, tap-select + ▲/▼ tap-steps —————

interface PointerState {
  active: boolean
  fx: number
  fy: number
}

interface Stage2Refs {
  values: Float32Array // the three handle amplitudes (the editor's coefficients)
  sel: number // which handle the ▲/▼ tap-steps drive
  pointer: PointerState
}

function createStage2(refs: Stage2Refs): Stepper {
  // create() = fresh game: zero the reader's handles, re-deal the target
  refs.values.fill(0)
  refs.sel = 0
  const target = new Float32Array(3)
  for (let k = 0; k < 3; k++) {
    target[k] = (Math.random() < 0.5 ? -1 : 1) * A2_MAX * (0.35 + 0.55 * Math.random())
  }
  const aStar = new Float32Array(N - 1)
  catmullRom(target, aStar)
  const alpha = new Float32Array(N)
  cumLinks(aStar, alpha) // the stacked mangle, already applied
  const aLinks = new Float32Array(N - 1)
  const s = makeScratch()
  const rms0 = rmsOf(aStar)
  let locked = false
  let t = 0
  let prevActive = false
  let dragging = false
  let grabOffset = 0 // value − pointer-value at grab, so a tap-select never yanks the handle

  const handleXY = (row: ClockRow, bot: Lane, k: number): { hx: number; hy: number } => {
    const x0 = row.cx[0]
    const span = row.cx[row.n - 1] - x0
    return { hx: x0 + HANDLE_X[k] * span, hy: laneToY(bot, -Y2, Y2)(refs.values[k]) }
  }

  const applyPointer = (row: ClockRow, bot: Lane, w: number, h: number) => {
    const p = refs.pointer
    const py = p.fy * h
    const vAt = (yPx: number) => -Y2 + ((bot.y1 - yPx) / (bot.y1 - bot.y0)) * 2 * Y2
    if (p.active && !prevActive) {
      const px = p.fx * w
      for (let k = 0; k < 3; k++) {
        const { hx, hy } = handleXY(row, bot, k)
        if (Math.hypot(px - hx, py - hy) <= HIT_R) {
          refs.sel = k
          dragging = true
          grabOffset = refs.values[k] - vAt(py)
        }
      }
    }
    if (p.active && dragging) {
      refs.values[refs.sel] = clamp(vAt(py) + grabOffset, -A2_MAX, A2_MAX)
    }
    if (!p.active) dragging = false
    prevActive = p.active
  }

  return {
    step(dt) {
      t += dt
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, mid, bot] = laneSplit(w, h, [0.36, 0.32, 0.32])
      const row = clockRow(top, N)
      applyPointer(row, bot, w, h)
      catmullRom(refs.values, aLinks)
      const rms = computeFrame(t, alpha, aLinks, s)
      locked = rms < (locked ? UNLOCK_FRAC : WIN_FRAC) * rms0

      drawClockAndTheta(ctx, top, mid, row, s)
      drawLinkCurve(ctx, bot, row, aLinks, { color: PALETTE.conn, yMin: -Y2, yMax: Y2 })
      drawLinkCurve(ctx, bot, row, s.dtheta, { color: INK, yMin: -Y2, yMax: Y2, width: 1.5 })
      for (let k = 0; k < 3; k++) {
        const { hx, hy } = handleXY(row, bot, k)
        ctx.fillStyle = PALETTE.conn
        ctx.beginPath()
        ctx.arc(hx, hy, 7, 0, Math.PI * 2)
        ctx.fill()
        if (k === refs.sel) {
          ctx.strokeStyle = PALETTE.conn
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(hx, hy, 12, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      drawLegend(ctx, bot.x0 + 4, bot.y0 + 11, [
        { text: 'A(x) — three handles', color: PALETTE.conn },
        { text: 'Dθ', color: INK },
      ])
      drawCalmMeter(ctx, w, rms, rms0, locked)
      drawHint(ctx, h, 'drag a blue handle (or tap it, then ▲/▼) — three numbers to find')
    },
  }
}

// ————— law: brush a fresh α over the repaired wave — A absorbs it —————

interface BrushRefs {
  pointer: PointerState
}

function createLaw(refs: BrushRefs): Stepper {
  // Start REPAIRED: α = α*, A = A*, so Dθ ≡ 0 and the meter opens locked.
  const target = new Float32Array(3)
  for (let k = 0; k < 3; k++) {
    target[k] = (Math.random() < 0.5 ? -1 : 1) * A2_MAX * (0.3 + 0.3 * Math.random())
  }
  const aStar = new Float32Array(N - 1)
  catmullRom(target, aStar)
  const alphaStar = new Float32Array(N)
  cumLinks(aStar, alphaStar)

  const alphaBrush = new Float32Array(N) // the reader's fresh strokes only
  const alpha = new Float32Array(N)
  const aLinks = new Float32Array(N - 1)
  const dBrush = new Float32Array(N - 1) // ∂α of the brush, for the overlay
  const shift = new Float32Array(N - 1) // A − A*: what A absorbed
  const s = makeScratch()
  const rms0 = rmsOf(aStar) // the meter's 100% reference: what A = 0 would read
  let locked = false
  let t = 0
  let prevActive = false
  let lastFx = 0
  let downFx = 0
  let moved = false

  // Pointer → brush, applied in draw (the geometry lives there). A horizontal
  // stroke paints α at the pointer's x (drag right = raise, left = lower); a
  // tap places one fixed bump — the brush's tap-step equivalent.
  const applyBrush = (row: ClockRow, w: number) => {
    const p = refs.pointer
    const x0 = row.cx[0]
    const span = row.cx[row.n - 1] - x0
    const toF = (fx: number) => clamp((fx * w - x0) / span, 0, 1)
    if (p.active && !prevActive) {
      downFx = p.fx
      moved = false
    }
    if (p.active && prevActive) {
      const dAmp = (p.fx - lastFx) * BRUSH_GAIN
      if (dAmp !== 0) brushField(alphaBrush, toF(p.fx), dAmp, SIGMA)
      if (Math.abs(p.fx - downFx) > 0.015) moved = true
    }
    if (!p.active && prevActive && !moved) brushField(alphaBrush, toF(lastFx), TAP_AMP, SIGMA)
    prevActive = p.active
    lastFx = p.fx
    for (let i = 0; i < N; i++) alphaBrush[i] = clamp(alphaBrush[i], -BRUSH_CAP, BRUSH_CAP)
    // THE COMPENSATING LAW, enforced (clock-kit contract): the brush writes
    // gauge data only — α gets the stroke and A gets ∂(stroke), recomputed
    // from the same recorded strokes each frame. The overlay's stroke-for-
    // stroke match is therefore BY CONSTRUCTION — the figure's claim is what
    // enforcing math #5 does to Dθ and the meter, not a discovered fit.
    diffNodes(alphaBrush, dBrush)
    for (let i = 0; i < N; i++) alpha[i] = alphaStar[i] + alphaBrush[i]
    for (let i = 0; i < N - 1; i++) {
      aLinks[i] = aStar[i] + dBrush[i]
      shift[i] = aLinks[i] - aStar[i]
    }
  }

  return {
    step(dt) {
      t += dt
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, mid, aPane, over] = laneSplit(w, h, [0.3, 0.25, 0.25, 0.2])
      const row = clockRow(top, N)
      applyBrush(row, w)
      const rms = computeFrame(t, alpha, aLinks, s)
      locked = rms < (locked ? UNLOCK_FRAC : WIN_FRAC) * rms0

      drawClockAndTheta(ctx, top, mid, row, s)
      drawLinkCurve(ctx, aPane, row, aLinks, { color: PALETTE.conn, yMin: -Y_LAW_A, yMax: Y_LAW_A })
      drawLinkCurve(ctx, aPane, row, s.dtheta, {
        color: INK,
        yMin: -Y_LAW_A,
        yMax: Y_LAW_A,
        width: 1.5,
      })
      drawLegend(ctx, aPane.x0 + 4, aPane.y0 + 11, [
        { text: 'A(x) — absorbing your brush', color: PALETTE.conn },
        { text: 'Dθ — sits still', color: INK },
      ])
      drawLinkCurve(ctx, over, row, shift, {
        color: PALETTE.conn,
        yMin: -Y_LAW_OVER,
        yMax: Y_LAW_OVER,
      })
      drawLinkCurve(ctx, over, row, dBrush, {
        color: PALETTE.gauge,
        yMin: -Y_LAW_OVER,
        yMax: Y_LAW_OVER,
        dashed: true,
      })
      drawLegend(ctx, over.x0 + 4, over.y0 + 11, [
        { text: 'shift in A', color: PALETTE.conn },
        { text: '∂α of your brush', color: PALETTE.gauge },
      ])

      // §5's formula-meter, rebuilt with D in place of ∂ (the "Recall that…"
      // beat): mean(Ω² + c²·Dθ²)/Ω², normalized so calm reads 1.00. Dθ ≡ 0
      // under any brush here, so the meter that lied in §5 now holds still.
      let acc = 0
      for (let i = 0; i < N - 1; i++) {
        acc += OMEGA * OMEGA + C_ENERGY * C_ENERGY * s.dtheta[i] * s.dtheta[i]
      }
      const e = acc / ((N - 1) * OMEGA * OMEGA)
      ctx.fillStyle = INK
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(`energy meter, rebuilt from Dθ: ${e.toFixed(2)}`, 12, 20)

      drawCalmMeter(ctx, w, rms, rms0, locked)
      drawHint(ctx, h, 'stroke sideways across the clocks (or tap) to brush a fresh α')
    },
  }
}

// ————— the React shell: one thin dispatch, one view per mode —————

export type TunerMode = 'stage1' | 'stage2' | 'law'

function TunerStage1(): ReactElement {
  const [amp, setAmp] = useState(0)
  // mirror the slider into a ref the running stepper reads (house pattern)
  const ampRef = useRef(amp)
  ampRef.current = amp
  return (
    <Sim
      height={330}
      create={() => createStage1(ampRef)}
      caption="Tune A against the prankster's stroke: the read-through calms onto the ghost while raw θ keeps writhing."
    >
      <label className="sim-slider">
        <span>A = 0</span>
        <input
          type="range"
          min={0}
          max={A1_MAX}
          step={0.05}
          value={amp}
          onChange={(e) => setAmp(Number(e.target.value))}
        />
        <span>too much</span>
      </label>
    </Sim>
  )
}

function TunerStage2(): ReactElement {
  const refs = useRef<Stage2Refs>({
    values: new Float32Array(3),
    sel: 0,
    pointer: { active: false, fx: 0, fy: 0 },
  })
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const f = canvasFrac(e)
    if (!f) return
    refs.current.pointer = { active: e.buttons > 0, fx: f.fx, fy: f.fy }
  }
  const release = () => {
    refs.current.pointer = { ...refs.current.pointer, active: false }
  }
  const nudge = (dir: 1 | -1) => {
    const r = refs.current
    r.values[r.sel] = clamp(r.values[r.sel] + dir * NUDGE, -A2_MAX, A2_MAX)
  }
  return (
    <div
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      onPointerCancel={release}
      onPointerLeave={release}
      style={{ touchAction: 'none' }}
    >
      <Sim
        height={350}
        create={() => createStage2(refs.current)}
        caption="Three handles now — after some trial and error you may get pretty close."
      >
        <span style={{ fontSize: 13, color: INK }}>tap a handle, then</span>
        <button type="button" aria-label="nudge the selected handle down" onClick={() => nudge(-1)}>
          ▼
        </button>
        <button type="button" aria-label="nudge the selected handle up" onClick={() => nudge(1)}>
          ▲
        </button>
      </Sim>
    </div>
  )
}

function TunerLaw(): ReactElement {
  const refs = useRef<BrushRefs>({ pointer: { active: false, fx: 0, fy: 0 } })
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const f = canvasFrac(e)
    if (!f) return
    refs.current.pointer = { active: e.buttons > 0, fx: f.fx, fy: f.fy }
  }
  const release = () => {
    refs.current.pointer = { ...refs.current.pointer, active: false }
  }
  return (
    <div
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      onPointerCancel={release}
      onPointerLeave={release}
      style={{ touchAction: 'none' }}
    >
      <Sim
        height={400}
        create={() => createLaw(refs.current)}
        caption="Brush a fresh α over the repaired wave: A absorbs it stroke for stroke, and Dθ never moves."
      />
    </div>
  )
}

const VIEWS: Record<TunerMode, () => ReactElement> = {
  stage1: TunerStage1,
  stage2: TunerStage2,
  law: TunerLaw,
}

export function ConnectionTuner({ mode }: { mode: TunerMode }): ReactElement {
  const View = VIEWS[mode]
  return <View />
}
