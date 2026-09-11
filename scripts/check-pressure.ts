import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createPressureComparison, tracePressurePaths } from '../src/sims/PressureOff'
import { projectWingFlow, boxFlux, blendFlow, ui, vi, FLOW_SPEED, type FaceFlow } from '../src/sims/history/projection'
import { NX, NY, inside } from '../src/sims/history/wing'
let checks = 0
function check(condition: boolean, label: string) {
  assert(condition, label)
  checks++
  console.log(`ok ${label}`)
}
const p = projectWingFlow()
check(p.relativeResidual < 1e-8, `pressure converges (${p.iterations} CG iterations)`)
let maxDiv = 0, maxSolidFlux = 0, inlet = 0, outlet = 0
for (let y = 0; y < NY; y++) {
  inlet += p.after.u[ui(0, y)]
  outlet += p.after.u[ui(NX, y)]
  for (let x = 0; x < NX; x++) {
    const faces = [p.after.u[ui(x, y)], p.after.u[ui(x + 1, y)], p.after.v[vi(x, y)], p.after.v[vi(x, y + 1)]]
    if (p.solid[x + y * NX]) maxSolidFlux = Math.max(maxSolidFlux, ...faces.map(Math.abs))
    else maxDiv = Math.max(maxDiv, Math.abs(faces[1] - faces[0] + faces[3] - faces[2]))
  }
}
check(maxDiv < FLOW_SPEED * 1e-8, `all fluid cells balance, including boundary-adjacent cells (${maxDiv.toExponential(2)})`)
check(maxSolidFlux === 0, 'no flux through any solid face')
check(Math.abs(inlet - outlet) < inlet * 1e-9, 'whole-channel inflow equals outflow')
const before = boxFlux(p.before), after = boxFlux(p.after)
// At 35° incidence, one of the probe's fourteen outlet faces remains open.
check(Math.abs(before.ratio - 1 / 14) < 1e-12, 'unprojected box sends out 1/14 of its incoming flow')
check(Math.abs(after.ratio - 1) < 1e-8, 'projected box sends out all incoming flow')
check(after.faces[2] > 50 && after.faces[3] > 0, 'pressure opens both transverse routes out of the nose box')
const flow: FaceFlow = { u: p.before.u.slice(), v: p.before.v.slice() }
let previous = -Infinity
let monotone = true
let linearError = 0
for (let i = 0; i <= 100; i++) {
  const amount = i / 100
  blendFlow(p, amount, flow)
  const f = boxFlux(flow)
  monotone &&= f.ratio > previous
  previous = f.ratio
  linearError = Math.max(linearError, Math.abs(f.incoming - f.outgoing - (1 - amount) * (before.incoming - before.outgoing)))
}
check(monotone, 'restoring pressure improves balance at every slider position')
check(linearError < 1e-6, 'remaining volume imbalance scales with the omitted pressure correction')
const blocked = tracePressurePaths(p.before), restored = tracePressurePaths(p.after)
check(blocked.every(path => path.at(-1)!.x < 112), 'both pressureless paths terminate against the wing')
check(restored.every(path => path.at(-1)!.x > NX - 2), 'both restored paths pass the wing and reach the outlet')
check(restored.every(path => path.every(q => !inside(q.x, q.y))), 'restored streamlines never cross the drawn wing')
const out = '_figure_check/pressure'
mkdirSync(out, { recursive: true })
for (const width of [640, 340]) {
  const height = Math.round(width / 1.12), canvas = createCanvas(width, height), ctx = canvas.getContext('2d')
  const s = createPressureComparison()
  const draw = () => { s.draw(ctx as unknown as CanvasRenderingContext2D, width, height); return ctx.getImageData(0, 0, width, height).data.slice() }
  const first = draw()
  for (let i = 0; i < 120; i++) s.step(1 / 120)
  const moving = draw()
  check(!Buffer.from(first).equals(Buffer.from(moving)), `${width}px: parcels visibly advance`)
  check(Buffer.from(moving).equals(Buffer.from(draw())), `${width}px: draw is pure`)
  writeFileSync(`${out}/${width}-removed.png`, canvas.toBuffer('image/png'))
  s.setPressure(0.5)
  check(Math.abs(s.measure().experiment.ratio - 0.5463806460658467) < 1e-8, `${width}px: intermediate control measures actual face flow`)
  s.setPressure(1)
  const fixed = draw()
  check(Math.abs(s.measure().experiment.ratio - s.measure().reference.ratio) < 1e-12, `${width}px: restored flow matches reference balance`)
  check(!Buffer.from(fixed).equals(Buffer.from(moving)), `${width}px: restoring pressure changes the paused paths and meter`)
  writeFileSync(`${out}/${width}-restored.png`, canvas.toBuffer('image/png'))
  const reset = createPressureComparison()
  reset.draw(ctx as unknown as CanvasRenderingContext2D, width, height)
  check(Buffer.from(first).equals(Buffer.from(ctx.getImageData(0, 0, width, height).data)), `${width}px: Reset reproduces the initial state`)
}
console.log(`${checks} pressure comparison checks passed`)
