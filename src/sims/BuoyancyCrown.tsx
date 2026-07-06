import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Archimedes — a block floating in water. Vertical dynamics only:
//   m·dv/dt = −m·g + ρ_w·g·V_submerged − c·v
// with m = ρ_block·V. Semi-implicit (symplectic) Euler at a fixed dt:
//   v ← v + a·dt ; y ← y + v·dt. The buoyant term is bounded and the linear
// damping c·v is dissipative, so energy never grows: stable by construction for
// the dt below. c is tuned so the block bobs once or twice then settles (light
// underdamping), not a raw explicit-Euler blow-up.
//
// Boundary check: at equilibrium −m·g + ρ_w·g·V_sub = 0 ⇒ V_sub/V = ρ_block/ρ_w.
// So the submerged FRACTION equals the density ratio (for ratio < 1). The readout
// prints that fraction; drag the slider and watch it match the ratio.
//
// Sepia '#78716c' is this lesson's history-furniture color (readout box, labels) —
// added for lesson 03; not part of the shared PALETTE contract.

const SEPIA = '#78716c' // lesson-03 history-furniture color (readouts, date labels)

const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const G = 9.81
const DAMP = 3.2 // linear drag c/m coefficient — light underdamping (bobs then settles)

function createTank(ratioRef: { current: number }): Stepper {
  // Geometry in canvas-normalized units; y measured downward in pixels at draw time.
  // We integrate in a unit-height "physics" space and map to pixels in draw().
  // Block half-height in physics units:
  const halfH = 0.12

  // State: yc = center height of block, measured UP from the tank floor (physics units).
  // Water surface sits at WATER_LEVEL above the floor.
  const WATER_LEVEL = 1.0
  const FLOOR = 0.0

  let yc = WATER_LEVEL + 0.25 // start dropped from just above the surface
  let v = 0
  let acc = 0

  // Submerged fraction of the block given its center height (0..1).
  const submergedFraction = (center: number): number => {
    const top = center + halfH
    const bottom = center - halfH
    if (bottom >= WATER_LEVEL) return 0 // fully above water
    if (top <= WATER_LEVEL) return 1 // fully submerged
    // straddling the surface: depth of the underwater slab / full height
    const depthUnder = WATER_LEVEL - bottom
    return depthUnder / (2 * halfH)
  }

  const advance = () => {
    const ratio = ratioRef.current // ρ_block / ρ_water
    // m = ρ_block·V ∝ ratio (V and ρ_water absorbed into unit scaling).
    // buoyancy ∝ ρ_w·V_sub = fraction·V (ρ_w = 1 in unit scaling).
    const frac = submergedFraction(yc)
    // a = −g + (1/ratio)·g·frac − DAMP·v   [dividing weight through by m = ratio·V]
    const a = -G + (G * frac) / ratio - DAMP * v
    v += a * FIXED_DT
    yc += v * FIXED_DT

    // Floor contact: the block cannot pass through the tank bottom.
    // When ratio > 1 it is denser than water and sinks to rest here.
    const restFloor = FLOOR + halfH
    if (yc < restFloor) {
      yc = restFloor
      if (v < 0) v = 0 // kill downward velocity on contact (inelastic floor)
    }
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 12) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 18
      // Map physics-y (up from floor) to pixels (down from top).
      // Physics range shown: 0 (floor) .. ~1.5 (above surface).
      const YRANGE = 1.5
      const floorPx = h - pad
      const py = (yUp: number) => floorPx - (yUp / YRANGE) * (h - 2 * pad)
      const scaleY = (h - 2 * pad) / YRANGE // px per physics unit

      const tankLeft = pad
      const tankRight = w - pad
      const surfacePx = py(WATER_LEVEL)

      // water body
      ctx.fillStyle = 'rgba(8,145,178,0.16)' // PALETTE.pLo cyan family, translucent
      ctx.fillRect(tankLeft, surfacePx, tankRight - tankLeft, floorPx - surfacePx)

      // water surface line + highlight
      ctx.strokeStyle = PALETTE.pLo
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tankLeft, surfacePx)
      ctx.lineTo(tankRight, surfacePx)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(tankLeft, surfacePx - 2)
      ctx.lineTo(tankRight, surfacePx - 2)
      ctx.stroke()

      // tank walls + floor (solid)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(tankLeft, py(YRANGE))
      ctx.lineTo(tankLeft, floorPx)
      ctx.lineTo(tankRight, floorPx)
      ctx.lineTo(tankRight, py(YRANGE))
      ctx.stroke()

      // the block
      const blockW = (tankRight - tankLeft) * 0.22
      const bx = (tankLeft + tankRight) / 2 - blockW / 2
      const blockTopPx = py(yc + halfH)
      const blockHpx = 2 * halfH * scaleY
      ctx.fillStyle = 'rgba(107,114,128,0.9)' // PALETTE.wall solid block
      ctx.fillRect(bx, blockTopPx, blockW, blockHpx)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, blockTopPx, blockW, blockHpx)

      // force arrows while the block is moving (or not yet at rest)
      const frac = submergedFraction(yc)
      const cx = bx + blockW / 2
      const cyPx = py(yc)
      const moving = Math.abs(v) > 0.001
      if (moving) {
        const arrowScale = 42 // px per unit force
        const weight = 1.0 // normalized weight (down)
        const buoy = frac / ratioRef.current // normalized buoyant force (up)
        drawArrow(ctx, cx - 14, cyPx, cx - 14, cyPx + weight * arrowScale, PALETTE.wall, 'weight')
        drawArrow(ctx, cx + 14, cyPx, cx + 14, cyPx - buoy * arrowScale, PALETTE.pLo, 'buoyancy')
      }

      // sepia readout box
      const pct = Math.round(frac * 100)
      ctx.font = '12px ui-monospace, monospace'
      const label = `submerged: ${pct}%`
      const tw = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(120,113,110,0.12)'
      ctx.fillRect(tankRight - tw - 20, pad, tw + 12, 22)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.strokeRect(tankRight - tw - 20, pad, tw + 12, 22)
      ctx.fillStyle = SEPIA
      ctx.fillText(label, tankRight - tw - 14, pad + 15)
    },
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  const dir = Math.sign(y1 - y0) || -1
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - 4, y1 - dir * 6)
  ctx.lineTo(x1 + 4, y1 - dir * 6)
  ctx.closePath()
  ctx.fill()
  ctx.font = '10px ui-sans-serif, sans-serif'
  ctx.fillText(label, x1 + 6, (y0 + y1) / 2)
}

export function BuoyancyCrown() {
  const [ratio, setRatio] = useState(0.6)
  const ratioRef = useRef(ratio)
  ratioRef.current = ratio

  return (
    <Sim height={280} create={() => createTank(ratioRef)}>
      <label className="sim-slider">
        <span>light</span>
        <input
          type="range"
          min={0.15}
          max={1.3}
          step={0.01}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
        />
        <span>dense</span>
      </label>
    </Sim>
  )
}
