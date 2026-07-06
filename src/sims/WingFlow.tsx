import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { acquireGpu } from './lib/gpu/context'
import { FluidSolverGPU } from './lib/gpu/solver_gpu'
import { DyeRendererGPU } from './lib/gpu/render_gpu'

// §1 hero · §12 finale — the wing. Two currents of dye (amber above, rose
// below) split at the nose of a NACA airfoil and braid into the wake. The
// one slider is the Reynolds number, unlabeled in the hero — the article's
// oldest debt, named in §7 and paid in §12. CylinderFlow keeps the cylinder
// variants (§7 regime, §9 broken); this component exists so the wing can't
// disturb the cylinder's hard-won Kármán tuning.
//
// The wing flies level (tilt 0). A tilt-to-stall slider was built and
// play-tested first: in this short channel the tilted wake LOCKS into a
// steady deflected jet at moderate angles (blockage), and near the inclined
// trailing edge the thin-body staircase drives a spurious wall-jet (~7× the
// inflow, measured) — so the stall story is dishonest at this resolution and
// was cut. Measured at tilt 0, chord 24: σ(wake)/U = 0.00 at Re 20 (glassy
// ooze) → 0.02 at 200 → 0.28 at 500 (sustained braided street), max|u| ≤
// 1.2·U across Re 200–600. Known residue at the honey end (Re 20–90): a
// steady ~4×U overspeed pocket hugging the tail — the last trace of the
// thin-body pathology above; stable, and invisible in the dye. Backends and
// honesty rules follow CylinderFlow: WebGPU compute at 4× grid, CPU
// reference otherwise, fixed timestep.

const NX = 144
const NY = 88
const INFLOW = 26 // cells/s
const CHORD = 24 // cells
const PIVOT_X = Math.round(NX * 0.3)
const PIVOT_Y = Math.round(NY * 0.5)
const FIXED_DT = 1 / 40
const HERO_RE = 500 // chord-based Re = U·c/ν; the braided street is fully alive here
const DYE_ROWS = [12, 20, 28, 36, 42] // amber, upper half
const DYE2_ROWS = [46, 52, 60, 68, 76] // rose, lower half

// Pre-roll: the street needs ~10 s of sim time to establish, and the reader
// lands on this figure first — so the GPU backend runs WARMUP_STEPS fixed
// steps at creation and the first painted frame is already alive. Same
// physics, same dt, just queued before the first draw (~0.6 s of GPU work).
// The CPU fallback skips it: 400 steps would block the main thread for
// seconds, and that path is already the degraded one.
const WARMUP_STEPS = 480

const SCALE = 4
const GNX = NX * SCALE
const GNY = NY * SCALE
const GINFLOW = INFLOW * SCALE
const GCHORD = CHORD * SCALE
const GPIVOT_X = PIVOT_X * SCALE
const GPIVOT_Y = PIVOT_Y * SCALE
const GDYE_ROWS = DYE_ROWS.flatMap((j) => [j * SCALE, j * SCALE + 1])
const GDYE2_ROWS = DYE2_ROWS.flatMap((j) => [j * SCALE, j * SCALE + 1])

export type WingVariant = 'hero' | 'finale'

type Stir = { x: number; y: number; dx: number; dy: number }

function viscOf(inflow: number, chord: number, re: number) {
  return (inflow * chord) / re
}

function drawLabels(ctx: CanvasRenderingContext2D, h: number, variant: WingVariant, re: number) {
  if (variant !== 'finale') return
  ctx.fillStyle = 'rgba(26,31,43,0.65)'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText(`Re ≈ ${Math.round(re)}`, 10, h - 10)
}

function createCpuWing(
  variant: WingVariant,
  reRef: { current: number },
  stirRef: { current: Stir | null },
): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscOf(INFLOW, CHORD, reRef.current))
  solver.setAirfoil(PIVOT_X, PIVOT_Y, CHORD, 0)
  const renderer = new SolverRenderer(solver)

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.visc = viscOf(INFLOW, CHORD, reRef.current)
        solver.injectDyeStripe(DYE_ROWS, 1)
        solver.injectDye2Stripe(DYE2_ROWS, 1)
        const stir = stirRef.current
        if (stir) {
          solver.addImpulse(
            Math.round(stir.x * NX),
            Math.round(stir.y * NY),
            stir.dx * 220,
            stir.dy * 220,
            5,
          )
          stirRef.current = null
        }
        solver.step(FIXED_DT)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
      drawLabels(ctx, h, variant, (INFLOW * CHORD) / solver.visc)
    },
  }
}

function createGpuWing(
  device: GPUDevice,
  variant: WingVariant,
  reRef: { current: number },
  stirRef: { current: Stir | null },
  width: number,
  height: number,
): Stepper {
  const solver = new FluidSolverGPU(device, {
    nx: GNX,
    ny: GNY,
    inflow: GINFLOW,
    inflowLower: GINFLOW,
    visc: viscOf(GINFLOW, GCHORD, reRef.current),
    dyeRows: GDYE_ROWS,
    dye2Rows: GDYE2_ROWS,
    toggles: { advect: true, diffuse: true, project: true },
  })
  solver.setAirfoil(GPIVOT_X, GPIVOT_Y, GCHORD, 0)
  for (let s = 0; s < WARMUP_STEPS; s++) solver.step(FIXED_DT)
  const dpr = window.devicePixelRatio || 1
  const renderer = new DyeRendererGPU(device, solver, width * dpr, height * dpr)

  let acc = 0
  let re = reRef.current
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        re = reRef.current
        solver.visc = viscOf(GINFLOW, GCHORD, re)
        const stir = stirRef.current
        if (stir) {
          solver.addImpulse(
            Math.round(stir.x * GNX),
            Math.round(stir.y * GNY),
            stir.dx * 220 * SCALE,
            stir.dy * 220 * SCALE,
            5 * SCALE,
          )
          stirRef.current = null
        }
        solver.step(FIXED_DT)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, 'none')
      drawLabels(ctx, h, variant, re)
    },
    dispose() {
      renderer.destroy()
      solver.destroy()
    },
  }
}

/** Same pending-backend contract as CylinderFlow: `inner` null IS the probe state. */
function createWing(
  variant: WingVariant,
  reRef: { current: number },
  stirRef: { current: Stir | null },
  width: number,
  height: number,
): Stepper {
  let inner: Stepper | null = null
  let disposed = false
  acquireGpu().then((gpu) => {
    if (disposed) return
    if (gpu.kind === 'ready') {
      inner = createGpuWing(gpu.device, variant, reRef, stirRef, width, height)
    } else {
      console.info(`WingFlow: CPU solver fallback — ${gpu.reason}`)
      inner = createCpuWing(variant, reRef, stirRef)
    }
  })
  return {
    step: (dt) => inner?.step(dt),
    draw: (ctx, w, h) => inner?.draw(ctx, w, h),
    dispose: () => {
      disposed = true
      inner?.dispose?.()
    },
  }
}

export function WingFlow({
  variant,
  height = 280,
}: {
  variant: WingVariant
  height?: number
}) {
  const [re, setRe] = useState(HERO_RE)
  const reRef = useRef(re)
  reRef.current = re
  const stirRef = useRef<Stir | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (variant !== 'finale') return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    if (e.buttons > 0 && last.current) {
      stirRef.current = { x, y, dx: x - last.current.x, dy: y - last.current.y }
    }
    last.current = { x, y }
  }

  return (
    <div className={variant === 'finale' ? 'sim-stir' : undefined} onPointerMove={onPointer} onPointerDown={onPointer}>
      <Sim height={height} create={(w, h) => createWing(variant, reRef, stirRef, w, h)}>
        <label className="sim-slider">
          <span>{variant === 'finale' ? 'honey' : ''}</span>
          <input
            type="range"
            min={20}
            max={600}
            step={5}
            value={re}
            onChange={(e) => setRe(Number(e.target.value))}
          />
          <span>{variant === 'finale' ? 'Re' : 'the one slider'}</span>
        </label>
      </Sim>
    </div>
  )
}
