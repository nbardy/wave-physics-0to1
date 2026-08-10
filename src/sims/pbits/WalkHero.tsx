import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, tvDistance, u01 } from './lib'
import { z1Graph } from './z1'
import {
  N_NODES,
  bucketOf,
  compiledKernel,
  fit,
  fitReinforce,
  freshParams,
  oneHotConfig,
  targetKernel,
  targetStationary,
  worstStepTV,
  type KernelParams,
  type TrajectoryReport,
  trajectoryReport,
} from './walkCompile'
import { LADDER_FD_ITERS, LADDER_FD_LR, LADDER_NH, LADDER_RF_ITERS, LADDER_RF_LR } from './WalkLadder'
import { drawSplitMeter, readSplitMeter, type SplitMeterData } from './part2lib'

// Part 2, PLAN F1 (and F17, the return) — the hero. The same program twice:
// left, the 5-node sticky walk run as written, a token hopping by the rule's
// own probabilities; right, the walk compiled onto the fabric — the kernel
// walkCompile fits under uniform q (nh = 3, untied, the check-walk oracle
// settings), sampled live from the SAME context the left token is in, with a
// small Z1 patch behind it as staging. Both panes fill a one-step histogram
// from those draws, and the histograms converge to match: step for step, the
// fabric speaks the program's language.
//
// Then the quiet readout at the bottom: the SAME kernel, fed its own output
// as the next input for T = 30 steps — exact chain propagation, no sampling
// — puts measurable mass off the graph entirely and drifts from the walk's
// law. The number is printed and NOT explained; §4 exists to explain it.
//
// With `revealed` (the F17 mount: <WalkHero revealed />) the figure does not
// merely re-show the opening kernel — it continues live through the ladder's
// remaining rungs with WalkLadder's EXACT calls: after the opening's untied
// uniform compile (kept identical, then discarded exactly as the ladder
// discards its own rung 1), rung 2 restarts from fresh TIED params and fits
// under the walk's visitation, rung 3 REINFORCE-post-trains that kernel in
// place. The strip names each rung as it runs, then becomes the split-meter
// reading the FINAL kernel. The measured ladder numbers (trajectory TV
// 0.491 → 0.144 while q-weighted per-step KL 0.414 → 1.917, PLAN 2026-08-06)
// belong to this tied path.
//
// MEASURED SURPRISE (2026-08-11, guarded by check-part2b): the live one-step
// histograms do NOT drift apart after healing — the healed kernel's sampled
// marginal sits CLOSER to the left pane than the opening's did (exact
// visitation-weighted marginal TV 0.265 → 0.140) even though every
// individual conditional but the sticky node's is far wronger (worst step TV
// 0.329 → 0.697, per-context KL up to 5.2 on the coldest context).
// REINFORCE warps conditionals so their errors CANCEL in aggregate — the
// aggregated histogram is exactly the kind of evidence that cannot see the
// warp, which sharpens the opening's lesson rather than reversing it. Only
// the split-meter's per-step pane (KL 1.917 printed) shows the price.

export const HERO_NH = 3
export const HERO_ITERS = 220
export const HERO_LR = 0.35
export const HERO_T = 30
const COMPILE_ITERS_PER_SEC = 40
const REINFORCE_ITERS_PER_SEC = 200 // WalkLadder's RF pacing
const HOPS_PER_SEC = 6
const SEED = 61

/** The live phase as a sum type — no half-initialized trajectory fields.
 *  Unrevealed runs compiling → live; revealed runs the full ladder,
 *  compiling → refit → reinforce → live. */
type HeroPhase =
  | { kind: 'compiling' }
  | { kind: 'refit' }
  | { kind: 'reinforce' }
  | { kind: 'live'; traj: TrajectoryReport; split: SplitMeterData; worstStep: number }

type TrainKind = Exclude<HeroPhase['kind'], 'live'>

export interface HeroProbe {
  iters: number
  hops: number
  /** TV between the two live one-step histograms (6 buckets, off included) */
  histTV: number
  /** the quiet readout: exact chain occupancy error at T = HERO_T */
  trajTV: number
  offGraph: number
  worstStep: number
}

const uniformQ = new Float64Array(N_NODES).fill(1 / N_NODES)

/** Counter RNG draw from a discrete law. */
function sampleFrom(p: ArrayLike<number>, u: number): number {
  let acc = 0
  for (let i = 0; i < p.length; i++) {
    acc += p[i]
    if (u < acc) return i
  }
  return p.length - 1
}

export function heroStripRect(w: number, h: number): Rect {
  return { x: 16, y: 216, w: w - 60, h: h - 226 }
}

export function createWalkHero(revealed: boolean, probe?: HeroProbe): Stepper {
  // counter RNG lanes: (t, 0) the left hop, (t, 1) the right one-step draw
  const u = (t: number, salt: number) => u01(SEED, t, salt, 1)

  let p: KernelParams = freshParams(HERO_NH)
  let iterN = 0 // progress within the current training rung
  let itersTotal = 0 // cumulative — what the probe reports
  let accCompile = 0
  let accHop = 0
  let t = 0
  let hops = 0
  let phase: HeroPhase = { kind: 'compiling' }
  let leftNode = 0
  let rightCfg = oneHotConfig(0)
  let leftCounts = new Float64Array(N_NODES + 1) // 6 buckets to compare 1:1
  let rightCounts = new Float64Array(N_NODES + 1)
  const patch = z1Graph(8, 8)
  const qTarget = targetStationary()

  const goLive = (q: Float64Array) => {
    phase = {
      kind: 'live',
      traj: trajectoryReport(p, HERO_T),
      split: readSplitMeter(p, q, HERO_T),
      worstStep: worstStepTV(p),
    }
    leftCounts = new Float64Array(N_NODES + 1)
    rightCounts = new Float64Array(N_NODES + 1)
    hops = 0
  }

  // One handler per training rung: iteration budget, pacing, the exact
  // walkCompile call (rungs 2–3 mirror WalkLadder.tsx call-for-call), and
  // where the rung hands off when its budget is spent.
  const RUNGS: Record<TrainKind, { rate: number; cap: number; iters: number; trainOne: () => void; done: () => void }> = {
    compiling: {
      rate: COMPILE_ITERS_PER_SEC,
      cap: 4,
      iters: HERO_ITERS,
      trainOne: () => fit(p, uniformQ, 1, HERO_LR),
      done: () => {
        if (!revealed) {
          goLive(uniformQ)
          return
        }
        // the ladder's own move: rung 2 restarts from fresh tied params
        p = freshParams(LADDER_NH, true)
        phase = { kind: 'refit' }
      },
    },
    refit: {
      rate: COMPILE_ITERS_PER_SEC,
      cap: 4,
      iters: LADDER_FD_ITERS,
      trainOne: () => fit(p, qTarget, 1, LADDER_FD_LR),
      done: () => {
        phase = { kind: 'reinforce' }
      },
    },
    reinforce: {
      rate: REINFORCE_ITERS_PER_SEC,
      cap: 8,
      iters: LADDER_RF_ITERS,
      trainOne: () => fitReinforce(p, HERO_T, 1, LADDER_RF_LR),
      done: () => goLive(qTarget),
    },
  }

  const publish = () => {
    if (!probe) return
    probe.iters = itersTotal
    probe.hops = hops
    const lp = normalized(leftCounts)
    const rp = normalized(rightCounts)
    probe.histTV = tvDistance(lp, rp)
    if (phase.kind === 'live') {
      probe.trajTV = phase.traj.tv
      probe.offGraph = phase.traj.offGraph
      probe.worstStep = phase.worstStep
    }
  }

  const oneHop = () => {
    t++
    hops++
    const next = sampleFrom(targetKernel(leftNode), u(t, 0))
    if (phase.kind === 'live') {
      const row = compiledKernel(p, oneHotConfig(leftNode))
      rightCfg = sampleFrom(row, u(t, 1))
      leftCounts[next]++
      rightCounts[bucketOf(rightCfg)]++
    }
    leftNode = next
  }

  return {
    step(dt) {
      if (phase.kind !== 'live') {
        const rung = RUNGS[phase.kind]
        accCompile = Math.min(accCompile + dt * rung.rate, rung.cap)
        while (accCompile >= 1 && iterN < rung.iters) {
          accCompile -= 1
          rung.trainOne()
          iterN++
          itersTotal++
        }
        if (iterN >= rung.iters) {
          iterN = 0
          accCompile = 0
          rung.done()
        }
      }
      accHop = Math.min(accHop + dt * HOPS_PER_SEC, 24)
      while (accHop >= 1) {
        accHop -= 1
        oneHop()
      }
      publish()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const paneW = w * 0.44
      const lp: Rect = { x: 16, y: 30, w: paneW - 16, h: 150 }
      const rp: Rect = { x: w * 0.5, y: 30, w: paneW - 16, h: 150 }
      ctx.textAlign = 'left'
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('the walk, run as written', lp.x, lp.y - 8)
      ctx.fillText('the walk, compiled onto the fabric', rp.x, rp.y - 8)
      paneFrame(ctx, lp)
      paneFrame(ctx, rp)

      // fabric staging behind the right ring: a faint exact-Z1 patch
      {
        const cell = Math.min(rp.w / patch.w, (rp.h - 60) / patch.h) * 0.9
        const ox = rp.x + rp.w - cell * patch.w - 6
        const oy = rp.y + 6
        const at = (i: number): [number, number] => [
          ox + (i % patch.w) * cell + cell / 2,
          oy + Math.floor(i / patch.w) * cell + cell / 2,
        ]
        const center = 4 * patch.w + 4
        ctx.strokeStyle = PALETTE.ferro
        ctx.globalAlpha = 0.12
        ctx.lineWidth = 1
        const [cxp, cyp] = at(center)
        for (const j of patch.nbr[center]) {
          const [jx, jy] = at(j)
          if (Math.abs(jx - cxp) > cell * 5 || Math.abs(jy - cyp) > cell * 5) continue
          ctx.beginPath()
          ctx.moveTo(cxp, cyp)
          ctx.lineTo(jx, jy)
          ctx.stroke()
        }
        ctx.globalAlpha = 0.1
        for (let i = 0; i < patch.n; i++) {
          const [x, y] = at(i)
          ctx.beginPath()
          ctx.arc(x, y, cell * 0.16, 0, Math.PI * 2)
          ctx.fillStyle = patch.colors[i] ? PALETTE.sDn : PALETTE.sUp
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // the two rings and their tokens
      const drawRing = (r: Rect, tokenNode: number, offToken: boolean, cfg: number) => {
        const cx = r.x + r.w * 0.38
        const cy = r.y + 56
        const rad = 38
        const pos = Array.from({ length: N_NODES }, (_, k) => {
          const ang = -Math.PI / 2 + (k * 2 * Math.PI) / N_NODES
          return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)] as [number, number]
        })
        ctx.strokeStyle = 'rgba(120,140,170,0.4)'
        ctx.lineWidth = 1
        for (let k = 0; k < N_NODES; k++) {
          const [x0, y0] = pos[k]
          const [x1, y1] = pos[(k + 1) % N_NODES]
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
        }
        for (let k = 0; k < N_NODES; k++) {
          const [x, y] = pos[k]
          ctx.beginPath()
          ctx.arc(x, y, 7, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(120,140,170,0.8)'
          ctx.lineWidth = 1.4
          ctx.stroke()
          ctx.font = FONT_LABEL
          ctx.fillStyle = 'rgba(85,96,111,0.9)'
          ctx.fillText(`${k}`, x + 10, y + 4)
        }
        if (offToken) {
          // the compiled draw left the graph: show the raw 5-bit pattern
          const sx = cx + rad + 18
          ctx.font = FONT_LABEL
          ctx.fillStyle = PALETTE.ferro
          ctx.fillText('off', sx, cy - 12)
          for (let k = 0; k < N_NODES; k++) {
            ctx.beginPath()
            ctx.arc(sx + 4 + k * 9, cy, 3, 0, Math.PI * 2)
            ctx.fillStyle = (cfg >> k) & 1 ? PALETTE.sUp : PALETTE.sDn
            ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(sx + 4 + 2 * 9, cy, 12, 0, Math.PI * 2)
          ctx.strokeStyle = PALETTE.ferro
          ctx.lineWidth = 1.6
          ctx.stroke()
        } else {
          const [x, y] = pos[tokenNode]
          ctx.beginPath()
          ctx.arc(x, y, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = PALETTE.sUp
          ctx.fill()
        }
      }
      drawRing(lp, leftNode, false, 0)
      const rNode = bucketOf(rightCfg)
      drawRing(rp, rNode < N_NODES ? rNode : 0, rNode === N_NODES, rightCfg)

      // one-step histograms: right pane carries the left's bars as ghosts
      const drawHist = (r: Rect, counts: Float64Array, ghost: Float64Array | null, six: boolean) => {
        const hy = r.y + r.h - 44
        const hh = 38
        const nb = six ? N_NODES + 1 : N_NODES
        const bw = (r.w - 12) / nb
        const pNow = normalized(counts)
        const pGhost = ghost ? normalized(ghost) : null
        let peak = 0.3
        for (let i = 0; i < nb; i++) peak = Math.max(peak, pNow[i], pGhost ? pGhost[i] : 0)
        for (let i = 0; i < nb; i++) {
          const x = r.x + 6 + i * bw
          if (pGhost) {
            const gh = (pGhost[i] / peak) * hh
            ctx.strokeStyle = PALETTE.ghost
            ctx.lineWidth = 1.4
            ctx.strokeRect(x + bw * 0.12, hy + hh - gh, bw * 0.76, gh)
          }
          const bh = (pNow[i] / peak) * hh
          ctx.fillStyle = six && i === N_NODES ? PALETTE.ferro : PALETTE.meter
          ctx.globalAlpha = 0.55
          ctx.fillRect(x + bw * 0.24, hy + hh - bh, bw * 0.52, bh)
          ctx.globalAlpha = 1
        }
        if (six) {
          ctx.font = FONT_LABEL
          ctx.fillStyle = PALETTE.ferro
          ctx.fillText('off', r.x + 6 + N_NODES * bw + bw * 0.2, hy - 2)
        }
      }
      drawHist(lp, leftCounts, null, false)
      drawHist(rp, rightCounts, leftCounts, true)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`one-step draws: ${Math.round(hops).toLocaleString()}`, lp.x + 6, lp.y + lp.h + 13)
      ctx.fillText('same draws — ghost = left pane', rp.x + 6, rp.y + rp.h + 13)

      // the bottom strip: quiet trajectory readout, or the revealed meter
      const strip = heroStripRect(w, h)
      if (phase.kind !== 'live') {
        // Revealed names the rung as it runs; unrevealed keeps the opening's
        // single quiet compile line, verbatim.
        const LABELS: Record<TrainKind, string> = {
          compiling: revealed
            ? `rung 1/3 — the opening's kernel, uniform q: ${iterN}/${HERO_ITERS} gradient steps`
            : `compiling the kernel onto the fabric: ${iterN}/${HERO_ITERS} gradient steps`,
          refit: `rung 2/3 — refit under the walk's own visitation: ${iterN}/${LADDER_FD_ITERS} gradient steps`,
          reinforce: `rung 3/3 — REINFORCE post-training on the trajectory itself: ${iterN}/${LADDER_RF_ITERS} steps`,
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(LABELS[phase.kind], strip.x, strip.y + 24)
        return
      }
      if (revealed) {
        drawSplitMeter(ctx, strip, phase.split)
        return
      }
      // quiet: the same kernel chained T steps, occupancy vs the walk's law
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`the same kernel, chained T = ${HERO_T} steps (exact):`, strip.x, strip.y + 8)
      const mini: Rect = { x: strip.x + 8, y: strip.y + 18, w: 180, h: strip.h - 36 }
      const nb = N_NODES + 1
      const bw = mini.w / nb
      const traj = phase.traj
      let peak = 0.3
      for (let i = 0; i < N_NODES; i++) peak = Math.max(peak, traj.onGraph[i], phase.split.trajTarget[i])
      peak = Math.max(peak, traj.offGraph)
      for (let i = 0; i < N_NODES; i++) {
        const x = mini.x + i * bw
        const gh = (phase.split.trajTarget[i] / peak) * mini.h
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.2
        ctx.strokeRect(x + bw * 0.14, mini.y + mini.h - gh, bw * 0.72, gh)
        const mh = (traj.onGraph[i] / peak) * mini.h
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.55
        ctx.fillRect(x + bw * 0.26, mini.y + mini.h - mh, bw * 0.48, mh)
        ctx.globalAlpha = 1
      }
      const ox = mini.x + N_NODES * bw
      const oh = (traj.offGraph / peak) * mini.h
      ctx.fillStyle = PALETTE.ferro
      ctx.globalAlpha = 0.7
      ctx.fillRect(ox + bw * 0.26, mini.y + mini.h - oh, bw * 0.48, Math.max(oh, 2))
      ctx.globalAlpha = 1
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`off-graph mass: ${fmt(traj.offGraph, 3)}`, mini.x + mini.w + 22, strip.y + 34)
      ctx.fillText(`distance from the walk's law: ${fmt(traj.tv, 3)}`, mini.x + mini.w + 22, strip.y + 52)
    },
  }
}

function normalized(counts: Float64Array): Float64Array {
  let total = 0
  for (let i = 0; i < counts.length; i++) total += counts[i]
  const p = new Float64Array(counts.length)
  if (total > 0) for (let i = 0; i < counts.length; i++) p[i] = counts[i] / total
  return p
}

export function WalkHero({ revealed = false }: { revealed?: boolean }) {
  const revealedRef = useRef(revealed)
  revealedRef.current = revealed
  return <Sim height={340} create={() => createWalkHero(revealedRef.current)} />
}
