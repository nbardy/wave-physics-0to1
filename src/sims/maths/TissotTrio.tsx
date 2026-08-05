import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, FONT_LABEL, FONT_METER, type Rect } from './lib'
import {
  MERCATOR,
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

// PLAN v2 figure 4 — the one-frame contrast (WarpStamp's successor): three
// circles of identical ground size on Mercator, three wildly different printed
// sizes, three violet receipts. Two are pinned (equator, arctic); the bright
// one is draggable. Receipts are measured (planar shoelace / spherical cap).

const RHO = rad(8)
const PINNED: Array<[number, number]> = [
  [rad(-15), rad(0)],
  [rad(-40), rad(70)],
]
const LAT_CAP = rad(72)

interface Shared {
  probe: [number, number]
}

function createTrio(sharedRef: { current: Shared }): Stepper {
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

      const all = [...PINNED, sharedRef.current.probe]
      for (let i = 0; i < all.length; i++) {
        const isLive = i === all.length - 1
        const [lon, lat] = all[i]
        const circle = geodesicCircle(lon, lat, RHO, 72)
        ctx.strokeStyle = isLive ? PALETTE.stamp : 'rgba(217,119,6,0.55)'
        ctx.fillStyle = isLive ? 'rgba(217,119,6,0.22)' : 'rgba(217,119,6,0.10)'
        ctx.lineWidth = isLive ? 2.2 : 1.6
        drawGeoPath(ctx, pane, circle, true)
        ctx.fill()
        ctx.stroke()
        const projected = circle.map(([lo, la]) => MERCATOR.xy(lo, la))
        const receipt = planarArea(projected) / capArea(RHO)
        const [px, py] = mapToPx(pane, ...MERCATOR.xy(lon, lat))
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.area
        const tx = Math.min(px + 14, r.x + r.w - 86)
        ctx.fillText(`area ${fmtTimes(receipt)}`, tx, Math.max(py - 10, r.y + 30))
      }
      ctx.restore()
      paneFrame(ctx, r)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('three circles, each 8° of ground across — drag the bright one', r.x + 8, r.y + 16)
    },
  }
}

export function TissotTrio() {
  const sharedRef = useRef<Shared>({ probe: [rad(30), rad(45)] })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const r: Rect = { x: 4, y: 4, w: rect.width - 8, h: el.clientHeight - 8 }
    const pane = fitWorld(MERCATOR, r)
    const [mx, my] = pxToMap(pane, e.clientX - rect.left, e.clientY - rect.top)
    const [lon, lat] = MERCATOR.inv(mx, my)
    sharedRef.current.probe = [
      Math.max(-Math.PI * 0.95, Math.min(Math.PI * 0.95, lon)),
      Math.max(-LAT_CAP, Math.min(LAT_CAP, lat)),
    ]
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={320} animated={false} create={() => createTrio(sharedRef)} />
    </div>
  )
}
