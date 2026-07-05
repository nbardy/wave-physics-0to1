// CPU Stable Fluids — Jos Stam's scheme (Stable Fluids, SIGGRAPH 1999; the
// game-oriented form in "Real-Time Fluid Dynamics for Games", GDC 2003).
// Named-solver honesty (METHODOLOGY §0 #4): this is the solver the article
// teaches, and the article says so.
//
// Grid: collocated nx×ny cells, one cell = one unit of length h=1; velocities
// in cells/second. Channel flow: inflow on the left at speed `inflow`, open
// outflow on the right, free-slip walls top/bottom, optional solid disc.
//
// One step = add forces → advect (semi-Lagrangian: unconditionally stable —
// backtrace and bilinearly interpolate; this is why the scheme cannot blow up
// the way the naive centered-difference update does) → diffuse (implicit
// Jacobi, stable for any ν·dt) → project (divergence → pressure Poisson via
// Jacobi → subtract ∇p). Each stage is individually toggleable because §11's
// marquee figure kills terms one at a time.

import { stampAirfoilMask } from './airfoil'

export interface SolverToggles {
  advect: boolean // (u·∇)u — the flow carries itself
  diffuse: boolean // ν∇²u — neighbours drag on neighbours
  project: boolean // -∇p/ρ with ∇·u = 0 — pressure keeps it incompressible
}

const DIFFUSE_ITERS = 12
const PRESSURE_ITERS = 40 // Jacobi sweeps per step; §10 exposes this as a knob

export class FluidSolver {
  readonly nx: number
  readonly ny: number
  u: Float32Array
  v: Float32Array
  dye: Float32Array
  dye2: Float32Array // second dye species (the wing's rose current); same physics as dye
  p: Float32Array
  div: Float32Array
  solid: Uint8Array
  private u0: Float32Array
  private v0: Float32Array
  private dye0: Float32Array

  inflow: number
  inflowLower: number // inflow speed for the lower half of the inlet; equals inflow unless a sim sets shear (Kelvin–Helmholtz)
  visc: number
  dyeDecay = 0.9995
  toggles: SolverToggles = { advect: true, diffuse: true, project: true }
  pressureIters = PRESSURE_ITERS

  constructor(nx: number, ny: number, inflow: number, visc: number) {
    this.nx = nx
    this.ny = ny
    this.inflow = inflow
    this.inflowLower = inflow
    this.visc = visc
    const n = nx * ny
    this.u = new Float32Array(n).fill(inflow)
    this.v = new Float32Array(n)
    this.dye = new Float32Array(n)
    this.dye2 = new Float32Array(n)
    this.p = new Float32Array(n)
    this.div = new Float32Array(n)
    this.solid = new Uint8Array(n)
    this.u0 = new Float32Array(n)
    this.v0 = new Float32Array(n)
    this.dye0 = new Float32Array(n)
  }

  idx(i: number, j: number) {
    return i + j * this.nx
  }

  /** Carve a solid disc; velocity is zeroed inside it every step (no-slip). */
  addDisc(cx: number, cy: number, r: number) {
    for (let j = 0; j < this.ny; j++) {
      for (let i = 0; i < this.nx; i++) {
        if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) this.solid[this.idx(i, j)] = 1
      }
    }
  }

  /** Replace the obstacle with an airfoil at the given tilt (clears any previous mask). */
  setAirfoil(pivotX: number, pivotY: number, chord: number, angleRad: number) {
    stampAirfoilMask(this.solid, this.nx, this.ny, pivotX, pivotY, chord, angleRad)
  }

  /** Continuous dye feed: a stripe of emitters on the inflow edge. */
  injectDyeStripe(rows: number[], amount = 1) {
    for (const j of rows) {
      const jj = Math.max(1, Math.min(this.ny - 2, j))
      this.dye[this.idx(1, jj)] = amount
      this.dye[this.idx(2, jj)] = amount
    }
  }

  /** Same feed for the second dye species. */
  injectDye2Stripe(rows: number[], amount = 1) {
    for (const j of rows) {
      const jj = Math.max(1, Math.min(this.ny - 2, j))
      this.dye2[this.idx(1, jj)] = amount
      this.dye2[this.idx(2, jj)] = amount
    }
  }

  /** A momentum push (click-to-stir). Radius in cells. */
  addImpulse(cx: number, cy: number, fx: number, fy: number, r = 4) {
    for (let j = Math.max(1, cy - r); j <= Math.min(this.ny - 2, cy + r); j++) {
      for (let i = Math.max(1, cx - r); i <= Math.min(this.nx - 2, cx + r); i++) {
        const fall = Math.exp(-((i - cx) ** 2 + (j - cy) ** 2) / (r * r * 0.5))
        const k = this.idx(i, j)
        this.u[k] += fx * fall
        this.v[k] += fy * fall
      }
    }
  }

  private sample(f: Float32Array, x: number, y: number): number {
    const cx = Math.min(Math.max(x, 0.5), this.nx - 1.5)
    const cy = Math.min(Math.max(y, 0.5), this.ny - 1.5)
    const i0 = Math.floor(cx)
    const j0 = Math.floor(cy)
    const tx = cx - i0
    const ty = cy - j0
    const a = f[this.idx(i0, j0)]
    const b = f[this.idx(i0 + 1, j0)]
    const c = f[this.idx(i0, j0 + 1)]
    const d = f[this.idx(i0 + 1, j0 + 1)]
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }

  /** Semi-Lagrangian advection: whose fluid arrives here? Trace back, interpolate. */
  private advectField(dst: Float32Array, src: Float32Array, dt: number) {
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const k = this.idx(i, j)
        const bx = i - dt * this.u[k]
        const by = j - dt * this.v[k]
        dst[k] = this.sample(src, bx, by)
      }
    }
  }

  /** Implicit diffusion via Jacobi: stable for any a = ν·dt (unlike explicit FTCS). */
  private diffuseField(dst: Float32Array, src: Float32Array, a: number) {
    dst.set(src)
    for (let iter = 0; iter < DIFFUSE_ITERS; iter++) {
      for (let j = 1; j < this.ny - 1; j++) {
        for (let i = 1; i < this.nx - 1; i++) {
          const k = this.idx(i, j)
          dst[k] =
            (src[k] +
              a * (dst[k - 1] + dst[k + 1] + dst[k - this.nx] + dst[k + this.nx])) /
            (1 + 4 * a)
        }
      }
    }
  }

  computeDivergence() {
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const k = this.idx(i, j)
        this.div[k] = 0.5 * (this.u[k + 1] - this.u[k - 1] + this.v[k + this.nx] - this.v[k - this.nx])
      }
    }
  }

  /**
   * Pressure projection: solve ∇²p = ∇·u* (Jacobi), then u -= ∇p.
   * Solid cells act as Neumann boundaries (mirror the center pressure).
   */
  project(iters = this.pressureIters) {
    this.computeDivergence()
    this.p.fill(0)
    const nx = this.nx
    for (let iter = 0; iter < iters; iter++) {
      for (let j = 1; j < this.ny - 1; j++) {
        for (let i = 1; i < nx - 1; i++) {
          const k = this.idx(i, j)
          if (this.solid[k]) continue
          const pl = this.solid[k - 1] ? this.p[k] : this.p[k - 1]
          const pr = this.solid[k + 1] ? this.p[k] : this.p[k + 1]
          const pd = this.solid[k - nx] ? this.p[k] : this.p[k - nx]
          const pu = this.solid[k + nx] ? this.p[k] : this.p[k + nx]
          this.p[k] = (pl + pr + pd + pu - this.div[k]) / 4
        }
      }
    }
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const k = this.idx(i, j)
        if (this.solid[k]) continue
        this.u[k] -= 0.5 * (this.p[k + 1] - this.p[k - 1])
        this.v[k] -= 0.5 * (this.p[k + nx] - this.p[k - nx])
      }
    }
  }

  private boundaries() {
    const nx = this.nx
    const ny = this.ny
    for (let j = 0; j < ny; j++) {
      // inflow: fixed stream on the left (upper/lower speeds may shear); outflow: copy on the right
      this.u[this.idx(0, j)] = j >= ny >> 1 ? this.inflowLower : this.inflow
      this.v[this.idx(0, j)] = 0
      this.u[this.idx(nx - 1, j)] = this.u[this.idx(nx - 2, j)]
      this.v[this.idx(nx - 1, j)] = this.v[this.idx(nx - 2, j)]
      this.dye[this.idx(nx - 1, j)] = this.dye[this.idx(nx - 2, j)]
      this.dye2[this.idx(nx - 1, j)] = this.dye2[this.idx(nx - 2, j)]
    }
    for (let i = 0; i < nx; i++) {
      // free-slip walls: no flow through, tangential flow allowed
      this.v[this.idx(i, 0)] = 0
      this.v[this.idx(i, ny - 1)] = 0
      this.u[this.idx(i, 0)] = this.u[this.idx(i, 1)]
      this.u[this.idx(i, ny - 1)] = this.u[this.idx(i, ny - 2)]
    }
    // no-slip solid
    for (let k = 0; k < this.solid.length; k++) {
      if (this.solid[k]) {
        this.u[k] = 0
        this.v[k] = 0
        this.dye[k] = 0
        this.dye2[k] = 0
      }
    }
  }

  step(dt: number) {
    const { advect, diffuse, project } = this.toggles

    if (diffuse) {
      const a = this.visc * dt
      this.u0.set(this.u)
      this.v0.set(this.v)
      this.diffuseField(this.u, this.u0, a)
      this.diffuseField(this.v, this.v0, a)
    }

    if (advect) {
      this.u0.set(this.u)
      this.v0.set(this.v)
      this.advectField(this.u, this.u0, dt)
      this.advectField(this.v, this.v0, dt)
    }

    this.boundaries()
    if (project) {
      this.project()
      this.boundaries()
    }

    // dye rides the (possibly un-projected) flow — that's the point in §9
    this.dye0.set(this.dye)
    this.advectField(this.dye, this.dye0, dt)
    for (let k = 0; k < this.dye.length; k++) this.dye[k] *= this.dyeDecay
    this.dye0.set(this.dye2)
    this.advectField(this.dye2, this.dye0, dt)
    for (let k = 0; k < this.dye2.length; k++) this.dye2[k] *= this.dyeDecay
  }
}

// ---------------------------------------------------------------- rendering

/** Render dye (amber) and dye2 (rose), solids (gray), optionally pressure or divergence tint. */
export class SolverRenderer {
  private off: HTMLCanvasElement
  private img: ImageData

  constructor(private solver: FluidSolver) {
    this.off = document.createElement('canvas')
    this.off.width = solver.nx
    this.off.height = solver.ny
    this.img = new ImageData(solver.nx, solver.ny)
  }

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    overlay: 'none' | 'pressure' | 'divergence' = 'none',
  ) {
    const s = this.solver
    const d = this.img.data
    for (let k = 0; k < s.dye.length; k++) {
      const o = k * 4
      if (s.solid[k]) {
        d[o] = 107
        d[o + 1] = 114
        d[o + 2] = 128 // wall gray
        d[o + 3] = 255
        continue
      }
      // base: background darkened toward amber by dye and toward rose by dye2 —
      // subtractive, so overlap blends like real dyes instead of one hiding the other
      const t1 = Math.min(s.dye[k], 1)
      const t2 = Math.min(s.dye2[k], 1)
      let r = Math.max(0, 247 - t1 * (247 - 217) - t2 * (247 - 219))
      let g = Math.max(0, 249 - t1 * (249 - 119) - t2 * (249 - 39))
      let b = Math.max(0, 252 - t1 * (252 - 6) - t2 * (252 - 119))
      if (overlay === 'pressure') {
        const pv = Math.max(-1, Math.min(1, s.p[k] * 4))
        if (pv > 0) {
          r = r + (220 - r) * pv
          g = g * (1 - 0.6 * pv)
          b = b * (1 - 0.7 * pv)
        } else {
          const q = -pv
          r = r * (1 - 0.7 * q)
          g = g + (145 - g) * q * 0.6
          b = b + (178 - b) * q * 0.4
        }
      } else if (overlay === 'divergence') {
        const dv = Math.min(Math.abs(s.div[k]) * 6, 1)
        r = r + (124 - r) * dv
        g = g + (58 - g) * dv
        b = b + (237 - b) * dv // violet — the crime
      }
      d[o] = r
      d[o + 1] = g
      d[o + 2] = b
      d[o + 3] = 255
    }
    const octx = this.off.getContext('2d')
    if (!octx) return
    octx.putImageData(this.img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.off, 0, 0, w, h)
  }
}
