import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import {
  buildChromatic,
  buildModel,
  countsToProbs,
  drawLayerRail,
  drawMeter,
  drawSpin,
  edgeColor,
  enumerate,
  freshSpins,
  stateIndex,
  sweep,
  u01,
  type PbitModel,
} from './lib'

// PLAN F19 — the triangle, short. Three spins wired in a cycle of odd length:
// the reader tries to two-color it and every full coloring leaves a same-color
// wire. One auxiliary chain spin turns the triangle into a square — bipartite,
// schedulable — with the disagree-wire now acting through the chain. The chain
// strength knob degrades a measured quantity at BOTH ends: weak chains let the
// aux spin ignore its partner (the embedded law is the wrong law), strong
// chains freeze the pair (the sampler stops mixing and the evidence stalls).

const BETA = 0.8
const SWEEPS_PER_SEC = 300
export const TRI_MID_JC = 2.5

export function triangleTarget(): PbitModel {
  return buildModel(
    3,
    [0, 0, 0],
    [
      { i: 0, j: 1, J: 1 },
      { i: 1, j: 2, J: 1 },
      { i: 2, j: 0, J: -1 },
    ],
    BETA,
  )
}

/** The embedding: aux spin 3 chained to spin 2; the disagree-wire moves to (3,0). */
export function embeddedSquare(Jc: number): PbitModel {
  return buildModel(
    4,
    [0, 0, 0, 0],
    [
      { i: 0, j: 1, J: 1 },
      { i: 1, j: 2, J: 1 },
      { i: 2, j: 3, J: Jc },
      { i: 3, j: 0, J: -1 },
    ],
    BETA,
  )
}

export const SQUARE_COLORS = Uint8Array.from([0, 1, 0, 1])
const LOGICAL = [0, 1, 2]

/** Exact marginal of the embedded model over the three logical spins. */
export function embeddedMarginal(Jc: number): Float64Array {
  const p = enumerate(embeddedSquare(Jc))
  const out = new Float64Array(8)
  for (let idx = 0; idx < 16; idx++) out[idx & 7] += p[idx]
  return out
}

export interface TriShared {
  embedded: boolean
  Jc: number
  /** Coloring attempt: 0 uncolored, 1 red, 2 black (per logical node). */
  paint: number[]
}

export interface TriProbe {
  tv: number
  samples: number
}

const TRI_POS: ReadonlyArray<[number, number]> = [
  [0.16, 0.24],
  [0.36, 0.24],
  [0.26, 0.72],
]
const SQ_POS: ReadonlyArray<[number, number]> = [
  [0.14, 0.26],
  [0.38, 0.26],
  [0.38, 0.74],
  [0.14, 0.74],
]
export const TRI_R = 17

export function triNodeAt(shared: TriShared, ux: number, uy: number, w: number, h: number): number | null {
  const pos = shared.embedded ? SQ_POS : TRI_POS
  const n = shared.embedded ? 4 : 3
  for (let k = 0; k < n; k++) {
    if (Math.hypot((ux - pos[k][0]) * w, (uy - pos[k][1]) * h) < TRI_R + 8) return k
  }
  return null
}

const PAINT_INK = ['rgba(120,140,170,0.35)', '#dc2626', '#1a1f2b']

export function createTriangle(shared: { current: TriShared }, probe?: TriProbe, seed = 83): Stepper {
  const exactTarget = enumerate(triangleTarget())
  let m = embeddedSquare(shared.current.Jc)
  let chromatic = buildChromatic(m, SQUARE_COLORS, 2)
  let s = freshSpins(m, seed)
  let counts = new Float64Array(8)
  let lastJc = shared.current.Jc
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      const st = shared.current
      if (!st.embedded) return
      if (st.Jc !== lastJc) {
        lastJc = st.Jc
        m = embeddedSquare(st.Jc)
        chromatic = buildChromatic(m, SQUARE_COLORS, 2)
        s = freshSpins(m, seed)
        counts = new Float64Array(8) // new machine — fresh evidence
        sweepN = 0
      }
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        sweep(m, s, chromatic, (site, salt) => u01(seed, sweepN, site, salt))
        counts[stateIndex(s, LOGICAL)]++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const st = shared.current

      if (!st.embedded) {
        // ---- the coloring attempt ----
        const at = (k: number): [number, number] => [TRI_POS[k][0] * w, TRI_POS[k][1] * h]
        const edges: Array<[number, number, number]> = [
          [0, 1, 1],
          [1, 2, 1],
          [2, 0, -1],
        ]
        let conflicts = 0
        let colored = 0
        for (const p of st.paint) if (p !== 0) colored++
        for (const [i, j, J] of edges) {
          const [x0, y0] = at(i)
          const [x1, y1] = at(j)
          const clash = st.paint[i] !== 0 && st.paint[i] === st.paint[j]
          if (clash) conflicts++
          if (clash) {
            ctx.strokeStyle = PALETTE.ferro
            ctx.lineWidth = 7
            ctx.globalAlpha = 0.3
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
          ctx.strokeStyle = edgeColor(J)
          ctx.lineWidth = 1 + Math.abs(J) * 2.4
          ctx.globalAlpha = 0.7
          ctx.beginPath()
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
        for (let k = 0; k < 3; k++) {
          const [x, y] = at(k)
          ctx.beginPath()
          ctx.arc(x, y, TRI_R, 0, Math.PI * 2)
          ctx.fillStyle = PAINT_INK[st.paint[k]]
          ctx.fill()
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'left'
        ctx.fillText('tap a spin to paint it red / black / blank', 16, h - 28)
        ctx.font = FONT_METER
        ctx.fillStyle = conflicts > 0 ? PALETTE.ferro : '#1a1f2b'
        ctx.fillText(
          colored === 3
            ? `same-color wires: ${conflicts}`
            : `painted ${colored} of 3`,
          16,
          h - 10,
        )
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        // narrow: the full sentence ran off the 360px canvas (figure audit, 2026-08-11)
        if (w < 520) {
          ctx.fillText('no legal red/black schedule', w * 0.45, h * 0.5 - 8)
          ctx.fillText('exists for this shape', w * 0.45, h * 0.5 + 8)
        } else {
          ctx.fillText('no legal red/black schedule exists for this shape', w * 0.5, h * 0.5)
        }
        return
      }

      // ---- the embedded square, running ----
      const at = (k: number): [number, number] => [SQ_POS[k][0] * w, SQ_POS[k][1] * h]
      const edges: Array<[number, number, number]> = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, st.Jc],
        [3, 0, -1],
      ]
      for (const [i, j, J] of edges) {
        const [x0, y0] = at(i)
        const [x1, y1] = at(j)
        ctx.strokeStyle = edgeColor(J)
        ctx.lineWidth = 1 + Math.min(4, Math.abs(J)) * 1.6
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      for (let k = 0; k < 4; k++) {
        const [x, y] = at(k)
        drawSpin(ctx, x, y, k === 3 ? 11 : TRI_R, s[k])
        if (k === 3) {
          ctx.font = FONT_LABEL
          ctx.fillStyle = 'rgba(85,96,111,0.95)'
          ctx.textAlign = 'center'
          ctx.fillText('aux', x, y + 24)
        }
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.textAlign = 'left'
      ctx.fillText(`chain J = ${fmt(st.Jc, 1)}`, 16, h - 28)
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText('physical spins: 4 · logical spins: 3', 16, h - 10)

      // meter: sampled marginal over the three logical spins vs the true triangle
      const r: Rect = { x: w * 0.55, y: 36, w: w * 0.4, h: h - 96 }
      paneFrame(ctx, { x: r.x - 8, y: r.y - 10, w: r.w + 16, h: r.h + 24 })
      let total = 0
      for (let i = 0; i < counts.length; i++) total += counts[i]
      const tv = drawMeter(ctx, r, exactTarget, countsToProbs(counts), { samples: total })
      if (probe) {
        probe.tv = tv
        probe.samples = total
      }
    },
  }
}

export function Triangle() {
  const [embedded, setEmbedded] = useState(false)
  const [Jc, setJc] = useState(TRI_MID_JC)
  const shared = useRef<TriShared>({ embedded, Jc, paint: [0, 0, 0] })
  shared.current.embedded = embedded
  shared.current.Jc = Jc

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = shared.current
    if (st.embedded) return
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const k = triNodeAt(
      st,
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
      rect.width,
      rect.height,
    )
    if (k !== null && k < 3) st.paint[k] = (st.paint[k] + 1) % 3
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer}>
      <Sim
        height={290}
        create={() => {
          shared.current.paint = [0, 0, 0]
          return createTriangle(shared)
        }}
      >
        <button type="button" onClick={() => setEmbedded((v) => !v)}>
          {embedded ? 'back to the triangle' : 'add the chain spin'}
        </button>
        <label className="sim-slider">
          <span>weak chain</span>
          <input
            type="range"
            min={0.3}
            max={8}
            step={0.1}
            value={Jc}
            onChange={(e) => setJc(Number(e.target.value))}
          />
          <span>strong</span>
        </label>
      </Sim>
    </div>
  )
}
