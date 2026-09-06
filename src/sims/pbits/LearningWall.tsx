import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { N_LEVELS } from './denoise'
import { PATCH_W, PATCH_H, placeGlyph8, type FabricModel, type FabricPlacement } from './denoiseFabric'
import { GLYPH8_LIST, GLYPH8_PIX, GLYPH8_SIDE, drawGlyph8, nearestGlyph8Distance } from './glyphs8'
import { PRETRAINED8_SEED } from './pretrained8'
import {
  FAMILY_PX,
  K_SWEEPS,
  PROBE_DREAMS,
  TRAIN_EPOCHS,
  coinTossModels,
  coinsInto,
  createWorkerFeed,
  openLevel,
  readoutInto,
  sigOf,
  wallSweep,
  type Quality,
  type WeightFeed,
} from './learnFeed'

// THE SERIES' HERO, second version (2026-09-06) — the finale's object, shown
// first and shown learning. Twenty chains dream 8×8 pictures on real 16×16 Z1
// fabric patches (Part 3's fabric-native model, at FabricDream's 24-sweep
// budget — see learnFeed.ts for the measured budget table) while the same
// model TRAINS from coin-toss weights in a worker; every twenty epochs the new
// weights land and the wall dreams on them. What a first-time reader sees, in
// order: static; the seven pictures it is being shown; static condensing into
// those pictures; a curve falling. The internals ride alongside — one chain
// drawn as the 256 p-bits it is, the learning curve scored by forty fresh test
// dreams per point on the wall's own schedule, and the wall's own last twenty
// dreams scored the same way.
//
// The first version (MosaicHero: forty 4×4 chains on shipped weights, a
// paint-box) read as a grid of flicker with nothing to watch for — at 4×4 the
// glyphs are a bar, a box, a cross, and nothing on that canvas ever changed
// its behavior. This version keeps the ring: the wall returns billed at the
// end of Part 3 on the weights this trainer produces at PRETRAINED8_SEED
// (asserted bit-identical to pretrained8 in scripts/check-learningwall.ts).
//
// Chain count 20 and cell sizes follow BilledWall's legibility argument
// (8×8 panes need ≥7 px cells; 5×4 wide, 4×5 narrow).

const CHAINS = 20
const COLS_WIDE = 5
const COLS_NARROW = 4
const SWEEP_PERIOD = 0.0225 // 24 sweeps → 0.54 s per level (MosaicHero's cadence), ~3 s per dream with the hold
const HOLD_MIN = 1.0
const HOLD_MAX = 2.2
const RECENT = 20
const CURVE_TOP_PX = 32 // y-range of the learning curve, px wrong
const SET_CELL = 3

export interface LearningWallShared {
  wantRestart: boolean
}

export interface CurvePoint extends Quality {
  epoch: number
}

export interface LearningWallProbe {
  gen: number
  epoch: number
  epochs: number
  trainMs: number
  updatesApplied: number
  finished: number
  /** last RECENT finished dreams' distance to the nearest glyph */
  recent: number[]
  curve: CurvePoint[]
  /** finished dreams (run, 64-char sig), capped — for the schedule check */
  dreams: Array<{ run: number; sig: string }>
  minCellPx: number
}

export interface LearningWallLayout {
  narrow: boolean
  tight: boolean
  cell: number
  cols: number
  wall: Rect
  inset: Rect
  head: Rect
  curve: Rect
  set: Rect
  wallX: number
  wallY: number
  gap: number
  headX: number
}

export function learningWallLayout(w: number, h: number): LearningWallLayout {
  const narrow = w < 520
  const cols = narrow ? COLS_NARROW : COLS_WIDE
  const gap = narrow ? 5 : 6
  const margin = narrow ? 12 : 16
  const rightW = narrow ? 87 : 248
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
  const headW = w - headX - margin
  const head: Rect = { x: headX - 2, y: 28, w: headW + 2, h: h - 28 - 8 }
  const tight = !narrow && headW < 236
  const curve: Rect = narrow
    ? { x: margin, y: 356, w: w - 2 * margin, h: 44 }
    : { x: headX, y: 214, w: headW - 8, h: 78 }
  const set: Rect = narrow
    ? { x: headX, y: 170, w: 2 * (GLYPH8_SIDE * SET_CELL + 4), h: 4 * (GLYPH8_SIDE * SET_CELL + 4) }
    : { x: wallX, y: wallY + wallH + 22, w: 7 * (GLYPH8_SIDE * SET_CELL + 4), h: GLYPH8_SIDE * SET_CELL }
  return {
    narrow,
    tight,
    cell,
    cols,
    wall: { x: wallX - 4, y: wallY - 4, w: wallW + 8, h: wallH + 6 },
    inset: narrow ? { x: 0, y: 0, w: 0, h: 0 } : { x: headX - 4, y: 44, w: PATCH_W * 7 + 8, h: PATCH_H * 7 + 8 },
    head,
    curve,
    set,
    wallX,
    wallY,
    gap,
    headX,
  }
}

interface Chain8 {
  run: number
  level: number // levels left to descend; 0 = between dreams
  sweepsDone: number
  x: Int8Array
  patch: Int8Array
  done: Int8Array | null
  hold: number
  acc: number
}

export interface LearningWallOpts {
  /** The check harness passes an inline feed; the browser gets the worker. */
  feed?: (pl: FabricPlacement, gen: number, seed: number) => WeightFeed
}

export function createLearningWall(
  shared: { current: LearningWallShared },
  probe?: LearningWallProbe,
  seed = PRETRAINED8_SEED,
  opts: LearningWallOpts = {},
): Stepper {
  const pl = placeGlyph8()
  let gen = 0
  let trainSeed = seed
  let models: FabricModel[] = coinTossModels(pl, trainSeed)
  const makeFeed = opts.feed ?? ((_p, g, s) => createWorkerFeed({ gen: g, seed: s, epochs: TRAIN_EPOCHS }))
  const feed = makeFeed(pl, gen, trainSeed)
  let epoch = 0
  let epochs = TRAIN_EPOCHS
  let trainMs = 0
  let updatesApplied = 0
  let curve: CurvePoint[] = []

  let finished = 0
  const recent: number[] = []
  const dreams: Array<{ run: number; sig: string }> = []

  const chains: Chain8[] = Array.from({ length: CHAINS }, (_, c) => ({
    run: c - CHAINS,
    level: 0,
    sweepsDone: 0,
    x: new Int8Array(GLYPH8_PIX),
    patch: new Int8Array(pl.g.n),
    done: null,
    hold: ((c * 37) % 20) * 0.08, // 0..1.52 s pre-start stagger — the wall must not breathe in lockstep, nor sit empty at load
    acc: 0,
  }))

  const startChain = (ch: Chain8) => {
    ch.run += CHAINS
    ch.level = N_LEVELS
    ch.sweepsDone = 0
    ch.done = null
    coinsInto(seed, ch.run, ch.x)
  }

  const finishDream = (ch: Chain8, x0: Int8Array) => {
    finished++
    recent.push(nearestGlyph8Distance(x0))
    if (recent.length > RECENT) recent.shift()
    if (dreams.length < 400) dreams.push({ run: ch.run, sig: sigOf(x0) })
    ch.done = x0
    ch.hold = HOLD_MIN + (HOLD_MAX - HOLD_MIN) * ((ch.run * 7919) % 1000) / 1000
  }

  const tick = (ch: Chain8) => {
    const t = ch.level
    if (ch.sweepsDone === 0) openLevel(pl, ch.x, ch.patch, seed, ch.run, t)
    wallSweep(models[t - 1], pl, ch.x, ch.patch, seed, ch.run, t, ch.sweepsDone)
    ch.sweepsDone++
    if (ch.sweepsDone === K_SWEEPS) {
      const y = new Int8Array(GLYPH8_PIX)
      readoutInto(pl, ch.patch, y)
      ch.sweepsDone = 0
      ch.level--
      if (ch.level === 0) finishDream(ch, y)
      else ch.x = y
    }
  }

  const restart = () => {
    gen++
    trainSeed = seed + gen
    models = coinTossModels(pl, trainSeed)
    epoch = 0
    trainMs = 0
    curve = []
    recent.length = 0
    feed.restart(gen, trainSeed)
  }

  const recentMean = () => (recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : NaN)
  const recentFamily = () =>
    recent.length ? recent.filter((d) => d <= FAMILY_PX).length / recent.length : NaN

  const syncProbe = (minCellPx: number) => {
    if (!probe) return
    probe.gen = gen
    probe.epoch = epoch
    probe.epochs = epochs
    probe.trainMs = trainMs
    probe.updatesApplied = updatesApplied
    probe.finished = finished
    probe.recent = recent.slice()
    probe.curve = curve.slice()
    probe.dreams = dreams.slice()
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

  const drawCurve = (ctx: CanvasRenderingContext2D, r: Rect) => {
    paneFrame(ctx, r)
    const span = Math.max(epochs, 1) // a zero-epoch feed (checks only) must not map to NaN — skia panics on it
    const xOf = (e: number) => r.x + (e / span) * r.w
    const yOf = (px: number) => r.y + r.h - (Math.min(px, CURVE_TOP_PX) / CURVE_TOP_PX) * r.h
    // the family line — what "recognizable" means on this axis
    ctx.save()
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = PALETTE.ghost
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(r.x, yOf(FAMILY_PX))
    ctx.lineTo(r.x + r.w, yOf(FAMILY_PX))
    ctx.stroke()
    ctx.restore()
    if (curve.length) {
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 1.5
      ctx.beginPath()
      curve.forEach((p, i) => {
        const x = xOf(p.epoch)
        const y = yOf(p.meanPx)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      const last = curve[curve.length - 1]
      ctx.fillStyle = PALETTE.meter
      ctx.beginPath()
      ctx.arc(xOf(last.epoch), yOf(last.meanPx), 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.font = FONT_LABEL
    ctx.fillStyle = 'rgba(85,96,111,0.9)'
    ctx.textAlign = 'left'
    ctx.fillText(`${CURVE_TOP_PX}`, r.x + 3, r.y + 10)
    ctx.fillText('0', r.x + 3, r.y + r.h - 3)
    ctx.textAlign = 'right'
    ctx.fillText(`recognizable: ≤${FAMILY_PX} px`, r.x + r.w - 4, yOf(FAMILY_PX) - 3)
    ctx.textAlign = 'left'
  }

  const drawSet = (ctx: CanvasRenderingContext2D, r: Rect, perRow: number) => {
    const pitch = GLYPH8_SIDE * SET_CELL + 4
    GLYPH8_LIST.forEach((g, i) => {
      drawGlyph8(ctx, r.x + (i % perRow) * pitch, r.y + Math.floor(i / perRow) * pitch, SET_CELL, g)
    })
  }

  const secs = () => fmt(trainMs / 1000, 1)
  const training = () => epoch < epochs

  return {
    step(dt: number) {
      if (shared.current.wantRestart) {
        shared.current.wantRestart = false
        restart()
      }
      for (const u of feed.poll()) {
        if (u.gen !== gen) continue
        models = u.models
        epoch = u.epoch
        epochs = u.epochs
        trainMs = u.trainMs
        updatesApplied++
        curve.push({ epoch: u.epoch, meanPx: u.quality.meanPx, family: u.quality.family })
      }
      for (const ch of chains) {
        if (ch.done) {
          ch.hold -= dt
          if (ch.hold <= 0) startChain(ch)
          continue
        }
        if (ch.level === 0) {
          ch.hold -= dt
          if (ch.hold > 0) continue
          startChain(ch)
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
      const L = learningWallLayout(w, h)
      const pane = GLYPH8_SIDE * L.cell

      for (let c = 0; c < CHAINS; c++) {
        const ch = chains[c]
        const px = L.wallX + (c % L.cols) * (pane + L.gap)
        const py = L.wallY + Math.floor(c / L.cols) * (pane + L.gap)
        if (ch.done) {
          drawGlyph8(ctx, px, py, L.cell, ch.done)
        } else if (ch.level > 0) {
          let s = ch.x
          if (ch.sweepsDone > 0) {
            s = new Int8Array(GLYPH8_PIX)
            readoutInto(pl, ch.patch, s)
          }
          drawGlyph8(ctx, px, py, L.cell, s, 0.55 + 0.15 * (N_LEVELS - ch.level))
        }
      }

      const hx = L.headX
      const gray = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      const meanTxt = recent.length ? fmt(recentMean(), 1) : '—'
      const famTxt = recent.length ? `${Math.round(recentFamily() * 100)}%` : '—'
      if (!L.narrow) {
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText('one chain, seen as fabric (live)', hx, 40)
        drawInset(ctx, hx, 48, 7)
        ctx.fillText('squares = pixels · dots = hidden layers', hx, 174)
        ctx.fillText(`${CHAINS} chains · each a ${PATCH_W}×${PATCH_H} Z1 patch · ${K_SWEEPS} sweeps/level`, hx, 187)

        ctx.fillText(
          L.tight ? 'px wrong vs the nearest of the seven' : 'pixels wrong vs the nearest of the seven, per epoch',
          hx,
          208,
        )
        drawCurve(ctx, L.curve)
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        const axisY = L.curve.y + L.curve.h + 12
        ctx.fillText('epoch 0', L.curve.x, axisY)
        ctx.textAlign = 'center'
        ctx.fillText(`${PROBE_DREAMS} test dreams per point`, L.curve.x + L.curve.w / 2, axisY)
        ctx.textAlign = 'right'
        ctx.fillText(`${epochs}`, L.curve.x + L.curve.w, axisY)
        ctx.textAlign = 'left'

        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`epoch ${epoch} / ${epochs} · ${secs()} s`, hx, 326)
        ctx.font = FONT_LABEL
        ctx.fillStyle = INK
        ctx.fillText(
          training()
            ? L.tight
              ? 'training here, from coin-toss weights'
              : 'training here, on this page, from coin-toss weights'
            : L.tight
              ? 'trained here, from coin-toss weights'
              : 'trained here, on this page, from coin-toss weights',
          hx,
          342,
        )

        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`this wall: ${finished} dreams`, hx, 366)
        ctx.fillText(
          L.tight
            ? `last ${RECENT}: ${meanTxt} px · ${famTxt} in family`
            : `last ${RECENT}: mean ${meanTxt} px · ${famTxt} within ${FAMILY_PX} px`,
          hx,
          382,
        )

        // the seven it was shown, under the wall
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText('the seven pictures it is shown', L.set.x, L.set.y - 6)
        drawSet(ctx, L.set, 7)
      } else {
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText('epoch', hx, 44)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`${epoch}/${epochs}`, hx, 62)
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText(`${secs()} s`, hx, 76)
        ctx.fillText('this wall', hx, 98)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`${finished} dreams`, hx, 114)
        ctx.fillText(`${meanTxt} px mean`, hx, 128)
        ctx.fillText(`${famTxt} in family`, hx, 142)
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText('shown these:', hx, 164)
        drawSet(ctx, L.set, 2)
        ctx.fillStyle = INK
        ctx.fillText(training() ? 'training here' : 'trained here', hx, 300)
        ctx.fillText('from coin-toss', hx, 313)
        ctx.fillText('weights', hx, 326)
        ctx.fillStyle = gray
        ctx.fillText(`${K_SWEEPS} sweeps/level`, hx, 342)

        ctx.fillStyle = gray
        ctx.fillText('pixels wrong vs the nearest of the seven, per epoch', L.curve.x, L.curve.y - 6)
        drawCurve(ctx, L.curve)
        ctx.font = FONT_LABEL
        ctx.fillStyle = gray
        ctx.fillText('epoch 0', L.curve.x, L.curve.y + L.curve.h + 12)
        ctx.textAlign = 'right'
        ctx.fillText(`${epochs} · ${PROBE_DREAMS} test dreams/point`, L.curve.x + L.curve.w, L.curve.y + L.curve.h + 12)
        ctx.textAlign = 'left'
      }

      syncProbe(L.cell)
    },
    dispose() {
      feed.dispose()
    },
  }
}

export function LearningWall() {
  const shared = useRef<LearningWallShared>({ wantRestart: false })
  return (
    <Sim height={420} create={() => createLearningWall(shared)}>
      <button
        type="button"
        onClick={() => {
          shared.current.wantRestart = true
        }}
      >
        train again
      </button>
    </Sim>
  )
}
