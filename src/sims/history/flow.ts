import type { Stepper } from '../../components/Sim'
import { SolverRenderer, type DyePalette } from '../lib/solver'
import { WakeSolver, WAKE_SPACING, type WallCondition } from './wake'
import { PALETTE } from '../lib/palette'
import { CHORD, DT, NX, NY, U, OUTLINE, drawWing, idealVelocity, inside, surface, type Point } from './wing'
export type EraKind = 'newton' | 'euler' | 'navier' | 'stokes' | 'reynolds' | 'prandtl'
export type ViscousEra = 'navier' | 'stokes' | 'reynolds' | 'prandtl'
// Navier and Stokes share one viscosity: the only change between 1822 and 1845
// is the wall. The viscosity then falls through Reynolds and Prandtl.
export const ERA_SOLVER: Record<ViscousEra, { re: number; wall: WallCondition }> = {
  navier: { re: 12, wall: 'slip' },
  stokes: { re: 12, wall: 'no-slip' },
  reynolds: { re: 180, wall: 'no-slip' },
  prandtl: { re: 1800, wall: 'no-slip' },
}
const SEPIA = '#78716c' // lesson-03 history furniture: meters and nameplates
// Outward unit normal and length of each segment of a closed polygon, oriented
// by the solid test rather than by assuming the polygon's winding.
function segments(points: readonly Point[]) {
  return points.map((a, i) => {
    const b = points[(i + 1) % points.length]
    const ex = b.x - a.x, ey = b.y - a.y, length = Math.hypot(ex, ey)
    const n = { x: -ey / length, y: ex / length }
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const outward = inside(mid.x + n.x * .5, mid.y + n.y * .5) ? { x: -n.x, y: -n.y } : n
    return { mid, n: outward, length }
  })
}
// The corpuscles bounce off the drawn outline, so its 192 segments are the
// exact surface for Newton's sum. The ideal speed peaks near ten times U at
// the tail, which those segments under-resolve by 0.3 in the coefficient;
// the Bernoulli integral uses a sixteen-times finer parametrization.
const OUTLINE_SEGMENTS = segments(OUTLINE)
const FINE_SEGMENTS = segments(Array.from({ length: 3072 }, (_, i) => surface(i * Math.PI * 2 / 3072)))
// Newton's corpuscles arrive at U, strike the upstream-facing surface once, and
// reflect elastically as `bounce` does. Per unit length the impact rate is
// U·|n_x| and each impact hands the body 2·U·|n_x| of streamwise momentum, so
// the drag coefficient of the model is 4·Σ|n_x|³·ds / chord.
export function corpuscleDrag(): number {
  let sum = 0
  for (const s of OUTLINE_SEGMENTS) if (s.n.x < 0) sum += 4 * Math.abs(s.n.x) ** 3 * s.length
  return sum / CHORD
}
// Euler's fluid: Bernoulli pressure from the exact potential flow, integrated
// around the section. The analytic answer is zero (d'Alembert's paradox); the
// quadrature is displayed rather than replaced by the constant. Samples sit
// 1e-4 off the surface: closer than 1e-6 the solid test misfires at the tail
// and returns zero velocity, which would fake the zero with Cp = 1 everywhere.
export function idealDrag(): number {
  let sum = 0
  for (const s of FINE_SEGMENTS) {
    const v = idealVelocity(s.mid.x + s.n.x * 1e-4, s.mid.y + s.n.y * 1e-4)
    const cp = 1 - (v.x * v.x + v.y * v.y) / (U * U)
    sum -= cp * s.n.x * s.length
  }
  return sum / CHORD
}
const ROWS = [12, 22, 32, 42, 52, 62, 72, 82, 92, 102]
const COLORS = [PALETTE.dye, PALETTE.dye2]
// Timeline-only comparison identity. Recolor dye/tracers, not the wing,
// background, or physical diagnostic annotations. Standalone eras stay normal.
export const HISTORY_COMPARISON_COLOR = '#087f8c'
const COMPARISON_PALETTE: DyePalette = [[8, 127, 140], [8, 127, 140]]
interface Marker extends Point {
  vx: number
  vy: number
  color: number
  trail: Point[]
  tag: 'inlet' | 'ambient' | 'wake'
  age: number
}
function random(seed = 1687) {
  return () => {
    seed |= 0
    seed = seed + 0x6d2b79f5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
// Segment collision, not an endpoint test: even a fast corpuscle cannot tunnel
// through the foil's thin tail. Elastic reflection conserves its speed.
export function bounce(p: Point, end: Point, velocity: Point): {
  point: Point
  velocity: Point
} | null {
  const dx = end.x - p.x, dy = end.y - p.y
  let best = Infinity, normal: Point = { x: 0, y: 0 }
  for (let i = 0; i < OUTLINE.length; i++) {
    const a = OUTLINE[i], b = OUTLINE[(i + 1) % OUTLINE.length]
    const ex = b.x - a.x, ey = b.y - a.y, det = dx * ey - dy * ex
    if (Math.abs(det) < 1e-12)
      continue
    const ax = a.x - p.x, ay = a.y - p.y
    const t = (ax * ey - ay * ex) / det, s = (ax * dy - ay * dx) / det
    if (t >= 0 && t <= 1 && s >= 0 && s <= 1 && t < best) {
      best = t
      const length = Math.hypot(ex, ey)
      normal = { x: -ey / length, y: ex / length }
    }
  }
  if (!Number.isFinite(best))
    return null
  const dot = velocity.x * normal.x + velocity.y * normal.y
  const v = { x: velocity.x - 2 * dot * normal.x, y: velocity.y - 2 * dot * normal.y }
  return { point: { x: p.x + dx * best + v.x * DT * (1 - best) + v.x * 1e-5, y: p.y + dy * best + v.y * DT * (1 - best) + v.y * 1e-5 }, velocity: v }
}
export interface HistoryFlow extends Stepper {
  markWake: () => void
  velocityAt: (x: number, y: number) => Point
  measure: () => { time: number; reverseCells: number; outletRatio: number; divergenceRMS: number; wakeMarkers: number; drag: number }
}
function drawDragMeter(ctx: CanvasRenderingContext2D, value: number) {
  const bx = 12, by = 12, bw = 92, bh = 40, r = 8
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
  ctx.arcTo(bx, by + bh, bx, by, r)
  ctx.arcTo(bx, by, bx + bw, by, r)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.86)'
  ctx.fill()
  ctx.strokeStyle = SEPIA
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = SEPIA
  ctx.font = '600 10px ui-sans-serif, system-ui'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('pressure drag', bx + 10, by + 15)
  ctx.fillStyle = '#17191d'
  ctx.font = '600 17px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText((Math.round(value * 100) / 100).toFixed(2), bx + 10, by + 32)
  ctx.restore()
}
export function createHistoryFlow(kind: EraKind, comparison: () => boolean = () => false): HistoryFlow {
  const rand = random()
  // Semi-Lagrangian advection and implicit diffusion are stable for any dt.
  // DT is fixed regardless of RAF cadence; RK2 tracers substep at most 0.2 cell
  // per sample near the foil, where ideal flow can turn sharply.
  const solver = kind === 'newton' || kind === 'euler' ? null : new WakeSolver(U * CHORD / ERA_SOLVER[kind].re, ERA_SOLVER[kind].wall)
  let renderer: SolverRenderer | null = null
  // Fluid cells touching the wing, with the normal pointing from fluid into
  // solid, so +Σ p·n_x is the downstream pressure force on the body.
  const wingFaces: { k: number; nx: number }[] = []
  if (solver) {
    // Geometry is drawn as a vector path at display resolution. This option
    // omits ONLY the solid pixels in the dye image, not the solver's mask.
    renderer = new SolverRenderer(solver, false)
    for (let y = 0; y < solver.ny; y++) for (let x = 0; x < solver.nx; x++) {
      const k = x + y * solver.nx
      if (solver.solid[k]) continue
      if (x > 0 && solver.solid[k - 1]) wingFaces.push({ k, nx: -1 })
      if (x < solver.nx - 1 && solver.solid[k + 1]) wingFaces.push({ k, nx: 1 })
    }
  }
  // Pressure storage is φ = p·dt/ρ in coarse-grid units; each face is
  // WAKE_SPACING long. Smoothed over half a second, as the loupe's meter is.
  const pressureDrag = () => {
    if (!solver) return 0
    let fx = 0
    for (const f of wingFaces) fx += solver.p[f.k] * f.nx
    return fx * WAKE_SPACING ** 3 / DT / (.5 * U * U * CHORD)
  }
  let drag = kind === 'newton' ? corpuscleDrag() : kind === 'euler' ? idealDrag() : 0
  const velocity = (x: number, y: number): Point => solver ? solver.velocity(x, y) : kind === 'newton' ? { x: U, y: 0 } : idealVelocity(x, y)
  const markers: Marker[] = []
  const spawn = (p: Marker, scatter = false) => {
    const row = Math.floor(rand() * ROWS.length)
    if (p.tag === 'wake') p.tag = 'ambient'
    p.x = scatter || p.tag === 'ambient' ? rand() * (NX - 4) + 2 : 2
    p.y = p.tag === 'ambient' ? 3 + rand() * (NY - 6) : ROWS[row] + (rand() - 0.5) * 1.5
    p.color = row < ROWS.length / 2 ? 0 : 1
    p.vx = U
    p.vy = 0
    p.trail = []
    p.age = 0
    if (inside(p.x, p.y))
      p.x = 2
  }
  for (let i = 0; i < 560; i++) {
    const p: Marker = { x: 0, y: 0, vx: U, vy: 0, color: 0, trail: [], tag: i < 380 ? 'inlet' : 'ambient', age: 0 }
    spawn(p, true)
    markers.push(p)
  }
  let time = 0, acc = 0
  const advance = () => {
    time += DT
    if (solver) {
      // Pulsing the inlet tags parcels in time; it changes only the dye feed,
      // never the velocity. Continuous stripes alone look frozen in steady flow.
      const amount = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(time * 5))
      solver.injectDyeStripe(ROWS.slice(0, 5), amount)
      solver.injectDye2Stripe(ROWS.slice(5), amount)
      solver.step(DT)
      drag += (1 - Math.exp(-DT / .5)) * (pressureDrag() - drag)
    }
    for (const p of markers) {
      p.age += DT
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > (p.tag === 'inlet' ? 10 : 24))
        p.trail.shift()
      if (kind === 'newton') {
        const next = { x: p.x + p.vx * DT, y: p.y + p.vy * DT }
        const hit = bounce(p, next, { x: p.vx, y: p.vy })
        if (hit) {
          p.x = hit.point.x
          p.y = hit.point.y
          p.vx = hit.velocity.x
          p.vy = hit.velocity.y
        }
        else {
          p.x = next.x
          p.y = next.y
        }
      }
      else {
        const v = velocity(p.x, p.y)
        const steps = Math.max(1, Math.ceil(Math.hypot(v.x, v.y) * DT / 0.2))
        const dt = DT / steps
        for (let n = 0; n < steps; n++) {
          const a = velocity(p.x, p.y), b = velocity(p.x + a.x * dt / 2, p.y + a.y * dt / 2)
          p.x += b.x * dt
          p.y += b.y * dt
        }
      }
      // Keep the reader's blue batch until it leaves; only background sampling
      // is refreshed on a timer. Trapped wake markers must not reset mid-orbit.
      if (p.x < 0 || p.x > NX - 2 || p.y < 2 || p.y > NY - 2 || inside(p.x, p.y) || (p.tag === 'ambient' && p.age > 18))
        spawn(p)
    }
  }
  // Seed parcels without an expensive synchronous multi-second solver pre-roll.
  // The viscous initial condition is the projected channel flow. The wake then
  // develops from advection and wall friction; nothing prescribes its vortices.
  return {
    markWake() {
      // Reposition passive markers ONLY. This adds no momentum or fluid volume.
      for (const p of markers) if (p.tag !== 'inlet') {
        p.tag = 'wake'; p.x = 114 + rand() * 38; p.y = 43 + rand() * 27
        p.vx = U; p.vy = 0; p.trail = []; p.age = 0
      }
    },
    velocityAt: velocity,
    measure() {
      let reverseCells = 0, sum = 0, inlet = 0, outlet = 0
      if (solver) {
        for (let y = 0; y < solver.ny; y++) {
          inlet += solver.faces.u[y * (solver.nx + 1)]
          outlet += solver.faces.u[solver.nx + y * (solver.nx + 1)]
          for (let x = 0; x < solver.nx; x++) {
            const k = x + y * solver.nx
            if (solver.solid[k]) continue
            sum += solver.div[k] ** 2
            if (x > solver.nx * .51 && y > solver.ny * .22 && y < solver.ny * .83 && solver.u[k] < -U * .05) reverseCells++
          }
        }
      }
      return { time, reverseCells, outletRatio: solver ? outlet / inlet : 1, divergenceRMS: solver ? Math.sqrt(sum / (solver.nx * solver.ny)) : 0, wakeMarkers: markers.filter(p => p.tag === 'wake').length, drag }
    },
    step(dt) { acc += dt; while (acc + 1e-10 >= DT) {
      advance()
      acc -= DT
    } },
    draw(ctx, w, h) {
      const isComparison = comparison()
      ctx.fillStyle = '#f7f9fc'
      ctx.fillRect(0, 0, w, h)
      renderer?.draw(ctx, w, h, 'none', isComparison ? COMPARISON_PALETTE : undefined)
      const sx = w / NX, sy = h / NY
      for (const p of markers) {
        const color = isComparison ? HISTORY_COMPARISON_COLOR : p.tag === 'wake' ? PALETTE.vel : p.tag === 'ambient' ? '#697c92' : COLORS[p.color]
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.globalAlpha = p.tag === 'ambient' ? 0.33 : p.tag === 'wake' ? .65 : .38
        ctx.lineWidth = p.tag === 'wake' ? 1.5 : 1.1
        ctx.beginPath()
        p.trail.forEach((q, i) => i === 0 ? ctx.moveTo(q.x * sx, q.y * sy) : ctx.lineTo(q.x * sx, q.y * sy))
        ctx.lineTo(p.x * sx, p.y * sy)
        ctx.stroke()
        ctx.globalAlpha = p.tag === 'ambient' ? .55 : .95
        ctx.beginPath()
        ctx.arc(p.x * sx, p.y * sy, p.tag === 'ambient' ? 1.15 : 1.55, 0, 2 * Math.PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      drawWing(ctx, w, h)
      // One meter per view: the faded comparison era keeps its dye but not its number.
      if (!isComparison) drawDragMeter(ctx, drag)
      if (kind === 'prandtl' && solver) {
        // Near-wall velocities, sampled from this solve (blue forward, red
        // backward). An ideal-flow reference in gray shows the no-slip contrast.
        const x0 = w - 120, y0 = 24
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.fillRect(x0 - 12, y0 - 16, 122, 112)
        ctx.font = '11px ui-sans-serif, system-ui'
        ctx.fillStyle = '#78716c'
        ctx.fillText('near the wing', x0, y0)
        const shoulder = OUTLINE[140]
        for (let i = 0; i < 7; i++) {
          const x = shoulder.x, y = shoulder.y - i * 1.4
          const actual = velocity(x, y).x / U * 34
          const ideal = idealVelocity(x, y).x / U * 34
          const py = y0 + 80 - i * 10
          ctx.strokeStyle = '#c9c5be'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x0 + 12, py)
          ctx.lineTo(x0 + 12 + ideal, py)
          ctx.stroke()
          ctx.strokeStyle = actual < 0 ? PALETTE.pHi : PALETTE.vel
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(x0 + 12, py)
          ctx.lineTo(x0 + 12 + actual, py)
          ctx.stroke()
        }
        ctx.strokeStyle = '#78716c'
        ctx.setLineDash([3, 4])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(shoulder.x * sx, shoulder.y * sy)
        ctx.lineTo(x0 - 12, y0 + 90)
        ctx.stroke()
        ctx.setLineDash([])
      }
    },
  }
}
