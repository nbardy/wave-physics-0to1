import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  clipPane,
  paneFrame,
  toPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type Rect,
  type View,
} from '../lib/chrome'
import {
  insertKnot,
  maxDeviation,
  openUniformKnots,
  polygonal,
  sampleCurve,
  type Spline,
  type Vec2,
} from './spline'

// CAD C1 figure 2 — refinement is exact.
//
// The claim is that inserting a knot buys new control points without moving the
// curve, so the two halves of it have to be visible at once: the ghost polygon
// is where the coordinates were, the amber polygon is where they are now, and
// the curve drawn through both is a single stroke because the two curves agree
// to machine precision. The Δ meter is the max sampled distance between the
// original curve and the refined one — not a claim, a measurement, and it is
// the same number `scripts/check-cad.ts` asserts stays under 1e-11.

const HOME: readonly Vec2[] = [
  [-1.6, -0.5],
  [-0.95, 0.8],
  [-0.2, -0.7],
  [0.55, 0.85],
  [1.25, -0.45],
  [1.75, 0.35],
]

const VIEW: View = { cx: 0.1, cy: 0.05, half: 1.95 }
const DEGREE = 3

export interface Shared {
  original: Spline
  refined: Spline
  u: number
  insertions: number
  saturated: boolean
}

export function freshKnotState(): Shared {
  const s: Spline = {
    points: HOME.map((p) => [...p] as Vec2),
    degree: DEGREE,
    knots: openUniformKnots(HOME.length, DEGREE),
  }
  return { original: s, refined: s, u: 0.5, insertions: 0, saturated: false }
}

/** Insert one knot at the current u, keeping the untouched spline for comparison. */
export function refineOnce(s: Shared): Shared {
  const result = insertKnot(s.refined, s.u)
  switch (result.kind) {
    case 'saturated':
      return { ...s, saturated: true }
    case 'refined':
      return { ...s, refined: result.spline, insertions: s.insertions + 1, saturated: false }
  }
}

function polygon(ctx: CanvasRenderingContext2D, r: Rect, points: readonly Vec2[]) {
  ctx.beginPath()
  points.forEach(([x, y], i) => {
    const [px, py] = toPx(VIEW, r, x, y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.stroke()
}

function knotStrip(ctx: CanvasRenderingContext2D, r: Rect, s: Shared) {
  const y = r.y + r.h - 34
  const x0 = r.x + 14
  const w = r.w - 28
  ctx.strokeStyle = 'rgba(120,140,170,0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x0 + w, y)
  ctx.stroke()

  // stack repeated knots so multiplicity is legible as height, not as overlap
  const seen = new Map<string, number>()
  for (const k of s.refined.knots) {
    const tag = k.toFixed(6)
    const level = seen.get(tag) ?? 0
    seen.set(tag, level + 1)
    const x = x0 + k * w
    ctx.strokeStyle = PALETTE.knot
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y - 5 - level * 5)
    ctx.stroke()
  }

  ctx.strokeStyle = PALETTE.curve
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x0 + s.u * w, y + 7)
  ctx.lineTo(x0 + s.u * w, y - 26)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('knot vector', x0, y + 18)
}

export function createKnotInsert(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const r: Rect = { x: 4, y: 4, w: w - 8, h: h - 8 }
      const s = sharedRef.current

      ctx.save()
      clipPane(ctx, r)

      // the original coordinates, kept visible so the trade is legible
      ctx.strokeStyle = PALETTE.ghost
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      polygon(ctx, r, s.original.points)
      ctx.setLineDash([])
      for (const [x, y] of s.original.points) {
        const [px, py] = toPx(VIEW, r, x, y)
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // the refined coordinates
      ctx.strokeStyle = 'rgba(217,119,6,0.55)'
      ctx.lineWidth = 1.8
      polygon(ctx, r, s.refined.points)
      for (const [x, y] of s.refined.points) {
        const [px, py] = toPx(VIEW, r, x, y)
        ctx.beginPath()
        ctx.arc(px, py, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.ctrl
        ctx.fill()
      }

      // the curve — drawn twice, original under refined, and they never separate
      ctx.strokeStyle = PALETTE.curve
      ctx.lineWidth = 5
      polygon(ctx, r, sampleCurve(polygonal(s.original), 260))
      // the refined curve rides on top as a dashed overlay — thin enough to let
      // the blue show through the gaps, thick enough that a reader can see it is
      // a second curve and not an artefact of the first
      ctx.strokeStyle = PALETTE.basis
      ctx.lineWidth = 2.4
      ctx.setLineDash([5, 7])
      polygon(ctx, r, sampleCurve(polygonal(s.refined), 260))
      ctx.setLineDash([])

      ctx.restore()
      knotStrip(ctx, r, s)
      paneFrame(ctx, r)

      const delta = maxDeviation(polygonal(s.original), polygonal(s.refined))
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('ghost = coordinates before · amber = coordinates now', r.x + 10, r.y + 16)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.ctrl
      ctx.fillText(
        `control points ${s.original.points.length} → ${s.refined.points.length}`,
        r.x + 10,
        r.y + 36,
      )
      ctx.fillStyle = PALETTE.basis
      ctx.fillText(`Δ = ${delta === 0 ? '0' : delta.toExponential(1)}`, r.x + 10, r.y + 54)
      if (s.saturated) {
        ctx.fillStyle = PALETTE.topo
        ctx.fillText(`u = ${fmt(s.u)} is full — no coordinate left to buy`, r.x + 10, r.y + 72)
      }
    },
  }
}

export function KnotInsert() {
  const sharedRef = useRef<Shared>(freshKnotState())
  const [u, setU] = useState(0.5)
  const [, bump] = useState(0)

  return (
    <Sim height={300} animated={false} create={() => createKnotInsert(sharedRef)}>
      <label>
        insert at u {u.toFixed(2)}{' '}
        <input
          type="range"
          min={0.02}
          max={0.98}
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
          sharedRef.current = refineOnce(sharedRef.current)
          bump((n) => n + 1)
        }}
      >
        Insert knot
      </button>
      <button
        type="button"
        onClick={() => {
          sharedRef.current = { ...freshKnotState(), u: sharedRef.current.u }
          bump((n) => n + 1)
        }}
      >
        Undo all
      </button>
    </Sim>
  )
}
