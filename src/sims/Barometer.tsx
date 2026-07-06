import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Torricelli, 1643 — a closed glass tube inverted in a dish of mercury. The
// mercury falls until the weight of the column balances atmospheric pressure,
// leaving a vacuum (the "Torricellian void") at the sealed top.
//
// THE point of the figure: hydrostatic balance fixes the VERTICAL height of the
// mercury surface above the dish, h = p_atm/(ρg), independent of tube tilt. Tilt
// the tube and the LENGTH of mercury along the bore grows as h/cos(θ), but the
// top surface stays at the same horizontal level. A fixed sepia dashed line at
// the 760 level makes that invariance visible while dragging.
//
// No dynamics needed: this is a kinematic display of a hydrostatic equilibrium.
// We only exponentially smooth the DRAWN tilt toward its target for a soft feel:
//   θ ← θ + (θ_target − θ)·(1 − e^{−k·dt}). That map is a contraction — |error|
// strictly shrinks each step — so it is stable by construction (no CFL/dt bound).
//
// Sepia '#78716c' is this lesson's history-furniture color (added for lesson 03;
// not part of the shared PALETTE contract).

const SEPIA = '#78716c' // lesson-03 history-furniture color
const MERCURY = '#3a3f47' // dark metallic gray (in the PALETTE.wall family)
const H_UNITS = 760 // the invariant vertical height (mm of mercury at sea level)
const SMOOTH_K = 8 // exponential smoothing rate for the drawn tilt (1/s)

function createBarometer(tiltRef: { current: number }): Stepper {
  let tiltDeg = tiltRef.current // drawn tilt, smoothed toward the target

  return {
    step(dt) {
      const target = tiltRef.current
      // contraction map: error shrinks by factor e^{−k·dt} < 1 each call
      tiltDeg += (target - tiltDeg) * (1 - Math.exp(-SMOOTH_K * dt))
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 16
      const dishY = h - pad - 26 // top surface of the mercury dish
      const dishLeft = pad
      const dishRight = w - pad

      // vertical scale: map H_UNITS mm to a comfortable fraction of the canvas
      const pxPerUnit = (dishY - pad - 20) / H_UNITS
      const topLevelY = dishY - H_UNITS * pxPerUnit // the fixed 760 vertical level

      // fixed sepia dashed reference line at the 760 level (the invariant)
      ctx.save()
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(dishLeft, topLevelY)
      ctx.lineTo(dishRight, topLevelY)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = SEPIA
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText('760', dishRight - 30, topLevelY - 4)

      // dish rim (solid) — PALETTE.wall
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.strokeRect(dishLeft, dishY, dishRight - dishLeft, 24)

      // dish of mercury
      ctx.fillStyle = MERCURY
      ctx.fillRect(dishLeft, dishY, dishRight - dishLeft, 24)
      ctx.strokeStyle = 'rgba(255,255,255,0.28)' // metallic highlight on the pool
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(dishLeft + 2, dishY + 1)
      ctx.lineTo(dishRight - 2, dishY + 1)
      ctx.stroke()

      // tube geometry: rises from a foot in the dish at angle θ from vertical.
      const tilt = (tiltDeg * Math.PI) / 180
      const bore = 18 // tube inner width (px)
      const footX = (dishLeft + dishRight) / 2 - w * 0.12
      const footY = dishY + 6 // foot sits just under the pool surface

      // Tube length must reach the full physical height H (to the sealed top),
      // which along the tilted bore is H/cos(θ). The mercury inside fills up to
      // the VERTICAL 760 level, i.e. a bore-length of H_UNITS·pxPerUnit/cos(θ).
      const cos = Math.cos(tilt)
      const sin = Math.sin(tilt)
      // unit vector up the bore (θ measured from vertical, tilting to the right)
      const ux = sin
      const uy = -cos
      // sealed top of the glass a bit above the mercury (leaves the vacuum gap)
      const glassLen = (H_UNITS * pxPerUnit) / cos + 34
      const mercuryLen = (H_UNITS * pxPerUnit) / cos

      const px = (t: number) => footX + ux * t
      const pyv = (t: number) => footY + uy * t

      // perpendicular offset for the tube walls
      const nx = cos
      const ny = sin

      // draw glass tube outline
      ctx.strokeStyle = 'rgba(160,170,185,0.9)'
      ctx.lineWidth = 1.5
      const half = bore / 2
      ctx.beginPath()
      ctx.moveTo(footX + nx * half, footY + ny * half)
      ctx.lineTo(px(glassLen) + nx * half, pyv(glassLen) + ny * half)
      ctx.lineTo(px(glassLen) - nx * half, pyv(glassLen) - ny * half)
      ctx.lineTo(footX - nx * half, footY - ny * half)
      ctx.stroke()

      // mercury column inside the tube (a filled quad up to mercuryLen)
      ctx.fillStyle = MERCURY
      ctx.beginPath()
      ctx.moveTo(footX + nx * half, footY + ny * half)
      ctx.lineTo(px(mercuryLen) + nx * half, pyv(mercuryLen) + ny * half)
      ctx.lineTo(px(mercuryLen) - nx * half, pyv(mercuryLen) - ny * half)
      ctx.lineTo(footX - nx * half, footY - ny * half)
      ctx.closePath()
      ctx.fill()

      // metallic highlight streak along the column
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(footX + nx * half * 0.4, footY + ny * half * 0.4)
      ctx.lineTo(px(mercuryLen) + nx * half * 0.4, pyv(mercuryLen) + ny * half * 0.4)
      ctx.stroke()

      // vacuum gap label (between mercury top and sealed glass top)
      const vacMidT = (mercuryLen + glassLen) / 2
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, sans-serif'
      ctx.fillText('vacuum', px(vacMidT) + 8, pyv(vacMidT))
    },
  }
}

export function Barometer() {
  const [tilt, setTilt] = useState(0)
  const tiltRef = useRef(tilt)
  tiltRef.current = tilt

  return (
    <Sim height={280} create={() => createBarometer(tiltRef)}>
      <label className="sim-slider">
        <span>upright</span>
        <input
          type="range"
          min={0}
          max={55}
          step={1}
          value={tilt}
          onChange={(e) => setTilt(Number(e.target.value))}
        />
        <span>tilted 55°</span>
      </label>
    </Sim>
  )
}
