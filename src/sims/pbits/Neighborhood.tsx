import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { Z1_RULES } from './z1'

// Part 2, PLAN F2 — one cell's sixteen wires. The four offset rules
// (1,0), (2,1), (2,3), (4,1), each under its four 90° rotations, drawn from
// a probe cell the reader moves by tap or drag. Each rule wears its own hue
// so the sixteen wires read as 4 × 4, not as an undifferentiated splat.
//
// BOUNDARY CHOICE (deliberate, per RESEARCH.md): the real Z1 die is a
// TRUNCATED GRID — "degree 16 except at grid boundaries where some edges
// fall outside the grid" (Thermalizers §II B 1). z1Graph's torus is a
// documented idealization for the sampling infrastructure; THIS figure is
// about the neighborhood itself, so it generates the truncated behavior
// locally instead of importing the torus: an offset that leaves the patch is
// a wire that does not exist, drawn as a dashed stub falling off the die.
// Drag the probe to a border and the degree readout drops below 16.

const GW = 13
const GH = 13

/** rule index → its ink. Four hue families from the standing palette:
 *  blue / green / amber / violet — red stays reserved for F3's illegal
 *  wires and the ferro convention. */
export const RULE_INK: readonly string[] = [
  PALETTE.sDn, // (1,0)
  PALETTE.held, // (2,1)
  PALETTE.sUp, // (2,3)
  PALETTE.meter, // (4,1)
]

export interface Wire {
  rule: number
  dx: number
  dy: number
  /** false ⇔ the offset leaves the truncated patch — no wire on the die */
  inGrid: boolean
}

/** The sixteen candidate wires of cell (x, y) on a truncated gw×gh patch. */
export function probeWires(gw: number, gh: number, x: number, y: number): Wire[] {
  const out: Wire[] = []
  Z1_RULES.forEach(([a, b], rule) => {
    const rots: Array<[number, number]> = [
      [a, b],
      [-b, a],
      [-a, -b],
      [b, -a],
    ]
    for (const [dx, dy] of rots) {
      const tx = x + dx
      const ty = y + dy
      out.push({ rule, dx, dy, inGrid: tx >= 0 && tx < gw && ty >= 0 && ty < gh })
    }
  })
  return out
}

export interface NeighborhoodShared {
  cx: number
  cy: number
}

export interface NeighborhoodProbe {
  degree: number
  perRule: number[]
}

export function neighborhoodPane(w: number, h: number): Rect {
  const side = Math.min(w * 0.6, h - 66)
  return { x: 16, y: 30, w: side, h: side }
}

export function createNeighborhood(
  shared: { current: NeighborhoodShared },
  probe?: NeighborhoodProbe,
): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const pane = neighborhoodPane(w, h)
      paneFrame(ctx, pane)
      const cell = Math.min(pane.w / GW, pane.h / GH)
      const px = (x: number, y: number): [number, number] => [
        pane.x + x * cell + cell / 2,
        pane.y + y * cell + cell / 2,
      ]

      const cx = shared.current.cx
      const cy = shared.current.cy
      const wires = probeWires(GW, GH, cx, cy)
      const perRule = [0, 0, 0, 0]
      for (const wi of wires) if (wi.inGrid) perRule[wi.rule]++
      const degree = perRule[0] + perRule[1] + perRule[2] + perRule[3]
      if (probe) {
        probe.degree = degree
        probe.perRule = perRule
      }

      // the die's cells, quiet gray
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const [dx, dy] = px(x, y)
          ctx.beginPath()
          ctx.arc(dx, dy, cell * 0.13, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(120,140,170,0.5)'
          ctx.fill()
        }
      }

      // sixteen wires from the probe: solid in-grid, dashed stub off the die
      const [ox, oy] = px(cx, cy)
      for (const wi of wires) {
        const ink = RULE_INK[wi.rule]
        if (wi.inGrid) {
          const [tx, ty] = px(cx + wi.dx, cy + wi.dy)
          ctx.strokeStyle = ink
          ctx.globalAlpha = 0.85
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(ox, oy)
          ctx.lineTo(tx, ty)
          ctx.stroke()
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(tx, ty, cell * 0.2, 0, Math.PI * 2)
          ctx.fillStyle = ink
          ctx.fill()
        } else {
          // the wire that does not exist: a stub falling off the truncated die
          const len = Math.hypot(wi.dx, wi.dy) * cell
          const ux = (wi.dx * cell) / len
          const uy = (wi.dy * cell) / len
          ctx.strokeStyle = ink
          ctx.globalAlpha = 0.35
          ctx.lineWidth = 1.6
          ctx.setLineDash([3, 4])
          ctx.beginPath()
          ctx.moveTo(ox, oy)
          ctx.lineTo(ox + ux * len * 0.45, oy + uy * len * 0.45)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1
        }
      }

      // the probe cell itself
      ctx.beginPath()
      ctx.arc(ox, oy, cell * 0.26, 0, Math.PI * 2)
      ctx.fillStyle = INK
      ctx.fill()
      ctx.beginPath()
      ctx.arc(ox, oy, cell * 0.4, 0, Math.PI * 2)
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.6
      ctx.stroke()

      // legend: the four rules, each in its own ink, with its live count
      const lx = pane.x + pane.w + 28
      let ly = pane.y + 16
      ctx.textAlign = 'left'
      for (let r = 0; r < 4; r++) {
        const [a, b] = Z1_RULES[r]
        ctx.fillStyle = RULE_INK[r]
        ctx.fillRect(lx, ly - 8, 18, 4)
        ctx.font = FONT_METER
        ctx.fillStyle = RULE_INK[r]
        ctx.fillText(`(${a},${b})`, lx + 26, ly)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(`${perRule[r]} of 4 wires`, lx + 74, ly)
        ly += 22
      }
      ly += 10
      ctx.font = '600 24px ui-sans-serif, system-ui'
      ctx.fillStyle = degree < 16 ? '#dc2626' : INK
      ctx.fillText(`${degree}`, lx, ly + 8)
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      ctx.fillText('of 16 wires', lx + 40, ly + 8)
      if (degree < 16) {
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#dc2626'
        ctx.fillText(`${16 - degree} fall off the die`, lx, ly + 26)
      }

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        'truncated patch — border cells lose wires · tap or drag to move the cell',
        pane.x,
        pane.y + pane.h + 16,
      )
    },
  }
}

export function Neighborhood() {
  const shared = useRef<NeighborhoodShared>({ cx: (GW / 2) | 0, cy: (GH / 2) | 0 })

  const moveProbe = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pane = neighborhoodPane(rect.width, rect.height)
    const cell = Math.min(pane.w / GW, pane.h / GH)
    const x = Math.floor((e.clientX - rect.left - pane.x) / cell)
    const y = Math.floor((e.clientY - rect.top - pane.y) / cell)
    if (x >= 0 && x < GW && y >= 0 && y < GH) {
      shared.current.cx = x
      shared.current.cy = y
    }
  }

  return (
    <div
      className="sim-stir"
      onPointerDown={moveProbe}
      onPointerMove={(e) => {
        if (e.buttons > 0) moveProbe(e)
      }}
    >
      <Sim height={300} animated={false} create={() => createNeighborhood(shared)} />
    </div>
  )
}
