import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §11, the marriage figure (plan fig 67): two linked vortex rings in
// drag-to-orbit orthographic 3D, with a live linking-number readout computed
// from the Gauss linking integral of the drawn curves. Helicity — lesson 01's
// number for how vortex lines thread through one another — is this lesson's Hopf
// invariant in Arnold's asymptotic sense, exactly an integer in the
// spherical-Clebsch setting. Here it is measured, live, off the two curves
// actually on screen.
//
// Honesty (the reason this figure is allowed, per PLAN.md): this is the geometry
// of two DRAWN curves, not a faked 3-D fluid simulation — we do not claim reuse
// of lesson 01's 2-D assets. The linking number is the Gauss double integral
//   L = 1/4π ∮∮ (r₁ − r₂)·(dr₁ × dr₂) / |r₁ − r₂|³
// evaluated ONCE at create() over the two fixed rings (a topological invariant,
// so it is one number, not an animation). It comes out ≈ ±1 for a Hopf link and
// exactly 0 if the rings are unlinked — computed, not asserted. There is no
// integrator and no PDE; step() only drifts the camera yaw (view kinematics,
// exact in dt, so RAF cadence is irrelevant). The one knob is the pointer:
// drag to orbit the shared camera (HopfMonopole precedent).

const RING_SAMPLES = 96 // points per ring for drawing
const QUAD_M = 160 // segments per ring for the Gauss double integral (M² pairs)
const AUTO_YAW = 0.15 // rad/s idle camera drift; Pause freezes it
const ORBIT_GAIN = 4.5 // rad per full canvas-width of drag
const R_RING = 1.0 // ring radius (world units)

type Vec3 = [number, number, number]

// Two rings forming a Hopf link: unit circles in perpendicular planes, offset so
// each threads the other exactly once. Ring A lies in the xy-plane centered at
// (+d,0,0); ring B in the xz-plane centered at (−d,0,0), with d < R so they
// interlock. This is the textbook symmetric Hopf link — linking number ±1.
const OFFSET = 0.62 // center offset; < R_RING so the rings interlock

function ringA(u: number): Vec3 {
  const a = u * Math.PI * 2
  return [OFFSET + R_RING * Math.cos(a), R_RING * Math.sin(a), 0]
}
function ringB(u: number): Vec3 {
  const a = u * Math.PI * 2
  return [-OFFSET + R_RING * Math.cos(a), 0, R_RING * Math.sin(a)]
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * The Gauss linking integral over two closed curves, midpoint rule on both.
 * dr₁ × dr₂ uses segment chords; the integrand is evaluated at segment
 * midpoints. For a well-separated Hopf link this converges to ±1 to a few
 * decimals at QUAD_M ~ 160 — reported honestly (not rounded to the integer).
 */
function gaussLinking(c1: (u: number) => Vec3, c2: (u: number) => Vec3, m: number): number {
  let sum = 0
  for (let i = 0; i < m; i++) {
    const p0 = c1(i / m)
    const p1 = c1((i + 1) / m)
    const pm: Vec3 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]
    const d1 = sub(p1, p0) // chord = dr₁
    for (let j = 0; j < m; j++) {
      const q0 = c2(j / m)
      const q1 = c2((j + 1) / m)
      const qm: Vec3 = [(q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2, (q0[2] + q1[2]) / 2]
      const d2 = sub(q1, q0) // chord = dr₂
      const r = sub(pm, qm)
      const rn = Math.hypot(r[0], r[1], r[2])
      if (rn < 1e-6) continue
      sum += dot(r, cross(d1, d2)) / (rn * rn * rn)
    }
  }
  return sum / (4 * Math.PI)
}

/** Orthographic camera: yaw about y, then pitch about x. */
function makeCam(yaw: number, pitch: number): (p: Vec3) => Vec3 {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  return ([x, y, z]) => {
    const x1 = x * cy + z * sy
    const z1 = -x * sy + z * cy
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp]
  }
}

function depthAlpha(depth: number, base: number): number {
  return Math.max(0.15, Math.min(0.95, base + 0.25 * depth))
}

interface PtrState {
  down: boolean
  fx: number
  fy: number
}

function createLinkedRings(ptr: PtrState): Stepper {
  let yaw = 0.7
  let pitch = -0.4
  let lastFx = 0
  let lastFy = 0
  let dragging = false

  // the invariant, computed once — it is a topological number, not a per-frame
  // quantity; recomputing it every frame would only re-derive the same value
  const link = gaussLinking(ringA, ringB, QUAD_M)

  // precompute the two rings' sample points once (world space)
  const ptsA: Vec3[] = []
  const ptsB: Vec3[] = []
  for (let i = 0; i <= RING_SAMPLES; i++) {
    ptsA.push(ringA(i / RING_SAMPLES))
    ptsB.push(ringB(i / RING_SAMPLES))
  }

  const applyOrbit = () => {
    if (!ptr.down) {
      dragging = false
      return
    }
    if (!dragging) {
      dragging = true
      lastFx = ptr.fx
      lastFy = ptr.fy
      return
    }
    yaw += (ptr.fx - lastFx) * ORBIT_GAIN
    pitch = Math.max(-1.35, Math.min(1.35, pitch + (ptr.fy - lastFy) * ORBIT_GAIN))
    lastFx = ptr.fx
    lastFy = ptr.fy
  }

  const strokeRing = (
    ctx: CanvasRenderingContext2D,
    pts: Vec3[],
    cam: (p: Vec3) => Vec3,
    cx: number,
    cy: number,
    scale: number,
    color: [number, number, number],
  ) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = cam(pts[i])
      const b = cam(pts[i + 1])
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${depthAlpha((a[2] + b[2]) / 2, 0.55)})`
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.moveTo(cx + a[0] * scale, cy - a[1] * scale)
      ctx.lineTo(cx + b[0] * scale, cy - b[1] * scale)
      ctx.stroke()
    }
  }

  return {
    step(dt) {
      yaw += AUTO_YAW * dt // idle camera drift only — no physics in step()
    },
    draw(ctx, w, h) {
      applyOrbit()
      ctx.clearRect(0, 0, w, h)
      const cam = makeCam(yaw, pitch)
      const cx = w * 0.5
      const cy = h * 0.5
      const scale = Math.min(w, h) * 0.3

      // draw the far ring first, then the near ring, so overlaps read correctly
      // enough for a link (depth-sorted per ring by mean z — simple, honest)
      const meanZ = (pts: Vec3[]) => pts.reduce((s, p) => s + cam(p)[2], 0) / pts.length
      const zA = meanZ(ptsA)
      const zB = meanZ(ptsB)
      // dye colors from lesson 01's two vortex currents (amber + magenta rhyme)
      const colA: [number, number, number] = [217, 119, 6] // PALETTE.theta / dye
      const colB: [number, number, number] = [219, 39, 119] // PALETTE.dye2
      if (zA < zB) {
        strokeRing(ctx, ptsA, cam, cx, cy, scale, colA)
        strokeRing(ctx, ptsB, cam, cx, cy, scale, colB)
      } else {
        strokeRing(ctx, ptsB, cam, cx, cy, scale, colB)
        strokeRing(ctx, ptsA, cam, cx, cy, scale, colA)
      }

      // the live readout: the Gauss linking number of the two drawn curves
      ctx.fillStyle = PALETTE.curv
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`Gauss linking number = ${link.toFixed(3)}  (≈ ${Math.round(link)})`, 14, 24)
      ctx.fillStyle = INK_SOFT
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('helicity, exactly: how the two vortex rings thread through one another', 14, 42)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.fillText('drag to orbit — the number is a topological invariant, unchanged by the view', 14, h - 10)
    },
  }
}

const INK_SOFT = '#55606f'

export function LinkedRings() {
  const ptr = useRef<PtrState>({ down: false, fx: 0, fy: 0 })

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    ptr.current.fx = (e.clientX - rect.left) / rect.width
    ptr.current.fy = (e.clientY - rect.top) / rect.height
  }

  return (
    <div
      onPointerDown={(e) => {
        track(e)
        ptr.current.down = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={track}
      onPointerUp={() => {
        ptr.current.down = false
      }}
      onPointerCancel={() => {
        ptr.current.down = false
      }}
      style={{ touchAction: 'none' }}
    >
      <Sim
        height={320}
        create={() => createLinkedRings(ptr.current)}
      />
    </div>
  )
}
