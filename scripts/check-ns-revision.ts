import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { compile } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Stepper } from '../src/components/Sim'
import { APPARATUS as A, channelVelocity, channelHalfWidth, parcelAt, layerMotion, exactShear, shearFlow, similarity, plateForce, inferViscosity, pipeFlux, pipeVelocity, pipeComparison } from '../src/sims/ns-revision/physics'
import { createParcelAcceleration } from '../src/sims/ns-revision/ParcelAcceleration'
import { createLayerMotion } from '../src/sims/ns-revision/LayerMotion'
import { createSimilarity } from '../src/sims/ns-revision/ReynoldsSimilarity'
import { createTransfer, type TransferState } from '../src/sims/ns-revision/ViscosityTransfer'
import { panes } from '../src/sims/solver-lab/view'

let checks = 0
const check = (ok: boolean, name: string) => { assert.ok(ok, name); checks++ }
const near = (a: number, b: number, eps: number, name: string) => check(Math.abs(a - b) < eps, `${name}: ${a} vs ${b}`)
const dx = 1e-5
for (const t of [0, .3, .6, 1.2]) {
  const p = parcelAt(t), before = parcelAt(t - dx), after = parcelAt(t + dx), [u, v] = channelVelocity(p.x, p.y)
  near((after.x - before.x) / (2 * dx), u, 1e-8, 'parcel horizontal trajectory follows field')
  near((after.y - before.y) / (2 * dx), v, 1e-8, 'parcel vertical trajectory follows field')
  near((channelVelocity(p.x + dx, p.y)[0] - channelVelocity(p.x - dx, p.y)[0] + channelVelocity(p.x, p.y + dx)[1] - channelVelocity(p.x, p.y - dx)[1]) / (2 * dx), 0, 1e-9, 'channel has zero divergence')
  near(2 * channelHalfWidth(p.x) * u, 1.4, 1e-12, 'channel section flux is constant')
  const wall = channelHalfWidth(p.x), slope = (channelHalfWidth(p.x + dx) - channelHalfWidth(p.x - dx)) / (2 * dx)
  near(channelVelocity(p.x, wall)[1], u * slope, 1e-8, 'no fluid crosses sloping wall')
}
check(channelVelocity(parcelAt(1.2).x, 0)[0] > 3 * channelVelocity(parcelAt(0).x, 0)[0], 'steady-field parcel visibly accelerates')

// Independent discrete sine expansion of the heat equation with fixed walls.
// Unlike the renderer's Euler stepping, this evolves each eigenmode exactly.
function exactLayers(nu: number, time: number) {
  const n = 32, initial = layerMotion(0).initial, velocity = Array(n).fill(0), travel = Array(n).fill(0)
  for (let k = 1; k < n - 1; k++) {
    const theta = Math.PI * k / (n - 1), amplitude = 2 / (n - 1) * initial.reduce((s, u, j) => s + u * Math.sin(theta * j), 0)
    const lambda = 4 * nu * Math.sin(theta / 2) ** 2, decay = Math.exp(-lambda * time)
    for (let j = 1; j < n - 1; j++) { velocity[j] += amplitude * Math.sin(theta * j) * decay; travel[j] += amplitude * Math.sin(theta * j) * (lambda ? (1 - decay) / lambda : time) }
  }
  return { velocity, travel }
}
for (const nu of [0, 3, 8]) {
  const f = layerMotion(nu), exact = exactLayers(nu, 2)
  check(Math.max(...f.velocity.map((v, i) => Math.abs(v - exact.velocity[i]))) < .002, 'layer speeds agree with independent sine solution')
  check(Math.max(...f.travel.map((v, i) => Math.abs(v - exact.travel[i]))) < .003, 'parcel travel integrates the changing velocity')
  check(f.velocity.every(v => v >= 0 && v <= 1), 'diffusion is bounded across viscosity range')
  check(f.travel[0] === 0 && f.travel[31] === 0, 'wall markers stay still')
}
const free = layerMotion(0), viscous = layerMotion(8)
check(viscous.travel[15] < free.travel[15] && viscous.travel[10] > free.travel[10], 'fast layer gives momentum to an initially stationary layer')
check(viscous.velocity.reduce((s, u) => s + u * u, 0) < free.velocity.reduce((s, u) => s + u * u, 0), 'viscosity dissipates energy')

let worst48 = 0, worst96 = 0
for (const factor of [1, 2, 4]) for (const tau of [0, .2, .6]) {
  const states = similarity(factor, tau)
  states[0].u.forEach((u, i) => near(u, states[1].u[i] / factor, 1e-12, 'matched Re agrees after scaling velocity and time'))
  if (factor > 1 && tau > 0) check(Math.max(...states[2].u.map(v => Math.abs(v / factor))) > Math.max(...states[0].u.map(Math.abs)) + .08, 'mismatched Re preserves visibly more shear')
  for (const state of states) {
    const error = (n: number) => {
      const numerical = shearFlow(state.speed, state.nu, tau, n)
      return Math.max(...numerical.u.map((u, i) => Math.abs(u - exactShear((i + .5) / n, numerical.time, state.speed, state.nu)) / state.speed))
    }
    const coarse = error(48), fine = error(96)
    worst48 = Math.max(worst48, coarse); worst96 = Math.max(worst96, fine)
    check(coarse < .01 && fine < .0025, 'flow matches exact advected diffusion at both resolutions')
    if (tau) check(fine < coarse * .27, 'refinement gives second-order spatial convergence')
    near(state.u.reduce((s, u) => s + u, 0), 0, 1e-12, 'periodic solver preserves horizontal momentum')
  }
}
for (const speed of [.02, .05, .1]) near(inferViscosity(plateForce(speed), speed), .1, 1e-12, 'plate inference gives same viscosity at all speeds')
near(plateForce(.05), .05, 1e-12, 'plate prose example uses SI units')
for (const count of [1, 4, 16]) for (const b of [0, .000125, .00025]) {
  const f = pipeComparison(count, .1, b, 10), r = f.radius
  near(count * Math.PI * r * r, Math.PI * A.radius ** 2, 1e-18, 'bundle preserves total open area')
  const n = 20000, dr = r / n
  let integral = 0
  for (let i = 0; i < n; i++) { const rr = (i + .5) * dr; integral += 2 * Math.PI * rr * pipeVelocity(rr, r, .1, b) * dr }
  near(integral / pipeFlux(r, .1, b), 1, 1e-8, 'independent radial quadrature reproduces flow rate')
  const du = (pipeVelocity(r + dx * r, r, .1, b) - pipeVelocity(r - dx * r, r, .1, b)) / (2 * dx * r)
  near(pipeVelocity(r, r, .1, b), -b * du, 1e-11, 'velocity at the wall satisfies Navier slip with correct sign')
  if (!b) near(f.bundle / f.reference, 1 / count, 1e-12, 'no-slip flow fractions are 1, 1/4, 1/16')
  near(f.bundleVolume, f.bundle * 10, 1e-16, 'collection integrates volume over common interval')
  const re = A.density * pipeFlux(r, .1, b) / (Math.PI * r * r) * (2 * r) / .1
  check(re < 1, 'all pipe controls remain in the creeping laminar regime')
}
near(pipeFlux(A.radius, .2), pipeFlux(A.radius, .1) / 2, 1e-16, 'doubling viscosity halves pipe flux')

const folder = '_figure_check/ns-revision'
mkdirSync(folder, { recursive: true })
function render(name: string, sim: Stepper, w: number, h: number) {
  const canvas = createCanvas(w, h), ctx = canvas.getContext('2d'), fill = ctx.fillText.bind(ctx), overflow: string[] = []
  ctx.fillText = ((s: string, x: number, y: number) => {
    const width = ctx.measureText(s).width, left = ctx.textAlign === 'right' ? x - width : ctx.textAlign === 'center' ? x - width / 2 : x
    if (left < -1 || left + width > w + 1 || y > h || y < 0) overflow.push(s)
    fill(s, x, y)
  }) as typeof ctx.fillText
  sim.draw(ctx as unknown as CanvasRenderingContext2D, w, h)
  const first = canvas.toBuffer('image/png')
  sim.draw(ctx as unknown as CanvasRenderingContext2D, w, h)
  check(first.equals(canvas.toBuffer('image/png')), `${name}: draw is pure`)
  sim.step(1 / 30); sim.draw(ctx as unknown as CanvasRenderingContext2D, w, h)
  check(first.equals(canvas.toBuffer('image/png')), `${name}: scrubbed experiment independent of RAF`)
  check(!overflow.length, `${name}: text bounds: ${overflow.join(', ')}`)
  writeFileSync(`${folder}/${name}.png`, first)
  return ctx
}
// Inspect only the amber parcel / volume colour, excluding guides and labels.
const amber = (ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>, x: number, y: number) => {
  const [r, g, b, a] = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data
  return Math.abs(r - 217) < 12 && Math.abs(g - 119) < 12 && Math.abs(b - 6) < 12 && a > 240
}
for (const w of [720, 320]) {
  for (const time of [0, .6, 1.2]) {
    const ctx = render(`parcel-${w}-${time}`, createParcelAcceleration({ current: time }), w, 422), p = parcelAt(time)
    check(amber(ctx, 26 + p.x / 3 * (w - 52), 116 - p.y * 98), 'amber parcel is at the measured trajectory position')
  }
  for (const nu of [0, 8]) {
    const height = w === 720 ? 340 : 610, f = layerMotion(nu), ctx = render(`layers-${w}-${nu}`, createLayerMotion({ current: f }), w, height), p = panes(w, height)[1]
    const x = p.x + 8 + (p.w - 26) / 2 * f.travel[10], y = p.y + 68 + 10 / 31 * (p.h - 108)
    // A velocity arrow starts at this dot and can cover its centre. Sample the
    // dot's amber disc around that centre, never the blue arrow or gray ghost.
    check([-2, -1, 0, 1, 2].some(dy => [-2, -1, 0, 1, 2].some(dx => amber(ctx, x + dx, y + dy))), 'initially stationary amber layer moves to computed displacement')
  }
  for (const factor of [1, 4]) for (const tau of [0, .6]) render(`similarity-${w}-${factor}-${tau}`, createSimilarity({ current: similarity(factor, tau) }), w, w === 720 ? 390 : 910)
  for (const stage of ['plate', 'pipes', 'slip'] as const) for (const count of [1, 4, 16]) {
    const height = w === 720 ? (stage === 'plate' ? 390 : 450) : (stage === 'plate' ? 750 : 890)
    const state: TransferState = { stage, count, speed: .1, mu: .1, slip: .00025, time: 10 }
    const ctx = render(`transfer-${w}-${stage}-${count}`, createTransfer({ current: state }), w, height)
    if (stage !== 'plate') panes(w, height).forEach((p, i) => {
      const top = p.y + 243, bottom = p.y + p.h - 40, c = pipeComparison(count, .1, stage === 'slip' ? .00025 : 0, 10)
      const volume = i ? c.bundleVolume : c.referenceVolume, expected = volume / (2 * pipeFlux(A.radius, .1) * 10) * (bottom - top)
      let actual = 0
      for (let y = Math.ceil(top); y < bottom - 1; y++) if (amber(ctx, p.x + p.w / 2, y)) actual++
      near(actual, expected, 2, 'amber collection height matches actual volume, not vessel outline')
    })
  }
}
const baseline = readFileSync('src/lessons/lesson-01-navier-stokes.I.mdx', 'utf8'), revised = readFileSync('src/lessons/lesson-01-navier-stokes.II.mdx', 'utf8')
check(baseline !== revised && revised.includes('<ParcelAcceleration />') && !baseline.includes('<ParcelAcceleration />'), 'I and II are distinct complete reading versions')
check(!revised.includes('<RippleWaves') && revised.includes('## Running the Equation') && revised.includes('## Final Words'), 'II ends on the solver and retains a complete ending')
// Production intentionally strips draft versions. Compile II explicitly with
// the same MDX/math plugins so a green public build cannot hide a broken draft.
const compiled = await compile(revised, { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex], providerImportSource: '@mdx-js/react' })
check(compiled.messages.length === 0, `II MDX/math compilation: ${compiled.messages.map(m => m.message).join('; ')}`)
check(String(compiled).includes('"Final Words"'), 'compiled II reaches the final heading')
console.log(`${checks} revision checks passed; max normalized flow error: N48=${worst48.toFixed(6)}, N96=${worst96.toFixed(6)}. Figures: ${folder}`)
