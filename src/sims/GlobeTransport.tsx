import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §7 physical anchor — the globe needle. A tangent needle is carried (parallel
// transport) around the fixed octant triangle: equator → pole → equator. It
// comes home turned by a right angle — the sphere's own shape wrote the rule.
//
// Interactions, per the plan's feasibility flag: drag-to-orbit + ONE walk
// button, nothing else (no zoom, no inertia, no draggable vertices). The walk
// button is also the tap-step equivalent for touch.
//
// Rendering: orthographic projection — rotate the lat/long wireframe by the two
// orbit angles and drop z; visibility is the z-sign alone (back hemisphere
// faint, front bold), no z-buffer.

type Vec3 = readonly [number, number, number]

const Q = Math.PI / 2 // each leg of the octant triangle is a quarter great circle

// ── Closed-form transport ────────────────────────────────────────────────────
// Triangle vertices: V0 = (1,0,0) on the equator, V1 = (0,1,0) a quarter turn
// east, V2 = (0,0,1) the north pole. Every leg is a geodesic, so parallel
// transport is EXACT: along a geodesic the carried needle keeps a constant
// angle β to the leg's unit tangent T; in the tangent-plane frame {T, B = p×T}
// the needle is n = cos β·T + sin β·B. The βs below are the corners' angle
// bookkeeping, chained so the needle VECTOR is continuous at each corner:
//   leg 1 (equator, V0→V1): needle starts along the path        → β = 0
//   corner V1: the path turns 90° left, the needle does not     → β = −π/2
//   corner V2: the path turns 90° left again                    → β = π
// Home at V0 the needle points north (0,0,1); it left pointing east (0,1,0) —
// turned by exactly the enclosed area, π/2 steradians = 90°. No ODE, no
// integrator, hence no stability condition: dt below only paces the playback,
// and the state at any s is evaluated exactly.
interface Leg {
  pos: (t: number) => Vec3 // point on the sphere, t ∈ [0,1] along the leg
  tan: (t: number) => Vec3 // unit tangent in the direction of travel
  beta: number // the needle's constant angle to the tangent on this leg
}

const LEGS: readonly Leg[] = [
  {
    pos: (t) => [Math.cos(t * Q), Math.sin(t * Q), 0],
    tan: (t) => [-Math.sin(t * Q), Math.cos(t * Q), 0],
    beta: 0,
  },
  {
    pos: (t) => [0, Math.cos(t * Q), Math.sin(t * Q)],
    tan: (t) => [0, -Math.sin(t * Q), Math.cos(t * Q)],
    beta: -Q,
  },
  {
    pos: (t) => [Math.sin(t * Q), 0, Math.cos(t * Q)],
    tan: (t) => [Math.cos(t * Q), 0, -Math.sin(t * Q)],
    beta: Math.PI,
  },
]

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** Position and transported needle at loop parameter s ∈ [0, 3] (one unit per leg). Exact. */
function transportAt(s: number): { p: Vec3; n: Vec3 } {
  const i = Math.min(Math.floor(s), 2)
  const leg = LEGS[i]
  const p = leg.pos(s - i)
  const T = leg.tan(s - i)
  const B = cross(p, T)
  const c = Math.cos(leg.beta)
  const sn = Math.sin(leg.beta)
  return { p, n: [c * T[0] + sn * B[0], c * T[1] + sn * B[1], c * T[2] + sn * B[2]] }
}

// ── Constants ────────────────────────────────────────────────────────────────
const WALK_SPEED = 0.4 // legs per second — playback pace only, not physics
const NEEDLE_LEN = 0.26 // drawn needle length in sphere radii — a display choice
// only (the needle is a unit tangent DIRECTION; its length carries no meaning)
const GHOST_EVERY = 0.14 // loop-parameter spacing of the ghost trail
const ORBIT_SENS = 1 / 130 // radians of orbit per pixel of drag
const WIRE_SEG = 48 // samples per wireframe circle

/** Mutable view + intent shared between the React shell and the stepper.
 * Orbit angles are CAMERA, not simulation state — like MobiusComb's drag ref,
 * they deliberately survive Reset; Reset re-runs create and resets the walk. */
interface OrbitRefs {
  yaw: number
  pitch: number
  walkRequested: boolean
}

function createGlobe(refs: OrbitRefs): Stepper {
  let s = 0 // loop parameter ∈ [0, 3]
  let walking = false
  let walked = false // completed the loop at least once
  refs.walkRequested = false // create = fresh state; drop any stale button press

  return {
    step(dt) {
      if (refs.walkRequested) {
        refs.walkRequested = false
        s = 0
        walking = true
        walked = false
      }
      if (!walking) return
      s += WALK_SPEED * dt // exact playback: state at s is closed-form, any dt partition agrees
      if (s >= 3) {
        s = 3
        walking = false
        walked = true
      }
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2 + 4
      const R = Math.min(w, h) * 0.42
      const cyw = Math.cos(refs.yaw)
      const syw = Math.sin(refs.yaw)
      const cp = Math.cos(refs.pitch)
      const sp = Math.sin(refs.pitch)

      // orthographic: yaw about the polar axis, pitch about the screen-x axis, drop depth
      const proj = (v: Vec3) => {
        const x1 = v[0] * cyw - v[1] * syw
        const y1 = v[0] * syw + v[1] * cyw
        return { x: cx + x1 * R, y: cy - (v[2] * cp - y1 * sp) * R, d: y1 * cp + v[2] * sp }
      }

      // polyline split by z-sign: back segments faint (pass 0), front bold (pass 1)
      const strokeArc = (pts: Vec3[], closed: boolean, front: string, back: string, lw: number) => {
        const pr = pts.map(proj)
        const m = closed ? pr.length : pr.length - 1
        for (const pass of [0, 1] as const) {
          ctx.strokeStyle = pass ? front : back
          ctx.lineWidth = lw
          ctx.beginPath()
          for (let i = 0; i < m; i++) {
            const a = pr[i]
            const b = pr[(i + 1) % pr.length]
            if ((pass === 1) === (a.d + b.d >= 0)) {
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
            }
          }
          ctx.stroke()
        }
      }

      // silhouette
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      // lat/long wireframe, every 30°
      const circle = (f: (u: number) => Vec3) =>
        Array.from({ length: WIRE_SEG }, (_, i) => f((i / WIRE_SEG) * 2 * Math.PI))
      for (const latDeg of [-60, -30, 0, 30, 60]) {
        const phi = (latDeg * Math.PI) / 180
        const cph = Math.cos(phi)
        const sph = Math.sin(phi)
        strokeArc(
          circle((u) => [cph * Math.cos(u), cph * Math.sin(u), sph]),
          true,
          'rgba(107,114,128,0.4)',
          'rgba(107,114,128,0.1)',
          1,
        )
      }
      for (let k = 0; k < 6; k++) {
        const lam = (k * Math.PI) / 6
        const cl = Math.cos(lam)
        const sl = Math.sin(lam)
        strokeArc(
          circle((u) => [Math.cos(u) * cl, Math.cos(u) * sl, Math.sin(u)]),
          true,
          'rgba(107,114,128,0.4)',
          'rgba(107,114,128,0.1)',
          1,
        )
      }

      // the fixed triangle: 32 samples per leg, drawn as one closed loop
      const path: Vec3[] = []
      for (const leg of LEGS) for (let i = 0; i < 32; i++) path.push(leg.pos(i / 32))
      strokeArc(path, true, 'rgba(55,65,81,0.85)', 'rgba(55,65,81,0.18)', 2)

      // corner dots
      for (const v of [LEGS[0].pos(0), LEGS[1].pos(0), LEGS[2].pos(0)]) {
        const q = proj(v)
        ctx.fillStyle = q.d >= 0 ? PALETTE.wall : 'rgba(107,114,128,0.25)'
        ctx.beginPath()
        ctx.arc(q.x, q.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // a needle glyph at loop parameter sv — the same amber glyph as §6's carried needle
      const needle = (sv: number, width: number, alpha: number) => {
        const { p, n } = transportAt(sv)
        const a = proj(p)
        const b = proj([p[0] + n[0] * NEEDLE_LEN, p[1] + n[1] * NEEDLE_LEN, p[2] + n[2] * NEEDLE_LEN])
        ctx.globalAlpha = a.d >= 0 ? alpha : alpha * 0.22 // back hemisphere: faint, same z-sign rule
        ctx.strokeStyle = PALETTE.theta
        ctx.fillStyle = PALETTE.theta
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(a.x, a.y, width, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // ghost trail over the walked portion (always includes the start needle,
      // so the 90° mismatch is visible side by side when the walk comes home)
      for (let gs = 0; gs < s; gs += GHOST_EVERY) needle(gs, 1.6, 0.3)
      needle(0, 2, 0.45)
      needle(s, 2.6, 1) // the live needle

      // captions in-canvas
      const legNo = Math.min(Math.floor(s), 2) + 1
      const label = walked
        ? 'home — the needle returns turned 90°, the octant’s area'
        : walking
          ? `carrying the needle — leg ${legNo} of 3, constant angle to the leg`
          : 'press “walk” to carry the needle around the triangle'
      ctx.fillStyle = '#55606f'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(label, 12, 20)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.fillText('drag to orbit the globe', 12, h - 12)
    },
  }
}

export function GlobeTransport() {
  const refs = useRef<OrbitRefs>({ yaw: Math.PI / 4, pitch: 0.42, walkRequested: false })
  const last = useRef<{ x: number; y: number } | null>(null)

  // drag-to-orbit: whole-canvas hit target; deltas accumulate into the orbit
  // angles the stepper reads at draw time
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName !== 'CANVAS') return // buttons stay buttons
    e.currentTarget.setPointerCapture(e.pointerId)
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0 || !last.current) return
    refs.current.yaw -= (e.clientX - last.current.x) * ORBIT_SENS
    const pitch = refs.current.pitch + (e.clientY - last.current.y) * ORBIT_SENS
    refs.current.pitch = Math.max(-1.35, Math.min(1.35, pitch))
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    last.current = null
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: 'none' }}
    >
      <Sim
        height={340}
        create={() => createGlobe(refs.current)}
        caption="A needle carried flat along the triangle — out the equator, up to the pole, back down — comes home turned a quarter turn. The sphere's own shape wrote the transport rule."
      >
        <button
          type="button"
          onClick={() => {
            refs.current.walkRequested = true
          }}
        >
          Walk the triangle
        </button>
      </Sim>
    </div>
  )
}
