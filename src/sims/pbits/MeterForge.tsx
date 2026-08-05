import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt } from '../lib/chrome'
import {
  countsToProbs,
  drawLayerRail,
  drawMeter,
  enumerate,
  freshSpins,
  frustratedLoop,
  stateIndex,
  sweep,
  u01,
  type Schedule,
} from './lib'

// PLAN F9/F10 (rev. 2) — the meter, forged. The frustrated four-loop again;
// exact enumeration draws the ghost bars, the live sampler fills against them,
// and the total-variation distance prints as one number. Moving the coldness
// knob reshapes the ghost itself and the sampler re-earns the floor — the
// difference between "the target moved" and "we missed it," on one pane.
//
// Rev. 2: the √2 claim is an EXPECTED sampling-noise scaling, never a per-run
// promise — so each ghost bar wears a band of half-width √(p(1−p)/N), the
// typical wobble of an N-sample estimate, drawn behind the live bars. The
// bars usually live inside it; any single run may briefly not. (Consecutive
// sweeps are correlated, so the true wobble runs slightly above the iid
// band — the check script measures the inflation and holds it under ~2×.)

const SWEEPS_PER_SEC = 400
const SEQ: Schedule = { kind: 'sequential' }

export interface MeterShared {
  beta: number
}

/** Numbers the check script reads back out of a running stepper. */
export interface MeterProbe {
  tv: number
  samples: number
  /** mean over states of the drawn band half-width √(p(1−p)/N) */
  band: number
  /** how many of the 16 live bars sit within 2 band-half-widths of exact */
  inBand: number
}

export function createMeterForge(
  shared: { current: MeterShared },
  probe?: MeterProbe,
  seed = 61,
): Stepper {
  let m = frustratedLoop(shared.current.beta)
  let exact = enumerate(m)
  let counts = new Float64Array(16)
  let lastBeta = shared.current.beta
  const s = freshSpins(m, seed)
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      if (shared.current.beta !== lastBeta) {
        lastBeta = shared.current.beta
        m = frustratedLoop(lastBeta)
        exact = enumerate(m)
        counts = new Float64Array(16) // new target — a fresh measurement
      }
      acc += dt * SWEEPS_PER_SEC
      while (acc >= 1) {
        acc -= 1
        sweepN++
        sweep(m, s, SEQ, (site, salt) => u01(seed, sweepN, site, salt))
        counts[stateIndex(s)]++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      let total = 0
      for (let i = 0; i < counts.length; i++) total += counts[i]
      const r = { x: 28, y: 30, w: w - 56, h: h - 64 }
      const probs = countsToProbs(counts)
      // the ±√(p(1−p)/N) band, drawn FIRST so the live bars sit on top of it.
      // Geometry mirrors drawMeter's own scaling (same peak, same 34px text
      // strip) so the band and the bars it brackets share one ruler.
      const textH = 34
      const plotH = r.h - textH
      let peak = 0
      for (let i = 0; i < exact.length; i++) peak = Math.max(peak, exact[i], probs[i])
      if (peak === 0) peak = 1
      const bw = r.w / exact.length
      let bandSum = 0
      let inBand = 0
      if (total > 0) {
        for (let i = 0; i < exact.length; i++) {
          const hw = Math.sqrt((exact[i] * (1 - exact[i])) / total)
          bandSum += hw
          if (Math.abs(probs[i] - exact[i]) <= 2 * hw) inBand++
          const lo = Math.max(0, exact[i] - hw)
          const hi = exact[i] + hw
          const yTop = r.y + plotH - (hi / peak) * plotH
          const yBot = r.y + plotH - (lo / peak) * plotH
          ctx.fillStyle = PALETTE.ghost
          ctx.globalAlpha = 0.28
          ctx.fillRect(r.x + i * bw + bw * 0.12, yTop, bw * 0.76, yBot - yTop)
          ctx.globalAlpha = 1
        }
      }
      const tv = drawMeter(ctx, r, exact, probs, { samples: total })
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`β = ${fmt(shared.current.beta, 2)}`, 28, 20)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('inverse temperature — "coldness"', 92, 20)
      ctx.textAlign = 'right'
      ctx.fillText('band: ±√(p(1−p)/N)', r.x + r.w, r.y + r.h - 14)
      ctx.textAlign = 'left'
      if (probe) {
        probe.tv = tv
        probe.samples = total
        probe.band = bandSum / exact.length
        probe.inBand = inBand
      }
    },
  }
}

export function MeterForge() {
  const [beta, setBeta] = useState(0.8)
  const shared = useRef<MeterShared>({ beta })
  shared.current.beta = beta

  return (
    <Sim height={260} create={() => createMeterForge(shared)}>
      <label className="sim-slider">
        <span>hot</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={beta}
          onChange={(e) => setBeta(Number(e.target.value))}
        />
        <span>cold</span>
      </label>
    </Sim>
  )
}
