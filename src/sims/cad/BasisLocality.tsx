import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  clipPane,
  paneFrame,
  toPx,
  fromPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type Rect,
  type View,
} from '../lib/chrome'
import { PANE_GAP, figureHeight, isStacked, useCanvasWidth } from './layout'
import {
  basisValues,
  evaluate,
  openUniformKnots,
  polygonal,
  sampleCurve,
  type Spline,
  type Vec2,
} from './spline'

// CAD C1 figure 1 — the locality claim, shown rather than asserted.
//
// Left: the curve and its control polygon. Right: every basis function over the
// parameter domain. The selected control point and its basis function are the
// same amber, and the shaded band is that function's support — the only stretch
// of parameter where the point has any vote at all. Drag it and the ghost of the
// curve before you touched it stays behind: outside the band, ghost and curve
// coincide exactly, which is what "compact support" means in the only place the
// reader cares about it.

// Ten control points, not the six a shape this simple needs. With too few, the
// middle basis function's support is the entire domain — the locality the figure
// exists to show would be true and invisible.
const HOME: readonly Vec2[] = [
  [-1.75, -0.35],
  [-1.4, 0.7],
  [-1.0, -0.75],
  [-0.55, 0.8],
  [-0.1, -0.7],
  [0.35, 0.85],
  [0.8, -0.6],
  [1.25, 0.75],
  [1.6, -0.4],
  [1.9, 0.3],
]

const VIEW: View = { cx: 0.075, cy: 0, half: 1.95 }
const SAMPLES = 240

export interface Shared {
  points: Vec2[]
  degree: number
  u: number
  selected: number
  drag: number | null
}

/** The figure's opening state — exported so the headless check starts where a reader does. */
export function freshBasisState(): Shared {
  return { points: HOME.map((p) => [...p] as Vec2), degree: 3, u: 0.42, selected: 5, drag: null }
}

function panes(w: number, h: number): { curve: Rect; basis: Rect } {
  // Stacked, the curve keeps the larger share: it is the pane the reader drags
  // in, and the basis plot stays legible at a shorter height than the curve does.
  if (isStacked(w)) {
    const ch = (h - PANE_GAP - 8) * 0.54
    return {
      curve: { x: 4, y: 4, w: w - 8, h: ch },
      basis: { x: 4, y: 4 + ch + PANE_GAP, w: w - 8, h: h - ch - PANE_GAP - 8 },
    }
  }
  const cw = (w - PANE_GAP - 8) * 0.56
  return {
    curve: { x: 4, y: 4, w: cw, h: h - 8 },
    basis: { x: 4 + cw + PANE_GAP, y: 4, w: w - cw - PANE_GAP - 8, h: h - 8 },
  }
}

function splineOf(points: readonly Vec2[], degree: number): Spline {
  return { points, degree, knots: openUniformKnots(points.length, degree) }
}

/** [start, end] of the parameter interval where basis function `i` is nonzero. */
function support(spline: Spline, i: number): [number, number] {
  return [spline.knots[i], spline.knots[i + spline.degree + 1]]
}

function drawCurvePane(ctx: CanvasRenderingContext2D, r: Rect, s: Shared) {
  const spline = splineOf(s.points, s.degree)
  const home = splineOf(HOME, s.degree)
  const [u0, u1] = support(spline, s.selected)

  ctx.save()
  clipPane(ctx, r)

  // the untouched curve, so a drag shows exactly which stretch answered
  const ghost = sampleCurve(polygonal(home), SAMPLES)
  ctx.strokeStyle = PALETTE.ghost
  ctx.lineWidth = 4
  ctx.beginPath()
  ghost.forEach(([x, y], i) => {
    const [px, py] = toPx(VIEW, r, x, y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()

  // control polygon
  ctx.strokeStyle = 'rgba(217,119,6,0.35)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  s.points.forEach(([x, y], i) => {
    const [px, py] = toPx(VIEW, r, x, y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()
  ctx.setLineDash([])

  // the live curve — amber over the selected point's support, blue elsewhere
  const live = sampleCurve(polygonal(spline), SAMPLES)
  ctx.lineWidth = 2.5
  for (let i = 0; i < SAMPLES; i += 1) {
    const um = (i + 0.5) / SAMPLES
    ctx.strokeStyle = um >= u0 && um <= u1 ? PALETTE.ctrl : PALETTE.curve
    const [ax, ay] = toPx(VIEW, r, live[i][0], live[i][1])
    const [bx, by] = toPx(VIEW, r, live[i + 1][0], live[i + 1][1])
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }

  // control points
  s.points.forEach(([x, y], i) => {
    const [px, py] = toPx(VIEW, r, x, y)
    ctx.beginPath()
    ctx.arc(px, py, i === s.selected ? 6.5 : 4.5, 0, Math.PI * 2)
    ctx.fillStyle = i === s.selected ? PALETTE.ctrl : 'rgba(217,119,6,0.5)'
    ctx.fill()
    if (i === s.selected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  })

  // the point being evaluated
  const at = evaluate(polygonal(spline), s.u).point
  const [ex, ey] = toPx(VIEW, r, at[0], at[1])
  ctx.beginPath()
  ctx.arc(ex, ey, 5, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.curve
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
  paneFrame(ctx, r)

  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('curve · drag any control point', r.x + 8, r.y + 16)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.ctrl
  ctx.fillText(`P${s.selected} votes on u ∈ [${fmt(u0)}, ${fmt(u1)}]`, r.x + 8, r.y + r.h - 10)
}

function drawBasisPane(ctx: CanvasRenderingContext2D, r: Rect, s: Shared) {
  const spline = splineOf(s.points, s.degree)
  const n = s.points.length
  const [u0, u1] = support(spline, s.selected)
  // the baseline sits high enough that stacked knot ticks clear the meters below
  const plot: Rect = { x: r.x + 26, y: r.y + 26, w: r.w - 36, h: r.h - 74 }
  const px = (u: number) => plot.x + u * plot.w
  const py = (v: number) => plot.y + plot.h - v * plot.h

  ctx.save()
  clipPane(ctx, r)

  // the selected function's support, as a band
  ctx.fillStyle = 'rgba(217,119,6,0.12)'
  ctx.fillRect(px(u0), plot.y, px(u1) - px(u0), plot.h)

  // knots — where the polynomial pieces join. Faint full-height guides, plus a
  // solid tick per knot on the axis, stacked so multiplicity reads as height.
  ctx.strokeStyle = 'rgba(5,150,105,0.4)'
  ctx.lineWidth = 1
  for (const k of spline.knots) {
    ctx.beginPath()
    ctx.moveTo(px(k), plot.y)
    ctx.lineTo(px(k), plot.y + plot.h)
    ctx.stroke()
  }
  const stacked = new Map<string, number>()
  ctx.strokeStyle = PALETTE.knot
  ctx.lineWidth = 2
  for (const k of spline.knots) {
    const tag = k.toFixed(6)
    const level = stacked.get(tag) ?? 0
    stacked.set(tag, level + 1)
    ctx.beginPath()
    ctx.moveTo(px(k), plot.y + plot.h)
    ctx.lineTo(px(k), plot.y + plot.h + 4 + level * 4)
    ctx.stroke()
  }

  // axes
  ctx.strokeStyle = 'rgba(120,140,170,0.5)'
  ctx.beginPath()
  ctx.moveTo(plot.x, plot.y)
  ctx.lineTo(plot.x, plot.y + plot.h)
  ctx.lineTo(plot.x + plot.w, plot.y + plot.h)
  ctx.stroke()

  // every basis function
  for (let i = 0; i < n; i += 1) {
    ctx.beginPath()
    for (let t = 0; t <= 200; t += 1) {
      const u = t / 200
      const v = basisValues(n, s.degree, spline.knots, u)[i]
      const X = px(u)
      const Y = py(v)
      if (t === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    }
    ctx.strokeStyle = i === s.selected ? PALETTE.ctrl : 'rgba(124,58,237,0.45)'
    ctx.lineWidth = i === s.selected ? 2.5 : 1.4
    ctx.stroke()
  }

  // the evaluation line, and a dot on every function that is awake there
  const here = basisValues(n, s.degree, spline.knots, s.u)
  ctx.strokeStyle = 'rgba(37,99,235,0.7)'
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(px(s.u), plot.y)
  ctx.lineTo(px(s.u), plot.y + plot.h)
  ctx.stroke()
  ctx.setLineDash([])
  let awake = 0
  let total = 0
  for (let i = 0; i < n; i += 1) {
    total += here[i]
    if (here[i] < 1e-9) continue
    awake += 1
    ctx.beginPath()
    ctx.arc(px(s.u), py(here[i]), 3.5, 0, Math.PI * 2)
    ctx.fillStyle = i === s.selected ? PALETTE.ctrl : PALETTE.basis
    ctx.fill()
  }

  ctx.restore()
  paneFrame(ctx, r)

  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('basis functions N i,p (u)', r.x + 8, r.y + 16)
  ctx.fillText('1', r.x + 12, plot.y + 4)
  ctx.fillText('0', r.x + 12, plot.y + plot.h + 4)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.basis
  ctx.fillText(`${awake} awake at u`, r.x + 30, r.y + r.h - 26)
  ctx.fillStyle = 'rgba(26,31,43,0.85)'
  ctx.fillText(`Σ N = ${fmt(total)}`, r.x + 30, r.y + r.h - 10)
}

export function createBasisLocality(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { curve, basis } = panes(w, h)
      drawCurvePane(ctx, curve, sharedRef.current)
      drawBasisPane(ctx, basis, sharedRef.current)
    },
  }
}

export function BasisLocality() {
  const sharedRef = useRef<Shared>(freshBasisState())
  const [wrapRef, canvasWidth] = useCanvasWidth()
  const [degree, setDegree] = useState(3)
  const [u, setU] = useState(0.42)

  const pick = (e: React.PointerEvent<HTMLDivElement>): void => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const box = el.getBoundingClientRect()
    const { curve } = panes(box.width, el.clientHeight)
    const [wx, wy] = fromPx(VIEW, curve, e.clientX - box.left, e.clientY - box.top)
    const s = sharedRef.current
    let best = -1
    let bestD = 0.22
    s.points.forEach(([x, y], i) => {
      const d = Math.hypot(x - wx, y - wy)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (best < 0) return
    s.drag = best
    s.selected = best
  }

  const move = (e: React.PointerEvent<HTMLDivElement>): void => {
    const s = sharedRef.current
    if (s.drag === null || e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const box = el.getBoundingClientRect()
    const { curve } = panes(box.width, el.clientHeight)
    const [wx, wy] = fromPx(VIEW, curve, e.clientX - box.left, e.clientY - box.top)
    s.points[s.drag] = [Math.max(-2.4, Math.min(2.4, wx)), Math.max(-1.6, Math.min(1.6, wy))]
  }

  return (
    <div
      ref={wrapRef}
      className="sim-stir"
      onPointerDown={pick}
      onPointerMove={move}
      onPointerUp={() => {
        sharedRef.current.drag = null
      }}
      onPointerLeave={() => {
        sharedRef.current.drag = null
      }}
    >
      <Sim
        height={figureHeight(canvasWidth, 310, 520)}
        animated={false}
        create={() => createBasisLocality(sharedRef)}
      >
        <label>
          degree p{' '}
          <select
            value={degree}
            onChange={(e) => {
              const d = Number(e.target.value)
              sharedRef.current.degree = d
              setDegree(d)
            }}
          >
            <option value={2}>2 · quadratic</option>
            <option value={3}>3 · cubic</option>
            <option value={4}>4 · quartic</option>
          </select>
        </label>
        <label>
          u {u.toFixed(2)}{' '}
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={u}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.u = v
              setU(v)
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            sharedRef.current.points = HOME.map((p) => [...p] as Vec2)
          }}
        >
          Restore points
        </button>
      </Sim>
    </div>
  )
}
