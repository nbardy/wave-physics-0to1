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
// THE GHOST (reader-pass fix, 2026-07-29): the original figure ENFORCED the
// symmetry (one σ drives all four arrows, matrix printed symmetric) and left the
// reason in prose — the counterfactual was never on screen, which is the exact
// "asserts, not demonstrates" disease this lesson's audit hunts. So a second,
// smaller element now stands beside the main one with σyx PINNED AT ZERO while
// σxy still follows your drag: it carries an unbalanced couple, so it SPINS,
// at a rate ∝ the imbalance — and its readout shows ω growing as the element
// is drawn smaller. The symmetric element sits still; the asymmetric one
// cannot. That contrast IS Cauchy's argument.
//   ω integration: dω/dt = torque/I ∝ σxy·side³ / side⁴ = σxy/side — display
//   units, capped at Ω_CAP so the ghost never strobes; unconditionally stable
//   because the angle is a pure integral of a bounded rate.
//
// The main element remains a static readout — its "physics" is the algebraic
// constraint σyx = σxy. Drag sets σ directly.
//
// INTERACTION: ALL FOUR face handles are live. Top/bottom map drag to σ via the
// horizontal drag distance; left/right map via the vertical drag distance. All of
// them write the SAME single shear value σ (the one knob). σ ∈ [−1, 1].
//
// The square shears into a parallelogram; the visual shear angle is EXAGGERATED
// (SHEAR_VIS) so a small σ is legible — display exaggeration, not physical strain.

const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)
const SHEAR_VIS = 0.5 // display exaggeration of the parallelogram skew
const FIXED_DT = 1 / 240 // fixed physics step for the ghosts' spin integral
const OMEGA_K = 1.6 // rad/s of ghost spin per unit σ at relative size 1
// Two ghosts at these fractions of the main element's half-side: the smaller
// one spins 1/RATIO faster — "smaller spins faster" read as a pair, no knob.
const GHOST_SIZES = [0.42, 0.21]

type Face = 'top' | 'bottom' | 'left' | 'right'

function createCube(sigmaRef: { current: number }): Stepper {
  // ghost spin state: angle per ghost, integrated at fixed dt. The rate is
  // bounded (|σ| ≤ 1), so the integral is unconditionally stable.
  const angles = GHOST_SIZES.map(() => 0)
  let acc = 0
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
    step(dt) {
      // The MAIN element needs no integration — its physics is the algebraic
      // constraint σyx = σxy. The GHOSTS integrate their spin: an unbalanced
      // couple σxy (with σyx pinned at 0) torques the element, and the smaller
      // the element the faster it turns (ω ∝ σ / side).
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        const sigma = sigmaRef.current
        GHOST_SIZES.forEach((rel, gi) => {
          angles[gi] += ((OMEGA_K * sigma) / rel) * FIXED_DT
        })
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      const sigma = sigmaRef.current
      ctx.clearRect(0, 0, w, h)
      const cx = w * 0.32
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
      const bx = w * 0.66
      const by = h * 0.1
      ctx.fillText('σ =', bx - 26, by + 22)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by, 96, 40)
      const sxy = sigma.toFixed(2)
      ctx.fillText(`  0.00   ${sigma >= 0 ? ' ' : ''}${sxy}`, bx + 4, by + 16)
      ctx.fillText(`  ${sigma >= 0 ? ' ' : ''}${sxy}   0.00`, bx + 4, by + 32)
      ctx.fillText('σyx = σxy — sits still', bx - 26, by + 56)

      // THE GHOSTS — same σxy, but σyx pinned at 0: an unbalanced couple, so
      // they spin, and the smaller one spins faster (ω ∝ 1/side). This is the
      // counterfactual the symmetry rule forbids, running live beside the rule.
      const gx = w * 0.78
      const gy = h * 0.66
      GHOST_SIZES.forEach((rel, gi) => {
        const gs = s * rel
        const gcx = gx + (gi === 0 ? -gs * 1.4 : gs * 3.2)
        ctx.save()
        ctx.translate(gcx, gy)
        ctx.rotate(angles[gi])
        ctx.strokeStyle = 'rgba(120,113,108,0.8)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(-gs, -gs, 2 * gs, 2 * gs)
        // the one-sided couple: tangential arrows on top/bottom only — the
        // side faces carry NOTHING back, which is exactly the imbalance
        const gm = Math.max(6, Math.abs(sigma) * gs * 0.9) * Math.sign(sigma || 1)
        arrow(ctx, 0, -gs, gm, 0)
        arrow(ctx, 0, gs, -gm, 0)
        ctx.restore()
      })
      ctx.fillStyle = SEPIA
      ctx.font = '600 11px ui-monospace, monospace'
      ctx.fillText('σyx pinned at 0 — they spin,', gx - s * 0.9, gy + s * 0.62)
      ctx.fillText('the smaller one faster', gx - s * 0.9, gy + s * 0.62 + 14)
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
