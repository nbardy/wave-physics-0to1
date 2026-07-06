import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Cauchy, 1823 — the stress tensor and its symmetry.
// A square fluid element sits in the middle. Dragging any face handle applies a
// shear σ. The point of the figure: the stress tensor is SYMMETRIC, σyx = σxy
// ALWAYS. Drag one face and all four faces answer.
//
// Why symmetry? An asymmetric stress (σxy ≠ σyx) leaves a net torque on the
// element. As the element shrinks its moment of inertia falls as (side)⁴ while
// the torque falls only as (side)³, so the angular acceleration would diverge —
// an infinitesimal parcel would spin up to infinite angular velocity. Hence
// σyx = σxy.
//
// This figure is a static readout, not a time integrator — the "physics" is the
// algebraic constraint σyx = σxy. `step` is a no-op; drag sets σ directly.
//
// INTERACTION: ALL FOUR face handles are live. Top/bottom map drag to σ via the
// horizontal drag distance; left/right map via the vertical drag distance. All of
// them write the SAME single shear value σ (the one knob). σ ∈ [−1, 1].
//
// The square shears into a parallelogram; the visual shear angle is EXAGGERATED
// (SHEAR_VIS) so a small σ is legible — display exaggeration, not physical strain.

const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)
const SHEAR_VIS = 0.5 // display exaggeration of the parallelogram skew

type Face = 'top' | 'bottom' | 'left' | 'right'

function createCube(sigmaRef: { current: number }): Stepper {
  const arrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dx: number,
    dy: number,
  ) => {
    const len = Math.hypot(dx, dy)
    if (len < 1) return
    const ux = dx / len
    const uy = dy / len
    ctx.strokeStyle = PALETTE.vel
    ctx.fillStyle = PALETTE.vel
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dx, y + dy)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + dx, y + dy)
    ctx.lineTo(x + dx - ux * 7 - uy * 4, y + dy - uy * 7 + ux * 4)
    ctx.lineTo(x + dx - ux * 7 + uy * 4, y + dy - uy * 7 - ux * 4)
    ctx.closePath()
    ctx.fill()
  }

  return {
    step() {
      // no time integration — the physics here is the algebraic constraint
      // σyx = σxy, applied at draw time.
    },
    draw(ctx, w, h) {
      const sigma = sigmaRef.current
      ctx.clearRect(0, 0, w, h)
      const cx = w * 0.42
      const cy = h * 0.52
      const s = Math.min(w, h) * 0.28 // half-side of the square
      const skew = sigma * SHEAR_VIS * s // horizontal offset of the top edge

      // element sheared into a parallelogram: top edge slides right by +skew,
      // bottom edge by −skew (pure shear, symmetric about the center)
      const corners = [
        { x: cx - s + skew, y: cy - s }, // top-left
        { x: cx + s + skew, y: cy - s }, // top-right
        { x: cx + s - skew, y: cy + s }, // bottom-right
        { x: cx - s - skew, y: cy + s }, // bottom-left
      ]
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.beginPath()
      corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)))
      ctx.closePath()
      ctx.stroke()

      // face-midpoint handles (small grips)
      const mid = (a: number, b: number) => ({
        x: (corners[a].x + corners[b].x) / 2,
        y: (corners[a].y + corners[b].y) / 2,
      })
      const handles: Record<Face, { x: number; y: number }> = {
        top: mid(0, 1),
        right: mid(1, 2),
        bottom: mid(2, 3),
        left: mid(3, 0),
      }
      ctx.fillStyle = SEPIA
      for (const f of ['top', 'right', 'bottom', 'left'] as Face[]) {
        const p = handles[f]
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6)
      }

      // traction arrows on all four faces. Magnitude scales with σ.
      // top/bottom faces: tangential ±σxy (horizontal).
      // left/right faces:  tangential ±σyx (vertical), σyx = σxy ALWAYS.
      const mag = sigma * s * 0.6
      // top face: +x ; bottom face: −x (a shear couple)
      arrow(ctx, handles.top.x, handles.top.y, mag, 0)
      arrow(ctx, handles.bottom.x, handles.bottom.y, -mag, 0)
      // right face: +y ; left face: −y  (the symmetric partner, σyx = σxy)
      arrow(ctx, handles.right.x, handles.right.y, 0, mag)
      arrow(ctx, handles.left.x, handles.left.y, 0, -mag)

      // sepia 2×2 matrix readout: [[σxx, σxy],[σyx, σyy]], σxx=σyy=0 for pure shear
      ctx.fillStyle = SEPIA
      ctx.font = '600 11px ui-monospace, monospace'
      const bx = w * 0.74
      const by = h * 0.2
      ctx.fillText('σ =', bx - 26, by + 22)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by, 96, 40)
      const sxy = sigma.toFixed(2)
      ctx.fillText(`  0.00   ${sigma >= 0 ? ' ' : ''}${sxy}`, bx + 4, by + 16)
      ctx.fillText(`  ${sigma >= 0 ? ' ' : ''}${sxy}   0.00`, bx + 4, by + 32)
      ctx.fillText('σyx = σxy', bx, by + 56)
    },
  }
}

export function StressCube() {
  const sigmaRef = useRef(0.35)
  const dragging = useRef(false)
  const anchor = useRef<{ x: number; y: number; sigma: number } | null>(null)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget.querySelector('canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (e.type === 'pointerdown') {
      dragging.current = true
      anchor.current = { x, y, sigma: sigmaRef.current }
    } else if (e.type === 'pointermove' && dragging.current && anchor.current) {
      // combine horizontal + vertical drag: horizontal drag from top/bottom
      // handles and vertical drag from left/right handles both feed the single σ.
      const a = anchor.current
      const dx = x - a.x
      const dy = y - a.y
      // dominant drag axis maps to σ (both axes carry the same knob)
      const drag = Math.abs(dx) >= Math.abs(dy) ? dx : dy
      const next = a.sigma + drag / (rect.width * 0.3)
      sigmaRef.current = Math.max(-1, Math.min(1, next))
    } else if (e.type === 'pointerup' || e.type === 'pointercancel') {
      dragging.current = false
      anchor.current = null
    }
  }

  // sim-stir on the wrapper so pointer capture doesn't scroll the page on touch
  return (
    <div
      className="sim-stir"
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      onPointerCancel={onPointer}
    >
      <Sim height={260} create={() => createCube(sigmaRef)} />
    </div>
  )
}
