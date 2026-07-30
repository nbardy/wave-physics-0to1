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
    // Drag = ∮ p n̂·x̂ ds over the obstacle surface, downstream (+x) positive.
    //
    // TWO BUGS FIXED HERE (reader pass, 2026-07-29 — the meter read −0.029,
    // i.e. "still zero, and backwards", under the very paragraph whose payoff
    // is that the meter finally moves):
    // 1. SIGN. `f.nx` as constructed above points from FLUID INTO SOLID
    //    (fluid cell with solid at k+1 gets nx=+1). The body's outward normal
    //    is the negation, so the streamwise force on the body is
    //    +Σ p·f.nx — the old code carried the −Σ of the textbook formula on
    //    top of the already-negated normal and computed the force on the
    //    fluid instead.
    // 2. UNITS. `solver.p` is the projection potential of a Stable Fluids
    //    step: the update is u −= ∇p with no dt, so p carries a factor of dt
    //    inside it — physical pressure is p/FIXED_DT. Without it the meter
    //    under-read by 40× and printed 0.029 where the flow's true
    //    coefficient is order 1.
    let fx = 0
    for (const f of faces) {
      fx += (solver.p[f.k] / FIXED_DT) * f.nx
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
      // Layout is the textbook boundary-layer profile: the WALL sits at the
      // bottom, each sample one row higher, each drawn as a horizontal arrow
      // whose length and sign are the local TANGENTIAL velocity. So the reader
      // reads bottom-to-top: zero at the wall (no-slip), growing upward, full
      // stream at the top — and at the rear shoulder the bottom rows point the
      // wrong way. None of that is scripted; every arrow is solver.u,v.
      const L = loupeRef.current
      const lcx = L.x * w
      const lcy = L.y * h
      const lr = Math.min(w, h) * 0.22 // loupe radius in px
      const MAG = 4 // magnification: one grid cell reads MAG× its on-canvas size

      ctx.save()
      ctx.beginPath()
      ctx.arc(lcx, lcy, lr, 0, Math.PI * 2)
      ctx.clip()
      // clear the loupe interior to a clean backdrop
      ctx.fillStyle = 'rgba(248,250,252,0.96)'
      ctx.fillRect(lcx - lr, lcy - lr, 2 * lr, 2 * lr)

      // Where the loupe sits, in grid coordinates, and the radial through it.
      const gx = (lcx / w) * NX
      const gy = (lcy / h) * NY
      let rdx = gx - DISC_CX
      let rdy = gy - DISC_CY
      const rlen = Math.hypot(rdx, rdy) || 1 // loupe distance from disc CENTER, in cells
      rdx /= rlen
      rdy /= rlen
      // Tangential = radial rotated a quarter turn, then oriented so DOWNSTREAM
      // is always +x on screen. Without the flip the disc's lower half would
      // read mirrored and "reversed" would point rightward down there.
      let tdx = -rdy
      let tdy = rdx
      if (tdx < 0 || (tdx === 0 && tdy < 0)) {
        tdx = -tdx
        tdy = -tdy
      }

      // Units, carefully — this is where the old code lied. `lr`, `sx`, `sy` are
      // PIXELS; the sampled window has to be in CELLS. One step of one cell along
      // the radial covers `cellPx` pixels on the unmagnified canvas (sx ≠ sy, so
      // it depends on the radial's direction), and the loupe magnifies by MAG.
      const cellPx = Math.hypot(rdx * sx, rdy * sy) || sx
      const STACK_H = lr * 1.2 // pixel height of the stacked profile
      const spanCells = STACK_H / (MAG * cellPx)
      // The loupe reads the radial where it ACTUALLY SITS: a window centred on
      // its own distance from the disc, clipped so it never starts inside the
      // solid. Park it on the surface → the window starts at the wall and you
      // get the plunge. Lift it into the stream → the wall slides out the bottom
      // and the profile goes uniform, which is Euler's story, honestly drawn.
      const rStart = Math.max(DISC_R, rlen - spanCells * 0.5)
      const yOf = (rCells: number) =>
        lcy + lr * 0.6 - ((rCells - rStart) / spanCells) * STACK_H

      // the wall itself, so "at the wall" is locatable
      const yWall = yOf(DISC_R)
      const wallVisible = yWall < lcy + lr
      if (wallVisible) {
        ctx.fillStyle = PALETTE.wall
        ctx.fillRect(lcx - lr, yWall, 2 * lr, lcy + lr - yWall)
      }

      // the zero line every arrow grows from — makes a reversed arrow unmistakable
      const baseX = lcx - lr * 0.42
      ctx.strokeStyle = 'rgba(120,113,108,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(baseX, lcy - lr)
      ctx.lineTo(baseX, Math.min(lcy + lr, yWall))
      ctx.stroke()

      const N_ARROWS = 22
      const VEL_REF = INFLOW * 1.35 // arrow scale: full stream ≈ ¾ of the max length
      const LEN_MAX = lr * 1.05
      const tips: Array<[number, number]> = []
      ctx.lineWidth = 1.4
      ctx.strokeStyle = PALETTE.vel
      ctx.fillStyle = PALETTE.vel
      for (let a = 0; a < N_ARROWS; a++) {
        const frac = a / (N_ARROWS - 1)
        const rCells = rStart + frac * spanCells
        const sampleX = DISC_CX + rdx * rCells
        const sampleY = DISC_CY + rdy * rCells
        if (sampleX < 0.5 || sampleX > NX - 1.5 || sampleY < 0.5 || sampleY > NY - 1.5) continue
        // Straight out of the solver, bilinearly. Solid cells hold u = v = 0
        // (solver.boundaries() enforces no-slip), so the wall row reads EXACTLY
        // zero without this figure ever asserting it.
        const uu = bilerp(solver.u, sampleX, sampleY)
        const vv = bilerp(solver.v, sampleX, sampleY)
        const tang = uu * tdx + vv * tdy
        const baseY = yOf(rCells)
        const raw = (tang / VEL_REF) * LEN_MAX
        let len = Math.max(-LEN_MAX, Math.min(LEN_MAX, raw))
        // REVERSED flow is drawn in pressure-red and given a legible minimum
        // length. Direction is a SIGN, not a magnitude: in the separated region
        // behind the disc the backflow is real but slow, and at an honest
        // linear scale its arrows were sub-pixel — the reversal the prose
        // points at was invisible. The color flip and the length floor amplify
        // the sign only; magnitude is still the (clamped) linear scale, and
        // truly-zero flow (|tang| below the wall threshold) still draws
        // nothing. Confessed display choice, same spirit as exaggerated shear.
        const reversed = tang < -0.02 * VEL_REF
        if (reversed && len > -6) len = -6
        ctx.strokeStyle = reversed ? PALETTE.pHi : PALETTE.vel
        ctx.fillStyle = reversed ? PALETTE.pHi : PALETTE.vel
        tips.push([baseX + len, baseY])
        ctx.beginPath()
        ctx.moveTo(baseX, baseY)
        ctx.lineTo(baseX + len, baseY)
        ctx.stroke()
        if (Math.abs(len) < 3) continue // no head on a ~zero arrow: don't fake speed at the wall
        const dir = Math.sign(len)
        ctx.beginPath()
        ctx.moveTo(baseX + len + dir * 3, baseY)
        ctx.lineTo(baseX + len - dir * 2, baseY - 2.5)
        ctx.lineTo(baseX + len - dir * 2, baseY + 2.5)
        ctx.closePath()
        ctx.fill()
      }

      // the envelope through the arrow tips — the profile shape itself
      if (tips.length > 1) {
        ctx.strokeStyle = 'rgba(37,99,235,0.45)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(tips[0][0], tips[0][1])
        for (let t = 1; t < tips.length; t++) ctx.lineTo(tips[t][0], tips[t][1])
        ctx.stroke()
      }

      if (wallVisible) {
        ctx.fillStyle = '#57534e'
        ctx.font = '10px ui-sans-serif, system-ui'
        ctx.fillText('no-slip', lcx - lr * 0.86, yWall - 4)
      }
      ctx.restore()

      // loupe rim
      ctx.strokeStyle = '#78716c' // lesson-03 sepia furniture
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(lcx, lcy, lr, 0, Math.PI * 2)
      ctx.stroke()

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

/** Bilinear read of a solver field at fractional grid coords (clamped to the grid). */
function bilerp(f: Float32Array, x: number, y: number): number {
  const cx = Math.min(Math.max(x, 0), NX - 1.001)
  const cy = Math.min(Math.max(y, 0), NY - 1.001)
  const i0 = Math.floor(cx)
  const j0 = Math.floor(cy)
  const tx = cx - i0
  const ty = cy - j0
  const k = i0 + j0 * NX
  const a = f[k]
  const b = f[k + 1]
  const c = f[k + NX]
  const d = f[k + NX + 1]
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
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
