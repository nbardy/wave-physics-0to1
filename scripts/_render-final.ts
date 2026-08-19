// Scratch harness (not a check): render the final-items figures at 640 and
// 360 into _figure_check/final/ for eyeballing. Delete before finishing? No —
// harmless, but keep out of package.json.
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { createGridSchedules } from '../src/sims/pbits/GridSchedules'
import { createPhaseTrainer } from '../src/sims/pbits/PhaseTrainer'
import { createDreamChain } from '../src/sims/pbits/DreamChain'
import { createDreamCompare } from '../src/sims/pbits/DreamCompare'
import { createBitFlicker } from '../src/sims/pbits/BitFlicker'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check', 'final')
mkdirSync(OUT, { recursive: true })

const suffix = process.argv[2] ?? 'pre'

function render(name: string, w: number, h: number, make: () => Stepper, seconds: number) {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = make()
  for (let i = 0; i < Math.round(seconds * 60); i++) stepper.step(1 / 60)
  ctx.clearRect(0, 0, w, h)
  stepper.draw(ctx, w, h)
  writeFileSync(join(OUT, `${name}-${w}-${suffix}.png`), canvas.toBuffer('image/png'))
}

for (const w of [640, 360]) {
  render('grid-schedules', w, 320, () => createGridSchedules({ current: { schedule: 'sequential' } }), 20)
  render('phase-trainer', w, 330, () => createPhaseTrainer({ current: { level: 2 } }), 30)
  render('dream-chain', w, 200, () => createDreamChain({ current: { sweeps: 6 } }), 40)
  render('dream-compare-fact', w, 240, () => createDreamCompare('factorized'), 30)
  render('dream-compare-sync', w, 240, () => createDreamCompare('synchronous'), 30)
  render('bitflicker-trace', w, 230, () => createBitFlicker({ current: { h: 1 } }, true), 20)
}
console.log('done', OUT)
