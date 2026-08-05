import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  landGrad,
  drawArrow,
  paneFrame,
  clipPane,
  toPx,
  fromPx,
  fmt,
  FONT_LABEL,
  FONT_METER,
  INK,
  type View,
  type Rect,
} from './lib'
import { terrainCanvas, drawContours, CONTOUR_LEVELS } from './terrain'

// PLAN v2 figure 7 — GradField re-dressed as the backcountry map sheet, and
// carrying GradField's post-feedback loupe design (Nick couldn't tell what
// bare H-columns were for): the right pane shows the probe's arrow plus two
// GHOST arrows — the actual gradient one lattice step east and one step north
// (sample points dotted on the map) — with blue/green segments joining
// arrowhead to arrowhead. The segment IS the step's effect; H files the two
// segments as columns. The meter is a MEASURED centered difference of the
// same gradient the ghosts draw (exact here: the landscape is cubic, so the
// quotient's error term vanishes).

const HALF = 1.9
const LATTICE_N = 9
const STEP = (2 * HALF) / LATTICE_N

interface Shared {
  probe: { x: number; y: number }
}

function panes(w: number, h: number): { left: Rect; right: Rect } {
  const gap = 12
  const side = Math.min((w - gap) / 2, h - 8)
  return {
    left: { x: w / 2 - gap / 2 - side, y: 4, w: side, h: side },
    right: { x: w / 2 + gap / 2, y: 4, w: side, h: side },
  }
}

function createTerrainField(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { left, right } = panes(w, h)
      const view: View = { cx: 0, cy: 0, half: HALF }
      const p = sharedRef.current.probe
      const g = landGrad(p.x, p.y)
      const gE = landGrad(p.x + STEP, p.y)
      const gN = landGrad(p.x, p.y + STEP)
      const gW = landGrad(p.x - STEP, p.y)
      const gS = landGrad(p.x, p.y - STEP)
      const H: [number, number, number, number] = [
        (gE[0] - gW[0]) / (2 * STEP),
        (gN[0] - gS[0]) / (2 * STEP),
        (gE[1] - gW[1]) / (2 * STEP),
        (gN[1] - gS[1]) / (2 * STEP),
      ]

      // ---- left: the map sheet ----
      ctx.save()
      clipPane(ctx, left)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(terrainCanvas(view), left.x, left.y, left.w, left.h)
      drawContours(ctx, left, view, CONTOUR_LEVELS)
      const n = LATTICE_N
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const x = -HALF + ((i + 0.5) / n) * 2 * HALF
          const y = -HALF + ((j + 0.5) / n) * 2 * HALF
          const [gx, gy] = landGrad(x, y)
          const [px, py] = toPx(view, left, x, y)
          const s = (left.w / (2 * HALF)) * 0.09
          drawArrow(ctx, px, py, px + gx * s, py - gy * s, 'rgba(219,39,119,0.6)', 1.4)
        }
      }
      const [ppx, ppy] = toPx(view, left, p.x, p.y)
      const S = (left.w / (2 * HALF)) * 0.18
      drawArrow(ctx, ppx, ppy, ppx + g[0] * S, ppy - g[1] * S, PALETTE.grad, 2.6)
      ctx.beginPath()
      ctx.arc(ppx, ppy, 10, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2
      ctx.stroke()
      // where the ghosts are measured: one lattice step east, one step north
      const [epx, epy] = toPx(view, left, p.x + STEP, p.y)
      const [npx, npy] = toPx(view, left, p.x, p.y + STEP)
      ctx.beginPath()
      ctx.arc(epx, epy, 3, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.ex
      ctx.fill()
      ctx.beginPath()
      ctx.arc(npx, npy, 3, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.ey
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, left)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(26,31,43,0.8)'
      ctx.fillText('the map sheet and its uphill arrows — drag the ring', left.x + 8, left.y + 16)

      // ---- right: the arrow loupe — arrow, ghosts, and the two motions ----
      ctx.save()
      clipPane(ctx, right)
      const ox = right.x + right.w * 0.46
      const oy = right.y + right.h * 0.54
      const AS = right.w * 0.24
      const tx = ox + g[0] * AS
      const ty = oy - g[1] * AS
      // ghosts first: the arrow as it IS one step east / north, tails pinned
      // to the same origin so the change is the only difference on screen
      ctx.save()
      ctx.setLineDash([5, 4])
      drawArrow(ctx, ox, oy, ox + gE[0] * AS, oy - gE[1] * AS, 'rgba(37,99,235,0.45)', 2)
      drawArrow(ctx, ox, oy, ox + gN[0] * AS, oy - gN[1] * AS, 'rgba(5,150,105,0.45)', 2)
      ctx.restore()
      // the arrowhead's actual travel for each step: head → ghost head
      drawArrow(ctx, tx, ty, ox + gE[0] * AS, oy - gE[1] * AS, PALETTE.ex, 2.4)
      drawArrow(ctx, tx, ty, ox + gN[0] * AS, oy - gN[1] * AS, PALETTE.ey, 2.4)
      // the arrow at the probe, on top
      drawArrow(ctx, ox, oy, tx, ty, PALETTE.grad, 3)
      ctx.beginPath()
      ctx.arc(ox, oy, 3.4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, right)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the arrow here — and one step east, one step north', right.x + 8, right.y + 16)

      // the landing report of the gradient map — columns colored, measured
      const mx = right.x + 10
      const my = right.y + right.h - 52
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      ctx.fillText('H =', mx, my + 24)
      const bx = mx + 34
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(bx + 6, my + 4)
      ctx.lineTo(bx, my + 4)
      ctx.lineTo(bx, my + 38)
      ctx.lineTo(bx + 6, my + 38)
      ctx.moveTo(bx + 96, my + 4)
      ctx.lineTo(bx + 102, my + 4)
      ctx.lineTo(bx + 102, my + 38)
      ctx.lineTo(bx + 96, my + 38)
      ctx.stroke()
      ctx.fillStyle = PALETTE.ex
      ctx.fillText(fmt(H[0]), bx + 10, my + 17)
      ctx.fillText(fmt(H[2]), bx + 10, my + 35)
      ctx.fillStyle = PALETTE.ey
      ctx.fillText(fmt(H[1]), bx + 56, my + 17)
      ctx.fillText(fmt(H[3]), bx + 56, my + 35)
    },
  }
}

export function TerrainField() {
  // default probe on the basin rim, where both step-segments read at a glance
  const sharedRef = useRef<Shared>({ probe: { x: 0.9, y: 0.9 } })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { left } = panes(rect.width, el.clientHeight)
    if (px < left.x || px > left.x + left.w || py < left.y || py > left.y + left.h) return
    const view: View = { cx: 0, cy: 0, half: HALF }
    const [x, y] = fromPx(view, left, px, py)
    const cap = HALF - STEP * 1.1 // keep the ghost sample points on the sheet
    sharedRef.current.probe = {
      x: Math.max(-cap, Math.min(cap, x)),
      y: Math.max(-cap, Math.min(cap, y)),
    }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={300} animated={false} create={() => createTerrainField(sharedRef)} />
    </div>
  )
}
