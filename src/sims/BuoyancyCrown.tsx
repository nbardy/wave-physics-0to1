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
// prints BOTH numbers, stacked, so the match is something the reader can read off
// rather than take on faith.
//
// The force arrows are drawn ALWAYS, not only while the block is moving. At rest
// they are equal and opposite, and that balance IS the claim the figure exists to
// make — hiding the arrows the instant it becomes true (the previous behaviour)
// deleted the evidence at exactly the moment it mattered. Both share one origin at
// the block's centre so equal magnitude reads as equal length. When the block is
// denser than water and lands on the floor the pair no longer balances, so the
// floor's normal force is drawn too: N = mg − ρ_w·g·V_sub, zero (and invisible)
// whenever the block floats.
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
  let onFloor = false // in contact with the tank bottom ⇒ a normal force acts

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
    onFloor = yc <= restFloor + 1e-9
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

      // FORCE ARROWS — always drawn. Weight and buoyancy share one origin at the
      // block's centre and point opposite ways, so at rest they are two segments
      // of equal length about a common point: the balance is the picture.
      const ratio = ratioRef.current
      const frac = submergedFraction(yc)
      const cx = bx + blockW / 2
      const cyPx = py(yc)
      const arrowScale = 30 // px per unit force (weight = 1 by normalization)
      const weight = 1.0
      const buoy = frac / ratio // normalized buoyant force (up)
      const normal = onFloor ? Math.max(0, weight - buoy) : 0 // floor reaction

      // faint sepia guides at the two tips: when they sit symmetrically about the
      // block centre, the two forces are equal
      ctx.strokeStyle = 'rgba(120,113,110,0.45)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      for (const tip of [cyPx + weight * arrowScale, cyPx - buoy * arrowScale]) {
        ctx.beginPath()
        ctx.moveTo(cx - 26, tip)
        ctx.lineTo(cx + 26, tip)
        ctx.stroke()
      }
      ctx.setLineDash([])

      drawArrow(ctx, cx, cyPx, cyPx + weight * arrowScale, PALETTE.wall, -1, `weight ${weight.toFixed(2)}`)
      drawArrow(ctx, cx, cyPx, cyPx - buoy * arrowScale, PALETTE.pLo, 1, `buoyancy ${buoy.toFixed(2)}`)
      // the floor's push, drawn from the contact point; zero-length when floating
      drawArrow(
        ctx,
        cx + 30,
        py(yc - halfH),
        py(yc - halfH) - normal * arrowScale,
        PALETTE.wall,
        1,
        `floor ${normal.toFixed(2)}`,
      )

      // sepia readout box — density above submerged fraction, so the two numbers
      // stack and the reader can see them match
      ctx.font = '12px ui-monospace, monospace'
      const l1 = `density:   ${ratio.toFixed(2)} × water`
      const l2 = `submerged: ${Math.round(frac * 100)}%`
      const tw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width)
      const boxX = tankRight - tw - 20
      ctx.fillStyle = 'rgba(120,113,110,0.12)'
      ctx.fillRect(boxX, pad, tw + 12, 38)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, pad, tw + 12, 38)
      ctx.fillStyle = SEPIA
      ctx.fillText(l1, boxX + 6, pad + 15)
      ctx.fillText(l2, boxX + 6, pad + 31)
    },
  }
}

// A vertical force arrow with its magnitude on the label. `side` is +1 to hang the
// label off the right, −1 off the left, so an opposed pair never overprints.
// A force of (almost) zero draws nothing — otherwise a bare arrowhead would sit on
// the canvas claiming a force that isn't there.
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  y1: number,
  color: string,
  side: 1 | -1,
  label: string,
) {
  if (Math.abs(y1 - y0) < 1.5) return
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y0)
  ctx.lineTo(x, y1)
  ctx.stroke()
  const dir = Math.sign(y1 - y0)
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x - 4, y1 - dir * 6)
  ctx.lineTo(x + 4, y1 - dir * 6)
  ctx.closePath()
  ctx.fill()
  ctx.font = '10px ui-sans-serif, sans-serif'
  ctx.textAlign = side === 1 ? 'left' : 'right'
  ctx.fillText(label, x + side * 8, (y0 + y1) / 2)
  ctx.textAlign = 'left'
}

export function BuoyancyCrown() {
  // opens at the case the prose names: half the water's density, half submerged
  const [ratio, setRatio] = useState(0.5)
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
