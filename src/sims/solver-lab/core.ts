// A small periodic MAC grid for the construction lesson. u and v live on cell
// faces; dye and pressure live at cell centres. Unit cell spacing, rho = 1.
// The gradient and divergence are an adjoint pair: D G is EXACTLY this Laplacian.
// No obstacles, inlet, or outlet: opposite edges join. This is a different domain
// from the article's wind tunnel, deliberately small enough to inspect cell by cell.
export const LAB_DT = 1 / 40
export type Operation = 'carry' | 'smooth' | 'pressure'
export class LabFluid {
  readonly n: number
  u: Float64Array
  v: Float64Array
  dye: Float64Array
  rose: Float64Array
  pressure: Float64Array
  constructor(readonly nx = 48, readonly ny = 32) {
    this.n = nx * ny
    this.u = new Float64Array(this.n)
    this.v = new Float64Array(this.n)
    this.dye = new Float64Array(this.n)
    this.rose = new Float64Array(this.n)
    this.pressure = new Float64Array(this.n)
  }
  index(i: number, j: number) { return ((j % this.ny + this.ny) % this.ny) * this.nx + (i % this.nx + this.nx) % this.nx }
  sample(a: Float64Array, x: number, y: number) {
    const i = Math.floor(x), j = Math.floor(y), tx = x - i, ty = y - j
    return (1 - ty) * ((1 - tx) * a[this.index(i, j)] + tx * a[this.index(i + 1, j)]) +
      ty * ((1 - tx) * a[this.index(i, j + 1)] + tx * a[this.index(i + 1, j + 1)])
  }
  velocity(x: number, y: number): [number, number] {
    return [this.sample(this.u, x, y - .5), this.sample(this.v, x - .5, y)]
  }
  clone() {
    const f = new LabFluid(this.nx, this.ny)
    for (const key of ['u', 'v', 'dye', 'rose', 'pressure'] as const) f[key].set(this[key])
    return f
  }
  seed() {
    // A discrete curl of a periodic streamfunction is divergence-free to roundoff.
    const psi = (i: number, j: number) => {
      const x = 2 * Math.PI * i / this.nx, y = 2 * Math.PI * j / this.ny
      return this.ny * (1.8 * Math.sin(x) * Math.sin(y) + .4 * Math.cos(2 * x + y))
    }
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = this.index(i, j)
      this.u[k] = 5 + psi(i, j + 1) - psi(i, j)
      this.v[k] = -psi(i + 1, j) + psi(i, j)
      const x = (i + .5) / this.nx, y = (j + .5) / this.ny
      this.dye[k] = x > .16 && x < .48 && y > .15 && y < .43 ? 1 : 0
      this.rose[k] = x > .52 && x < .84 && y > .57 && y < .85 ? 1 : 0
    }
    return this
  }
  push(x = .5, y = .5, dx = 0, dy = -10) {
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = this.index(i, j)
      const g = (xx: number, yy: number) => Math.exp(-((xx / this.nx - x) ** 2 + (yy / this.ny - y) ** 2) / .008)
      this.u[k] += dx * g(i, j + .5)
      this.v[k] += dy * g(i + .5, j)
    }
  }
  transport(a: Float64Array, ox: number, oy: number, dt: number) {
    const out = new Float64Array(this.n)
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const x = i + ox, y = j + oy
      const [u, v] = this.velocity(x, y)
      const [um, vm] = this.velocity(x - .5 * dt * u, y - .5 * dt * v)
      out[this.index(i, j)] = this.sample(a, x - dt * um - ox, y - dt * vm - oy)
    }
    return out
  }
  carry(dt: number) {
    const u = this.transport(this.u, 0, .5, dt), v = this.transport(this.v, .5, 0, dt)
    this.u = u; this.v = v
  }
  carryDye(dt: number) {
    this.dye = this.transport(this.dye, .5, .5, dt)
    this.rose = this.transport(this.rose, .5, .5, dt)
  }
  smooth(dt: number, viscosity: number) {
    // Explicit 2D diffusion is a convex average for alpha <= 1/4. Substeps keep
    // alpha <= .2 for every allowed viscosity; the physics dt stays fixed.
    const count = Math.max(1, Math.ceil(dt * viscosity / .2)), alpha = dt * viscosity / count
    for (let s = 0; s < count; s++) for (const key of ['u', 'v'] as const) {
      const a = this[key], out = new Float64Array(this.n)
      for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
        const k = this.index(i, j)
        out[k] = (1 - 4 * alpha) * a[k] + alpha * (a[this.index(i - 1, j)] + a[this.index(i + 1, j)] + a[this.index(i, j - 1)] + a[this.index(i, j + 1)])
      }
      this[key] = out
    }
  }
  divergence() {
    const d = new Float64Array(this.n)
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = this.index(i, j)
      d[k] = this.u[this.index(i + 1, j)] - this.u[k] + this.v[this.index(i, j + 1)] - this.v[k]
    }
    return d
  }
  correct(p: Float64Array, amount = 1) {
    for (let k = 0; k < this.n; k++) this.pressure[k] = amount * p[k]
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = this.index(i, j)
      this.u[k] -= amount * (p[k] - p[this.index(i - 1, j)])
      this.v[k] -= amount * (p[k] - p[this.index(i, j - 1)])
    }
  }
  project() {
    // CG on -D G, positive definite on the zero-mean subspace. Pressure's
    // arbitrary constant is fixed to zero mean. Relative residual < 1e-9.
    const d = this.divergence(), p = new Float64Array(this.n)
    const mean = d.reduce((a, b) => a + b, 0) / this.n
    let r = Float64Array.from(d, v => -v + mean), q = r.slice()
    let rr = dot(r, r), initial = rr
    for (let it = 0; it < 220 && rr > Math.max(1e-22, initial * 1e-18); it++) {
      const aq = new Float64Array(this.n)
      for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
        const k = this.index(i, j)
        aq[k] = 4 * q[k] - q[this.index(i - 1, j)] - q[this.index(i + 1, j)] - q[this.index(i, j - 1)] - q[this.index(i, j + 1)]
      }
      const alpha = rr / dot(q, aq)
      for (let k = 0; k < this.n; k++) { p[k] += alpha * q[k]; r[k] -= alpha * aq[k] }
      const next = dot(r, r), beta = next / rr
      for (let k = 0; k < this.n; k++) q[k] = r[k] + beta * q[k]
      rr = next
    }
    this.correct(p)
  }
  tick(viscosity = 2, omit?: Operation) {
    if (omit !== 'carry') this.carry(LAB_DT)
    if (omit !== 'smooth') this.smooth(LAB_DT, viscosity)
    if (omit !== 'pressure') this.project()
    this.carryDye(LAB_DT)
  }
  metrics() {
    return { divergence: Math.sqrt(dot(this.divergence(), this.divergence()) / this.n), energy: .5 * (dot(this.u, this.u) + dot(this.v, this.v)) / this.n }
  }
}
export const dot = (a: Float64Array, b: Float64Array) => a.reduce((s, v, i) => s + v * b[i], 0)

export function projectionInput() {
  const f = new LabFluid(24, 16).seed()
  // Add a pure pressure-gradient component to a known solenoidal field. A LOW
  // potential at the centre has an OUTWARD gradient, removed by an inward push.
  const p = new Float64Array(f.n)
  for (let j = 0; j < f.ny; j++) for (let i = 0; i < f.nx; i++) {
    p[f.index(i, j)] = -20 * Math.exp(-((i - 11.5) ** 2 + (j - 7.5) ** 2) / 12)
  }
  f.correct(p, -1)
  f.pressure.fill(0)
  return f
}

export function relaxationFrames(max = 160) {
  const base = projectionInput(), rhs = base.divergence(), p = new Float64Array(base.n)
  const frames = [base.clone()]
  for (let n = 1; n <= max; n++) {
    for (let j = 0; j < base.ny; j++) for (let i = 0; i < base.nx; i++) {
      p[base.index(i, j)] = .25 * (p[base.index(i - 1, j)] + p[base.index(i + 1, j)] + p[base.index(i, j - 1)] + p[base.index(i, j + 1)] - rhs[base.index(i, j)])
    }
    const mean = p.reduce((a, b) => a + b, 0) / base.n
    for (let k = 0; k < base.n; k++) p[k] -= mean
    const f = base.clone(); f.correct(p); frames.push(f)
  }
  return frames
}

export function cycleFrames() {
  const f = new LabFluid(32, 20).seed(), frames = [f.clone()]
  f.push(); frames.push(f.clone())
  f.carry(LAB_DT); frames.push(f.clone())
  f.smooth(LAB_DT, 8); frames.push(f.clone())
  f.project(); frames.push(f.clone())
  f.carryDye(LAB_DT); frames.push(f.clone())
  return frames
}
