import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'
import {
  createTrainer,
  wFieldInto,
  yFieldInto,
  N_LEVELS,
  NV,
  TRAIN_DEFAULTS,
  type DenoiseModel,
  type Trainer,
} from './denoise'
import { GLYPH_LIST, GLYPH_SIDE, drawGlyph, hamming } from './glyphs'
import { PRETRAINED } from './pretrained'

// PLAN F30 = F1, THE HERO — a wall of forty independent 4×4 dream chains,
// every cell a p-bit being flipped by the same reverse-diffusion loop as F27,
// each chain on its own seed. Glyphs condense out of static across the
// population — never the same one twice, never in the same place, but
// recognizably from one family. Weights ship pretrained (pretrained.ts holds
// the provenance); the paint-box on the right lets the reader add a seventh
// glyph and retrain the whole stack in the browser — the identical trainer,
// chunked across frames — after which their glyph starts surfacing across the
// wall, marked with a ring when a chain lands within two pixels of it.

const COLS = 10
const CHAINS = COLS * 4
const SWEEPS = 6
const SWEEP_PERIOD = 0.09
const HOLD_MIN = 1.0
const HOLD_MAX = 2.2
const EPOCHS_PER_FRAME = 15

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f))

// Layout shared by draw() and the pointer handler so the paint-box hit zone
// cannot drift from where it is drawn. Narrow panes re-flow the same forty
// chains six columns wide and shrink the paint-box: measured 2026-08-06, the
// fixed 10-column layout left 3.7 px glyph cells at 360 px width (unreadable)
// with half the canvas empty below the wall; the 6-column re-flow doubles the
// cell and fills the pane.
function wallLayout(w: number, h: number) {
  const narrow = w < 520
  const cols = narrow ? 6 : COLS
  const rows = Math.ceil(CHAINS / cols)
  const pc = narrow ? 16 : 22 // paint-box pixel size
  const boxW = GLYPH_SIDE * pc + 24
  const cell = Math.min(
    (w - boxW - 40 - (cols - 1) * 6) / (cols * GLYPH_SIDE),
    (h - 56 - (rows - 1) * 6) / (rows * GLYPH_SIDE),
  )
  return { narrow, cols, pc, boxW, cell, bx: w - boxW - 8, top: 54 }
}

interface Chain {
  seedRun: number
  level: number
  sweepsDone: number
  y: Int8Array
  w: Int8Array
  x: Int8Array // clamped input of the current level
  done: Int8Array | null
  hold: number
  acc: number
}

export interface MosaicShared {
  painted: Int8Array // the reader's glyph, +1 ink / −1 blank
  wantTrain: boolean // set true to request a retrain on the current paint
  wantForget: boolean // set true to go back to the shipped six-glyph weights
}

export function freshPaint(): Int8Array {
  return new Int8Array(NV).fill(-1)
}

export interface MosaicProbe {
  finished: number
  withinFamily: number // hamming ≤ 3 of any training glyph
  matchPainted: number // hamming ≤ 2 of the reader's glyph (post-retrain)
  trainedOnPaint: boolean
}

export function createMosaicHero(
  shared: { current: MosaicShared },
  probe?: MosaicProbe,
  seed = 90210,
): Stepper {
  let models: DenoiseModel[] = PRETRAINED
  let glyphSet: Int8Array[] = GLYPH_LIST
  let trainer: Trainer | null = null
  let trainedOnPaint = false
  let frame = 0
  let finished = 0
  let withinFamily = 0
  let matchPainted = 0
  const fy = new Float64Array(NV)
  const fw = new Float64Array(4)

  const chains: Chain[] = Array.from({ length: CHAINS }, (_, c) => ({
    seedRun: c,
    level: 0,
    sweepsDone: 0,
    y: new Int8Array(NV),
    w: new Int8Array(4),
    x: new Int8Array(NV),
    done: null,
    hold: 0,
    acc: (c % 7) * 0.013, // desynchronize the wall
  }))

  const startChain = (ch: Chain) => {
    ch.seedRun += CHAINS
    ch.level = N_LEVELS
    ch.sweepsDone = 0
    ch.done = null
    for (let i = 0; i < NV; i++) ch.x[i] = u01(seed, ch.seedRun, i, 999) < 0.5 ? -1 : 1
    ch.y.set(ch.x)
    const m = models[ch.level - 1]
    wFieldInto(m, ch.y, fw)
    for (let k = 0; k < m.nh; k++) ch.w[k] = u01(seed, ch.seedRun, k, 3) < sigma2(fw[k]) ? 1 : -1
  }
  chains.forEach((ch, c) => {
    startChain(ch)
    // stagger the field so the wall doesn't breathe in lockstep
    ch.hold = -((c * 37) % 11) * 0.06
  })

  const finishStats = (done: Int8Array) => {
    finished++
    let near = NV
    for (const g of glyphSet) near = Math.min(near, hamming(done, g))
    if (near <= 3) withinFamily++
    if (trainedOnPaint && hamming(done, shared.current.painted) <= 2) matchPainted++
    if (probe) {
      probe.finished = finished
      probe.withinFamily = withinFamily
      probe.matchPainted = matchPainted
      probe.trainedOnPaint = trainedOnPaint
    }
  }

  return {
    step(dt) {
      frame++
      // retrain / forget requests from the controls
      if (shared.current.wantForget) {
        shared.current.wantForget = false
        trainer = null
        models = PRETRAINED
        glyphSet = GLYPH_LIST
        trainedOnPaint = false
        matchPainted = 0
      }
      if (shared.current.wantTrain) {
        shared.current.wantTrain = false
        glyphSet = [...GLYPH_LIST, Int8Array.from(shared.current.painted)]
        trainer = createTrainer(glyphSet, {
          ...TRAIN_DEFAULTS,
          nh: 4,
          sampler: { kind: 'chromatic' },
          seed: 7,
        })
        trainedOnPaint = false
        matchPainted = 0
      }
      if (trainer && trainer.epoch < TRAIN_DEFAULTS.epochs) {
        trainer.runEpochs(Math.min(EPOCHS_PER_FRAME, TRAIN_DEFAULTS.epochs - trainer.epoch))
        if (trainer.epoch >= TRAIN_DEFAULTS.epochs) {
          models = trainer.models
          trainedOnPaint = true
          if (probe) probe.trainedOnPaint = true
        }
      }
      for (const ch of chains) {
        if (ch.done) {
          ch.hold -= dt
          if (ch.hold <= 0) startChain(ch)
          continue
        }
        ch.acc += dt
        while (ch.acc >= SWEEP_PERIOD && !ch.done) {
          ch.acc -= SWEEP_PERIOD
          const m = models[ch.level - 1]
          const salt = ch.seedRun * 640 + ch.level * 64 + ch.sweepsDone
          yFieldInto(m, ch.x, ch.w, fy)
          for (let j = 0; j < NV; j++)
            ch.y[j] = u01(seed, salt, j, 1) < sigma2(fy[j]) ? 1 : -1
          wFieldInto(m, ch.y, fw)
          for (let k = 0; k < m.nh; k++)
            ch.w[k] = u01(seed, salt, k, 2) < sigma2(fw[k]) ? 1 : -1
          ch.sweepsDone++
          if (ch.sweepsDone >= SWEEPS) {
            ch.sweepsDone = 0
            ch.level--
            if (ch.level === 0) {
              ch.done = Int8Array.from(ch.y)
              ch.hold = HOLD_MIN + (HOLD_MAX - HOLD_MIN) * u01(seed, ch.seedRun, 0, 77)
              finishStats(ch.done)
            } else {
              ch.x.set(ch.y)
            }
          }
        }
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const { narrow, cols, pc, boxW, cell, bx, top } = wallLayout(w, h)
      const pane = GLYPH_SIDE * cell
      const gx = 16
      const gy = 34
      for (let c = 0; c < CHAINS; c++) {
        const ch = chains[c]
        const px = gx + (c % cols) * (pane + 6)
        const py = gy + Math.floor(c / cols) * (pane + 6)
        const s = ch.done ?? ch.y
        drawGlyph(ctx, px, py, cell, s, ch.done ? 1 : 0.55 + 0.15 * (N_LEVELS - ch.level))
        if (ch.done && trainedOnPaint && hamming(ch.done, shared.current.painted) <= 2) {
          ctx.strokeStyle = PALETTE.held
          ctx.lineWidth = 2
          ctx.strokeRect(px - 2, py - 2, pane + 3, pane + 3)
        }
      }
      // the paint-box
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText('yours', bx, 46)
      drawGlyph(ctx, bx, top, pc, shared.current.painted)
      ctx.strokeStyle = 'rgba(120,140,170,0.6)'
      ctx.lineWidth = 1
      for (let k = 0; k <= GLYPH_SIDE; k++) {
        ctx.beginPath()
        ctx.moveTo(bx + k * pc, top)
        ctx.lineTo(bx + k * pc, top + GLYPH_SIDE * pc)
        ctx.moveTo(bx, top + k * pc)
        ctx.lineTo(bx + GLYPH_SIDE * pc, top + k * pc)
        ctx.stroke()
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('tap to paint', bx, top + GLYPH_SIDE * pc + 16)
      if (trainer && trainer.epoch < TRAIN_DEFAULTS.epochs) {
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`training… ${trainer.epoch}/${TRAIN_DEFAULTS.epochs}`, bx, top + GLYPH_SIDE * pc + 34)
        ctx.fillRect(bx, top + GLYPH_SIDE * pc + 40, boxW * (trainer.epoch / TRAIN_DEFAULTS.epochs) * 0.8, 5)
      } else if (trainedOnPaint) {
        ctx.fillStyle = PALETTE.held
        ctx.fillText(narrow ? 'your weights' : 'running your weights', bx, top + GLYPH_SIDE * pc + 34)
      } else {
        ctx.fillText(narrow ? 'the shipped six' : 'running the shipped six', bx, top + GLYPH_SIDE * pc + 34)
      }
    },
  }
}

export function MosaicHero() {
  const shared = useRef<MosaicShared>({
    painted: freshPaint(),
    wantTrain: false,
    wantForget: false,
  })
  const [, bump] = useState(0)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { pc, bx, top } = wallLayout(rect.width, rect.height)
    const x = e.clientX - rect.left - bx
    const y = e.clientY - rect.top - top
    const cx = Math.floor(x / pc)
    const cy = Math.floor(y / pc)
    if (cx < 0 || cx >= GLYPH_SIDE || cy < 0 || cy >= GLYPH_SIDE) return
    const i = cy * GLYPH_SIDE + cx
    shared.current.painted[i] = (-shared.current.painted[i]) as 1 | -1
    bump((n) => n + 1)
  }

  return (
    <div className="sim-stir" onPointerDown={onPointer}>
      <Sim height={300} create={() => createMosaicHero(shared)}>
        <button
          type="button"
          onClick={() => {
            shared.current.wantTrain = true
          }}
        >
          train on yours
        </button>
        <button
          type="button"
          onClick={() => {
            shared.current.wantForget = true
          }}
        >
          back to the six
        </button>
      </Sim>
    </div>
  )
}
