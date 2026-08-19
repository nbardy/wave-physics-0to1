import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { clipPane, paneFrame, toPx, fmt, FONT_LABEL, FONT_METER, type Rect, type View } from '../lib/chrome'
import { PANE_GAP, figureHeight, isStacked, useCanvasWidth } from './layout'
import {
  makeRational,
  openUniformKnots,
  polygonal,
  radiusError,
  sampleCurve,
  type Curve,
  type Spline,
  type Vec2,
} from './spline'

// CAD C1 figure 3 — what the denominator buys.
//
// Both panes hold the same control points twice: once read by the polynomial
// basis, once by the rational one. Left, the two curves are the same stroke
// until a weight leaves 1, so the reader sees that a NURBS *contains* a
// B-spline rather than replacing it. Right is the payoff and the measurement:
// three control points, degree two, and the middle weight at √2/2 puts the
// rational curve on the unit circle to machine precision while the polynomial
// curve through the identical points misses by ~6e-2. Both errors are measured
// against ‖C(u)‖ = 1, live, at every frame.

const FREE: readonly Vec2[] = [
  [-1.5, -0.55],
  [-0.75, 0.8],
  [0.05, -0.55],
  [0.85, 0.85],
  [1.55, -0.25],
]
const FREE_DEGREE = 3
const FREE_VIEW: View = { cx: 0, cy: 0.1, half: 1.9 }
const CIRCLE_VIEW: View = { cx: 0.48, cy: 0.48, half: 0.78 }

export interface Shared {
  weights: number[]
  selected: number
  middle: number
}

export function freshWeightState(): Shared {
  return { weights: FREE.map(() => 1), selected: 2, middle: Math.SQRT1_2 }
}

const freeSpline: Spline = {
  points: FREE,
  degree: FREE_DEGREE,
  knots: openUniformKnots(FREE.length, FREE_DEGREE),
}

const CIRCLE_POINTS: readonly Vec2[] = [
  [1, 0],
  [1, 1],
  [0, 1],
]
const circleSpline: Spline = { points: CIRCLE_POINTS, degree: 2, knots: [0, 0, 0, 1, 1, 1] }

function stroke(ctx: CanvasRenderingContext2D, v: View, r: Rect, pts: readonly Vec2[]) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => {
    const [px, py] = toPx(v, r, x, y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()
}

/** Weight shown as size: a heavy control point is a fat one. */
function weightRadius(w: number): number {
  return Math.max(2.5, Math.min(11, 4.5 + 3 * Math.log2(w)))
}

function drawFree(ctx: CanvasRenderingContext2D, r: Rect, s: Shared) {
  const rational = makeRational(freeSpline, s.weights)
  ctx.save()
  clipPane(ctx, r)

  ctx.strokeStyle = 'rgba(217,119,6,0.3)'
  ctx.lineWidth = 1.4
  ctx.setLineDash([4, 4])
  stroke(ctx, FREE_VIEW, r, FREE)
  ctx.setLineDash([])

  // polynomial first, thick — the rational curve rides on it while w ≡ 1
  ctx.strokeStyle = PALETTE.ghost
  ctx.lineWidth = 5
  stroke(ctx, FREE_VIEW, r, sampleCurve(polygonal(freeSpline), 220))
  ctx.strokeStyle = PALETTE.curve
  ctx.lineWidth = 2.2
  stroke(ctx, FREE_VIEW, r, sampleCurve(rational, 220))

  FREE.forEach(([x, y], i) => {
    const [px, py] = toPx(FREE_VIEW, r, x, y)
    ctx.beginPath()
    ctx.arc(px, py, weightRadius(s.weights[i]), 0, Math.PI * 2)
    ctx.fillStyle = i === s.selected ? PALETTE.ctrl : 'rgba(217,119,6,0.5)'
    ctx.fill()
    if (i === s.selected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  })
  ctx.restore()
  paneFrame(ctx, r)

  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('same points, two bases', r.x + 8, r.y + 16)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.ctrl
  ctx.fillText(`w${s.selected} = ${fmt(s.weights[s.selected])}`, r.x + 8, r.y + r.h - 26)
  const spread = Math.max(...s.weights) - Math.min(...s.weights)
  ctx.fillStyle = spread < 1e-9 ? PALETTE.ghost : PALETTE.curve
  ctx.fillText(
    spread < 1e-9 ? 'all weights 1 — the curves are one stroke' : 'weights split the curves apart',
    r.x + 8,
    r.y + r.h - 8,
  )
}

function drawCircle(ctx: CanvasRenderingContext2D, r: Rect, s: Shared) {
  const rational: Curve = makeRational(circleSpline, [1, s.middle, 1])
  const poly = polygonal(circleSpline)
  ctx.save()
  clipPane(ctx, r)

  // the target: a true unit quarter circle, drawn from cos/sin
  const truth: Vec2[] = []
  for (let i = 0; i <= 120; i += 1) {
    const a = (i / 120) * (Math.PI / 2)
    truth.push([Math.cos(a), Math.sin(a)])
  }
  ctx.strokeStyle = PALETTE.ghost
  ctx.lineWidth = 6
  stroke(ctx, CIRCLE_VIEW, r, truth)

  ctx.strokeStyle = 'rgba(217,119,6,0.35)'
  ctx.lineWidth = 1.4
  ctx.setLineDash([4, 4])
  stroke(ctx, CIRCLE_VIEW, r, CIRCLE_POINTS)
  ctx.setLineDash([])

  ctx.strokeStyle = PALETTE.hole
  ctx.lineWidth = 1.8
  ctx.setLineDash([5, 4])
  stroke(ctx, CIRCLE_VIEW, r, sampleCurve(poly, 160))
  ctx.setLineDash([])

  ctx.strokeStyle = PALETTE.curve
  ctx.lineWidth = 2.2
  stroke(ctx, CIRCLE_VIEW, r, sampleCurve(rational, 220))

  CIRCLE_POINTS.forEach(([x, y], i) => {
    const [px, py] = toPx(CIRCLE_VIEW, r, x, y)
    ctx.beginPath()
    ctx.arc(px, py, weightRadius(i === 1 ? s.middle : 1), 0, Math.PI * 2)
    ctx.fillStyle = i === 1 ? PALETTE.ctrl : 'rgba(217,119,6,0.5)'
    ctx.fill()
  })
  ctx.restore()
  paneFrame(ctx, r)

  const eRat = radiusError(rational)
  const ePoly = radiusError(poly)
  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('the quarter circle', r.x + 8, r.y + 16)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.curve
  // ASCII hyphen, not U+2212 — the headless check's font has no glyph for the
  // true minus sign and renders it as a tofu box.
  ctx.fillText(`rational  max |‖C‖-1| = ${eRat.toExponential(1)}`, r.x + 8, r.y + r.h - 26)
  ctx.fillStyle = PALETTE.hole
  ctx.fillText(`polynomial            = ${ePoly.toExponential(1)}`, r.x + 8, r.y + r.h - 8)
}

export function createWeightPull(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      // The circle pane must stay square or the exact quarter circle stops
      // looking like one and the figure argues against itself. Everything else
      // gives way to that: side by side it is capped by the width it can spare,
      // stacked it is capped by the canvas width and centred under the curve.
      if (isStacked(w)) {
        const side = Math.min(w - 8, h * 0.52)
        const top: Rect = { x: 4, y: 4, w: w - 8, h: h - side - PANE_GAP - 8 }
        const bottom: Rect = { x: (w - side) / 2, y: top.y + top.h + PANE_GAP, w: side, h: side }
        drawFree(ctx, top, sharedRef.current)
        drawCircle(ctx, bottom, sharedRef.current)
        return
      }
      const side = Math.min(h - 8, w * 0.44)
      const right: Rect = { x: w - side - 4, y: 4, w: side, h: side }
      const left: Rect = { x: 4, y: 4, w: right.x - 16, h: h - 8 }
      drawFree(ctx, left, sharedRef.current)
      drawCircle(ctx, right, sharedRef.current)
    },
  }
}

export function WeightPull() {
  const sharedRef = useRef<Shared>(freshWeightState())
  const [wrapRef, canvasWidth] = useCanvasWidth()
  const [selected, setSelected] = useState(2)
  const [weight, setWeight] = useState(1)
  const [middle, setMiddle] = useState(Math.SQRT1_2)

  return (
    <div ref={wrapRef}>
      <Sim
        height={figureHeight(canvasWidth, 300, 560)}
        animated={false}
        create={() => createWeightPull(sharedRef)}
      >
        <label>
          point{' '}
          <select
            value={selected}
            onChange={(e) => {
              const i = Number(e.target.value)
              sharedRef.current.selected = i
              setSelected(i)
              setWeight(sharedRef.current.weights[i])
            }}
          >
            {FREE.map((_, i) => (
              <option key={i} value={i}>
                P{i}
              </option>
            ))}
          </select>
        </label>
        <label>
          w {weight.toFixed(2)}{' '}
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.01}
            value={weight}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.weights[sharedRef.current.selected] = v
              setWeight(v)
            }}
          />
        </label>
        <label>
          circle w₁ {middle.toFixed(4)}{' '}
          <input
            type="range"
            min={0.3}
            max={1.6}
            step={0.0001}
            value={middle}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.middle = v
              setMiddle(v)
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            sharedRef.current.middle = Math.SQRT1_2
            setMiddle(Math.SQRT1_2)
          }}
        >
          Snap w₁ to √2⁄2
        </button>
        <button
          type="button"
          onClick={() => {
            sharedRef.current.weights = FREE.map(() => 1)
            setWeight(1)
          }}
        >
          All weights 1
        </button>
      </Sim>
    </div>
  )
}
