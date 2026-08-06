import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import {
  N_NODES,
  fit,
  floorCurve,
  freshParams,
  type KernelParams,
} from './walkCompile'
import { drawSplitMeter, readSplitMeter, type SplitMeterData } from './part2lib'

// PLAN §4b / F9b — the floor. Per-step error contracts through a mixing
// chain, so trajectory error does not accumulate forever: it saturates at a
// depth-independent floor bounded by δ̃ ≤ ε̄/(1−ρ). Both numbers are
// MEASURED from the compiled chain itself: ε̄ = worst single-step TV over
// the five valid contexts (off-graph mass counted as error), and ρ = the
// second-largest-eigenvalue modulus of the compiled 32×32 transition matrix
// (power iteration on the sum-zero subspace — walkCompile.chainContraction;
// the Dobrushin coefficient is also computed there but is ~1 on garbage
// input configs the chain barely visits, so SLEM is the ρ this figure
// draws, and the check script audits that the resulting line really does
// sit above the measured curve).
//
// The capacity knob is the honest part: with two hidden spins the bound is
// informative (measured 2026-08-06: ε̄ 0.18, ρ 0.75, bound 0.72, curve
// flattening at 0.31); with none, per-step error is so large the bound
// passes 1 and goes VACUOUS — the curve still saturates, but the guarantee
// says nothing. The bound line is drawn only where it means something; when
// it leaves [0,1] the figure says so instead of drawing it.

export const FLOOR_ITERS = 220
export const FLOOR_LR = 0.35
export const FLOOR_DEPTH = 40
const ITERS_PER_SEC = 44

export type FloorCap = 'none' | 'two'
const NH_OF: Record<FloorCap, number> = { none: 0, two: 2 }

export interface FloorShared {
  cap: FloorCap
}

export interface FloorProbe {
  iters: number
  epsBar: number
  rho: number
  bound: number
  maxTV: number
  tail: number
}

export function floorPlotRect(w: number, h: number): Rect {
  return { x: 34, y: 46, w: w * 0.52, h: h - 104 }
}

export function createWalkFloor(shared: { current: FloorShared }, probe?: FloorProbe): Stepper {
  const qUniform = new Float64Array(N_NODES).fill(1 / N_NODES)
  let cap = shared.current.cap
  let p: KernelParams = freshParams(NH_OF[cap])
  let iterN = 0
  let acc = 0
  let fc = floorCurve(p, FLOOR_DEPTH)
  let data: SplitMeterData = readSplitMeter(p, qUniform, FLOOR_DEPTH)

  const refresh = () => {
    fc = floorCurve(p, FLOOR_DEPTH)
    data = readSplitMeter(p, qUniform, FLOOR_DEPTH)
    if (probe) {
      probe.iters = iterN
      probe.epsBar = fc.epsBar
      probe.rho = fc.rho
      probe.bound = fc.bound
      let maxTV = 0
      for (const tv of fc.tvByDepth) maxTV = Math.max(maxTV, tv)
      probe.maxTV = maxTV
      probe.tail = fc.tvByDepth[FLOOR_DEPTH - 1]
    }
  }
  refresh()

  return {
    step(dt) {
      if (shared.current.cap !== cap) {
        cap = shared.current.cap
        p = freshParams(NH_OF[cap])
        iterN = 0
        acc = 0
        refresh()
      }
      if (iterN >= FLOOR_ITERS) return
      acc += dt * ITERS_PER_SEC
      acc = Math.min(acc, 4)
      let dirty = false
      while (acc >= 1 && iterN < FLOOR_ITERS) {
        acc -= 1
        fit(p, qUniform, 1, FLOOR_LR)
        iterN++
        dirty = true
      }
      if (dirty && (iterN % 5 === 0 || iterN === FLOOR_ITERS)) refresh()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')

      const pr = floorPlotRect(w, h)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText('trajectory TV vs depth', pr.x, pr.y - 8)
      paneFrame(ctx, pr)
      const yOf = (tv: number) => pr.y + (1 - Math.min(tv, 1)) * pr.h
      const xOf = (t: number) => pr.x + ((t - 1) / (FLOOR_DEPTH - 1)) * pr.w

      // ε̄ — the per-step error level, as a ghost dash
      ctx.strokeStyle = PALETTE.ghost
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(pr.x, yOf(fc.epsBar))
      ctx.lineTo(pr.x + pr.w, yOf(fc.epsBar))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // plain ε and ASCII hyphen on canvas: the combining macron of ε̄ and
      // U+2212 render as tofu under @napi-rs/canvas's fallback font
      ctx.fillText(`worst per-step TV ε = ${fmt(fc.epsBar, 3)}`, pr.x + 6, yOf(fc.epsBar) - 5)

      // the bound δ̃ ≤ ε̄/(1−ρ) — the line the curve cannot cross
      if (fc.bound <= 1) {
        ctx.strokeStyle = PALETTE.cutoff
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pr.x, yOf(fc.bound))
        ctx.lineTo(pr.x + pr.w, yOf(fc.bound))
        ctx.stroke()
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.cutoff
        ctx.fillText(`floor bound ε/(1-ρ) = ${fmt(fc.bound, 3)}`, pr.x + 6, yOf(fc.bound) - 6)
      } else {
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.cutoff
        ctx.fillText(`bound ε/(1-ρ) = ${fmt(fc.bound, 2)} — past 1, vacuous here`, pr.x + 6, pr.y + 14)
      }

      // the measured curve
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let t = 1; t <= FLOOR_DEPTH; t++) {
        const x = xOf(t)
        const y = yOf(fc.tvByDepth[t - 1])
        if (t === 1) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      const tail = fc.tvByDepth[FLOOR_DEPTH - 1]
      ctx.fillText(fmt(tail, 3), pr.x + pr.w - 40, yOf(tail) - 8)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('1', pr.x - 10, pr.y + 10)
      ctx.fillText('0', pr.x - 10, pr.y + pr.h)
      ctx.fillText(`depth 1 … ${FLOOR_DEPTH}`, pr.x, pr.y + pr.h + 14)
      ctx.fillText(`ρ (SLEM, measured) = ${fmt(fc.rho, 3)}`, pr.x, pr.y + pr.h + 30)

      const sr: Rect = { x: pr.x + pr.w + 26, y: pr.y - 14, w: w - pr.w - 76, h: pr.h + 34 }
      drawSplitMeter(ctx, sr, data)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        `${iterN}/${FLOOR_ITERS} gradient steps — ${NH_OF[cap]} hidden spin${NH_OF[cap] === 1 ? '' : 's'}`,
        pr.x,
        h - 8,
      )
    },
  }
}

export function WalkFloor() {
  const [cap, setCap] = useState<FloorCap>('two')
  const shared = useRef<FloorShared>({ cap })
  shared.current.cap = cap

  return (
    <Sim height={320} create={() => createWalkFloor(shared)}>
      {(['two', 'none'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCap(c)}
          style={cap === c ? { fontWeight: 700 } : undefined}
        >
          {c === 'two' ? 'two hidden spins' : 'no hidden spins'}
        </button>
      ))}
    </Sim>
  )
}
