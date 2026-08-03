import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import {
  type Map2,
  identityMap,
  rotateMap,
  shearMap,
  swirlMap,
  det2,
  drawGridImage,
  drawStampImage,
  drawArrow,
  paneFrame,
  clipPane,
  toPx,
  fromPx,
  niceStep,
  fmt,
  FONT_METER,
  FONT_LABEL,
  INK,
  type View,
  type Rect,
} from './lib'

// The article's hero and its two overlay configurations (PLAN figures 1, 4, 9):
//   plant  — mangled grid + loupe; at high zoom a parallelogram lattice appears.
//   arrows — adds the unit-arrow landings and the live matrix (preset selector).
//   return — the swirl runs as a flow map (fixed-dt accumulator), det pinned at 1.
// All maps are closed-form with exact Jacobians and exact inverses (lib.ts);
// nothing is integrated, so the loupe cannot lie about linearity.

export type LoupeMode = 'plant' | 'arrows' | 'return'

interface MapCase {
  label: string
  map: Map2
  inv: (x: number, y: number) => [number, number]
}

const SWIRL_K = 2.2
const PRESETS: Record<string, MapCase> = {
  swirl: { label: 'swirl', map: swirlMap(SWIRL_K), inv: (x, y) => swirlMap(-SWIRL_K).f(x, y) },
  identity: { label: 'do nothing', map: identityMap, inv: (x, y) => [x, y] },
  rotate: { label: 'rotate 30°', map: rotateMap(Math.PI / 6), inv: (x, y) => rotateMap(-Math.PI / 6).f(x, y) },
  shear: { label: 'shear', map: shearMap(0.6), inv: (x, y) => shearMap(-0.6).f(x, y) },
}
export type PresetKey = keyof typeof PRESETS

const HALF0 = 1.3 // world half-width of the full pane
const ZOOM_MAX = 50
const FIXED_DT = 1 / 60 // return mode: flow-map clock, decoupled from RAF
const FLOW_RATE = 0.45 // swirl strength gained per second of flow
const FLOW_PERIOD = 6 // seconds before the flow rewinds (ping-pong)

interface Shared {
  probe: { x: number; y: number }
  zoom: number // 0..1 slider, mapped log to ×1..×ZOOM_MAX
  preset: PresetKey
  flowK: number // return mode only: swirl strength, written by the stepper
}

function currentMap(mode: LoupeMode, shared: Shared): MapCase {
  if (mode === 'return') {
    const k = shared.flowK
    return { label: 'flow', map: swirlMap(k), inv: (x, y) => swirlMap(-k).f(x, y) }
  }
  if (mode === 'arrows') return PRESETS[shared.preset]
  return PRESETS.swirl
}

function panes(w: number, h: number): { left: Rect; right: Rect } {
  const gap = 12
  const side = Math.min((w - gap) / 2, h - 8)
  const y = 4
  return {
    left: { x: w / 2 - gap / 2 - side, y, w: side, h: side },
    right: { x: w / 2 + gap / 2, y, w: side, h: side },
  }
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  m: [number, number, number, number],
) {
  ctx.font = FONT_METER
  ctx.fillStyle = INK
  ctx.fillText('J =', x, y + 22)
  const bx = x + 30
  // brackets
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(bx + 6, y + 2)
  ctx.lineTo(bx, y + 2)
  ctx.lineTo(bx, y + 36)
  ctx.lineTo(bx + 6, y + 36)
  ctx.moveTo(bx + 92, y + 2)
  ctx.lineTo(bx + 98, y + 2)
  ctx.lineTo(bx + 98, y + 36)
  ctx.lineTo(bx + 92, y + 36)
  ctx.stroke()
  // first column = landing of east arrow (blue), second = north (green)
  ctx.fillStyle = PALETTE.ex
  ctx.fillText(fmt(m[0]), bx + 10, y + 15)
  ctx.fillText(fmt(m[2]), bx + 10, y + 33)
  ctx.fillStyle = PALETTE.ey
  ctx.fillText(fmt(m[1]), bx + 54, y + 15)
  ctx.fillText(fmt(m[3]), bx + 54, y + 33)
}

function createLoupe(mode: LoupeMode, sharedRef: { current: Shared }): Stepper {
  let acc = 0
  let clock = 2 // start the return flow mid-swing so the first frame is already swirled

  return {
    step(dt) {
      if (mode !== 'return') return
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        clock += FIXED_DT
        acc -= FIXED_DT
        guard++
      }
      // ping-pong the flow time so the swirl winds and unwinds forever
      const phase = clock % (2 * FLOW_PERIOD)
      const t = phase < FLOW_PERIOD ? phase : 2 * FLOW_PERIOD - phase
      sharedRef.current.flowK = t * FLOW_RATE
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const shared = sharedRef.current
      const mc = currentMap(mode, shared)
      const { left, right } = panes(w, h)
      const zoom = Math.pow(ZOOM_MAX, shared.zoom)
      const p = shared.probe
      const [fx, fy] = mc.map.f(p.x, p.y)
      const J = mc.map.jac(p.x, p.y)

      // ---- left pane: the whole warped plane, probe riding its image ----
      const lv: View = { cx: 0, cy: 0, half: HALF0 }
      ctx.save()
      clipPane(ctx, left)
      drawGridImage(ctx, left, lv, mc.map, 0, 0, HALF0, 'rgba(37,99,235,0.45)', true)
      // the loupe's catchment: a ring around the probe image
      const [ppx, ppy] = toPx(lv, left, fx, fy)
      ctx.beginPath()
      ctx.arc(ppx, ppy, 11, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ppx, ppy, 3, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      ctx.restore()
      paneFrame(ctx, left)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the warped plane — drag the ring', left.x + 8, left.y + 16)

      // ---- right pane: the loupe, centered on the probe's image ----
      const half = HALF0 / zoom
      const rv: View = { cx: fx, cy: fy, half }
      ctx.save()
      clipPane(ctx, right)
      // baseStep ties the loupe to the SAME grid family the left pane draws —
      // a probe on a line at left must sit on that line here (see lib.ts note)
      drawGridImage(
        ctx, right, rv, mc.map, p.x, p.y, half * 1.7,
        'rgba(37,99,235,0.55)', true, niceStep(HALF0),
      )
      // the stamp, re-inked at loupe scale so it never vanishes (confessed in
      // prose). Its corner marker is off here: one orange dot per figure, and
      // it is the probe — two identical dots meaning different things is how
      // the loupe read as mis-centered.
      const side = half * 0.62
      drawStampImage(ctx, right, rv, mc.map, p.x, p.y, side, { dot: false })
      // the probe itself, ringed exactly like the left pane so the two panes
      // visibly share one object; it sits at the loupe's centre by definition
      const [rcx, rcy] = toPx(rv, right, fx, fy)
      ctx.beginPath()
      ctx.arc(rcx, rcy, 11, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.stamp
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(rcx, rcy, 3, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.stamp
      ctx.fill()
      if (mode !== 'plant') {
        // landings of the unit arrows, drawn at one stamp-side long
        const [e1x, e1y] = [J[0], J[2]]
        const [e2x, e2y] = [J[1], J[3]]
        const [ox, oy] = toPx(rv, right, fx, fy)
        const s = (side / (2 * half)) * right.w
        drawArrow(ctx, ox, oy, ox + e1x * s, oy - e1y * s, PALETTE.ex, 2.4)
        drawArrow(ctx, ox, oy, ox + e2x * s, oy - e2y * s, PALETTE.ey, 2.4)
        // faint ghosts of where the arrows would land if the map did nothing
        ctx.save()
        ctx.setLineDash([4, 4])
        ctx.globalAlpha = 0.45
        drawArrow(ctx, ox, oy, ox + s, oy, PALETTE.ex, 1.4)
        drawArrow(ctx, ox, oy, ox, oy - s, PALETTE.ey, 1.4)
        ctx.restore()
      }
      ctx.restore()
      paneFrame(ctx, right)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`the loupe — ×${zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}`, right.x + 8, right.y + 16)

      // ---- meters ----
      if (mode !== 'plant') {
        drawMatrix(ctx, right.x + 8, right.y + right.h - 46, J)
        if (mode === 'return') {
          ctx.font = FONT_METER
          ctx.fillStyle = PALETTE.area
          ctx.fillText(`area ×${fmt(det2(J), 3)}`, left.x + 8, left.y + left.h - 10)
          ctx.fillStyle = 'rgba(85,96,111,0.9)'
          ctx.font = FONT_LABEL
          ctx.fillText(`flow time t = ${fmt(shared.flowK / FLOW_RATE, 1)} s`, left.x + 8, left.y + left.h - 26)
        }
      }
    },
  }
}

export function WarpLoupe({ mode }: { mode: LoupeMode }) {
  const [zoom, setZoom] = useState(mode === 'plant' ? 0 : 0.55)
  const [preset, setPreset] = useState<PresetKey>(mode === 'arrows' ? 'shear' : 'swirl')
  const sharedRef = useRef<Shared>({ probe: { x: 0.45, y: 0.3 }, zoom, preset, flowK: 0.9 })
  sharedRef.current.zoom = zoom
  sharedRef.current.preset = preset

  // Drag anywhere on the left pane: the pointer position is in image space, so
  // route it through the map's exact inverse to keep the probe a domain point.
  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const { left } = panes(rect.width, el.clientHeight)
    if (px < left.x || px > left.x + left.w || py < left.y || py > left.y + left.h) return
    const lv: View = { cx: 0, cy: 0, half: HALF0 }
    const [ix, iy] = fromPx(lv, left, px, py)
    const mc = currentMap(mode, sharedRef.current)
    const [dx, dy] = mc.inv(ix, iy)
    const r = Math.hypot(dx, dy)
    const cap = HALF0 * 0.92
    const k = r > cap ? cap / r : 1
    sharedRef.current.probe = { x: dx * k, y: dy * k }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer} onPointerMove={onPointer}>
      <Sim
        height={300}
        // plant/arrows are interactive but timeless — no Pause button for them
        // (dead chrome reads as a broken figure); Reset restores probe and zoom
        animated={mode === 'return'}
        create={() => {
          sharedRef.current.probe = { x: 0.45, y: 0.3 }
          setZoom(mode === 'plant' ? 0 : 0.55)
          return createLoupe(mode, sharedRef)
        }}
      >
        <label className="sim-slider">
          <span>far</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span>close</span>
        </label>
        {mode === 'arrows' && (
          <select
            className="sim-select"
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetKey)}
          >
            {Object.entries(PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        )}
      </Sim>
    </div>
  )
}
