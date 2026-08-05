import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL } from '../lib/chrome'
import {
  buildChromatic,
  buildModel,
  drawHalo,
  drawLayerRail,
  drawSpin,
  edgeColor,
  freshSpins,
  sweep,
  twoColorGrid,
  u01,
  type Edge,
  type PbitModel,
} from './lib'

// PLAN F18 — the pokeable manual. A 4×4 patch of the chip's fabric with
// exactly four affordances: set a bias, set a coupling on a WIRED pair, hold a
// cell, sweep red/black. Everything else is visibly refused — drag a coupling
// toward a cell that shares no wire and the attempt snaps back with a flat
// refusal. The instruction set is the figure.

export const FW = 4
export const FH = 4
const BETA = 0.8
const SWEEPS_PER_SEC = 30
const CELL_R = 15

/** The fabric's wires: grid adjacency, fixed at manufacture. */
export const FABRIC_EDGES: Array<{ i: number; j: number }> = (() => {
  const e: Array<{ i: number; j: number }> = []
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const i = y * FW + x
      if (x + 1 < FW) e.push({ i, j: i + 1 })
      if (y + 1 < FH) e.push({ i, j: i + FW })
    }
  }
  return e
})()

export type ManualMode = 'bias' | 'wire' | 'hold'

export interface FabricState {
  h: Float32Array
  /** One J per fabric edge (0 = wire present but silent). */
  J: Float32Array
  clamp: Int8Array
  /** Bumped on every edit so the stepper rebuilds its model. */
  version: number
  sweepOn: boolean
  mode: ManualMode
  /** A live drag in wire mode: source cell + pointer position (unit coords). */
  drag: { from: number; px: number; py: number } | null
  /** The last refused attempt, replayed as a snap-back. */
  refusal: { from: number; to: number; age: number } | null
}

export function freshFabric(): FabricState {
  const J = new Float32Array(FABRIC_EDGES.length)
  // ship with a few wires warm so the patch flickers with structure
  J[0] = 1
  J[FABRIC_EDGES.length - 1] = -1
  return {
    h: new Float32Array(FW * FH),
    J,
    clamp: new Int8Array(FW * FH),
    version: 0,
    sweepOn: true,
    mode: 'bias',
    drag: null,
    refusal: null,
  }
}

const edgeIndex = new Map<string, number>()
FABRIC_EDGES.forEach(({ i, j }, k) => edgeIndex.set(`${i}-${j}`, k))

export function fabricEdgeOf(a: number, b: number): number | null {
  const k = edgeIndex.get(`${Math.min(a, b)}-${Math.max(a, b)}`)
  return k === undefined ? null : k
}

export type CoupleResult = 'cycled' | 'refused'

/**
 * The coupling affordance. A wired pair cycles its J (0 → +1 → −1 → 0); an
 * unwired pair is refused — the fabric has no such instruction.
 */
export function attemptCouple(state: FabricState, a: number, b: number): CoupleResult {
  const k = fabricEdgeOf(a, b)
  if (k === null) {
    state.refusal = { from: a, to: b, age: 0 }
    state.version++
    return 'refused'
  }
  state.J[k] = state.J[k] === 0 ? 1 : state.J[k] > 0 ? -1 : 0
  state.version++
  return 'cycled'
}

export function cycleBias(state: FabricState, k: number): void {
  state.h[k] = state.h[k] === 0 ? 1 : state.h[k] > 0 ? -1 : 0
  state.version++
}

export function cycleClamp(state: FabricState, k: number): void {
  state.clamp[k] = state.clamp[k] === 0 ? 1 : state.clamp[k] > 0 ? -1 : 0
  state.version++
}

function buildFabricModel(state: FabricState): PbitModel {
  const edges: Edge[] = []
  FABRIC_EDGES.forEach(({ i, j }, k) => {
    if (state.J[k] !== 0) edges.push({ i, j, J: state.J[k] })
  })
  return buildModel(FW * FH, state.h, edges, BETA, state.clamp)
}

/** Cell center in unit coordinates of the canvas. */
export function fabricCellPos(k: number): [number, number] {
  const x = k % FW
  const y = Math.floor(k / FW)
  return [0.14 + x * 0.155, 0.16 + y * 0.24]
}

export function createManual(shared: { current: FabricState }, seed = 71): Stepper {
  let m = buildFabricModel(shared.current)
  let s = freshSpins(m, seed)
  let chromatic = buildChromatic(m, twoColorGrid(FW, FH), 2)
  let version = shared.current.version
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      const st = shared.current
      if (st.version !== version) {
        version = st.version
        m = buildFabricModel(st)
        chromatic = buildChromatic(m, twoColorGrid(FW, FH), 2)
        // held values take effect immediately; free spins keep their state
        for (let k = 0; k < m.n; k++) if (m.clamp[k] !== 0) s[k] = m.clamp[k]
      }
      if (st.refusal) {
        st.refusal.age += dt
        if (st.refusal.age > 1.1) st.refusal = null
      }
      if (!st.sweepOn) return
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        sweep(m, s, chromatic, (site, salt) => u01(seed, sweepN, site, salt))
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const st = shared.current
      const at = (k: number): [number, number] => {
        const [ux, uy] = fabricCellPos(k)
        return [ux * w, uy * h]
      }

      // wires: silent ones as faint fabric, set ones in their coupling ink
      FABRIC_EDGES.forEach(({ i, j }, k) => {
        const [x0, y0] = at(i)
        const [x1, y1] = at(j)
        const J = st.J[k]
        ctx.strokeStyle = J === 0 ? 'rgba(120,140,170,0.35)' : edgeColor(J)
        ctx.lineWidth = J === 0 ? 1 : 1 + Math.abs(J) * 2.6
        ctx.globalAlpha = J === 0 ? 1 : 0.75
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      // a live wire-drag: rubber band from the source cell
      if (st.drag) {
        const [x0, y0] = at(st.drag.from)
        ctx.strokeStyle = 'rgba(85,96,111,0.7)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(st.drag.px * w, st.drag.py * h)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // a refused attempt: the illegal wire snaps back toward its source
      if (st.refusal) {
        const { from, to, age } = st.refusal
        const [x0, y0] = at(from)
        const [x1, y1] = at(to)
        const retreat = Math.min(1, Math.max(0, (age - 0.35) / 0.6))
        const ex = x1 + (x0 - x1) * retreat
        const ey = y1 + (y0 - y1) * retreat
        ctx.strokeStyle = PALETTE.ferro
        ctx.lineWidth = 2.4
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.ferro
        ctx.textAlign = 'center'
        ctx.fillText('no wire there — refused', (x0 + x1) / 2, Math.min(y0, y1) - 14)
      }

      // cells: state ink, bias tick, hold halo
      for (let k = 0; k < FW * FH; k++) {
        const [x, y] = at(k)
        drawSpin(ctx, x, y, CELL_R, s[k])
        if (st.clamp[k] !== 0) drawHalo(ctx, x, y, CELL_R)
        if (st.h[k] !== 0) {
          // the bias as a small arrow beside the cell — which way it leans
          const dir = st.h[k] > 0 ? -1 : 1
          ctx.strokeStyle = st.h[k] > 0 ? PALETTE.sUp : PALETTE.sDn
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x + CELL_R + 7, y + 6 * -dir)
          ctx.lineTo(x + CELL_R + 7, y + 6 * dir)
          ctx.lineTo(x + CELL_R + 4, y + 6 * dir - 3 * dir)
          ctx.moveTo(x + CELL_R + 7, y + 6 * dir)
          ctx.lineTo(x + CELL_R + 10, y + 6 * dir - 3 * dir)
          ctx.stroke()
        }
      }

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      const hint =
        st.mode === 'bias'
          ? 'tap a cell to cycle its bias: none → up → down'
          : st.mode === 'wire'
            ? 'drag cell to cell to cycle a wire: silent → agree → disagree'
            : 'tap a cell to cycle its hold: free → held up → held down'
      ctx.fillText(hint, 14, h - 10)
      ctx.fillText(st.sweepOn ? 'sweeping red / black' : 'sweep paused', w - 150, h - 10)
    },
  }
}

export function Manual() {
  const shared = useRef<FabricState>(freshFabric())
  const [mode, setMode] = useState<ManualMode>('bias')
  const [sweepOn, setSweepOn] = useState(true)
  shared.current.mode = mode
  shared.current.sweepOn = sweepOn

  const cellAt = (e: React.PointerEvent<HTMLDivElement>): { k: number | null; ux: number; uy: number } => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return { k: null, ux: 0, uy: 0 }
    const rect = el.getBoundingClientRect()
    const ux = (e.clientX - rect.left) / rect.width
    const uy = (e.clientY - rect.top) / rect.height
    for (let k = 0; k < FW * FH; k++) {
      const [cx, cy] = fabricCellPos(k)
      if (Math.hypot((ux - cx) * rect.width, (uy - cy) * rect.height) < CELL_R + 8)
        return { k, ux, uy }
    }
    return { k: null, ux, uy }
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = shared.current
    const { k } = cellAt(e)
    if (k === null) return
    if (st.mode === 'bias') cycleBias(st, k)
    else if (st.mode === 'hold') cycleClamp(st, k)
    else st.drag = { from: k, px: 0, py: 0 }
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = shared.current
    if (!st.drag) return
    const { ux, uy } = cellAt(e)
    st.drag.px = ux
    st.drag.py = uy
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = shared.current
    if (!st.drag) return
    const from = st.drag.from
    const { k } = cellAt(e)
    st.drag = null
    if (k !== null && k !== from) attemptCouple(st, from, k)
  }

  return (
    <div className="sim-stir" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
      <Sim height={300} create={() => createManual(shared)}>
        {(['bias', 'wire', 'hold'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={mode === m ? { fontWeight: 700 } : undefined}
          >
            {m}
          </button>
        ))}
        <button type="button" onClick={() => setSweepOn((v) => !v)}>
          {sweepOn ? 'stop sweep' : 'sweep'}
        </button>
      </Sim>
    </div>
  )
}
