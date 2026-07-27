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
// THE PIPE HAS TWO FEATURES, not one: a throat at x=0.32 pinched to `ratio`, and a
// bulge at x=0.74 swollen to 1/ratio. The inlet (x < 0.14) stays at full bore and
// is the pressure reference p₀. One knob moves both, so the reader sees a two-sided
// see-saw — the throat gauge swings below p₀ while the bulge gauge swings above it.
// (An earlier version mounted its second gauge on the inlet itself, where the bore
// is fixed by construction: that needle could never move, and the prose's "where it
// widens the gauge climbs" had nothing on screen behind it.)
//
// DIAL SCALE: the needle angle is a signed SQUARE ROOT of pressure. Bernoulli is
// violently asymmetric — narrowing drops the pressure without bound (p → −∞ as
// A → 0) while widening can only ever raise it by the dynamic head ½ρU0². On a
// linear face the bulge's whole physical range is a few degrees of needle beside
// the throat's ninety. The compressed face keeps both legible; the dial carries no
// numeric ticks, so it promises direction and relative size, not a reading.
//
// Stability: markers are advected by an analytic velocity field (no integrator
// feedback), position clamped/respawned at the ends. Nothing to blow up.

const N_MARKERS = 60
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const U0 = 0.18 // inlet speed (fraction of pipe length / sec) at the full bore
const RHO = 1 // display density
const SEPIA = '#78716c' // history-furniture color (lesson-03 palette addition)

const THROAT_X = 0.32
const BULGE_X = 0.74
const FEATURE_W = 0.36 // cosine window width for both features (they don't overlap)
const P_FULL = 2.0 * U0 * U0 // pressure at full-scale needle deflection

// A cosine bump: 0 outside the window, 1 at its center, smooth at the seams.
function bump(x: number, center: number, width: number): number {
  const t = (x - (center - width / 2)) / width
  const inside = t > 0 && t < 1
  return inside ? 0.5 - 0.5 * Math.cos(2 * Math.PI * t) : 0
}

// Bore profile: full bore at the inlet and outlet, pinched to `ratio` at the
// throat, swollen to 1/ratio at the bulge. Returns the half-height fraction at
// normalized x∈[0,1] (0.5 = full bore).
function boreHalf(x: number, ratio: number): number {
  const swell = 1 / ratio
  const f =
    1 +
    (ratio - 1) * bump(x, THROAT_X, FEATURE_W) +
    (swell - 1) * bump(x, BULGE_X, FEATURE_W)
  return 0.5 * f
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

  // Signed square-root dial mapping (see header): direction is exact, magnitude is
  // compressed so both sides of the see-saw fit one face.
  const needleFrac = (p: number): number => {
    const mag = Math.min(1, Math.sqrt(Math.abs(p) / P_FULL))
    return Math.sign(p) * mag
  }

  // draw one dial gauge; needle sweeps a semicircle, red above ambient, cyan below.
  // A sepia tick at 12 o'clock is the inlet reference p₀, and a colored arc runs
  // from that tick to the needle so small deflections are still readable.
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

    const frac = needleFrac(p)
    const zeroAng = -Math.PI / 2 // 12 o'clock = p₀
    const ang = zeroAng + (frac * Math.PI) / 2 // left = below p₀, right = above

    // the p₀ tick
    ctx.strokeStyle = SEPIA
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy - radius)
    ctx.lineTo(cx, cy - radius * 0.78)
    ctx.stroke()

    const color = p >= 0 ? PALETTE.pHi : PALETTE.pLo
    // deflection arc from p₀ to the needle
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.72, Math.min(zeroAng, ang), Math.max(zeroAng, ang))
    ctx.stroke()

    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * 0.9 * Math.cos(ang), cy + radius * 0.9 * Math.sin(ang))
    ctx.stroke()

    ctx.fillStyle = SEPIA
    ctx.font = '600 10px ui-sans-serif, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(label, cx, cy - radius - 6)
    ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace'
    ctx.fillStyle = color
    const rel = p / (0.5 * RHO * U0 * U0) // in units of the inlet dynamic head
    ctx.fillText(`${rel >= 0 ? '+' : ''}${rel.toFixed(2)}`, cx, cy - 6)
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
      const midY = h * 0.56
      // Pixels per unit of `boreHalf` (full bore = 0.5, so the inlet half-height is
      // `halfPix`). Sized so the widest bulge — 1/0.45 = 2.22× full bore at the
      // slider's narrow end — still fits between the canvas edges.
      const halfPix = h * 0.15
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

      // the inlet reference: full bore by construction, so p₀ = 0 lives here and
      // both gauges swing about it. Marked, not gauged — a needle mounted on a
      // section that cannot change is a needle that cannot move.
      ctx.strokeStyle = SEPIA
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(X(0.02), midY - halfPix - 10)
      ctx.lineTo(X(0.14), midY - halfPix - 10)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = SEPIA
      ctx.font = '600 10px ui-sans-serif, system-ui'
      ctx.fillText('p₀ inlet', X(0.02), midY - halfPix - 15)

      // two dial gauges mounted on the top wall — the throat and the bulge
      const gr = h * 0.13
      drawGauge(
        ctx,
        X(THROAT_X),
        midY - boreHalf(THROAT_X, ratio) * 2 * halfPix - 4,
        gr,
        pressureAt(THROAT_X, ratio),
        'throat',
      )
      drawGauge(
        ctx,
        X(BULGE_X),
        midY - boreHalf(BULGE_X, ratio) * 2 * halfPix - 4,
        gr,
        pressureAt(BULGE_X, ratio),
        'bulge',
      )
    },
  }
}

export function BernoulliPipe() {
  // ONE knob: how much the pipe varies. It pinches the throat to `ratio` and swells
  // the bulge to 1/ratio together, so both gauges move off p₀ at once.
  const [ratio, setRatio] = useState(0.6)
  const ratioRef = useRef(ratio)
  ratioRef.current = ratio

  return (
    <Sim height={280} create={() => createPipe(ratioRef)}>
      <label className="sim-slider">
        <span>pinched</span>
        <input
          type="range"
          min={0.45}
          max={0.95}
          step={0.01}
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
        />
        <span>even bore</span>
      </label>
    </Sim>
  )
}
