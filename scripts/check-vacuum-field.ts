import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createVacuumField } from '../src/sims/bundles-v3/VacuumField'
import { createMaxwellModel, WAVE_LENGTH, WAVE_N, pulse } from '../src/sims/bundles-v2/model'

const model = createMaxwellModel(), alternate = createMaxwellModel()
for (let i = 0; i < 180; i++) model.advance(1 / 60)
for (let i = 0; i < 90; i++) alternate.advance(1 / 30)
const d = model.read()
assert.deepEqual(d, alternate.read(), 'Display cadence must not alter field evolution')
const peak = (v: Float64Array) => v.indexOf(Math.max(...v))
assert.equal(peak(d.e), peak(d.b), 'Electric and magnetic peaks must be colocated')
assert.ok(Math.abs(peak(d.e) * WAVE_LENGTH / WAVE_N - 6) < .04, 'Peak travels from x=3 to x=6 in three time units')
let error = 0
d.e.forEach((v, i) => { error += (v - pulse(i * WAVE_LENGTH / WAVE_N - 3)) ** 2 })
assert.ok(Math.sqrt(error / WAVE_N) < .004, 'Numerical pulse agrees with continuum translation')
mkdirSync('_figure_check/vacuum-field', { recursive: true })
for (const [w, h] of [[720, 360], [380, 300]]) {
  const sim = createVacuumField(), canvas = createCanvas(w, h), ctx = canvas.getContext('2d')
  const draw = () => sim.draw(ctx as unknown as CanvasRenderingContext2D, w, h)
  const centroid = (color: number[]) => {
    const data = ctx.getImageData(0, 45, w, h - 125).data
    let count = 0, sum = 0
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200 && color.every((v, j) => Math.abs(v - data[i + j]) < 12)) {
      count++; sum += (i / 4) % w
    }
    assert.ok(count > 35, `Visible field arrows missing at width ${w}: ${color}`)
    return sum / count
  }
  draw()
  const initial = [[220, 38, 38], [8, 145, 178]].map(centroid)
  for (let i = 0; i < 180; i++) sim.step(1 / 60)
  draw()
  const moved = [[220, 38, 38], [8, 145, 178]].map(centroid)
  moved.forEach((x, i) => assert.ok(x - initial[i] > (w - 80) * .18, 'Field-specific ink must propagate rightward'))
  const before = canvas.toBuffer('image/png'); draw()
  assert.deepEqual(before, canvas.toBuffer('image/png'), 'Draw must not evolve field state')
  writeFileSync(`_figure_check/vacuum-field/field-${w}.png`, before)
}
console.log('Vacuum field: E/B colocation, pulse translation, cadence independence, desktop/mobile field-color motion and draw purity passed.')
