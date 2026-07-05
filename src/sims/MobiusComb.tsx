import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §4 — twist you cannot comb away. Base = a circle, fiber = a segment.
// The reader drags around the ring to "comb" a section s(φ) ∈ [-1, 1].
// In 'cylinder' mode the seam glues straight (s must return to itself);
// in 'mobius' mode the seam glues with one flip (s must return to MINUS itself),
// so a section that is continuous at the seam and nonzero everywhere cannot
// exist — the intermediate value theorem is the referee. Two live meters
// (seam gap, zero crossings) let the reader discover the impossibility by
// exhausting their own attempts. No time evolution — this figure is a game,
// not a flow; step() is a no-op and all state changes come from the pointer.

const M = 96 // samples around the base circle

export type BandKind = 'cylinder' | 'mobius'

interface CombRefs {
  // pointer state written by the wrapper div, read by draw
  drag: { active: boolean; fx: number; fy: number }
}

function createComb(kind: BandKind, refs: CombRefs): Stepper {
  // the section is the stepper's own state — Reset re-runs create and re-combs it
  const s = new Float32Array(M).fill(0.55)

  const applyDrag = (w: number, h: number) => {
    if (!refs.drag.active) return
    const cx = w / 2
    const cy = h / 2
    const px = refs.drag.fx * w - cx
    const py = refs.drag.fy * h - cy
    const phi = Math.atan2(py, px) // (-π, π]
    const idx = Math.round((((phi + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * M) % M
    const rBase = Math.min(w, h) * 0.32
    const halfFiber = Math.min(w, h) * 0.11
    const radial = Math.hypot(px, py) - rBase
    const v = Math.max(-1, Math.min(1, radial / halfFiber))
    // comb with a soft local brush so the section stays smooth
    for (let k = -6; k <= 6; k++) {
      const j = (idx + k + M) % M
      const wgt = Math.exp(-(k * k) / 10)
      s[j] = s[j] * (1 - wgt) + v * wgt
    }
  }

  return {
    step() {
      /* a game, not a flow — state changes come from the pointer only */
    },
    draw(ctx, w, h) {
      applyDrag(w, h)
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const rBase = Math.min(w, h) * 0.32
      const halfFiber = Math.min(w, h) * 0.11

      // fibers: one short radial segment per sampled base point
      ctx.strokeStyle = 'rgba(107,114,128,0.35)'
      ctx.lineWidth = 1
      for (let i = 0; i < M; i += 4) {
        const phi = (i / M) * Math.PI * 2
        const ca = Math.cos(phi)
        const sa = Math.sin(phi)
        ctx.beginPath()
        ctx.moveTo(cx + ca * (rBase - halfFiber), cy + sa * (rBase - halfFiber))
        ctx.lineTo(cx + ca * (rBase + halfFiber), cy + sa * (rBase + halfFiber))
        ctx.stroke()
      }
      // the base circle (the zero of every fiber)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, rBase, 0, Math.PI * 2)
      ctx.stroke()

      // the seam, where the gluing convention lives
      ctx.strokeStyle = kind === 'mobius' ? PALETTE.curv : 'rgba(107,114,128,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx + (rBase - halfFiber) - 4, cy)
      ctx.lineTo(cx + (rBase + halfFiber) + 4, cy)
      ctx.stroke()

      // the section: a curve at radial offset s(φ), drawn in the local charts.
      // Crossing the seam re-reads the value through the gluing map.
      const glue = kind === 'mobius' ? -1 : 1
      ctx.strokeStyle = PALETTE.theta
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= M; i++) {
        const j = i % M
        const v = i === M ? glue * s[0] : s[j] // where the seam claims the curve must land
        const phi = (i / M) * Math.PI * 2
        const r = rBase + v * halfFiber
        const px = cx + Math.cos(phi) * r
        const py = cy + Math.sin(phi) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // zero crossings — the points the comb cannot remove (Möbius) or can (cylinder)
      let crossings = 0
      for (let i = 0; i < M; i++) {
        const a = s[i]
        const b = i === M - 1 ? glue * s[0] : s[i + 1]
        if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) {
          crossings++
          const phi = ((i + 0.5) / M) * Math.PI * 2
          ctx.fillStyle = PALETTE.curv
          ctx.beginPath()
          ctx.arc(cx + Math.cos(phi) * rBase, cy + Math.sin(phi) * rBase, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      const seamGap = Math.abs(glue * s[0] - s[M - 1])

      ctx.fillStyle = '#55606f'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(kind === 'mobius' ? 'gluing at the seam: one flip' : 'gluing at the seam: straight', 12, 20)
      ctx.fillText(`seam gap: ${seamGap.toFixed(2)}   zero crossings: ${crossings}`, 12, 38)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.fillText('drag around the ring to comb the section away from zero', 12, h - 12)
    },
  }
}

export function MobiusComb({ kind }: { kind: BandKind }) {
  const refs = useRef<CombRefs>({
    drag: { active: false, fx: 0, fy: 0 },
  })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    refs.current.drag = {
      active: e.buttons > 0,
      fx: (e.clientX - rect.left) / rect.width,
      fy: (e.clientY - rect.top) / rect.height,
    }
  }

  return (
    <div
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      style={{ touchAction: 'none' }}
    >
      <Sim height={300} create={() => createComb(kind, refs.current)} />
    </div>
  )
}
