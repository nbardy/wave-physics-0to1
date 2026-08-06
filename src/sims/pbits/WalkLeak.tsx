import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import {
  N_NODES,
  fit,
  freshParams,
  targetStationary,
  type KernelParams,
} from './walkCompile'
import { drawSplitMeter, drawVisitGlow, readSplitMeter, type SplitMeterData } from './part2lib'

// PLAN F7/F8 — the leak, on the instrument built to see it. The 5-node
// sticky walk is compiled as one thermodynamic kernel (nh = 3 hidden spins,
// ring-tied capacity so the contexts genuinely compete) and the kernel's own
// chain is propagated EXACTLY for T = 30 steps. The big pane shows where the
// trajectory actually lives: target law as ghost outlines, compiled chain as
// meter bars, and the mass that leaked off the 5-node graph as its own ferro
// bucket — the "conservation leakage" the papers name. The visitation glow
// (warm wash + axis ticks) shows the q the fit is currently weighting by;
// the toggle refits from scratch under uniform q vs the walk's own
// stationary law, and the split-meter reads both regimes.
//
// The fit trains live (same FD descent as check-walk's oracle runs — exact
// loss, no sampling) so the leak is watched forming, not asserted.

export const LEAK_NH = 3
export const LEAK_ITERS = 220
export const LEAK_LR = 0.35
export const LEAK_T = 30
const ITERS_PER_SEC = 40

export type LeakQ = 'uniform' | 'visited'

export interface LeakShared {
  q: LeakQ
}

export interface LeakProbe {
  iters: number
  kl: number
  tv: number
  offGraph: number
}

/** The big occupancy pane's rectangle — exported so the check script can
 *  region-scope its ink sampling to the sticky node's column. */
export function leakMainRect(w: number, h: number): Rect {
  return { x: 18, y: 46, w: w * 0.5, h: h - 112 }
}

/** x-range of bucket column `i` (0..5, 5 = off-graph) inside the main pane. */
export function leakColumnX(r: Rect, i: number): { x0: number; x1: number } {
  const bw = r.w / (N_NODES + 1)
  return { x0: r.x + i * bw, x1: r.x + (i + 1) * bw }
}

const qOf = (mode: LeakQ): Float64Array =>
  mode === 'uniform' ? new Float64Array(N_NODES).fill(1 / N_NODES) : targetStationary()

export function createWalkLeak(shared: { current: LeakShared }, probe?: LeakProbe): Stepper {
  let mode = shared.current.q
  let p: KernelParams = freshParams(LEAK_NH, true)
  let q = qOf(mode)
  let iterN = 0
  let acc = 0
  let data: SplitMeterData = readSplitMeter(p, q, LEAK_T)

  const refresh = () => {
    data = readSplitMeter(p, q, LEAK_T)
    if (probe) {
      probe.iters = iterN
      probe.kl = data.klWeighted
      probe.tv = data.tv
      probe.offGraph = data.offGraph
    }
  }
  refresh()

  return {
    step(dt) {
      if (shared.current.q !== mode) {
        mode = shared.current.q
        p = freshParams(LEAK_NH, true)
        q = qOf(mode)
        iterN = 0
        acc = 0
        refresh()
      }
      if (iterN >= LEAK_ITERS) return
      acc += dt * ITERS_PER_SEC
      acc = Math.min(acc, 4) // cap the debt — an FD iteration is ~6 ms
      let dirty = false
      while (acc >= 1 && iterN < LEAK_ITERS) {
        acc -= 1
        fit(p, q, 1, LEAK_LR)
        iterN++
        dirty = true
      }
      if (dirty && (iterN % 5 === 0 || iterN === LEAK_ITERS)) refresh()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')

      // the big pane: where the trajectory lives after T steps
      const mr = leakMainRect(w, h)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText(`occupancy after T=${LEAK_T} steps`, mr.x, mr.y - 8)
      paneFrame(ctx, mr)
      drawVisitGlow(ctx, { x: mr.x, y: mr.y, w: (mr.w / (N_NODES + 1)) * N_NODES, h: mr.h }, data.q)
      const bw = mr.w / (N_NODES + 1)
      let peak = 0.35
      for (let i = 0; i < N_NODES; i++) peak = Math.max(peak, data.trajTarget[i], data.trajModel[i])
      peak = Math.max(peak, data.offGraph)
      for (let i = 0; i < N_NODES; i++) {
        const x = mr.x + i * bw
        const gh = (data.trajTarget[i] / peak) * (mr.h - 14)
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.6
        ctx.strokeRect(x + bw * 0.14, mr.y + mr.h - gh, bw * 0.72, gh)
        const mh = (data.trajModel[i] / peak) * (mr.h - 14)
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.55
        ctx.fillRect(x + bw * 0.26, mr.y + mr.h - mh, bw * 0.48, mh)
        ctx.globalAlpha = 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(`${i}`, x + bw * 0.44, mr.y + mr.h + 14)
      }
      const ox = mr.x + N_NODES * bw
      const oh = (data.offGraph / peak) * (mr.h - 14)
      ctx.fillStyle = PALETTE.ferro
      ctx.globalAlpha = 0.7
      ctx.fillRect(ox + bw * 0.26, mr.y + mr.h - oh, bw * 0.48, Math.max(oh, 2))
      ctx.globalAlpha = 1
      ctx.fillStyle = PALETTE.ferro
      ctx.fillText('off-graph', ox - 4, mr.y + mr.h + 14)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.ferro
      ctx.fillText(`leaked mass: ${fmt(data.offGraph, 3)}`, mr.x, mr.y + mr.h + 32)

      // the instrument: the split-meter reads the same kernel
      const sr: Rect = { x: mr.x + mr.w + 24, y: mr.y - 14, w: w - mr.w - 60, h: mr.h + 34 }
      drawSplitMeter(ctx, sr, data)

      // training status
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        `${iterN}/${LEAK_ITERS} gradient steps — fit weighted by ${mode === 'uniform' ? 'uniform q' : "the walk's own visitation q"}`,
        mr.x,
        h - 8,
      )
    },
  }
}

export function WalkLeak() {
  const [q, setQ] = useState<LeakQ>('uniform')
  const shared = useRef<LeakShared>({ q })
  shared.current.q = q

  return (
    <Sim height={320} create={() => createWalkLeak(shared)}>
      {(['uniform', 'visited'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setQ(m)}
          style={q === m ? { fontWeight: 700 } : undefined}
        >
          {m === 'uniform' ? 'uniform q' : 'target-visited q'}
        </button>
      ))}
    </Sim>
  )
}
