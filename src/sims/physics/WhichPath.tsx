import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'
import { BENCH, SCREEN_HALF, fringeSpacing, intensityBoth, visibilityFrom } from './optics'

// PLAN figure 5 — the exchange rate.
//
// One knob: how much the apparatus knows about which slit the photon took. The
// pattern is not switched between two modes; it is a single curve whose contrast
// falls as the knowledge rises, and the two are locked by Englert's relation
//   V² + D² = 1     (saturated, because the state here is pure)
// The quarter circle is that relation drawn: the marker slides around it and
// cannot leave it. The visibility meter is MEASURED off the plotted curve —
// (Imax − Imin)/(Imax + Imin) sampled over the central fringe pair — so the
// circle and the pattern are two independent witnesses, not one restated twice.

const SAMPLES = 500

/**
 * Measure fringe contrast from the drawn curve over the central fringes.
 *
 * The window is ±0.55 of a fringe: just wide enough to hold the central maximum
 * and the two minima flanking it, and no wider. Over ±1.5 fringes the
 * diffraction envelope has drooped 26%, and the meter reports that droop as
 * extra contrast — 0.78 where the relation on the left says 0.71, which would
 * put the figure's two witnesses visibly at odds.
 */
function measuredVisibility(D: number): number {
  const span = 0.55 * fringeSpacing(BENCH)
  let hi = -Infinity
  let lo = Infinity
  const V = visibilityFrom(D)
  for (let i = 0; i <= 400; i++) {
    const x = -span + (i / 400) * 2 * span
    const I = intensityBoth(BENCH, x, V)
    hi = Math.max(hi, I)
    lo = Math.min(lo, I)
  }
  return hi + lo > 0 ? (hi - lo) / (hi + lo) : 0
}

export function createWhichPath(dRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const D = dRef.current
      const V = visibilityFrom(D)

      const gap = 14
      const dialW = Math.min(150, w * 0.3)
      const dial = { x: 2, y: 20, w: dialW, h: h - 44 }
      const scr = { x: dialW + gap, y: 20, w: w - dialW - gap - 2, h: h - 44 }

      // --- left: the relation, drawn ---------------------------------------
      const ox = dial.x + 22
      const oy = dial.y + dial.h - 26
      const R = Math.min(dial.w - 44, dial.h - 48)
      ctx.strokeStyle = 'rgba(120,140,170,0.5)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(ox, oy, R, -Math.PI / 2, 0)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(ox, oy)
      ctx.lineTo(ox + R + 6, oy)
      ctx.moveTo(ox, oy)
      ctx.lineTo(ox, oy - R - 6)
      ctx.stroke()

      const mx = ox + D * R
      const my = oy - V * R
      // the leaders are chrome, not a quantity — amber is reserved for the
      // marker itself, so a colour probe finds one blob and not a tangle
      ctx.strokeStyle = 'rgba(120,140,170,0.6)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(mx, my)
      ctx.lineTo(mx, oy)
      ctx.moveTo(mx, my)
      ctx.lineTo(ox, my)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.hit
      ctx.fill()

      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.pdf
      ctx.fillText('V', ox - 14, oy - R - 2)
      ctx.fillStyle = PALETTE.cutoff
      ctx.fillText('D', ox + R + 2, oy + 14)
      paneFrame(ctx, dial)
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('V² + D² = 1', dial.x + 4, 14)

      // --- right: what lands on the screen ---------------------------------
      const base = scr.y + scr.h - 18
      const toPxX = (s: number) => scr.x + ((s + SCREEN_HALF) / (2 * SCREEN_HALF)) * scr.w
      const toPxY = (I: number) => base - (I / 4) * (scr.h - 30)

      // the no-fringes floor, for comparison at every setting
      ctx.strokeStyle = 'rgba(107,114,128,0.7)'
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i <= SAMPLES; i++) {
        const s = -SCREEN_HALF + (i / SAMPLES) * 2 * SCREEN_HALF
        const p = toPxY(intensityBoth(BENCH, s, 0))
        if (i === 0) ctx.moveTo(toPxX(s), p)
        else ctx.lineTo(toPxX(s), p)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(scr.x, base)
      for (let i = 0; i <= SAMPLES; i++) {
        const s = -SCREEN_HALF + (i / SAMPLES) * 2 * SCREEN_HALF
        ctx.lineTo(toPxX(s), toPxY(intensityBoth(BENCH, s, V)))
      }
      ctx.lineTo(scr.x + scr.w, base)
      ctx.closePath()
      ctx.fillStyle = 'rgba(124,58,237,0.14)'
      ctx.fill()
      ctx.strokeStyle = PALETTE.pdf
      ctx.lineWidth = 1.4
      ctx.stroke()

      paneFrame(ctx, scr)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('what lands on the screen', scr.x + 4, 14)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.pdf
      ctx.fillText(`fringe contrast, measured  ${fmt(measuredVisibility(D), 2)}`, scr.x + 4, h - 10)
      const know = `path knowledge ${fmt(D, 2)}`
      ctx.fillStyle = PALETTE.cutoff
      ctx.fillText(know, scr.x + scr.w - ctx.measureText(know).width, h - 10)
    },
  }
}

export function WhichPath() {
  const [d, setD] = useState(0)
  const dRef = useRef(d)
  dRef.current = d

  return (
    <Sim height={280} create={() => createWhichPath(dRef)}>
      <label className="sim-slider">
        <span>know nothing</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={d}
          onChange={(e) => setD(Number(e.target.value))}
        />
        <span>know exactly</span>
      </label>
    </Sim>
  )
}
