import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, enumerate, frustratedLoop, stateIndex, u01 } from './lib'

// PLAN F7 — the mountain range. Every state of the frustrated four-loop is a
// column whose height is its exact Boltzmann weight; the sampler is a token
// hopping columns. Cold freezes the token into the deep columns; hot flattens
// the whole range. The law (the columns) and the rule (the hopping) share one
// pane because they are the same fact.

const HOP_DT = 1 / 12 // one single-site update per hop — slow enough to watch

export interface LandscapeShared {
  beta: number
}

export function createLandscape(shared: { current: LandscapeShared }, seed = 31): Stepper {
  let m = frustratedLoop(shared.current.beta)
  let exact = enumerate(m)
  let lastBeta = shared.current.beta
  const s = Int8Array.from([1, 1, -1, 1])
  let site = 0
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      if (shared.current.beta !== lastBeta) {
        lastBeta = shared.current.beta
        m = frustratedLoop(lastBeta)
        exact = enumerate(m)
      }
      acc += dt
      while (acc >= HOP_DT) {
        acc -= HOP_DT
        // one site per hop, round-robin — a sequential sweep spread over time
        // so each hop stays watchable
        sweepN++
        const i = site
        site = (site + 1) % m.n
        let f = m.h[i]
        for (let k = 0; k < m.nbr[i].length; k++) f += m.wgt[i][k] * s[m.nbr[i][k]]
        const p = 1 / (1 + Math.exp(-2 * m.beta * f))
        s[i] = u01(seed, sweepN, i, 0) < p ? 1 : -1
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'target')

      const r: Rect = { x: 24, y: 30, w: w - 48, h: h - 76 }
      paneFrame(ctx, r)
      const n = exact.length
      const bw = r.w / n
      let peak = 0
      for (let i = 0; i < n; i++) peak = Math.max(peak, exact[i])
      const cur = stateIndex(s)
      for (let i = 0; i < n; i++) {
        const bh = (exact[i] / peak) * (r.h - 26)
        const bx = r.x + i * bw
        ctx.fillStyle = PALETTE.ghost
        ctx.globalAlpha = i === cur ? 0.7 : 0.4
        ctx.fillRect(bx + bw * 0.14, r.y + r.h - bh, bw * 0.72, bh)
        ctx.globalAlpha = 1
        if (i === cur) {
          // the token: where the sampler stands right now
          ctx.beginPath()
          ctx.arc(bx + bw / 2, r.y + r.h - bh - 9, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = PALETTE.sUp
          ctx.fill()
        }
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('all 16 states, column height = exact probability', r.x, r.y + r.h + 16)
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      // β is inverse temperature — the knob reads hot at small β, cold at large
      ctx.fillText(`β = ${fmt(shared.current.beta, 2)} — inverse temperature ("coldness")`, r.x, 20)
    },
  }
}

export function Landscape() {
  const [beta, setBeta] = useState(0.8)
  const shared = useRef<LandscapeShared>({ beta })
  shared.current.beta = beta

  return (
    <Sim height={260} create={() => createLandscape(shared)}>
      <label className="sim-slider">
        <span>hot</span>
        <input
          type="range"
          min={0.05}
          max={2.5}
          step={0.05}
          value={beta}
          onChange={(e) => setBeta(Number(e.target.value))}
        />
        <span>cold</span>
      </label>
    </Sim>
  )
}
