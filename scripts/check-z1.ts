/**
 * Part-2 infrastructure checks: the Z1 fabric generated from its offset
 * rules, and the two structural theorems the article leans on — the
 * checkerboard survives (bipartite), and hanging by any visible set yields
 * strictly adjacent-layer wiring. Plus a sampling-correctness check that the
 * generated fabric, under its own two-coloring, sits at the exact floor on a
 * clamped-window oracle. Run: bun run scripts/check-z1.ts
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import {
  countsToProbs,
  enumerate,
  freshSpins,
  stateIndex,
  subModel,
  sweep,
  tvDistance,
  u01,
} from '../src/sims/pbits/lib'
import { layersFromVisible, z1Chromatic, z1Graph, z1Model, z1Offsets } from '../src/sims/pbits/z1'
import { createZ1Layers, pickVisible } from '../src/sims/pbits/Z1Layers'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

{
  // the sixteen offsets: distinct, and every one odd-parity
  const offs = z1Offsets()
  const uniq = new Set(offs.map(([a, b]) => `${a},${b}`))
  ok(offs.length === 16 && uniq.size === 16, 'z1/offsets', `${uniq.size} distinct of ${offs.length}`)
  const oddities = offs.filter(([a, b]) => ((a + b) % 2 + 2) % 2 === 1).length
  ok(oddities === 16, 'z1/parity', `${oddities}/16 offsets have odd parity — checkerboard survives`)
}

const g = z1Graph(12, 12)

{
  // degree exactly 16 everywhere on the torus; edge count matches
  const degs = new Set(Array.from({ length: g.n }, (_, i) => g.nbr[i].length))
  ok(degs.size === 1 && degs.has(16), 'z1/degree', `degrees: {${[...degs].join(',')}}`)
  ok(g.edges.length === (g.n * 16) / 2, 'z1/edges', `${g.edges.length} edges for n=${g.n}`)
}

{
  // the (x+y) coloring is legal — buildChromatic throws otherwise
  const m = z1Model(g, 0.3, 1)
  let legal = true
  try {
    z1Chromatic(m, g)
  } catch {
    legal = false
  }
  ok(legal, 'z1/two-coloring', 'checkerboard coloring accepted by the schedule guard')
}

{
  // layering theorem: with one-color visible sets, no wire stays inside a
  // layer — and the theorem's boundary: a mixed-color visible set breaks it.
  let clean = true
  let layersSeen = 0
  for (let roll = 1; roll <= 5; roll++) {
    const layer = layersFromVisible(g, pickVisible(g, roll))
    layersSeen = Math.max(layersSeen, Math.max(...layer) + 1)
    for (const [i, j] of g.edges) {
      const d = Math.abs(layer[i] - layer[j])
      if (d !== 1) clean = false
    }
  }
  ok(clean, 'z1/layering', 'one-color visible: every edge spans exactly adjacent layers (5 sets)')
  ok(layersSeen >= 3, 'z1/depth', `up to ${layersSeen} layers from 3 visible cells`)
  // boundary: two adjacent visible cells (necessarily opposite colors) share
  // layer 0, so their own wire stays inside a layer
  const mixed = [0, g.nbr[0][0]]
  const layerM = layersFromVisible(g, mixed)
  let sameLayer = 0
  for (const [i, j] of g.edges) if (layerM[i] === layerM[j]) sameLayer++
  ok(sameLayer > 0, 'z1/layering-boundary', `mixed-color visible: ${sameLayer} same-layer edges appear`)
}

{
  // sampling correctness on the real fabric: clamp everything except a
  // 4-cell window, enumerate the conditional, run the chip's own schedule
  const clamp = new Int8Array(g.n)
  const win = [0, 1, 12, 13] // a 2×2 patch (sites of the 12-wide torus)
  const winSet = new Set(win)
  for (let i = 0; i < g.n; i++) if (!winSet.has(i)) clamp[i] = u01(7, 0, i, 1) < 0.5 ? -1 : 1
  const m = z1Model(g, 0.35, 1, clamp)
  const sched = z1Chromatic(m, g)
  const s = freshSpins(m, 3)
  const exact = enumerate(subModel(m, s, win))
  const counts = new Float64Array(16)
  for (let t = 1; t <= 60_000; t++) {
    sweep(m, s, sched, (site, salt) => u01(11, t, site, salt))
    if (t > 2_000) counts[stateIndex(s, win)]++
  }
  const tv = tvDistance(exact, countsToProbs(counts))
  ok(tv < 0.02, 'z1/gibbs-floor', `chromatic on the fabric vs exact window: TV ${tv.toFixed(4)}`)
}

{
  // the figure: render, then assert the specific inks — held rings for the
  // visible cells on both panes, meter-violet layered nodes, ferro wires
  const W = 640
  const H = 300
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = createZ1Layers({ current: { roll: 1 } })
  stepper.step(1 / 60)
  stepper.draw(ctx, W, H)
  writeFileSync(join(OUT, 'z1-layers.png'), canvas.toBuffer('image/png'))
  const img = ctx.getImageData(0, 0, W, H)
  const ink = (hex: string, tol = 40) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const gg = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    let count = 0
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i + 3] < 60) continue
      if (
        Math.abs(img.data[i] - r) < tol &&
        Math.abs(img.data[i + 1] - gg) < tol &&
        Math.abs(img.data[i + 2] - b) < tol
      )
        count++
    }
    return count
  }
  ok(ink(PALETTE.held) > 60, 'fig/z1-held-rings', `${ink(PALETTE.held)} px of held ink`)
  ok(ink(PALETTE.meter) > 200, 'fig/z1-layer-nodes', `${ink(PALETTE.meter)} px of meter ink`)
  ok(ink(PALETTE.ferro) > 150, 'fig/z1-wires', `${ink(PALETTE.ferro)} px of wire ink`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
