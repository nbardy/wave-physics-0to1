import { useEffect, useRef, useState } from 'react'
import type { Stepper } from '../components/Sim'

// Hydrostatic equilibrium, NOT a transient simulation. Atmospheric pressure
// supports h = p/(rho g) = 760 mm at the chosen reference atmosphere. Ignore
// capillarity/vapor pressure. Both rigid tubes have the SAME fixed length.
// A free surface is an equipotential: clip against WORLD y=reservoirLevel+760, never against
// a cross-section perpendicular to the tilted tube. No timestep/CFL applies.
export const HEAD = 760
export const TUBE_LENGTH = 1600
const IMMERSION = 100, HALF_BORE = 40
// Illustrative rectangular vessels, all 10 mm deep into the page. Units: mm, mL.
// Count the reservoir (including submerged mouths) and only the tube portions
// ABOVE its surface, so their volumes never overlap. Neglect glass-wall volume.
export const RESERVOIR_WIDTH = 1780
export const RESERVOIR_DEPTH = 220
const DEPTH = 10
const BORE_AREA = 2 * HALF_BORE * DEPTH
const RESERVOIR_AREA = RESERVOIR_WIDTH * DEPTH
export const INITIAL_RESERVOIR_ML = RESERVOIR_AREA * RESERVOIR_DEPTH / 1000
export const INITIAL_COLUMNS_ML = 2 * BORE_AREA * HEAD / 1000
export const TOTAL_ML = INITIAL_RESERVOIR_ML + INITIAL_COLUMNS_ML
export const MERCURY = '#475569'
export const COLUMN_VOLUME_COLOR = '#b66b17'
const SEPIA = '#78716c'
export interface Point { x: number; y: number }
export function barometerGeometry(degrees: number, reservoirLevel = 0) {
  const level = reservoirLevel + HEAD
  const theta = degrees * Math.PI / 180, c = Math.cos(theta), s = Math.sin(theta)
  const at = (t: number, offset: number): Point => ({ x: s * t + c * offset, y: -IMMERSION + c * t - s * offset })
  const tube = [at(0, -HALF_BORE), at(0, HALF_BORE), at(TUBE_LENGTH, HALF_BORE), at(TUBE_LENGTH, -HALF_BORE)]
  // Clip the rigid tube polygon to the half-plane below the horizontal surface.
  const liquid: Point[] = []
  for (let i = 0; i < tube.length; i++) {
    const a = tube[i], b = tube[(i + 1) % tube.length]
    if (a.y <= level) liquid.push(a)
    if ((a.y <= level) !== (b.y <= level)) {
      const t = (level - a.y) / (b.y - a.y)
      liquid.push({ x: a.x + t * (b.x - a.x), y: level })
    }
  }
  const surface = liquid.filter(p => p.y === level)
  return { tube, liquid, surface, alongTube: HEAD / c, degrees, at }
}
export function barometerState(degrees: number) {
  const angle = Math.max(0, Math.min(55, degrees))
  const columnsML = BORE_AREA * HEAD * (1 + 1 / Math.cos(angle * Math.PI / 180)) / 1000
  const transferredML = columnsML - INITIAL_COLUMNS_ML
  // Exact volume balance: A_res * drop = A_bore * h * (sec(theta) - 1).
  // The upright column's ABOVE-bath volume stays fixed as both surfaces descend.
  const reservoirLevel = -transferredML * 1000 / RESERVOIR_AREA
  const reservoirML = RESERVOIR_AREA * (RESERVOIR_DEPTH + reservoirLevel) / 1000
  return {
    degrees: angle, reservoirLevel, columnsML, reservoirML, transferredML,
    geometries: [barometerGeometry(0, reservoirLevel), barometerGeometry(angle, reservoirLevel)],
  }
}
export function barometerLayout(w: number, h: number) {
  const poolY = h - 170
  const scale = Math.min((w - 60) / 2260, (poolY - 50) / (TUBE_LENGTH - IMMERSION))
  const left = (w - 2260 * scale) / 2
  const feet = [left + 450 * scale, left + 880 * scale]
  return { scale, poolY, feet, tankLeft: feet[0] - 360 * scale, tankWidth: RESERVOIR_WIDTH * scale }
}
export const barometerHeight = (w: number) => w < 480 ? 420 : 480
export function createBarometer(degrees = 35): Stepper {
  const state = barometerState(degrees)
  const { geometries, reservoirLevel } = state
  const ml = (volume: number) => Math.round(volume).toLocaleString('en-US')
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, w, h)
      const { scale, poolY, feet, tankLeft, tankWidth } = barometerLayout(w, h)
      const surfaceY = poolY - reservoirLevel * scale
      const levelY = surfaceY - HEAD * scale
      const bottomY = poolY + RESERVOIR_DEPTH * scale
      const rulerX = tankLeft - 18
      const font = (size: number, bold = false) => { ctx.font = `${bold ? 600 : 400} ${size}px system-ui, sans-serif` }
      font(12); ctx.fillStyle = SEPIA; ctx.fillText('Air pressure: 1 atm', 14, 20)
      ctx.fillText('Glass length: 1,600 mm each', 14, 37)
      // The same reference height and reservoir datum serve BOTH specimens.
      ctx.strokeStyle = '#b3bac5'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
      for (const y of [levelY, surfaceY]) {
        ctx.beginPath(); ctx.moveTo(rulerX + 5, y); ctx.lineTo(w - 14, y); ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.strokeStyle = SEPIA; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(rulerX, levelY); ctx.lineTo(rulerX, surfaceY)
      ctx.moveTo(rulerX - 5, levelY); ctx.lineTo(rulerX + 5, levelY); ctx.moveTo(rulerX - 5, surfaceY); ctx.lineTo(rulerX + 5, surfaceY); ctx.stroke()
      ctx.save(); ctx.translate(rulerX - 10, (levelY + surfaceY) / 2); ctx.rotate(-Math.PI / 2)
      font(12, true); ctx.textAlign = 'center'; ctx.fillStyle = '#303743'; ctx.fillText('760 mm vertical', 0, 0); ctx.restore()
      // Paint the empty tank BEFORE the tubes, preserving the newly exposed
      // glass and mercury between the old and current reservoir levels.
      ctx.fillStyle = '#e9eef5'; ctx.fillRect(tankLeft, poolY, tankWidth, bottomY - poolY)
      for (let i = 0; i < 2; i++) {
        const g = geometries[i], footX = feet[i]
        const X = (x: number) => footX + scale * x, Y = (y: number) => poolY - scale * y
        const polygon = (points: Point[]) => {
          ctx.beginPath(); points.forEach((p, k) => k ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))); ctx.closePath()
        }
        polygon(g.tube); ctx.fillStyle = '#e9eef5'; ctx.fill()
        polygon(g.liquid); ctx.fillStyle = MERCURY; ctx.fill()
        // Tube sides and sealed cap. The submerged mouth stays open.
        ctx.strokeStyle = '#97a4b5'; ctx.lineWidth = 1.6
        ctx.beginPath()
        for (const k of [0, 3, 2, 1]) { const p = g.tube[k]; if (k === 0) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y)) }
        ctx.stroke()
        ctx.strokeStyle = '#243144'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(X(g.surface[0].x), levelY); ctx.lineTo(X(g.surface[1].x), levelY); ctx.stroke()
        // Direct bore-length measurement above the reservoir, beside the tube.
        const theta = g.degrees * Math.PI / 180, c = Math.cos(theta), s = Math.sin(theta)
        const offset = HALF_BORE + 42
        const t0 = (reservoirLevel + IMMERSION + s * offset) / c, t1 = (reservoirLevel + HEAD + IMMERSION + s * offset) / c
        const a = g.at(t0, offset), b = g.at(t1, offset)
        ctx.strokeStyle = SEPIA; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y))
        for (const p of [a, b]) { ctx.moveTo(X(p.x) - 3 * c, Y(p.y) + 3 * s); ctx.lineTo(X(p.x) + 3 * c, Y(p.y) - 3 * s) }
        ctx.stroke()
      }
      // Same scale as the glass: the bath's loss is a real volume change.
      // The outline and the initial-level ghost stay fixed as its surface drops.
      ctx.fillStyle = MERCURY; ctx.fillRect(tankLeft, surfaceY, tankWidth, bottomY - surfaceY)
      ctx.strokeStyle = '#98a5b6'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(tankLeft, poolY - 6); ctx.lineTo(tankLeft, bottomY); ctx.lineTo(tankLeft + tankWidth, bottomY); ctx.lineTo(tankLeft + tankWidth, poolY - 6); ctx.stroke()
      ctx.strokeStyle = '#243144'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(tankLeft, surfaceY); ctx.lineTo(tankLeft + tankWidth, surfaceY); ctx.stroke()
      ctx.strokeStyle = '#98a5b6'; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(tankLeft, poolY); ctx.lineTo(tankLeft + tankWidth, poolY); ctx.stroke(); ctx.setLineDash([])
      font(11); ctx.fillStyle = SEPIA
      ctx.fillText(`Reservoir · ${Math.round(-reservoirLevel)} mm below starting level`, tankLeft, bottomY + 16)
      font(12, true); ctx.fillStyle = '#303743'
      ctx.fillText('Upright', 24, h - 94)
      ctx.fillText(`Tilted ${state.degrees}°`, w * 0.58, h - 94)
      font(12); ctx.fillStyle = SEPIA
      ctx.fillText('760 mm of mercury', 24, h - 76)
      ctx.fillText(`${Math.round(geometries[1].alongTube)} mm of mercury`, w * 0.58, h - 76)

      // One fixed-length inventory bar: amber gains exactly what gray loses.
      const barX = 24, barW = w - 48, barY = h - 50
      const split = barX + barW * state.reservoirML / TOTAL_ML
      const initialSplit = barX + barW * INITIAL_RESERVOIR_ML / TOTAL_ML
      font(11, true); ctx.fillStyle = '#303743'
      ctx.fillText(`Total mercury: ${ml(TOTAL_ML)} mL`, barX, barY - 9)
      ctx.fillStyle = MERCURY; ctx.fillRect(barX, barY, split - barX, 10)
      ctx.fillStyle = COLUMN_VOLUME_COLOR; ctx.fillRect(split, barY, barX + barW - split, 10)
      ctx.strokeStyle = '#ffffff'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(initialSplit, barY - 2); ctx.lineTo(initialSplit, barY + 12); ctx.stroke(); ctx.setLineDash([])
      font(11); ctx.fillStyle = MERCURY
      ctx.fillText(`Reservoir ${ml(state.reservoirML)} mL`, barX, barY + 26)
      ctx.fillText(`${ml(state.transferredML)} mL less`, barX, barY + 41)
      ctx.fillStyle = COLUMN_VOLUME_COLOR; ctx.textAlign = 'right'
      ctx.fillText(`Above bath ${ml(state.columnsML)} mL`, barX + barW, barY + 26)
      ctx.fillText(`${ml(state.transferredML)} mL more`, barX + barW, barY + 41)
      ctx.textAlign = 'left'
    },
  }
}
export function Barometer() {
  const [tilt, setTilt] = useState(35)
  const state = barometerState(tilt)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const drawing = createBarometer(tilt)
    const paint = () => {
      const w = canvas.clientWidth, h = barometerHeight(w), dpr = window.devicePixelRatio || 1
      canvas.style.height = `${h}px`
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawing.draw(ctx, w, h)
    }
    const observer = new ResizeObserver(paint); observer.observe(canvas); window.addEventListener('resize', paint); paint()
    return () => { observer.disconnect(); window.removeEventListener('resize', paint) }
  }, [tilt])
  return <figure className="sim">
    <canvas ref={canvasRef} className="sim-canvas" style={{ width: '100%', height: 420 }} role="img"
      aria-label={`Two rigid mercury barometers, each 1600 mm long, open into a shared reservoir at one atmosphere. Both columns stand 760 mm above the moving reservoir surface. Upright mercury column length 760 mm; tilted ${tilt} degrees, column length ${Math.round(state.geometries[1].alongTube)} mm. The reservoir falls ${(-state.reservoirLevel).toFixed(1)} mm. Reservoir volume ${Math.round(state.reservoirML)} mL; mercury above the bath ${Math.round(state.columnsML)} mL. ${Math.round(state.transferredML)} mL has moved from the reservoir to the columns above its surface. Total mercury stays ${TOTAL_ML} mL; the mercury does not expand.`} />
    <div className="sim-controls">
      <label className="sim-slider">
        <span>Tube tilt</span>
        <input aria-label="Barometer tilt" type="range" min={0} max={55} step={1} value={tilt} onChange={e => setTilt(Number(e.target.value))} />
        <span>{tilt}°</span>
      </label>
    </div>
  </figure>
}
