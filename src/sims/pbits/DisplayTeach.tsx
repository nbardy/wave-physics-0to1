import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL } from '../lib/chrome'
import {
  buildModel,
  condProbPlus,
  drawHalo,
  drawLayerRail,
  drawSpin,
  edgeColor,
  type PbitModel,
} from './lib'

// PLAN F4 — the display teach. Six cells, a mix of agree- and disagree-wires,
// one held cell wearing the halo. Nothing samples; the reader flips cells by
// hand and watches the little arc gauges — each cell's conditional probability
// of pointing up given its neighbors — shift on exactly the wired cells.

const R = 22

// Positions in unit coordinates (x, y), scaled to the pane at draw time.
const POS: ReadonlyArray<[number, number]> = [
  [0.16, 0.3],
  [0.4, 0.22],
  [0.64, 0.3],
  [0.24, 0.68],
  [0.5, 0.72],
  [0.76, 0.66],
]

export const TEACH_MODEL: PbitModel = buildModel(
  6,
  [0, 0, 0, 0, 0, 0],
  [
    { i: 0, j: 1, J: 1.2 },
    { i: 1, j: 2, J: -0.9 },
    { i: 0, j: 3, J: 0.7 },
    { i: 1, j: 4, J: 1.0 },
    { i: 2, j: 5, J: 1.4 },
    { i: 4, j: 5, J: -0.6 },
  ],
  1,
  [0, 0, 0, 0, 0, 1], // the last cell is held up — it wears the halo
)

export interface TeachShared {
  spins: Int8Array
}

export function freshTeachSpins(): Int8Array {
  return Int8Array.from([1, -1, 1, -1, 1, 1])
}

export function createDisplayTeach(shared: { current: TeachShared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const s = shared.current.spins
      const m = TEACH_MODEL
      const at = (k: number): [number, number] => [POS[k][0] * w, POS[k][1] * h]

      // wires first, under the cells: thickness says how much, hue says which way
      for (const { i, j, J } of m.edges) {
        const [x0, y0] = at(i)
        const [x1, y1] = at(j)
        ctx.strokeStyle = edgeColor(J)
        ctx.lineWidth = 1 + Math.abs(J) * 2.4
        ctx.globalAlpha = 0.65
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      for (let k = 0; k < m.n; k++) {
        const [x, y] = at(k)
        drawSpin(ctx, x, y, R, s[k])
        if (m.clamp[k] !== 0) drawHalo(ctx, x, y, R)
        // the gauge: an arc from 12 o'clock, sweeping with P(up | neighbors)
        const p = condProbPlus(m, s, k)
        ctx.beginPath()
        ctx.arc(x, y, R + 9, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.meter
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(p * 100)}%`, x, y + R + 24)
        ctx.textAlign = 'left'
      }

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('tap a cell to flip it — the ring is held and will not flip', 12, h - 10)
    },
  }
}

export function DisplayTeach() {
  const shared = useRef<TeachShared>({ spins: freshTeachSpins() })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    for (let k = 0; k < TEACH_MODEL.n; k++) {
      const cx = POS[k][0] * rect.width
      const cy = POS[k][1] * rect.height
      if (Math.hypot(x - cx, y - cy) < R + 10) {
        if (TEACH_MODEL.clamp[k] !== 0) return // held is held
        shared.current.spins[k] = (-shared.current.spins[k]) as 1 | -1
        return
      }
    }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer}>
      <Sim
        height={300}
        animated={false}
        create={() => {
          shared.current.spins = freshTeachSpins()
          return createDisplayTeach(shared)
        }}
      />
    </div>
  )
}
