import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_METER, fmt } from '../lib/chrome'
import {
  countsToProbs,
  drawLayerRail,
  drawMeter,
  enumerate,
  freshSpins,
  frustratedLoop,
  localField,
  stateIndex,
  u01,
  type PbitModel,
} from './lib'

// PLAN F20 — one nonideality, priced. Real comparators do not share one
// transfer curve: fabrication scatters each cell's gain, so cell i runs
// σ(2β·gᵢ·field) instead of σ(2β·field). The knob scales a fixed gain-scatter
// pattern from zero (the idealized chip of every figure so far) to ±60%. The
// audited system is the frustrated four-loop; the exact ghost is the IDEAL
// law, so the meter prices exactly what the jitter costs.

const BETA = 0.8
const SWEEPS_PER_SEC = 400
/** The fixed scatter pattern — one draw per cell, scaled by the knob. */
export const GAIN_PATTERN = [0.9, -0.7, 0.5, -1.0]

/** Sequential sweep with per-site gain on the comparator slope. */
export function sweepJitter(
  m: PbitModel,
  s: Int8Array,
  gains: number[],
  rand: (site: number, salt: number) => number,
): void {
  for (let i = 0; i < m.n; i++) {
    if (m.clamp[i] !== 0) continue
    const f = localField(m, s, i)
    s[i] = rand(i, 0) < 1 / (1 + Math.exp(-2 * m.beta * gains[i] * f)) ? 1 : -1
  }
}

export interface JitterShared {
  jitter: number
}

export interface JitterProbe {
  tv: number
  samples: number
}

export function createNonideality(
  shared: { current: JitterShared },
  probe?: JitterProbe,
  seed = 53,
): Stepper {
  const m = frustratedLoop(BETA)
  const exact = enumerate(m) // the ideal law — the promise the datasheet makes
  const s = freshSpins(m, seed)
  let counts = new Float64Array(16)
  let lastJitter = shared.current.jitter
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      const j = shared.current.jitter
      if (j !== lastJitter) {
        lastJitter = j
        counts = new Float64Array(16) // new hardware — fresh evidence
      }
      const gains = GAIN_PATTERN.map((d) => 1 + j * d)
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        sweepJitter(m, s, gains, (site, salt) => u01(seed, sweepN, site, salt))
        counts[stateIndex(s)]++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      let total = 0
      for (let i = 0; i < counts.length; i++) total += counts[i]
      const tv = drawMeter(
        ctx,
        { x: 28, y: 46, w: w - 56, h: h - 80 },
        exact,
        countsToProbs(counts),
        { samples: total },
      )
      if (probe) {
        probe.tv = tv
        probe.samples = total
      }
      const j = shared.current.jitter
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(
        `gain scatter ±${Math.round(j * 100)}%   cell gains: ${GAIN_PATTERN.map((d) => fmt(1 + j * d, 2)).join('  ')}`,
        28,
        24,
      )
    },
  }
}

export function Nonideality() {
  const [jitter, setJitter] = useState(0)
  const shared = useRef<JitterShared>({ jitter })
  shared.current.jitter = jitter

  return (
    <Sim height={260} create={() => createNonideality(shared)}>
      <label className="sim-slider">
        <span>ideal</span>
        <input
          type="range"
          min={0}
          max={0.6}
          step={0.05}
          value={jitter}
          onChange={(e) => setJitter(Number(e.target.value))}
        />
        <span>scattered</span>
      </label>
    </Sim>
  )
}
