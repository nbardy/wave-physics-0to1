import { useEffect, useState } from 'react'
import { acquireGpu } from '../sims/lib/gpu/context'
import { FluidSolverGPU } from '../sims/lib/gpu/solver_gpu'
import { readBack } from '../sims/lib/gpu/compute'
import { FluidSolver } from '../sims/lib/solver'

// Live diagnostics for the WGSL solver. These are invariant checks, not
// mirrors (see CLAUDE.md testing rules):
//
//  A. Analytic advection — in a uniform stream with diffusion and projection
//     off, a dye blob's centroid must translate by exactly U·t cells.
//     Catches: backtrace sign errors, bilerp index bugs, dt mishandling.
//  B. Projection — after stepping with projection ON, recomputed |∇·u| must
//     be far below the same flow stepped with projection OFF.
//     Catches: pressure-solve sign/stencil errors, gradient-subtract bugs.
//  C. CPU/GPU agreement — both solvers, same config, in the *steady* laminar
//     regime (Re 20; above ~47 vortex shedding makes trajectories chaotic
//     and the comparison meaningless). Relative L2 of the VELOCITY fields
//     must be small. Velocity, not dye: the GPU's MacCormack advection keeps
//     dye streaks sharp where first-order smears them, so pointwise dye L2
//     measures scheme sharpness (~70%!), not correctness — while the smooth
//     steady velocity field agrees to well under 1% (measured). The solvers
//     are also not bit-identical by design: the CPU's in-place loops are
//     effectively Gauss–Seidel, the GPU runs true Jacobi — same fixed point,
//     different path, hence a tolerance, not equality.
//  D. Diffusion delivers the viscosity the dial requests — a velocity top-hat
//     diffused for 1 s must spread to σ ≈ sqrt(2νt (+ σ₀²)), at BOTH ends of
//     the published slider ranges. Regression guard for the 2026-07-06
//     incident: the implicit solve is Jacobi with convergence factor
//     4a/(1+4a), a = ν·dt, and a FIXED sweep count silently delivered ~1/5 of
//     the requested ν at the honey end — the Re dial lied across its whole
//     lower half while every other check stayed green. Catches: any future
//     fixed-iteration "cleanup" of diffuseIters, sweep budgets that don't
//     scale with a, dt mishandling in the diffusion coefficient.

const NX = 144
const NY = 88
const N = NX * NY

type CheckResult = { name: string; pass: boolean; detail: string }
type CheckState =
  | { kind: 'running' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'done'; results: CheckResult[] }

function centroid(f: Float32Array): { x: number; y: number } {
  let sx = 0
  let sy = 0
  let s = 0
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const w = f[i + j * NX]
      sx += w * i
      sy += w * j
      s += w
    }
  }
  return { x: sx / s, y: sy / s }
}

/**
 * RMS over bulk fluid cells only. Solid cells are excluded from the pressure
 * solve (both solvers), so the disc rim shows large apparent divergence that
 * projection is not supposed to remove — measuring it there would fail a
 * correct solver. Verified: max|div| over ALL cells is rim-dominated and
 * nearly identical projected vs not (≈14 both ways); the bulk is the signal.
 */
function rmsBulk(f: Float32Array, discX: number, discY: number, discR: number): number {
  let s = 0
  let n = 0
  for (let j = 2; j < NY - 2; j++) {
    for (let i = 2; i < NX - 2; i++) {
      if ((i - discX) ** 2 + (j - discY) ** 2 <= (discR + 3) ** 2) continue
      s += f[i + j * NX] ** 2
      n++
    }
  }
  return Math.sqrt(s / n)
}

function relL2(a: Float32Array, b: Float32Array): number {
  let d = 0
  let n = 0
  for (let i = 0; i < a.length; i++) {
    d += (a[i] - b[i]) ** 2
    n += b[i] ** 2
  }
  return Math.sqrt(d / Math.max(n, 1e-12))
}

function hasNaN(f: Float32Array): boolean {
  for (let i = 0; i < f.length; i++) if (!Number.isFinite(f[i])) return true
  return false
}

function gaussianBlob(cx: number, cy: number): Float32Array {
  const dye = new Float32Array(N)
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      dye[i + j * NX] = Math.exp(-(((i - cx) / 6) ** 2 + ((j - cy) / 6) ** 2))
    }
  }
  return dye
}

async function runChecks(device: GPUDevice): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const dt = 1 / 40

  // A — analytic advection
  {
    const inflow = 26
    const steps = 20
    const solver = new FluidSolverGPU(device, {
      nx: NX,
      ny: NY,
      inflow,
      inflowLower: inflow,
      visc: 0,
      dyeRows: [],
      dye2Rows: [],
      toggles: { advect: true, diffuse: false, project: false },
    })
    solver.writeDye(gaussianBlob(40, 44))
    const before = centroid(await readBack(device, solver.dye.cur, N))
    for (let s = 0; s < steps; s++) solver.step(dt)
    const after = await readBack(device, solver.dye.cur, N)
    const c = centroid(after)
    const expected = inflow * steps * dt // 13 cells
    const dx = c.x - before.x
    const dy = c.y - before.y
    const ok = Math.abs(dx - expected) < 0.5 && Math.abs(dy) < 0.5 && !hasNaN(after)
    results.push({
      name: 'analytic advection (blob rides a uniform stream)',
      pass: ok,
      detail: `centroid moved (${dx.toFixed(2)}, ${dy.toFixed(2)}) cells, expected (${expected.toFixed(2)}, 0.00)`,
    })
    solver.destroy()
  }

  // B — projection kills divergence
  {
    const mk = (project: boolean) => {
      const s = new FluidSolverGPU(device, {
        nx: NX,
        ny: NY,
        inflow: 26,
        inflowLower: 26,
        visc: 26 * 14 / 90, // Re 90, the hero default
        dyeRows: [10, 30, 50, 70],
        dye2Rows: [],
        toggles: { advect: true, diffuse: true, project },
      })
      s.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 7)
      return s
    }
    const on = mk(true)
    const off = mk(false)
    // CPU reference under the identical run: 40 Gauss–Seidel sweeps leave
    // long-wavelength divergence behind on purpose (it's an iterative solve,
    // not a direct one) — so the GPU is held to *CPU-level* residual, not to
    // an absolute collapse. Measured here: projection cuts bulk RMS div ~3×.
    const cpu = new FluidSolver(NX, NY, 26, (26 * 14) / 90)
    cpu.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 7)
    for (let s = 0; s < 30; s++) {
      cpu.injectDyeStripe([10, 30, 50, 70], 1)
      cpu.step(dt)
      on.step(dt)
      off.step(dt)
    }
    on.computeDivergence() // recompute from the *post-projection* velocity
    off.computeDivergence()
    cpu.computeDivergence()
    const dx = Math.round(NX * 0.26)
    const dy = Math.round(NY * 0.5) + 1
    const divOn = rmsBulk(await readBack(device, on.div, N), dx, dy, 7)
    const divOff = rmsBulk(await readBack(device, off.div, N), dx, dy, 7)
    const divCpu = rmsBulk(cpu.div, dx, dy, 7)
    const uOn = await readBack(device, on.u.cur, N)
    const ok = divOn < 1.5 * divCpu && divOn < 0.5 * divOff && !hasNaN(uOn)
    results.push({
      name: 'projection (residual ∇·u at CPU-reference level)',
      pass: ok,
      detail: `bulk RMS div — GPU ${divOn.toFixed(4)}, CPU ref ${divCpu.toFixed(4)}, unprojected ${divOff.toFixed(4)}`,
    })
    on.destroy()
    off.destroy()
  }

  // C — CPU/GPU agreement in the steady regime
  {
    const re = 20
    const visc = (26 * 14) / re
    const steps = 80
    const gpu = new FluidSolverGPU(device, {
      nx: NX,
      ny: NY,
      inflow: 26,
      inflowLower: 26,
      visc,
      dyeRows: [10, 30, 50, 70],
      dye2Rows: [],
      toggles: { advect: true, diffuse: true, project: true },
    })
    gpu.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 7)
    const cpu = new FluidSolver(NX, NY, 26, visc)
    cpu.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, 7)
    for (let s = 0; s < steps; s++) {
      cpu.injectDyeStripe([10, 30, 50, 70], 1)
      cpu.step(dt)
      gpu.step(dt)
    }
    const gpuU = await readBack(device, gpu.u.cur, N)
    const diff = relL2(gpuU, cpu.u)
    const ok = diff < 0.1 && !hasNaN(gpuU)
    results.push({
      name: 'CPU/GPU agreement (steady laminar flow, Re 20)',
      pass: ok,
      detail: `relative L2 of velocity fields: ${(diff * 100).toFixed(1)}% (tolerance 10%)`,
    })
    gpu.destroy()
  }

  // D — diffusion convergence across the slider range
  {
    // GPU grid scale ×4 like the lesson figures; ν values are the wing hero's
    // published slider extremes (Re 600 fast end, Re 40 honey end, chord 96).
    const S = 4
    const gnx = NX * S
    const gny = NY * S
    const spread = async (nu: number): Promise<{ measured: number; expected: number }> => {
      const s = new FluidSolverGPU(device, {
        nx: gnx,
        ny: gny,
        inflow: 0,
        inflowLower: 0,
        visc: nu,
        dyeRows: [],
        dye2Rows: [],
        toggles: { advect: false, diffuse: true, project: false },
      })
      const jc = gny >> 1
      const seed = new Float32Array(gnx * gny)
      for (let j = jc - 2; j <= jc + 2; j++) seed.fill(1, j * gnx, (j + 1) * gnx)
      device.queue.writeBuffer(s.u.cur, 0, seed as BufferSource)
      const steps = 40
      for (let i = 0; i < steps; i++) s.step(dt)
      const u = await readBack(device, s.u.cur, gnx * gny)
      s.destroy()
      const ic = gnx >> 1
      let m0 = 0
      let m2 = 0
      for (let j = 0; j < gny; j++) {
        const v = Math.max(0, u[ic + j * gnx])
        m0 += v
        m2 += v * (j - jc) ** 2
      }
      // σ₀² ≈ 25/12 + smoothing ≈ 2 for the 5-row top-hat (measured at ν→0)
      return { measured: Math.sqrt(m2 / m0), expected: Math.sqrt(2 * nu * steps * dt + 2) }
    }
    const U = 26 * S
    const chord = 24 * S
    const fast = await spread((U * chord) / 600)
    const honey = await spread((U * chord) / 40)
    const err = (r: { measured: number; expected: number }) =>
      Math.abs(r.measured - r.expected) / r.expected
    const ok = err(fast) < 0.08 && err(honey) < 0.08
    results.push({
      name: 'diffusion delivers the dialed viscosity (both slider ends)',
      pass: ok,
      detail:
        `σ fast-end ${fast.measured.toFixed(1)} vs ${fast.expected.toFixed(1)}, ` +
        `honey-end ${honey.measured.toFixed(1)} vs ${honey.expected.toFixed(1)} cells (tolerance 8%)`,
    })
  }

  return results
}

export function GpuParityCheck() {
  const [state, setState] = useState<CheckState>({ kind: 'running' })

  useEffect(() => {
    let cancelled = false
    acquireGpu().then(async (gpu) => {
      if (cancelled) return
      if (gpu.kind === 'unavailable') {
        setState({ kind: 'unavailable', reason: gpu.reason })
        return
      }
      const results = await runChecks(gpu.device)
      if (!cancelled) setState({ kind: 'done', results })
    })
    return () => {
      cancelled = true
    }
  }, [])

  switch (state.kind) {
    case 'running':
      return <p data-gpu-parity="running">Running GPU solver checks…</p>
    case 'unavailable':
      return (
        <p data-gpu-parity="unavailable">
          WebGPU unavailable here ({state.reason}) — the lesson falls back to the CPU solver.
        </p>
      )
    case 'done':
      return (
        <ul data-gpu-parity={state.results.every((r) => r.pass) ? 'pass' : 'fail'}>
          {state.results.map((r) => (
            <li key={r.name}>
              {r.pass ? '✓' : '✗'} <strong>{r.name}</strong> — {r.detail}
            </li>
          ))}
        </ul>
      )
  }
}
