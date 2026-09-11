import assert from 'node:assert/strict'
import { createCanvas, ImageData } from '@napi-rs/canvas'
import { createTimeline, ERAS, timelineMix, timelinePresentation } from '../src/sims/history/timeline'
import { createHistoryFlow, HISTORY_COMPARISON_COLOR } from '../src/sims/history/flow'
import type { Stepper } from '../src/components/Sim'
import { mkdirSync, writeFileSync } from 'node:fs'
Object.assign(globalThis, { ImageData, document: { createElement: () => createCanvas(1, 1) } })
let checks = 0
const check = (ok: boolean, name: string) => { assert(ok, name); console.log(`ok ${++checks}: ${name}`) }
const position = { current: 0 }, steps = ERAS.map(() => 0), marks = ERAS.map(() => 0), disposals: number[] = []
let creations = 0
const colors = ['#fa0000', '#00fa00', '#0000fa', '#fafa00', '#00fafa', '#fa00fa']
const s = createTimeline(position, (kind, comparison) => {
  const i = ERAS.findIndex(e => e.kind === kind); creations++
  return {
    step(dt) { steps[i] += dt },
    markWake() { marks[i]++ },
    draw(ctx, w, h) {
      // This deliberately changes alpha, as real flow renderers do internally.
      ctx.globalAlpha = 1; ctx.fillStyle = comparison() ? HISTORY_COMPARISON_COLOR : colors[i]; ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = .7
    },
    dispose() { disposals.push(i) },
  } satisfies Stepper & { markWake: () => void }
})
const canvas = createCanvas(200, 100), ctx = canvas.getContext('2d')
function draw() { s.draw(ctx as unknown as CanvasRenderingContext2D, 200, 100); return ctx.getImageData(0, 0, 200, 100).data }
for (let i = 0; i < ERAS.length; i++) {
  position.current = i
  const m = timelineMix(i), pixels = draw()
  const expected = [1, 3, 5].map(k => parseInt(colors[i].slice(k, k + 2), 16))
  check(m.left === i && m.alpha === 0 && expected.every((v, k) => pixels[k] === v), `${ERAS[i].year}: notch shows only its own simulation`)
}
const rgb = (hex: string) => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16))
for (let i = 0; i < ERAS.length - 1; i++) for (const alpha of [.25, .5, .75]) {
  position.current = i + alpha
  const pixels = draw(), normal = rgb(colors[alpha < .5 ? i : i + 1]), cyan = rgb(HISTORY_COMPARISON_COLOR)
  const weight = Math.min(alpha, 1 - alpha)
  // Canvas opacity is quantized to bytes, allowing two levels of rounding.
  check(normal.every((v, k) => Math.abs(pixels[k] - (v * (1 - weight) + cyan[k] * weight)) <= 2), `${ERAS[i].year}–${ERAS[i+1].year}: ${alpha * 100}% uses normal base plus cyan comparison`)
}
for (let i = 0; i < 5; i++) {
  const before = timelinePresentation(i + .49), midpoint = timelinePresentation(i + .5), after = timelinePresentation(i + .51)
  check(before.base === i && before.comparison === i + 1 && midpoint.base === i + 1 && midpoint.comparison === i && after.base === i + 1, `transition ${i}: color roles swap exactly at midpoint`)
}
position.current = 2.4; s.step(.25)
const timeBeforeMark = steps.slice(); s.markWake()
check(marks[2] === 1 && marks[3] === 1 && marks.filter((_, i) => i !== 2 && i !== 3).every(n => n === 0) && steps.every((n, i) => n === timeBeforeMark[i]), 'wake marking reaches both overlapping eras without advancing time')
check(steps[2] === .25 && steps[3] === .25 && steps.filter((_, i) => i !== 2 && i !== 3).every(n => n === 0), 'only both visible neighboring states advance')
position.current = 5; s.step(.5)
s.markWake(); check(marks[5] === 1, 'wake marking reaches an exact endpoint once')
check(steps[5] === .5, 'last endpoint advances once, not twice')
position.current = 2.4; s.step(.25)
check(steps[2] === .5 && steps[3] === .5 && creations === 6, 'revisiting an era retains state instead of reconstructing it')
const saved = steps.slice(); draw(); draw()
check(steps.every((n, i) => n === saved[i]), 'drawing and paused scrubbing never advance physics')
check(timelineMix(-2).left === 0 && timelineMix(9).left === 5, 'index bounds select valid eras')
s.dispose?.(); check(disposals.length === 6, 'reset/unmount releases every cached stepper')
// Exercise actual renderers, including child alpha changes and Retina backing.
const actualPosition = { current: 1.5 }, actual = createTimeline(actualPosition)
const real = createCanvas(680, 340), rc = real.getContext('2d'); rc.scale(2, 2)
for (let i = 0; i < 20; i++) actual.step(1/40)
const render = () => { actual.draw(rc as unknown as CanvasRenderingContext2D, 340, 170); return Buffer.from(rc.getImageData(0,0,680,340).data) }
const blended = render()
check(blended.equals(render()), 'actual blended render is pure at 2× backing resolution')
actualPosition.current = 1; const left = render()
actualPosition.current = 2; const right = render()
const ghost = createHistoryFlow('euler', () => true)
for (let i = 0; i < 20; i++) ghost.step(1/40)
ghost.draw(rc as unknown as CanvasRenderingContext2D, 340, 170)
const cyanLeft = Buffer.from(rc.getImageData(0,0,680,340).data)
let error = 0, difference = 0, cyanInk = 0, neutralInk = 0
for (let i = 0; i < blended.length; i += 4) {
  for (let channel = 0; channel < 3; channel++) {
    error = Math.max(error, Math.abs(blended[i + channel] - (cyanLeft[i + channel] + right[i + channel]) / 2))
    difference += Math.abs(left[i + channel] - cyanLeft[i + channel])
  }
  if (cyanLeft[i] < 100 && cyanLeft[i+1] > 90 && cyanLeft[i+2] > 100) cyanInk++
  if (left[i] === 107 && left[i+1] === 114 && left[i+2] === 128) {
    assert(cyanLeft[i] === 107 && cyanLeft[i+1] === 114 && cyanLeft[i+2] === 128)
    neutralInk++
  }
}
check(error <= 2 && difference > 10000, 'real midpoint blends normal Navier with cyan Euler, not two normal palettes')
check(cyanInk > 250, 'comparison dye has a visible cyan identity')
check(neutralInk > 100, 'comparison color leaves the shared wing neutral')
// Switching the palette must not reconstruct or change the physical state.
let comparison = false
const toggled = createHistoryFlow('navier', () => comparison)
for (let i = 0; i < 20; i++) toggled.step(1/40)
const shot = () => { toggled.draw(rc as unknown as CanvasRenderingContext2D, 340, 170); return Buffer.from(rc.getImageData(0,0,680,340).data) }
const normal = shot(); comparison = true; const tint = shot(); comparison = false
check(!normal.equals(tint) && normal.equals(shot()), 'dye-grid and parcel recoloring is reversible without changing physics')
actualPosition.current = 1.5; actual.step(.1)
check(!blended.equals(render()), 'both-model view continues moving')
mkdirSync('_figure_check/timeline', { recursive: true })
writeFileSync('_figure_check/timeline/blend.png', real.toBuffer('image/png'))
actual.dispose?.()
console.log(`${checks} timeline checks passed`)
