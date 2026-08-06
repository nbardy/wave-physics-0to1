import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { PALETTE } from '../lib/palette'
import {
  buildChromatic,
  buildModel,
  condProbPlus,
  drawLayerRail,
  freshSpins,
  u01,
  type Edge,
  type PbitModel,
} from './lib'

// PLAN F16 (rev. 2) — the chip fabric. The §6 red/black half-sweep drawn on
// a patch of degree-16 bipartite fabric: every p-bit has exactly sixteen
// wires, every wire joins a red cell to a black cell, and the two-phase clock
// writes one whole color class per tick. SUBSTRATE slot lit — this is the
// figure where the schedule stops being software.
//
// Honesty of the topology (confessed in prose where this figure lands): this
// is a PROXY for Z1's fabric built from its published numbers — degree 16,
// sparse, two-colorable — not the die's actual wiring, which is not public at
// wire level. Construction: a 12×12 torus where each cell couples to sixteen
// offsets of odd parity (so the checkerboard coloring is legal by parity, and
// the wrap preserves it because both torus dimensions are even). The check
// script asserts the two properties the prose claims: degree exactly 16
// everywhere, and a conflict-free two-coloring.

export const FABRIC_W = 12
export const FABRIC_H = 12

// Half of the sixteen odd-parity offsets; each appears once per cell, giving
// every cell 8 outgoing + 8 incoming = degree 16 on the torus.
const HALF_OFFSETS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [2, 1],
  [2, -1],
  [1, 2],
  [-1, 2],
  [3, 0],
  [0, 3],
]

const BETA = 0.7
const J_SEED = 401
const RUN_SEED = 19
const PASSES_PER_SEC = 6

export function fabricModel(): PbitModel {
  const edges: Edge[] = []
  let k = 0
  for (let y = 0; y < FABRIC_H; y++) {
    for (let x = 0; x < FABRIC_W; x++) {
      const i = y * FABRIC_W + x
      for (const [dx, dy] of HALF_OFFSETS) {
        const j = (((y + dy) % FABRIC_H) + FABRIC_H) % FABRIC_H * FABRIC_W
          + ((((x + dx) % FABRIC_W) + FABRIC_W) % FABRIC_W)
        edges.push({ i, j, J: u01(J_SEED, 0, k++, 0) < 0.5 ? 0.18 : -0.18 })
      }
    }
  }
  return buildModel(FABRIC_W * FABRIC_H, new Float32Array(FABRIC_W * FABRIC_H), edges, BETA)
}

export function fabricColors(): Uint8Array {
  const c = new Uint8Array(FABRIC_W * FABRIC_H)
  for (let y = 0; y < FABRIC_H; y++)
    for (let x = 0; x < FABRIC_W; x++) c[y * FABRIC_W + x] = (x + y) & 1
  return c
}

/** The cell whose sixteen wires get drawn at full strength. */
const FOCUS = 6 * FABRIC_W + 6

export function createChipFabric(): Stepper {
  const m = fabricModel()
  const colors = fabricColors()
  buildChromatic(m, colors, 2) // the correctness condition, held by construction
  const s = freshSpins(m, RUN_SEED)
  let pass = 0 // one color pass per tick — the two-phase clock itself
  let acc = 0

  // one half-sweep: write every cell of the active color, neighbors frozen.
  // This is sweepChromatic's inner loop, run one color at a time so the clock
  // phase on screen IS the update actually performed.
  const halfSweep = (color: number) => {
    pass++
    for (let i = 0; i < m.n; i++) {
      if (colors[i] !== color) continue
      s[i] = u01(RUN_SEED, pass, i, color) < condProbPlus(m, s, i) ? 1 : -1
    }
  }

  return {
    step(dt) {
      acc += dt * PASSES_PER_SEC
      acc = Math.min(acc, 3)
      while (acc >= 1) {
        acc -= 1
        halfSweep(pass % 2)
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const writingColor = pass % 2 // the class the NEXT tick writes
      const cell = Math.min((w - 220) / FABRIC_W, (h - 56) / FABRIC_H)
      const gx = 28
      const gy = 40
      const px = (i: number): [number, number] => [
        gx + (i % FABRIC_W) * cell + cell / 2,
        gy + Math.floor(i / FABRIC_W) * cell + cell / 2,
      ]

      // the fabric's wires, faint — 1,152 of them; wrapping edges skipped in
      // ink (the torus is a construction device, not a claim about the die)
      ctx.strokeStyle = 'rgba(120,140,170,0.07)'
      ctx.lineWidth = 1
      for (const { i, j } of m.edges) {
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        if (Math.abs(x1 - x0) > cell * 3.5 || Math.abs(y1 - y0) > cell * 3.5) continue
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      // one cell's sixteen wires at full strength — the degree, countable
      ctx.lineWidth = 1.4
      for (const { i, j } of m.edges) {
        if (i !== FOCUS && j !== FOCUS) continue
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        ctx.strokeStyle = 'rgba(85,96,111,0.75)'
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }

      // cells: spin ink inside, color-class ring outside; the class being
      // written this tick wears its ring bold
      const r = Math.max(3.5, cell * 0.26)
      for (let i = 0; i < m.n; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = s[i] > 0 ? PALETTE.sUp : PALETTE.sDn
        ctx.fill()
        const active = colors[i] === writingColor
        ctx.beginPath()
        ctx.arc(x, y, r + 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = colors[i] === 0 ? '#dc2626' : INK
        ctx.globalAlpha = active ? 0.95 : 0.2
        ctx.lineWidth = active ? 2 : 1.2
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      // the focus cell, marked
      {
        const [x, y] = px(FOCUS)
        ctx.beginPath()
        ctx.arc(x, y, r + 6, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 1.6
        ctx.stroke()
      }

      const tx = gx + FABRIC_W * cell + 30
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = writingColor === 0 ? '#dc2626' : INK
      ctx.fillText(`writing: ${writingColor === 0 ? 'red' : 'black'}`, tx, gy + 26)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`half-sweeps: ${pass.toLocaleString()}`, tx, gy + 46)
      ctx.fillText('16 wires into the marked cell', tx, gy + 66)
      ctx.fillText('bold ring = this tick writes it', gx, gy + FABRIC_H * cell + 14)
    },
  }
}

export function ChipFabric() {
  return <Sim height={340} create={() => createChipFabric()} />
}
