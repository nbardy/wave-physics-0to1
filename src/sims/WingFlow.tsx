import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { acquireGpu } from './lib/gpu/context'
import { FluidSolverGPU } from './lib/gpu/solver_gpu'
import { DyeRendererGPU } from './lib/gpu/render_gpu'

// §1 hero · §12 finale — the wing. Two currents of dye (amber above, rose
// below) split at the leading edge of a NACA airfoil; the tilt slider is the
// angle of attack. Tilt far enough and the upper current tears off the
// surface — the finale names that. CylinderFlow keeps the cylinder variants
// (§7 regime, §9 broken); this component exists so the wing can't disturb
// the cylinder's hard-won Kármán tuning.
//
// Backends and honesty rules follow CylinderFlow exactly: WebGPU compute at
// 4× grid (where the wake actually sheds), CPU reference otherwise, fixed
// timestep, Reynolds number defined on the chord: Re = U·c/ν.

const NX = 144
const NY = 88
const INFLOW = 26 // cells/s
const CHORD = 40 // cells
const PIVOT_X = Math.round(NX * 0.3)
const PIVOT_Y = Math.round(NY * 0.5)
const FIXED_DT = 1 / 40
const HERO_RE = 250 // chord-based; dynamically similar to the cylinder hero's Re ≈ 90 on its diameter
const DYE_ROWS = [12, 20, 28, 36, 42] // amber, upper half
const DYE2_ROWS = [46, 52, 60, 68, 76] // rose, lower half
// re-stamping the mask mid-drag is cheap but not free; skip sub-half-degree moves
const RESTAMP_EPS = (0.4 * Math.PI) / 180

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

function drawLabels(
  ctx: CanvasRenderingContext2D,
  h: number,
  variant: WingVariant,
  tiltDeg: number,
  re: number,
) {
  ctx.fillStyle = 'rgba(26,31,43,0.65)'
  ctx.font = '12px ui-sans-serif, system-ui'
  const tilt = `tilt ${Math.round(tiltDeg)}°`
  ctx.fillText(variant === 'finale' ? `${tilt} · Re ≈ ${Math.round(re)}` : tilt, 10, h - 10)
}

function createCpuWing(
  variant: WingVariant,
  tiltRef: { current: number },
  reRef: { current: number },
  stirRef: { current: Stir | null },
): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscOf(INFLOW, CHORD, reRef.current))
  let stamped = (tiltRef.current * Math.PI) / 180
  solver.setAirfoil(PIVOT_X, PIVOT_Y, CHORD, stamped)
  const renderer = new SolverRenderer(solver)

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.visc = viscOf(INFLOW, CHORD, reRef.current)
        const angle = (tiltRef.current * Math.PI) / 180
        if (Math.abs(angle - stamped) > RESTAMP_EPS) {
          solver.setAirfoil(PIVOT_X, PIVOT_Y, CHORD, angle)
          stamped = angle
        }
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
      drawLabels(ctx, h, variant, tiltRef.current, (INFLOW * CHORD) / solver.visc)
    },
  }
}

function createGpuWing(
  device: GPUDevice,
  variant: WingVariant,
  tiltRef: { current: number },
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
  let stamped = (tiltRef.current * Math.PI) / 180
  solver.setAirfoil(GPIVOT_X, GPIVOT_Y, GCHORD, stamped)
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
        const angle = (tiltRef.current * Math.PI) / 180
        if (Math.abs(angle - stamped) > RESTAMP_EPS) {
          solver.setAirfoil(GPIVOT_X, GPIVOT_Y, GCHORD, angle)
          stamped = angle
        }
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
      drawLabels(ctx, h, variant, tiltRef.current, re)
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
  tiltRef: { current: number },
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
      inner = createGpuWing(gpu.device, variant, tiltRef, reRef, stirRef, width, height)
    } else {
      console.info(`WingFlow: CPU solver fallback — ${gpu.reason}`)
      inner = createCpuWing(variant, tiltRef, reRef, stirRef)
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
  const [tilt, setTilt] = useState(12)
  const [re, setRe] = useState(HERO_RE)
  const tiltRef = useRef(tilt)
  tiltRef.current = tilt
  const reRef = useRef(re)
  reRef.current = variant === 'hero' ? HERO_RE : re
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
      <Sim height={height} create={(w, h) => createWing(variant, tiltRef, reRef, stirRef, w, h)}>
        <label className="sim-slider">
          <span>level</span>
          <input
            type="range"
            min={0}
            max={24}
            step={0.5}
            value={tilt}
            onChange={(e) => setTilt(Number(e.target.value))}
          />
          <span>tilted</span>
        </label>
        {variant === 'finale' && (
          <label className="sim-slider">
            <span>honey</span>
            <input
              type="range"
              min={20}
              max={600}
              step={5}
              value={re}
              onChange={(e) => setRe(Number(e.target.value))}
            />
            <span>Re</span>
          </label>
        )}
      </Sim>
    </div>
  )
}
