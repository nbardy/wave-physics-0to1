import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver, SolverRenderer } from './lib/solver'
import { acquireGpu } from './lib/gpu/context'
import { FluidSolverGPU } from './lib/gpu/solver_gpu'
import { DyeRendererGPU, type Overlay } from './lib/gpu/render_gpu'

// §1 hero · §7 regime tour · §9 broken fluid · §12 finale — one component,
// one protagonist: the flow past a cylinder, computed live by Stable Fluids.
//
// Two backends, same scheme: WebGPU compute at 4× grid resolution
// (lib/gpu/solver_gpu.ts — where the Kármán street actually appears, because
// semi-Lagrangian numerical diffusion shrinks with the cell size), or the CPU
// reference solver (lib/solver.ts) where WebGPU is unavailable. The backend
// decision is typed (GpuContext) and made exactly once, at creation.
//
// The Re slider maps to viscosity: Re = U·D/ν with U (inflow) and D (disc
// diameter) fixed, so dragging the slider is literally dragging ν down and Re
// up. Both backends scale U, D, ν together, so the displayed Re — the honest
// grid-unit ratio, order-of-magnitude — is the same number on either.
//
// variant 'broken' runs with the projection OFF and the divergence overlay ON:
// stable numerics, wrong physics — dye piles up and the violet meter lights.

const NX = 144
const NY = 88
const INFLOW = 26 // cells/s
const DISC_R = 7 // cells → D = 14
const FIXED_DT = 1 / 40
const DYE_ROWS = [10, 18, 26, 34, 44, 54, 62, 70, 78]

// GPU grid: same domain, 4× denser. U and D are 4× in cell units (same in
// domain units); ν in cells²/s picks up 16× through viscOf, so Re is unchanged.
const SCALE = 4
const GNX = NX * SCALE
const GNY = NY * SCALE
const GINFLOW = INFLOW * SCALE
const GDISC_R = DISC_R * SCALE
// two adjacent rows per emitter: streaklines stay visible when cells shrink 4×
const GDYE_ROWS = DYE_ROWS.flatMap((j) => [j * SCALE, j * SCALE + 1])

export type CylinderVariant = 'hero' | 'regime' | 'broken' | 'finale'

type Stir = { x: number; y: number; dx: number; dy: number }

function reOf(inflow: number, discR: number, visc: number) {
  return (inflow * discR * 2) / visc
}
function viscOf(inflow: number, discR: number, re: number) {
  return (inflow * discR * 2) / re
}

/** The 2-D chrome both backends share: Re label, broken-variant caption. */
function drawLabels(
  ctx: CanvasRenderingContext2D,
  h: number,
  variant: CylinderVariant,
  re: number,
  brokenTime: number,
) {
  if (variant === 'regime' || variant === 'finale') {
    ctx.fillStyle = 'rgba(26,31,43,0.65)'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText(`Re ≈ ${Math.round(re)}`, 10, h - 10)
  }
  if (variant === 'broken' && brokenTime > 1) {
    ctx.fillStyle = 'rgba(124,58,237,0.85)'
    ctx.font = '600 12px ui-sans-serif, system-ui'
    ctx.fillText('violet = fluid being created or destroyed', 10, 18)
  }
}

function createCpuCylinder(
  variant: CylinderVariant,
  reRef: { current: number },
  stirRef: { current: Stir | null },
): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, viscOf(INFLOW, DISC_R, reRef.current))
  // disc slightly off the vertical center-line: the tiny asymmetry that lets
  // the vortex street start (a perfectly symmetric solve would sit unstable)
  solver.addDisc(Math.round(NX * 0.26), Math.round(NY * 0.5) + 1, DISC_R)
  if (variant === 'broken') solver.toggles.project = false
  const renderer = new SolverRenderer(solver)

  let acc = 0
  let brokenTime = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.visc = viscOf(INFLOW, DISC_R, reRef.current)
        solver.injectDyeStripe(DYE_ROWS, 1)
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
        if (variant === 'broken') {
          solver.computeDivergence() // keep the meter live
          brokenTime += FIXED_DT
        }
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, variant === 'broken' ? 'divergence' : 'none')
      drawLabels(ctx, h, variant, reOf(INFLOW, DISC_R, solver.visc), brokenTime)
    },
  }
}

function createGpuCylinder(
  device: GPUDevice,
  variant: CylinderVariant,
  reRef: { current: number },
  stirRef: { current: Stir | null },
  width: number,
  height: number,
): Stepper {
  const solver = new FluidSolverGPU(device, {
    nx: GNX,
    ny: GNY,
    inflow: GINFLOW,
    visc: viscOf(GINFLOW, GDISC_R, reRef.current),
    dyeRows: GDYE_ROWS, // emitters run every step, like injectDyeStripe per substep
    toggles: { advect: true, diffuse: true, project: variant !== 'broken' },
  })
  solver.addDisc(Math.round(GNX * 0.26), Math.round(GNY * 0.5) + SCALE, GDISC_R)
  const dpr = window.devicePixelRatio || 1
  const renderer = new DyeRendererGPU(device, solver, width * dpr, height * dpr)
  const overlay: Overlay = variant === 'broken' ? 'divergence' : 'none'

  let acc = 0
  let brokenTime = 0
  let re = reRef.current
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        re = reRef.current
        solver.visc = viscOf(GINFLOW, GDISC_R, re)
        const stir = stirRef.current
        if (stir) {
          // impulse strength is in cells/s — scales with the grid like inflow
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
        if (variant === 'broken') {
          solver.computeDivergence() // keep the meter live
          brokenTime += FIXED_DT
        }
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      renderer.draw(ctx, w, h, overlay)
      drawLabels(ctx, h, variant, re, brokenTime)
    },
    dispose() {
      renderer.destroy()
      solver.destroy()
    },
  }
}

/**
 * The returned stepper starts empty and fills in when the (async, one-time,
 * page-shared) GPU probe resolves — a frame or two of background, then the
 * chosen backend. `inner` being null IS the pending state; no other code
 * asks about GPU availability.
 */
function createCylinder(
  variant: CylinderVariant,
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
      inner = createGpuCylinder(gpu.device, variant, reRef, stirRef, width, height)
    } else {
      console.info(`CylinderFlow: CPU solver fallback — ${gpu.reason}`)
      inner = createCpuCylinder(variant, reRef, stirRef)
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

export function CylinderFlow({
  variant,
  height = 280,
}: {
  variant: CylinderVariant
  height?: number
}) {
  const [re, setRe] = useState(variant === 'broken' ? 120 : 90)
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
      <Sim height={height} create={(w, h) => createCylinder(variant, reRef, stirRef, w, h)}>
        {variant !== 'hero' && variant !== 'broken' && (
          <label className="sim-slider">
            <span>honey</span>
            <input
              type="range"
              min={2}
              max={400}
              step={1}
              value={re}
              onChange={(e) => setRe(Number(e.target.value))}
            />
            <span>Re</span>
          </label>
        )}
        {variant === 'hero' && (
          <label className="sim-slider">
            <span></span>
            <input
              type="range"
              min={2}
              max={400}
              step={1}
              value={re}
              onChange={(e) => setRe(Number(e.target.value))}
            />
            <span>the one slider</span>
          </label>
        )}
      </Sim>
    </div>
  )
}
