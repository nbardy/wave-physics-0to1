import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { buildModel, drawHalo, drawLayerRail, edgeColor, type Edge, type PbitModel } from './lib'

// Part 2, PLAN F6 — the thermodynamic-kernel partition. One small model, its
// spins wearing three role colors, and the kernel's whole definition done as
// a gesture: clamp the green spins to x, sum the pink spins out, normalize
// over the violet spins — K̃(y|x) = Σ_w e^{−E(x,w,y)} / Z(x) (Thermalizers
// §II A Eq (5); the Fig 1 caption's own clamp–marginalize–normalize). Tap a
// spin to move it between roles and watch the conditional recompute live by
// exact enumeration; flip x and the same partition answers a different
// question. The check script recomputes every readout through lib's
// subModel + enumerate — an independent route to the same numbers.
//
// HIDDEN-ROLE INK: the working hue is PALETTE.dye2 (#db2777), the one warm
// pink already in the palette contract and unused by the p-bit set —
// ASSEMBLER: promote to a named key (e.g. PALETTE.hid) at the next palette
// edit and re-point this import.

export const HID_INK = PALETTE.dye2

export const PART_N = 6
export const PART_BETA = 0.9

// All h and J are dyadic (exact in float32): lib's buildModel stores them in
// Float32Arrays, and non-dyadic values would put ~1e-8 of rounding between
// this file's own energy loop and the check's subModel + enumerate route.
const PART_H = [0.25, -0.125, 0.1875, -0.25, 0.125, -0.1875]
const PART_EDGES: Edge[] = [
  { i: 0, j: 1, J: 0.875 },
  { i: 1, j: 2, J: -0.625 },
  { i: 2, j: 3, J: 0.75 },
  { i: 3, j: 4, J: 0.875 },
  { i: 4, j: 5, J: -0.5 },
  { i: 5, j: 0, J: 0.625 },
  { i: 0, j: 3, J: 0.5 },
  { i: 1, j: 4, J: -0.375 },
]

/** The one model this figure partitions — as a lib model, so the check can
 *  route the same physics through subModel + enumerate independently. */
export function partitionModel(): PbitModel {
  return buildModel(PART_N, PART_H, PART_EDGES, PART_BETA)
}

export type Role = 0 | 1 | 2 // 0 = input x, 1 = hidden w, 2 = output y
export const ROLE_INK: readonly string[] = [PALETTE.held, HID_INK, PALETTE.meter]
const ROLE_NAME: readonly string[] = ['input x — clamped', 'hidden w — summed out', 'output y — read']

export type Conditional =
  | { kind: 'ok'; p: Float64Array; out: number[]; hid: number[]; inp: number[] }
  | { kind: 'noOutput' }

/**
 * K̃(y|x) by exact enumeration, with this figure's OWN energy loop (the
 * check's independent route goes through lib.subModel + lib.enumerate):
 * clamp inputs at xVals, enumerate every (w, y), marginalize w, normalize y.
 * Log-space shift so large couplings can't overflow (same guard as
 * walkCompile, same reason).
 */
export function kernelConditional(roles: ArrayLike<number>, xVals: ArrayLike<number>): Conditional {
  const inp: number[] = []
  const hid: number[] = []
  // named `outs`, not `out` — bun's TS parser reads `1 << out…` as a
  // variance-modifier type list and refuses to parse the file
  const outs: number[] = []
  for (let i = 0; i < PART_N; i++) {
    if (roles[i] === 0) inp.push(i)
    else if (roles[i] === 1) hid.push(i)
    else outs.push(i)
  }
  if (outs.length === 0) return { kind: 'noOutput' }
  const nW = 1 << hid.length
  const nY = 1 << outs.length
  const s = new Int8Array(PART_N)
  for (const i of inp) s[i] = xVals[i] >= 0 ? 1 : -1
  const energies = new Float64Array(nY * nW)
  let eMin = Infinity
  for (let y = 0; y < nY; y++) {
    for (let k = 0; k < outs.length; k++) s[outs[k]] = (y >> k) & 1 ? 1 : -1
    for (let wc = 0; wc < nW; wc++) {
      for (let k = 0; k < hid.length; k++) s[hid[k]] = (wc >> k) & 1 ? 1 : -1
      let e = 0
      for (let i = 0; i < PART_N; i++) e -= PART_H[i] * s[i]
      for (const { i, j, J } of PART_EDGES) e -= J * s[i] * s[j]
      energies[y * nW + wc] = e
      if (e < eMin) eMin = e
    }
  }
  const p = new Float64Array(nY)
  let z = 0
  for (let y = 0; y < nY; y++) {
    let sum = 0
    for (let wc = 0; wc < nW; wc++) sum += Math.exp(-PART_BETA * (energies[y * nW + wc] - eMin))
    p[y] = sum
    z += sum
  }
  for (let y = 0; y < nY; y++) p[y] /= z
  return { kind: 'ok', p, out: outs, hid, inp }
}

export interface PartitionShared {
  roles: Uint8Array
  /** clamp values per spin (only input-role entries are read) */
  xVals: Int8Array
}

export interface PartitionProbe {
  nOut: number
  p: Float64Array
}

export function freshPartitionShared(): PartitionShared {
  return {
    roles: Uint8Array.from([0, 0, 1, 1, 2, 2]),
    xVals: Int8Array.from([1, 1, 1, 1, 1, 1]),
  }
}

export function partitionSpinPos(w: number, h: number): Array<[number, number]> {
  const cx = w * 0.19
  const cy = 30 + (h - 92) / 2
  const r = Math.min(w * 0.13, (h - 100) / 2)
  return Array.from({ length: PART_N }, (_, k) => {
    const ang = -Math.PI / 2 + (k * 2 * Math.PI) / PART_N
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)] as [number, number]
  })
}

export function createPartitionFigure(
  shared: { current: PartitionShared },
  probe?: PartitionProbe,
): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const { roles, xVals } = shared.current
      const cond = kernelConditional(roles, xVals)
      const pos = partitionSpinPos(w, h)

      // the model: wires in the coupling inks, spins in their role inks
      for (const { i, j, J } of PART_EDGES) {
        ctx.strokeStyle = edgeColor(J)
        ctx.globalAlpha = 0.55
        ctx.lineWidth = 1 + 2 * Math.abs(J)
        ctx.beginPath()
        ctx.moveTo(pos[i][0], pos[i][1])
        ctx.lineTo(pos[j][0], pos[j][1])
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      for (let k = 0; k < PART_N; k++) {
        const [x, y] = pos[k]
        ctx.beginPath()
        ctx.arc(x, y, 14, 0, Math.PI * 2)
        ctx.fillStyle = ROLE_INK[roles[k]]
        ctx.fill()
        if (roles[k] === 0) {
          drawHalo(ctx, x, y, 14)
          ctx.font = FONT_METER
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.fillText(xVals[k] > 0 ? '+' : '−', x, y + 4.5)
          ctx.textAlign = 'left'
        }
      }

      // role legend, each line in its own ink
      let ly = h - 46
      ctx.font = FONT_LABEL
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = ROLE_INK[r]
        ctx.beginPath()
        ctx.arc(20, ly - 4, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillText(ROLE_NAME[r], 32, ly)
        ly += 15
      }
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // narrow: the full instruction overprinted the formula header at 360px
      // (figure audit, 2026-08-11)
      ctx.fillText(w < 520 ? 'tap a spin' : 'tap a spin: input → hidden → output', 20, 24)

      // the readout pane: K̃(y|x) over the output configurations
      const pane: Rect = { x: w * 0.42, y: 46, w: w * 0.52, h: h - 130 }
      paneFrame(ctx, pane)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      // ASCII minus and slash on purpose: U+0303/U+2044/U+2212 render as
      // tofu boxes in the headless canvas font stack (seen in check PNGs)
      ctx.fillText('K(y|x) = Σ_w e^-E(x,w,y) / Z(x)', pane.x, pane.y - 20)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(w < 520 ? 'clamp x · sum w · normalize y' : 'clamp x · sum w · normalize y — exact enumeration', pane.x, pane.y - 6)

      if (cond.kind === 'noOutput') {
        if (probe) {
          probe.nOut = 0
          probe.p = new Float64Array(0)
        }
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText('no output spins — nothing to read', pane.x + 16, pane.y + pane.h / 2)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('tap a spin until one wears violet', pane.x + 16, pane.y + pane.h / 2 + 18)
        return
      }

      if (probe) {
        probe.nOut = cond.out.length
        probe.p = Float64Array.from(cond.p)
      }
      const nY = cond.p.length
      const bw = pane.w / nY
      let peak = 0
      for (let y = 0; y < nY; y++) peak = Math.max(peak, cond.p[y])
      for (let y = 0; y < nY; y++) {
        const bh = Math.max((cond.p[y] / peak) * (pane.h - 10), cond.p[y] > 0 ? 2 : 0)
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.55
        ctx.fillRect(pane.x + y * bw + bw * 0.16, pane.y + pane.h - bh, bw * 0.68, bh)
        ctx.globalAlpha = 1
        if (nY <= 16) {
          ctx.font = FONT_LABEL
          ctx.fillStyle = PALETTE.meter
          ctx.textAlign = 'center'
          ctx.fillText(fmt(cond.p[y], 2), pane.x + y * bw + bw / 2, pane.y + pane.h - bh - 4)
          ctx.textAlign = 'left'
        }
        // glyph row: the output spins' pattern under each column
        for (let k = 0; k < cond.out.length; k++) {
          ctx.beginPath()
          ctx.arc(pane.x + y * bw + bw / 2, pane.y + pane.h + 10 + k * 8, 2.6, 0, Math.PI * 2)
          ctx.fillStyle = (y >> k) & 1 ? PALETTE.sUp : PALETTE.sDn
          ctx.fill()
        }
      }
      let sum = 0
      for (let y = 0; y < nY; y++) sum += cond.p[y]
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // narrow: shortened — the full tally line ran off the 360px canvas
      // (figure audit, 2026-08-11)
      ctx.fillText(
        w < 520
          ? `${cond.inp.length} clamped · ${cond.hid.length} summed · ${cond.out.length} read · Σ = ${fmt(sum, 2)}`
          : `${cond.inp.length} clamped · ${cond.hid.length} summed (${1 << cond.hid.length} terms each) · ${cond.out.length} read (${nY} columns, Σ = ${fmt(sum, 2)})`,
        pane.x,
        pane.y + pane.h + 10 + cond.out.length * 8 + 14,
      )
    },
  }
}

export function PartitionFigure() {
  const shared = useRef<PartitionShared>(freshPartitionShared())
  const [flip, setFlip] = useState(false)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pos = partitionSpinPos(rect.width, rect.height)
    for (let k = 0; k < PART_N; k++) {
      if (Math.hypot(x - pos[k][0], y - pos[k][1]) < 22) {
        shared.current.roles[k] = ((shared.current.roles[k] + 1) % 3) as Role
        return
      }
    }
  }

  const flipX = () => {
    const next = !flip
    setFlip(next)
    for (let i = 0; i < PART_N; i++) {
      shared.current.xVals[i] = next ? (i % 2 === 0 ? 1 : -1) : 1
    }
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer}>
      <Sim height={320} animated={false} create={() => createPartitionFigure(shared)}>
        <button type="button" onClick={flipX}>
          {flip ? 'x: alternating' : 'x: all +'}
        </button>
      </Sim>
    </div>
  )
}
