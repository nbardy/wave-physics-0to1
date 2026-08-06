import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt } from '../lib/chrome'
import { drawLayerRail, tvDistance } from './lib'
import {
  corrError,
  createTrainer,
  dream,
  exactConditional,
  exactDataReverse,
  forwardChain,
  pairwiseCorr,
  N_LEVELS,
  TRAIN_DEFAULTS,
  type DenoiseModel,
  type Trainer,
} from './denoise'
import { GLYPH_LIST, GLYPH_SIDE, drawGlyph } from './glyphs'
import { PRETRAINED } from './pretrained'

// PLAN F28 + F29 — two dream rows, one honest and one impaired, generating
// side by side from the SAME reverse-chain procedure. The impairment is a sum
// type: 'factorized' strips the hidden units (nh = 0 — per-pixel right,
// jointly wrong, §3's two-coins failure at scale); 'synchronous' keeps the
// architecture but trains with the all-at-once schedule as its negative-phase
// sampler (§5's crime resurfacing inside learning). The challenger trains
// LIVE in the first seconds — chunked across frames so the page never stalls —
// with the same data, seeds, and budget as the reference row's shipped
// weights. Readouts are measured on the rows the reader is looking at:
// running pairwise-correlation error against the six glyphs for both modes,
// plus (synchronous mode) each model's exact single-step distance from the
// true reverse kernel, computed once when training lands.

export type CompareMode = 'factorized' | 'synchronous'

interface ModeSpec {
  refLabel: string
  challengerLabel: string
  makeChallenger: (seed: number) => Trainer
  /** F29 shows ONLY the exact kernel audit: on a strip this short the surface
   * correlation numbers can even favor the impaired row — which is the §5
   * point, and exactly why the readout there must be the oracle, not a
   * dream-strip statistic. F28's failure is visible in the strip itself, so
   * it carries the correlation readout instead. */
  auditKernels: boolean
}

const MODES: Record<CompareMode, ModeSpec> = {
  factorized: {
    refLabel: 'with hidden units',
    challengerLabel: 'no hidden units (factorized)',
    makeChallenger: (seed) =>
      createTrainer(GLYPH_LIST, {
        ...TRAIN_DEFAULTS,
        nh: 0,
        sampler: { kind: 'chromatic' },
        seed,
      }),
    auditKernels: false,
  },
  synchronous: {
    refLabel: 'negative phase red/black',
    challengerLabel: 'negative phase all-at-once',
    makeChallenger: (seed) =>
      createTrainer(GLYPH_LIST, {
        ...TRAIN_DEFAULTS,
        nh: 4,
        sampler: { kind: 'synchronous' },
        seed,
      }),
    auditKernels: true,
  },
}

const EPOCHS_PER_FRAME = 12
const DREAM_PERIOD = 0.5 // seconds between fresh dreams per row
const KEEP = 9
const DATA_CORR = pairwiseCorr(GLYPH_LIST)

interface Row {
  models: DenoiseModel[]
  label: string
  kept: Int8Array[]
  all: Int8Array[]
  corrErr: number
  kernelTV: number
}

export interface CompareProbe {
  trained: boolean
  refCorrErr: number
  chCorrErr: number
  refKernelTV: number
  chKernelTV: number
}

export function createDreamCompare(
  mode: CompareMode,
  probe?: CompareProbe,
  seed = 7, // matches the shipped weights' training seed — same data stream
): Stepper {
  const spec = MODES[mode]
  const trainer = spec.makeChallenger(seed)
  const rows: Row[] = [
    { models: PRETRAINED, label: spec.refLabel, kept: [], all: [], corrErr: NaN, kernelTV: NaN },
    { models: trainer.models, label: spec.challengerLabel, kept: [], all: [], corrErr: NaN, kernelTV: NaN },
  ]
  let acc = 0
  let runCounter = 0
  let audited = false

  const trained = () => trainer.epoch >= TRAIN_DEFAULTS.epochs

  return {
    step(dt) {
      if (!trained()) {
        trainer.runEpochs(Math.min(EPOCHS_PER_FRAME, TRAIN_DEFAULTS.epochs - trainer.epoch))
        if (probe) probe.trained = trained()
        return
      }
      if (spec.auditKernels && !audited) {
        audited = true
        // one-time exact audit: single-step kernel vs the true reverse, t = 3
        const probeX = forwardChain(GLYPH_LIST[1], 2024, 3)[3]
        const truth = exactDataReverse(GLYPH_LIST, 3, probeX)
        for (const row of rows)
          row.kernelTV = tvDistance(exactConditional(row.models[2], probeX), truth)
      }
      acc += dt
      while (acc >= DREAM_PERIOD) {
        acc -= DREAM_PERIOD
        runCounter++
        for (const row of rows) {
          const d = dream(row.models, seed * 13 + 4242, runCounter, 6)[N_LEVELS]
          row.kept.unshift(d)
          if (row.kept.length > KEEP) row.kept.pop()
          row.all.push(d)
          if (row.all.length >= 12 && row.all.length % 6 === 0)
            row.corrErr = corrError(pairwiseCorr(row.all), DATA_CORR)
        }
      }
      if (probe) {
        probe.trained = trained()
        probe.refCorrErr = rows[0].corrErr
        probe.chCorrErr = rows[1].corrErr
        probe.refKernelTV = rows[0].kernelTV
        probe.chKernelTV = rows[1].kernelTV
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, mode === 'factorized' ? 'energy' : 'sampler')
      if (!trained()) {
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(
          `training the ${spec.challengerLabel} model live — epoch ${trainer.epoch} of ${TRAIN_DEFAULTS.epochs}`,
          20,
          h / 2 - 8,
        )
        ctx.fillStyle = PALETTE.meter
        ctx.fillRect(20, h / 2 + 6, (w - 40) * (trainer.epoch / TRAIN_DEFAULTS.epochs), 6)
        ctx.strokeStyle = 'rgba(120,140,170,0.45)'
        ctx.strokeRect(20, h / 2 + 6, w - 40, 6)
        return
      }
      const sc = 10
      const paneW = GLYPH_SIDE * sc + 12
      rows.forEach((row, r) => {
        const ry = 40 + r * 96
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(row.label, 20, ry - 6)
        row.kept.forEach((d, i) => drawGlyph(ctx, 20 + i * paneW, ry, sc, d))
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.meter
        const bits: string[] = []
        if (!spec.auditKernels && !Number.isNaN(row.corrErr))
          bits.push(`pairwise-correlation error vs the six: ${fmt(row.corrErr, 3)}`)
        if (spec.auditKernels && !Number.isNaN(row.kernelTV))
          bits.push(`single-step distance from exact reverse (t=3): ${fmt(row.kernelTV, 3)}`)
        ctx.fillText(bits.join('    '), 20, ry + GLYPH_SIDE * sc + 14)
      })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('same chain, same sweeps, same seeds — only the weights differ', 20, h - 8)
    },
  }
}

export function DreamCompare({ mode }: { mode: CompareMode }) {
  const modeRef = useRef(mode)
  modeRef.current = mode
  return <Sim height={240} create={() => createDreamCompare(modeRef.current)} />
}
