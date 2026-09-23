import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { exactDye, move, originAt, returnFrames, returnError, advectShear, TOTAL_STEPS } from '../src/sims/construction-v4/transport'
import { createReturnExperiment, createCellStorage, cellAt, storageBox, overlap, dyeSquare, STORAGE_CELLS, type RasterFactory } from '../src/sims/construction-v4/ReturnExperiment'
import { panes } from '../src/sims/solver-lab/view'
import { PALETTE } from '../src/sims/lib/palette'

const output = '_figure_check/construction-v4'
mkdirSync(output, { recursive: true })
let checks = 0
function check(condition: boolean, message: string) { assert.ok(condition, message); checks++ }
const near = (a: number, b: number, tolerance: number, message: string) => check(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`)

// An independent forward composition and its analytically coded inverse.
for (let k = 0; k < 80; k++) {
  const start: [number, number] = [.13 + .71 * ((k * 13 % 79) / 79), .17 + .67 * ((k * 31 % 79) / 79)]
  let point = start
  const end = k % 3 === 0 ? TOTAL_STEPS : k % 3 === 1 ? 139 : 205
  for (let s = 0; s < end; s++) point = move(...point, s)
  const back = originAt(...point, end)
  near(back[0], start[0], 2e-12, 'inverse characteristic x')
  near(back[1], start[1], 2e-12, 'inverse characteristic y')
  if (end === TOTAL_STEPS) {
    near(point[0], start[0], 2e-12, 'complete return x')
    near(point[1], start[1], 2e-12, 'complete return y')
  }
}
const records = []
let previousError = Infinity
for (const n of [24, 48, 96, 192]) {
  const frames = returnFrames(n), first = frames[0], last = frames.at(-1)!
  check(frames.length === TOTAL_STEPS / 4 + 1, 'all selectable states exist')
  const error = returnError(last, n), score = overlap(last, first)
  check(error < previousError, 'refinement improves returned shape on displayed grids')
  previousError = error
  for (const key of ['amber', 'rose'] as const) {
    const mass = (q: Float64Array) => q.reduce((sum, v) => sum + v, 0)
    for (const frame of frames) {
      check(frame[key].every(q => q >= 0 && q <= 1), 'concentrations remain bounded')
      near(mass(frame[key]) / mass(first[key]), 1, 3e-13, 'concentration sum remains constant')
    }
  }
  near(score, 1 - error / 2, 1e-12, 'overlap agrees with independent L1 identity for equal mass')
  records.push({ cells: n, normalizedL1Error: error, returnedOverlap: score })
}
check(records[1].returnedOverlap < .2, 'default grid shows a large visible failure')
check(records[2].returnedOverlap > 2 * records[1].returnedOverlap, 'refinement has a legible consequence')
const exactStart = exactDye(96, 0), exactReturn = exactDye(96, TOTAL_STEPS)
near(overlap(exactReturn, exactStart), 1, 1e-12, 'exact reference really returns')
const uniform = new Float64Array(48 * 48).fill(.37)
for (const s of [0, 35, 93, 170, 281]) check(advectShear(uniform, 48, s).every(v => Math.abs(v - .37) < 1e-15), 'constant field stays constant')

const factory: RasterFactory = n => {
  const canvas = createCanvas(n, n)
  return { canvas: canvas as unknown as CanvasImageSource, context: canvas.getContext('2d') as unknown as CanvasRenderingContext2D }
}
for (const [width, height] of [[720, 440], [340, 780]]) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const text: { value: string; x: number; y: number; align: CanvasTextAlign; width: number }[] = []
  const fill = ctx.fillText.bind(ctx)
  ctx.fillText = (value, x, y) => { text.push({ value, x, y, align: ctx.textAlign, width: ctx.measureText(value).width }); fill(value, x, y) }
  const progress = { current: 0 }, resolution = { current: 48 }, figure = createReturnExperiment(progress, resolution, factory)
  const render = () => { text.length = 0; figure.draw(ctx, width, height); return canvas.toBuffer('image/png') }
  const start = render()
  progress.current = TOTAL_STEPS / 8; const middle = render()
  progress.current = TOTAL_STEPS / 4; const end = render()
  // Inspect only the dye squares, excluding headings, meters and guide lines.
  // A missing raster must not pass merely because the stage label changed.
  const saturatedDye = panes(width, height).map(p => {
    const square = dyeSquare(p), size = Math.floor(square.size), x = Math.ceil(square.x), y = square.y
    const pixels = ctx.getImageData(x, y, size, size).data
    const colours = [PALETTE.dye, PALETTE.dye2].map(hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)))
    return colours.map(rgb => {
      let count = 0
      for (let k = 0; k < pixels.length; k += 4) if (rgb.every((v, c) => Math.abs(pixels[k + c] - v) < 15)) count++
      return count
    })
  })
  check(saturatedDye[0].every(count => count > 100), 'exact return visibly restores both saturated dye patches')
  check(saturatedDye[1].every(count => count === 0), 'default grid visibly loses those concentration peaks')
  check(!start.equals(middle) && !middle.equals(end) && !start.equals(end), 'three distinct visible stages')
  check(end.equals(render()), 'draw leaves simulation state unchanged')
  progress.current = 0; check(start.equals(render()), 'progress return restores exact pixels')
  progress.current = TOTAL_STEPS / 4
  for (const n of [24, 48, 96]) {
    resolution.current = n; render()
    writeFileSync(`${output}/return-${width}-${n}.png`, canvas.toBuffer('image/png'))
    for (const item of text) {
      const left = item.align === 'right' ? item.x - item.width : item.x
      check(left >= 0 && left + item.width <= width && item.y >= 0 && item.y <= height, `text stays on canvas: ${item.value}`)
    }
  }
  // Refinement mode prints every grid's overlap on the grid pane; the line must
  // fit and must name all three grids at their prose values (9 / 16 / 38%).
  progress.current = TOTAL_STEPS / 4
  const compareHeight = height + 20, compareCanvas = createCanvas(width, compareHeight), cc = compareCanvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const compareText: { value: string; x: number; width: number }[] = []
  const compareFill = cc.fillText.bind(cc)
  cc.fillText = (value, x, y) => { const width = cc.measureText(value).width; compareText.push({ value, x: cc.textAlign === 'right' ? x - width : x, width }); compareFill(value, x, y) }
  createReturnExperiment(progress, resolution, factory, true).draw(cc, width, compareHeight)
  writeFileSync(`${output}/refine-compare-${width}.png`, compareCanvas.toBuffer('image/png'))
  check(compareText.every(item => item.x >= 0 && item.x + item.width <= width), 'refinement comparison line stays on canvas')
  for (const expected of ['24 × 24: 9%', '48 × 48: 16%', '96 × 96: 38%']) check(compareText.some(item => item.value.startsWith(expected)), `comparison names ${expected}`)
  progress.current = TOTAL_STEPS / 8; render(); writeFileSync(`${output}/stretched-${width}.png`, canvas.toBuffer('image/png'))
  // The prose says the dye total stays at 100% while the shape is lost. A
  // future non-conservative advection (or a broken readout) must fail here,
  // at the most stretched state, where the exact pane's sampled total is
  // furthest from one (0.99978 at 512²) and must still print 100.0%.
  check(text.filter(item => item.value === '100.0%').length === 2, 'both panes print a 100.0% dye total at maximum stretch')
  const selected = { current: { column: 4, row: 5 } }, storage = createCellStorage(selected, factory), sh = 450
  const sheet = createCanvas(width, sh), sc = sheet.getContext('2d') as unknown as CanvasRenderingContext2D
  storage.draw(sc, width, sh); const a = sheet.toBuffer('image/png')
  selected.current = { column: 11, row: 5 }; storage.draw(sc, width, sh); check(!a.equals(sheet.toBuffer('image/png')), 'storage selection changes measured concentration and location')
  selected.current = { column: 4, row: 5 }; storage.draw(sc, width, sh); check(a.equals(sheet.toBuffer('image/png')), 'storage return is deterministic')
  writeFileSync(`${output}/storage-${width}.png`, a)
  // The prose says "select a cell": a pointer hit anywhere on the grid must
  // resolve to that cell, and the rose patch must be reachable (audit IV 01).
  const box = storageBox(width, sh), cell = box.w / STORAGE_CELLS
  check(cellAt(width, sh, box.x + 7.5 * cell, box.y + 7.5 * cell)?.column === 7 && cellAt(width, sh, box.x + 7.5 * cell, box.y + 7.5 * cell)?.row === 7, 'pointer hit resolves to the cell under it')
  check(cellAt(width, sh, box.x - 1, box.y + cell) === null && cellAt(width, sh, box.x + cell, box.y + box.h + 1) === null, 'hits outside the grid select nothing')
  const rose = exactDye(STORAGE_CELLS, 0).rose
  check(Array.from({ length: STORAGE_CELLS * STORAGE_CELLS }, (_, k) => k).some(k => rose[k] > .5 && cellAt(width, sh, box.x + (k % STORAGE_CELLS + .5) * cell, box.y + (Math.floor(k / STORAGE_CELLS) + .5) * cell) !== null), 'a saturated rose cell is selectable')
}
writeFileSync(`${output}/measurements.json`, JSON.stringify(records, null, 2) + '\n')
console.log(JSON.stringify(records, null, 2))
console.log(`${checks} construction IV checks passed. Rendered evidence: ${output}`)
