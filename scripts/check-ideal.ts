import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createIdealFlow, idealForces, IDEAL_FORCE_COLORS } from '../src/sims/IdealFlow'
import { surfaceCp } from '../src/sims/lib/potential'

let checks = 0
function check(ok: boolean, name: string) { assert(ok, name); console.log(`ok ${++checks}: ${name}`) }
const close = (a: number, b: number) => Math.abs(a - b) < 1e-10
const run = (sim: ReturnType<typeof createIdealFlow>, seconds: number, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) sim.step(1 / fps)
}

for (const speed of [0.5, 1, 2]) {
  const f = idealForces(speed)
  check(close(f.downstream, speed ** 2) && close(f.upstream, -(speed ** 2)), `${speed}×: opposing totals scale with speed squared`)
  check(close(f.net, 0) && close(f.net, f.downstream + f.upstream), `${speed}×: independent pressure integral agrees with cancelling totals`)
}
let worst = 0
for (let i = 50; i <= 200; i++) {
  const f = idealForces(i / 100)
  worst = Math.max(worst, Math.abs(f.net), Math.abs(f.downstream - (i / 100) ** 2))
}
check(worst < 1e-10, 'all 151 slider stops preserve the physical scaling and balance')
const brokenSymmetry = idealForces(1, theta => surfaceCp(theta) - 0.5 * Math.cos(theta))
check(brokenSymmetry.net > 0.5 && close(brokenSymmetry.net, brokenSymmetry.downstream + brokenSymmetry.upstream), 'pressure sampler registers nonzero drag when fore-aft symmetry is broken')

const slowFrames = createIdealFlow({ current: 2 }, 640, 400), fastFrames = createIdealFlow({ current: 2 }, 640, 400)
run(slowFrames, 6, 20); run(fastFrames, 6, 120)
check(JSON.stringify(slowFrames.measure()) === JSON.stringify(fastFrames.measure()), 'marker transport is identical at 20 and 120 fps')
const initial = createIdealFlow({ current: 1 }, 640, 400).measure()
check(JSON.stringify(initial) !== JSON.stringify(fastFrames.measure()), 'parcels actually advance, including downstream of the cylinder')
const slowMotion = createIdealFlow({ current: 0.5 }, 640, 400), fastMotion = createIdealFlow({ current: 2 }, 640, 400)
run(slowMotion, 0.25); run(fastMotion, 0.25)
const motionRatio = (fastMotion.measure().markers[0][0] - initial.markers[0][0]) / (slowMotion.measure().markers[0][0] - initial.markers[0][0])
check(motionRatio > 3.9 && motionRatio < 4.1, 'far-upstream parcel motion responds fourfold across the slider endpoints')
run(fastFrames, 24)
check(fastFrames.measure().markers.every(([x, y]) => Number.isFinite(x + y) && x * x + y * y >= 0.999), '30-second fast run keeps every marker outside the cylinder')

mkdirSync('_figure_check/ideal', { recursive: true })
for (const width of [640, 320]) {
  const canvas = createCanvas(width, 400), ctx = canvas.getContext('2d')
  const ref = { current: 1 }, sim = createIdealFlow(ref, width, 400)
  const draw = () => {
    sim.draw(ctx as unknown as CanvasRenderingContext2D, width, 400)
    return Buffer.from(ctx.getImageData(0, 0, width, 400).data)
  }
  const forceWidth = (pixels: Buffer, color: string) => {
    const rgb = [1, 3, 5].map(i => Number.parseInt(color.slice(i, i + 2), 16))
    let min = width, max = -1
    // Only the live force arrows at y=305, excluding gray reference, text and dye.
    for (let y = 303; y <= 307; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (rgb.every((v, c) => Math.abs(pixels[i + c] - v) < 5)) { min = Math.min(min, x); max = Math.max(max, x) }
    }
    return max < min ? 0 : max - min + 1
  }
  const before = sim.measure(), base = draw()
  check(base.equals(draw()) && JSON.stringify(before) === JSON.stringify(sim.measure()), `${width}px: draw is pure`)
  const referenceWidth = forceWidth(base, IDEAL_FORCE_COLORS.downstream)
  ref.current = 2
  const fast = draw()
  check(sim.measure().time === 0 && close(sim.measure().downstream, 4), `${width}px: paused speed change updates force immediately without advancing time`)
  const fastWidth = forceWidth(fast, IDEAL_FORCE_COLORS.downstream)
  check(fastWidth > referenceWidth * 3.8 && fastWidth < referenceWidth * 4.8, `${width}px: actual colored arrow grows fourfold (${referenceWidth} → ${fastWidth}px)`)
  check(Math.abs(fastWidth - forceWidth(fast, IDEAL_FORCE_COLORS.upstream)) <= 1, `${width}px: opposing arrows visibly have equal lengths`)
  writeFileSync(`_figure_check/ideal/${width}-fast.png`, canvas.toBuffer('image/png'))
  ref.current = 0.5
  const low = draw()
  check(forceWidth(low, IDEAL_FORCE_COLORS.downstream) > 0 && forceWidth(low, IDEAL_FORCE_COLORS.downstream) < referenceWidth / 2, `${width}px: lowest speed retains a visibly smaller force`)
  writeFileSync(`_figure_check/ideal/${width}-slow.png`, canvas.toBuffer('image/png'))
  ref.current = 1; run(sim, 3); draw()
  writeFileSync(`_figure_check/ideal/${width}-reference.png`, canvas.toBuffer('image/png'))
  check(!base.equals(draw()), `${width}px: visible parcels move at reference speed`)
  const reset = createIdealFlow(ref, width, 400)
  reset.draw(ctx as unknown as CanvasRenderingContext2D, width, 400)
  check(base.equals(Buffer.from(ctx.getImageData(0, 0, width, 400).data)), `${width}px: Reset reproduces the initial state`)
}
console.log(`${checks} ideal-flow checks passed`)
