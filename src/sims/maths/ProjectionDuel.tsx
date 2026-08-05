import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, fmt, FONT_LABEL, FONT_METER, type Rect } from './lib'
import {
  MERCATOR,
  SINUSOIDAL,
  type Proj,
  rad,
  fitWorld,
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

// PLAN v2 figure 6 — choose your lie. The SAME ground circle on two maps at
// once: Mercator keeps it circular and inflates it; the equal-area map keeps
// its area at ×1.00 and shears it. Both meters are measured from the drawn
// polygon: the receipt is shoelace/cap, the roundness is the max/min radius
// of the normalized blob. One drag drives both panes.

const RHO = rad(6)
const LAT_CAP = rad(68)

interface Shared {
  probe: [number, number]
}

function panes(w: number, h: number): { left: Rect; right: Rect } {
  const gap = 12
  const pw = (w - gap - 8) / 2
  return {
    left: { x: 4, y: 4, w: pw, h: h - 8 },
    right: { x: 4 + pw + gap, y: 4, w: pw, h: h - 8 },
  }
}

function roundness(proj: Proj, circle: Array<[number, number]>, center: [number, number]): number {
  const [cx, cy] = proj.xy(center[0], center[1])
  let rMin = Infinity
  let rMax = 0
  for (const [lon, lat] of circle) {
    const [x, y] = proj.xy(lon, lat)
    let dx = x - cx
    if (dx > Math.PI) dx -= 2 * Math.PI
    if (dx < -Math.PI) dx += 2 * Math.PI
    const rr = Math.hypot(dx, y - cy)
    rMin = Math.min(rMin, rr)
    rMax = Math.max(rMax, rr)
  }
  return rMax / rMin
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  proj: Proj,
  probe: [number, number],
  verdict: string,
) {
  const pane: MapPane = fitWorld(proj, rect)
  const circle = geodesicCircle(probe[0], probe[1], RHO, 72)
  ctx.save()
  clipPane(ctx, rect)
  drawGraticule(ctx, pane)
  drawCoastlines(ctx, pane)
  ctx.strokeStyle = PALETTE.stamp
  ctx.fillStyle = 'rgba(217,119,6,0.2)'
  ctx.lineWidth = 2
  drawGeoPath(ctx, pane, circle, true)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  paneFrame(ctx, rect)

  const projected = circle.map(([lo, la]) => proj.xy(lo, la))
  const receipt = planarArea(projected) / capArea(RHO)
  const shape = roundness(proj, circle, probe)
  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText(proj.label, rect.x + 8, rect.y + 16)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.area
  ctx.fillText(`area ${fmtTimes(receipt)}`, rect.x + 8, rect.y + rect.h - 28)
  ctx.fillStyle = 'rgba(26,31,43,0.85)'
  ctx.fillText(`roundness ${fmt(shape)} — ${verdict}`, rect.x + 8, rect.y + rect.h - 10)
}

function createDuel(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { left, right } = panes(w, h)
      const probe = sharedRef.current.probe
      drawSide(ctx, left, MERCATOR, probe, 'shape true, size lies')
      drawSide(ctx, right, SINUSOIDAL, probe, 'size true, shape lies')
    },
  }
}

export function ProjectionDuel() {
  const sharedRef = useRef<Shared>({ probe: [rad(-100), rad(55)] })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { left, right } = panes(rect.width, el.clientHeight)
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    // whichever pane the pointer is in, route through that pane's inverse
    const side = px < right.x ? { r: left, proj: MERCATOR } : { r: right, proj: SINUSOIDAL }
    const pane = fitWorld(side.proj, side.r)
    const [mx, my] = pxToMap(pane, px, py)
    const [lon, lat] = side.proj.inv(mx, my)
    sharedRef.current.probe = [
      Math.max(-Math.PI * 0.9, Math.min(Math.PI * 0.9, lon)),
      Math.max(-LAT_CAP, Math.min(LAT_CAP, lat)),
    ]
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim height={300} animated={false} create={() => createDuel(sharedRef)} />
    </div>
  )
}
