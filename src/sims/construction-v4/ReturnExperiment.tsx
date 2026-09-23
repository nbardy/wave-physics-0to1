import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE as C } from '../lib/palette'
import { label, panes, useLabHeight, INK, MUTED, PAPER, type Pane } from '../solver-lab/view'
import { exactDye, returnFrames, TOTAL_STEPS, STROKE_STEPS, STROKES, RETURN_DT, type Dye } from './transport'

export type RasterFactory = (n: number) => {
  canvas: CanvasImageSource
  context: Pick<CanvasRenderingContext2D, 'createImageData' | 'putImageData'>
}
export const browserRaster: RasterFactory = n => {
  const canvas = new OffscreenCanvas(n, n), context = canvas.getContext('2d')!
  return { canvas, context }
}

// The index-card preview runs in the browser and in the bun poster script
// (scripts/check-lesson-previews.ts), which shims `document.createElement` with
// a napi canvas but has no OffscreenCanvas. A DOM-created canvas works in both.
export const elementRaster: RasterFactory = n => {
  const canvas = document.createElement('canvas')
  canvas.width = n; canvas.height = n
  return { canvas, context: canvas.getContext('2d')! }
}

/** The hero at Returned on the 48² grid, for the lesson index card. */
export function createReturnPreview(): Stepper {
  return createReturnExperiment({ current: TOTAL_STEPS / 4 }, { current: 48 }, elementRaster)
}

export function dyeRaster(dye: Dye, n: number, factory: RasterFactory) {
  const raster = factory(n), image = raster.context.createImageData(n, n)
  for (let k = 0; k < n * n; k++) {
    const a = dye.amber[k], b = dye.rose[k], amount = Math.min(1, a + b), mix = b / Math.max(1e-12, a + b)
    image.data[4 * k] = 255 * (1 - amount) + (217 + 2 * mix) * amount
    image.data[4 * k + 1] = 255 * (1 - amount) + (119 - 80 * mix) * amount
    image.data[4 * k + 2] = 255 * (1 - amount) + (6 + 113 * mix) * amount
    image.data[4 * k + 3] = 255
  }
  raster.context.putImageData(image, 0, 0)
  return raster.canvas
}

export function overlap(dye: Dye, initial: Dye) {
  let shared = 0, total = 0
  for (let k = 0; k < dye.amber.length; k++) {
    shared += Math.min(dye.amber[k], initial.amber[k]) + Math.min(dye.rose[k], initial.rose[k])
    total += initial.amber[k] + initial.rose[k]
  }
  return shared / total
}

// Total dye now over total dye at the start. The prose claims this update
// conserves the sum to roundoff; the readout is what lets a reader see that
// claim instead of taking it on trust (audit 2026-09-23, SHOULD-8).
export function dyeTotal(dye: Dye, initial: Dye) {
  let now = 0, start = 0
  for (let k = 0; k < dye.amber.length; k++) {
    now += dye.amber[k] + dye.rose[k]
    start += initial.amber[k] + initial.rose[k]
  }
  return now / start
}

export function returnPhase(step: number) {
  if (step === 0) return 'Starting patches'
  if (step === TOTAL_STEPS) return 'Return complete'
  if (step === TOTAL_STEPS / 2) return 'Motion reverses here'
  const part = Math.ceil(step / STROKE_STEPS)
  return part <= STROKES ? `Forward · stroke ${part} of ${STROKES}` : `Return · stroke ${part - STROKES} of ${STROKES}`
}

export const GRIDS = [24, 48, 96]

// Canvas caches are derived only from selected state. No integration occurs in
// draw(), and a return trip on a control produces byte-identical output.
// `compare` adds the other grids' overlap at the same step to the grid pane:
// the refinement prose compares 9% / 16% / 38%, and with one grid on screen at
// a time the reader had to remember the other two (audit 2026-09-23, IV 04).
export function createReturnExperiment(progress: { current: number }, resolution: { current: number }, factory: RasterFactory = browserRaster, compare = false): Stepper {
  // Integrate before drawing; the controls only select immutable snapshots.
  const banks = new Map(GRIDS.map(n => [n, returnFrames(n)]))
  const referenceSize = 512, referenceStart = exactDye(referenceSize, 0)
  let key = '', images: CanvasImageSource[] = [], scores: number[] = [], totals: number[] = [], gridScores: number[] = []
  return { step() {}, draw(ctx, w, h) {
    const step = Math.max(0, Math.min(TOTAL_STEPS, Math.round(progress.current) * 4)), n = resolution.current
    const selected = `${step}:${n}`
    if (selected !== key) {
      const exact = exactDye(referenceSize, step), grid = banks.get(n)![step / 4], gridStart = banks.get(n)![0]
      images = [dyeRaster(exact, referenceSize, factory), dyeRaster(grid, n, factory)]
      scores = [overlap(exact, referenceStart), overlap(grid, gridStart)]
      totals = [dyeTotal(exact, referenceStart), dyeTotal(grid, gridStart)]
      gridScores = GRIDS.map(m => overlap(banks.get(m)![step / 4], banks.get(m)![0]))
      key = selected
    }
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    panes(w, h).forEach((p, index) => {
      label(ctx, index === 0 ? 'Exact paths' : `${n} × ${n} grid`, p.x, p.y + 16, INK, 16, true)
      label(ctx, returnPhase(step), p.x, p.y + 37, MUTED, 12)
      const { size, x, y } = dyeSquare(p)
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(images[index], x, y, size, size)
      ctx.strokeStyle = '#d6dfeb'; ctx.lineWidth = 1; ctx.strokeRect(x, y, size, size)
      const meterY = y + size + 22
      label(ctx, 'Overlap with start', p.x, meterY, MUTED, 12)
      ctx.textAlign = 'right'; label(ctx, `${(scores[index] * 100).toFixed(0)}%`, p.x + p.w, meterY, C.dye, 15, true); ctx.textAlign = 'left'
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(p.x, meterY + 9, p.w, 5)
      ctx.fillStyle = C.dye; ctx.fillRect(p.x, meterY + 9, p.w * scores[index], 5)
      label(ctx, 'Dye total', p.x, meterY + 30, MUTED, 12)
      ctx.textAlign = 'right'; label(ctx, `${(totals[index] * 100).toFixed(1)}%`, p.x + p.w, meterY + 30, INK, 13, true); ctx.textAlign = 'left'
      if (compare && index === 1) {
        // Ticks on the bar for every grid at this step, and one line naming them.
        ctx.fillStyle = INK
        for (const score of gridScores) ctx.fillRect(p.x + p.w * score - .75, meterY + 6, 1.5, 11)
        let x = p.x
        GRIDS.forEach((m, at) => {
          const own = m === n, text = `${m} × ${m}: ${(gridScores[at] * 100).toFixed(0)}%${at < GRIDS.length - 1 ? '   ' : ''}`
          label(ctx, text, x, meterY + 48, own ? INK : MUTED, 12, own)
          x += ctx.measureText(text).width
        })
      }
    })
  } }
}

// The dye square within a pane; the check script samples exactly this region.
export function dyeSquare(p: Pane) {
  const size = Math.min(p.w, p.h - 117)
  return { size, x: p.x + (p.w - size) / 2, y: p.y + 49 }
}

export function ReturnExperiment({ refine = false }: { refine?: boolean }) {
  const [progress, setProgress] = useState(TOTAL_STEPS / 4), pRef = useRef(progress); pRef.current = progress
  const [resolution, setResolution] = useState(48), rRef = useRef(resolution); rRef.current = resolution
  const height = useLabHeight(refine ? 460 : 440, refine ? 800 : 780)
  return <div data-lab={refine ? 'return-refinement' : 'return-experiment'}>
    <Sim height={height} animated={false} resettable={false} create={() => createReturnExperiment(pRef, rRef, browserRaster, refine)}>
      <label className="sim-slider"><span>Forward → return</span><input type="range" aria-label={refine ? 'Refined return progress' : 'Return progress'} min="0" max={TOTAL_STEPS / 4} step="1" value={progress} onChange={e => setProgress(+e.target.value)} /><output>{(progress * 4 * RETURN_DT).toFixed(1)} s</output></label>
      <div className="sim-seg">{[['Start', 0], ['Stretched', TOTAL_STEPS / 8], ['Returned', TOTAL_STEPS / 4]].map(([name, at]) => <button type="button" key={name} aria-pressed={progress === at} onClick={() => setProgress(Number(at))}>{name}</button>)}</div>
      {refine && <div className="sim-seg" role="group" aria-label="Transport grid resolution">{[24, 48, 96].map(n => <button type="button" key={n} aria-pressed={resolution === n} onClick={() => setResolution(n)}>{n} × {n}</button>)}</div>}
    </Sim>
  </div>
}

export function storageBox(w: number, h: number): Pane {
  const size = Math.min(w - 32, h - 152)
  return { x: (w - size) / 2, y: 40, w: size, h: size }
}

export const STORAGE_CELLS = 12
export type StoredCell = { column: number; row: number }

/** The cell under a canvas point (CSS pixels), or null outside the grid. */
export function cellAt(w: number, h: number, x: number, y: number): StoredCell | null {
  const p = storageBox(w, h), cell = p.w / STORAGE_CELLS
  const column = Math.floor((x - p.x) / cell), row = Math.floor((y - p.y) / cell)
  const inside = column >= 0 && column < STORAGE_CELLS && row >= 0 && row < STORAGE_CELLS
  return inside ? { column, row } : null
}

export function createCellStorage(selected: { current: StoredCell }, factory: RasterFactory = browserRaster): Stepper {
  const n = STORAGE_CELLS, dye = exactDye(n, 0), image = dyeRaster(dye, n, factory)
  return { step() {}, draw(ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h)
    label(ctx, 'One stored concentration per cell', 16, 23, INK, 15, true)
    const p = storageBox(w, h), cell = p.w / n, { column: i, row: j } = selected.current
    ctx.imageSmoothingEnabled = false; ctx.drawImage(image, p.x, p.y, p.w, p.h)
    ctx.strokeStyle = '#b9c6d8'; ctx.lineWidth = .6; ctx.beginPath()
    for (let at = 0; at <= n; at++) {
      ctx.moveTo(p.x + at * cell, p.y); ctx.lineTo(p.x + at * cell, p.y + p.h)
      ctx.moveTo(p.x, p.y + at * cell); ctx.lineTo(p.x + p.w, p.y + at * cell)
    } ctx.stroke()
    const x = p.x + i * cell, y = p.y + j * cell
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, cell, cell)
    // The centre must remain visible even in a cell at full amber concentration.
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, 3.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    // Face dots scale with the cell: a fixed 3 px was hard to see at 390 px.
    ctx.fillStyle = C.vel
    const dot = Math.max(3, cell * .13)
    for (const [dx, dy] of [[0, .5], [1, .5], [.5, 0], [.5, 1]]) { ctx.beginPath(); ctx.arc(x + dx * cell, y + dy * cell, dot, 0, 2 * Math.PI); ctx.fill() }
    const k = i + j * n
    label(ctx, `Column ${i + 1}, row ${j + 1}`, 16, p.y + p.h + 25, INK, 14, true)
    const amber = `Amber ${dye.amber[k].toFixed(2)}`
    label(ctx, amber, 16, p.y + p.h + 48, C.dye, 14)
    label(ctx, `  ·  Rose ${dye.rose[k].toFixed(2)}`, 16 + ctx.measureText(amber).width, p.y + p.h + 48, C.dye2, 14)
    label(ctx, 'Centre: dye concentration', 16, p.y + p.h + 71, MUTED, 12)
    label(ctx, 'Blue faces: velocity across each edge', 16, p.y + p.h + 90, C.vel, 12)
  } }
}

export function CellStorage() {
  const [selected, setSelected] = useState<StoredCell>({ column: 4, row: 5 }), ref = useRef(selected); ref.current = selected
  const height = useLabHeight(440, 450)
  // Pointer picks a cell straight off the grid; the sliders give keyboard users
  // the same reach and echo the selection.
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = (e.target as HTMLElement).closest('canvas')
    if (!canvas) return
    const r = canvas.getBoundingClientRect(), cell = cellAt(r.width, r.height, e.clientX - r.left, e.clientY - r.top)
    if (cell) setSelected(cell)
  }
  return <div data-lab="cell-storage" style={{ cursor: 'pointer' }} onPointerDown={pick}><Sim animated={false} resettable={false} height={height} create={() => createCellStorage(ref)}>
    <label className="sim-slider"><span>Column</span><input aria-label="Stored cell column" type="range" min="0" max={STORAGE_CELLS - 1} step="1" value={selected.column} onChange={e => setSelected({ ...selected, column: +e.target.value })} /><output>{selected.column + 1}</output></label>
    <label className="sim-slider"><span>Row</span><input aria-label="Stored cell row" type="range" min="0" max={STORAGE_CELLS - 1} step="1" value={selected.row} onChange={e => setSelected({ ...selected, row: +e.target.value })} /><output>{selected.row + 1}</output></label>
  </Sim></div>
}
