import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, drawArrow, fmt, FONT_LABEL, FONT_METER, INK, type Rect } from './lib'
import {
  PROJS,
  PLATE,
  type Proj,
  rad,
  fitWorld,
  mapToPx,
  pxToMap,
  geodesicCircle,
  capArea,
  planarArea,
  fmtTimes,
  drawCoastlines,
  drawGraticule,
  drawGeoPath,
  type MapPane,
} from './carto'

// PLAN v2 figures 2 and 3 — the probe circle and the landing report.
//   blob   — a geodesic circle on the ground, seen through Mercator. The right
//            pane shows the projected blob NORMALIZED by the circle's radius:
//            big circles come back bent; shrink the circle and a perfect
//            ellipse emerges. The ellipse is never drawn from J — it emerges
//            from sphere-sampled points pushed through the chart.
//   matrix — fixed small circle, projection selector, ground arrows and the
//            live 2×2 landing report with colored columns.

export type TissotMode = 'blob' | 'matrix'

// blob mode runs on the NAIVE GRID, not Mercator: conformal maps print every
// small circle as a circle, so the emergence-to-an-ellipse story needs a
// projection whose ellipses are honestly eccentric (caught in the 2026-07-31
// reader pass). Caps keep circle tops under the printable strip.
const BLOB_LAT_CAP = rad(56)
const MATRIX_LAT_CAP = rad(70)
const MATRIX_RHO = rad(5)

interface Shared {
  probe: [number, number] // lon, lat radians
  rho: number // blob mode: angular radius
  proj: Proj
}

function panes(w: number, h: number): { left: Rect; right: Rect } {
  const gap = 12
  const rightW = Math.min(h - 8, (w - gap) * 0.42)
  const leftW = w - gap - rightW - 8
  return {
    left: { x: 4, y: 4, w: leftW, h: h - 8 },
    right: { x: 4 + leftW + gap, y: 4, w: rightW, h: h - 8 },
  }
}

function drawMatrix(ctx: CanvasRenderingContext2D, x: number, y: number, m: [number, number, number, number]) {
  ctx.font = FONT_METER
  ctx.fillStyle = INK
  ctx.fillText('J =', x, y + 22)
  const bx = x + 30
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(bx + 6, y + 2)
  ctx.lineTo(bx, y + 2)
  ctx.lineTo(bx, y + 36)
  ctx.lineTo(bx + 6, y + 36)
  ctx.moveTo(bx + 96, y + 2)
  ctx.lineTo(bx + 102, y + 2)
  ctx.lineTo(bx + 102, y + 36)
  ctx.lineTo(bx + 96, y + 36)
  ctx.stroke()
  ctx.fillStyle = PALETTE.ex
  ctx.fillText(fmt(m[0]), bx + 10, y + 15)
  ctx.fillText(fmt(m[2]), bx + 10, y + 33)
  ctx.fillStyle = PALETTE.ey
  ctx.fillText(fmt(m[1]), bx + 56, y + 15)
  ctx.fillText(fmt(m[3]), bx + 56, y + 33)
}

function createTissot(mode: TissotMode, sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { left, right } = panes(w, h)
      const shared = sharedRef.current
      const proj = mode === 'blob' ? PLATE : shared.proj
      const rho = mode === 'blob' ? shared.rho : MATRIX_RHO
      const [plon, plat] = shared.probe
      const pane: MapPane = fitWorld(proj, left)
      const circle = geodesicCircle(plon, plat, rho, 96)

      // ---- left: the world under the projection, circle drawn on it ----
      ctx.save()
      clipPane(ctx, left)
      drawGraticule(ctx, pane)
      drawCoastlines(ctx, pane)
      ctx.strokeStyle = PALETTE.stamp
      ctx.fillStyle = 'rgba(217,119,6,0.15)'
      ctx.lineWidth = 2
      drawGeoPath(ctx, pane, circle, true)
      ctx.fill()
      ctx.stroke()
      const [ppx, ppy] = mapToPx(pane, ...proj.xy(plon, plat))
      ctx.beginPath()
      ctx.arc(ppx, ppy, 3, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, left)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`${proj.label} — drag the circle`, left.x + 8, left.y + 16)

      // ---- right: the blob, normalized by the circle's ground radius ----
      const [cx0, cy0] = proj.xy(plon, plat)
      const unit = right.w * (mode === 'blob' ? 0.2 : 0.16) // px per ground-radius
      const ox = right.x + right.w / 2
      const oy = right.y + right.h / 2
      ctx.save()
      clipPane(ctx, right)
      // ground truth: the unit circle, dashed
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(85,96,111,0.6)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(ox, oy, unit, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // the projected blob, normalized: (X(p) − X(c)) / rho
      ctx.strokeStyle = PALETTE.stamp
      ctx.fillStyle = 'rgba(217,119,6,0.15)'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      const normPts: Array<[number, number]> = []
      for (let i = 0; i <= circle.length; i++) {
        const [lon, lat] = circle[i % circle.length]
        const [x, y] = proj.xy(lon, lat)
        let dx = x - cx0
        if (dx > Math.PI) dx -= 2 * Math.PI
        if (dx < -Math.PI) dx += 2 * Math.PI
        const nx = ox + (dx / rho) * unit
        const ny = oy - ((y - cy0) / rho) * unit
        normPts.push([dx / rho, (y - cy0) / rho])
        if (i === 0) ctx.moveTo(nx, ny)
        else ctx.lineTo(nx, ny)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      if (mode === 'matrix') {
        // landings of the unit ground arrows, plus dashed ghosts of honesty
        const J = proj.groundJac(plon, plat)
        drawArrow(ctx, ox, oy, ox + J[0] * unit, oy - J[2] * unit, PALETTE.ex, 2.4)
        drawArrow(ctx, ox, oy, ox + J[1] * unit, oy - J[3] * unit, PALETTE.ey, 2.4)
        ctx.save()
        ctx.setLineDash([4, 4])
        ctx.globalAlpha = 0.45
        drawArrow(ctx, ox, oy, ox + unit, oy, PALETTE.ex, 1.4)
        drawArrow(ctx, ox, oy, ox, oy - unit, PALETTE.ey, 1.4)
        ctx.restore()
      }
      ctx.restore()
      paneFrame(ctx, right)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        mode === 'blob' ? 'the circle, magnified to unit size' : 'landings of the ground arrows',
        right.x + 8,
        right.y + 16,
      )

      // meters
      ctx.font = FONT_METER
      if (mode === 'blob') {
        ctx.fillStyle = PALETTE.stamp
        ctx.fillText(`circle: ${(rho / rad(1)).toFixed(0)}° of ground across`, right.x + 8, right.y + right.h - 10)
      } else {
        drawMatrix(ctx, right.x + 8, right.y + right.h - 52, proj.groundJac(plon, plat))
        // measured receipt beside it, planar over spherical, from drawn points
        const projected = circle.map(([lon, lat]) => proj.xy(lon, lat))
        const receipt = planarArea(projected) / capArea(rho)
        ctx.fillStyle = PALETTE.area
        ctx.fillText(`area ${fmtTimes(receipt)}`, right.x + 8, right.y + right.h - 62)
      }
    },
  }
}

const SELECTABLE: Array<Proj['key']> = ['plate', 'mercator', 'sinusoidal']

export function TissotLoupe({ mode }: { mode: TissotMode }) {
  const [rhoDeg, setRhoDeg] = useState(22)
  const [projKey, setProjKey] = useState<Proj['key']>('plate')
  const sharedRef = useRef<Shared>({ probe: [rad(-42), rad(52)], rho: rad(rhoDeg), proj: PROJS[projKey] })
  sharedRef.current.rho = rad(rhoDeg)
  sharedRef.current.proj = PROJS[projKey]

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { left } = panes(rect.width, el.clientHeight)
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    if (px > left.x + left.w) return
    const proj = mode === 'blob' ? PLATE : sharedRef.current.proj
    const pane = fitWorld(proj, left)
    const [mx, my] = pxToMap(pane, px, py)
    const [lon, lat] = proj.inv(mx, my)
    const cap = mode === 'blob' ? BLOB_LAT_CAP : MATRIX_LAT_CAP
    sharedRef.current.probe = [
      Math.max(-Math.PI * 0.95, Math.min(Math.PI * 0.95, lon)),
      Math.max(-cap, Math.min(cap, lat)),
    ]
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={300} animated={false} create={() => createTissot(mode, sharedRef)}>
        {mode === 'blob' ? (
          <label className="sim-slider">
            <span>continent</span>
            <input
              type="range"
              min={2}
              max={24}
              step={0.5}
              value={rhoDeg}
              onChange={(e) => setRhoDeg(Number(e.target.value))}
            />
            <span>county</span>
          </label>
        ) : (
          <select className="sim-select" value={projKey} onChange={(e) => setProjKey(e.target.value as Proj['key'])}>
            {SELECTABLE.map((k) => (
              <option key={k} value={k}>
                {PROJS[k].label}
              </option>
            ))}
          </select>
        )}
      </Sim>
    </div>
  )
}
