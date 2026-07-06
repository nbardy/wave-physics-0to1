import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// The Puy-de-Dôme experiment, 1648 — Pascal had his brother-in-law Périer carry a
// barometer up the mountain. The mercury column fell as they climbed, proving the
// column is held up by the WEIGHT OF THE AIR above, not by "horror of a vacuum".
//
// Model: an isothermal atmosphere gives an exponential column height
//   h(z) = 760·exp(−z/H₀) mm,  H₀ ≈ 8400 m (the atmospheric scale height).
// The real 1648 measurement showed roughly 85 mm of drop over the ~1465 m climb;
// this idealized isothermal model predicts a comparable fall (see readout).
//
// No dynamics — a kinematic altitude→column map. We exponentially smooth the DRAWN
// altitude toward the slider target for a soft feel:
//   z ← z + (z_target − z)·(1 − e^{−k·dt}). A contraction map (error strictly
// shrinks each step) ⇒ stable by construction, no dt/CFL bound.
//
// Sepia '#78716c' is this lesson's history-furniture color (added for lesson 03;
// not part of the shared PALETTE contract).

const SEPIA = '#78716c'
const MERCURY = '#3a3f47'
const H0 = 8400 // atmospheric scale height (m)
const H_SEA = 760 // sea-level mercury column (mm)
const PUY_ALT = 1465 // Puy-de-Dôme summit (m)
const MAX_ALT = 3000
const SMOOTH_K = 6

const columnMm = (z: number): number => H_SEA * Math.exp(-z / H0)

function createMountain(altRef: { current: number }): Stepper {
  let alt = altRef.current

  return {
    step(dt) {
      const target = altRef.current
      alt += (target - alt) * (1 - Math.exp(-SMOOTH_K * dt)) // contraction ⇒ stable
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const pad = 16
      const midX = w * 0.46 // divider between mountain (left) and barometer (right)
      const groundY = h - pad - 16
      const skyTop = pad

      // fraction of the way up the drawn altitude range
      const f = Math.min(alt / MAX_ALT, 1)

      // ---- LEFT: mountain profile + air column ----
      const mLeft = pad
      const mRight = midX - 10
      const peakX = (mLeft + mRight) * 0.55
      const peakY = skyTop + 6

      // air column above the mountain position: shade fades / shortens with altitude.
      // "weight of the air above" — taller/darker at sea level, thin/pale up high.
      const climberX = mLeft + (mRight - mLeft) * 0.55
      const climberY = groundY - f * (groundY - peakY)
      const airTop = skyTop
      const airAlpha = 0.05 + 0.22 * (1 - f) // less air above ⇒ lighter shading
      ctx.fillStyle = `rgba(8,145,178,${airAlpha})` // PALETTE.pLo family (air over the site)
      ctx.fillRect(climberX - 16, airTop, 32, climberY - airTop)

      // mountain silhouette (solid)
      ctx.fillStyle = 'rgba(107,114,128,0.85)' // PALETTE.wall gray
      ctx.beginPath()
      ctx.moveTo(mLeft, groundY)
      ctx.lineTo(peakX, peakY)
      ctx.lineTo(mRight, groundY)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.stroke()

      // sepia tick + label at the Puy-de-Dôme summit altitude
      const puyY = groundY - (PUY_ALT / MAX_ALT) * (groundY - peakY)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(mLeft, puyY)
      ctx.lineTo(mRight, puyY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, sans-serif'
      ctx.fillText('Puy-de-Dôme', mLeft + 2, puyY - 3)

      // the barometer icon riding up the slope
      ctx.fillStyle = MERCURY
      ctx.fillRect(climberX - 3, climberY - 14, 6, 14)
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(climberX - 3, climberY - 14, 6, 14)

      // ---- RIGHT: large barometer close-up ----
      const bx = midX + (w - midX) * 0.28
      const boreW = 26
      const baseY = groundY
      const topY = skyTop + 10
      const fullPx = baseY - topY // pixel span for a full sea-level column
      const colMm = columnMm(alt)
      const colPx = fullPx * (colMm / H_SEA)

      // glass tube outline
      ctx.strokeStyle = 'rgba(160,170,185,0.9)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx - boreW / 2, topY, boreW, baseY - topY)

      // mercury column (fills up from the base to colPx)
      ctx.fillStyle = MERCURY
      ctx.fillRect(bx - boreW / 2 + 1, baseY - colPx, boreW - 2, colPx)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)' // metallic highlight
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx - boreW / 2 + 5, baseY - colPx + 2)
      ctx.lineTo(bx - boreW / 2 + 5, baseY - 2)
      ctx.stroke()

      // vacuum label above the column
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, sans-serif'
      ctx.fillText('vacuum', bx + boreW / 2 + 6, topY + 14)

      // sepia readout box: altitude + column height
      ctx.font = '12px ui-monospace, monospace'
      const l1 = `altitude: ${Math.round(alt)} m`
      const l2 = `column:   ${colMm.toFixed(0)} mm`
      const tw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width)
      const boxX = w - pad - tw - 12
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

export function PascalMountain() {
  const [alt, setAlt] = useState(0)
  const altRef = useRef(alt)
  altRef.current = alt

  return (
    <Sim height={280} create={() => createMountain(altRef)}>
      <label className="sim-slider">
        <span>sea level</span>
        <input
          type="range"
          min={0}
          max={MAX_ALT}
          step={10}
          value={alt}
          onChange={(e) => setAlt(Number(e.target.value))}
        />
        <span>3000 m</span>
      </label>
    </Sim>
  )
}
