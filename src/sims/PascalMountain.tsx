import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// The Puy-de-Dôme experiment, 1648 — Pascal had his brother-in-law Périer carry a
// barometer up the mountain. The mercury column fell as they climbed, proving the
// column is held up by the WEIGHT OF THE AIR above, not by "horror of a vacuum".
//
// Model: an exponential atmosphere,  h(z) = 760·exp(−z/H₀) mm.
//
// H₀ IS NOT THE TEXTBOOK SCALE HEIGHT. A pure isothermal atmosphere gives
// H₀ ≈ 8400 m, which predicts a 122 mm fall over the ~1465 m climb — but Périer
// measured about 85 mm ("three inches and a line and a half"), and that is the
// number the prose quotes. H₀ = 12350 is chosen so the readout REPRODUCES THE 1648
// MEASUREMENT: 760·exp(−1465/12350) = 675 mm, an 85 mm drop. The curve is still
// exponential; the constant is historical, not thermodynamic. Historical fidelity
// wins here because the reader can read the number off the figure and check it
// against the sentence beside it.
//
// The two bars on the right are drawn ON THE SAME PIXEL SCALE, both with height
// ∝ p(z): the left bar is the WEIGHT of the air overhead, the right is the mercury
// that weight holds up. They descend together, and the identity "pressure = the
// weight of the fluid above you" is a visible alignment rather than an assertion.
// (An earlier version drew the air as the geometric gap between the climber and
// the top of the frame, which shrank to nothing at 3000 m while the mercury still
// read 70% — the picture refuted the sentence it illustrated.)
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
const H0 = 12350 // effective scale height, tuned to the 1648 Puy-de-Dôme result
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
      const midX = w * 0.44 // divider between mountain (left) and the two bars (right)
      const groundY = h - pad - 16
      const skyTop = pad

      // fraction of the way up the drawn altitude range
      const f = Math.min(alt / MAX_ALT, 1)

      // ---- LEFT: mountain profile with the barometer riding up it ----
      const mLeft = pad
      const mRight = midX - 10
      const peakX = (mLeft + mRight) * 0.55
      const peakY = skyTop + 6

      const climberX = mLeft + (mRight - mLeft) * 0.55
      const climberY = groundY - f * (groundY - peakY)

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

      // ---- RIGHT: the weight of the air, and the mercury it holds up ----
      // Both bars share ONE pixel scale and one baseline. Height ∝ p(z), so their
      // tops track each other exactly as the climber rises.
      const baseY = groundY
      const barTop = pad + 56 // leaves the top strip clear for the readout box
      const span = baseY - barTop
      const seaPx = span * 0.94 // sea-level column; the 6% headroom is the vacuum
      const colMm = columnMm(alt)
      const colPx = seaPx * (colMm / H_SEA)
      const yTop = baseY - colPx
      const ySea = baseY - seaPx

      const rightW = w - midX
      const axc = midX + rightW * 0.26 // air-column bar center
      const bx = midX + rightW * 0.62 // mercury tube center
      const airW = Math.min(48, rightW * 0.26)
      const boreW = 26

      // the air overhead, weighed: darker near the ground where the air is dense
      const airGrad = ctx.createLinearGradient(0, yTop, 0, baseY)
      airGrad.addColorStop(0, 'rgba(8,145,178,0.05)') // PALETTE.pLo family
      airGrad.addColorStop(1, 'rgba(8,145,178,0.38)')
      ctx.fillStyle = airGrad
      ctx.fillRect(axc - airW / 2, yTop, airW, colPx)
      ctx.strokeStyle = 'rgba(8,145,178,0.6)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(axc - airW / 2, yTop, airW, colPx)

      // glass tube outline (full height — the mercury falls away from the top)
      ctx.strokeStyle = 'rgba(160,170,185,0.9)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx - boreW / 2, barTop, boreW, baseY - barTop)

      // mercury column (fills up from the base to colPx)
      ctx.fillStyle = MERCURY
      ctx.fillRect(bx - boreW / 2 + 1, yTop, boreW - 2, colPx)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)' // metallic highlight
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx - boreW / 2 + 5, yTop + 2)
      ctx.lineTo(bx - boreW / 2 + 5, baseY - 2)
      ctx.stroke()

      // the sea-level mark: a fixed sepia line the tops fall away from, so the
      // drop is a measurable gap rather than a remembered number
      const tieL = axc - airW / 2 - 8
      const tieR = bx + boreW / 2 + 8
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(tieL, ySea)
      ctx.lineTo(tieR, ySea)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, sans-serif'
      ctx.fillText('760 mm', tieL, ySea - 4)

      // the tie line: both tops, one height
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(tieL, yTop)
      ctx.lineTo(tieR, yTop)
      ctx.stroke()

      // bar nameplates
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('weight of air', axc, baseY + 13)
      ctx.fillText('mercury', bx, baseY + 13)
      ctx.textAlign = 'left'
      ctx.fillText('vacuum', bx + boreW / 2 + 6, barTop + 12)

      // sepia readout box: altitude, column height, and the drop from sea level
      ctx.font = '12px ui-monospace, monospace'
      const l1 = `altitude: ${Math.round(alt)} m`
      const l2 = `column:   ${colMm.toFixed(0)} mm`
      const l3 = `drop:     ${(H_SEA - colMm).toFixed(0)} mm`
      const tw = Math.max(
        ctx.measureText(l1).width,
        ctx.measureText(l2).width,
        ctx.measureText(l3).width,
      )
      const boxX = w - pad - tw - 12
      ctx.fillStyle = 'rgba(120,113,110,0.12)'
      ctx.fillRect(boxX, pad, tw + 12, 54)
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, pad, tw + 12, 54)
      ctx.fillStyle = SEPIA
      ctx.fillText(l1, boxX + 6, pad + 15)
      ctx.fillText(l2, boxX + 6, pad + 31)
      ctx.fillText(l3, boxX + 6, pad + 47)
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
          step={5} // 5 m steps so the reader can land exactly on the 1465 m summit
          value={alt}
          onChange={(e) => setAlt(Number(e.target.value))}
        />
        <span>3000 m</span>
      </label>
    </Sim>
  )
}
