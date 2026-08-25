/**
 * SplitMeterTeach checks: the teach figure's one claim is that the two panes
 * ask different questions — per-step KL is depth-blind while trajectory TV
 * grows with depth. Both asserted from the figure's own stepper, plus ink.
 * Run: bun run scripts/check-teach.ts
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import {
  createSplitMeterTeach,
  TEACH_T_MAX,
  type TeachMeterProbe,
} from '../src/sims/pbits/SplitMeterTeach'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

function readAt(T: number, png?: string): { kl: number; tv: number } {
  const probe: TeachMeterProbe = { kl: 0, tv: 0 }
  const shared = { current: { T } }
  const stepper = createSplitMeterTeach(shared, probe)
  const canvas = createCanvas(640, 230)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  stepper.step(1 / 60)
  stepper.draw(ctx, 640, 230)
  if (png) writeFileSync(join(OUT, png), canvas.toBuffer('image/png'))
  if (png) {
    const img = ctx.getImageData(0, 0, 640, 230)
    const ink = (hex: string, tol = 40) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      let n = 0
      for (let i = 0; i < img.data.length; i += 4) {
        if (img.data[i + 3] < 60) continue
        if (
          Math.abs(img.data[i] - r) < tol &&
          Math.abs(img.data[i + 1] - g) < tol &&
          Math.abs(img.data[i + 2] - b) < tol
        )
          n++
      }
      return n
    }
    ok(ink(PALETTE.meter) > 150, 'teach/meter-ink', `${ink(PALETTE.meter)} px of meter bars`)
    ok(ink(PALETTE.visit) > 30, 'teach/visit-glow', `${ink(PALETTE.visit)} px of visit ticks`)
  }
  return { kl: probe.kl, tv: probe.tv }
}

const depths = [1, 5, 10, 20, TEACH_T_MAX]
const readings = depths.map((T, i) =>
  readAt(T, i === 0 ? 'teach-shallow.png' : i === depths.length - 1 ? 'teach-deep.png' : undefined),
)

{
  // the left pane is depth-blind: identical KL at every depth, exactly
  const kls = new Set(readings.map((r) => r.kl))
  ok(kls.size === 1, 'teach/kl-depth-blind', `KL ${readings[0].kl.toFixed(4)} at every depth`)
}

{
  // the right pane IS depth: TV nondecreasing, and deep meaningfully above shallow
  let monotone = true
  for (let i = 1; i < readings.length; i++) if (readings[i].tv < readings[i - 1].tv - 1e-12) monotone = false
  ok(monotone, 'teach/tv-monotone', readings.map((r, i) => `T=${depths[i]}: ${r.tv.toFixed(3)}`).join(' · '))
  ok(
    readings[readings.length - 1].tv > readings[0].tv * 1.2,
    'teach/tv-grows',
    `TV ${readings[0].tv.toFixed(3)} → ${readings[readings.length - 1].tv.toFixed(3)}`,
  )
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
