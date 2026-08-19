import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, freshSpins, sweep, u01, type PbitModel } from './lib'
import { z1Chromatic, z1Graph, z1Model, type Z1Graph } from './z1'

// Part 2, PLAN F13 with a minimal F12 embedding readout folded in. Cost
// model per the VERIFIED ledger (articles/06-z1-compiler/RESEARCH.md,
// Thermalizers §II B + Appendix B Table IV):
//   - readout "costs about as much ENERGY as 10²–10³ Gibbs iterations" —
//     an energy ratio, not a time cost; charged here at 300.
//   - coupling flashing: Appendix B quantifies E_read = 1.692 pJ/node vs
//     E_write = 153.6 pJ/node — flashing ≈ 91× readout per node. Charged
//     at 91 × 300 = 27,300 iteration-equivalents, labeled with its source.
//   - joules: §II B's ~3×10⁻¹⁰ J/iteration, cited AS an estimate and never
//     blended with Appendix B's per-node SPICE figure (the paper's own
//     refined number is ~6× higher; the two are kept apart by rule).
//   - the paper's constraint "no more than about once per second" on
//     re-flashing is a live rate readout that turns error-red when broken.
// The strip charges the reader's own actions in Gibbs-iteration equivalents
// FIRST — joules appear only as the labeled secondary conversion. Sweeps of
// a live Z1 patch accrue at one iteration each.
//
// The embedding readout: the §4 walk kernel (5 in + 3 hidden + 5 out logical
// spins, 55 logical couplings) placed on the real fabric patch, each logical
// wire routed as a shortest fabric path (BFS). Interior route cells are chain
// spins — physical cells the logical model never asked for. Overlapping
// routes are counted once, so the physical-per-logical counter is a floor,
// and its label says so.

export const READOUT_ITERS = 300
/** Appendix B Table IV: E_write/E_read = 153.6/1.692 ≈ 91× per node. */
export const REFLASH_OVER_READOUT = 91
export const REFLASH_ITERS = REFLASH_OVER_READOUT * READOUT_ITERS // 27,300
/** §II B estimate — cited as an estimate, never blended with Appendix B. */
export const JOULES_PER_ITER = 3e-10

/** The meter's whole arithmetic — the check holds the pixels to this. */
export function costTotal(sweeps: number, readouts: number, reflashes: number): number {
  return sweeps + readouts * READOUT_ITERS + reflashes * REFLASH_ITERS
}

// Greek μ (U+03BC), not the micro sign (U+00B5) — the micro sign is tofu in
// the headless check font while the Greek block (λ, τ, μ) renders everywhere.
export function fmtEnergy(joules: number): string {
  if (joules < 1e-6) return `${fmt(joules * 1e9, 1)} nJ`
  if (joules < 1e-3) return `${fmt(joules * 1e6, 1)} μJ`
  return `${fmt(joules * 1e3, 1)} mJ`
}

// --- the minimal F12 embedding ---------------------------------------------

const GW = 12
const GH = 12
const IN_ROWS = [1, 3, 5, 7, 9]
const HID_ROWS = [3, 5, 7]

export interface Embedding {
  g: Z1Graph
  ins: number[]
  hids: number[]
  outs: number[]
  /** Interior cells of the shortest routes — the chain spins, deduplicated. */
  chain: number[]
  physical: number
  perLogical: number
}

function bfsPath(g: Z1Graph, from: number, to: number): number[] {
  const parent = new Int32Array(g.n).fill(-2)
  parent[from] = -1
  const queue = [from]
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    if (i === to) break
    const nb = g.nbr[i]
    for (let k = 0; k < nb.length; k++) {
      if (parent[nb[k]] === -2) {
        parent[nb[k]] = i
        queue.push(nb[k])
      }
    }
  }
  const path: number[] = []
  for (let at = to; at !== -1; at = parent[at]) path.push(at)
  return path.reverse()
}

/** The walk kernel's 13 logical spins placed on the fabric, every logical
 *  coupling routed as a shortest fabric path. Deterministic, exact BFS. */
export function embedWalkKernel(): Embedding {
  const g = z1Graph(GW, GH)
  const ins = IN_ROWS.map((r) => r * GW + 2)
  const hids = HID_ROWS.map((r) => r * GW + 6)
  const outs = IN_ROWS.map((r) => r * GW + 10)
  const logical = new Set([...ins, ...hids, ...outs])
  const nets: Array<[number, number]> = []
  for (const a of ins) for (const b of outs) nets.push([a, b])
  for (const a of ins) for (const b of hids) nets.push([a, b])
  for (const a of hids) for (const b of outs) nets.push([a, b])
  const chainSet = new Set<number>()
  for (const [a, b] of nets) {
    const path = bfsPath(g, a, b)
    for (const cell of path) if (!logical.has(cell)) chainSet.add(cell)
  }
  const chain = [...chainSet].sort((x, y) => x - y)
  const physical = logical.size + chain.length
  return { g, ins, hids, outs, chain, physical, perLogical: physical / logical.size }
}

// --- the strip --------------------------------------------------------------

const BETA = 0.5
const SWEEPS_PER_SEC = 60

export interface CostShared {
  /** Monotone counters — the buttons only ever increment. */
  readouts: number
  reflashes: number
}

export interface CostProbe {
  total: number
  sweeps: number
  readouts: number
  reflashes: number
  perLogical: number
}

function patchModel(g: Z1Graph, flashSeed: number): PbitModel {
  return z1Model(g, BETA, (i, j) => (u01(flashSeed, i, j, 9) < 0.5 ? -0.4 : 0.4))
}

export function createCostStrip(shared: { current: CostShared }, probe?: CostProbe, seed = 29): Stepper {
  const emb = embedWalkKernel()
  const g = emb.g
  // Reset re-runs create: the meter starts from zero against whatever the
  // buttons' counters already read — no retroactive charges.
  const baseReadouts = shared.current.readouts
  const baseReflashes = shared.current.reflashes
  let flashSeed = seed
  let m = patchModel(g, flashSeed)
  let sched = z1Chromatic(m, g)
  const s = freshSpins(m, seed)
  let sweeps = 0
  let acc = 0
  let simTime = 0 // wall of THIS run — the reflash-rate limit is per second
  let lastReadouts = shared.current.readouts
  let lastReflashes = shared.current.reflashes
  let snapshot: Int8Array | null = null

  return {
    step(dt) {
      simTime += dt
      if (shared.current.readouts !== lastReadouts) {
        lastReadouts = shared.current.readouts
        snapshot = Int8Array.from(emb.outs.map((i) => s[i]))
      }
      if (shared.current.reflashes !== lastReflashes) {
        lastReflashes = shared.current.reflashes
        flashSeed++
        m = patchModel(g, flashSeed) // new couplings — the state re-equilibrates
        sched = z1Chromatic(m, g)
      }
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweeps++
        sweep(m, s, sched, (site, salt) => u01(flashSeed, sweeps, site, salt))
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const readouts = shared.current.readouts - baseReadouts
      const reflashes = shared.current.reflashes - baseReflashes
      const total = costTotal(sweeps, readouts, reflashes)
      if (probe) {
        probe.total = total
        probe.sweeps = sweeps
        probe.readouts = readouts
        probe.reflashes = reflashes
        probe.perLogical = emb.perLogical
      }

      // ---- left: the kernel on the fabric (minimal F12) ----------------------
      const lp: Rect = { x: 16, y: 34, w: w * 0.4, h: h - 96 }
      paneFrame(ctx, lp)
      const cell = Math.min(lp.w / GW, lp.h / GH)
      const px = (i: number): [number, number] => [
        lp.x + (i % GW) * cell + cell / 2,
        lp.y + Math.floor(i / GW) * cell + cell / 2,
      ]
      for (const c of emb.chain) {
        const [x, y] = px(c)
        ctx.fillStyle = PALETTE.ferro
        ctx.globalAlpha = 0.4
        ctx.fillRect(x - cell * 0.3, y - cell * 0.3, cell * 0.6, cell * 0.6)
        ctx.globalAlpha = 1
      }
      for (let i = 0; i < g.n; i++) {
        const [x, y] = px(i)
        ctx.beginPath()
        ctx.arc(x, y, cell * 0.18, 0, Math.PI * 2)
        ctx.fillStyle = s[i] > 0 ? PALETTE.sUp : PALETTE.sDn
        ctx.globalAlpha = 0.7
        ctx.fill()
        ctx.globalAlpha = 1
      }
      const halo = (cells: number[], ink: string) => {
        for (const i of cells) {
          const [x, y] = px(i)
          ctx.beginPath()
          ctx.arc(x, y, cell * 0.34, 0, Math.PI * 2)
          ctx.strokeStyle = ink
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
      // hidden halos wear the kernel partition's own hidden-role pink — one
      // ink per role across the whole lesson (anti-cyan until the palette
      // promotion, 2026-08-13)
      halo(emb.ins, PALETTE.held)
      halo(emb.hids, PALETTE.hid)
      halo(emb.outs, PALETTE.meter)
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(
        `13 logical → ${emb.physical} physical · ${fmt(emb.perLogical, 1)} per logical`,
        lp.x,
        lp.y + lp.h + 18,
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('chain cells: shortest routes, overlaps counted once — a floor', lp.x, lp.y + lp.h + 34)
      ctx.fillText('in (green) · hidden (pink) · out (violet)', lp.x, lp.y + lp.h + 48)

      // ---- right: the running bill ------------------------------------------
      // At mobile width the full explainer strings ran ~230px past the canvas
      // edge, hiding the bill — the figure's whole point (figure audit,
      // 2026-08-11). Narrow canvases get compressed wordings of the same facts.
      const narrow = w < 520
      const rx = w * 0.46
      ctx.font = narrow ? '600 15px ui-sans-serif, system-ui' : '600 20px ui-sans-serif, system-ui'
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(`iterations charged: ${total.toLocaleString()}`, rx, 58)
      ctx.font = narrow ? FONT_LABEL : FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(
        narrow
          ? `= ${sweeps.toLocaleString()} swp + ${readouts}×${READOUT_ITERS} read`
          : `= ${sweeps.toLocaleString()} sweeps + ${readouts} × ${READOUT_ITERS} readout + ${reflashes} × ${REFLASH_ITERS.toLocaleString()} reflash`,
        rx,
        82,
      )
      if (narrow) ctx.fillText(`  + ${reflashes}×${REFLASH_ITERS.toLocaleString()} reflash`, rx, 96)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      if (narrow) {
        ctx.fillText(`readout ≈ ${READOUT_ITERS} iters (§II B)`, rx, 114)
        ctx.fillText(`reflash ≈ ${REFLASH_OVER_READOUT}× readout (App. B)`, rx, 128)
      } else {
        ctx.fillText(`readout: energy of 10²–10³ iterations per read (§II B) — charged at ${READOUT_ITERS}`, rx, 102)
        ctx.fillText(
          `reflash: ≈${REFLASH_OVER_READOUT}× readout per node (Appendix B) — charged at ${REFLASH_ITERS.toLocaleString()}`,
          rx,
          118,
        )
      }
      const rate = simTime > 0 ? reflashes / simTime : 0
      ctx.fillStyle = rate > 1 ? PALETTE.ferro : 'rgba(85,96,111,0.9)'
      ctx.fillText(
        narrow
          ? `reflash rate ${fmt(rate, 2)}/s · limit ~1/s`
          : `reflash rate: ${fmt(rate, 2)}/s — paper's limit: about once per second`,
        rx,
        narrow ? 142 : 134,
      )
      ctx.font = narrow ? FONT_LABEL : FONT_METER
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(
        narrow
          ? `≈ ${fmtEnergy(total * JOULES_PER_ITER)} · ~3e-10 J/iter`
          : `≈ ${fmtEnergy(total * JOULES_PER_ITER)} · §II B estimate, ~3e-10 J/iteration`,
        rx,
        160,
      )

      // last readout — what those iterations bought
      const ry = 190
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      if (snapshot) {
        ctx.fillText(narrow ? `last readout:` : `last readout (what ${READOUT_ITERS} iterations bought):`, rx, ry)
        for (let k = 0; k < snapshot.length; k++) {
          ctx.beginPath()
          ctx.arc(rx + 10 + k * 26, ry + 18, 8, 0, Math.PI * 2)
          ctx.fillStyle = snapshot[k] > 0 ? PALETTE.sUp : PALETTE.sDn
          ctx.fill()
        }
      } else {
        ctx.fillText(narrow ? 'no readout yet — unobserved, unbilled' : 'no readout yet — the state runs unobserved (and unbilled)', rx, ry)
      }
    },
  }
}

export function CostStrip() {
  const [readouts, setReadouts] = useState(0)
  const [reflashes, setReflashes] = useState(0)
  const shared = useRef<CostShared>({ readouts, reflashes })
  shared.current.readouts = readouts
  shared.current.reflashes = reflashes

  return (
    <Sim height={300} create={() => createCostStrip(shared)}>
      <button type="button" onClick={() => setReadouts((r) => r + 1)}>
        read out the state (+{READOUT_ITERS})
      </button>
      <button type="button" onClick={() => setReflashes((f) => f + 1)}>
        reflash the couplings (+{REFLASH_ITERS.toLocaleString()})
      </button>
    </Sim>
  )
}
