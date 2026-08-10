import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { Z1_RULES } from './z1'

// Part 2, PLAN F3 — the parity theorem as a counterfactual. Every real Z1
// offset rule steps a+b ODD, so every wire joins a red cell to a black cell
// and the checkerboard two-coloring — the chip's whole parallel schedule —
// survives all sixteen knight-moves. The toggle swaps rule (2,1) for a
// hypothetical EVEN rule (2,2): its wires join like-colored cells, every one
// of them glows, and the count is computed from the edge list, not asserted.
//
// Same truncated-patch choice as Neighborhood (F2): the real die loses wires
// at its borders (Thermalizers §II B 1), so the edges here are generated
// locally on a truncated grid rather than imported from z1Graph's torus
// idealization. Parity is a property of the offsets, not the boundary — the
// theorem reads the same either way, but the patch drawn is the honest one.

const GW = 10
const GH = 10

export type RuleSet = ReadonlyArray<readonly [number, number]>

export const REAL_RULES: RuleSet = Z1_RULES
/** The counterfactual: (2,1) swapped for (2,2) — the one even-parity rule. */
export const EVEN_RULES: RuleSet = [
  [1, 0],
  [2, 2],
  [2, 3],
  [4, 1],
]

export interface ParityReport {
  /** deduplicated undirected in-grid edges, i < j */
  edges: Array<[number, number]>
  /** the subset whose two ends share a checkerboard color */
  illegal: Array<[number, number]>
}

/** All wires of a truncated gw×gh patch under `rules`, and the ones that
 *  break the checkerboard. Counts are read off these lists — never typed. */
export function parityEdges(gw: number, gh: number, rules: RuleSet): ParityReport {
  const seen = new Set<number>()
  const edges: Array<[number, number]> = []
  const illegal: Array<[number, number]> = []
  const n = gw * gh
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      for (const [a, b] of rules) {
        for (const [dx, dy] of [
          [a, b],
          [-b, a],
          [-a, -b],
          [b, -a],
        ]) {
          const tx = x + dx
          const ty = y + dy
          if (tx < 0 || tx >= gw || ty < 0 || ty >= gh) continue
          const i = y * gw + x
          const j = ty * gw + tx
          if (i === j) continue
          const key = i < j ? i * n + j : j * n + i
          if (seen.has(key)) continue
          seen.add(key)
          const e: [number, number] = i < j ? [i, j] : [j, i]
          edges.push(e)
          if (((x + y) & 1) === ((tx + ty) & 1)) illegal.push(e)
        }
      }
    }
  }
  return { edges, illegal }
}

export interface ParityShared {
  even: boolean
}

export interface ParityProbe {
  illegal: number
  total: number
}

export function createParityToggle(
  shared: { current: ParityShared },
  probe?: ParityProbe,
): Stepper {
  const real = parityEdges(GW, GH, REAL_RULES)
  const even = parityEdges(GW, GH, EVEN_RULES)

  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const rep = shared.current.even ? even : real
      if (probe) {
        probe.illegal = rep.illegal.length
        probe.total = rep.edges.length
      }

      const pane: Rect = { x: 16, y: 30, w: Math.min(w * 0.55, h - 66), h: h - 66 }
      const cell = Math.min(pane.w / GW, pane.h / GH)
      pane.w = cell * GW
      pane.h = cell * GH
      paneFrame(ctx, pane)
      const px = (i: number): [number, number] => [
        pane.x + (i % GW) * cell + cell / 2,
        pane.y + Math.floor(i / GW) * cell + cell / 2,
      ]

      // wires first: quiet gray, then the same-color offenders glowing on top
      ctx.strokeStyle = 'rgba(120,140,170,0.22)'
      ctx.lineWidth = 1
      for (const [i, j] of rep.edges) {
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 2.2
      ctx.globalAlpha = 0.85
      for (const [i, j] of rep.illegal) {
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // the checkerboard itself
      for (let i = 0; i < GW * GH; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.2, 0, Math.PI * 2)
        ctx.fillStyle = ((i % GW) + Math.floor(i / GW)) & 1 ? PALETTE.sDn : PALETTE.sUp
        ctx.globalAlpha = 0.7
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // the count — read off the edge list
      const tx = pane.x + pane.w + (w < 520 ? 12 : 30)
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      const rules = shared.current.even ? EVEN_RULES : REAL_RULES
      if (w < 520) ctx.font = FONT_LABEL // fit the rule list beside the patch at 360px
      ctx.fillText(
        w < 520
          ? rules.map(([a, b]) => `(${a},${b})`).join('')
          : `rules: ${rules.map(([a, b]) => `(${a},${b})`).join(' ')}`,
        tx,
        pane.y + 18,
      )
      ctx.font = '600 26px ui-sans-serif, system-ui'
      ctx.fillStyle = rep.illegal.length > 0 ? '#dc2626' : INK
      ctx.fillText(`${rep.illegal.length}`, tx, pane.y + 58)
      ctx.font = FONT_METER
      ctx.fillText('same-color wires', tx, pane.y + 78)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`of ${rep.edges.length} on the patch`, tx, pane.y + 96)

      // narrow variants: the full verdict lines ran off the 360px canvas
      // (figure audit, 2026-08-11)
      const narrow = w < 520
      ctx.font = FONT_METER
      if (shared.current.even) {
        ctx.fillStyle = '#dc2626'
        if (narrow) {
          ctx.fillText('(2,2): 2+2 even —', tx, pane.y + 128)
          ctx.fillText('like joins like;', tx, pane.y + 146)
          ctx.font = FONT_LABEL
          ctx.fillText('red/black breaks', tx, pane.y + 164)
        } else {
          ctx.fillText('(2,2) steps 2+2 even — like joins like', tx, pane.y + 128)
          ctx.font = FONT_LABEL
          ctx.fillText('red / black can no longer update one color at a time', tx, pane.y + 146)
        }
      } else {
        ctx.fillStyle = INK
        if (narrow) {
          ctx.fillText('every rule: a+b odd —', tx, pane.y + 128)
          ctx.fillText('red only wires to black;', tx, pane.y + 146)
          ctx.font = FONT_LABEL
          ctx.fillStyle = 'rgba(85,96,111,0.9)'
          ctx.fillText('checkerboard survives', tx, pane.y + 164)
        } else {
          ctx.fillText('every rule steps a+b odd — red only wires to black', tx, pane.y + 128)
          ctx.font = FONT_LABEL
          ctx.fillStyle = 'rgba(85,96,111,0.9)'
          ctx.fillText('the checkerboard survives all sixteen knight-moves', tx, pane.y + 146)
        }
      }

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('truncated patch — border cells lose wires', pane.x, pane.y + pane.h + 16)
    },
  }
}

export function ParityToggle() {
  const [even, setEven] = useState(false)
  const shared = useRef<ParityShared>({ even })
  shared.current.even = even

  return (
    <Sim height={300} animated={false} create={() => createParityToggle(shared)}>
      {([false, true] as const).map((mode) => (
        <button
          key={String(mode)}
          type="button"
          onClick={() => setEven(mode)}
          style={even === mode ? { fontWeight: 700 } : undefined}
        >
          {mode ? 'swap in (2,2)' : 'the real rules'}
        </button>
      ))}
    </Sim>
  )
}
