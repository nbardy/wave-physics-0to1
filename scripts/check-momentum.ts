import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createMomentumTransfer, layerMotion, viscosity, PERIOD } from '../src/sims/MolecularSprings'
let checks = 0
const check = (ok: boolean, message: string) => { assert(ok, message); console.log(`ok ${++checks}: ${message}`) }
let pdeError = 0, derivativeError = 0, boundaryError = 0, maxSpeed = 0
const dy = 1e-4, dt = 1e-4
for (const coupling of [0, 25, 50, 75, 100]) {
  for (let t = 0; t < PERIOD; t += 0.17) {
    boundaryError = Math.max(boundaryError, Math.abs(layerMotion(0, coupling, t).velocity), Math.abs(layerMotion(1, coupling, t).velocity - Math.cos(t * 2 * Math.PI / PERIOD)))
    for (let y = 0.05; y < 1; y += 0.05) {
      const u = layerMotion(y, coupling, t)
      const ut = (layerMotion(y, coupling, t + dt).velocity - layerMotion(y, coupling, t - dt).velocity) / (2 * dt)
      const uyy = (layerMotion(y + dy, coupling, t).velocity - 2 * u.velocity + layerMotion(y - dy, coupling, t).velocity) / dy ** 2
      pdeError = Math.max(pdeError, Math.abs(ut - viscosity(coupling) * uyy))
      const xt = (layerMotion(y, coupling, t + dt).displacement - layerMotion(y, coupling, t - dt).displacement) / (2 * dt)
      derivativeError = Math.max(derivativeError, Math.abs(xt - u.velocity))
      maxSpeed = Math.max(maxSpeed, Math.abs(u.velocity))
    }
  }
}
check(pdeError < 1e-6, `independent finite differences satisfy momentum diffusion (${pdeError.toExponential(2)})`)
check(derivativeError < 1e-7, 'parcel displacement differentiates to displayed velocity')
check(boundaryError < 1e-12, 'moving top and fixed bottom satisfy both boundary conditions')
check(maxSpeed <= 1, 'fluid speed remains bounded by plate speed')
let previous = -1, monotone = true
for (let c = 0; c <= 100; c++) { const a = layerMotion(0.5, c, 0).amplitude; monotone &&= a > previous; previous = a }
check(monotone, 'all 101 slider positions increase actual mid-layer travel')
const low = layerMotion(0.5, 0, 0).amplitude, high = layerMotion(0.5, 100, 0).amplitude
check(low < 0.02 && high > 0.49, `middle layer: weak ${(100 * low).toFixed(2)}%, strong ${(100 * high).toFixed(2)}% of plate`)
const a = createMomentumTransfer(), b = createMomentumTransfer()
for (let i = 0; i < 180; i++) a.step(1 / 60)
for (let i = 0; i < 60; i++) b.step(1 / 20)
check(a.measure().time === b.measure().time, 'same phase at 60 and 20 fps')
for (let i = 0; i < 720; i++) a.step(1 / 120)
check(Math.abs(layerMotion(0.5, 55, a.measure().time).velocity - layerMotion(0.5, 55, b.measure().time).velocity) < 1e-12, 'cycle repeats continuously without random kicks')
const out = '_figure_check/momentum'; mkdirSync(out, { recursive: true })
for (const width of [640, 340]) {
  const height = 470, canvas = createCanvas(width, height), ctx = canvas.getContext('2d')
  const s = createMomentumTransfer(0)
  const draw = () => { s.draw(ctx as unknown as CanvasRenderingContext2D, width, height); return Buffer.from(ctx.getImageData(0, 0, width, height).data) }
  const weak = draw()
  s.setCoupling(100); const strong = draw()
  writeFileSync(`${out}/${width}-strong.png`, canvas.toBuffer('image/png'))
  // Count only velocity blue inside the adjustable fluid pane, excluding plate arrow and headings.
  const bounds = width < 520 ? [12, 300, width - 12, 400] : [width / 2 + 20, 55, width - 12, 409]
  const blue = (pixels: Buffer) => {
    let n = 0
    for (let y = bounds[1]; y < bounds[3]; y++) for (let x = bounds[0]; x < bounds[2]; x++) {
      const i = 4 * (Math.floor(x) + y * width)
      if (Math.abs(pixels[i] - 37) < 20 && Math.abs(pixels[i + 1] - 99) < 20 && Math.abs(pixels[i + 2] - 235) < 20) n++
    }
    return n
  }
  check(blue(strong) > blue(weak) + 100, `${width}px: slider visibly extends fluid velocity arrows (${blue(weak)} → ${blue(strong)} blue pixels)`)
  check(strong.equals(draw()), `${width}px: pure drawing holds the paused state`)
  for (let i = 0; i < 60; i++) s.step(1 / 120)
  check(!strong.equals(draw()), `${width}px: parcels and arrows animate`)
  s.setCoupling(0); draw(); writeFileSync(`${out}/${width}-weak.png`, canvas.toBuffer('image/png'))
  const reset = createMomentumTransfer(0); reset.draw(ctx as unknown as CanvasRenderingContext2D, width, height)
  check(weak.equals(Buffer.from(ctx.getImageData(0, 0, width, height).data)), `${width}px: Reset is deterministic`)
}
console.log(`${checks} momentum-transfer checks passed`)
