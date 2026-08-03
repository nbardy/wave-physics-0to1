import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, drawArrow, fmt, paneFrame } from '../lib/chrome'
import { BENCH, SCREEN_HALF, envelope, intensityBoth, intensityOne, pathPhase } from './optics'

// PLAN figure 3 — why adding a second way to arrive can make a place darker.
//
// Left: the two contributions as arrows, laid tip to tail. Each has the length
// one slit alone would deliver; the second is turned by the phase δ its longer
// path costs. Right: the square of the sum, as a function of where on the screen
// you stand — with the dashed line showing what the arrivals would total if the
// arrows were added as lengths instead of as arrows. The slider moves one point
// along the screen and both panes answer together.
//
// Nothing here is fitted: |A| = |B| = √envelope(x), the turn is 2πd·x/(λL), and
// the plotted curve is intensityBoth, the same function the hero samples dots
// from.

const SAMPLES = 400
const PEAK = 4 // max of 2·(1+cos δ) when envelope ≈ 1 — the plot's ceiling

export function createPhasorSum(xRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const x = xRef.current
      const gap = 12
      const paneW = Math.min(200, w * 0.42)
      const left = { x: 2, y: 20, w: paneW, h: h - 44 }
      const right = { x: paneW + gap, y: 20, w: w - paneW - gap - 2, h: h - 44 }

      // --- left: the two arrows, tip to tail --------------------------------
      const amp = Math.sqrt(envelope(BENCH, x))
      const delta = pathPhase(BENCH, x)
      // Only the DIFFERENCE between the two phases is physical — a common phase
      // is unobservable — so the difference is split evenly, one arrow turned
      // −δ/2 and the other +δ/2. Drawing all of δ into the second arrow is just
      // as correct and far worse to look at: at δ = π the two arrows land exactly
      // on top of each other and the figure shows one line where it should show
      // a collapse. Split evenly, the chain opens into a visible V and the
      // closing arrow stays horizontal, so its length is the only thing moving.
      // 4.4 keeps the joint's circle — centred a full R left of the pane's
      // middle — inside the frame, instead of running off the left edge
      const R = Math.min(left.w / 4.4, left.h / 2.8)
      const ox = left.x + left.w / 2 - R
      const oy = left.y + left.h / 2
      const half = delta / 2
      const jx = ox + amp * R * Math.cos(half)
      const jy = oy + amp * R * Math.sin(half)
      const tx = ox + 2 * amp * R * Math.cos(half)
      const ty = oy

      // where the joint can be (radius = one amplitude) and where the closing
      // arrow's tip can be (the horizontal track from nothing to two amplitudes)
      ctx.strokeStyle = 'rgba(120,140,170,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(ox, oy, amp * R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(ox, oy)
      ctx.lineTo(ox + 2 * amp * R, oy)
      ctx.stroke()
      ctx.setLineDash([])

      // the closing arrow underneath, wide, so the two contributions stay
      // legible where all three lie along one line
      drawArrow(ctx, ox, oy, tx, ty, PALETTE.pdf, 6.5)
      drawArrow(ctx, ox, oy, jx, jy, PALETTE.slitA, 2.4)
      drawArrow(ctx, jx, jy, tx, ty, PALETTE.slitB, 2.4)
      paneFrame(ctx, left)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('amplitudes, tip to tail', left.x + 4, 14)
      const turns = delta / (2 * Math.PI)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.slitB
      ctx.fillText(`path difference ${fmt(turns, 2)} λ`, left.x + 4, h - 10)

      // --- right: the two totals, across the whole screen -------------------
      const base = right.y + right.h - 4
      const toPxX = (s: number) => right.x + ((s + SCREEN_HALF) / (2 * SCREEN_HALF)) * right.w
      const toPxY = (I: number) => base - (I / PEAK) * (right.h - 12)

      // what arrivals would total with no interference: |A|² + |B|²
      ctx.strokeStyle = 'rgba(107,114,128,0.85)'
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.3
      ctx.beginPath()
      for (let i = 0; i <= SAMPLES; i++) {
        const s = -SCREEN_HALF + (i / SAMPLES) * 2 * SCREEN_HALF
        const p = toPxY(2 * intensityOne(BENCH, s))
        i === 0 ? ctx.moveTo(toPxX(s), p) : ctx.lineTo(toPxX(s), p)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // what actually arrives: |A + B|²
      ctx.beginPath()
      ctx.moveTo(right.x, base)
      for (let i = 0; i <= SAMPLES; i++) {
        const s = -SCREEN_HALF + (i / SAMPLES) * 2 * SCREEN_HALF
        ctx.lineTo(toPxX(s), toPxY(intensityBoth(BENCH, s)))
      }
      ctx.lineTo(right.x + right.w, base)
      ctx.closePath()
      ctx.fillStyle = 'rgba(124,58,237,0.14)'
      ctx.fill()
      ctx.strokeStyle = PALETTE.pdf
      ctx.lineWidth = 1.4
      ctx.stroke()

      // where we are standing
      const here = toPxX(x)
      ctx.strokeStyle = PALETTE.hit
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(here, right.y)
      ctx.lineTo(here, base)
      ctx.stroke()
      const I = intensityBoth(BENCH, x)
      ctx.beginPath()
      ctx.arc(here, toPxY(I), 3.5, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.hit
      ctx.fill()

      paneFrame(ctx, right)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('arrivals per second, across the screen', right.x + 4, 14)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.pdf
      const meter = `both slits ${fmt(I, 2)}   ·   one at a time, doubled ${fmt(2 * intensityOne(BENCH, x), 2)}`
      ctx.fillText(meter, right.x + 4, h - 10)
    },
  }
}

export function PhasorSum() {
  const [x, setX] = useState(0)
  const xRef = useRef(x)
  xRef.current = x

  return (
    <Sim height={280} create={() => createPhasorSum(xRef)}>
      <label className="sim-slider">
        <span>−30 mm</span>
        <input
          type="range"
          min={-SCREEN_HALF}
          max={SCREEN_HALF}
          step={SCREEN_HALF / 600}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
        />
        <span>+30 mm</span>
      </label>
      <span className="sim-readout">{fmt(x * 1e3, 1)} mm</span>
    </Sim>
  )
}
