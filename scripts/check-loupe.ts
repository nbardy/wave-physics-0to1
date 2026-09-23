import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createLoupe, LOUPE_DT } from '../src/sims/BoundaryLayerLoupe'
import { PALETTE } from '../src/sims/lib/palette'
let checks = 0
const check = (ok: boolean, label: string) => { assert(ok, label); console.log(`ok ${++checks}: ${label}`) }
const probe = { current: 90 }, s = createLoupe(probe)
// createLoupe pre-rolls 200 steps and catches up 160 more over the first
// visible frames (6 per frame); zero-dt frames finish that catch-up here.
for (let i = 0; i < 27; i++) s.step(0)
const shoulder = s.measure()
check(shoulder.time > 4 && shoulder.drag > .3 && shoulder.drag < 3, 'first frame contains developed flow and finite positive pressure drag')
check(shoulder.samples[0].viscous === 0 && Math.abs(shoulder.samples[0].ideal - 2) < 1e-12, 'shoulder contrasts imposed no-slip with the exact potential-flow surface speed')
check(shoulder.samples[4].viscous < .7 && shoulder.samples[20].viscous > .9, 'sampled near-wall flow is slower than flow farther away')
probe.current = 45; const front = s.measure()
probe.current = 135; const rearMirror = s.measure()
check(front.samples.every((p, i) => Math.abs(p.ideal - rearMirror.samples[i].ideal) < 1e-12), 'ideal reference preserves fore-aft symmetry')
check(front.samples[6].viscous - rearMirror.samples[6].viscous > .4, 'computed front and rear profiles differ substantially without changing the flow')
probe.current = 160; const rear = s.measure()
check(rear.samples.filter(p => p.viscous < -.02).length >= 4, 'rear preset locates a visible run of reverse flow once the first frames have caught up')
check(rear.time === shoulder.time && rear.drag === shoulder.drag, 'changing the probe neither advances nor resets physics')
for (const angle of [20, 45, 90, 145, 160]) {
  probe.current = angle
  check(s.measure().samples.every(p => Number.isFinite(p.viscous) && Number.isFinite(p.ideal)), `${angle} degrees: entire profile is finite`)
}
const a = createLoupe({ current: 90 }), b = createLoupe({ current: 90 })
for (let i = 0; i < 30; i++) a.step(1 / 30)
for (let i = 0; i < 60; i++) b.step(1 / 60)
check(JSON.stringify(a.measure()) === JSON.stringify(b.measure()), 'physics is independent of caller cadence')
mkdirSync('_figure_check/loupe', { recursive: true })
for (const w of [340, 640]) {
  const canvas = createCanvas(w, 490), ctx = canvas.getContext('2d')
  const draw = () => { s.draw(ctx as unknown as CanvasRenderingContext2D, w, 490); return Buffer.from(ctx.getImageData(0, 0, w, 490).data) }
  probe.current = 90
  const before = JSON.stringify(s.measure()), pixels = draw()
  check(pixels.equals(draw()) && before === JSON.stringify(s.measure()), `${w}px: rendering is pure`)
  for (const [color, name] of [[PALETTE.vel, 'viscous'], ['#78716c', 'frictionless']]) {
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
    let ink = 0
    // Only the plot interior, excluding legend, probe, and imposed wall point.
    for (let y = 282; y < 421; y++) for (let x = 56; x < w - 24; x++) {
      const k = (y * w + x) * 4
      if (rgb.every((v, i) => Math.abs(v - pixels[k + i]) < 10)) ink++
    }
    check(ink > 70, `${w}px: ${name} profile has its own visible plot ink`)
  }
  probe.current = 160; const changed = draw()
  check(!pixels.equals(changed), `${w}px: moving the probe updates the paused drawing`)
  writeFileSync(`_figure_check/loupe/rear-${w}.png`, canvas.toBuffer('image/png'))
  probe.current = 90; draw()
  writeFileSync(`_figure_check/loupe/shoulder-${w}.png`, canvas.toBuffer('image/png'))
}
s.step(LOUPE_DT * 4)
check(s.measure().time > shoulder.time, 'live flow continues after probe inspection')
console.log(`${checks} boundary-probe checks passed`)
