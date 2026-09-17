// Tesla-valve feasibility on a residual-gated MAC solver: a faithful port of
// src/sims/history/{pressure,wake}.ts with the mask, grid, and speed as
// parameters instead of the wing's constants. Same splitting, same IC(0)-PCG.
type P = { x: number; y: number }
interface FaceFlow { u: Float64Array; v: Float64Array }

function createProjector(NX: number, NY: number, isSolid: (cx: number, cy: number) => boolean) {
  const ui = (x: number, y: number) => x + y * (NX + 1)
  const vi = (x: number, y: number) => x + y * NX
  const n = NX * NY, solid = new Uint8Array(n)
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) solid[x + y * NX] = isSolid(x + .5, y + .5) ? 1 : 0
  const freeU = new Uint8Array((NX + 1) * NY), freeV = new Uint8Array(NX * (NY + 1))
  for (let y = 0; y < NY; y++) for (let x = 0; x <= NX; x++)
    freeU[ui(x, y)] = !((x > 0 && solid[x - 1 + y * NX]) || (x < NX && solid[x + y * NX])) ? 1 : 0
  for (let y = 1; y < NY; y++) for (let x = 0; x < NX; x++)
    freeV[vi(x, y)] = !solid[x + (y - 1) * NX] && !solid[x + y * NX] ? 1 : 0
  const diagonal = new Float64Array(n), factor = new Float64Array(n)
  const west = new Int32Array(n).fill(-1), east = west.slice(), north = west.slice(), south = west.slice()
  const cells: number[] = []
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const k = x + y * NX
    if (solid[k]) continue
    cells.push(k)
    if (x > 0 && !solid[k - 1]) { west[k] = k - 1; diagonal[k]++ }
    if (x < NX - 1 && !solid[k + 1]) { east[k] = k + 1; diagonal[k]++ }
    if (y > 0 && !solid[k - NX]) { north[k] = k - NX; diagonal[k]++ }
    if (y < NY - 1 && !solid[k + NX]) { south[k] = k + NX; diagonal[k]++ }
    if (x === NX - 1) diagonal[k]++
    factor[k] = diagonal[k] - (west[k] >= 0 ? 1 / factor[west[k]] : 0) - (north[k] >= 0 ? 1 / factor[north[k]] : 0)
  }
  const rhs = new Float64Array(n), residual = rhs.slice(), direction = rhs.slice(), z = rhs.slice(), product = rhs.slice(), pressure = rhs.slice()
  const apply = (a: Float64Array, out: Float64Array) => {
    for (const k of cells) out[k] = diagonal[k] * a[k] - (west[k] >= 0 ? a[west[k]] : 0) - (east[k] >= 0 ? a[east[k]] : 0) - (north[k] >= 0 ? a[north[k]] : 0) - (south[k] >= 0 ? a[south[k]] : 0)
  }
  const dot = (a: Float64Array, b: Float64Array) => { let v = 0; for (const k of cells) v += a[k] * b[k]; return v }
  const precondition = () => {
    for (const k of cells) z[k] = residual[k] + (west[k] >= 0 ? z[west[k]] / factor[west[k]] : 0) + (north[k] >= 0 ? z[north[k]] / factor[north[k]] : 0)
    for (let i = cells.length - 1; i >= 0; i--) {
      const k = cells[i]
      z[k] = (z[k] + (east[k] >= 0 ? z[east[k]] : 0) + (south[k] >= 0 ? z[south[k]] : 0)) / factor[k]
    }
  }
  return {
    solid, freeU, freeV, pressure, cells,
    project(flow: FaceFlow, tolerance = 1e-9) {
      const { u, v } = flow
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
        const k = x + y * NX
        rhs[k] = solid[k] ? 0 : -(u[ui(x + 1, y)] - u[ui(x, y)] + v[vi(x, y + 1)] - v[vi(x, y)])
      }
      apply(pressure, product)
      for (const k of cells) residual[k] = rhs[k] - product[k]
      const norm = Math.sqrt(dot(rhs, rhs)), target = Math.max(1e-10, norm * tolerance)
      precondition(); direction.set(z)
      let rz = dot(residual, z), error = Math.sqrt(dot(residual, residual)), iterations = 0
      while (error > target && iterations < 3000) {
        apply(direction, product)
        const alpha = rz / dot(direction, product)
        for (const k of cells) { pressure[k] += alpha * direction[k]; residual[k] -= alpha * product[k] }
        precondition()
        const next = dot(residual, z), beta = next / rz
        for (const k of cells) direction[k] = z[k] + beta * direction[k]
        rz = next; error = Math.sqrt(dot(residual, residual)); iterations++
      }
      for (let y = 0; y < NY; y++) for (let x = 1; x <= NX; x++) {
        if (freeU[ui(x, y)]) u[ui(x, y)] -= (x < NX ? pressure[x + y * NX] : 0) - pressure[x - 1 + y * NX]
      }
      for (let y = 1; y < NY; y++) for (let x = 0; x < NX; x++) {
        if (freeV[vi(x, y)]) v[vi(x, y)] -= pressure[x + y * NX] - pressure[x + (y - 1) * NX]
      }
      return { relativeResidual: error / Math.max(norm, 1e-10), iterations }
    },
  }
}

class ChannelSolver {
  readonly projector
  readonly solid: Uint8Array
  readonly faces: FaceFlow
  private readonly nextU: Float64Array; private readonly nextV: Float64Array
  private readonly forward: Float64Array; private readonly source: Float64Array
  lastProjection = { relativeResidual: 0, iterations: 0 }
  constructor(readonly NX: number, readonly NY: number, readonly U: number, readonly visc: number, isSolid: (cx: number, cy: number) => boolean) {
    this.projector = createProjector(NX, NY, isSolid)
    this.solid = this.projector.solid
    this.faces = { u: new Float64Array((NX + 1) * NY), v: new Float64Array(NX * (NY + 1)) }
    this.nextU = new Float64Array(this.faces.u.length); this.nextV = new Float64Array(this.faces.v.length)
    this.forward = new Float64Array((NX + 1) * (NY + 1)); this.source = new Float64Array((NX + 1) * (NY + 1))
    for (let k = 0; k < this.faces.u.length; k++) this.faces.u[k] = this.projector.freeU[k] ? U : 0
    this.lastProjection = this.projector.project(this.faces, 1e-7)
  }
  private ui(x: number, y: number) { return x + y * (this.NX + 1) }
  private vi(x: number, y: number) { return x + y * this.NX }
  private sample(a: ArrayLike<number>, w: number, h: number, x: number, y: number) {
    x = Math.max(0, Math.min(w - 1.000001, x)); y = Math.max(0, Math.min(h - 1.000001, y))
    const i = Math.floor(x), j = Math.floor(y), tx = x - i, ty = y - j, k = i + j * w
    return (1 - ty) * ((1 - tx) * a[k] + tx * a[k + 1]) + ty * ((1 - tx) * a[k + w] + tx * a[k + w + 1])
  }
  private latticeVelocity(x: number, y: number) {
    const { NX, NY } = this
    return { x: this.sample(this.faces.u, NX + 1, NY, x, y - .5), y: this.sample(this.faces.v, NX, NY + 1, x - .5, y) }
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
    const { u, v } = this.faces, { NX, NY, U } = this
    for (let k = 0; k < u.length; k++) if (!this.projector.freeU[k]) u[k] = 0
    for (let k = 0; k < v.length; k++) if (!this.projector.freeV[k]) v[k] = 0
    for (let y = 0; y < NY; y++) { if (this.projector.freeU[this.ui(0, y)]) u[this.ui(0, y)] = U; u[this.ui(NX, y)] = u[this.ui(NX - 1, y)] }
    for (let y = 1; y < NY; y++) { v[this.vi(0, y)] = 0; v[this.vi(NX - 1, y)] = v[this.vi(NX - 2, y)] }
  }
  // no-slip only: a solid neighbour face reads zero.
  private diffuse(a: Float64Array, w: number, h: number, free: Uint8Array, dt: number, horizontal: boolean) {
    this.source.set(a)
    const alpha = this.visc * dt
    const iters = Math.max(12, Math.ceil(12 * alpha))
    for (let iter = 0; iter < iters; iter++) {
      let change = 0
      for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) {
        const k = x + y * w
        if (!free[k]) { a[k] = 0; continue }
        const up = k + (y > 0 ? -w : 0), down = k + (y < h - 1 ? w : 0)
        const sum = a[k - 1] + a[k + 1] + a[up] + a[down]
        const value = (this.source[k] + alpha * sum) / (1 + 4 * alpha)
        change = Math.max(change, Math.abs(value - a[k])); a[k] = value
      }
      for (let y = 0; y < h; y++) { a[y * w] = horizontal && free[y * w] ? this.U : 0; a[w - 1 + y * w] = a[w - 2 + y * w] }
      if (change < this.U * 1e-6) break
    }
  }
  step(dt: number) {
    const { NX, NY } = this
    this.transport(this.nextU, this.faces.u, NX + 1, NY, 0, .5, dt)
    this.transport(this.nextV, this.faces.v, NX, NY + 1, .5, 0, dt)
    this.faces.u.set(this.nextU); this.faces.v.set(this.nextV); this.boundaries()
    this.diffuse(this.faces.u, NX + 1, NY, this.projector.freeU, dt, true)
    this.diffuse(this.faces.v, NX, NY + 1, this.projector.freeV, dt, false)
    this.boundaries()
    this.lastProjection = this.projector.project(this.faces, 1e-5)
    if (!Number.isFinite(this.lastProjection.relativeResidual) || this.lastProjection.relativeResidual > 1e-4) throw new Error('pressure solve did not converge')
  }
  columnPressure(x: number) {
    let s = 0, n = 0
    for (let y = 0; y < this.NY; y++) { const k = x + y * this.NX; if (!this.solid[k]) { s += this.projector.pressure[k]; n++ } }
    return s / n
  }
  columnFlux(x: number) {
    let f = 0
    for (let y = 0; y < this.NY; y++) if (this.projector.freeU[this.ui(x, y)]) f += this.faces.u[this.ui(x, y)]
    return f
  }
}

// ---- the valve ----
const NX = 300, NY = 52, YC = 40, R = 6, U = 30, DT = 1 / 60
const STEPS = Number(process.env.STEPS ?? 1000), AVG = 240
function stage(x0: number): P[] {
  const p = (dx: number, dy: number) => ({ x: x0 + dx, y: YC - dy })
  return [p(34, 0), p(26, 8), p(20, 18), p(24, 28), p(36, 32), p(50, 30), p(58, 22), p(62, 12), p(66, 4), p(74, 0)]
}
function capsuleHit(c: P, a: P, b: P, r: number): boolean {
  const abx = b.x - a.x, aby = b.y - a.y
  const t = Math.max(0, Math.min(1, ((c.x - a.x) * abx + (c.y - a.y) * aby) / (abx * abx + aby * aby)))
  const dx = c.x - (a.x + t * abx), dy = c.y - (a.y + t * aby)
  return dx * dx + dy * dy <= r * r
}
function fluidTest(loops: boolean, mirror: boolean) {
  const paths: P[][] = [[{ x: -10, y: YC }, { x: NX + 10, y: YC }]]
  if (loops) for (const x0 of [70, 130, 190]) paths.push(stage(x0))
  return (cx: number, cy: number) => {
    const c = { x: mirror ? NX - cx : cx, y: cy }
    for (const path of paths) for (let k = 0; k + 1 < path.length; k++) if (capsuleHit(c, path[k], path[k + 1], R)) return false
    return true
  }
}
function run(loops: boolean, mirror: boolean, visc: number) {
  const solid = fluidTest(loops, mirror)
  const s = new ChannelSolver(NX, NY, U, visc, solid)
  let dp = 0, flux = 0, iters = 0
  for (let t = 0; t < STEPS; t++) {
    s.step(DT); iters += s.lastProjection.iterations
    if (t >= STEPS - AVG) { dp += s.columnPressure(20) - s.columnPressure(NX - 20); flux += s.columnFlux(NX - 20) }
  }
  return { dp: dp / AVG, flux: flux / AVG, inlet: s.columnFlux(0), cg: iters / STEPS }
}
console.log(`grid ${NX}x${NY}, channel width ${2 * R}, U=${U} cells/s, dt=1/60, steps=${STEPS} (avg last ${AVG}); MAC + IC(0)-PCG to 1e-5`)
console.log('K = (dphi/dt) / (U^2/2), the loss coefficient.  Di = K_reverse / K_forward.\n')
console.log('case      nu      Re    K_fwd   K_rev     Di    flux_out/in fwd,rev   cg/step')
const t0 = Date.now()
for (const [label, loops, viscs] of [['plain', false, [72]], ['valve', true, [360, 72, 7.2, 1.8, 0.72, 0.36]]] as const) {
  for (const visc of viscs) {
    const re = U * 2 * R / visc
    const f = run(loops, false, visc), r = run(loops, true, visc)
    const K = (x: { dp: number }) => x.dp / DT / (.5 * U * U)
    console.log(`${label.padEnd(6)} ${visc.toString().padStart(6)} ${re.toFixed(0).padStart(6)} ${K(f).toFixed(3).padStart(8)} ${K(r).toFixed(3).padStart(8)} ${(K(r) / K(f)).toFixed(3).padStart(7)}   ${(f.flux / f.inlet).toFixed(3)}, ${(r.flux / r.inlet).toFixed(3)}    ${f.cg.toFixed(0)}/${r.cg.toFixed(0)}   [${((Date.now() - t0) / 1000).toFixed(0)}s]`)
  }
}
