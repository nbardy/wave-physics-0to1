import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  landGrad,
  landHess,
  eigSym,
  CRITICAL,
  paneFrame,
  clipPane,
  toPx,
  FONT_LABEL,
  FONT_METER,
  type View,
  type Rect,
} from './lib'
import { terrainCanvas, drawContours, CONTOUR_LEVELS } from './terrain'

// PLAN v2 figure 9 — the automatic surveyor. Classify every point of the
// terrain by the SIGNS of its Hessian eigenvalues: both down = dome (red),
// both up = bowl (cyan), mixed = saddle-shaped ground (violet). Opacity of
// each cell scales with the weaker curvature's magnitude, so genuinely flat
// ground stays quiet. Summits, basins, and passes light up with nobody
// pointing at them — this is the working principle of DEM terrain classifiers
// and of det-H blob tests in vision (SIFT).

const HALF = 1.9
const RES = 96

interface Shared {
  opacity: number
}

// classification layer is static — compute once per mount at module scope? No:
// per-create, so Reset re-derives it honestly from landHess.
function classLayer(view: View): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = RES
  c.height = RES
  const ctx = c.getContext('2d')
  if (!ctx) return c
  const img = ctx.createImageData(RES, RES)
  const d = img.data
  for (let j = 0; j < RES; j++) {
    for (let i = 0; i < RES; i++) {
      const x = view.cx - view.half + ((i + 0.5) / RES) * 2 * view.half
      const y = view.cy + view.half - ((j + 0.5) / RES) * 2 * view.half
      const { l1, l2 } = eigSym(landHess(x, y))
      const o = (j * RES + i) * 4
      // A surveyor's glow, not a wash: light up where the ground is nearly
      // LEVEL (gradient small — a summit candidate must first be flat) and
      // genuinely curved, which is how DEM peak/pass detectors actually gate.
      // Keying on curvature alone tinted the whole sheet violet (two failed
      // cuts, 2026-07-31) because midland saddle curvature is as strong as
      // the critical points' own.
      const [gx, gy] = landGrad(x, y)
      const level = Math.max(0, 1 - Math.hypot(gx, gy) / 1.4)
      const curved = Math.min(1, Math.min(Math.abs(l1), Math.abs(l2)) / 0.6)
      const strength = level * level * curved
      let rgb: [number, number, number]
      if (l1 < 0 && l2 < 0) rgb = [220, 38, 38] // dome
      else if (l1 > 0 && l2 > 0) rgb = [8, 145, 178] // bowl
      else rgb = [124, 58, 237] // saddle-shaped
      d[o] = rgb[0]
      d[o + 1] = rgb[1]
      d[o + 2] = rgb[2]
      d[o + 3] = Math.round(200 * strength)
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

function createCurvatureMap(sharedRef: { current: Shared }): Stepper {
  const view: View = { cx: 0, cy: 0, half: HALF }
  const layer = classLayer(view)
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const size = Math.min(w, h - 8)
      const r: Rect = { x: (w - size) / 2, y: 4, w: size, h: size }
      ctx.save()
      clipPane(ctx, r)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(terrainCanvas(view), r.x, r.y, r.w, r.h)
      drawContours(ctx, r, view, CONTOUR_LEVELS, 'rgba(90,70,40,0.35)')
      ctx.globalAlpha = sharedRef.current.opacity
      ctx.drawImage(layer, r.x, r.y, r.w, r.h)
      ctx.globalAlpha = 1
      // the named critical points, marked — including the twin pass the
      // survey turns up on its own
      for (const key of ['pit', 'peak', 'pass', 'pass2'] as const) {
        const [cx, cy] = CRITICAL[key]
        const [px, py] = toPx(view, r, cx, cy)
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.stamp
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
      ctx.restore()
      paneFrame(ctx, r)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.hi
      ctx.fillText('dome', r.x + 8, r.y + 20)
      ctx.fillStyle = PALETTE.lo
      ctx.fillText('bowl', r.x + 56, r.y + 20)
      ctx.fillStyle = PALETTE.area
      ctx.fillText('saddle-shaped', r.x + 100, r.y + 20)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(26,31,43,0.75)'
      ctx.fillText('lit where the ground is nearly level — colored by its curvature', r.x + 8, r.y + 36)
    },
  }
}

export function CurvatureMap() {
  const [opacity, setOpacity] = useState(0)
  const sharedRef = useRef<Shared>({ opacity })
  sharedRef.current.opacity = opacity

  return (
    <Sim height={330} animated={false} create={() => createCurvatureMap(sharedRef)}>
      <label className="sim-slider">
        <span>terrain</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
        />
        <span>survey</span>
      </label>
    </Sim>
  )
}
