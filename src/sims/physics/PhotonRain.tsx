import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER } from '../lib/chrome'
import {
  BENCH,
  SCREEN_HALF,
  fringeSpacing,
  intensityBoth,
  intensityOne,
  makeSampler,
  poisson,
  rng,
} from './optics'

// Where the two-slit pattern has its first zero: δ = π, i.e. x = λL/2d. The
// one-slit envelope there is still 0.97 of its peak, so this one column is where
// the two screens disagree hardest — a marker rides it in both panes.
const DARK = fringeSpacing(BENCH) / 2

// PLAN figure 1 (hero) — the contradiction, in one frame.
//
// Two screens fed by the same source, photon by photon. The upper mask has both
// slits open; the lower has one blocked. Every dot is an inverse-CDF draw from
// the exact Fraunhofer intensity of its own mask, and every histogram is counted
// from the dots that landed — not re-plotted from the formula that made them.
// Blocking a slit therefore does two things at once, and both are visible: the
// bars disappear, and only half as much light arrives.

const FIXED_DT = 1 / 120 // physics tick, independent of RAF cadence
const MAX_DOTS = 4000 // per pane; oldest are overwritten (ring buffer)
const HIST_BINS = 140

interface Pane {
  label: string
  sampler: ReturnType<typeof makeSampler>
  /** fraction of emitted photons this mask transmits, relative to two slits */
  transmit: number
  dotX: Float64Array
  dotY: Float64Array
  dots: number
  cursor: number
  counts: Int32Array
  total: number
}

function makePane(label: string, intensity: (x: number) => number, transmit: number): Pane {
  return {
    label,
    sampler: makeSampler(intensity),
    transmit,
    dotX: new Float64Array(MAX_DOTS),
    dotY: new Float64Array(MAX_DOTS),
    dots: 0,
    cursor: 0,
    counts: new Int32Array(HIST_BINS),
    total: 0,
  }
}

function land(pane: Pane, x: number, y: number) {
  pane.dotX[pane.cursor] = x
  pane.dotY[pane.cursor] = y
  pane.cursor = (pane.cursor + 1) % MAX_DOTS
  pane.dots = Math.min(pane.dots + 1, MAX_DOTS)
  const b = Math.min(
    HIST_BINS - 1,
    Math.max(0, Math.floor(((x + SCREEN_HALF) / (2 * SCREEN_HALF)) * HIST_BINS)),
  )
  pane.counts[b]++
  pane.total++
}

export function createPhotonRain(rateRef: { current: number }): Stepper {
  const u = rng(0x51ee7)
  const panes: Pane[] = [
    makePane('both slits open', (x) => intensityBoth(BENCH, x), 1),
    makePane('right slit blocked', (x) => intensityOne(BENCH, x), 0.5),
  ]
  let acc = 0

  return {
    step(dt) {
      acc += dt
      while (acc >= FIXED_DT) {
        acc -= FIXED_DT
        // Thinning a Poisson stream leaves an independent Poisson stream, so
        // each mask gets its own draw at its own rate — the two-slit mask passes
        // twice the light of the one-slit mask, and that is the whole difference
        // in how the two counts are generated.
        for (const pane of panes) {
          const n = poisson(rateRef.current * pane.transmit * FIXED_DT, u)
          for (let i = 0; i < n; i++) land(pane, pane.sampler.draw(u()), u())
        }
      }
    },

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const padX = 10
      const plotW = w - 2 * padX
      const toPxX = (x: number) => padX + ((x + SCREEN_HALF) / (2 * SCREEN_HALF)) * plotW

      // Both histograms share one vertical scale, so the lower pane is allowed
      // to look dimmer — it is dimmer.
      let peak = 1
      for (const p of panes) for (let i = 0; i < HIST_BINS; i++) peak = Math.max(peak, p.counts[i])

      const stationH = (h - 8) / 2
      const bandH = stationH * 0.46
      const histH = stationH * 0.36

      panes.forEach((pane, s) => {
        const top = 4 + s * stationH

        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(pane.label, padX, top + 10)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.pdf
        const n = pane.total.toLocaleString('en-US')
        ctx.fillText(`${n} arrivals`, w - padX - ctx.measureText(`${n} arrivals`).width, top + 10)

        // the screen: every dot one photon
        const bandTop = top + 16
        const histBaseY = bandTop + bandH + histH + 6

        ctx.fillStyle = 'rgba(20,24,33,0.035)'
        ctx.fillRect(padX, bandTop, plotW, bandH)
        ctx.fillStyle = PALETTE.hit
        ctx.globalAlpha = 0.55
        for (let i = 0; i < pane.dots; i++) {
          ctx.fillRect(toPxX(pane.dotX[i]) - 0.8, bandTop + 2 + pane.dotY[i] * (bandH - 5), 1.6, 1.6)
        }
        ctx.globalAlpha = 1

        // the tally: counted from the dots above, nothing else
        const histBase = histBaseY
        ctx.beginPath()
        ctx.moveTo(padX, histBase)
        for (let i = 0; i < HIST_BINS; i++) {
          const px = padX + ((i + 0.5) / HIST_BINS) * plotW
          ctx.lineTo(px, histBase - (pane.counts[i] / peak) * histH)
        }
        ctx.lineTo(padX + plotW, histBase)
        ctx.closePath()
        ctx.fillStyle = 'rgba(124,58,237,0.16)'
        ctx.fill()
        ctx.strokeStyle = PALETTE.pdf
        ctx.lineWidth = 1.3
        ctx.stroke()

        ctx.strokeStyle = 'rgba(120,140,170,0.45)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padX, histBase + 0.5)
        ctx.lineTo(padX + plotW, histBase + 0.5)
        ctx.stroke()

        // the disagreement column last, so nothing paints over it: the same x
        // in both panes, brightest below and emptiest above
        ctx.strokeStyle = 'rgba(220,38,38,0.55)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(toPxX(DARK), bandTop)
        ctx.lineTo(toPxX(DARK), histBaseY)
        ctx.stroke()
        ctx.setLineDash([])
      })
    },
  }
}

export function PhotonRain() {
  const [rate, setRate] = useState(60)
  const rateRef = useRef(rate)
  rateRef.current = rate

  return (
    <Sim height={360} create={() => createPhotonRain(rateRef)}>
      <label className="sim-slider">
        <span>one at a time</span>
        <input
          type="range"
          min={0.6}
          max={3.4}
          step={0.01}
          value={Math.log10(rate)}
          onChange={(e) => setRate(Math.pow(10, Number(e.target.value)))}
        />
        <span>a beam</span>
      </label>
      <span className="sim-readout">{Math.round(rate).toLocaleString('en-US')} photons/s</span>
    </Sim>
  )
}
