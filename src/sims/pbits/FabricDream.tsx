import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { tvDistance, u01, drawLayerRail } from './lib'
import { corrError, N_LEVELS } from './denoise'
import { GLYPH8_LIST, GLYPH8_PIX, GLYPH8_SIDE, drawGlyph8, drawPane8Halo, hamming8, nearestGlyph8Distance } from './glyphs8'
import {
  PATCH_W,
  PATCH_H,
  dataFencedConditional,
  forwardChain8,
  modelFencedConditional,
  pairwiseCorr8,
  placeGlyph8,
  reverseStep8,
  sweepFabric,
  type FabricPlacement,
  type FabricSampler,
} from './denoiseFabric'
import { PRETRAINED8 } from './pretrained8'

// Part 3, PLAN F11 — 8×8 dreams, witnessed. The fabric-native model (weights
// shipped pretrained; provenance in pretrained8.ts — the 4×4 wall keeps the
// live paint-box job) dreams down its three levels ON the real 16×16 Z1 patch,
// drawn beside the filmstrip so the reader sees the same sample twice: as a
// picture forming, and as 256 physical p-bits flickering. Where Part 1's
// figures kept an exact ghost, this one keeps an epitaph: at 2⁶⁴ states the
// joint oracle is dead, and the meter row is the hierarchy of witnesses that
// survives it — each readout NAMES its witness and prints its number.
//
//   W1 fenced 2×2 exact conditional — model vs true reverse on a 4-pixel
//      window, both closed-form given the sampler's own context.
//   W2 pinned moments — pairwise ⟨y_a y_b⟩ of finished dreams vs the family.
//   W3 known-answer probe — corrupt a glyph, denoise it, count pixels astray.
//
// Knob: sweeps per level — Part 2's mixing budget, one last time, at the
// scale where it visibly matters (measured: mean distance to the nearest
// glyph 9.1 px at 6 sweeps vs 5.7 at 24, config sweep 2026-08-25).

const FENCE_PIX = [27, 28, 35, 36] // the central 2×2 pixel window
const FAMILY_PX = 10 // "family member" at 8×8: ≤10 of 64 px astray (≈ Part 1's 3/16)
const RECOVER_PX = 6 // known-answer success: within 6 px of the source glyph
const LEVEL_PERIOD = 0.45 // seconds of sim time per reverse level

export interface FabricDreamShared {
  sweeps: number
}

export interface FabricDreamProbe {
  finished: number
  withinFamily: number
  distSum: number
  /** running mean TV of W1 (as printed) */
  fencedTV: number
  /** W2 as printed (NaN until enough dreams) */
  momentsErr: number
  /** W3 counters (rate as printed = ok/total) */
  recoverOk: number
  recoverTotal: number
  /** layout self-report: the smallest glyph cell drawn, px */
  minCellPx: number
}

export function createFabricDream(
  shared: { current: FabricDreamShared },
  probe?: FabricDreamProbe,
): Stepper {
  const pl: FabricPlacement = placeGlyph8()
  const models = PRETRAINED8
  const chrom: FabricSampler = { kind: 'chromatic' }
  const dataCorr = pairwiseCorr8(GLYPH8_LIST)
  const seed = 2027

  // one dream in flight: frames built level by level, full patch state kept
  let run = 0
  let level = N_LEVELS // next level to descend (3 → 1); 0 = dream finished
  let frames: Int8Array[] = []
  let patch = new Int8Array(pl.g.n)
  let acc = 0

  // witness state
  const dreams: Int8Array[] = []
  let finished = 0
  let withinFamily = 0
  let distSum = 0
  let fencedSum = 0
  let fencedCount = 0
  let momentsErr = NaN
  let recoverOk = 0
  let recoverTotal = 0

  const startDream = () => {
    const x = new Int8Array(GLYPH8_PIX)
    for (let i = 0; i < GLYPH8_PIX; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
    frames = [x]
    level = N_LEVELS
    for (let i = 0; i < pl.g.n; i++) {
      const p = pl.pixOf[i]
      patch[i] = p >= 0 ? x[p] : u01(seed, run, i, 998) < 0.5 ? -1 : 1
    }
  }
  startDream()

  const descendOne = () => {
    const t = level
    const m = models[t - 1]
    const xt = frames[frames.length - 1]
    const sweeps = Math.max(1, Math.round(shared.current.sweeps))
    // same construction as reverseStep8, but the patch state stays visible
    for (let i = 0; i < pl.g.n; i++) {
      const p = pl.pixOf[i]
      patch[i] = p >= 0 ? xt[p] : u01(seed, run * 16 + t, i, 3) < 0.5 ? -1 : 1
    }
    for (let sw = 0; sw < 2; sw++)
      sweepFabric(m, pl, xt, patch, false, chrom, (site, salt) => u01(seed, run * 16 + t, site, sw * 8 + 200 + salt))
    for (let sw = 0; sw < sweeps; sw++)
      sweepFabric(m, pl, xt, patch, true, chrom, (site, salt) => u01(seed, run * 16 + t, site, sw * 8 + 16 + salt))
    const y = new Int8Array(GLYPH8_PIX)
    for (let p = 0; p < GLYPH8_PIX; p++) y[p] = patch[pl.visible[p]]
    frames.push(y)
    level--
    if (level === 0) finishDream(xt, y)
  }

  const finishDream = (x1: Int8Array, x0: Int8Array) => {
    finished++
    const d = nearestGlyph8Distance(x0)
    distSum += d
    if (d <= FAMILY_PX) withinFamily++
    // W1: the last level's window, model vs truth, given the state we hold
    fencedSum += tvDistance(
      modelFencedConditional(models[0], pl, x1, patch, FENCE_PIX),
      dataFencedConditional(GLYPH8_LIST, 1, x1, x0, FENCE_PIX),
    )
    fencedCount++
    // W2: rolling moment error over the last 300 dreams, refreshed every 5
    dreams.push(x0)
    if (dreams.length > 300) dreams.shift()
    if (dreams.length >= 30 && finished % 5 === 0)
      momentsErr = corrError(pairwiseCorr8(dreams), dataCorr)
    // W3: every third dream, one known-answer probe at the current budget
    if (finished % 3 === 0) {
      const g = GLYPH8_LIST[recoverTotal % GLYPH8_LIST.length]
      const fr = forwardChain8(g, 777, recoverTotal)
      let x = fr[2]
      const sweeps = Math.max(1, Math.round(shared.current.sweeps))
      for (let t = 2; t >= 1; t--) x = reverseStep8(models[t - 1], pl, x, sweeps, 555, recoverTotal * 8 + t)
      recoverTotal++
      if (hamming8(x, g) <= RECOVER_PX) recoverOk++
    }
    run++
  }

  const syncProbe = (minCellPx: number) => {
    if (!probe) return
    probe.finished = finished
    probe.withinFamily = withinFamily
    probe.distSum = distSum
    probe.fencedTV = fencedCount ? fencedSum / fencedCount : NaN
    probe.momentsErr = momentsErr
    probe.recoverOk = recoverOk
    probe.recoverTotal = recoverTotal
    probe.minCellPx = minCellPx
  }

  const drawFabric = (ctx: CanvasRenderingContext2D, r: Rect, cell: number) => {
    paneFrame(ctx, { x: r.x - 4, y: r.y - 4, w: PATCH_W * cell + 8, h: PATCH_H * cell + 8 })
    for (let i = 0; i < pl.g.n; i++) {
      const x = r.x + (i % PATCH_W) * cell
      const y = r.y + Math.floor(i / PATCH_W) * cell
      const ink = patch[i] > 0 ? PALETTE.sUp : PALETTE.sDn
      if (pl.pixOf[i] >= 0) {
        ctx.fillStyle = ink
        ctx.fillRect(x, y, cell - 1, cell - 1)
      } else {
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, Math.max(1.6, cell * 0.18), 0, Math.PI * 2)
        ctx.fillStyle = ink
        ctx.globalAlpha = 0.4
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
  }

  const drawStrip = (ctx: CanvasRenderingContext2D, x0: number, y0: number, cell: number) => {
    const labels = ['x₃ = coins', 'x₂', 'x₁', 'x₀']
    const paneW = GLYPH8_SIDE * cell
    for (let f = 0; f <= N_LEVELS; f++) {
      const px = x0 + f * (paneW + 14)
      const have = f < frames.length
      if (have) drawGlyph8(ctx, px, y0, cell, frames[f])
      else {
        paneFrame(ctx, { x: px, y: y0, w: paneW, h: paneW })
      }
      // the pane currently being consumed as clamped evidence wears the halo
      if (level > 0 && f === frames.length - 1) drawPane8Halo(ctx, px, y0, cell)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(labels[f], px, y0 + paneW + 12)
    }
  }

  const drawWitnesses = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    lineH: number,
    narrow: boolean,
  ) => {
    ctx.font = FONT_METER
    ctx.fillStyle = PALETTE.meter
    const w1 = fencedCount ? fmt(fencedSum / fencedCount, 3) : '—'
    const w2 = Number.isFinite(momentsErr) ? fmt(momentsErr, 3) : '—'
    const w3 = recoverTotal ? `${recoverOk}/${recoverTotal}` : '—'
    ctx.fillText(narrow ? `fenced 2×2 TV ${w1}` : `witness — fenced 2×2 exact conditional: TV ${w1}`, x, y)
    ctx.fillText(narrow ? `moments err ${w2}` : `witness — pinned moments ⟨y·y⟩: err ${w2}`, x, y + lineH)
    ctx.fillText(
      narrow ? `recovery ${w3}` : `witness — known-answer recovery (≤${RECOVER_PX} px): ${w3}`,
      x,
      y + 2 * lineH,
    )
    ctx.font = FONT_LABEL
    ctx.fillStyle = 'rgba(85,96,111,0.9)'
    ctx.fillText(
      narrow ? 'joint oracle: dead (2^64)' : 'joint oracle: dead (2^64 states) — the witnesses are on duty',
      x,
      y + 3 * lineH,
    )
  }

  return {
    step(dt: number) {
      acc += dt
      while (acc >= LEVEL_PERIOD) {
        acc -= LEVEL_PERIOD
        if (level === 0) startDream()
        else descendOne()
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const narrow = w < 520
      if (!narrow) {
        const cellFab = 11
        const cellFilm = 9
        drawFabric(ctx, { x: 20, y: 42, w: 0, h: 0 }, cellFab)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('the fabric patch: 16×16 torus', 20, 42 + PATCH_H * cellFab + 18)
        ctx.fillText('squares = pixels (one color class)', 20, 42 + PATCH_H * cellFab + 31)
        ctx.fillText('dots = hidden, BFS layers 1–2', 20, 42 + PATCH_H * cellFab + 44)
        drawStrip(ctx, 236, 46, cellFilm)
        drawWitnesses(ctx, 236, 150, 16, false)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(`dreams finished: ${finished} · ${withinFamily} within ${FAMILY_PX} px of a glyph`, 236, 218)
        syncProbe(Math.min(cellFab, cellFilm))
      } else {
        const cellFilm = 8
        drawStrip(ctx, 12, 40, cellFilm)
        const cellFab = 7
        drawFabric(ctx, { x: 14, y: 138, w: 0, h: 0 }, cellFab)
        drawWitnesses(ctx, 132, 152, 15, true)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(`${finished} dreams · ${withinFamily} in family`, 132, 152 + 4 * 15)
        ctx.fillText('16×16 patch: squares = pixels,', 132, 152 + 5 * 15 + 4)
        ctx.fillText('dots = hidden layers', 132, 152 + 6 * 15 + 4)
        syncProbe(cellFab)
      }
    },
  }
}

export function FabricDream() {
  const [sweeps, setSweeps] = useState(24)
  const shared = useRef<FabricDreamShared>({ sweeps })
  shared.current.sweeps = sweeps

  return (
    <Sim height={300} create={() => createFabricDream(shared)}>
      <label>
        sweeps per level: {sweeps}
        <input
          type="range"
          min={2}
          max={48}
          step={1}
          value={sweeps}
          onChange={(e) => setSweeps(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
