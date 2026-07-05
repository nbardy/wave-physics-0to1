import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §9, fig 51 — the double discovery, 1931. Left pane: Hopf's fibration — the
// fiber circle over a base-sphere point, drawn via stereographic projection of
// S³ to R³ and then a fixed orthographic camera. Right pane: Dirac's monopole —
// radial field lines from a point. The mapping between panes is the lesson:
// pick a direction on the base sphere and you have picked BOTH a Hopf circle
// (left, amber) and a monopole field line (right, amber) — same object, two
// 1931 papers, recognized as one in 1977.
//
// Honesty: everything here is closed-form geometry evaluated fresh each frame —
// there is no integrator and hence no stability condition. step() only drifts
// the camera yaw (view kinematics, not physics; exact in dt, so RAF cadence is
// irrelevant by construction). The one knob is the pointer: drag the small base
// sphere to move the base point; drag anywhere else to orbit the shared camera.

const FIBER_SAMPLES = 128
const RAY_COUNT = 26
const AUTO_YAW = 0.1 // rad/s camera drift; Pause freezes it
const THETA_MIN = 0.15 // keep the base point off the projection pole (θ = π):
const THETA_MAX = 2.2 //   that fiber stereographs to an infinite straight line
const ORBIT_GAIN = 4.5 // rad per full canvas-width of drag
// Fixed faint fibers: one latitude, three longitudes — the classic linked rings.
const FIXED_FIBERS: ReadonlyArray<{ theta: number; phi: number }> = [
  { theta: 1.1, phi: 0.4 },
  { theta: 1.1, phi: 2.5 },
  { theta: 1.1, phi: 4.6 },
]

type Vec3 = [number, number, number]

// The Hopf fiber over base point (θ,φ), in closed form: with z₁ = cos(θ/2)e^{it},
// z₂ = sin(θ/2)e^{i(t−φ)}, the Hopf map sends the whole circle t ∈ [0,2π) to the
// single base point (sinθ cosφ, sinθ sinφ, cosθ). Stereographic projection of
// (z₁,z₂) ∈ S³ from the pole Im(z₂) = 1 gives the R³ circle we draw.
function fiberPoint(theta: number, phi: number, t: number): Vec3 {
  const a = Math.cos(theta / 2)
  const b = Math.sin(theta / 2)
  const x1 = a * Math.cos(t)
  const y1 = a * Math.sin(t)
  const x2 = b * Math.cos(t - phi)
  const y2 = b * Math.sin(t - phi)
  const d = 1 - y2 // ≥ 1 − sin(θ/2) > 0 for θ ≤ THETA_MAX — no blowup by construction
  return [x1 / d, y1 / d, x2 / d]
}

function baseDir(theta: number, phi: number): Vec3 {
  const s = Math.sin(theta)
  return [s * Math.cos(phi), s * Math.sin(phi), Math.cos(theta)]
}

/** Orthographic camera: yaw about y, then pitch about x; +depth = toward viewer. */
interface Cam {
  rot: (p: Vec3) => Vec3
  inv: (q: Vec3) => Vec3
}

function makeCam(yaw: number, pitch: number): Cam {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  return {
    rot: ([x, y, z]) => {
      const x1 = x * cy + z * sy
      const z1 = -x * sy + z * cy
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp]
    },
    inv: ([x, y, z]) => {
      const y1 = y * cp + z * sp
      const z1 = -y * sp + z * cp
      return [x * cy - z1 * sy, y1, x * sy + z1 * cy]
    },
  }
}

function depthAlpha(depth: number, base: number): number {
  return Math.max(0.12, Math.min(0.95, base + 0.2 * depth))
}

function strokePolyline3D(
  ctx: CanvasRenderingContext2D,
  pts: Vec3[], // camera-space points
  cx: number,
  cy: number,
  scale: number,
  color: [number, number, number],
  baseAlpha: number,
  width: number,
): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [xa, ya, za] = pts[i]
    const [xb, yb, zb] = pts[i + 1]
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${depthAlpha((za + zb) / 2, baseAlpha)})`
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(cx + xa * scale, cy - ya * scale)
    ctx.lineTo(cx + xb * scale, cy - yb * scale)
    ctx.stroke()
  }
}

// Pointer state written by the wrapper div, read once per frame by the stepper.
interface PtrState {
  down: boolean
  pressed: boolean // latched on pointerdown, consumed by the stepper
  fx: number
  fy: number
}

type DragKind = 'none' | 'orbit' | 'base'

function createHopfMonopole(ptr: PtrState): Stepper {
  // camera: a gentle fixed tilt plus slow drift; drag-to-orbit adjusts it
  let yaw = 0.6
  let pitch = -0.45
  // the draggable base point, in base-sphere coordinates
  let theta = 0.85
  let phi = 5.4
  let drag: DragKind = 'none'
  let lastFx = 0
  let lastFy = 0

  // pane geometry (fractions of the canvas; recomputed against live w,h)
  const insetOf = (w: number, h: number) => ({ icx: w * 0.105, icy: h * 0.78, ir: h * 0.115 })

  const applyOrbit = (fx: number, fy: number) => {
    yaw += (fx - lastFx) * ORBIT_GAIN
    pitch = Math.max(-1.35, Math.min(1.35, pitch + (fy - lastFy) * ORBIT_GAIN))
    lastFx = fx
    lastFy = fy
  }

  const applyBase = (px: number, py: number, w: number, h: number, cam: Cam) => {
    const { icx, icy, ir } = insetOf(w, h)
    let u = (px - icx) / ir
    let v = -(py - icy) / ir
    const rr = Math.hypot(u, v)
    if (rr > 1) {
      u /= rr
      v /= rr
    }
    // pointer picks a point on the front hemisphere in camera space; undo the camera
    const n = cam.inv([u, v, Math.sqrt(Math.max(0, 1 - u * u - v * v))])
    theta = Math.max(THETA_MIN, Math.min(THETA_MAX, Math.acos(Math.max(-1, Math.min(1, n[2])))))
    phi = Math.atan2(n[1], n[0])
  }

  // κ for the pointer: classify the press once, then route moves to one handler
  const applyPointer = (w: number, h: number, cam: Cam) => {
    if (ptr.pressed) {
      ptr.pressed = false
      const { icx, icy, ir } = insetOf(w, h)
      const hit = Math.hypot(ptr.fx * w - icx, ptr.fy * h - icy) < ir * 1.45 // generous hit target
      drag = hit ? 'base' : 'orbit'
      lastFx = ptr.fx
      lastFy = ptr.fy
    }
    if (!ptr.down) {
      drag = 'none'
      return
    }
    if (drag === 'orbit') applyOrbit(ptr.fx, ptr.fy)
    if (drag === 'base') applyBase(ptr.fx * w, ptr.fy * h, w, h, cam)
  }

  const fiberCamPts = (th: number, ph: number, cam: Cam): Vec3[] => {
    const pts: Vec3[] = []
    for (let i = 0; i <= FIBER_SAMPLES; i++) {
      pts.push(cam.rot(fiberPoint(th, ph, (i / FIBER_SAMPLES) * Math.PI * 2)))
    }
    return pts
  }

  return {
    step(dt) {
      yaw += AUTO_YAW * dt // camera drift only — no physics lives in step()
    },
    draw(ctx, w, h) {
      const cam = makeCam(yaw, pitch)
      applyPointer(w, h, cam)
      ctx.clearRect(0, 0, w, h)
      const split = w * 0.5

      // ---- left pane: Hopf circles (stereographic view, shared camera) ----
      const lc = { x: split * 0.54, y: h * 0.47 }
      const S = h * 0.21 // scale confession: unit S³ radius → 0.21·h pixels, chosen so the θ≈1.1 rings fill the pane
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, split, h)
      ctx.clip()
      for (const f of FIXED_FIBERS) {
        strokePolyline3D(ctx, fiberCamPts(f.theta, f.phi, cam), lc.x, lc.y, S, [107, 114, 128], 0.32, 1.2)
      }
      strokePolyline3D(ctx, fiberCamPts(theta, phi, cam), lc.x, lc.y, S, [217, 119, 6], 0.75, 2.2)

      // base-sphere inset: the S² everything fibers over
      const { icx, icy, ir } = insetOf(w, h)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(icx, icy, ir, 0, Math.PI * 2)
      ctx.stroke()
      const eq: Vec3[] = []
      for (let i = 0; i <= 48; i++) {
        const u = (i / 48) * Math.PI * 2
        eq.push(cam.rot([Math.cos(u), Math.sin(u), 0]))
      }
      strokePolyline3D(ctx, eq, icx, icy, ir, [107, 114, 128], 0.3, 1)
      for (const f of FIXED_FIBERS) {
        const q = cam.rot(baseDir(f.theta, f.phi))
        ctx.fillStyle = `rgba(107,114,128,${depthAlpha(q[2], 0.45)})`
        ctx.beginPath()
        ctx.arc(icx + q[0] * ir, icy - q[1] * ir, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      const bp = cam.rot(baseDir(theta, phi))
      ctx.fillStyle = `rgba(217,119,6,${depthAlpha(bp[2], 0.8)})`
      ctx.beginPath()
      ctx.arc(icx + bp[0] * ir, icy - bp[1] * ir, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // ---- right pane: Dirac's monopole (same camera — spherical symmetry shows) ----
      const rc = { x: split + (w - split) * 0.5, y: h * 0.5 }
      const R1 = Math.min(w - split, h) * 0.4
      const GOLD = Math.PI * (3 - Math.sqrt(5))
      for (let i = 0; i < RAY_COUNT; i++) {
        const z = 1 - (2 * (i + 0.5)) / RAY_COUNT
        const s = Math.sqrt(1 - z * z)
        const a = i * GOLD
        const q = cam.rot([s * Math.cos(a), s * Math.sin(a), z])
        drawRay(ctx, rc.x, rc.y, q, R1, [8, 145, 178], 0.42, 1.2)
      }
      drawRay(ctx, rc.x, rc.y, cam.rot(baseDir(theta, phi)), R1, [217, 119, 6], 0.85, 2.2)
      ctx.fillStyle = PALETTE.bfield
      ctx.beginPath()
      ctx.arc(rc.x, rc.y, 5, 0, Math.PI * 2)
      ctx.fill()

      // divider + captions: two 1931 papers, one object
      ctx.strokeStyle = 'rgba(107,114,128,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(split, 10)
      ctx.lineTo(split, h - 10)
      ctx.stroke()
      ctx.fillStyle = '#55606f'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('Hopf 1931 — the circle over a direction', 12, 20)
      ctx.fillText('Dirac 1931 — the field line along it', split + 12, 20)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('base sphere — drag the dot', 12, h - 10)
      ctx.fillText('drag anywhere else to orbit both panes', split + 12, h - 10)
    },
  }
}

/** One monopole field line: a radial ray from the point, arrowhead outward. */
function drawRay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  q: Vec3, // camera-space unit direction
  len: number,
  color: [number, number, number],
  baseAlpha: number,
  width: number,
): void {
  const dx = q[0]
  const dy = -q[1]
  const flat = Math.hypot(dx, dy)
  if (flat < 0.05) return // ray pointing straight at the viewer: no 2D extent
  const ux = dx / flat
  const uy = dy / flat
  const r0 = 12
  const r1 = len * (0.45 + 0.55 * flat) // foreshortening: rays toward the viewer draw shorter
  const a = depthAlpha(q[2], baseAlpha)
  ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${a})`
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(cx + ux * r0, cy + uy * r0)
  ctx.lineTo(cx + ux * r1, cy + uy * r1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + ux * (r1 + 6), cy + uy * (r1 + 6))
  ctx.lineTo(cx + ux * r1 - uy * 3.4, cy + uy * r1 + ux * 3.4)
  ctx.lineTo(cx + ux * r1 + uy * 3.4, cy + uy * r1 - ux * 3.4)
  ctx.closePath()
  ctx.fill()
}

export function HopfMonopole() {
  const ptr = useRef<PtrState>({ down: false, pressed: false, fx: 0, fy: 0 })

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
        ptr.current.pressed = true
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
        height={300}
        create={() => createHopfMonopole(ptr.current)}
        caption="1931, twice: Hopf's fibration and Dirac's monopole — the same geometry, recognized as one object only in 1977. The amber direction picks a fiber circle on the left and a field line on the right."
      />
    </div>
  )
}
