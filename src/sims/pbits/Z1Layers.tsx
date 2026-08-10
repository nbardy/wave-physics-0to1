import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'
import { layersFromVisible, z1Graph, type Z1Graph } from './z1'

// Part 2, PLAN F4 (seed build) — the re-hanging. Left: the fabric as it sits
// on the die, a 12×12 torus patch of the exact Z1 offset rules, with one
// cell's sixteen wires drawn as the strange knight-moves they are and the
// chosen visible cells haloed. Right: the SAME graph hung by its visible
// cells — every node placed in the column of its wiring distance to the
// nearest visible cell. Every wire lands between adjacent columns; none
// stays inside a column (a same-column wire would close an odd cycle, which
// the fabric's odd-parity offsets forbid). The sparse chip, re-hung by the
// nodes you can read, is a layered machine.

const GW = 12
const GH = 12
const K_VISIBLE = 3

export interface Z1LayersShared {
  roll: number
}

/**
 * Visible cells are drawn from ONE color class. This is load-bearing, not
 * cosmetic: with sources on a single color, every node's layer parity equals
 * its color parity, so every wire spans exactly one column. Mix the colors
 * and two visible neighbors share layer 0 — a same-column wire — which is
 * the theorem's measured boundary (asserted in check-z1.ts).
 */
export function pickVisible(g: Z1Graph, roll: number): number[] {
  const chosen = new Set<number>()
  let salt = 0
  while (chosen.size < K_VISIBLE) {
    const i = Math.floor(u01(211, roll, salt++, 0) * g.n)
    if (g.colors[i] === 0) chosen.add(i)
  }
  return [...chosen]
}

export function createZ1Layers(shared: { current: Z1LayersShared }): Stepper {
  const g = z1Graph(GW, GH)
  let lastRoll = -1
  let visible: number[] = []
  let layer: Int32Array = new Int32Array(0)
  let maxLayer = 0

  const refresh = (roll: number) => {
    lastRoll = roll
    visible = pickVisible(g, roll)
    layer = layersFromVisible(g, visible)
    maxLayer = 0
    for (let i = 0; i < g.n; i++) maxLayer = Math.max(maxLayer, layer[i])
  }

  return {
    step() {
      if (shared.current.roll !== lastRoll) refresh(shared.current.roll)
    },
    draw(ctx, w, h) {
      if (shared.current.roll !== lastRoll) refresh(shared.current.roll)
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')

      // left pane: the die's-eye view
      const lp: Rect = { x: 16, y: 30, w: w * 0.42, h: h - 66 }
      paneFrame(ctx, lp)
      const cell = Math.min(lp.w / GW, lp.h / GH)
      const px = (i: number): [number, number] => [
        lp.x + (i % GW) * cell + cell / 2,
        lp.y + Math.floor(i / GW) * cell + cell / 2,
      ]
      // one sample cell's sixteen wires, drawn as true moves (non-wrapping only,
      // for legibility — the torus wraps are real but unreadable as chords)
      const probe = Math.floor(GH / 2) * GW + Math.floor(GW / 2)
      ctx.strokeStyle = PALETTE.ferro
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.2
      const [pxx, pxy] = px(probe)
      for (const j of g.nbr[probe]) {
        const [jx, jy] = px(j)
        if (Math.abs(jx - pxx) > cell * 5 || Math.abs(jy - pxy) > cell * 5) continue
        ctx.beginPath()
        ctx.moveTo(pxx, pxy)
        ctx.lineTo(jx, jy)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      for (let i = 0; i < g.n; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.22, 0, Math.PI * 2)
        ctx.fillStyle = g.colors[i] ? PALETTE.sDn : PALETTE.sUp
        ctx.globalAlpha = 0.65
        ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.beginPath()
      ctx.arc(pxx, pxy, cell * 0.34, 0, Math.PI * 2)
      ctx.strokeStyle = PALETTE.ferro
      ctx.lineWidth = 2
      ctx.stroke()
      for (const v of visible) {
        const [x, y] = px(v)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.34, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.held
        ctx.lineWidth = 2.2
        ctx.stroke()
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(w < 520 ? 'die: 16 moves · ringed = visible' : 'the die: one cell’s 16 moves · visible cells ringed', lp.x, lp.y + lp.h + 14)

      // right pane: hung by the visible cells
      const rp: Rect = { x: w * 0.5, y: 30, w: w * 0.46, h: h - 66 }
      paneFrame(ctx, rp)
      const perLayer: number[][] = Array.from({ length: maxLayer + 1 }, () => [])
      for (let i = 0; i < g.n; i++) perLayer[layer[i]].push(i)
      const colW = rp.w / (maxLayer + 1)
      const pos = new Map<number, [number, number]>()
      perLayer.forEach((nodes, L) => {
        nodes.forEach((i, r) => {
          pos.set(i, [
            rp.x + L * colW + colW / 2,
            rp.y + ((r + 0.5) / nodes.length) * (rp.h - 18) + 4,
          ])
        })
      })
      ctx.strokeStyle = PALETTE.ferro
      ctx.globalAlpha = 0.07
      ctx.lineWidth = 1
      for (const [i, j] of g.edges) {
        const a = pos.get(i)!
        const b = pos.get(j)!
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      for (let i = 0; i < g.n; i++) {
        const [x, y] = pos.get(i)!
        ctx.beginPath()
        ctx.arc(x, y, 2.6, 0, Math.PI * 2)
        ctx.fillStyle = layer[i] === 0 ? PALETTE.held : PALETTE.meter
        ctx.globalAlpha = layer[i] === 0 ? 1 : 0.75
        ctx.fill()
        ctx.globalAlpha = 1
      }
      // light backing so the header reads over the wire bundle it sits on
      // (figure audit, 2026-08-11: it was drawn bare across dozens of red wires)
      ctx.font = FONT_METER
      const hdr = `hung by ${K_VISIBLE} visible cells: ${maxLayer + 1} layers`
      const hdrW = ctx.measureText(hdr).width
      ctx.fillStyle = 'rgba(247,249,252,0.85)'
      ctx.fillRect(rp.x + 4, rp.y + 6, hdrW + 10, 17)
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(hdr, rp.x + 8, rp.y + 18)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // narrow: the full caption overprinted the die pane's caption at 360px
      ctx.fillText(
        w < 520 ? 'wires span adjacent columns only' : 'same graph · every wire spans adjacent columns — none stays inside one',
        rp.x,
        rp.y + rp.h + 14,
      )
    },
  }
}

export function Z1Layers() {
  const [roll, setRoll] = useState(1)
  const shared = useRef<Z1LayersShared>({ roll })
  shared.current.roll = roll

  return (
    <Sim height={300} animated={false} create={() => createZ1Layers(shared)}>
      <button type="button" onClick={() => setRoll((r) => r + 1)}>
        re-roll the visible cells
      </button>
    </Sim>
  )
}
