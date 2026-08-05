import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import {
  buildChromatic,
  drawLayerRail,
  freshSpins,
  gridModel,
  sweep,
  twoColorGrid,
  u01,
  type PbitModel,
  type Schedule,
} from './lib'

// PLAN F12 (rev. 2) — the write-conflict panel. The 16×16 grid frozen at the
// instant one dispatch is issued: every spin being WRITTEN this instant wears
// a ring, and every wire that joins two ringed spins glows red — a write
// conflict, the honest discriminator between legal and illegal parallelism.
// Sequential: 1 writer, 0 conflicts. Chromatic: 128 writers, 0 conflicts —
// many spins move at once and it is still exact, which is why the state
// graph's multi-spin chords could never convict anyone. Synchronous: 256
// writers, 480 conflicts — every wire on the board.
//
// Freeze-frame on purpose (PLAN risk 5): the count is a fact about the
// dispatch, not an animation. The state shown is a deterministic warm-up run
// so the lattice wears natural domains; the toggle changes only whose turn
// the frozen instant is.

const GW = 16
const GH = 16
const BETA = 0.45
const SEED = 131
/** Sequential's one writer this instant — a mid-grid site, mid-sweep. */
const SEQ_SITE = 7 * GW + 7

export function conflictGridModel(): PbitModel {
  return gridModel(GW, GH, 1, BETA)
}

export type ConflictKind = 'sequential' | 'chromatic' | 'synchronous'

/**
 * The set of spins a schedule writes in one dispatch instant. Computed from
 * the schedule's own definition (scan position / color class / everything),
 * never hand-typed — the check script and the canvas both read this.
 */
export function writtenSites(m: PbitModel, kind: ConflictKind, colors: Uint8Array): boolean[] {
  const w = new Array<boolean>(m.n).fill(false)
  switch (kind) {
    case 'sequential':
      w[SEQ_SITE] = true
      return w
    case 'chromatic':
      for (let i = 0; i < m.n; i++) w[i] = m.clamp[i] === 0 && colors[i] === 0
      return w
    case 'synchronous':
      for (let i = 0; i < m.n; i++) w[i] = m.clamp[i] === 0
      return w
  }
}

/** Edges whose two ends are written in the same instant. */
export function conflictEdges(m: PbitModel, written: boolean[]): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (const { i, j } of m.edges) if (written[i] && written[j]) out.push([i, j])
  return out
}

export interface ConflictShared {
  kind: ConflictKind
}

export function createWriteConflict(shared: { current: ConflictShared }): Stepper {
  const m = conflictGridModel()
  const colors = twoColorGrid(GW, GH)
  buildChromatic(m, colors, 2) // proves the coloring is legal; throws otherwise
  // deterministic warm-up so the frozen lattice wears honest domains
  const s = freshSpins(m, SEED)
  const warm: Schedule = { kind: 'sequential' }
  for (let t = 1; t <= 60; t++) sweep(m, s, warm, (site, salt) => u01(SEED, t, site, salt))

  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const kind = shared.current.kind
      const written = writtenSites(m, kind, colors)
      const conflicts = conflictEdges(m, written)
      let writers = 0
      for (const b of written) if (b) writers++

      const cell = Math.min((w * 0.5) / GW, (h - 50) / GH)
      const gx = 24
      const gy = 34
      const px = (i: number): [number, number] => [
        gx + (i % GW) * cell + cell / 2,
        gy + Math.floor(i / GW) * cell + cell / 2,
      ]

      // wires first: quiet gray; a conflicted wire glows red on top
      ctx.strokeStyle = 'rgba(120,140,170,0.28)'
      ctx.lineWidth = 1
      for (const { i, j } of m.edges) {
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 2.2
      for (const [i, j] of conflicts) {
        const [x0, y0] = px(i)
        const [x1, y1] = px(j)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }

      // spins, and a ring on every spin being written this instant
      const r = Math.max(3, cell * 0.28)
      for (let i = 0; i < m.n; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = s[i] > 0 ? PALETTE.sUp : PALETTE.sDn
        ctx.fill()
        if (written[i]) {
          ctx.beginPath()
          ctx.arc(x, y, r + 2.5, 0, Math.PI * 2)
          ctx.strokeStyle = INK
          ctx.lineWidth = 1.6
          ctx.stroke()
        }
      }

      // the counters — the figure's whole claim, in two numbers
      const tx = gx + GW * cell + 36
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      ctx.fillText(`writing this instant: ${writers}`, tx, gy + 30)
      ctx.font = '600 26px ui-sans-serif, system-ui'
      ctx.fillStyle = conflicts.length > 0 ? '#dc2626' : INK
      ctx.fillText(`${conflicts.length}`, tx, gy + 72)
      ctx.font = FONT_METER
      ctx.fillText('write conflicts', tx, gy + 92)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`of ${m.edges.length} wires on the board`, tx, gy + 110)
      ctx.fillText('ring = being written · red wire = both ends written', gx, gy + GH * cell + 14)
    },
  }
}

const LABEL: Record<ConflictKind, string> = {
  sequential: 'one at a time',
  chromatic: 'red / black',
  synchronous: 'all at once',
}

export function WriteConflict({ chromatic = false }: { chromatic?: boolean }) {
  const kinds: ConflictKind[] = chromatic
    ? ['sequential', 'chromatic', 'synchronous']
    : ['sequential', 'synchronous']
  const [kind, setKind] = useState<ConflictKind>(chromatic ? 'chromatic' : 'sequential')
  const shared = useRef<ConflictShared>({ kind })
  shared.current.kind = kind

  return (
    <Sim height={300} animated={false} create={() => createWriteConflict(shared)}>
      {kinds.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setKind(k)}
          style={kind === k ? { fontWeight: 700 } : undefined}
        >
          {LABEL[k]}
        </button>
      ))}
    </Sim>
  )
}
