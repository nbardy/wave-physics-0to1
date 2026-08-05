import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, FONT_LABEL, FONT_METER, type Rect } from './lib'
import {
  MERCATOR,
  GREENLAND,
  rad,
  fitWorld,
  mapToPx,
  pxToMap,
  mercatorInv,
  sphereRotation,
  inflation,
  fmtTimes,
  drawCoastlines,
  drawGraticule,
  drawGeoPath,
  geodesicCircle,
  type MapPane,
} from './carto'

// PLAN v2 figures 1 and 11 — the hero. A Mercator wall map; Greenland is
// draggable, moved by a TRUE rigid rotation of the sphere (carto.sphereRotation,
// the thetruesize.com move) and reprojected live, so the deflation toward the
// equator is the projection's own doing. The receipt is measured two ways —
// planar shoelace over spherical shoelace of the same drawn vertices — never
// printed from sec²φ.
//   plant  — map + draggable Greenland + receipt.
//   return — adds the Tissot ellipse field and the receipt's formula.

export type MapLiesMode = 'plant' | 'return'

const GRL = GREENLAND.map(([lo, la]) => [rad(lo), rad(la)] as [number, number])
// centroid of the outline, good enough as a drag handle
const HOME: [number, number] = (() => {
  let sx = 0
  let sy = 0
  for (const [lo, la] of GRL) {
    sx += lo
    sy += la
  }
  return [sx / GRL.length, sy / GRL.length]
})()
const LAT_CAP = rad(70) // keep the dragged copy inside Mercator's printable strip

interface Shared {
  target: [number, number]
}

function createMapLies(mode: MapLiesMode, sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const r: Rect = { x: 4, y: 4, w: w - 8, h: h - 8 }
      const pane: MapPane = fitWorld(MERCATOR, r)
      ctx.save()
      clipPane(ctx, r)
      drawGraticule(ctx, pane)
      drawCoastlines(ctx, pane)

      // Tissot field (return mode): same-size ground circles, projected honestly
      if (mode === 'return') {
        ctx.strokeStyle = PALETTE.area
        ctx.lineWidth = 1.2
        for (let latD = -60; latD <= 60; latD += 30) {
          for (let lonD = -150; lonD <= 150; lonD += 30) {
            const circle = geodesicCircle(rad(lonD), rad(latD), rad(6), 40)
            drawGeoPath(ctx, pane, circle, true)
            ctx.stroke()
          }
        }
      }

      // home Greenland, ghosted
      ctx.strokeStyle = 'rgba(217,119,6,0.5)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.4
      drawGeoPath(ctx, pane, GRL, true)
      ctx.stroke()
      ctx.setLineDash([])

      // the dragged copy: rigid rotation home → target, reprojected
      const rot = sphereRotation(HOME, sharedRef.current.target)
      const moved = GRL.map(([lo, la]) => rot(lo, la))
      ctx.fillStyle = 'rgba(217,119,6,0.25)'
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2
      drawGeoPath(ctx, pane, moved, true)
      ctx.fill()
      ctx.stroke()

      // receipts, both measured from the vertices just drawn; the home ghost's
      // receipt only prints once the copy has left home (overlap reads as noise)
      const infMoved = inflation(pane, moved)
      const infHome = inflation(pane, GRL)
      const away =
        Math.hypot(sharedRef.current.target[0] - HOME[0], sharedRef.current.target[1] - HOME[1]) > rad(4)
      const [tx, ty] = mapToPx(pane, ...MERCATOR.xy(...sharedRef.current.target))
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.area
      ctx.fillText(`area ${fmtTimes(infMoved)}`, tx + 14, ty - 10)
      if (away) {
        const [hx, hy] = mapToPx(pane, ...MERCATOR.xy(...HOME))
        ctx.fillText(`area ${fmtTimes(infHome)}`, hx - 30, hy + 44)
      }
      ctx.restore()
      paneFrame(ctx, r)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('drag Greenland anywhere', r.x + 8, r.y + 16)
      if (mode === 'return') {
        ctx.fillStyle = PALETTE.area
        ctx.font = FONT_METER
        ctx.fillText(`every circle: the same 6° of ground · area ×sec²(lat)`, r.x + 8, r.y + r.h - 10)
      }
      // the honest confession about the poles
      if (mode === 'plant') {
        ctx.fillStyle = 'rgba(85,96,111,0.75)'
        ctx.fillText(`the map ends at 82° — Mercator cannot print the poles`, r.x + 8, r.y + r.h - 10)
      }

      // Greenland's true-size latitude readout beside the drag
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      const latDeg = Math.round(sharedRef.current.target[1] / rad(1))
      const latLabel = latDeg === 0 ? 'the equator' : `${Math.abs(latDeg)}° ${latDeg > 0 ? 'N' : 'S'}`
      ctx.fillText(`center ${latLabel}`, tx + 14, ty + 6)
    },
  }
}

export function MapLies({ mode }: { mode: MapLiesMode }) {
  const sharedRef = useRef<Shared>({ target: [HOME[0], HOME[1]] })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const r: Rect = { x: 4, y: 4, w: rect.width - 8, h: el.clientHeight - 8 }
    const pane = fitWorld(MERCATOR, r)
    const [mx, my] = pxToMap(pane, e.clientX - rect.left, e.clientY - rect.top)
    const [lon, lat] = mercatorInv(mx, my)
    const cl = Math.max(-LAT_CAP, Math.min(LAT_CAP, lat))
    const clLon = Math.max(-Math.PI * 0.97, Math.min(Math.PI * 0.97, lon))
    sharedRef.current.target = [clLon, cl]
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={340} animated={false} create={() => createMapLies(mode, sharedRef)} />
    </div>
  )
}
