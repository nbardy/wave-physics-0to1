import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, tvDistance, u01 } from './lib'
import { N_LEVELS, NV } from './denoise'
import { N_IN, TAU_SPINS } from './denoiseCond'
import {
  JOULES_PER_ITER,
  opCost,
  perSample,
  drawBillStrip,
  type Bill,
  type ChainSpec,
  type Op,
  type SchedulePlan,
} from './part3lib'
import {
  PATCH_W,
  PATCH_H,
  dataFencedConditional,
  modelFencedConditional,
  placeGlyph8,
  sweepFabric,
  type FabricPlacement,
  type FabricSampler,
} from './denoiseFabric'
import { GLYPH8_LIST, GLYPH8_PIX, GLYPH8_SIDE, drawGlyph8, nearestGlyph8Distance } from './glyphs8'
import { PRETRAINED8 } from './pretrained8'

// Part 3, PLAN F1 = F13 — THE BILLED WALL, the series' hero and its ring-
// closer: Part 1's wall of dreams, third and last appearance, every chain now
// an 8×8 dream running on a real 16×16 Z1 fabric patch (pretrained8, the
// fabric-native model of F11), with the article's one new instrument bolted
// on: the bill. Every operation the wall performs is charged through
// part3lib's op alphabet the moment it happens — reflashes, clamps, sweeps,
// readouts — and the strip below accumulates them live.
//
// Two configs, one prop. `settled={false}` (the opening): the NAIVE schedule
// — every level of every dream swaps kernels, so a reflash fires every 0.54 s
// per chain, the reflash line item devours the strip, the once-per-second
// rate readout burns violation red, and the samples-per-joule slot prints the
// naive number outright — absurd but computed (07 PLAN DECISIONS #4).
// `settled` (the finale): the IDENTICAL wall — same seeds, same dreams, bit
// for bit — BILLED at the verdict schedule (batched + conditioned): one
// kernel, flashed once ever, its single setup flash amortized over 64-dream
// batches; the bill collapses by the measured ×7.94 and what remains is
// mostly the clamps — the floor no schedule escapes.
//
// SCOPE OF THE BIT-IDENTITY CLAIM (F1, adversarial review 2026-08-25): the
// dreams are bit-identical because BOTH modes run the same three specialist
// weights (PRETRAINED8) — settled changes only the loop order and the bill
// (COND_CHAIN prices the conditioned schedule's 18-node clamps; the
// conditioned kernel itself is billed, never run — one conditioned energy
// could not host three independent weight sets). Bit-identity is therefore
// a LOOP-REORDERING fact, exact as such; actually swapping the specialists
// for the trained conditioned kernel WOULD move the dreams, by the measured
// 4×4 accuracy factors (×1.20 middle, ×4.0 / ×7.5 at the ends —
// check-part3a). scripts/check-billedwall.ts asserts the dreams are
// bit-identical between the two modes as run.
//
// BILLING BASIS (the one modeling statement, printed on the canvas): each
// dream is billed as the ARTICLE'S canonical chain — T=3 levels, k=6 sweeps
// per level, one clamp + one readout per level, 16-pixel evidence clamp
// (+2 τ spins under the conditioned kernel) — the same chain every Act I–III
// figure priced and the same numbers check-part3a's MEASURED FACTS ledger
// binds prose to (naive 91,918 iters/dream → ~36,264 samples/J; conditioned
// amortized ~11,582 → ~287,801 samples/J; coordinator decision: Parts 2 and 3
// must print the same bill for the same act, and the hero must print the
// ledger's numbers the prose quotes). The wall RUNS exactly the schedule it
// bills — 6 patch sweeps per level, one clamp event, one readout — the only
// canonical-chain idealization is the clamp's node count (the 8×8 substrate
// re-clamps 64 pixels where the canonical chain prices 16; priced at 64 the
// naive bill would read 119,218 iters → 27,963 samples/J — same verdict,
// different constant; recorded here so a future editor sees the trade).
//
// Sweep budget within the billed k=6: 1 hidden-warm + 5 free sweeps.
// Measured 2026-08-25 (300 dreams, seed 2027): warm/free 1+5 gives mean
// nearest-glyph distance 11.5 px, 45% within 10 px, fenced 2×2 TV 0.398 —
// better than 2+4 (12.1 px, 38%, TV 0.482) at the same billed cost. Quality
// at k=6 is what k=6 honestly buys; the witness row prints it, identically,
// in both modes — the hero's claim is that the PRICE moves and the dreams do
// not, and that claim is exact.
//
// CHAIN COUNT: 20. Perf is not the binding constraint — measured 2026-08-25
// (bun, Apple Silicon): one full 3-level dream costs 0.31 ms of sweeps, so a
// level descent is ~0.10 ms and 20 staggered chains average well under
// 0.5 ms/frame stepping plus ~1 ms of drawing — hundreds of chains would hold
// 60 fps (and <Sim> freezes the wall off-screen anyway). The binding
// constraint is legibility: 8×8 panes need ≥7 px cells (house rule), and at
// 360 px width inside a 420 px canvas that is 4 columns × 5 rows with the
// bill strip un-mashed below. 20 chains fill both layouts exactly
// (5×4 wide, 4×5 narrow).

const CHAINS = 20
const COLS_WIDE = 5
const COLS_NARROW = 4
const WARM_SWEEPS = 1
const FREE_SWEEPS = 5
/** The ledger's k — the billed and the actually-run sweeps per level. */
const K_SWEEPS = WARM_SWEEPS + FREE_SWEEPS
const SWEEP_PERIOD = 0.09 // MosaicHero's cadence: 6 sweeps → 0.54 s per level
const HOLD_MIN = 1.0
const HOLD_MAX = 2.2
const FENCE_PIX = [27, 28, 35, 36] // FabricDream's central 2×2 witness window
const FAMILY_PX = 10
/** The ledger's amortization point: the batched+conditioned schedule's one
 *  setup flash spread over 64-dream batches (check-part3a MEASURED FACTS #1b). */
export const AMORTIZE_BATCH = 64
const RATE_WINDOW = 1.0 // seconds — the once-per-second rule's own horizon

/** The article's canonical billed chain (naive: specialist kernels, 16-px
 *  evidence clamp) — identical to check-part3a's `specChain`. */
export const NAIVE_CHAIN: ChainSpec = { levels: N_LEVELS, sweepsPerLevel: K_SWEEPS, clampNodes: NV }
/** The conditioned kernel's chain: the τ code rides the clamp (18 nodes). */
export const COND_CHAIN: ChainSpec = { levels: N_LEVELS, sweepsPerLevel: K_SWEEPS, clampNodes: N_IN }

export const naivePlan = (samples: number): SchedulePlan => ({
  kind: 'naive',
  chain: NAIVE_CHAIN,
  samples,
})
export const settledPlan = (samples: number): SchedulePlan => ({
  kind: 'conditioned',
  chain: COND_CHAIN,
  samples,
})

type WallMode = { kind: 'naive' } | { kind: 'settled' }

/** Ops charged once, when the wall starts: the settled schedule's one flash
 *  ever. (It is charged to the bill but not to the rate readout — the rate
 *  meters RECURRING reflashes against the once-per-second rule; the setup
 *  flash happened once, at commissioning.) */
function setupOps(mode: WallMode): Op[] {
  switch (mode.kind) {
    case 'naive':
      return []
    case 'settled':
      return [{ kind: 'reflash' }]
  }
}

/** Ops charged when a chain opens a level: naive swaps kernels every level. */
function levelOpenOps(mode: WallMode): Op[] {
  switch (mode.kind) {
    case 'naive':
      return [{ kind: 'reflash' }, { kind: 'clamp', nodes: NAIVE_CHAIN.clampNodes }]
    case 'settled':
      return [{ kind: 'clamp', nodes: COND_CHAIN.clampNodes }]
  }
}

/** The printed per-dream price — pure part3lib arithmetic, never typed in. */
export function perDreamOf(mode: WallMode): number {
  switch (mode.kind) {
    case 'naive':
      return perSample(naivePlan(1))
    case 'settled':
      return perSample(settledPlan(AMORTIZE_BATCH))
  }
}

/** The headline: samples per joule under the §II B estimate. */
export function samplesPerJouleOf(mode: WallMode): number {
  return 1 / (perDreamOf(mode) * JOULES_PER_ITER)
}

export interface BilledWallProbe {
  finished: number
  withinFamily: number
  meanDist: number
  fencedTV: number
  /** finished dreams in completion order, 64-char '0'/'1' strings (capped) */
  dreamSigs: string[]
  bill: Bill
  perDream: number
  samplesPerJoule: number
  reflashRate: number
  /** accumulated-bill line-item shares, as the composition bar draws them */
  reflashShare: number
  clampShare: number
  minCellPx: number
}

export interface BilledWallLayout {
  narrow: boolean
  cell: number
  cols: number
  /** the wall of panes plus the fabric inset — identical across modes */
  wall: Rect
  inset: Rect
  /** the right-hand headline/witness column — mode-specific ink lives here */
  head: Rect
  /** the bill strip block (basis line included) */
  strip: Rect
  stripTextY: number
  wallX: number
  wallY: number
  gap: number
  headX: number
}

export function billedWallLayout(w: number, h: number): BilledWallLayout {
  const narrow = w < 520
  const cols = narrow ? COLS_NARROW : COLS_WIDE
  const gap = narrow ? 5 : 6
  const margin = narrow ? 12 : 16
  const rightW = narrow ? 96 : 248
  const cell = Math.max(
    7,
    Math.min(10, Math.floor((w - 2 * margin - rightW - (cols - 1) * gap - 8) / (cols * GLYPH8_SIDE))),
  )
  const pane = GLYPH8_SIDE * cell
  const rows = Math.ceil(CHAINS / cols)
  const wallW = cols * pane + (cols - 1) * gap
  const wallH = rows * pane + (rows - 1) * gap
  const wallX = margin
  const wallY = 34
  const headX = wallX + wallW + (narrow ? 10 : 16)
  const stripTextY = narrow ? h - 56 : h - 50
  return {
    narrow,
    cell,
    cols,
    wall: { x: wallX - 4, y: wallY - 4, w: wallW + 8, h: wallH + 6 },
    inset: narrow
      ? { x: 0, y: 0, w: 0, h: 0 }
      : { x: headX - 4, y: 44, w: PATCH_W * 7 + 8, h: PATCH_H * 7 + 8 },
    head: { x: headX - 2, y: 28, w: w - headX - 4, h: (narrow ? h - 80 : h - 68) - 28 },
    strip: { x: margin - 4, y: stripTextY - 26, w: w - 2 * margin + 8, h: 26 + 46 + 6 },
    stripTextY,
    wallX,
    wallY,
    gap,
    headX,
  }
}

interface Chain8 {
  run: number
  level: number // levels left to descend; 0 = dream finished
  sweepsDone: number
  x: Int8Array // the current clamped evidence x_t (64 pixels)
  patch: Int8Array // the chain's own 256-node fabric state
  done: Int8Array | null
  hold: number
  acc: number
  dreams: number
}

export interface BilledWallOpts {
  /** For the check harness: stop each chain after this many dreams so the
   *  wall drains to a quiescent point where the accumulated bill must equal
   *  part3lib's composer for exactly `CHAINS × dreamsPerChain` samples. */
  dreamsPerChain?: number
}

const grp = (x: number) => Math.round(x).toLocaleString('en-US')

export function createBilledWall(
  settled: boolean,
  probe?: BilledWallProbe,
  seed = 2027,
  opts: BilledWallOpts = {},
): Stepper {
  const mode: WallMode = settled ? { kind: 'settled' } : { kind: 'naive' }
  const pl: FabricPlacement = placeGlyph8()
  const models = PRETRAINED8
  const chrom: FabricSampler = { kind: 'chromatic' }
  const maxDreams = opts.dreamsPerChain ?? Infinity

  // the running bill — every op charged through part3lib's price list
  const bill: Bill = {
    sweepIters: 0,
    readoutIters: 0,
    clampIters: 0,
    reflashIters: 0,
    total: 0,
    counts: { sweeps: 0, readouts: 0, clamps: 0, reflashes: 0 },
  }
  let simTime = 0
  const reflashTimes: number[] = []
  const charge = (ops: Op[], meterRate: boolean) => {
    for (const op of ops) {
      const c = opCost(op)
      bill.total += c
      switch (op.kind) {
        case 'sweep':
          bill.sweepIters += c
          bill.counts.sweeps += op.count
          break
        case 'readout':
          bill.readoutIters += c
          bill.counts.readouts++
          break
        case 'clamp':
          bill.clampIters += c
          bill.counts.clamps++
          break
        case 'reflash':
          bill.reflashIters += c
          bill.counts.reflashes++
          if (meterRate) reflashTimes.push(simTime)
          break
      }
    }
  }
  charge(setupOps(mode), false)

  // witness state — computed from the dreams alone, so it is identical
  // between the two modes by construction (and asserted by the check)
  let finished = 0
  let withinFamily = 0
  let distSum = 0
  let fencedSum = 0
  const sigs: string[] = []

  // Pre-start stagger spreads the chains across a full dream cycle so the
  // wall doesn't breathe (or reflash) in lockstep — MosaicHero's device.
  // Without it the whole wall holds at once and the naive rate readout dips
  // to ~3/s at cohort troughs; staggered it sits near the schedule's true
  // ~15–20 reflashes/s (20 chains × 3 levels / ~3.2 s cycle). Identical in
  // both modes, so dreams stay bit-identical.
  const chains: Chain8[] = Array.from({ length: CHAINS }, (_, c) => ({
    run: c - CHAINS, // startChain advances by CHAINS → first run = c
    level: 0,
    sweepsDone: 0,
    x: new Int8Array(GLYPH8_PIX),
    patch: new Int8Array(pl.g.n),
    done: null,
    hold: ((c * 37) % 20) * 0.16, // 0..3.04 s pre-start delay
    acc: 0,
    dreams: 0,
  }))

  const startChain = (ch: Chain8) => {
    ch.run += CHAINS
    ch.level = N_LEVELS
    ch.sweepsDone = 0
    ch.done = null
    for (let i = 0; i < GLYPH8_PIX; i++) ch.x[i] = u01(seed, ch.run, i, 999) < 0.5 ? -1 : 1
  }

  const beginLevel = (ch: Chain8) => {
    charge(levelOpenOps(mode), true)
    const t = ch.level
    for (let i = 0; i < pl.g.n; i++) {
      const p = pl.pixOf[i]
      ch.patch[i] = p >= 0 ? ch.x[p] : u01(seed, ch.run * 16 + t, i, 3) < 0.5 ? -1 : 1
    }
  }

  const finishDream = (ch: Chain8, x1: Int8Array, x0: Int8Array) => {
    finished++
    ch.dreams++
    const d = nearestGlyph8Distance(x0)
    distSum += d
    if (d <= FAMILY_PX) withinFamily++
    // W1 — the fenced 2×2 exact conditional at the last level, model vs the
    // true data reverse, given the state the sampler actually holds
    fencedSum += tvDistance(
      modelFencedConditional(models[0], pl, x1, ch.patch, FENCE_PIX),
      dataFencedConditional(GLYPH8_LIST, 1, x1, x0, FENCE_PIX),
    )
    if (sigs.length < 400) {
      let s = ''
      for (let p = 0; p < GLYPH8_PIX; p++) s += x0[p] > 0 ? '1' : '0'
      sigs.push(s)
    }
    ch.done = x0
    ch.hold = HOLD_MIN + (HOLD_MAX - HOLD_MIN) * u01(seed, ch.run, 0, 77)
  }

  /** One sweep tick — the wall runs exactly the schedule it bills. */
  const tick = (ch: Chain8) => {
    if (ch.sweepsDone === 0) beginLevel(ch)
    const t = ch.level
    const m = models[t - 1]
    if (ch.sweepsDone < WARM_SWEEPS) {
      const sw = ch.sweepsDone
      sweepFabric(m, pl, ch.x, ch.patch, false, chrom, (site, salt) =>
        u01(seed, ch.run * 16 + t, site, sw * 8 + 200 + salt),
      )
    } else {
      const sw = ch.sweepsDone - WARM_SWEEPS
      sweepFabric(m, pl, ch.x, ch.patch, true, chrom, (site, salt) =>
        u01(seed, ch.run * 16 + t, site, sw * 8 + 16 + salt),
      )
    }
    charge([{ kind: 'sweep', count: 1 }], false)
    ch.sweepsDone++
    if (ch.sweepsDone === K_SWEEPS) {
      charge([{ kind: 'readout' }], false)
      const y = new Int8Array(GLYPH8_PIX)
      for (let p = 0; p < GLYPH8_PIX; p++) y[p] = ch.patch[pl.visible[p]]
      ch.sweepsDone = 0
      ch.level--
      if (ch.level === 0) finishDream(ch, ch.x, y)
      else ch.x = y
    }
  }

  const reflashRate = () => {
    while (reflashTimes.length && reflashTimes[0] < simTime - RATE_WINDOW) reflashTimes.shift()
    return reflashTimes.length / RATE_WINDOW
  }

  const syncProbe = (minCellPx: number) => {
    if (!probe) return
    probe.finished = finished
    probe.withinFamily = withinFamily
    probe.meanDist = finished ? distSum / finished : NaN
    probe.fencedTV = finished ? fencedSum / finished : NaN
    probe.dreamSigs = sigs.slice()
    probe.bill = {
      ...bill,
      counts: { ...bill.counts },
    }
    probe.perDream = perDreamOf(mode)
    probe.samplesPerJoule = samplesPerJouleOf(mode)
    probe.reflashRate = reflashRate()
    probe.reflashShare = bill.total > 0 ? bill.reflashIters / bill.total : 0
    probe.clampShare = bill.total > 0 ? bill.clampIters / bill.total : 0
    probe.minCellPx = minCellPx
  }

  const drawInset = (ctx: CanvasRenderingContext2D, x0: number, y0: number, cell: number) => {
    paneFrame(ctx, { x: x0 - 4, y: y0 - 4, w: PATCH_W * cell + 8, h: PATCH_H * cell + 8 })
    const patch = chains[0].patch
    for (let i = 0; i < pl.g.n; i++) {
      const x = x0 + (i % PATCH_W) * cell
      const y = y0 + Math.floor(i / PATCH_W) * cell
      const ink = patch[i] > 0 ? PALETTE.sUp : PALETTE.sDn
      if (pl.pixOf[i] >= 0) {
        ctx.fillStyle = ink
        ctx.fillRect(x, y, cell - 1, cell - 1)
      } else {
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, Math.max(1.4, cell * 0.18), 0, Math.PI * 2)
        ctx.fillStyle = ink
        ctx.globalAlpha = 0.4
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
  }

  const headlineInk = mode.kind === 'naive' ? PALETTE.ferro : PALETTE.bill

  return {
    step(dt: number) {
      simTime += dt
      for (const ch of chains) {
        if (ch.done) {
          ch.hold -= dt
          if (ch.hold <= 0 && ch.dreams < maxDreams) startChain(ch)
          continue
        }
        if (ch.level === 0) {
          // pre-first-dream: wait out the stagger delay, then start
          ch.hold -= dt
          if (ch.hold > 0) continue
          if (ch.dreams < maxDreams) startChain(ch)
          else continue
        }
        ch.acc += dt
        while (ch.acc >= SWEEP_PERIOD && !ch.done) {
          ch.acc -= SWEEP_PERIOD
          tick(ch)
        }
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const L = billedWallLayout(w, h)
      const pane = GLYPH8_SIDE * L.cell

      // the wall — identical between modes, frame for frame
      for (let c = 0; c < CHAINS; c++) {
        const ch = chains[c]
        const px = L.wallX + (c % L.cols) * (pane + L.gap)
        const py = L.wallY + Math.floor(c / L.cols) * (pane + L.gap)
        if (ch.done) {
          drawGlyph8(ctx, px, py, L.cell, ch.done)
        } else if (ch.level > 0) {
          // mid-level (sweepsDone > 0) the pane shows the live patch pixels;
          // between levels it shows the freshly clamped evidence x_t
          let s = ch.x
          if (ch.sweepsDone > 0) {
            s = new Int8Array(GLYPH8_PIX)
            for (let p = 0; p < GLYPH8_PIX; p++) s[p] = ch.patch[pl.visible[p]]
          }
          drawGlyph8(ctx, px, py, L.cell, s, 0.55 + 0.15 * (N_LEVELS - ch.level))
        }
      }

      const hx = L.headX
      // 520–560 px panes hand the head column < 236 px — compress its wording
      // (the 360 layout has its own strings; measured against FONT_METER runs)
      const tight = !L.narrow && L.head.w < 236
      ctx.textAlign = 'left'
      if (!L.narrow) {
        // fabric inset: one chain seen as the 256 p-bits it actually is
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('one chain, seen as fabric (live)', hx, 40)
        drawInset(ctx, hx, 48, 7)
        ctx.fillText('squares = pixels · dots = hidden layers', hx, 174)
        ctx.fillText(`${CHAINS} chains · each a ${PATCH_W}×${PATCH_H} Z1 patch`, hx, 187)

        // the headline: samples per joule, computed from the bill model
        ctx.fillText(
          mode.kind === 'naive'
            ? tight
              ? 'samples/J — naive'
              : 'samples per joule — naive schedule'
            : tight
              ? 'samples/J — batched + cond.'
              : 'samples per joule — batched + conditioned',
          hx,
          212,
        )
        ctx.font = '700 20px ui-sans-serif, system-ui'
        ctx.fillStyle = headlineInk
        ctx.fillText(`${grp(samplesPerJouleOf(mode))} /J`, hx, 234)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(
          mode.kind === 'naive'
            ? tight
              ? `per dream: ${grp(perDreamOf(mode))} iters`
              : `per dream: ${grp(perDreamOf(mode))} iteration-equivalents`
            : tight
              ? `per dream (÷${AMORTIZE_BATCH} batch): ${grp(perDreamOf(mode))}`
              : `per dream, amortized over ${AMORTIZE_BATCH}-dream batches: ${grp(perDreamOf(mode))}`,
          hx,
          248,
        )

        // composition bar over the ACCUMULATED bill — amortization live
        const bw = L.head.w - 8
        const by = 256
        if (bill.total > 0) {
          const segs: Array<[number, number]> = [
            [bill.sweepIters, 0.35],
            [bill.readoutIters, 0.55],
            [bill.clampIters, 0.8],
            [bill.reflashIters, 1],
          ]
          let sx = hx
          ctx.fillStyle = PALETTE.bill
          for (const [iters, alpha] of segs) {
            const sw = (iters / bill.total) * bw
            ctx.globalAlpha = alpha
            ctx.fillRect(sx, by, Math.max(sw, iters > 0 ? 1 : 0), 10)
            ctx.globalAlpha = 1
            sx += sw
          }
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.bill
        ctx.fillText(
          mode.kind === 'naive'
            ? `reflash owns ${fmt((bill.reflashIters / Math.max(bill.total, 1)) * 100, 1)}% of the bill`
            : tight
              ? `clamps ${fmt((bill.clampIters / Math.max(bill.total, 1)) * 100, 1)}% — the floor`
              : `the clamps: ${fmt((bill.clampIters / Math.max(bill.total, 1)) * 100, 1)}% — the floor no schedule escapes`,
          hx,
          280,
        )
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(
          mode.kind === 'naive'
            ? tight
              ? 'the dreams are not in question:'
              : 'the price is in question — the dreams are not:'
            : tight
              ? 'same weights — dreams bit-identical:'
              : 'same weights, same seeds — bit-identical:',
          hx,
          296,
        )

        // the witness row — correctness on duty, identical in both modes
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        const tvs = finished ? fmt(fencedSum / finished, 3) : '—'
        ctx.fillText(tight ? `fenced 2×2 TV: ${tvs}` : `fenced 2×2 TV (model vs truth): ${tvs}`, hx, 314)
        ctx.fillText(
          tight
            ? `${finished} dreams · ${withinFamily} ≤${FAMILY_PX}px`
            : `${finished} dreams · ${withinFamily} within ${FAMILY_PX} px of a glyph`,
          hx,
          329,
        )
        ctx.fillText(
          tight
            ? `nearest glyph: ${finished ? fmt(distSum / finished, 1) : '—'} px mean`
            : `mean distance to nearest glyph: ${finished ? fmt(distSum / finished, 1) : '—'} px`,
          hx,
          344,
        )
      } else {
        // narrow mini-column
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('samples/J', hx, 44)
        ctx.font = '700 16px ui-sans-serif, system-ui'
        ctx.fillStyle = headlineInk
        ctx.fillText(grp(samplesPerJouleOf(mode)), hx, 62)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(mode.kind === 'naive' ? 'naive' : 'settled', hx, 76)
        ctx.fillStyle = PALETTE.meter
        const tvs = finished ? fmt(fencedSum / finished, 2) : '—'
        ctx.fillText(`2×2 TV ${tvs}`, hx, 98)
        ctx.fillText(`${finished} dreams`, hx, 112)
        ctx.fillText(`${withinFamily} in family`, hx, 126)
        ctx.fillText(`mean ${finished ? fmt(distSum / finished, 1) : '—'} px`, hx, 140)
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(mode.kind === 'naive' ? 'the dreams are' : 'same seeds, same', hx, 162)
        ctx.fillText(mode.kind === 'naive' ? 'not in question' : 'dreams — new bill', hx, 174)
        ctx.fillText(`${PATCH_W}×${PATCH_H} Z1 patch`, hx, 196)
        ctx.fillText('under each chain', hx, 208)
      }

      // billing basis + the strip
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      const basisY = L.stripTextY - 16
      ctx.fillText(
        mode.kind === 'naive'
          ? L.narrow
            ? `billed: the article's chain — T=${N_LEVELS} · k=${K_SWEEPS} · ${NV}-px clamp · reflash every level`
            : `billed per dream at the article's chain: T=${N_LEVELS} · k=${K_SWEEPS} · ${NV}-px clamp — and a reflash at EVERY level of EVERY dream`
          : L.narrow
            ? `billed: conditioned kernel — clamp ${NV}+${TAU_SPINS}τ px · one flash ever`
            : `billed at the article's chain: T=${N_LEVELS} · k=${K_SWEEPS} · clamp ${NV}+${TAU_SPINS}τ px · one flash ever — the dreams run the specialists`,
        L.wallX,
        basisY,
      )
      drawBillStrip(ctx, L.wallX, L.stripTextY, w - 2 * L.wallX, bill, {
        reflashRate: reflashRate(),
        headline: `${finished} dreams`,
      })

      syncProbe(L.cell)
    },
  }
}

export function BilledWall({ settled = false }: { settled?: boolean }) {
  return <Sim height={420} create={() => createBilledWall(settled)} />
}
