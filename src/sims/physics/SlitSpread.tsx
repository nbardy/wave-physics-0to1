import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt } from '../lib/chrome'
import { BENCH, SCREEN_HALF, fresnelSlitIntensity } from './optics'

// PLAN figure 2 — where the ray picture stops being true.
//
// One slit, one slider: its width. The filled curve is the exact Fresnel
// intensity behind the slit (valid at every Fresnel number, so nothing switches
// theories mid-slider); the dashed top hat is what ray optics predicts — light
// exactly where the slit is, dark everywhere else. Wide open, they agree apart
// from a ringing edge. Narrow, the light goes where no ray could have taken it.
//
// The vertical scale is the pattern's OWN peak, not the unobstructed level.
// It has to be: a 0.05 mm slit passes 0.2% of the light, so plotted against the
// unobstructed level its pattern is a flat line on the floor and the figure
// shows nothing at all. The question this figure answers is *where* the light
// goes, so the shape is what gets the axis — and the light it gave up to spread
// that far is printed as a meter instead of being silently normalised away.
//
// The "lit patch" meter is measured off the drawn curve: the outermost positions
// still above half the pattern's peak.

const SAMPLES = 420

const sampleX = (i: number) => -SCREEN_HALF + (i / SAMPLES) * 2 * SCREEN_HALF

function peakIntensity(a: number): number {
  let peak = 0
  for (let i = 0; i <= SAMPLES; i++) peak = Math.max(peak, fresnelSlitIntensity(BENCH, a, sampleX(i)))
  return peak
}

function widthAtHalf(a: number, peak: number): number {
  // scan from the outside in, on the same grid the curve is drawn on
  for (let i = SAMPLES; i >= SAMPLES / 2; i--) {
    const x = sampleX(i)
    if (fresnelSlitIntensity(BENCH, a, x) >= 0.5 * peak) return 2 * Math.abs(x)
  }
  return 0
}

export function createSlitSpread(aRef: { current: number }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const a = aRef.current
      const padX = 12
      const plotW = w - 2 * padX
      const base = h - 30
      const top = 26
      const plotH = base - top
      const peak = peakIntensity(a)
      const toPxX = (x: number) => padX + ((x + SCREEN_HALF) / (2 * SCREEN_HALF)) * plotW
      // the pattern's own peak is 1; 1.15 is breathing room above it
      const toPxY = (I: number) => base - (I / peak / 1.15) * plotH

      // ray optics: light exactly where the slit is, nothing outside it
      const gl = toPxX(-a / 2)
      const gr = toPxX(a / 2)
      ctx.strokeStyle = 'rgba(107,114,128,0.9)'
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(padX, base)
      ctx.lineTo(gl, base)
      ctx.lineTo(gl, toPxY(1))
      ctx.lineTo(gr, toPxY(1))
      ctx.lineTo(gr, base)
      ctx.lineTo(padX + plotW, base)
      ctx.stroke()
      ctx.setLineDash([])

      // what actually arrives
      ctx.beginPath()
      ctx.moveTo(padX, base)
      for (let i = 0; i <= SAMPLES; i++) {
        const x = sampleX(i)
        ctx.lineTo(toPxX(x), toPxY(fresnelSlitIntensity(BENCH, a, x)))
      }
      ctx.lineTo(padX + plotW, base)
      ctx.closePath()
      ctx.fillStyle = 'rgba(37,99,235,0.16)'
      ctx.fill()
      ctx.strokeStyle = PALETTE.amp
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.strokeStyle = 'rgba(120,140,170,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padX, base + 0.5)
      ctx.lineTo(padX + plotW, base + 0.5)
      ctx.stroke()

      // meters
      const patch = widthAtHalf(a, peak)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.amp
      ctx.fillText(`slit ${fmt(a * 1e3, 2)} mm`, padX, 14)
      ctx.fillStyle = PALETTE.pdf
      const lit = `lit patch ${fmt(patch * 1e3, 2)} mm`
      ctx.fillText(lit, padX + plotW - ctx.measureText(lit).width, 14)
      // what the spreading cost, since the curve above is drawn to its own peak
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(107,114,128,0.95)'
      const bright =
        peak >= 0.01
          ? `peak ${(peak * 100).toFixed(0)}% of unobstructed`
          : `peak ${(peak * 100).toFixed(2)}% of unobstructed`
      ctx.fillText(bright, padX + plotW - ctx.measureText(bright).width, 26)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('-30 mm', padX, h - 10)
      ctx.fillText('0', padX + plotW / 2 - 3, h - 10)
      const right = '+30 mm'
      ctx.fillText(right, padX + plotW - ctx.measureText(right).width, h - 10)
      const F = (a * a) / (BENCH.lambda * BENCH.L)
      const fs = `Fresnel number a²/λL = ${F >= 10 ? F.toFixed(0) : F.toFixed(2)}`
      ctx.fillText(fs, padX + plotW / 2 - ctx.measureText(fs).width / 2, 14)
    },
  }
}

export function SlitSpread() {
  const [a, setA] = useState(2e-3)
  const aRef = useRef(a)
  aRef.current = a

  return (
    <Sim height={280} create={() => createSlitSpread(aRef)}>
      <label className="sim-slider">
        <span>0.05 mm</span>
        <input
          type="range"
          min={Math.log10(0.05)}
          max={Math.log10(6)}
          step={0.005}
          value={Math.log10(a * 1e3)}
          onChange={(e) => setA(Math.pow(10, Number(e.target.value)) * 1e-3)}
        />
        <span>6 mm</span>
      </label>
    </Sim>
  )
}
