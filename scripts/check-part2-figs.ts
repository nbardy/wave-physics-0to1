/**
 * Part-2 figure checks: the λ-shift deep cut (F10), the mixing–expressivity
 * dial (F11), and the placement/cost strip (F13 with the minimal F12
 * embedding readout). Numeric claims first, then each figure rendered
 * headlessly with its knob driven to both ends and its own inks sampled.
 * Run: bun run scripts/check-part2-figs.ts
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import {
  backwardMaxTV,
  createLambdaShift,
  forwardKernel,
  forwardMaxTV,
  lambdaRegions,
  offsetsFor,
} from '../src/sims/pbits/LambdaShift'
import { createMixingDial, MIX_CAPS, mixPoint } from '../src/sims/pbits/MixingDial'
import {
  costTotal,
  createCostStrip,
  embedWalkKernel,
  READOUT_ITERS,
  REFLASH_ITERS,
  type CostProbe,
} from '../src/sims/pbits/CostStrip'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

const W = 640

function render(create: () => { step: (dt: number) => void; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void }, h: number, steps = 1): Canvas {
  const canvas = createCanvas(W, h)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = create()
  for (let k = 0; k < steps; k++) stepper.step(1 / 60)
  stepper.draw(ctx, W, h)
  return canvas
}

function inkCount(canvas: Canvas, hex: string, tol = 40): number {
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let count = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 60) continue
    if (
      Math.abs(img.data[i] - r) < tol &&
      Math.abs(img.data[i + 1] - g) < tol &&
      Math.abs(img.data[i + 2] - b) < tol
    )
      count++
  }
  return count
}

/** Count pixels that differ between two canvases inside one region. */
function regionDiff(a: Canvas, b: Canvas, rx: number, ry: number, rw: number, rh: number): number {
  const ia = a.getContext('2d').getImageData(rx, ry, rw, rh).data
  const ib = b.getContext('2d').getImageData(rx, ry, rw, rh).data
  let diff = 0
  for (let i = 0; i < ia.length; i += 4) {
    if (ia[i] !== ib[i] || ia[i + 1] !== ib[i + 1] || ia[i + 2] !== ib[i + 2] || ia[i + 3] !== ib[i + 3])
      diff++
  }
  return diff
}

// ---------------------------------------------------------------------------
// F10 — λ-shift: forward TV ≡ 0 across the knob, backward TV > threshold
// ---------------------------------------------------------------------------

{
  for (const mag of [0, 0.5, 1.5, 3]) {
    const tv = forwardMaxTV(mag)
    ok(tv < 1e-12, `lambda/forward-invariant λ=${mag}`, `max TV(A,B) forward = ${tv.toExponential(2)}`)
  }
  ok(backwardMaxTV(0) === 0, 'lambda/backward-zero-at-zero', 'λ = 0 ⇒ the two models are the same model')
  for (const mag of [0.5, 1.5, 3]) {
    const tv = backwardMaxTV(mag)
    ok(tv > 0.05, `lambda/backward-moves λ=${mag}`, `max TV(A,B) backward = ${tv.toFixed(3)}`)
  }
  // each forward conditional is a distribution
  const lam = offsetsFor('B', 2)
  let sumsOk = true
  for (let x = 0; x < 4; x++) {
    const k = forwardKernel(lam, x)
    let s = 0
    for (let y = 0; y < 4; y++) s += k[y]
    if (Math.abs(s - 1) > 1e-12) sumsOk = false
  }
  ok(sumsOk, 'lambda/normalized', 'forward kernels sum to 1 at every context')
}

{
  // the figure, knob at both ends: forward panes pixel-IDENTICAL, backward not
  const H = 400
  const at = (mag: number) => render(() => createLambdaShift({ current: { mag } }), H)
  const c0 = at(0)
  const c3 = at(3)
  writeFileSync(join(OUT, 'lambda-shift.png'), c3.toBuffer('image/png'))
  const { fwd, bwd } = lambdaRegions(W, H)
  const fDiff = regionDiff(c0, c3, Math.round(fwd.x), Math.round(fwd.y), Math.round(fwd.w), Math.round(fwd.h))
  const bDiff = regionDiff(c0, c3, Math.round(bwd.x), Math.round(bwd.y), Math.round(bwd.w), Math.round(bwd.h))
  ok(fDiff === 0, 'fig/lambda-forward-frozen', `${fDiff} px differ in the forward panes between λ=0 and λ=3`)
  ok(bDiff > 300, 'fig/lambda-backward-moves', `${bDiff} px differ in the backward panes between λ=0 and λ=3`)
  ok(inkCount(c3, PALETTE.meter) > 300, 'fig/lambda-meter-ink', `${inkCount(c3, PALETTE.meter)} px of meter ink`)
  ok(inkCount(c3, PALETTE.ferro) > 100, 'fig/lambda-diff-ink', `${inkCount(c3, PALETTE.ferro)} px of ferro ink in |A−B|`)
  ok(inkCount(c3, PALETTE.sUp) > 100, 'fig/lambda-offset-bars', `${inkCount(c3, PALETTE.sUp)} px of λ-bar ink`)
}

// ---------------------------------------------------------------------------
// F11 — mixing dial: three measured quantities move monotonically with the cap
// ---------------------------------------------------------------------------

{
  const points = MIX_CAPS.map((cap) => mixPoint(cap))
  for (const pt of points) {
    console.log(
      `     cap ${pt.cap.toFixed(2)}  KL ${pt.kl.toFixed(4)}  τ ${pt.tau.toFixed(1)}  ESS/sweep ${pt.ess.toFixed(4)}`,
    )
  }
  let klMono = true
  let tauMono = true
  let essMono = true
  for (let i = 1; i < points.length; i++) {
    if (points[i].kl >= points[i - 1].kl + 1e-9) klMono = false
    if (points[i].tau < points[i - 1].tau * 0.9) tauMono = false
    if (points[i].ess > points[i - 1].ess * 1.1) essMono = false
  }
  const first = points[0]
  const last = points[points.length - 1]
  ok(klMono && last.kl < first.kl / 2, 'mix/kl-falls', `KL ${first.kl.toFixed(3)} → ${last.kl.toFixed(3)} across the cap range`)
  ok(tauMono && last.tau > 2 * first.tau, 'mix/tau-rises', `τ ${first.tau.toFixed(1)} → ${last.tau.toFixed(1)} sweeps`)
  ok(essMono && last.ess < first.ess / 2, 'mix/ess-collapses', `ESS/sweep ${first.ess.toFixed(3)} → ${last.ess.toFixed(4)}`)
}

{
  // the figure at both knob ends, probe agreeing with the measured grid
  const H = 330
  const probeLo = { kl: -1, tau: -1, ess: -1 }
  const cLo = render(() => createMixingDial({ current: { capIdx: 0 } }, probeLo), H, 2)
  const probeHi = { kl: -1, tau: -1, ess: -1 }
  const cHi = render(() => createMixingDial({ current: { capIdx: MIX_CAPS.length - 1 } }, probeHi), H, 2)
  writeFileSync(join(OUT, 'mixing-dial.png'), cHi.toBuffer('image/png'))
  const lo = mixPoint(MIX_CAPS[0])
  const hi = mixPoint(MIX_CAPS[MIX_CAPS.length - 1])
  ok(probeLo.kl === lo.kl && probeLo.tau === lo.tau, 'fig/mix-probe-lo', `figure shows the measured point at cap ${lo.cap}`)
  ok(probeHi.kl === hi.kl && probeHi.tau === hi.tau, 'fig/mix-probe-hi', `figure shows the measured point at cap ${hi.cap}`)
  ok(inkCount(cHi, PALETTE.ghost) > 150, 'fig/mix-ghost-ink', `${inkCount(cHi, PALETTE.ghost)} px of exact-target ghost`)
  ok(inkCount(cHi, PALETTE.meter) > 200, 'fig/mix-meter-ink', `${inkCount(cHi, PALETTE.meter)} px of meter ink`)
  ok(inkCount(cHi, PALETTE.ferro) > 40, 'fig/mix-tau-ink', `${inkCount(cHi, PALETTE.ferro)} px of τ-curve ink`)
  ok(inkCount(cHi, PALETTE.anti) > 40, 'fig/mix-ess-ink', `${inkCount(cHi, PALETTE.anti)} px of ESS-curve ink`)
  const diff = regionDiff(cLo, cHi, 16, 46, Math.round(W * 0.42), 180)
  ok(diff > 300, 'fig/mix-knob-moves', `${diff} px differ in the fit pane between cap ends`)
}

// ---------------------------------------------------------------------------
// F13 (+F12) — cost strip: exact meter arithmetic, real embedding counter
// ---------------------------------------------------------------------------

{
  ok(
    costTotal(1234, 2, 1) === 1234 + 2 * READOUT_ITERS + 1 * REFLASH_ITERS,
    'cost/arithmetic',
    `costTotal(1234, 2, 1) = ${costTotal(1234, 2, 1)}`,
  )

  const emb = embedWalkKernel()
  const logical = new Set([...emb.ins, ...emb.hids, ...emb.outs])
  ok(logical.size === 13, 'cost/logical-count', `${logical.size} distinct logical cells`)
  ok(
    emb.physical === 13 + emb.chain.length,
    'cost/physical-count',
    `${emb.physical} physical = 13 logical + ${emb.chain.length} chain cells`,
  )
  ok(
    emb.chain.every((c) => !logical.has(c)) && emb.chain.length > 0,
    'cost/chain-disjoint',
    `${emb.chain.length} chain cells, none of them logical`,
  )
  ok(emb.perLogical > 1.5, 'cost/embedding-tax', `${emb.perLogical.toFixed(2)} physical spins per logical spin`)

  // drive the figure: run sweeps, then press both buttons and re-bill
  const H = 300
  const shared = { current: { readouts: 0, reflashes: 0 } }
  const probe: CostProbe = { total: -1, sweeps: -1, readouts: -1, reflashes: -1, perLogical: -1 }
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  const stepper = createCostStrip(shared, probe)
  for (let k = 0; k < 180; k++) stepper.step(1 / 60)
  stepper.draw(ctx, W, H)
  ok(probe.sweeps === 180 && probe.total === 180, 'cost/sweeps-billed', `${probe.sweeps} sweeps → ${probe.total} iterations`)
  shared.current.readouts = 2
  shared.current.reflashes = 1
  stepper.step(1 / 60)
  stepper.draw(ctx, W, H)
  writeFileSync(join(OUT, 'cost-strip.png'), canvas.toBuffer('image/png'))
  ok(
    probe.total === costTotal(probe.sweeps, 2, 1) && probe.total === probe.sweeps + 2 * READOUT_ITERS + REFLASH_ITERS,
    'cost/meter-exact',
    `${probe.sweeps} sweeps + 2 readouts + 1 reflash = ${probe.total} printed`,
  )
  ok(probe.perLogical === emb.perLogical, 'cost/counter-matches', `figure counter = ${probe.perLogical.toFixed(2)}`)
  ok(inkCount(canvas, PALETTE.held) > 60, 'fig/cost-in-halos', `${inkCount(canvas, PALETTE.held)} px of held ink`)
  ok(inkCount(canvas, PALETTE.meter) > 150, 'fig/cost-meter-ink', `${inkCount(canvas, PALETTE.meter)} px of meter ink`)
  ok(inkCount(canvas, PALETTE.ferro) > 200, 'fig/cost-chain-ink', `${inkCount(canvas, PALETTE.ferro)} px of chain ink`)
  ok(inkCount(canvas, PALETTE.sUp) > 100, 'fig/cost-spin-ink', `${inkCount(canvas, PALETTE.sUp)} px of spin ink`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
