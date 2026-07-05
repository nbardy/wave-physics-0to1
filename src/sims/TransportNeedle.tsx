import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { clockRow, drawBase, drawClocks, drawGraph, laneSplit } from './lib/clocks'

// §6 — the transport rule as data. A needle is carried from clock to clock,
// rotating by exactly A(x)·dx per step: the connection says what "keep it
// pointing the same way" means. Top lane: the clocks with the carried needle
// and its ghost trail. Bottom lane: the A(x) curve itself — the rule, drawn.
// One knob: the strength of the rule (A's amplitude), so A = 0 recovers the
// obvious "don't turn it" transport and the reader sees ordinary calculus as
// the special case. No integrator to go unstable: the transported angle is the
// running integral of A, accumulated with the walker.

const N = 24
const WALK_SPEED = 0.12 // fraction of the row per second

function aProfile(f: number, amp: number): number {
  // a smooth bump-and-dip rule: turn left through the middle, right near the end
  return amp * (Math.exp(-((f - 0.4) ** 2) / 0.02) - 0.7 * Math.exp(-((f - 0.75) ** 2) / 0.012))
}

function createWalker(ampRef: { current: number }): Stepper {
  let f = 0 // walker position as a fraction of the row
  let phi = Math.PI / 2 // the carried needle's angle; starts pointing "up"
  const ghosts: { f: number; phi: number }[] = []

  return {
    step(dt) {
      const step = WALK_SPEED * dt
      // accumulate the rule: dφ = A(x)·dx along the walk
      const SUBST = 8
      for (let s = 0; s < SUBST; s++) {
        const sub = step / SUBST
        phi += aProfile(f + sub / 2, ampRef.current) * sub * 40
        f += sub
      }
      if (ghosts.length === 0 || f - ghosts[ghosts.length - 1].f > 1 / (N - 1)) {
        ghosts.push({ f, phi })
      }
      if (f >= 1) {
        f = 0
        phi = Math.PI / 2
        ghosts.length = 0
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [top, bottom] = laneSplit(w, h, [0.6, 0.4])
      const row = clockRow(top, N)
      drawBase(ctx, row, top)
      // empty faces — this figure is about the needle we carry, not a section
      drawClocks(ctx, row, new Float32Array(N), { needle: 'rgba(0,0,0,0)' })

      // ghost trail: where the carried needle pointed at each clock it passed
      for (const g of ghosts) {
        const x = top.x0 + g.f * (top.x1 - top.x0)
        ctx.strokeStyle = 'rgba(37,99,235,0.35)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(x, row.cy)
        ctx.lineTo(x + Math.cos(-g.phi) * row.r * 0.85, row.cy + Math.sin(-g.phi) * row.r * 0.85)
        ctx.stroke()
      }
      // the carried needle, live
      const x = top.x0 + f * (top.x1 - top.x0)
      ctx.strokeStyle = PALETTE.conn
      ctx.lineWidth = 2.6
      ctx.beginPath()
      ctx.moveTo(x, row.cy)
      ctx.lineTo(x + Math.cos(-phi) * row.r * 0.95, row.cy + Math.sin(-phi) * row.r * 0.95)
      ctx.stroke()

      // the rule itself, drawn as data
      const a = new Float32Array(N)
      for (let i = 0; i < N; i++) a[i] = aProfile(i / (N - 1), ampRef.current)
      drawGraph(ctx, bottom, row, a, {
        color: PALETTE.conn,
        yMin: -1.1,
        yMax: 1.1,
        label: 'A(x) — turn per step',
      })
    },
  }
}

export function TransportNeedle() {
  const [amp, setAmp] = useState(0.6)
  const ampRef = useRef(amp)
  ampRef.current = amp
  return (
    <Sim height={280} create={() => createWalker(ampRef)}>
      <label className="sim-slider">
        <span>A = 0</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={amp}
          onChange={(e) => setAmp(Number(e.target.value))}
        />
        <span>strong rule</span>
      </label>
    </Sim>
  )
}
