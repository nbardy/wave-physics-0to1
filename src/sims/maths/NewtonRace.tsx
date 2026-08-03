import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  paneFrame,
  clipPane,
  toPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type Mat2,
  type View,
  type Rect,
} from './lib'

// PLAN figure 8, the finale (sliders galore, flagged in prose). A tilted
// anisotropic bowl f = ½ xᵀAx with A = R(30°)·diag(1, κ)·R(−30°). Two walkers
// from the same start: pink knows only the arrow (x ← x − η∇f); violet wears
// the lens (x ← x − η·H⁻¹∇f). Walkers advance on a fixed-cadence accumulator
// (one step per WALK_DT), so RAF never changes the race. GD's own stability
// boundary is REACHABLE on purpose: η > 2/κ makes pink diverge — the reader
// finds it by crossing it.

const RHO = (30 * Math.PI) / 180
const CR = Math.cos(RHO)
const SR = Math.sin(RHO)
const HALF = 1.35
const WALK_DT = 0.32 // seconds per walker step
const START: [number, number] = [-0.98, 0.72]
const MAX_STEPS = 60

function bowl(kappa: number): { A: Mat2; inv: Mat2 } {
  // A = R diag(1, κ) Rᵀ
  const A: Mat2 = [
    CR * CR + kappa * SR * SR,
    CR * SR * (1 - kappa),
    CR * SR * (1 - kappa),
    SR * SR + kappa * CR * CR,
  ]
  const det = A[0] * A[3] - A[1] * A[2]
  const inv: Mat2 = [A[3] / det, -A[1] / det, -A[2] / det, A[0] / det]
  return { A, inv }
}

const mul = (m: Mat2, x: number, y: number): [number, number] => [
  m[0] * x + m[1] * y,
  m[2] * x + m[3] * y,
]

interface Params {
  kappa: number
  eta: number
}

function createRace(pRef: { current: Params }): Stepper {
  let gd: Array<[number, number]> = [START]
  let nw: Array<[number, number]> = [START]
  let acc = 0
  let seen = { ...pRef.current }

  const advance = () => {
    const { A, inv } = bowl(seen.kappa)
    const eta = seen.eta
    if (gd.length < MAX_STEPS) {
      const [x, y] = gd[gd.length - 1]
      const [gx, gy] = mul(A, x, y) // ∇f = Ax for the quadratic bowl
      gd = [...gd, [x - eta * gx, y - eta * gy]]
    }
    if (nw.length < MAX_STEPS) {
      const [x, y] = nw[nw.length - 1]
      const [gx, gy] = mul(A, x, y)
      const [sx, sy] = mul(inv, gx, gy) // H⁻¹∇f — for this bowl, exactly x
      nw = [...nw, [x - eta * sx, y - eta * sy]]
    }
  }

  return {
    step(dt) {
      // sliders restart the race — a walker's old trail on a new bowl is a lie
      const p = pRef.current
      if (p.kappa !== seen.kappa || p.eta !== seen.eta) {
        seen = { ...p }
        gd = [START]
        nw = [START]
        acc = 0
      }
      acc += dt
      let guard = 0
      while (acc >= WALK_DT && guard < 4) {
        advance()
        acc -= WALK_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const size = Math.min(w, h - 8)
      const r: Rect = { x: (w - size) / 2, y: 4, w: size, h: size }
      const view: View = { cx: 0, cy: 0, half: HALF }
      const { A } = bowl(seen.kappa)

      ctx.save()
      clipPane(ctx, r)
      // contours of the bowl (marching dots on ½xᵀAx)
      ctx.fillStyle = 'rgba(26,31,43,0.35)'
      const levels = [0.04, 0.16, 0.36, 0.64, 1.0, 1.44].map((v) => v * 0.6)
      const step = 3
      for (let yy = 0; yy < r.h; yy += step) {
        for (let xx = 0; xx < r.w; xx += step) {
          const x = -HALF + (xx / r.w) * 2 * HALF
          const y = HALF - (yy / r.h) * 2 * HALF
          const [ax, ay] = mul(A, x, y)
          const v = 0.5 * (x * ax + y * ay)
          for (const L of levels) {
            if (Math.abs(v - L) < 0.012 * (1 + seen.kappa * 0.35)) {
              ctx.fillRect(r.x + xx, r.y + yy, 1.5, 1.5)
              break
            }
          }
        }
      }
      // the bottom of the bowl
      const [bx, by] = toPx(view, r, 0, 0)
      ctx.beginPath()
      ctx.arc(bx, by, 4, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(26,31,43,0.7)'
      ctx.lineWidth = 1.6
      ctx.stroke()

      const trail = (pts: Array<[number, number]>, color: string) => {
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < pts.length; i++) {
          const [px, py] = toPx(view, r, pts[i][0], pts[i][1])
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        for (let i = 0; i < pts.length; i++) {
          const [px, py] = toPx(view, r, pts[i][0], pts[i][1])
          ctx.beginPath()
          ctx.arc(px, py, i === pts.length - 1 ? 4 : 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      trail(gd, PALETTE.grad)
      trail(nw, PALETTE.area)
      // shared start
      const [sx, sy] = toPx(view, r, START[0], START[1])
      ctx.beginPath()
      ctx.arc(sx, sy, 4.4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, r)

      // meters: report steps-to-bottom once a walker is home, distance until
      // then, and the divergence confession when pink blows up. (Ordering
      // audited 2026-07-30: at the defaults the lens walker must read as
      // closer/home first, or the meter argues against the figure.)
      const dist = (p: [number, number]) => Math.hypot(p[0], p[1])
      const verdict = (pts: Array<[number, number]>, gone: boolean): string => {
        if (gone) return 'gone'
        const homeAt = pts.findIndex((p) => dist(p) < 0.02)
        if (homeAt > 0) return homeAt === 1 ? 'at the bottom in one step' : `at the bottom in ${homeAt} steps`
        return `${pts.length - 1} steps, ${fmt(dist(pts[pts.length - 1]))} out`
      }
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.grad
      ctx.fillText(`arrow-only walker: ${verdict(gd, dist(gd[gd.length - 1]) > HALF * 2.2)}`, r.x + 8, r.y + 20)
      ctx.fillStyle = PALETTE.area
      ctx.fillText(`lens walker: ${verdict(nw, false)}`, r.x + 8, r.y + 38)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`valley ${fmt(seen.kappa, 0)}× steeper across than along`, r.x + 8, r.y + 54)
    },
  }
}

export function NewtonRace() {
  // Default η sits just under gradient descent's stability edge 2/κ ≈ 0.167,
  // so the zig-zag decays slowly enough to read while the lens walker is
  // visibly closer — nudging "narrow" past κ = 12 tips pink into divergence.
  const [kappa, setKappa] = useState(12)
  const [eta, setEta] = useState(0.16)
  const pRef = useRef<Params>({ kappa, eta })
  pRef.current = { kappa, eta }

  return (
    <Sim height={330} create={() => createRace(pRef)}>
      <label className="sim-slider">
        <span>round</span>
        <input
          type="range"
          min={2}
          max={30}
          step={1}
          value={kappa}
          onChange={(e) => setKappa(Number(e.target.value))}
        />
        <span>narrow</span>
      </label>
      <label className="sim-slider">
        <span>timid</span>
        <input
          type="range"
          min={0.02}
          max={1}
          step={0.01}
          value={eta}
          onChange={(e) => setEta(Number(e.target.value))}
        />
        <span>bold</span>
      </label>
    </Sim>
  )
}
