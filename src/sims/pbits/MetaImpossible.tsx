import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'
import { z1Graph, type Z1Graph } from './z1'
import { buildMetaModel } from './metaEbm'

// PLAN F14 — the impossibility, drawn. The Act-IV target's wires laid over
// the real fabric: 12 logical spins placed on a Z1 torus patch, the target's
// 18 pairwise wires drawn between them — green where the wire lands on a
// native fabric edge, red-dashed where no direct wire exists — and its 20
// three-body hyperedges drawn as dotted triangles, every one flagged,
// because a pairwise Ising fabric has no hyperedge at ANY distance. The
// second leg of the impossibility is structural, not combinatorial: the
// fabric's odd-parity offsets make it bipartite, so it contains no
// triangles at all (verified verbatim, Thermalizers §IV D — "every
// Z1-realizable Ising model is an RBM-like bipartite model"). Re-rolling
// the placement changes which pairs get lucky; it can never change the
// three-body row, and that is the figure's point.

const FW = 12
const FH = 10
const PLACE_SEED = 1615

export interface MetaImpossibleShared {
  roll: number
}

export interface MetaImpossibleProbe {
  routable: number
}

/** 12 distinct fabric sites for the 12 logical spins, seeded by the roll. */
export function placeSpins(g: Z1Graph, d: number, roll: number): number[] {
  const chosen: number[] = []
  const seen = new Set<number>()
  let salt = 0
  while (chosen.length < d) {
    const i = Math.floor(u01(PLACE_SEED, roll, salt++, 0) * g.n)
    if (!seen.has(i)) {
      seen.add(i)
      chosen.push(i)
    }
  }
  return chosen
}

export function createMetaImpossible(
  shared: { current: MetaImpossibleShared },
  probe?: MetaImpossibleProbe,
): Stepper {
  const g = z1Graph(FW, FH)
  const model = buildMetaModel()
  const adjacent = (i: number, j: number) => g.nbr[i].includes(j)
  let lastRoll = -1
  let placed: number[] = []
  let routable: boolean[] = []

  const refresh = (roll: number) => {
    lastRoll = roll
    placed = placeSpins(g, model.d, roll)
    routable = model.pairs.map(({ m, n }) => adjacent(placed[m], placed[n]))
  }
  refresh(shared.current.roll)

  return {
    step() {
      if (shared.current.roll !== lastRoll) refresh(shared.current.roll)
    },
    draw(ctx, w, h) {
      if (shared.current.roll !== lastRoll) refresh(shared.current.roll)
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')

      const fp: Rect = { x: 16, y: 34, w: w * 0.58, h: h - 70 }
      paneFrame(ctx, fp)
      const cell = Math.min(fp.w / FW, fp.h / FH)
      const px = (i: number): [number, number] => [
        fp.x + (i % FW) * cell + cell / 2,
        fp.y + Math.floor(i / FW) * cell + cell / 2,
      ]
      // the fabric's own wires, faint (non-wrapping only — the torus wraps
      // are real but unreadable as chords; same choice as Z1Layers)
      ctx.strokeStyle = PALETTE.wall
      ctx.globalAlpha = 0.1
      ctx.lineWidth = 1
      for (const [i, j] of g.edges) {
        const [ax, ay] = px(i)
        const [bx, by] = px(j)
        if (Math.abs(ax - bx) > cell * 5 || Math.abs(ay - by) > cell * 5) continue
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      // fabric sites, checkerboard-colored as always
      for (let i = 0; i < g.n; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.14, 0, Math.PI * 2)
        ctx.fillStyle = g.colors[i] ? PALETTE.sDn : PALETTE.sUp
        ctx.globalAlpha = 0.4
        ctx.fill()
        ctx.globalAlpha = 1
      }
      // the 20 three-body hyperedges: dotted triangles, all flagged
      ctx.strokeStyle = PALETTE.ferro
      ctx.globalAlpha = 0.18
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      for (const { m, mp, n } of model.triples) {
        const [ax, ay] = px(placed[m])
        const [bx, by] = px(placed[mp])
        const [cx2, cy2] = px(placed[n])
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.lineTo(cx2, cy2)
        ctx.closePath()
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      // the 18 pairwise wires: landed vs flagged
      model.pairs.forEach(({ m, n }, k) => {
        const [ax, ay] = px(placed[m])
        const [bx, by] = px(placed[n])
        ctx.strokeStyle = routable[k] ? PALETTE.held : PALETTE.ferro
        ctx.lineWidth = routable[k] ? 2.2 : 1.4
        ctx.globalAlpha = routable[k] ? 0.9 : 0.65
        if (!routable[k]) ctx.setLineDash([5, 4])
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      })
      // the placed logical spins
      placed.forEach((site) => {
        const [x, y] = px(site)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.3, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 2.2
        ctx.stroke()
      })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText('the target’s wires over the die · green lands on a native wire, red has none', fp.x, fp.y + fp.h + 16)

      // ledger
      const lx = w * 0.66
      let ly = 56
      const nRoutable = routable.filter(Boolean).length
      const line = (s: string, strong = false, color?: string) => {
        ctx.font = strong ? FONT_METER : FONT_LABEL
        ctx.fillStyle = color ?? (strong ? '#1a1f2b' : 'rgba(85,96,111,0.95)')
        ctx.fillText(s, lx, ly)
        ly += strong ? 20 : 16
      }
      line('pairwise terms: 18', true)
      line(`· ${nRoutable} land on native wires`, false, PALETTE.held)
      line(`· ${18 - nRoutable} have no direct wire —`, false, PALETTE.ferro)
      line('  they would need routed chains')
      ly += 10
      line('three-body terms: 20', true)
      line('· native support: 0 of 20', false, PALETTE.ferro)
      line('· not a placement problem — a')
      line('  pairwise fabric has no hyperedge')
      line('  at any distance, and bipartite')
      line('  means no triangles exist at all')

      if (probe) probe.routable = nRoutable
    },
  }
}

export function MetaImpossible() {
  const [roll, setRoll] = useState(1)
  const shared = useRef<MetaImpossibleShared>({ roll })
  shared.current.roll = roll

  return (
    <Sim height={320} animated={false} create={() => createMetaImpossible(shared)}>
      <button type="button" onClick={() => setRoll((r) => r + 1)}>
        re-roll the placement
      </button>
    </Sim>
  )
}
