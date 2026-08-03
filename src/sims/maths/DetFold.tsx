import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  foldMap,
  drawGridImage,
  drawStampImage,
  stampAreaRatio,
  paneFrame,
  clipPane,
  fmt,
  FONT_LABEL,
  FONT_METER,
  type View,
  type Rect,
} from './lib'

// PLAN figure 5 — the area receipt is signed. The fold slider drives
// det J at the stamp linearly through zero: the stamp thins to a needle,
// then comes out mirrored (watch its corner dot switch sides) while the
// receipt reads negative. The receipt is a signed shoelace measurement of
// the drawn boundary, so the mirror and the minus sign are the same fact.

const HALF = 1.3
const SIDE = 0.42

function createDetFold(sRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const map = foldMap(sRef.current)
      const r: Rect = { x: Math.max(0, (w - (h - 58) * 1.6) / 2), y: 4, w: Math.min(w, (h - 58) * 1.6), h: h - 62 }
      const view: View = { cx: 0, cy: 0, half: HALF }
      ctx.save()
      clipPane(ctx, r)
      drawGridImage(ctx, r, view, map, 0, 0, HALF, 'rgba(37,99,235,0.4)', true)
      drawStampImage(ctx, r, view, map, 0, 0, SIDE)
      ctx.restore()
      paneFrame(ctx, r)

      // the signed receipt, measured from the boundary just drawn
      const ratio = stampAreaRatio(map, 0, 0, SIDE)
      const bx = r.x + 8
      const by = r.y + r.h + 24
      const bw = r.w - 16
      const mid = bx + bw / 2
      ctx.strokeStyle = 'rgba(120,140,170,0.6)'
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by - 9, bw, 18)
      ctx.beginPath()
      ctx.moveTo(mid, by - 12)
      ctx.lineTo(mid, by + 12)
      ctx.stroke()
      const extent = Math.max(-1.05, Math.min(1.05, ratio)) * (bw / 2 / 1.1)
      ctx.fillStyle = PALETTE.area
      if (extent >= 0) ctx.fillRect(mid, by - 7, extent, 14)
      else ctx.fillRect(mid + extent, by - 7, -extent, 14)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.area
      ctx.fillText(`area ×${fmt(ratio)}`, bx, by - 15)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('0', mid + 5, by + 22)
    },
  }
}

export function DetFold() {
  const [s, setS] = useState(0)
  const sRef = useRef(s)
  sRef.current = s

  return (
    <Sim height={300} animated={false} create={() => createDetFold(sRef)}>
      <label className="sim-slider">
        <span>flat</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={s}
          onChange={(e) => setS(Number(e.target.value))}
        />
        <span>folded</span>
      </label>
    </Sim>
  )
}
