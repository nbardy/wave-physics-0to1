import { createCanvas, ImageData } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { createHistoryFlow, bounce, type EraKind } from '../src/sims/history/flow'
import { WakeSolver } from '../src/sims/history/wake'
import { CHORD, U, DT, surface, idealVelocity, inside } from '../src/sims/history/wing'
import { FluidSolver } from '../src/sims/lib/solver'
Object.assign(globalThis, { ImageData, document: { createElement: () => createCanvas(1, 1) } })
const out = '_figure_check/history'
mkdirSync(out, { recursive: true })
let count = 0
const check = (condition: boolean, name: string) => {
  assert(condition, name)
  count++
  console.log(`ok ${name}`)
}
const canvas = createCanvas(960, 480)
const ctx = canvas.getContext('2d')
const shot = (s: ReturnType<typeof createHistoryFlow>) => {
  s.draw(ctx as unknown as CanvasRenderingContext2D, 960, 480)
  return ctx.getImageData(0, 0, 960, 480).data.slice()
}
function changed(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  let n = 0
  for (let i = 0; i < a.length; i += 4) {
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 35) n++
  }
  return n
}
function colors(a: Uint8ClampedArray) {
  let amber = 0, rose = 0
  for (let i = 0; i < a.length; i += 4) {
    const r = a[i], g = a[i + 1], b = a[i + 2]
    if (r > 150 && g > 65 && g < 195 && b < 90) amber++
    if (r > 150 && g < 140 && b > 85 && b < 190) rose++
  }
  return { amber, rose }
}
let normalError = 0, flux = 0, forceX = 0
for (let i = 0; i < 4096; i++) {
  const t = (i + 0.5) * 2 * Math.PI / 4096, h = 1e-5
  const p = surface(t), a = surface(t - h), b = surface(t + h), v = idealVelocity(p.x, p.y)
  const tx = b.x - a.x, ty = b.y - a.y, ds = Math.hypot(tx, ty), normal = (v.x * ty - v.y * tx) / ds
  normalError = Math.max(normalError, Math.abs(normal) / U)
  flux += normal * ds
  forceX += (1 - (v.x * v.x + v.y * v.y) / (U * U)) * ty
}
check(normalError < 1e-6, `ideal flow follows foil surface (normal error ${normalError.toExponential(2)})`)
check(Math.abs(flux) < 1e-6, 'ideal flow has zero net surface flux')
check(Math.abs(forceX) < 1e-6, 'zero-circulation ideal foil has zero pressure drag')
const far = idealVelocity(1e6, 1e6)
check(Math.abs(far.x - U) < 1e-4 && Math.abs(far.y) < 1e-4, 'ideal field tends to horizontal inflow')
const hit = bounce({ x: 0, y: 53 }, { x: 150, y: 53 }, { x: U, y: 0 })
check(hit !== null && Math.abs(Math.hypot(hit.velocity.x, hit.velocity.y) - U) < 1e-8 && !inside(hit.point.x, hit.point.y), 'ballistic foil collision reflects without tunneling or changing speed')
// Transport an isolated dye pulse in a uniform flow. Exact shift after 2s is
// 13.4 cells. Check phase, error against translated Gaussian, positivity/bounds.
function transport(scheme: 'semi-lagrangian' | 'maccormack') {
  const s = new FluidSolver(100, 32, 6.7, 0)
  s.advectionScheme = scheme
  s.dyeDecay = 1
  s.toggles = { advect: false, diffuse: false, project: false }
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 99; x++)
      s.dye[s.idx(x, y)] = Math.exp(-(((x - 25) / 3) ** 2))
  for (let i = 0; i < 80; i++)
    s.step(DT)
  let error = 0, mass = 0, first = 0, min = Infinity, max = -Infinity
  for (let x = 5; x < 90; x++) {
    const q = s.dye[s.idx(x, 16)]
    error += (q - Math.exp(-(((x - 38.4) / 3) ** 2))) ** 2
    mass += q
    first += q * x
    min = Math.min(min, q)
    max = Math.max(max, q)
  }
  return { error, mean: first / mass, min, max }
}
const plain = transport('semi-lagrangian'), corrected = transport('maccormack')
check(corrected.min >= 0 && corrected.max <= 1, 'corrected dye transport preserves bounds')
check(Math.abs(corrected.mean - 38.4) < 0.5, 'limited transport phase error stays below half a grid cell')
check(corrected.error < plain.error * 0.35, `correction reduces translation error (${plain.error.toFixed(3)} → ${corrected.error.toFixed(3)})`)
const eras: EraKind[] = ['newton', 'euler', 'navier', 'reynolds', 'prandtl', 'yours']
const frames = new Map<EraKind, Uint8ClampedArray>()
for (const kind of eras) {
  const start = performance.now(), s = createHistoryFlow(kind), first = shot(s), ink = colors(first)
  check(ink.amber > 250 && ink.rose > 250, `${kind}: both parcel colors present immediately`)
  let maxFluxError = 0, maxDivergence = 0
  for (let i = 0; i < 480; i++) {
    s.step(DT)
    if (i % 40 === 39) {
      const m = s.measure()
      maxFluxError = Math.max(maxFluxError, Math.abs(m.outletRatio - 1))
      maxDivergence = Math.max(maxDivergence, m.divergenceRMS)
      if (kind === 'yours' && i === 159) check(m.reverseCells > 25, `modern wake has measurable reverse flow within 4s (${m.reverseCells} cells)`)
    }
  }
  if (kind !== 'newton' && kind !== 'euler') {
    check(maxFluxError < 1e-5, `${kind}: channel outflow matches inflow throughout the run (${maxFluxError.toExponential(2)})`)
    check(maxDivergence < 1e-3, `${kind}: measured volume imbalance remains small (${maxDivergence.toExponential(2)})`)
  }
  const a = shot(s)
  writeFileSync(`${out}/${kind}.png`, canvas.toBuffer('image/png'))
  for (let i = 0; i < 40; i++)
    s.step(DT)
  const b = shot(s), delta = changed(a, b)
  check(delta > 2500, `${kind}: visible motion after settling (${delta} pixels)`)
  shot(s)
  const again = shot(s)
  check(changed(b, again) === 0, `${kind}: draw is pure / pause holds`)
  const reset = createHistoryFlow(kind)
  check(changed(first, shot(reset)) === 0, `${kind}: deterministic reset`)
  frames.set(kind, a)
  if (kind === 'euler' || kind === 'yours') {
    const before = s.measure(), velocity = s.velocityAt(130, 58)
    s.markWake()
    const marked = shot(s)
    let blue = 0
    for (let y = 180; y < 340; y++) for (let x = 480; x < 700; x++) {
      const k = 4 * (x + y * 960)
      if (marked[k] < 80 && marked[k + 1] < 160 && marked[k + 2] > 180) blue++
    }
    check(blue > 250 && s.measure().wakeMarkers === 180, `${kind}: marking the wake paints a visible local batch while paused`)
    check(s.measure().time === before.time && JSON.stringify(s.velocityAt(130, 58)) === JSON.stringify(velocity), `${kind}: wake marking adds no velocity or elapsed time`)
    check(changed(marked, shot(s)) === 0, `${kind}: marked wake drawing is pure`)
    for (let i = 0; i < 60; i++) s.step(DT)
    check(changed(marked, shot(s)) > 2500, `${kind}: marked fluid moves with the computed flow`)
    writeFileSync(`${out}/${kind}-marked.png`, canvas.toBuffer('image/png'))
  }
  console.log(`${kind}: ${(performance.now() - start).toFixed(0)}ms for 13s simulation`)
}
check(changed(frames.get('navier')!, frames.get('reynolds')!) > 6000, 'viscosity changes the visible flow across eras')
check(changed(frames.get('euler')!, frames.get('yours')!) > 6000, 'ideal and no-slip models show different paths')
for (const kind of ['newton', 'yours'] as EraKind[]) {
  const a = createHistoryFlow(kind), b = createHistoryFlow(kind)
  for (let i = 0; i < 60; i++)
    a.step(1 / 30)
  for (let i = 0; i < 240; i++)
    b.step(1 / 120)
  check(changed(shot(a), shot(b)) === 0, `${kind}: same physics at 30 and 120 Hz`)
}
// Independent long-run guard on the actual face fields, including exact solid
// flux and convergence. A colored wake alone cannot pass this check.
const wake = new WakeSolver(U * CHORD / 1800)
let maxFlux = 0, maxWall = 0, maxSpeed = 0
for (let i = 0; i < 1200; i++) {
  wake.step(DT)
  if (i % 40 !== 39) continue
  let inlet = 0, outlet = 0
  for (let y = 0; y < wake.ny; y++) { inlet += wake.faces.u[y * (wake.nx + 1)]; outlet += wake.faces.u[wake.nx + y * (wake.nx + 1)] }
  maxFlux = Math.max(maxFlux, Math.abs(outlet / inlet - 1))
  for (let k = 0; k < wake.faces.u.length; k++) if (!wake.projector.freeU[k]) maxWall = Math.max(maxWall, Math.abs(wake.faces.u[k]))
  for (let k = 0; k < wake.faces.v.length; k++) if (!wake.projector.freeV[k]) maxWall = Math.max(maxWall, Math.abs(wake.faces.v[k]))
  for (let k = 0; k < wake.u.length; k++) maxSpeed = Math.max(maxSpeed, Math.hypot(wake.u[k], wake.v[k]))
}
check(maxFlux < 1e-5 && maxWall === 0, '30-second wake run conserves channel flow with zero flux through every solid face')
check(Number.isFinite(maxSpeed) && maxSpeed < 6 * U, `unforced wake stays bounded over 30 seconds (${(maxSpeed / U).toFixed(2)}× inlet speed)`)
console.log(`${count} history checks passed; 108×54 MAC wake solver; figures in ${out}`)
