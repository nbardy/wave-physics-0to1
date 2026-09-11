import { NX as WORLD_NX, NY as WORLD_NY, U as WORLD_U, DT } from './wing'
import { createWingProjector, type FaceFlow } from './pressure'

// The MAC solve uses 108×54 cells; vector parcels/body render at screen resolution.
// Scale BOTH speed and viscosity so Re and physical time survive coarsening.
export const WAKE_SPACING = 2
const NX = WORLD_NX / WAKE_SPACING, NY = WORLD_NY / WAKE_SPACING, U = WORLD_U / WAKE_SPACING
const ui = (x: number, y: number) => x + y * (NX + 1)
const vi = (x: number, y: number) => x + y * NX

// Stable-Fluids splitting on a MAC grid: carry velocity, diffuse it, project.
// Semi-Lagrangian transport is bounded (MacCormack correction limited to the
// departure stencil); diffusion is implicit. Fixed DT, independent of RAF.
// Pressure uses matched face-gradient/cell-divergence operators and a measured
// residual. No vorticity confinement, prescribed wake, or random velocity force.
export class WakeSolver {
  readonly nx = NX
  readonly ny = NY
  readonly projector = createWingProjector(NX, NY, WAKE_SPACING)
  readonly solid = this.projector.solid
  readonly discs: { cx: number; cy: number; r: number }[] = []
  readonly faces: FaceFlow = { u: new Float64Array((NX + 1) * NY), v: new Float64Array(NX * (NY + 1)) }
  readonly dye = new Float32Array(NX * NY)
  readonly dye2 = new Float32Array(NX * NY)
  readonly u = new Float32Array(NX * NY)
  readonly v = new Float32Array(NX * NY)
  readonly p = new Float32Array(NX * NY)
  readonly div = new Float32Array(NX * NY)
  private readonly nextU = new Float64Array(this.faces.u.length)
  private readonly nextV = new Float64Array(this.faces.v.length)
  private readonly forward = new Float64Array((NX + 1) * (NY + 1))
  private readonly nextDye = new Float64Array(NX * NY)
  private readonly source = new Float64Array((NX + 1) * (NY + 1))
  lastProjection = { relativeResidual: 0, iterations: 0 }
  constructor(readonly visc: number) {
    for (let k = 0; k < this.faces.u.length; k++) this.faces.u[k] = this.projector.freeU[k] ? U : 0
    this.lastProjection = this.projector.project(this.faces, 1e-7)
    this.centers()
  }
  idx(x: number, y: number) { return x + y * NX }
  private sample(a: ArrayLike<number>, w: number, h: number, x: number, y: number) {
    x = Math.max(0, Math.min(w - 1.000001, x)); y = Math.max(0, Math.min(h - 1.000001, y))
    const i = Math.floor(x), j = Math.floor(y), tx = x - i, ty = y - j, k = i + j * w
    return (1 - ty) * ((1 - tx) * a[k] + tx * a[k + 1]) + ty * ((1 - tx) * a[k + w] + tx * a[k + w + 1])
  }
  private latticeVelocity(x: number, y: number) {
    return { x: this.sample(this.faces.u, NX + 1, NY, x, y - .5), y: this.sample(this.faces.v, NX, NY + 1, x - .5, y) }
  }
  velocity(x: number, y: number) {
    const v = this.latticeVelocity(x / WAKE_SPACING, y / WAKE_SPACING)
    return { x: v.x * WAKE_SPACING, y: v.y * WAKE_SPACING }
  }
  private departure(x: number, y: number, dt: number) {
    const a = this.latticeVelocity(x, y), b = this.latticeVelocity(x - .5 * dt * a.x, y - .5 * dt * a.y)
    return { x: x - dt * b.x, y: y - dt * b.y }
  }
  private transport(dst: Float64Array, src: ArrayLike<number>, w: number, h: number, ox: number, oy: number, dt: number) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const b = this.departure(x + ox, y + oy, dt)
      this.forward[x + y * w] = this.sample(src, w, h, b.x - ox, b.y - oy)
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = x + y * w, b = this.departure(x + ox, y + oy, dt), f = this.departure(x + ox, y + oy, -dt)
      const back = this.sample(this.forward, w, h, f.x - ox, f.y - oy)
      const px = Math.max(0, Math.min(w - 1.000001, b.x - ox)), py = Math.max(0, Math.min(h - 1.000001, b.y - oy))
      const q = Math.floor(px) + Math.floor(py) * w
      const lo = Math.min(src[q], src[q + 1], src[q + w], src[q + w + 1]), hi = Math.max(src[q], src[q + 1], src[q + w], src[q + w + 1])
      dst[k] = Math.max(lo, Math.min(hi, this.forward[k] + .5 * (src[k] - back)))
    }
  }
  private boundaries() {
    const { u, v } = this.faces
    for (let k = 0; k < u.length; k++) if (!this.projector.freeU[k]) u[k] = 0
    for (let k = 0; k < v.length; k++) if (!this.projector.freeV[k]) v[k] = 0
    for (let y = 0; y < NY; y++) { u[ui(0, y)] = U; u[ui(NX, y)] = u[ui(NX - 1, y)] }
    for (let y = 1; y < NY; y++) { v[vi(0, y)] = 0; v[vi(NX - 1, y)] = v[vi(NX - 2, y)] }
  }
  private diffuse(a: Float64Array, w: number, h: number, free: Uint8Array, dt: number, horizontal: boolean) {
    this.source.set(a)
    const alpha = this.visc * dt / (WAKE_SPACING * WAKE_SPACING)
    // Keep solid faces zero DURING every sweep. Letting them acquire velocity
    // during diffusion and zeroing only afterwards weakens the wall condition.
    const iters = Math.max(12, Math.ceil(12 * alpha))
    for (let iter = 0; iter < iters; iter++) {
      let change = 0
      for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) {
        const k = x + y * w
        if (!free[k]) { a[k] = 0; continue }
        const value = (this.source[k] + alpha * (a[k - 1] + a[k + 1] + a[k + (y > 0 ? -w : 0)] + a[k + (y < h - 1 ? w : 0)])) / (1 + 4 * alpha)
        change = Math.max(change, Math.abs(value - a[k])); a[k] = value
      }
      for (let y = 0; y < h; y++) { a[y * w] = horizontal ? U : 0; a[w - 1 + y * w] = a[w - 2 + y * w] }
      if (change < U * 1e-6) break
    }
  }
  private centers() {
    const { u, v } = this.faces
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const k = this.idx(x, y)
      this.u[k] = (u[ui(x, y)] + u[ui(x + 1, y)]) * WAKE_SPACING / 2
      this.v[k] = (v[vi(x, y)] + v[vi(x, y + 1)]) * WAKE_SPACING / 2
      this.div[k] = u[ui(x + 1, y)] - u[ui(x, y)] + v[vi(x, y + 1)] - v[vi(x, y)]
      this.p[k] = this.projector.pressure[k]
    }
  }
  injectDyeStripe(rows: number[], amount = 1) { for (const y of rows) this.dye[this.idx(1, Math.floor(y / WAKE_SPACING))] = amount }
  injectDye2Stripe(rows: number[], amount = 1) { for (const y of rows) this.dye2[this.idx(1, Math.floor(y / WAKE_SPACING))] = amount }
  step(dt = DT) {
    this.transport(this.nextU, this.faces.u, NX + 1, NY, 0, .5, dt)
    this.transport(this.nextV, this.faces.v, NX, NY + 1, .5, 0, dt)
    this.faces.u.set(this.nextU); this.faces.v.set(this.nextV); this.boundaries()
    this.diffuse(this.faces.u, NX + 1, NY, this.projector.freeU, dt, true)
    this.diffuse(this.faces.v, NX, NY + 1, this.projector.freeV, dt, false)
    this.boundaries()
    this.lastProjection = this.projector.project(this.faces, 1e-5)
    if (!Number.isFinite(this.lastProjection.relativeResidual) || this.lastProjection.relativeResidual > 1e-4) throw new Error('Wake pressure solve did not converge')
    // No boundary overwrite after projection: that would reintroduce divergence.
    this.centers()
    for (const dye of [this.dye, this.dye2]) {
      this.transport(this.nextDye, dye, NX, NY, .5, .5, dt)
      for (let k = 0; k < dye.length; k++) dye[k] = this.solid[k] ? 0 : this.nextDye[k] * .9995
    }
  }
}
