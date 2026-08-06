import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { u01, drawLayerRail } from './lib'
import { drawKernelHeat, sigma, XOR_INPUTS, xorTarget } from './act3'

// PLAN F23 — a kernel that cannot compile without help. Noisy-XOR of two
// inputs: y should say "the inputs differ," wrong 10% of the time. The
// visible-only machine (y wired straight to x₁ and x₂, plus a bias) descends
// its loss and hits a floor it cannot leave — its conditional is a monotone
// function of a weighted vote, and XOR is not a vote. Add ONE hidden p-bit w
// and the same descent collapses the floor. The fit runs on EXACT enumerated
// kernels — with two free spins there are four states per input, so the
// gradient needs no sampling at all (said honestly in prose). The trained
// object, an energy model shaped until its conditional matches a target
// kernel, is a thermodynamic kernel — the thing Thermalizers fits.
//
// β = 1 throughout, folded into the parameters.

export type XorMode = 'visible' | 'hidden'

// visible params: [c0, c1, c2] — log-odds/2 of y is c0 + c1·x1 + c2·x2
// hidden params: [by, bw, a1, a2, e1, e2, g] — energy
//   −E = by·y + bw·w + a1·x1·y + a2·x2·y + e1·x1·w + e2·x2·w + g·w·y
export function kernelOf(mode: XorMode, p: Float64Array, x1: number, x2: number): number {
  if (mode === 'visible') return sigma(2 * (p[0] + p[1] * x1 + p[2] * x2))
  let num = 0
  let den = 0
  for (const w of [-1, 1]) {
    for (const y of [-1, 1]) {
      const e =
        p[0] * y + p[1] * w + p[2] * x1 * y + p[3] * x2 * y + p[4] * x1 * w + p[5] * x2 * w + p[6] * w * y
      const wgt = Math.exp(e)
      den += wgt
      if (y === 1) num += wgt
    }
  }
  return num / den
}

/** Cross-entropy of the model kernel against the noisy-XOR target. */
export function xorLoss(mode: XorMode, p: Float64Array): number {
  let L = 0
  for (const [x1, x2] of XOR_INPUTS) {
    const t = xorTarget(x1, x2)
    const q = Math.min(1 - 1e-9, Math.max(1e-9, kernelOf(mode, p, x1, x2)))
    L += -t * Math.log(q) - (1 - t) * Math.log(1 - q)
  }
  return L
}

/** Mean |K̃(y=+|x) − K*(y=+|x)| over the four inputs — the printed error. */
export function xorError(mode: XorMode, p: Float64Array): number {
  let e = 0
  for (const [x1, x2] of XOR_INPUTS) e += Math.abs(kernelOf(mode, p, x1, x2) - xorTarget(x1, x2))
  return e / XOR_INPUTS.length
}

export function freshParams(mode: XorMode, seed = 7): Float64Array {
  const n = mode === 'visible' ? 3 : 7
  const p = new Float64Array(n)
  for (let k = 0; k < n; k++) p[k] = (u01(seed, 0, k, 0) - 0.5) * 0.4
  return p
}

/** One plain gradient-descent step (central finite differences — exact enough). */
export function fitStep(mode: XorMode, p: Float64Array, lr = 0.3): number {
  const eps = 1e-4
  const g = new Float64Array(p.length)
  for (let k = 0; k < p.length; k++) {
    const keep = p[k]
    p[k] = keep + eps
    const up = xorLoss(mode, p)
    p[k] = keep - eps
    const dn = xorLoss(mode, p)
    p[k] = keep
    g[k] = (up - dn) / (2 * eps)
  }
  for (let k = 0; k < p.length; k++) p[k] -= lr * g[k]
  return xorLoss(mode, p)
}

/** Run a whole fit — the check script's oracle path. */
export function runFit(mode: XorMode, steps: number, seed = 7): { p: Float64Array; err: number } {
  const p = freshParams(mode, seed)
  for (let t = 0; t < steps; t++) fitStep(mode, p)
  return { p, err: xorError(mode, p) }
}

export interface XorShared {
  mode: XorMode
}

export interface XorProbe {
  err: number
  step: number
}

const STEPS_PER_SEC = 2400

export function createXorHidden(shared: { current: XorShared }, probe?: XorProbe): Stepper {
  let mode = shared.current.mode
  let p = freshParams(mode)
  let history: number[] = []
  let stride = 5 // record every Nth loss; doubles when full, so the WHOLE
  // descent stays on screen instead of scrolling away once converged
  let stepN = 0
  let acc = 0

  return {
    step(dt) {
      if (shared.current.mode !== mode) {
        mode = shared.current.mode
        p = freshParams(mode)
        history = []
        stride = 5
        stepN = 0
      }
      acc += dt * STEPS_PER_SEC
      acc = Math.min(acc, STEPS_PER_SEC / 10)
      while (acc >= 1) {
        acc -= 1
        stepN++
        const L = fitStep(mode, p)
        if (stepN % stride === 0) history.push(L)
        if (history.length >= 400) {
          history = history.filter((_, i) => i % 2 === 0)
          stride *= 2
        }
      }
      if (probe) {
        probe.err = xorError(mode, p)
        probe.step = stepN
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const err = xorError(mode, p)

      // loss curve
      const lr: Rect = { x: w * 0.05, y: 40, w: w * 0.3, h: h - 116 }
      paneFrame(ctx, lr)
      if (history.length > 1) {
        // the loss can never beat the target's own entropy, 4·H(0.9) ≈ 1.30 —
        // the axis floor sits just under it so convergence reads as "bottom"
        const lo = 1.25
        const hi = 3
        ctx.strokeStyle = PALETTE.meter
        ctx.lineWidth = 1.6
        ctx.beginPath()
        history.forEach((L, i) => {
          const x = lr.x + (i / (history.length - 1)) * lr.w
          const y = lr.y + lr.h * (1 - (Math.log(Math.max(L, lo)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText('training loss (log scale)', lr.x, lr.y - 8)
      ctx.fillText(`${stepN.toLocaleString()} gradient steps`, lr.x, lr.y + lr.h + 16)
      ctx.font = FONT_METER
      ctx.fillStyle = err > 0.1 ? PALETTE.ferro : PALETTE.meter
      ctx.fillText(`mean kernel error: ${fmt(err, 3)}`, lr.x, lr.y + lr.h + 38)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText(
        mode === 'visible' ? 'two wires, no hidden spin' : 'two inputs + ONE hidden p-bit',
        lr.x,
        14,
      )

      // target / compiled / error tables over the four inputs
      const rowLabels = XOR_INPUTS.map(([a, b]) => `${a > 0 ? '+' : '-'}${b > 0 ? '+' : '-'}`)
      const target = XOR_INPUTS.map(([a, b]) => {
        const t = xorTarget(a, b)
        return [1 - t, t]
      })
      const compiled = XOR_INPUTS.map(([a, b]) => {
        const q = kernelOf(mode, p, a, b)
        return [1 - q, q]
      })
      const errMap = compiled.map((rw, r) => rw.map((v, c) => Math.abs(v - target[r][c])))
      const hm = (i: number): Rect => ({
        x: w * (0.42 + i * 0.2),
        y: 40,
        w: w * 0.15,
        h: h - 100,
      })
      drawKernelHeat(ctx, hm(0), target, {
        title: 'target',
        rowLabels,
        colLabels: ['y-', 'y+'],
      })
      drawKernelHeat(ctx, hm(1), compiled, {
        title: 'compiled',
        rowLabels,
        colLabels: ['y-', 'y+'],
      })
      drawKernelHeat(ctx, hm(2), errMap, {
        title: 'error',
        rowLabels,
        colLabels: ['y-', 'y+'],
        ink: PALETTE.ferro,
      })
    },
  }
}

export function XorHidden() {
  const [mode, setMode] = useState<XorMode>('visible')
  const shared = useRef<XorShared>({ mode })
  shared.current.mode = mode

  return (
    <Sim height={300} create={() => createXorHidden(shared)}>
      {(['visible', 'hidden'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          style={mode === m ? { fontWeight: 700 } : undefined}
        >
          {m === 'visible' ? 'visible only' : '+ one hidden p-bit'}
        </button>
      ))}
    </Sim>
  )
}
