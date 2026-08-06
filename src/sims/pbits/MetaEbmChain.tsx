import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, clipPane, fmt, paneFrame, type Rect } from '../lib/chrome'
import { countsToProbs, drawMeter, stateIndex, tvDistance, u01, drawLayerRail } from './lib'
import {
  META_D,
  buildMetaModel,
  compileMeta,
  enumerateMeta,
  marginalize,
  projSites,
  sweepExactCompiled,
  sweepExactTarget,
  sweepSampledCompiled,
  type CompiledMeta,
} from './metaEbm'

// PLAN F16 — the compiled chain sampling the model the fabric cannot say.
// Left: live sampled occupancy of the compiled per-site kernels against the
// exact law's ghost, on the 4-site marginal that carries the most three-body
// terms (4096 bars are unreadable; the projection is where sampled evidence
// and exact law meet honestly). Middle: the papers' saturation quantity —
// δ̃_t = TV(compiled chain, ideal Gibbs chain) over the full 4096 states,
// both propagated exactly — accumulating for a few sweeps and then sitting
// on a depth-independent floor (Thermalizers Eq (43): δ̃_t ≤ ε̄/(1−ρ₀)); a
// faint second curve shows the compiled chain's TV to the exact law, which
// keeps falling on the model's own slow mixing clock — the flat violet
// curve is compilation error, the falling gray one is mixing, and the knob
// moves only the first. Right: the ledger of what the fabric could not host
// natively. Compilation is over a fully connected spin set, the paper's own
// setting — the Z1 placement penalty is explicitly out of scope there
// ("not simulated", §IV D) and so carries no number here either.

const MODEL = buildMetaModel()
const EXACT = enumerateMeta(MODEL)
export const PROJ = projSites(MODEL)
const GHOST = marginalize(EXACT, META_D, PROJ)

const MAX_SWEEPS = 60
const N_CHAINS = 32
const SWEEPS_PER_SEC = 30

export interface MetaChainShared {
  jGate: number
}

export interface MetaChainProbe {
  tvMeter: number
  floor: number
  samples: number
  curveDone: boolean
}

export function createMetaEbmChain(
  shared: { current: MetaChainShared },
  probe?: MetaChainProbe,
  seed = 1615,
): Stepper {
  let jGate = shared.current.jGate
  let cm: CompiledMeta = compileMeta(MODEL, jGate)
  // exact propagation pair: compiled chain and ideal chain from uniform
  let pc = new Float64Array(1 << META_D).fill(1 / (1 << META_D))
  let pi = new Float64Array(1 << META_D).fill(1 / (1 << META_D))
  let dCurve: number[] = []
  let lawCurve: number[] = []
  // sampled chains and their marginal occupancy
  let chains: Int8Array[] = []
  let counts = new Float64Array(16)
  let sweepN = 0
  let acc = 0

  const reset = () => {
    jGate = shared.current.jGate
    cm = compileMeta(MODEL, jGate)
    pc = new Float64Array(1 << META_D).fill(1 / (1 << META_D))
    pi = new Float64Array(1 << META_D).fill(1 / (1 << META_D))
    dCurve = []
    lawCurve = []
    chains = Array.from({ length: N_CHAINS }, (_, c) =>
      Int8Array.from({ length: META_D }, (_, k) => (u01(seed, c, k, 3) < 0.5 ? -1 : 1)),
    )
    counts = new Float64Array(16)
    sweepN = 0
    acc = 0
  }
  reset()

  return {
    step(dt) {
      if (shared.current.jGate !== jGate) reset()
      // the exact curves draw themselves: one sweep of both chains per frame
      if (dCurve.length < MAX_SWEEPS) {
        sweepExactCompiled(cm, pc)
        sweepExactTarget(MODEL, pi)
        dCurve.push(tvDistance(pc, pi))
        lawCurve.push(tvDistance(pc, EXACT))
      }
      // the sampled chains run on their own fixed clock
      acc += dt * SWEEPS_PER_SEC
      acc = Math.min(acc, SWEEPS_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        chains.forEach((s, c) => {
          sweepSampledCompiled(cm, s, (site, salt) => u01(seed + 7, sweepN, site, salt * 131 + c))
          counts[stateIndex(s, PROJ)]++
        })
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')

      // --- left: occupancy vs exact ghost on the projection ---------------
      const mr: Rect = { x: 20, y: 46, w: w * 0.3, h: h - 116 }
      paneFrame(ctx, { x: mr.x - 8, y: mr.y - 10, w: mr.w + 16, h: mr.h + 24 })
      const total = counts.reduce((s, v) => s + v, 0)
      const tv = drawMeter(ctx, mr, GHOST, countsToProbs(counts), { samples: total })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText(`occupancy on spins {${PROJ.join(',')}}`, mr.x - 4, mr.y - 16)
      ctx.fillText('the marginal carrying the most 3-body terms', mr.x - 4, mr.y + mr.h + 32)

      // --- middle: δ̃ against the ideal chain, log scale ------------------
      const cp: Rect = { x: w * 0.4, y: 46, w: w * 0.28, h: h - 116 }
      paneFrame(ctx, cp)
      const floor = dCurve.length ? dCurve[dCurve.length - 1] : 0
      ctx.save()
      clipPane(ctx, cp)
      const LO = 1e-7
      const HI = 1
      const px = (t: number) => cp.x + (t / MAX_SWEEPS) * cp.w
      const py = (v: number) =>
        cp.y + cp.h * (1 - (Math.log(Math.max(v, LO)) - Math.log(LO)) / (Math.log(HI) - Math.log(LO)))
      const traceCurve = (vals: number[], color: string, width: number, alpha = 1) => {
        if (vals.length < 2) return
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.globalAlpha = alpha
        ctx.beginPath()
        vals.forEach((v, k) => {
          if (k === 0) ctx.moveTo(px(k + 1), py(v))
          else ctx.lineTo(px(k + 1), py(v))
        })
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      traceCurve(lawCurve, PALETTE.ghost, 1.2)
      traceCurve(dCurve, PALETTE.meter, 2)
      if (dCurve.length === MAX_SWEEPS) {
        ctx.strokeStyle = PALETTE.meter
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(cp.x, py(floor))
        ctx.lineTo(cp.x + cp.w, py(floor))
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('compiled vs ideal chain: error δ (violet) saturates', cp.x, cp.y - 16)
      ctx.fillText('gray: TV to the law itself, falling on the mixing clock', cp.x, cp.y + cp.h + 16)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      if (dCurve.length >= 3) {
        ctx.fillText(
          `floor ${floor < 1e-3 ? floor.toExponential(1) : fmt(floor, 3)} · ${fmt((100 * dCurve[2]) / Math.max(floor, 1e-12), 0)}% of it by sweep 3`,
          cp.x,
          cp.y + cp.h + 34,
        )
      }

      // --- right: the impossibility ledger --------------------------------
      const lx = w * 0.72
      let ly = 52
      const line = (s: string, strong = false) => {
        ctx.font = strong ? FONT_METER : FONT_LABEL
        ctx.fillStyle = strong ? '#1a1f2b' : 'rgba(85,96,111,0.95)'
        ctx.fillText(s, lx, ly)
        ly += strong ? 20 : 16
      }
      line('what the fabric cannot say', true)
      line(`· ${MODEL.pairs.length} pairwise terms (of 66 possible) —`)
      line('  its graph is not the fabric’s graph')
      line(`· ${MODEL.triples.length} three-body terms — native`)
      line('  support on any pairwise Ising: zero')
      line('· the fabric is bipartite: no triangles')
      ly += 8
      line('what the compiler spent', true)
      line(`· ${cm.hiddenSpins} soft-product hidden spins`)
      line(`  (≤ ${Math.max(...MODEL.tripleAt.map((t) => t.length))} per site kernel)`)
      line('· fully connected spin set, as in the')
      line('  paper — Z1 placement penalty not')
      line('  simulated there, so not priced here')
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`J_max = ${fmt(jGate, 1)}`, lx, h - 14)

      if (probe) {
        probe.tvMeter = tv
        probe.floor = floor
        probe.samples = total
        probe.curveDone = dCurve.length === MAX_SWEEPS
      }
    },
  }
}

export function MetaEbmChain() {
  const [jGate, setJGate] = useState(2.5)
  const shared = useRef<MetaChainShared>({ jGate })
  shared.current.jGate = jGate

  return (
    <Sim height={340} create={() => createMetaEbmChain(shared)}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        J_max
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={jGate}
          onChange={(e) => setJGate(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
