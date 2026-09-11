import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { LabFluid, projectionInput, relaxationFrames, cycleFrames } from '../src/sims/solver-lab/core'
import { createBacktrace, createTransportErrors, interpolate, transportFrames } from '../src/sims/solver-lab/TransportLab'
import { createProjectionLab } from '../src/sims/solver-lab/ProjectionLab'
import { createDiffusion, diffuseProfile } from '../src/sims/solver-lab/DiffusionLab'
import { createCellFlux } from '../src/sims/solver-lab/CellFlux'
import { comparisonFrames, createComparison, createCycle, createLiveLab } from '../src/sims/solver-lab/SolverWorkbench'
import type { Stepper } from '../src/components/Sim'

let checks = 0
function check(ok: boolean, name: string) { assert.ok(ok, name); checks++ }
const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Array.from(a).reduce((s, v, i) => s + (v - b[i]) ** 2, 0) ** .5

const input = projectionInput(), solenoidal = new LabFluid(24, 16).seed(), corrected = input.clone()
check(input.metrics().divergence > 1, 'test field actually contains a substantial imbalance')
corrected.project()
check(corrected.metrics().divergence < 1e-8, 'projection balances the faces, independently measured after correction')
check(distance(corrected.u, solenoidal.u) + distance(corrected.v, solenoidal.v) < 1e-7, 'projection preserves the known discrete curl and removes only the added gradient')
check(corrected.pressure[input.index(12, 8)] < corrected.pressure[input.index(0, 0)], 'outward source requires lower pressure at centre')
const over = input.clone(); over.correct(corrected.pressure, 1.5)
check(Math.abs(over.metrics().divergence / input.metrics().divergence - .5) < 1e-8, '150% correction leaves half the original RMS error')
check(over.divergence()[input.index(12, 8)] * input.divergence()[input.index(12, 8)] < 0, 'overcorrection reverses the sign of the local imbalance')
const relax = relaxationFrames()
check(Math.abs(relax[10].metrics().divergence / input.metrics().divergence - .26) < .005, '10-sweep prose number')
check(Math.abs(relax[40].metrics().divergence / input.metrics().divergence - .044) < .001, '40-sweep prose number')
check(relax[160].metrics().divergence / input.metrics().divergence < .001, '160 sweeps leave less than 0.1%')

// Fourier mode decay provides an independent diffusion solution on a periodic grid.
const fourier = new LabFluid(32, 20)
for (let j = 0; j < 20; j++) for (let i = 0; i < 32; i++) fourier.u[fourier.index(i, j)] = Math.sin(2 * Math.PI * j / 20)
const waveBefore = fourier.u.slice(), nu = 4, dt = .025
fourier.smooth(dt, nu)
const amplification = 1 - 4 * nu * dt * Math.sin(Math.PI / 20) ** 2
check(distance(fourier.u, Float64Array.from(waveBefore, u => u * amplification)) < 1e-12, 'diffusion matches the discrete Fourier eigenvalue')
for (const shape of ['jet', 'layers', 'stripes'] as const) {
  const zero = diffuseProfile(shape, 0), strong = diffuseProfile(shape, 8)
  check(distance(zero.initial, zero.u) === 0, `${shape}: zero viscosity preserves the initial profile`)
  check(strong.u.every(u => u >= 0 && u <= 1) && strong.u[0] === 0 && strong.u[31] === 0, `${shape}: diffusion stays bounded with no-slip walls`)
}
check(interpolate([0, .2, 1, 0], 1.25) === .4, 'interpolation weights the neighbouring samples')
const transport = transportFrames()
check(transport[8].centered.some(q => q < 0), 'centered transport produces negative concentration')
check(Math.max(...transport[80].centered) > 1000, 'unstable transport actually grows, without clipping its state')
check(transport[80].traced.every(q => q >= 0 && q <= 1), 'backtracing remains bounded')
check(distance(transport[80].traced, transport[80].exact) > .1, 'bounded transport still has measurable error')
const total = (a: number[]) => a.reduce((s, x) => s + x, 0)
check(Math.abs(total(transport[80].traced) - total(transport[0].traced)) < 1e-10, 'constant-velocity periodic transport preserves dye sum')

const stages = cycleFrames()
check(stages[1].metrics().divergence > .5, 'the push introduces the error the cycle must fix')
check(stages[3].metrics().energy < stages[2].metrics().energy, 'smoothing dissipates kinetic energy')
check(stages[4].metrics().divergence < 1e-8, 'cycle pressure step removes the measured error')
check(distance(stages[5].u, stages[4].u) + distance(stages[5].v, stages[4].v) === 0, 'moving dye cannot change velocity')
check(distance(stages[5].dye, stages[4].dye) > .1, 'dye transport actually moves the dye')
const comparisons = comparisonFrames()
for (const omit of ['carry', 'smooth', 'pressure'] as const) {
  check(distance(comparisons[0].full.u, comparisons[0][omit].u) + distance(comparisons[0].full.dye, comparisons[0][omit].dye) === 0, `${omit}: equal initial state`)
  check(distance(comparisons[30].full.dye, comparisons[30][omit].dye) > .2, `${omit}: visible transported-dye difference after the same interval`)
}
check(comparisons[30].smooth.metrics().energy > comparisons[30].full.metrics().energy * 1.3, 'removing viscosity retains more energy')
check(comparisons[15].pressure.metrics().divergence > .02, 'omitting pressure leaves an error at the default comparison time')

const folder = '_figure_check/solver-construction'
mkdirSync(folder, { recursive: true })
function render(name: string, sim: Stepper, width: number, height: number) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d')
  const nativeFill = ctx.fillText.bind(ctx), overflows: string[] = []
  ctx.fillText = ((s: string, x: number, y: number) => {
    const measured = ctx.measureText(s).width
    const left = ctx.textAlign === 'right' ? x - measured : ctx.textAlign === 'center' ? x - measured / 2 : x
    if (left < -1 || left + measured > width + 1 || y > height + 1) overflows.push(s)
    nativeFill(s, x, y)
  }) as typeof ctx.fillText
  sim.draw(ctx as unknown as CanvasRenderingContext2D, width, height)
  const first = canvas.toBuffer('image/png')
  sim.draw(ctx as unknown as CanvasRenderingContext2D, width, height)
  check(first.equals(canvas.toBuffer('image/png')), `${name}: draw is pure`)
  check(overflows.length === 0, `${name}: text stays inside the canvas (${overflows.join('; ')})`)
  writeFileSync(`${folder}/${name}.png`, first)
  return first
}
for (const width of [720, 340]) {
  const tall = width < 530
  for (const s of [0, 1.4, 4]) render(`backtrace-${width}-${s}`, createBacktrace({ current: s }), width, 325)
  for (const s of [0, 8, 80]) render(`transport-${width}-${s}`, createTransportErrors({ current: s }), width, tall ? 500 : 310)
  for (const s of [0, 100, 150]) render(`projection-${width}-${s}`, createProjectionLab({ current: s }), width, tall ? 540 : 340)
  for (const s of [0, 160]) render(`iterations-${width}-${s}`, createProjectionLab({ current: s }, true), width, tall ? 540 : 340)
  for (const s of [0, 8]) render(`diffusion-${width}-${s}`, createDiffusion({ current: s }, { current: 'jet' }), width, tall ? 530 : 330)
  for (const s of [0, 1, 2]) render(`cell-${width}-${s}`, createCellFlux({ current: s }), width, 340)
  for (let s = 0; s <= 5; s++) render(`cycle-${width}-${s}`, createCycle({ current: s }, { current: true }), width, tall ? 510 : 335)
  for (const omit of ['carry', 'smooth', 'pressure'] as const) render(`comparison-${width}-${omit}`, createComparison({ current: 15 }, { current: omit }, { current: omit === 'pressure' ? 'divergence' : 'dye' }), width, tall ? 520 : 340)
}
const live = () => createLiveLab({ current: 1 }, { current: true })
const intervention = live(), initialMeasure = intervention.measure()
intervention.addDye()
check(intervention.measure().dye > initialMeasure.dye && intervention.measure().energy === initialMeasure.energy, 'adding dye while paused marks fluid without adding momentum')
intervention.push({ x: .5, y: .5, dx: 0, dy: -10 })
check(intervention.measure().energy !== initialMeasure.energy && intervention.measure().divergence < 1e-8, 'a paused push changes velocity while preserving incompressibility')
const sixty = live(), thirty = live()
for (let i = 0; i < 120; i++) sixty.step(1 / 60)
for (let i = 0; i < 60; i++) thirty.step(1 / 30)
const a = render('live-60fps', sixty, 720, 340), b = render('live-30fps', thirty, 720, 340)
check(a.equals(b), 'render cadence does not change the simulation after equal elapsed time')
console.log(`${checks} construction checks passed. Figures: ${folder}`)
