import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { clockRow, drawBase, drawClocks, drawGraph, laneSplit } from './lib/clocks'

// §6's closing figure (plan fig-gap: the D-vs-∂ comparison, fused with the
// line-diary theorem the section's savior states). The scene starts where the
// tuner's game ended: a mangling α₀ on the labels, and an A that compensates
// for it exactly, so Dθ is already flat. The one knob is a counter-brush that
// sweeps α → (1−s)·α₀; by the compensating law A follows to (1−s)·∂α₀. The
// reader watches ∂θ and A dance in perfect lockstep down to zero while Dθ
// never moves a pixel — the picture of "on a line, any tuned A is a diary of
// brushstrokes, erasable by one counter-stroke." No integrator: θ_phys is a
// closed-form traveling wave and α₀ is a fixed sum of bumps, so there is no
// scheme and no stability condition; the visual gains on the traces are the
// clock kit's defaults.

const N = 26
const K = 2.6 // physical wave: gentle twist so Dθ is visibly nonzero but calm
const OMEGA = 1.1

function alpha0(f: number): number {
  // the mangle left over from the tuner's game: two stacked bumps
  return 1.1 * Math.exp(-((f - 0.35) ** 2) / 0.012) - 0.8 * Math.exp(-((f - 0.68) ** 2) / 0.009)
}

function createEraser(eraseRef: { current: number }): Stepper {
  let t = 0
  const theta = new Float32Array(N)
  const dTheta = new Float32Array(N - 1)
  const aField = new Float32Array(N - 1)
  const covariant = new Float32Array(N - 1)
  const zeros = new Float32Array(N)

  return {
    step(dt) {
      t += dt
    },
    draw(ctx, w, h) {
      const s = eraseRef.current
      const dx = 1 / (N - 1)
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1)
        zeros[i] = (1 - s) * alpha0(f) // the surviving mangle on the labels
        theta[i] = K * f - OMEGA * t + zeros[i] // displayed needle angle
      }
      for (let i = 0; i < N - 1; i++) {
        dTheta[i] = (theta[i + 1] - theta[i]) / dx // the labels' derivative
        aField[i] = (zeros[i + 1] - zeros[i]) / dx // A = ∂α₀·(1−s): the compensating rule
        covariant[i] = dTheta[i] - aField[i] // Dθ — provably K at all times, drawn live anyway
      }

      ctx.clearRect(0, 0, w, h)
      const [top, mid, bottom] = laneSplit(w, h, [0.42, 0.29, 0.29])
      const row = clockRow(top, N)
      drawBase(ctx, row, top)
      drawClocks(ctx, row, theta, { zeros })

      drawGraph(ctx, mid, row, dTheta, {
        color: PALETTE.gauge,
        yMin: -26,
        yMax: 30,
        label: '∂θ/∂x — the labels’ derivative',
      })
      drawGraph(ctx, bottom, row, aField, {
        color: PALETTE.conn,
        yMin: -26,
        yMax: 30,
        label: 'A — the rule',
      })
      drawGraph(ctx, bottom, row, covariant, {
        color: PALETTE.theta,
        yMin: -26,
        yMax: 30,
        label: '',
        axis: false,
      })
      ctx.fillStyle = PALETTE.theta
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('Dθ — never moves', bottom.x0 + 110, bottom.y0 + 12)
    },
  }
}

export function DiaryEraser() {
  const [erase, setErase] = useState(0)
  const eraseRef = useRef(erase)
  eraseRef.current = erase
  return (
    <Sim height={300} create={() => createEraser(eraseRef)}>
      <label className="sim-slider">
        <span>as the tuner left it</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={erase}
          onChange={(e) => setErase(Number(e.target.value))}
        />
        <span>diary erased</span>
      </label>
    </Sim>
  )
}
