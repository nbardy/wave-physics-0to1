import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver } from './lib/solver'
import { PALETTE } from './lib/palette'

// ─────────────────────────────────────────────────────────────────────────────
// Prandtl's sliver, 1904 — the boundary layer on the lesson-01 cylinder, with
// the drag meter that FINALLY moves. This is an HONEST solver figure: the CPU
// Stable-Fluids solve (lib/solver.ts) runs live, the loupe reads the real
// velocity field, and the drag coefficient is INTEGRATED from the solver's
// pressure field — never asserted. On this viscous solver the fore-aft symmetry
// that gave d'Alembert zero drag is broken by the boundary layer and the wake,
// so the meter reads genuinely nonzero. That nonzero number is the article's
// payoff.
//
// Grid / stability: cribbed from CylinderFlow.tsx. INFLOW = 26 cells/s,
// DISC_R = 7 (D = 14), FIXED_DT = 1/40. The semi-Lagrangian advect is
// unconditionally stable and diffusion is implicit-Jacobi (stable for any ν·dt),
// so the CPU solver does not blow up; we inherit that reasoning. Re is fixed at
// a showcase value (below) — the ONE interaction budget is spent on the loupe
// drag, not a slider, so Re is a constant.
// ─────────────────────────────────────────────────────────────────────────────

const NX = 144
const NY = 88
const INFLOW = 26 // cells/s (crib CylinderFlow)
const DISC_R = 7 // cells → D = 14
const FIXED_DT = 1 / 40
const DISC_CX = Math.round(NX * 0.26)
const DISC_CY = Math.round(NY * 0.5) + 1 // slight offset — lets the wake pick a side

// Showcase Reynolds number: high enough that the boundary layer separates and a
// wake forms (so drag is clearly nonzero and the rear-shoulder loupe shows
// reversed near-wall flow), low enough that the modest CPU grid stays clean.
const SHOWCASE_RE = 130
const SHOWCASE_VISC = (INFLOW * DISC_R * 2) / SHOWCASE_RE

// Drag-meter smoothing: exponential moving average with τ ≈ 0.5 s so the reading
// is steady rather than jittering every substep.
const EMA_TAU = 0.5
const RHO = 1 // solver is unit-density

interface LoupeState {
  // loupe center in normalized canvas coords (0..1); default: upper shoulder.
  x: number
  y: number
}

function createLoupe(loupeRef: { current: LoupeState }): Stepper {
  const solver = new FluidSolver(NX, NY, INFLOW, SHOWCASE_VISC)
  solver.addDisc(DISC_CX, DISC_CY, DISC_R)

  // Precompute the mask boundary cells and their outward face normals ONCE:
  // a fluid cell adjacent to a solid cell contributes p·n̂ over that shared face.
  // We sum over these to integrate surface pressure → drag.
  interface FaceCell {
    k: number // fluid cell index just outside the disc
    nx: number // outward normal x (points from solid into fluid)
    ny: number
  }
  const faces: FaceCell[] = []
  for (let j = 1; j < NY - 1; j++) {
    for (let i = 1; i < NX - 1; i++) {
      const k = i + j * NX
      if (solver.solid[k]) continue
      // check the four neighbours; each solid neighbour is one exposed face
      if (solver.solid[k - 1]) faces.push({ k, nx: -1, ny: 0 }) // solid to the left → face normal points -x
      if (solver.solid[k + 1]) faces.push({ k, nx: 1, ny: 0 })
      if (solver.solid[k - NX]) faces.push({ k, nx: 0, ny: -1 })
      if (solver.solid[k + NX]) faces.push({ k, nx: 0, ny: 1 })
    }
  }

  let acc = 0
  let cdEma = 0
  let emaPrimed = false

  const computeDrag = () => {
    // Drag = ∮ p n̂·x̂ ds over the obstacle surface. Sign convention: the fluid's
    // pressure pushes on the solid in the −n̂ direction, so the streamwise force
    // on the body is −Σ p·n̂ₓ·(face length). Face length = 1 cell (h = 1).
    // Downstream (+x) push is positive.
    let fx = 0
    for (const f of faces) {
      fx += -solver.p[f.k] * f.nx
    }
    // normalize by ½ρU²·(2R) → an order-1 drag coefficient
    const norm = 0.5 * RHO * INFLOW * INFLOW * (2 * DISC_R)
    return fx / norm
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 3) {
        solver.step(FIXED_DT)
        const cd = computeDrag()
        // EMA: α from τ so the meter reads steadily
        const alpha = 1 - Math.exp(-FIXED_DT / EMA_TAU)
        if (!emaPrimed) {
          cdEma = cd
          emaPrimed = true
        } else {
          cdEma += alpha * (cd - cdEma)
        }
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const sx = w / NX
      const sy = h / NY

      // ── the speed field as a subtle blue tint + the gray cylinder ──────────
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const k = i + j * NX
          if (solver.solid[k]) {
            ctx.fillStyle = PALETTE.wall
            ctx.fillRect(i * sx, j * sy, sx + 1, sy + 1)
            continue
          }
          const spd = Math.hypot(solver.u[k], solver.v[k])
          const t = Math.min(1, spd / (INFLOW * 1.6))
          // background → soft blue with speed
          const r = Math.round(247 - t * (247 - 191))
          const g = Math.round(249 - t * (249 - 213))
          const b = Math.round(252 - t * (252 - 246))
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(i * sx, j * sy, sx + 1, sy + 1)
        }
      }

      // ── THE LOUPE: circular magnifier over the wall ────────────────────────
      const L = loupeRef.current
      const lcx = L.x * w
      const lcy = L.y * h
      const lr = Math.min(w, h) * 0.22 // loupe radius in px
      const MAG = 4 // magnification

      ctx.save()
      ctx.beginPath()
      ctx.arc(lcx, lcy, lr, 0, Math.PI * 2)
      ctx.clip()
      // clear the loupe interior to a clean backdrop
      ctx.fillStyle = 'rgba(248,250,252,0.96)'
      ctx.fillRect(lcx - lr, lcy - lr, 2 * lr, 2 * lr)

      // The loupe center maps to a grid location; we sample a magnified row of
      // velocity arrows along the radial direction from the disc center THROUGH
      // the loupe point, so "far from wall" → "at the wall" reads left-to-right
      // as the near-wall profile. The reversal at the rear shoulder is not
      // scripted — it comes straight out of solver.u,v.
      const gx = (lcx / w) * NX
      const gy = (lcy / h) * NY
      // radial unit vector pointing from disc center outward through the loupe
      let rdx = gx - DISC_CX
      let rdy = gy - DISC_CY
      const rlen = Math.hypot(rdx, rdy) || 1
      rdx /= rlen
      rdy /= rlen
      // tangential (for laying out the sample row across the loupe)
      const tdx = -rdy
      const tdy = rdx

      const N_ARROWS = 22
      const ARROW_SPAN = lr / MAG // grid-space half-span sampled inside the loupe (in cells, before MAG)
      ctx.lineWidth = 1.4
      ctx.strokeStyle = PALETTE.vel
      ctx.fillStyle = PALETTE.vel
      for (let a = 0; a < N_ARROWS; a++) {
        // distance out along the radial: 0 = at the wall (r = DISC_R), increasing outward
        const frac = a / (N_ARROWS - 1)
        const radialCells = DISC_R + frac * (ARROW_SPAN * 2)
        const sampleX = DISC_CX + rdx * radialCells
        const sampleY = DISC_CY + rdy * radialCells
        if (sampleX < 1 || sampleX > NX - 2 || sampleY < 1 || sampleY > NY - 2) continue
        const si = Math.round(sampleX)
        const sj = Math.round(sampleY)
        const sk = si + sj * NX
        if (solver.solid[sk]) continue
        const uu = solver.u[sk]
        const vv = solver.v[sk]
        // project velocity onto the TANGENTIAL direction — the along-wall speed
        // that plunges to zero at the wall (no-slip) and can reverse in the wake
        const tang = uu * tdx + vv * tdy
        // arrow base position inside the loupe: radial axis vertical, tangential horizontal
        const baseX = lcx + (frac - 0.5) * 2 * lr * 0.85
        const baseY = lcy + lr * 0.5 // draw arrows growing upward from a baseline
        const len = (tang / INFLOW) * lr * 0.9
        ctx.beginPath()
        ctx.moveTo(baseX, baseY)
        ctx.lineTo(baseX + len, baseY)
        ctx.stroke()
        // arrowhead
        const dir = Math.sign(len) || 1
        ctx.beginPath()
        ctx.moveTo(baseX + len + dir * 3, baseY)
        ctx.lineTo(baseX + len - dir * 2, baseY - 2.5)
        ctx.lineTo(baseX + len - dir * 2, baseY + 2.5)
        ctx.closePath()
        ctx.fill()
      }

      // the wall line inside the loupe (a = 0 edge)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(lcx - lr * 0.85, lcy + lr * 0.5)
      ctx.lineTo(lcx - lr * 0.85, lcy - lr * 0.85)
      ctx.stroke()
      ctx.restore()

      // loupe rim
      ctx.strokeStyle = '#78716c' // lesson-03 sepia furniture
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(lcx, lcy, lr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#78716c'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('no-slip', lcx - lr * 0.8, lcy + lr - 6)

      // ── THE DRAG METER (rounded rect, top-right, sepia border) ─────────────
      const mw = 96
      const mh = 40
      const mx = w - mw - 12
      const my = 12
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.strokeStyle = '#78716c'
      ctx.lineWidth = 1.5
      roundRect(ctx, mx, my, mw, mh, 8)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#78716c'
      ctx.font = '11px ui-sans-serif, system-ui'
      ctx.fillText('drag', mx + 10, my + 15)
      ctx.font = '600 18px ui-monospace, SFMono-Regular, monospace'
      ctx.fillText(cdEma.toFixed(3), mx + 10, my + 32)
    },
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function BoundaryLayerLoupe({ height = 280 }: { height?: number }) {
  // Default loupe position: on the cylinder's upper shoulder. In normalized
  // canvas coords — DISC_CX/NX ≈ 0.26, shoulder is up and slightly forward.
  const loupeRef = useRef<LoupeState>({ x: DISC_CX / NX, y: DISC_CY / NY - DISC_R / NY - 0.04 })
  const dragging = useRef(false)

  // The loupe drag IS the figure's one interaction (no slider). sim-stir +
  // touch-action:none so touch drags reach the sim instead of scrolling.
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget.querySelector('canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (e.type === 'pointerdown') {
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      loupeRef.current = { x: clamp01(x), y: clamp01(y) }
    } else if (e.type === 'pointermove' && dragging.current) {
      loupeRef.current = { x: clamp01(x), y: clamp01(y) }
    } else if (e.type === 'pointerup') {
      dragging.current = false
    }
  }

  return (
    <div
      className="sim-stir"
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
    >
      <Sim height={height} create={() => createLoupe(loupeRef)} />
    </div>
  )
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}
