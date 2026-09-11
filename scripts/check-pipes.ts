import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createPipes, volumeFlux, uMax } from '../src/sims/PoiseuillePipe'
let checks = 0
function check(ok: boolean, name: string) { assert(ok, name); console.log(`ok ${++checks}: ${name}`) }
function run(s: ReturnType<typeof createPipes>, seconds: number, fps = 60) { for (let i = 0; i < seconds * fps; i++) s.step(1 / fps) }
check(Math.abs(volumeFlux(1) - uMax(1) / 2) < 1e-12, 'circular pipe mean velocity is half peak velocity')
check(Math.abs(volumeFlux(0.5) / volumeFlux(1) - 1 / 16) < 1e-12, 'half radius gives one sixteenth the flux')
let maxError = 0
for (let i = 35; i <= 100; i++) { const r = i / 100; maxError = Math.max(maxError, Math.abs(volumeFlux(r) / volumeFlux(1) - r ** 4)) }
check(maxError < 1e-12, 'cross-sectional flux agrees with Poiseuille law at all 66 slider stops')
const s = createPipes(0.35)
run(s, 37)
s.setRadius(1)
check(s.measure().elapsed === 0 && s.measure().referenceVolume === 0 && s.measure().testVolume === 0, 'radius change restarts both collectors immediately without a step')
let equal = true
for (let i = 0; i < 60 * 30; i++) { s.step(1 / 60); const m = s.measure(); equal &&= m.referenceVolume === m.testVolume }
check(equal, 'aged reference and refreshed test collect exactly equally at radius 1 for 30 seconds')
s.setRadius(0.5); run(s, 4)
let m = s.measure()
check(m.referenceVolume === 1 && m.testVolume === 1 / 16, 'four-second collected volumes are 1 and 1/16 reference-pipe volumes')
run(s, 4); m = s.measure()
check(m.elapsed === 8 && m.referenceVolume === 2 && m.testVolume === 1 / 8, 'eight-second fill sample retains the correct ratio')
s.step(1 / 240); m = s.measure()
check(m.elapsed === 1 / 240 && m.referenceVolume === 16 * m.testVolume, 'collectors restart together and preserve ratio')
const a = createPipes(0.73), b = createPipes(0.73)
run(a, 10, 60); run(b, 10, 20)
check(JSON.stringify(a.measure()) === JSON.stringify(b.measure()), '20 and 60 fps produce identical timing and volumes')
mkdirSync('_figure_check/pipes', { recursive: true })
for (const width of [640, 340]) {
  const canvas = createCanvas(width, 320), ctx = canvas.getContext('2d')
  const draw = (p: ReturnType<typeof createPipes>) => { p.draw(ctx as unknown as CanvasRenderingContext2D, width, 320); return Buffer.from(ctx.getImageData(0, 0, width, 320).data) }
  const p = createPipes(1); run(p, 6)
  const equalImage = draw(p)
  writeFileSync(`_figure_check/pipes/${width}-equal.png`, canvas.toBuffer('image/png'))
  // Measure each collector in its own palette color (no gray outlines or blue profiles).
  const heightOf = (rgb: number[], left: number, right: number) => {
    let min = 320, max = -1
    for (let y = 35; y < 290; y++) for (let x = Math.ceil(left); x < right; x++) {
      const i = 4 * (x + y * width)
      if (rgb.every((v, c) => Math.abs(equalImage[i + c] - v) < 5)) { min = Math.min(min, y); max = Math.max(max, y) }
    }
    return max - min + 1
  }
  const cx = width * 0.66, cw = Math.min(38, (width - 14 - cx - 18) / 2)
  const amberHeight = heightOf([217,119,6], cx + 1, cx + cw - 1)
  const pinkHeight = heightOf([219,39,119], cx + cw + 19, cx + 2 * cw + 17)
  check(amberHeight > 150 && amberHeight === pinkHeight, `${width}px: actual amber and pink collector heights equal (${amberHeight}px)`)
  check(equalImage.equals(draw(p)), `${width}px: paused drawing is pure`)
  p.setRadius(0.5); const reset = draw(p)
  check(!reset.equals(equalImage) && p.measure().testVolume === 0, `${width}px: paused slider changes geometry and empties both columns`)
  const fresh = createPipes(0.5)
  check(reset.equals(draw(fresh)), `${width}px: parameter change restages BOTH marker populations deterministically`)
  run(p, 6); draw(p); writeFileSync(`_figure_check/pipes/${width}-half.png`, canvas.toBuffer('image/png'))
}
console.log(`${checks} pipe checks passed`)
