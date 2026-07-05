import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { clockRow, drawBase, laneSplit } from './lib/clocks'
import { AWAVE_N, createAWave } from './lib/awave'

// Figure 1 (the hero; returns in §10, understood) — one electromagnetic wave,
// dual-pane, both panes driven by the SAME leapfrog state in lib/awave.ts:
//   top    — the textbook picture: E (red) and B (cyan) arrow families, drawn
//            exactly IN PHASE (they are, for a traveling wave; the quarter-cycle
//            "each births the other" picture is a misconception and is banned
//            from this figure — see PLAN.md hero spec).
//   bottom — the same wave as a ripple in the clocks' transport rule: each
//            needle is a reference needle parallel-transported from the left
//            end under the live A(x), so the pulse arrives as a traveling kink
//            in what "parallel" means.
// One knob: time speed (the house default). Endless: pulses re-enter at left.

const CLOCKS = 26

function createHero(speedRef: { current: number }): Stepper {
  const wave = createAWave(true)
  let sinceLaunch = 0

  return {
    step(dt) {
      const scaled = dt * speedRef.current
      wave.step(scaled)
      sinceLaunch += scaled
      // keep the stage alive: re-pluck after the pulse has crossed and left
      if (sinceLaunch > 7) {
        wave.pluck(0.12, 1)
        sinceLaunch = 0
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, bottom] = laneSplit(w, h, [0.52, 0.48])
      const n = AWAVE_N
      const x = (i: number) => top.x0 + (i / (n - 1)) * (top.x1 - top.x0)

      // ---- top pane: E and B arrow families, in phase ----
      const midY = (top.y0 + top.y1) / 2
      const amp = (top.y1 - top.y0) * 0.42
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(top.x0, midY)
      ctx.lineTo(top.x1, midY)
      ctx.stroke()
      const arrowEvery = 7
      for (let i = 0; i < n; i += arrowEvery) {
        // E: vertical arrows (red). B: drawn at 30° to suggest the out-of-plane
        // axis (cyan) — same magnitude profile, same phase, honestly.
        const ev = wave.e[i] * amp * 1.6
        const bv = wave.b[i] * amp * 1.6
        if (Math.abs(ev) > 1.5) {
          ctx.strokeStyle = PALETTE.efield
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(x(i), midY)
          ctx.lineTo(x(i), midY - ev)
          ctx.stroke()
        }
        if (Math.abs(bv) > 1.5) {
          ctx.strokeStyle = PALETTE.bfield
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(x(i), midY)
          ctx.lineTo(x(i) + bv * 0.5, midY + bv * 0.28)
          ctx.stroke()
        }
      }
      ctx.fillStyle = PALETTE.efield
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('E', top.x0 + 4, top.y0 + 14)
      ctx.fillStyle = PALETTE.bfield
      ctx.fillText('B', top.x0 + 16, top.y0 + 14)

      // ---- bottom pane: the same wave in the clocks' transport rule ----
      const row = clockRow(bottom, CLOCKS)
      drawBase(ctx, row, bottom)
      // parallel-transport a reference needle from the left end under live A:
      // needle(i) = Σ A·dx up to clock i. A pulse = a traveling kink in "parallel".
      let phi = Math.PI / 2
      const gain = 0.9 // visual gain on the accumulated turn
      for (let i = 0; i < CLOCKS; i++) {
        const from = Math.floor((i / CLOCKS) * n)
        const to = Math.floor(((i + 1) / CLOCKS) * n)
        // face
        ctx.strokeStyle = PALETTE.wall
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(row.cx[i], row.cy, row.r, 0, Math.PI * 2)
        ctx.stroke()
        // transported needle
        ctx.strokeStyle = PALETTE.conn
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(row.cx[i], row.cy)
        ctx.lineTo(
          row.cx[i] + Math.cos(-phi) * row.r * 0.85,
          row.cy + Math.sin(-phi) * row.r * 0.85,
        )
        ctx.stroke()
        for (let j = from; j < to; j++) phi += wave.a[j] * gain * (1 / CLOCKS) * 8
      }
    },
  }
}

export function HeroEMWave() {
  const [speed, setSpeed] = useState(0.7)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <Sim height={340} create={() => createHero(speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.05}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}
