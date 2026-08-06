import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import {
  N_NODES,
  fit,
  fitReinforce,
  freshParams,
  targetStationary,
  trajectoryReport,
  type KernelParams,
} from './walkCompile'
import { drawSplitMeter, readSplitMeter, type SplitMeterData } from './part2lib'

// PLAN F9 — the papers' own three-stage ladder, at our scale with our
// numbers: fit under uniform q, refit under the walk's visitation
// (context matching), then REINFORCE post-training on the trajectory itself.
// Trajectory TV at T=30 per stage, as descending bars. The papers' walk demo
// steps 5.64 → 0.30 → 0.08 — that SHAPE is the reproduction target; the
// numbers printed here are measured live from this model (2026-08-06 oracle
// run: 0.662 → 0.491 → 0.144; check-walk-figs.ts guards the ordering, not
// the digits).
//
// Every stage trains live and exactly (FD descent on enumerated KL, then the
// exact REINFORCE gradient — see walkCompile.ts). The split-meter rides
// along and shows the ladder's honest fine print: stage 3 buys its
// trajectory drop by WORSENING per-step KL — the two panes move in opposite
// directions, which is exactly why the instrument has two panes.

export const LADDER_NH = 3
export const LADDER_FD_ITERS = 220
export const LADDER_FD_LR = 0.35
export const LADDER_RF_ITERS = 800
export const LADDER_RF_LR = 0.05
export const LADDER_T = 30
export const LADDER_STAGES = ['uniform q', 'context-matched', '+REINFORCE'] as const

const FD_PER_SEC = 44
const RF_PER_SEC = 200

export interface LadderProbe {
  stage: number
  done: boolean
  /** trajectory TV recorded as each stage completed */
  tvs: number[]
  /** per-step weighted KL recorded as each stage completed */
  kls: number[]
}

/** The bar pane — exported so the check script can scope per-bar ink. */
export function ladderBarsRect(w: number, h: number): Rect {
  return { x: 18, y: 46, w: w * 0.44, h: h - 104 }
}

export function ladderBarX(r: Rect, i: number): { x0: number; x1: number } {
  const bw = r.w / LADDER_STAGES.length
  return { x0: r.x + i * bw, x1: r.x + (i + 1) * bw }
}

const TV_AXIS = 0.8 // trajectory TV axis ceiling — stage 1 lands ~0.66

export function createWalkLadder(probe?: LadderProbe): Stepper {
  const qUniform = new Float64Array(N_NODES).fill(1 / N_NODES)
  const qTarget = targetStationary()
  let stage = 0
  let iterN = 0
  let acc = 0
  let p: KernelParams = freshParams(LADDER_NH, true)
  const tvs: number[] = []
  const kls: number[] = []
  let liveTV = trajectoryReport(p, LADDER_T).tv
  let data: SplitMeterData = readSplitMeter(p, qUniform, LADDER_T)

  const stageQ = () => (stage === 0 ? qUniform : qTarget)
  const stageIters = () => (stage === 2 ? LADDER_RF_ITERS : LADDER_FD_ITERS)
  const record = () => {
    if (probe) {
      probe.stage = stage
      probe.done = stage >= LADDER_STAGES.length
      probe.tvs = tvs.slice()
      probe.kls = kls.slice()
    }
  }
  record()

  return {
    step(dt) {
      if (stage >= LADDER_STAGES.length) return
      acc += dt * (stage === 2 ? RF_PER_SEC : FD_PER_SEC)
      acc = Math.min(acc, 8)
      let dirty = false
      while (acc >= 1 && stage < LADDER_STAGES.length) {
        acc -= 1
        if (stage === 2) fitReinforce(p, LADDER_T, 1, LADDER_RF_LR)
        else fit(p, stageQ(), 1, LADDER_FD_LR)
        iterN++
        dirty = true
        if (iterN >= stageIters()) {
          data = readSplitMeter(p, stageQ(), LADDER_T)
          tvs.push(data.tv)
          kls.push(data.klWeighted)
          liveTV = data.tv
          stage++
          iterN = 0
          // stage 2 (context-matched) restarts from fresh params; stage 3
          // (REINFORCE) post-trains the stage-2 kernel IN PLACE — that is
          // the papers' pipeline and the whole point of "post-training".
          if (stage === 1) p = freshParams(LADDER_NH, true)
          record()
        }
      }
      if (dirty && stage < LADDER_STAGES.length && iterN % 10 === 0) {
        data = readSplitMeter(p, stageQ(), LADDER_T)
        liveTV = data.tv
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')

      const br = ladderBarsRect(w, h)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText(`trajectory TV at T=${LADDER_T}, per training stage`, br.x, br.y - 8)
      paneFrame(ctx, br)
      for (let i = 0; i < LADDER_STAGES.length; i++) {
        const { x0, x1 } = ladderBarX(br, i)
        const bw = x1 - x0
        const isDone = i < tvs.length
        const isLive = i === stage
        const tv = isDone ? tvs[i] : isLive ? liveTV : 0
        if (isDone || isLive) {
          const bh = Math.min(1, tv / TV_AXIS) * (br.h - 6)
          ctx.fillStyle = PALETTE.meter
          ctx.globalAlpha = isDone ? 0.75 : 0.3
          ctx.fillRect(x0 + bw * 0.2, br.y + br.h - bh, bw * 0.6, bh)
          ctx.globalAlpha = 1
          ctx.font = FONT_METER
          ctx.fillStyle = PALETTE.meter
          ctx.fillText(fmt(tv, 3), x0 + bw * 0.2, br.y + br.h - bh - 6)
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = isLive ? '#1a1f2b' : 'rgba(85,96,111,0.9)'
        ctx.fillText(LADDER_STAGES[i], x0 + 4, br.y + br.h + 14)
      }

      const sr: Rect = { x: br.x + br.w + 26, y: br.y - 14, w: w - br.w - 62, h: br.h + 34 }
      drawSplitMeter(ctx, sr, data)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      const status =
        stage >= LADDER_STAGES.length
          ? 'all three stages trained — exact fits, no sampling'
          : `stage ${stage + 1}/3 (${LADDER_STAGES[stage]}): ${iterN}/${stageIters()} ${stage === 2 ? 'REINFORCE' : 'gradient'} steps`
      ctx.fillText(status, br.x, h - 8)
    },
  }
}

export function WalkLadder() {
  const probe = useRef<LadderProbe>({ stage: 0, done: false, tvs: [], kls: [] })
  return <Sim height={320} create={() => createWalkLadder(probe.current)} />
}
