import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Daniel Bernoulli, 1738 — pipe bookkeeping.
// HONESTY: the article deliberately does NOT teach the Bernoulli principle as a
// mechanism. This figure shows the speed/pressure tradeoff purely as an
// OBSERVATION: mass conservation fixes the speeds (u·A = const), and we DISPLAY
// the accompanying pressure the gauges would read. No forces are integrated;
// nothing here derives why the tradeoff holds. Display only.
//
// 1-D incompressible relation:   u(x) = U0 · A0 / A(x)
// with A(x) the local bore cross-section. Bernoulli (displayed, relative):
//   p(x) = p0 + ½ρ(U0² − u(x)²)
//
// Stability: markers are advected by an analytic velocity field (no integrator
// feedback), position clamped/respawned at the ends. Nothing to blow up.

const N_MARKERS = 60
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const U0 = 0.18 // inlet speed (fraction of pipe length / sec) at the full bore
const RHO = 1 // display density
const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)

// throat profile: full bore at the ends, cosine-smoothed narrowing to `ratio` in
// the middle. Returns the half-height fraction of the pipe at normalized x∈[0,1].
function boreHalf(x: number, ratio: number): number {
  // smooth bump centered at x=0.5, width covers the central ~50% of the pipe
  const t = Math.min(1, Math.max(0, (x - 0.25) / 0.5)) // 0..1 across the neck
  const bump = 0.5 - 0.5 * Math.cos(2 * Math.PI * t) // 0 at edges, 1 at center
  const inNeck = x > 0.25 && x < 0.75 ? bump : 0
  return 0.5 * (1 - (1 - ratio) * inNeck) // 0.5 (full) → 0.5·ratio (throat)
}

function speedAt(x: number, ratio: number): number {
  // mass conservation: u·A = U0·A0. In 1-D "pipe" A ∝ half-height, so
  // u(x) = U0 · A0/A(x) = U0 · (0.5) / boreHalf(x).
  return (U0 * 0.5) / boreHalf(x, ratio)
}

function pressureAt(x: number, ratio: number): number {
  const u = speedAt(x, ratio)
  return 0.5 * RHO * (U0 * U0 - u * u) // relative to ambient p0 = 0
}

function createPipe(ratioRef: { current: number }): Stepper {
  const mx = new Float32Array(N_MARKERS)
  const my = new Float32Array(N_MARKERS) // lateral position ∈ [-1,1] within bore
  for (let i = 0; i < N_MARKERS; i++) {
    mx[i] = Math.random()
    my[i] = Math.random() * 2 - 1
  }

  let acc = 0
  const advance = () => {
    const ratio = ratioRef.current
    for (let i = 0; i < N_MARKERS; i++) {
      mx[i] += speedAt(mx[i], ratio) * FIXED_DT
      if (mx[i] > 1) {
        mx[i] -= 1
        my[i] = Math.random() * 2 - 1
      }
    }
  }

  // draw one dial gauge; needle sweeps a semicircle, red above ambient, cyan below
  const drawGauge = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    p: number,
    label: string,
  ) => {
    ctx.strokeStyle = SEPIA
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI) // top-half dial
    ctx.stroke()
    // needle: map p∈[-pMax,pMax] to angle across the top half
    const pMax = 0.5 * RHO * U0 * U0 * 4 // headroom
    const frac = Math.max(-1, Math.min(1, p / pMax))
    const ang = Math.PI + (0.5 - 0.5 * frac) * Math.PI // left=low, right=high
    ctx.strokeStyle = p >= 0 ? PALETTE.pHi : PALETTE.pLo
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * 0.85 * Math.cos(ang), cy + radius * 0.85 * Math.sin(ang))
    ctx.stroke()
    ctx.fillStyle = SEPIA
    ctx.font = '600 10px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(label, cx, cy + 12)
    ctx.textAlign = 'left'
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      const ratio = ratioRef.current
      ctx.clearRect(0, 0, w, h)
      const padX = 24
      const midY = h * 0.55
      const halfPix = h * 0.3 // pixels for the full-bore half-height
      const X = (x: number) => padX + x * (w - 2 * padX)

      // pipe walls (cosine-smoothed constriction)
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let s = 0; s <= 100; s++) {
        const x = s / 100
        const yTop = midY - boreHalf(x, ratio) * 2 * halfPix
        if (s === 0) ctx.moveTo(X(x), yTop)
        else ctx.lineTo(X(x), yTop)
      }
      ctx.stroke()
      ctx.beginPath()
      for (let s = 0; s <= 100; s++) {
        const x = s / 100
        const yBot = midY + boreHalf(x, ratio) * 2 * halfPix
        if (s === 0) ctx.moveTo(X(x), yBot)
        else ctx.lineTo(X(x), yBot)
      }
      ctx.stroke()

      // amber markers, advected by u(x)
      ctx.fillStyle = PALETTE.dye
      for (let i = 0; i < N_MARKERS; i++) {
        const x = mx[i]
        const bh = boreHalf(x, ratio) * 2 * halfPix
        const y = midY + my[i] * bh * 0.9
        ctx.beginPath()
        ctx.arc(X(x), y, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // two dial gauges mounted on the top wall — wide section and the throat
      const gr = h * 0.16
      const xWide = 0.13
      const xThroat = 0.5
      drawGauge(
        ctx,
        X(xWide),
        midY - boreHalf(xWide, ratio) * 2 * halfPix - 4,
        gr,
        pressureAt(xWide, ratio),
        'wide',
      )
      drawGauge(
        ctx,
        X(xThroat),
        midY - boreHalf(xThroat, ratio) * 2 * halfPix - 4,
        gr,
        pressureAt(xThroat, ratio),
        'throat',
      )
    },
  }
}

export function BernoulliPipe() {
  const [ratio, setRatio] = useState(0.55)
  const ratioRef = useRef(ratio)
  ratioRef.current = ratio

  return (
    <Sim height={260} create={() => createPipe(ratioRef)}>
      <label className="sim-slider">
        <span>narrow</span>
        <input
          type="range"
          min={0.35}
          max={0.9}
          step={0.01}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
        />
        <span>wide throat</span>
      </label>
    </Sim>
  )
}
