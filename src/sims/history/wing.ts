// Rounded Joukowski foil: z = ζ + 1/ζ, |ζ + 0.14| = 1.20.
// Both critical points ±1 are INSIDE the circle, so the boundary has no cusp
// or velocity singularity. Zero circulation is intentional: Euler's ideal
// model has no drag; this is not a Kutta-selected lifting solution.
// Reference: Cambridge/Sydney, Joukowski Transformations and Aerofoils:
// https://www-mdp.eng.cam.ac.uk/web/library/enginfo/aerothermal_dvd_only/aero/jouk/jouk.html
export interface Point {
  x: number
  y: number
}
export const NX = 216
export const NY = 108
export const U = 38
export const DT = 1 / 40
export const CHORD = 66
const SCALE = 16
const CX = 76
const CY = 53
// A steeper incidence makes the upstream deflection and downstream wake legible.
// Keep this shared by the analytic field, solid mask, and all era comparisons.
const ANGLE = 35 * Math.PI / 180
const R = 1.20
const C = -0.14
const ca = Math.cos(ANGLE)
const sa = Math.sin(ANGLE)
const mul = (a: Point, b: Point): Point => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x })
const inv = (z: Point): Point => { const d = z.x * z.x + z.y * z.y; return { x: z.x / d, y: -z.y / d }; }
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })
export function surface(theta: number): Point {
  const zeta = { x: C + R * Math.cos(theta), y: R * Math.sin(theta) }
  const reciprocal = inv(zeta)
  const x = zeta.x + reciprocal.x, y = zeta.y + reciprocal.y
  return { x: CX + SCALE * (ca * x - sa * y), y: CY + SCALE * (sa * x + ca * y) }
}
export const OUTLINE = Array.from({ length: 192 }, (_, i) => surface(i * Math.PI * 2 / 192))
function preimage(x: number, y: number): Point {
  const dx = (x - CX) / SCALE, dy = (y - CY) / SCALE
  const z = { x: ca * dx + sa * dy, y: -sa * dx + ca * dy }
  const q = sub(mul(z, z), { x: 4, y: 0 })
  const length = Math.hypot(q.x, q.y)
  const root = { x: Math.sqrt(Math.max(0, (length + q.x) / 2)), y: (q.y < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (length - q.x) / 2)) }
  const a = { x: (z.x + root.x) / 2, y: (z.y + root.y) / 2 }
  const b = { x: (z.x - root.x) / 2, y: (z.y - root.y) / 2 }
  return Math.hypot(a.x - C, a.y) > Math.hypot(b.x - C, b.y) ? a : b
}
export function inside(x: number, y: number): boolean {
  const z = preimage(x, y)
  return Math.hypot(z.x - C, z.y) < R
}
export function idealVelocity(x: number, y: number): Point {
  const z = preimage(x, y)
  if (Math.hypot(z.x - C, z.y) < R - 1e-8)
    return { x: 0, y: 0 }
  const reciprocal = inv(z), relative = inv({ x: z.x - C, y: z.y })
  const dipole = mul({ x: R * R * ca, y: -R * R * sa }, mul(relative, relative))
  const numerator = sub({ x: ca, y: sa }, dipole)
  const derivative = sub({ x: 1, y: 0 }, mul(reciprocal, reciprocal))
  const velocity = mul(mul(numerator, inv(derivative)), { x: ca, y: -sa })
  return { x: U * velocity.x, y: -U * velocity.y }
}
export function drawWing(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath()
  OUTLINE.forEach((p, i) => i === 0 ? ctx.moveTo(p.x / NX * w, p.y / NY * h) : ctx.lineTo(p.x / NX * w, p.y / NY * h))
  ctx.closePath()
  ctx.fillStyle = '#6b7280'
  ctx.fill()
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 0.7
  ctx.stroke()
}
