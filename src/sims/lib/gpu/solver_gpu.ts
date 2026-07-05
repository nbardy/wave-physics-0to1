// GPU Stable Fluids — the same scheme as lib/solver.ts (Stam 1999), one WGSL
// kernel per solver method. Read the two files side by side: `bilerp_*` is
// `sample()`, the advect kernels are `advectField()`, and so on. Where they
// differ, the difference is stated here:
//
//  - Advection is MacCormack-corrected (Selle, Fedkiw et al. 2008): advect
//    forward, advect the result backward, and add half the round-trip error
//    — cancelling the first-order smearing — then clamp to the backtrace
//    stencil's min/max, which keeps the scheme unconditionally stable.
//    This is not a style choice: plain semi-Lagrangian advection acts like a
//    large artificial viscosity, and (measured, this repo) the cylinder wake
//    then sits perfectly steady at any slider Re — no Kármán street. The
//    CPU reference keeps the first-order scheme; §8's AdvectionSchemes
//    figure is where the lesson talks about interpolation error.
//
//  - The CPU "Jacobi" loops update in place, reading freshly-written
//    neighbors — which silently makes them Gauss–Seidel sweeps. Parallel
//    threads can't do that (a thread would race its neighbor), so the GPU
//    runs *true* Jacobi ping-pong for diffusion, and the pressure Poisson
//    solve is a geometric MULTIGRID V-cycle with Jacobi smoothing. Multigrid
//    is load-bearing, not an optimization (measured, this repo): a parallel
//    Jacobi sweep moves pressure information ONE cell, so any real-time sweep
//    budget leaves the wake's ~4·D-wavelength pressure mode unconverged, and
//    that unresolved divergence damps the Kármán instability to a standstill
//    — kick the wake and the oscillation rings down (σ ratio 0.10 at 80
//    sweeps, 0.48 at 400) instead of growing (1.0 at 800, 2.5 at 2000).
//    The CPU never hit this because a *sequential* Gauss–Seidel sweep
//    carries information across the whole grid in one pass.
//
//  - Every read-everything/write-everything pass (advection, Jacobi) is a
//    src→dst pair with a swap, exactly like the CPU's u0/dye0 scratch copies.
//
// Stability: semi-Lagrangian advection is unconditionally stable (backtrace +
// interpolate can never amplify), and diffusion is implicit (stable for any
// ν·dt) — so no timestep restriction; FIXED_DT is chosen for motion quality,
// not stability, same contract as the CPU solver.

import { f32Buffer, u32Buffer, FieldPair, Kernel } from './compute'
import { stampAirfoilMask } from '../airfoil'
import type { SolverToggles } from '../solver'

export interface GpuSolverConfig {
  nx: number
  ny: number
  inflow: number // cells/s, fixed on the left edge (upper half when shearing)
  inflowLower: number // cells/s, lower half of the inlet — pass `inflow` for a uniform stream
  visc: number // ν in cells²/s (mutable per step via .visc)
  dyeRows: number[] // inflow-edge emitter rows (amber)
  dye2Rows: number[] // inflow-edge emitter rows for the second dye (rose) — [] for none
  toggles: SolverToggles
}

const DIFFUSE_ITERS = 12
// V-cycles per projection. 2 cycles reach CPU-reference residual with full
// long-wavelength convergence; see the header on why flat Jacobi cannot.
const V_CYCLES = 2
const MG_SMOOTH = 3 // pre/post smoothing sweeps per level
const MG_COARSE_SWEEPS = 60 // coarsest grid is ~36×22; this is effectively exact
const WG = 8 // workgroup edge; dispatch code in compute.ts assumes 8×8

export class FluidSolverGPU {
  readonly nx: number
  readonly ny: number
  visc: number
  inflow: number
  inflowLower: number
  dyeDecay = 0.9995
  toggles: SolverToggles

  readonly device: GPUDevice
  readonly u: FieldPair
  readonly v: FieldPair
  readonly dye: FieldPair
  readonly dye2: FieldPair // second dye species; zero everywhere unless dye2Rows feed it
  readonly p: FieldPair
  readonly div: GPUBuffer
  readonly solidBuf: GPUBuffer
  private readonly solid: Uint32Array // CPU-side mirror, uploaded once per edit
  private readonly uScratch: GPUBuffer // Jacobi src term (the CPU's u0/v0)
  private readonly vScratch: GPUBuffer
  private readonly uHat: GPUBuffer // MacCormack forward-pass fields
  private readonly vHat: GPUBuffer
  private readonly dyeHat: GPUBuffer // shared by dye and dye2: in-pass dispatch order serializes them
  private readonly dyeRowsBuf: GPUBuffer
  private readonly nDyeRows: number
  private readonly dye2RowsBuf: GPUBuffer
  private readonly nDye2Rows: number
  private readonly params: GPUBuffer
  private readonly paramsData = new Float32Array(12)
  private impulse: { x: number; y: number; fx: number; fy: number; r: number } | null = null

  private readonly k: SolverKernels
  private readonly mg: MultigridPoisson

  constructor(device: GPUDevice, cfg: GpuSolverConfig) {
    this.device = device
    this.nx = cfg.nx
    this.ny = cfg.ny
    this.visc = cfg.visc
    this.inflow = cfg.inflow
    this.inflowLower = cfg.inflowLower
    this.toggles = { ...cfg.toggles }
    const n = cfg.nx * cfg.ny

    const initU = new Float32Array(n)
    for (let j = 0; j < cfg.ny; j++) {
      initU.fill(j >= cfg.ny >> 1 ? cfg.inflowLower : cfg.inflow, j * cfg.nx, (j + 1) * cfg.nx)
    }
    this.u = new FieldPair(device, n, initU)
    this.v = new FieldPair(device, n)
    this.dye = new FieldPair(device, n)
    this.dye2 = new FieldPair(device, n)
    this.p = new FieldPair(device, n)
    this.div = f32Buffer(device, n)
    this.solid = new Uint32Array(n)
    this.solidBuf = u32Buffer(device, this.solid)
    this.uScratch = f32Buffer(device, n)
    this.vScratch = f32Buffer(device, n)
    this.uHat = f32Buffer(device, n)
    this.vHat = f32Buffer(device, n)
    this.dyeHat = f32Buffer(device, n)
    this.nDyeRows = cfg.dyeRows.length
    this.dyeRowsBuf = u32Buffer(device, new Uint32Array(cfg.dyeRows.length ? cfg.dyeRows : [0]))
    this.nDye2Rows = cfg.dye2Rows.length
    this.dye2RowsBuf = u32Buffer(device, new Uint32Array(cfg.dye2Rows.length ? cfg.dye2Rows : [0]))
    this.params = device.createBuffer({
      size: this.paramsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.k = solverKernels(device, cfg.nx, cfg.ny)
    this.mg = new MultigridPoisson(device, cfg.nx, cfg.ny, this.p, this.div, this.solidBuf)
  }

  /** Carve a solid disc (no-slip). Mirrors FluidSolver.addDisc. */
  addDisc(cx: number, cy: number, r: number) {
    for (let j = 0; j < this.ny; j++) {
      for (let i = 0; i < this.nx; i++) {
        if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) this.solid[i + j * this.nx] = 1
      }
    }
    this.device.queue.writeBuffer(this.solidBuf, 0, this.solid as BufferSource)
    this.mg.setSolid(this.solid)
  }

  /**
   * Replace the obstacle with an airfoil at the given tilt. Called per slider
   * move: re-stamping between fixed steps is a quasi-static boundary motion —
   * cells the wing vacates restart from zero velocity, which reads as a brief
   * shadow in the wake and is gone within a few steps.
   */
  setAirfoil(pivotX: number, pivotY: number, chord: number, angleRad: number) {
    stampAirfoilMask(this.solid, this.nx, this.ny, pivotX, pivotY, chord, angleRad)
    this.device.queue.writeBuffer(this.solidBuf, 0, this.solid as BufferSource)
    this.mg.setSolid(this.solid)
  }

  /** Queue a momentum push for the next step. Mirrors FluidSolver.addImpulse. */
  addImpulse(cx: number, cy: number, fx: number, fy: number, r = 4) {
    this.impulse = { x: cx, y: cy, fx, fy, r }
  }

  /** Overwrite the dye field (tests seed blobs through this). */
  writeDye(data: Float32Array) {
    this.device.queue.writeBuffer(this.dye.cur, 0, data as BufferSource)
  }

  /**
   * One fixed timestep. Encodes the full pass sequence into one command
   * buffer; nothing here blocks — the GPU consumes it while JS moves on.
   * Order matches FluidSolver.step: sources → diffuse → advect → boundaries →
   * project → boundaries → dye.
   */
  step(dt: number) {
    const imp = this.impulse
    this.impulse = null
    const d = this.paramsData
    d[0] = dt
    d[1] = this.visc * dt // a — implicit diffusion coefficient
    d[2] = this.inflow
    d[3] = this.dyeDecay
    d[4] = imp?.x ?? 0
    d[5] = imp?.y ?? 0
    d[6] = imp?.fx ?? 0
    d[7] = imp?.fy ?? 0
    d[8] = imp?.r ?? 0
    d[9] = imp ? 1 : 0
    d[10] = this.inflowLower
    this.device.queue.writeBuffer(this.params, 0, d as BufferSource)

    const enc = this.device.createCommandEncoder({ label: 'solver-step' })
    const nx = this.nx
    const ny = this.ny
    const P = this.params

    // p seeds at zero every solve, edges stay zero forever (CPU: p.fill(0))
    if (this.toggles.project) {
      enc.clearBuffer(this.p.cur)
      enc.clearBuffer(this.p.alt)
    }

    // Sources get their own pass: the diffusion scratch copies below are
    // encoder-level commands, which WebGPU forbids inside an open pass.
    const sources = enc.beginComputePass()
    if (this.nDyeRows > 0) this.k.injectDye.run(sources, [this.dye.cur, this.dyeRowsBuf], this.nDyeRows, 1)
    if (this.nDye2Rows > 0) this.k.injectDye.run(sources, [this.dye2.cur, this.dye2RowsBuf], this.nDye2Rows, 1)
    if (imp) this.k.impulse.run(sources, [P, this.u.cur, this.v.cur], nx, ny)
    sources.end()

    if (this.toggles.diffuse) {
      // scratch holds the pre-diffusion field — the Jacobi source term b in
      // x = (b + a·Σneighbors)/(1+4a); the pair then iterates x toward it
      enc.copyBufferToBuffer(this.u.cur, 0, this.uScratch, 0, nx * ny * 4)
      enc.copyBufferToBuffer(this.v.cur, 0, this.vScratch, 0, nx * ny * 4)
    }

    const pass = enc.beginComputePass()

    if (this.toggles.diffuse) {
      for (let it = 0; it < DIFFUSE_ITERS; it++) {
        this.k.diffuse.run(
          pass,
          [P, this.uScratch, this.vScratch, this.u.cur, this.v.cur, this.u.alt, this.v.alt],
          nx,
          ny,
        )
        this.u.swap()
        this.v.swap()
      }
    }

    if (this.toggles.advect) {
      // MacCormack: forward into *hat, backward into alt (that's φ̄), then
      // correct in place over alt — φ̂ + ½(φⁿ − φ̄), clamped to the stencil.
      // Both passes are carried by the SAME pre-advection velocity.
      this.k.advectPairFwd.run(pass, [P, this.u.cur, this.v.cur, this.u.cur, this.v.cur, this.uHat, this.vHat], nx, ny)
      this.k.advectPairBwd.run(pass, [P, this.u.cur, this.v.cur, this.uHat, this.vHat, this.u.alt, this.v.alt], nx, ny)
      this.k.correctPair.run(pass, [P, this.u.cur, this.v.cur, this.uHat, this.vHat, this.u.alt, this.v.alt], nx, ny)
      this.u.swap()
      this.v.swap()
    }

    this.boundaries(pass)

    if (this.toggles.project) {
      this.k.divergence.run(pass, [this.u.cur, this.v.cur, this.div], nx, ny)
      this.mg.encode(pass) // solve ∇²p = ∇·u* into p.cur (V-cycles)
      this.k.subtractGrad.run(pass, [this.p.cur, this.solidBuf, this.u.cur, this.v.cur], nx, ny)
      this.boundaries(pass)
    }

    // dye rides the (possibly un-projected) flow — that's the point in §9
    this.k.advectScalarFwd.run(pass, [P, this.u.cur, this.v.cur, this.dye.cur, this.dyeHat], nx, ny)
    this.k.advectScalarBwd.run(pass, [P, this.u.cur, this.v.cur, this.dyeHat, this.dye.alt], nx, ny)
    this.k.correctScalar.run(pass, [P, this.u.cur, this.v.cur, this.dye.cur, this.dyeHat, this.dye.alt], nx, ny)
    this.dye.swap()

    if (this.nDye2Rows > 0) {
      // dyeHat is free again — dye's passes above are ordered before these
      this.k.advectScalarFwd.run(pass, [P, this.u.cur, this.v.cur, this.dye2.cur, this.dyeHat], nx, ny)
      this.k.advectScalarBwd.run(pass, [P, this.u.cur, this.v.cur, this.dyeHat, this.dye2.alt], nx, ny)
      this.k.correctScalar.run(pass, [P, this.u.cur, this.v.cur, this.dye2.cur, this.dyeHat, this.dye2.alt], nx, ny)
      this.dye2.swap()
    }

    pass.end()
    this.device.queue.submit([enc.finish()])
  }

  /** Refresh the divergence buffer without stepping (the §9 violet meter with projection off). */
  computeDivergence() {
    const enc = this.device.createCommandEncoder()
    const pass = enc.beginComputePass()
    this.k.divergence.run(pass, [this.u.cur, this.v.cur, this.div], this.nx, this.ny)
    pass.end()
    this.device.queue.submit([enc.finish()])
  }

  // Two dispatches, not one: the wall rule reads row 1 / ny−2, which the
  // column rules write at the corners — sequencing the passes makes those
  // reads race-free (dispatch N's writes are visible to dispatch N+1).
  private boundaries(pass: GPUComputePassEncoder) {
    this.k.bcColumnsSolid.run(pass, [this.params, this.solidBuf, this.u.cur, this.v.cur, this.dye.cur], this.nx, this.ny)
    if (this.nDye2Rows > 0) this.k.bcScalar.run(pass, [this.solidBuf, this.dye2.cur], this.nx, this.ny)
    this.k.bcRows.run(pass, [this.u.cur, this.v.cur], this.nx, this.ny)
  }

  destroy() {
    for (const b of [
      this.u.cur, this.u.alt, this.v.cur, this.v.alt,
      this.dye.cur, this.dye.alt, this.dye2.cur, this.dye2.alt,
      this.p.cur, this.p.alt,
      this.div, this.solidBuf, this.uScratch, this.vScratch,
      this.uHat, this.vHat, this.dyeHat,
      this.dyeRowsBuf, this.dye2RowsBuf, this.params,
    ]) b.destroy()
    this.mg.destroy()
  }
}

// ---------------------------------------------------------------- kernels

interface SolverKernels {
  advectPairFwd: Kernel
  advectPairBwd: Kernel
  correctPair: Kernel
  advectScalarFwd: Kernel
  advectScalarBwd: Kernel
  correctScalar: Kernel
  diffuse: Kernel
  divergence: Kernel
  pressure: Kernel
  subtractGrad: Kernel
  bcColumnsSolid: Kernel
  bcScalar: Kernel
  bcRows: Kernel
  injectDye: Kernel
  impulse: Kernel
}

// Pipeline compilation is the expensive part of construction (~seconds of
// driver work on first use, measured). Kernels depend only on (device, nx,
// ny), so the four lesson instances of the hero share one compiled set.
const kernelCache = new WeakMap<GPUDevice, Map<string, SolverKernels>>()

function solverKernels(device: GPUDevice, nx: number, ny: number): SolverKernels {
  let bySize = kernelCache.get(device)
  if (!bySize) {
    bySize = new Map()
    kernelCache.set(device, bySize)
  }
  const key = `${nx}x${ny}`
  let kernels = bySize.get(key)
  if (!kernels) {
    const src = wgsl(nx, ny)
    kernels = {
      advectPairFwd: new Kernel(device, src.advectPairFwd, 'advect-pair-fwd'),
      advectPairBwd: new Kernel(device, src.advectPairBwd, 'advect-pair-bwd'),
      correctPair: new Kernel(device, src.correctPair, 'maccormack-correct-pair'),
      advectScalarFwd: new Kernel(device, src.advectScalarFwd, 'advect-scalar-fwd'),
      advectScalarBwd: new Kernel(device, src.advectScalarBwd, 'advect-scalar-bwd'),
      correctScalar: new Kernel(device, src.correctScalar, 'maccormack-correct-scalar'),
      diffuse: new Kernel(device, src.diffuse, 'diffuse-jacobi'),
      divergence: new Kernel(device, src.divergence, 'divergence'),
      pressure: new Kernel(device, src.pressure, 'pressure-jacobi'),
      subtractGrad: new Kernel(device, src.subtractGrad, 'subtract-gradient'),
      bcColumnsSolid: new Kernel(device, src.bcColumnsSolid, 'bc-columns-solid'),
      bcScalar: new Kernel(device, src.bcScalar, 'bc-scalar'),
      bcRows: new Kernel(device, src.bcRows, 'bc-rows'),
      injectDye: new Kernel(device, src.injectDye, 'inject-dye'),
      impulse: new Kernel(device, src.impulse, 'impulse'),
    }
    bySize.set(key, kernels)
  }
  return kernels
}

// ---------------------------------------------------------------- multigrid

// Geometric multigrid for L(p) = Σp_neighbors − 4p = rhs (the unscaled
// 5-point Laplacian the smoother inverts; h² is implicit, which is why the
// restricted residual picks up a factor 4 — (2h)²∇² = 4·h²∇²).
// Solid cells: Neumann mirror in the smoother/residual, coarsened as
// "any child solid". Domain edge: p = 0 at every level (matches the CPU).

interface MgLevel {
  nx: number
  ny: number
  p: FieldPair
  rhs: GPUBuffer
  res: GPUBuffer
  solid: GPUBuffer
  solidCpu: Uint32Array
  smooth: Kernel
  residual: Kernel
  zeroPair: Kernel
  owned: GPUBuffer[] // buffers this level allocated (level 0 borrows the solver's)
}

class MultigridPoisson {
  private readonly levels: MgLevel[] = []
  private readonly restrictK: Kernel[] = [] // [l]: level l residual → level l+1 rhs
  private readonly prolongK: Kernel[] = [] // [l]: level l+1 correction → level l

  constructor(
    private readonly device: GPUDevice,
    nx: number,
    ny: number,
    fineP: FieldPair,
    fineRhs: GPUBuffer,
    fineSolid: GPUBuffer,
  ) {
    let cnx = nx
    let cny = ny
    let first = true
    while (true) {
      const n = cnx * cny
      const owned: GPUBuffer[] = []
      const alloc = () => {
        const b = f32Buffer(device, n)
        owned.push(b)
        return b
      }
      const p = first ? fineP : new FieldPair(device, n)
      if (!first) owned.push(p.cur, p.alt)
      const res = alloc()
      const solid = first ? fineSolid : u32Buffer(device, new Uint32Array(n))
      const src = mgWgsl(cnx, cny)
      const solverSrc = wgsl(cnx, cny)
      this.levels.push({
        nx: cnx,
        ny: cny,
        p,
        rhs: first ? fineRhs : alloc(),
        res,
        solid,
        solidCpu: new Uint32Array(n),
        smooth: mgKernel(device, solverSrc.pressure, `mg-smooth-${cnx}x${cny}`),
        residual: mgKernel(device, src.residual, `mg-residual-${cnx}x${cny}`),
        zeroPair: mgKernel(device, src.zeroPair, `mg-zero-${cnx}x${cny}`),
        owned,
      })
      if (Math.min(cnx, cny) <= 24) break
      cnx = Math.ceil(cnx / 2)
      cny = Math.ceil(cny / 2)
      first = false
    }
    for (let l = 0; l < this.levels.length - 1; l++) {
      const F = this.levels[l]
      const C = this.levels[l + 1]
      const t = mgTransferWgsl(F.nx, F.ny, C.nx, C.ny)
      // cache labels must carry BOTH dimensions: two solvers can share a width
      // at different heights (wing channel vs cylinder channel), and a label
      // collision here hands one of them transfer kernels with the wrong NY
      // baked in — garbage restriction, wild velocities (found the hard way)
      this.restrictK.push(mgKernel(device, t.restrictK, `mg-restrict-${F.nx}x${F.ny}to${C.nx}x${C.ny}`))
      this.prolongK.push(mgKernel(device, t.prolong, `mg-prolong-${C.nx}x${C.ny}to${F.nx}x${F.ny}`))
    }
  }

  /** Rebuild the coarse solid masks from the fine one (call after addDisc). */
  setSolid(fine: Uint32Array) {
    this.levels[0].solidCpu.set(fine)
    for (let l = 1; l < this.levels.length; l++) {
      const F = this.levels[l - 1]
      const C = this.levels[l]
      for (let j = 0; j < C.ny; j++) {
        for (let i = 0; i < C.nx; i++) {
          const i2 = Math.min(2 * i, F.nx - 1)
          const j2 = Math.min(2 * j, F.ny - 1)
          const i3 = Math.min(2 * i + 1, F.nx - 1)
          const j3 = Math.min(2 * j + 1, F.ny - 1)
          C.solidCpu[i + j * C.nx] =
            F.solidCpu[i2 + j2 * F.nx] | F.solidCpu[i3 + j2 * F.nx] |
            F.solidCpu[i2 + j3 * F.nx] | F.solidCpu[i3 + j3 * F.nx]
        }
      }
      this.device.queue.writeBuffer(C.solid, 0, C.solidCpu as BufferSource)
    }
  }

  /** Encode V_CYCLES V-cycles. Result lands in the fine pair's `cur`. */
  encode(pass: GPUComputePassEncoder) {
    for (let c = 0; c < V_CYCLES; c++) this.vcycle(pass, 0)
  }

  private sweep(pass: GPUComputePassEncoder, L: MgLevel, n: number) {
    for (let i = 0; i < n; i++) {
      L.smooth.run(pass, [L.p.cur, L.p.alt, L.rhs, L.solid], L.nx, L.ny)
      L.p.swap()
    }
  }

  private vcycle(pass: GPUComputePassEncoder, l: number) {
    const L = this.levels[l]
    if (l === this.levels.length - 1) {
      this.sweep(pass, L, MG_COARSE_SWEEPS)
      return
    }
    const C = this.levels[l + 1]
    this.sweep(pass, L, MG_SMOOTH)
    L.residual.run(pass, [L.p.cur, L.rhs, L.solid, L.res], L.nx, L.ny)
    this.restrictK[l].run(pass, [L.res, C.rhs, C.solid], C.nx, C.ny)
    C.zeroPair.run(pass, [C.p.cur, C.p.alt], C.nx, C.ny) // zero initial guess
    this.vcycle(pass, l + 1)
    this.prolongK[l].run(pass, [C.p.cur, L.p.cur], L.nx, L.ny)
    this.sweep(pass, L, MG_SMOOTH)
  }

  destroy() {
    for (const L of this.levels) for (const b of L.owned) b.destroy()
  }
}

// MG kernels cached like the solver's — the four lesson instances share them.
const mgKernelCache = new WeakMap<GPUDevice, Map<string, Kernel>>()
function mgKernel(device: GPUDevice, code: string, label: string): Kernel {
  let byLabel = mgKernelCache.get(device)
  if (!byLabel) {
    byLabel = new Map()
    mgKernelCache.set(device, byLabel)
  }
  let k = byLabel.get(label)
  if (!k) {
    k = new Kernel(device, code, label)
    byLabel.set(label, k)
  }
  return k
}

function mgWgsl(nx: number, ny: number) {
  const prelude = /* wgsl */ `
    const NX: u32 = ${nx}u;
    const NY: u32 = ${ny}u;
    fn idx(i: u32, j: u32) -> u32 { return i + j * NX; }
  `
  const entry = /* wgsl */ `@compute @workgroup_size(${WG}, ${WG})
    fn main(@builtin(global_invocation_id) gid: vec3u) {`
  const guard = /* wgsl */ `
    let i = gid.x;
    let j = gid.y;
    if (i >= NX || j >= NY) { return; }
    let k = idx(i, j);
    let edge = i == 0u || i == NX - 1u || j == 0u || j == NY - 1u;
  `
  return {
    // r = rhs − L(p), with the same solid mirror the smoother uses.
    residual: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read> p: array<f32>;
      @group(0) @binding(1) var<storage, read> rhs: array<f32>;
      @group(0) @binding(2) var<storage, read> solid: array<u32>;
      @group(0) @binding(3) var<storage, read_write> r: array<f32>;
      ${entry}
        ${guard}
        if (edge || solid[k] != 0u) { r[k] = 0.0; return; }
        let c = p[k];
        let pl = select(p[k - 1u], c, solid[k - 1u] != 0u);
        let pr = select(p[k + 1u], c, solid[k + 1u] != 0u);
        let pd = select(p[k - NX], c, solid[k - NX] != 0u);
        let pu = select(p[k + NX], c, solid[k + NX] != 0u);
        r[k] = rhs[k] - (pl + pr + pd + pu - 4.0 * c);
      }
    `,
    zeroPair: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read_write> a: array<f32>;
      @group(0) @binding(1) var<storage, read_write> b: array<f32>;
      ${entry}
        ${guard}
        a[k] = 0.0;
        b[k] = 0.0;
      }
    `,
  }
}

function mgTransferWgsl(fnx: number, fny: number, cnx: number, cny: number) {
  return {
    // Coarse rhs = 4 × average of the four children = plain sum. The 4 is the
    // (2h)²/h² operator scaling, not a fudge.
    restrictK: /* wgsl */ `
      const FNX: u32 = ${fnx}u; const FNY: u32 = ${fny}u;
      const CNX: u32 = ${cnx}u; const CNY: u32 = ${cny}u;
      @group(0) @binding(0) var<storage, read> r: array<f32>;
      @group(0) @binding(1) var<storage, read_write> rhs: array<f32>;
      @group(0) @binding(2) var<storage, read> solid: array<u32>;
      @compute @workgroup_size(${WG}, ${WG})
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        let i = gid.x;
        let j = gid.y;
        if (i >= CNX || j >= CNY) { return; }
        let k = i + j * CNX;
        if (i == 0u || i == CNX - 1u || j == 0u || j == CNY - 1u || solid[k] != 0u) {
          rhs[k] = 0.0;
          return;
        }
        let i2 = min(2u * i, FNX - 1u);
        let j2 = min(2u * j, FNY - 1u);
        let i3 = min(2u * i + 1u, FNX - 1u);
        let j3 = min(2u * j + 1u, FNY - 1u);
        rhs[k] = r[i2 + j2 * FNX] + r[i3 + j2 * FNX] + r[i2 + j3 * FNX] + r[i3 + j3 * FNX];
      }
    `,
    // p_fine += bilinear(e_coarse). Cell centers: fine i+0.5 ↔ coarse (i−0.5)/2.
    prolong: /* wgsl */ `
      const FNX: u32 = ${fnx}u; const FNY: u32 = ${fny}u;
      const CNX: u32 = ${cnx}u; const CNY: u32 = ${cny}u;
      @group(0) @binding(0) var<storage, read> e: array<f32>;
      @group(0) @binding(1) var<storage, read_write> p: array<f32>;
      @compute @workgroup_size(${WG}, ${WG})
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        let i = gid.x;
        let j = gid.y;
        if (i >= FNX || j >= FNY) { return; }
        if (i == 0u || i == FNX - 1u || j == 0u || j == FNY - 1u) { return; }
        let cx = clamp((f32(i) - 0.5) * 0.5, 0.0, f32(CNX) - 1.001);
        let cy = clamp((f32(j) - 0.5) * 0.5, 0.0, f32(CNY) - 1.001);
        let i0 = u32(floor(cx));
        let j0 = u32(floor(cy));
        let tx = cx - f32(i0);
        let ty = cy - f32(j0);
        let i1 = min(i0 + 1u, CNX - 1u);
        let j1 = min(j0 + 1u, CNY - 1u);
        let a = e[i0 + j0 * CNX];
        let b = e[i1 + j0 * CNX];
        let c = e[i0 + j1 * CNX];
        let d = e[i1 + j1 * CNX];
        p[i + j * FNX] += a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
      }
    `,
  }
}

// ---------------------------------------------------------------- WGSL

/**
 * Kernel sources with the grid size baked in as WGSL constants. `bilerp_x`
 * is generated per buffer name because WGSL (at baseline) can't pass storage
 * arrays to functions — the body is byte-for-byte the CPU sample():
 * clamp to [0.5, n−1.5], floor, four taps, bilinear blend.
 */
function wgsl(nx: number, ny: number) {
  const prelude = /* wgsl */ `
    const NX: u32 = ${nx}u;
    const NY: u32 = ${ny}u;
    fn idx(i: u32, j: u32) -> u32 { return i + j * NX; }

    struct Params {
      dt: f32, a: f32, inflow: f32, dye_decay: f32,
      imp_x: f32, imp_y: f32, imp_fx: f32, imp_fy: f32,
      imp_r: f32, imp_on: f32, inflow_lo: f32, pad1: f32,
    }
  `
  const bilerp = (name: string) => /* wgsl */ `
    fn bilerp_${name}(x: f32, y: f32) -> f32 {
      let cx = clamp(x, 0.5, f32(NX) - 1.5);
      let cy = clamp(y, 0.5, f32(NY) - 1.5);
      let i0 = u32(floor(cx));
      let j0 = u32(floor(cy));
      let tx = cx - f32(i0);
      let ty = cy - f32(j0);
      let a = ${name}[idx(i0, j0)];
      let b = ${name}[idx(i0 + 1u, j0)];
      let c = ${name}[idx(i0, j0 + 1u)];
      let d = ${name}[idx(i0 + 1u, j0 + 1u)];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    }
  `
  const guard = /* wgsl */ `
    let i = gid.x;
    let j = gid.y;
    if (i >= NX || j >= NY) { return; }
    let k = idx(i, j);
    let edge = i == 0u || i == NX - 1u || j == 0u || j == NY - 1u;
  `
  const entry = /* wgsl */ `@compute @workgroup_size(${WG}, ${WG})
    fn main(@builtin(global_invocation_id) gid: vec3u) {`

  // Semi-Lagrangian: whose fluid arrives here? Trace back (sign −1 traces
  // forward for the MacCormack reverse pass), interpolate. Carrier velocity
  // is bound separately from the carried field: both MacCormack passes ride
  // the SAME pre-advection velocity. Edge cells pass through unchanged —
  // boundaries() owns them (CPU writes interior only).
  const advectPair = (sign: string) => /* wgsl */ `
    ${prelude}
    @group(0) @binding(0) var<uniform> P: Params;
    @group(0) @binding(1) var<storage, read> cu: array<f32>;
    @group(0) @binding(2) var<storage, read> cv: array<f32>;
    @group(0) @binding(3) var<storage, read> aIn: array<f32>;
    @group(0) @binding(4) var<storage, read> bIn: array<f32>;
    @group(0) @binding(5) var<storage, read_write> aOut: array<f32>;
    @group(0) @binding(6) var<storage, read_write> bOut: array<f32>;
    ${bilerp('aIn')}
    ${bilerp('bIn')}
    ${entry}
      ${guard}
      if (edge) { aOut[k] = aIn[k]; bOut[k] = bIn[k]; return; }
      let bx = f32(i) - (${sign}) * P.dt * cu[k];
      let by = f32(j) - (${sign}) * P.dt * cv[k];
      aOut[k] = bilerp_aIn(bx, by);
      bOut[k] = bilerp_bIn(bx, by);
    }
  `
  const advectScalar = (sign: string) => /* wgsl */ `
    ${prelude}
    @group(0) @binding(0) var<uniform> P: Params;
    @group(0) @binding(1) var<storage, read> cu: array<f32>;
    @group(0) @binding(2) var<storage, read> cv: array<f32>;
    @group(0) @binding(3) var<storage, read> sIn: array<f32>;
    @group(0) @binding(4) var<storage, read_write> sOut: array<f32>;
    ${bilerp('sIn')}
    ${entry}
      ${guard}
      if (edge) { sOut[k] = sIn[k]; return; }
      let bx = f32(i) - (${sign}) * P.dt * cu[k];
      let by = f32(j) - (${sign}) * P.dt * cv[k];
      sOut[k] = bilerp_sIn(bx, by);
    }
  `
  // The MacCormack stencil clamp: the corrected value may not leave the
  // min/max of the four cells the forward backtrace interpolated between —
  // this is what keeps second-order advection unconditionally stable.
  const stencilBounds = (name: string) => /* wgsl */ `
    fn bounds_${name}(x: f32, y: f32) -> vec2f {
      let cx = clamp(x, 0.5, f32(NX) - 1.5);
      let cy = clamp(y, 0.5, f32(NY) - 1.5);
      let i0 = u32(floor(cx));
      let j0 = u32(floor(cy));
      let a = ${name}[idx(i0, j0)];
      let b = ${name}[idx(i0 + 1u, j0)];
      let c = ${name}[idx(i0, j0 + 1u)];
      let d = ${name}[idx(i0 + 1u, j0 + 1u)];
      return vec2f(min(min(a, b), min(c, d)), max(max(a, b), max(c, d)));
    }
  `

  return {
    advectPairFwd: advectPair('1.0'),
    advectPairBwd: advectPair('-1.0'),
    advectScalarFwd: advectScalar('1.0'),
    advectScalarBwd: advectScalar('-1.0'),
    // φⁿ⁺¹ = φ̂ + ½(φⁿ − φ̄), clamped. The destination arrives holding φ̄ —
    // each thread reads only its own cell before overwriting it, so in-place
    // is race-free.
    correctPair: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<uniform> P: Params;
      @group(0) @binding(1) var<storage, read> uN: array<f32>;
      @group(0) @binding(2) var<storage, read> vN: array<f32>;
      @group(0) @binding(3) var<storage, read> uHat: array<f32>;
      @group(0) @binding(4) var<storage, read> vHat: array<f32>;
      @group(0) @binding(5) var<storage, read_write> uDst: array<f32>;
      @group(0) @binding(6) var<storage, read_write> vDst: array<f32>;
      ${stencilBounds('uN')}
      ${stencilBounds('vN')}
      ${entry}
        ${guard}
        if (edge) { uDst[k] = uN[k]; vDst[k] = vN[k]; return; }
        let bx = f32(i) - P.dt * uN[k];
        let by = f32(j) - P.dt * vN[k];
        let ub = bounds_uN(bx, by);
        let vb = bounds_vN(bx, by);
        uDst[k] = clamp(uHat[k] + 0.5 * (uN[k] - uDst[k]), ub.x, ub.y);
        vDst[k] = clamp(vHat[k] + 0.5 * (vN[k] - vDst[k]), vb.x, vb.y);
      }
    `,
    // Dye decay folds in here (CPU does it as a separate loop).
    correctScalar: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<uniform> P: Params;
      @group(0) @binding(1) var<storage, read> cu: array<f32>;
      @group(0) @binding(2) var<storage, read> cv: array<f32>;
      @group(0) @binding(3) var<storage, read> sN: array<f32>;
      @group(0) @binding(4) var<storage, read> sHat: array<f32>;
      @group(0) @binding(5) var<storage, read_write> sDst: array<f32>;
      ${stencilBounds('sN')}
      ${entry}
        ${guard}
        if (edge) { sDst[k] = sN[k] * P.dye_decay; return; }
        let bx = f32(i) - P.dt * cu[k];
        let by = f32(j) - P.dt * cv[k];
        let sb = bounds_sN(bx, by);
        sDst[k] = clamp(sHat[k] + 0.5 * (sN[k] - sDst[k]), sb.x, sb.y) * P.dye_decay;
      }
    `,
    // One true-Jacobi iteration for implicit diffusion of both components:
    // x' = (b + a·Σ x_neighbors)/(1+4a). Edge cells carry the source value,
    // which is what the CPU's dst.set(src) leaves there.
    diffuse: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<uniform> P: Params;
      @group(0) @binding(1) var<storage, read> bU: array<f32>;
      @group(0) @binding(2) var<storage, read> bV: array<f32>;
      @group(0) @binding(3) var<storage, read> uIn: array<f32>;
      @group(0) @binding(4) var<storage, read> vIn: array<f32>;
      @group(0) @binding(5) var<storage, read_write> uOut: array<f32>;
      @group(0) @binding(6) var<storage, read_write> vOut: array<f32>;
      ${entry}
        ${guard}
        if (edge) { uOut[k] = bU[k]; vOut[k] = bV[k]; return; }
        let inv = 1.0 / (1.0 + 4.0 * P.a);
        uOut[k] = (bU[k] + P.a * (uIn[k - 1u] + uIn[k + 1u] + uIn[k - NX] + uIn[k + NX])) * inv;
        vOut[k] = (bV[k] + P.a * (vIn[k - 1u] + vIn[k + 1u] + vIn[k - NX] + vIn[k + NX])) * inv;
      }
    `,
    divergence: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read> u: array<f32>;
      @group(0) @binding(1) var<storage, read> v: array<f32>;
      @group(0) @binding(2) var<storage, read_write> div: array<f32>;
      ${entry}
        ${guard}
        if (edge) { div[k] = 0.0; return; }
        div[k] = 0.5 * (u[k + 1u] - u[k - 1u] + v[k + NX] - v[k - NX]);
      }
    `,
    // One Jacobi sweep of ∇²p = ∇·u*. Solid neighbors mirror the center
    // (Neumann); solid and edge cells hold p = 0.
    pressure: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read> pIn: array<f32>;
      @group(0) @binding(1) var<storage, read_write> pOut: array<f32>;
      @group(0) @binding(2) var<storage, read> div: array<f32>;
      @group(0) @binding(3) var<storage, read> solid: array<u32>;
      ${entry}
        ${guard}
        if (edge || solid[k] != 0u) { pOut[k] = 0.0; return; }
        let c = pIn[k];
        let pl = select(pIn[k - 1u], c, solid[k - 1u] != 0u);
        let pr = select(pIn[k + 1u], c, solid[k + 1u] != 0u);
        let pd = select(pIn[k - NX], c, solid[k - NX] != 0u);
        let pu = select(pIn[k + NX], c, solid[k + NX] != 0u);
        pOut[k] = (pl + pr + pd + pu - div[k]) * 0.25;
      }
    `,
    // In-place is safe here: each thread reads p/solid (not written) and
    // writes only its own u[k], v[k].
    subtractGrad: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read> p: array<f32>;
      @group(0) @binding(1) var<storage, read> solid: array<u32>;
      @group(0) @binding(2) var<storage, read_write> u: array<f32>;
      @group(0) @binding(3) var<storage, read_write> v: array<f32>;
      ${entry}
        ${guard}
        if (edge || solid[k] != 0u) { return; }
        u[k] = u[k] - 0.5 * (p[k + 1u] - p[k - 1u]);
        v[k] = v[k] - 0.5 * (p[k + NX] - p[k - NX]);
      }
    `,
    // Pass A of boundaries(): inflow column, outflow column, solid no-slip.
    // Each thread writes only its own cell; the outflow read of column NX−2
    // is interior, which this kernel never writes. (Assumes no solid cells
    // touch the outflow column — true for every figure in the lesson.)
    bcColumnsSolid: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<uniform> P: Params;
      @group(0) @binding(1) var<storage, read> solid: array<u32>;
      @group(0) @binding(2) var<storage, read_write> u: array<f32>;
      @group(0) @binding(3) var<storage, read_write> v: array<f32>;
      @group(0) @binding(4) var<storage, read_write> dye: array<f32>;
      ${entry}
        ${guard}
        if (solid[k] != 0u) { u[k] = 0.0; v[k] = 0.0; dye[k] = 0.0; return; }
        if (i == 0u) {
          u[k] = select(P.inflow, P.inflow_lo, j >= NY / 2u);
          v[k] = 0.0;
          return;
        }
        if (i == NX - 1u) {
          u[k] = u[k - 1u];
          v[k] = v[k - 1u];
          dye[k] = dye[k - 1u];
        }
      }
    `,
    // Scalar-only boundary rules (dye2): zero in solids, copy at the outflow.
    // The u/v/dye trio rides bcColumnsSolid; a second full run of that kernel
    // would redo the velocity writes, so the extra species gets its own pass.
    bcScalar: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read> solid: array<u32>;
      @group(0) @binding(1) var<storage, read_write> s: array<f32>;
      ${entry}
        ${guard}
        if (solid[k] != 0u) { s[k] = 0.0; return; }
        if (i == NX - 1u) { s[k] = s[k - 1u]; }
      }
    `,
    // Pass B: free-slip walls. Reads row 1 / NY−2, stable after pass A.
    bcRows: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read_write> u: array<f32>;
      @group(0) @binding(1) var<storage, read_write> v: array<f32>;
      ${entry}
        ${guard}
        if (j == 0u) { v[k] = 0.0; u[k] = u[idx(i, 1u)]; return; }
        if (j == NY - 1u) { v[k] = 0.0; u[k] = u[idx(i, NY - 2u)]; }
      }
    `,
    // One thread per emitter row; two cells at the inlet, like the CPU.
    injectDye: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<storage, read_write> dye: array<f32>;
      @group(0) @binding(1) var<storage, read> rows: array<u32>;
      ${entry}
        if (gid.x >= arrayLength(&rows) || gid.y > 0u) { return; }
        let j = clamp(rows[gid.x], 1u, NY - 2u);
        dye[idx(1u, j)] = 1.0;
        dye[idx(2u, j)] = 1.0;
      }
    `,
    // Momentum push, same box + gaussian falloff as FluidSolver.addImpulse.
    impulse: /* wgsl */ `
      ${prelude}
      @group(0) @binding(0) var<uniform> P: Params;
      @group(0) @binding(1) var<storage, read_write> u: array<f32>;
      @group(0) @binding(2) var<storage, read_write> v: array<f32>;
      ${entry}
        ${guard}
        if (edge || P.imp_on == 0.0) { return; }
        let dx = f32(i) - P.imp_x;
        let dy = f32(j) - P.imp_y;
        if (abs(dx) > P.imp_r || abs(dy) > P.imp_r) { return; }
        let fall = exp(-(dx * dx + dy * dy) / (P.imp_r * P.imp_r * 0.5));
        u[k] = u[k] + P.imp_fx * fall;
        v[k] = v[k] + P.imp_fy * fall;
      }
    `,
  }
}
