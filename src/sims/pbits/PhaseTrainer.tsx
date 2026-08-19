import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'
import { drawLayerRail, drawMeter, u01 } from './lib'
import {
  createTrainer,
  exactConditional,
  exactDataReverse,
  forwardChain,
  marginalPatch,
  wFieldInto,
  yFieldInto,
  TRAIN_DEFAULTS,
  type Trainer,
} from './denoise'
import { GLYPH_LIST, GLYPH_SIDE, drawGlyph, drawPaneHalo } from './glyphs'

// PLAN F26 — the two phases, one figure. A trainer runs live (one epoch every
// few frames, annealed, halting at the configured budget) while two display
// chains show what each phase IS: the data phase with x_t AND y clamped and
// only the hidden row flickering; the dream phase with only x_t clamped and
// (w, y) free-running under block Gibbs. The aligned-pair correlation strips
// accumulate per phase, their difference is the nudge, and an exact audit
// meter checks the learned kernel's 2×2-patch marginal against the true
// reverse kernel every few seconds (the oracle's last stand — the full 2^16
// joint is enumerated for the audit, and confessed as such in prose).
//
// PHASE TINTS — first appearance in the lesson (PLAN palette contract, §9).
// Deliberately derived from existing palette quantities rather than new hues:
// the data phase is the fully-CLAMPED phase, so it wears the held green at low
// alpha; the dream phase is the sampler running free, so it wears the meter
// violet at low alpha. ASSEMBLER NOTE: if these are promoted to
// sims/lib/palette.ts, suggested keys `phaseData` / `phaseDream`; prose can
// bind with <C k="held"> / <C k="meter"> meanwhile, so no palette edit is
// required.
export const TINT_DATA = 'rgba(5, 150, 105, 0.10)'
export const TINT_DREAM = 'rgba(124, 58, 237, 0.08)'

const PATCH: number[] = [5, 6, 9, 10] // the 2×2 center of the 4×4 — §5's auditable corner, again
const EPOCH_EVERY = 3 // frames between training epochs
const TRAIN_DELAY = 240 // frames of untrained watching first — the disagreement is visible before it falls
const PAIR_PERIOD = 1.0 // seconds a display pair stays on screen
const AUDIT_PERIOD = 6 // seconds between exact audits
const STRIP_EMA = 0.02

export interface PhaseShared {
  level: number // 1..3
}

export interface PhaseProbe {
  epoch: number
  disagreement: number
  /** Largest disagreement seen after the strip statistics warmed up. */
  peakDisagreement: number
  auditTV: number
}

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f))

export function createPhaseTrainer(
  shared: { current: PhaseShared },
  probe?: PhaseProbe,
  seed = 71,
): Stepper {
  const trainer: Trainer = createTrainer(GLYPH_LIST, {
    ...TRAIN_DEFAULTS,
    nh: 4,
    sampler: { kind: 'chromatic' },
    seed,
  })
  const nh = 4
  // display state
  let frame = 0
  let pairAcc = 0
  let pairRun = 0
  let x = forwardChain(GLYPH_LIST[0], seed + 1, 0)[shared.current.level]
  let yData = forwardChain(GLYPH_LIST[0], seed + 1, 0)[shared.current.level - 1]
  const wData = new Int8Array(nh)
  const yDream = Int8Array.from(yData)
  const wDream = new Int8Array(nh)
  const fy = new Float64Array(16)
  const fw = new Float64Array(nh)
  const corrP = new Float64Array(16)
  const corrM = new Float64Array(16)
  const spark: number[] = []
  let sparkAcc = 0
  let auditAcc = AUDIT_PERIOD - 1 // first audit ~1s in
  let audit: { model: Float64Array; truth: Float64Array } | null = null
  let lastLevel = shared.current.level
  // fixed audit probes, one per level; truth marginals cached lazily
  const probeX = [1, 2, 3].map((t) => forwardChain(GLYPH_LIST[1], 2024, t)[t])
  const truthPatch: Array<Float64Array | null> = [null, null, null]

  const freshPair = () => {
    const t = shared.current.level
    const frames = forwardChain(GLYPH_LIST[pairRun % GLYPH_LIST.length], seed + 1, pairRun)
    x = frames[t]
    yData = frames[t - 1]
    yDream.set(yData)
  }

  const model = () => trainer.models[shared.current.level - 1]

  return {
    step(dt) {
      frame++
      if (shared.current.level !== lastLevel) {
        lastLevel = shared.current.level
        corrP.fill(0)
        corrM.fill(0)
        spark.length = 0
        audit = null
        auditAcc = AUDIT_PERIOD - 0.5
        freshPair()
      }
      // the trainer: one epoch every few frames, until the budget is spent —
      // after a few seconds of watching the untrained phases disagree first
      if (frame > TRAIN_DELAY && frame % EPOCH_EVERY === 0 && trainer.epoch < TRAIN_DEFAULTS.epochs)
        trainer.runEpochs(1)
      // display pair rotation
      pairAcc += dt
      while (pairAcc >= PAIR_PERIOD) {
        pairAcc -= PAIR_PERIOD
        pairRun++
        freshPair()
      }
      const m = model()
      // data phase: w flickers under its exact conditional given the clamped y
      wFieldInto(m, yData, fw)
      for (let k = 0; k < nh; k++) wData[k] = u01(seed + 5, frame, k, 1) < sigma2(fw[k]) ? 1 : -1
      // dream phase: one block-Gibbs sweep per frame on (y, w)
      yFieldInto(m, x, wDream, fy)
      for (let j = 0; j < 16; j++) yDream[j] = u01(seed + 5, frame, j, 2) < sigma2(fy[j]) ? 1 : -1
      wFieldInto(m, yDream, fw)
      for (let k = 0; k < nh; k++) wDream[k] = u01(seed + 5, frame, k, 3) < sigma2(fw[k]) ? 1 : -1
      // strips: running per-phase statistics of the aligned pairs ⟨x_i y_i⟩
      for (let i = 0; i < 16; i++) {
        corrP[i] += STRIP_EMA * (x[i] * yData[i] - corrP[i])
        corrM[i] += STRIP_EMA * (x[i] * yDream[i] - corrM[i])
      }
      let d = 0
      for (let i = 0; i < 16; i++) d += Math.abs(corrP[i] - corrM[i])
      d /= 16
      sparkAcc += dt
      if (sparkAcc >= 0.25) {
        sparkAcc = 0
        spark.push(d)
        if (spark.length > 140) spark.shift()
      }
      // the exact audit, every few seconds
      auditAcc += dt
      if (auditAcc >= AUDIT_PERIOD) {
        auditAcc = 0
        const t = shared.current.level
        if (!truthPatch[t - 1])
          truthPatch[t - 1] = marginalPatch(exactDataReverse(GLYPH_LIST, t, probeX[t - 1]), PATCH)
        audit = {
          model: marginalPatch(exactConditional(m, probeX[t - 1]), PATCH),
          truth: truthPatch[t - 1] as Float64Array,
        }
      }
      if (probe) {
        probe.epoch = trainer.epoch
        probe.disagreement = d
        if (frame > 150 && d > (probe.peakDisagreement || 0)) probe.peakDisagreement = d
        if (audit) {
          let tv = 0
          for (let i = 0; i < 16; i++) tv += Math.abs(audit.model[i] - audit.truth[i])
          probe.auditTV = tv / 2
        }
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const cell = 14
      const pane = GLYPH_SIDE * cell

      // narrow: the dream pane's fixed x = 198 ran its 172px tint to 370 —
      // 10px past a 360px canvas (figure audit close-out item, 2026-08-17)
      const narrow = w < 520
      const paneW = narrow ? (w - 24) / 2 : 172
      const drawPhase = (
        px: number,
        tint: string,
        label: string,
        y: Int8Array,
        wRow: Int8Array,
        yHeld: boolean,
      ) => {
        ctx.fillStyle = tint
        ctx.fillRect(px, 30, paneW, 196)
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(label, px + 10, 48)
        // x pane (always clamped)
        drawGlyph(ctx, px + 14, 62, cell, x)
        drawPaneHalo(ctx, px + 14, 62, cell)
        // y pane
        drawGlyph(ctx, px + 100, 62, cell, y)
        if (yHeld) drawPaneHalo(ctx, px + 100, 62, cell)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('x held', px + 14, 62 + pane + 14)
        ctx.fillText(yHeld ? 'y held' : 'y free', px + 100, 62 + pane + 14)
        // hidden row
        for (let k = 0; k < nh; k++) {
          ctx.fillStyle = wRow[k] > 0 ? PALETTE.sUp : PALETTE.sDn
          ctx.fillRect(px + 44 + k * (cell + 4), 152, cell, cell)
        }
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('w — the hidden four, always free', px + 14, 186)
      }
      drawPhase(narrow ? 8 : 16, TINT_DATA, 'data phase', yData, wData, true)
      drawPhase(narrow ? 16 + paneW : 198, TINT_DREAM, 'dream phase', yDream, wDream, false)

      // strips — the two phases' statistics and their difference, the nudge
      const sy = 240
      const sq = 14
      const rows: Array<{ label: string; v: Float64Array | null }> = [
        { label: 'data  x·y', v: corrP },
        { label: 'dream x·y', v: corrM },
        { label: 'the nudge', v: null },
      ]
      rows.forEach((row, r) => {
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(row.label, 16, sy + r * (sq + 6) + 11)
        for (let i = 0; i < 16; i++) {
          const v = row.v ? row.v[i] : corrP[i] - corrM[i]
          ctx.fillStyle = row.v ? (v >= 0 ? PALETTE.ferro : PALETTE.anti) : PALETTE.meter
          ctx.globalAlpha = Math.min(1, Math.abs(v)) * 0.9 + 0.05
          ctx.fillRect(100 + i * (sq + 2), sy + r * (sq + 6), sq, sq)
          ctx.globalAlpha = 1
        }
      })

      // sparkline: the disagreement shrinking as the phases converge
      const sp = { x: 396, y: 40, w: 228, h: 64 }
      paneFrame(ctx, sp)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        trainer.epoch < TRAIN_DEFAULTS.epochs
          ? `epoch ${trainer.epoch} — phase disagreement`
          : `trained (${TRAIN_DEFAULTS.epochs} epochs) — phase disagreement`,
        sp.x,
        sp.y - 6,
      )
      if (spark.length > 1) {
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 1.6
        ctx.beginPath()
        const peak = Math.max(0.3, ...spark)
        spark.forEach((v, i) => {
          const px = sp.x + (i / 139) * sp.w
          const py = sp.y + sp.h - (v / peak) * (sp.h - 8) - 2
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        })
        ctx.stroke()
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(fmt(spark[spark.length - 1], 2), sp.x + sp.w - 34, sp.y + 14)
      }

      // audit meter: learned kernel vs exact reverse, on the auditable corner
      const mr = { x: 396, y: 148, w: 228, h: 96 }
      paneFrame(ctx, { x: mr.x - 8, y: mr.y - 10, w: mr.w + 16, h: mr.h + 24 })
      if (audit) {
        drawMeter(ctx, mr, audit.truth, audit.model, { label: '2×2 patch' })
      } else {
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('first exact audit shortly…', mr.x, mr.y + 40)
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('audit: learned kernel vs exact reverse', mr.x - 4, mr.y + mr.h + 26)
    },
  }
}

export function PhaseTrainer() {
  const [level, setLevel] = useState(2)
  const shared = useRef<PhaseShared>({ level })
  shared.current.level = level

  return (
    <Sim height={330} create={() => createPhaseTrainer(shared)}>
      {[1, 2, 3].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setLevel(t)}
          style={level === t ? { fontWeight: 700 } : undefined}
        >
          level {t}
        </button>
      ))}
    </Sim>
  )
}
