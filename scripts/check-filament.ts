import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createFilament, filamentVelocity, FILAMENT_DT } from '../src/sims/ReynoldsTube'
import { PALETTE } from '../src/sims/lib/palette'
let checks = 0
function check(ok: boolean, label: string) { assert(ok, label); console.log(`ok ${++checks}: ${label}`) }
const zero = createFilament(0), strong = createFilament(1)
check(JSON.stringify(zero.measure().lanes[0]) === JSON.stringify(zero.measure().lanes[1]), 'zero sideways motion gives identical specimens')
const initial = strong.measure()
check(initial.lanes[0].every(p => p.y === 0), 'reference dye stays on its injected centerline')
const extent = (lane: { y: number }[]) => Math.max(...lane.map(p => p.y)) - Math.min(...lane.map(p => p.y))
check(extent(initial.lanes[1]) > .7, 'strong endpoint spreads the dye over a visible fraction of the channel')
// Independent checks of the prescribed field, including the derivative signs.
for (const strength of [0, .5, 1]) {
  const e = 1e-5
  let divergence = 0, flowError = 0, minU = Infinity
  for (const time of [0, 1.3, 7.2]) for (const x of [.1, .7, 1.5, 2.8]) {
    for (const y of [-.9, -.4, 0, .5, .9]) {
      const ux = (filamentVelocity(x + e, y, time, strength).u - filamentVelocity(x - e, y, time, strength).u) / (2 * e)
      const vy = (filamentVelocity(x, y + e, time, strength).v - filamentVelocity(x, y - e, time, strength).v) / (2 * e)
      divergence = Math.max(divergence, Math.abs(ux + vy))
      minU = Math.min(minU, filamentVelocity(x, y, time, strength).u)
    }
    let flux = 0
    for (let i = 0; i < 2000; i++) flux += filamentVelocity(x, -1 + (i + .5) / 1000, time, strength).u / 1000
    flowError = Math.max(flowError, Math.abs(flux - 1))
    for (const y of [-1, 1]) {
      const v = filamentVelocity(x, y, time, strength)
      assert(v.u === 0 && v.v === 0)
    }
  }
  check(divergence < 1e-8, `${strength}: velocity preserves volume`)
  check(flowError < 1e-6, `${strength}: total flux stays equal to the straight-flow reference`)
  check(minU > 0, `${strength}: interior parcels always move downstream; walls have zero velocity`)
}
strong.pulse()
const marked = strong.measure().lanes.map(l => l.filter(p => p.rose))
check(marked.every(l => l.length > 20), 'pulse is immediately visible even before another time step')
strong.step(2)
const later = strong.measure()
for (let lane = 0; lane < 2; lane++) {
  const next = later.lanes[lane].find(p => p.id === marked[lane][0].id)
  check(!!next && next.x > marked[lane][0].x + .8, `lane ${lane}: the marked cohort actually travels downstream`)
}
strong.step(18)
check(strong.measure().lanes.every(l => l.every(p => !p.rose)), 'all pulse dye leaves naturally, without a global reset')
const idsBefore = strong.measure().lanes[1].map(p => p.id)
strong.step(8)
check(strong.measure().lanes[1].every(p => !idsBefore.includes(p.id)), 'old dye is fully flushed, including the disturbed tail')
for (let i = 0; i < 60; i++) {
  strong.step(1)
  for (const lane of strong.measure().lanes) {
    assert(lane.length > 300 && lane.length < 650)
    assert(lane.every(p => Number.isFinite(p.y) && Math.abs(p.y) < .8 && p.x >= 0 && p.x < 3))
  }
}
check(true, 'one minute of strong stirring has bounded populations and no wall accumulation')
const thirty = createFilament(.8), sixty = createFilament(.8)
for (let i = 0; i < 30; i++) thirty.step(1 / 30)
for (let i = 0; i < 60; i++) sixty.step(1 / 60)
check(JSON.stringify(thirty.measure()) === JSON.stringify(sixty.measure()), 'fixed timestep is independent of caller cadence')
mkdirSync('_figure_check/filament', { recursive: true })
for (const width of [340, 640]) {
  const s = createFilament(1), canvas = createCanvas(width, 380), ctx = canvas.getContext('2d')
  s.pulse(); s.step(2)
  const draw = () => { s.draw(ctx as unknown as CanvasRenderingContext2D, width, 380); return Buffer.from(ctx.getImageData(0, 0, width, 380).data) }
  const before = JSON.stringify(s.measure()), pixels = draw()
  check(pixels.equals(draw()) && JSON.stringify(s.measure()) === before, `${width}px: drawing is pure`)
  const rose = [1, 3, 5].map(i => parseInt(PALETTE.dye2.slice(i, i + 2), 16))
  for (const lane of [0, 1]) {
    let ink = 0
    for (let y = lane * 190 + 45; y < lane * 190 + 165; y++) for (let x = 25; x < width - 20; x++) {
      const k = 4 * (x + y * width)
      if (pixels[k + 3] > 200 && rose.every((v, i) => Math.abs(v - pixels[k + i]) < 8)) ink++
    }
    check(ink > 35, `${width}px lane ${lane}: the transported pink pulse is visible in its own color`)
  }
  s.step(FILAMENT_DT * 30)
  check(!pixels.equals(draw()), `${width}px: visible dye advances between frames`)
  writeFileSync(`_figure_check/filament/${width}.png`, canvas.toBuffer('image/png'))
}
console.log(`${checks} filament checks passed`)
