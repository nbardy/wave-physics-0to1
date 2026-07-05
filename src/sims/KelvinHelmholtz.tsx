import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { acquireGpu } from './lib/gpu/context'
import { FluidSolverGPU } from './lib/gpu/solver_gpu'
import { DyeRendererGPU } from './lib/gpu/render_gpu'

// Kelvin–Helmholtz billows: two currents entering at different speeds (amber
// above, faster; rose below, slower), their interface rolling up into the
// classic train of waves. One knob — the speed difference. At zero shear the
// two colors ride side by side and only viscosity blurs the seam; crank the
// shear and the seam becomes unstable and rolls.
//
// One staging confession, stated here because the honesty rules demand it: a
// noiseless solver has nothing to trip the instability, so a small sinusoidal
// wiggle is fed in near the inlet (wind tunnels do the same with a vibrating
// ribbon). The wiggle seeds the roll-up; the shear layer does all the growing.

const NX = 144
const NY = 88
const BASE = 26 // cells/s, mean stream speed
const FIXED_DT = 1 / 40
const KH_VISC = 1.5 // cells²/s — low enough that advection wins at full shear
const TRIP_PERIOD = 0.8 // s — sets the billow wavelength: λ ≈ BASE·period
const TRIP_X = 10
const TRIP_AMP = 1.1 // cells/s per step at full shear, scaled by shear fraction
const DYE_ROWS = [8, 14, 20, 26, 32, 38] // amber, upper half
const DYE2_ROWS = [50, 56, 62, 68, 74, 80] // rose, lower half

const SCALE = 4
const GNX = NX * SCALE
const GNY = NY * SCALE
const GDYE_ROWS = DYE_ROWS.flatMap((j) => [j * SCALE, j * SCALE + 1])
const GDYE2_ROWS = DYE2_ROWS.flatMap((j) => [j * SCALE, j * SCALE + 1])

const MAX_SHEAR = 16

function createCpuKh(shearRef: { current: number }): Stepper {
  const solver = new FluidSolver(NX, NY, BASE + shearRef.current, KH_VISC)
  solver.inflowLower = BASE - shearRef.current
  // start the whole field at the split profile so there's no spin-up transient
  for (let j = 0; j < NY; j++) {
    solver.u.fill(j >= NY >> 1 ? solver.inflowLower : solver.inflow, j * NX, (j + 1) * NX)
  }

  let acc = 0
  let t = 0
  const renderer = new SolverRenderer(solver)
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        const s = shearRef.current
        solver.inflow = BASE + s
        solver.inflowLower = BASE - s
        solver.injectDyeStripe(DYE_ROWS, 1)
        solver.injectDye2Stripe(DYE2_ROWS, 1)
        if (s > 0) {
          const wiggle = TRIP_AMP * (s / MAX_SHEAR) * Math.sin((2 * Math.PI * t) / TRIP_PERIOD)
          solver.addImpulse(TRIP_X, NY >> 1, 0, wiggle, 3)
        }
        solver.step(FIXED_DT)
        t += FIXED_DT
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
    },
  }
}

function createGpuKh(
  device: GPUDevice,
  shearRef: { current: number },
  width: number,
  height: number,
): Stepper {
  const solver = new FluidSolverGPU(device, {
    nx: GNX,
    ny: GNY,
    inflow: (BASE + shearRef.current) * SCALE,
    inflowLower: (BASE - shearRef.current) * SCALE,
    visc: KH_VISC * SCALE * SCALE, // ν in cells²/s scales 16× to keep the domain-unit Re
    dyeRows: GDYE_ROWS,
    dye2Rows: GDYE2_ROWS,
    toggles: { advect: true, diffuse: true, project: true },
  })
  const dpr = window.devicePixelRatio || 1
  const renderer = new DyeRendererGPU(device, solver, width * dpr, height * dpr)

  let acc = 0
  let t = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        const s = shearRef.current
        solver.inflow = (BASE + s) * SCALE
        solver.inflowLower = (BASE - s) * SCALE
        if (s > 0) {
          const wiggle =
            TRIP_AMP * SCALE * (s / MAX_SHEAR) * Math.sin((2 * Math.PI * t) / TRIP_PERIOD)
          solver.addImpulse(TRIP_X * SCALE, GNY >> 1, 0, wiggle, 3 * SCALE)
        }
        solver.step(FIXED_DT)
        t += FIXED_DT
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
    },
    dispose() {
      renderer.destroy()
      solver.destroy()
    },
  }
}

export function KelvinHelmholtz({ height = 280 }: { height?: number }) {
  const [shear, setShear] = useState(10)
  const shearRef = useRef(shear)
  shearRef.current = shear

  return (
    <div>
      <Sim
        height={height}
        create={(w, h) => {
          let inner: Stepper | null = null
          let disposed = false
          acquireGpu().then((gpu) => {
            if (disposed) return
            if (gpu.kind === 'ready') {
              inner = createGpuKh(gpu.device, shearRef, w, h)
            } else {
              console.info(`KelvinHelmholtz: CPU solver fallback — ${gpu.reason}`)
              inner = createCpuKh(shearRef)
            }
          })
          return {
            step: (dt) => inner?.step(dt),
            draw: (ctx, w2, h2) => inner?.draw(ctx, w2, h2),
            dispose: () => {
              disposed = true
              inner?.dispose?.()
            },
          }
        }}
      >
        <label className="sim-slider">
          <span>calm</span>
          <input
            type="range"
            min={0}
            max={MAX_SHEAR}
            step={1}
            value={shear}
            onChange={(e) => setShear(Number(e.target.value))}
          />
          <span>shear</span>
        </label>
      </Sim>
    </div>
  )
}
