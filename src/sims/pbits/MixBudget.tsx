import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { forwardChain, N_LEVELS, reverseStep, type DenoiseModel } from './denoise'
import { GLYPH_LIST, GLYPH_SIDE, drawGlyph, nearestGlyphDistance } from './glyphs'
import { PRETRAINED } from './pretrained'
import { measureLevelTau } from './part3lib'
import { u01 } from './lib'

// Part 3, PLAN F8/F9 — the mixing budget as a schedule decision. The trained
// reverse chain has three kernels, and they are not equally stiff: each
// level's (y, w) chain has its own measured autocorrelation time τ_t, and
// MET's verified exemption says WHY they differ — the clamped-side couplings
// U (the evidence pouring in) ride free of the mixing tax, while the
// free-side couplings W (the machinery that makes sixteen pixels conspire)
// are what τ taxes. The per-level panel shows all three quantities measured
// on the shipped Part 1 kernels: mean |U|, mean |W|, and τ_t from an actual
// 20,000-sweep chain. (The falsifiable form — scale U ×2 and τ barely moves,
// scale W ×2 and it jumps — runs in the check harness, where it belongs.)
//
// The knob is the last free parameter a schedule has, priced at zero: a
// FIXED total sweep budget S split across the levels, morphing from uniform
// (λ = 0) to τ-proportional (λ = 1). Two walls dream side by side at the
// same identical bill — same seeds, same clamps, same readouts, same total
// sweeps — and the quality witnesses under each (stray rate and mean
// distance to the nearest glyph) report where coherence was actually
// bought. Cheapness and honesty travel together: the equal-bill line is
// printed on the canvas, and whichever way the witnesses fall is the fact
// the article states.

export const MB_BUDGET = 9 // total sweeps per dream — tight enough that allocation matters
export const MB_STRAY_AT = 3 // nearest-glyph distance ≥ 3 counts as a stray
const KEEP = 7
const DREAM_PERIOD = 0.4
const TAU_SEED = 23

/** Split budget S by blend λ between uniform and τ-proportional weights —
 *  largest-remainder rounding, every level keeps at least one sweep. */
export function allocBudget(taus: number[], lambda: number, S = MB_BUDGET): number[] {
  const T = taus.length
  let sum = 0
  for (const t of taus) sum += t
  const ideal = taus.map((t) => S * ((1 - lambda) / T + (lambda * t) / sum))
  const out = ideal.map((v) => Math.max(1, Math.floor(v)))
  let used = out.reduce((a, b) => a + b, 0)
  const frac = ideal.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r)
  for (let k = 0; used < S; k = (k + 1) % T) {
    out[frac[k].i]++
    used++
  }
  while (used > S) {
    // (only reachable if the min-1 floor over-allocated at tiny S)
    let big = 0
    for (let i = 1; i < T; i++) if (out[i] > out[big]) big = i
    if (out[big] <= 1) break
    out[big]--
    used--
  }
  return out
}

/** Part 1's dream with a per-level sweep allocation instead of one number. */
export function dreamAlloc(
  models: DenoiseModel[],
  seed: number,
  run: number,
  alloc: number[],
): Int8Array {
  let x: Int8Array = new Int8Array(models[0].nv)
  for (let i = 0; i < x.length; i++) x[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
  for (let t = N_LEVELS; t >= 1; t--) {
    x = reverseStep(models[t - 1], x, alloc[t - 1], seed, run * 16 + t)
  }
  return x
}

/** Mean |coupling| — the stiffness bars' quantity. */
export function meanAbs(a: Float32Array): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i])
  return s / a.length
}

/** The τ probe evidence: a mid-corruption forward frame at each level, the
 *  same kind of x_t generation clamps. Deterministic. */
export function tauProbeInput(t: number): Int8Array {
  return forwardChain(GLYPH_LIST[1], 2024, 5)[t]
}

export interface MixBudgetShared {
  /** blend index 0..10 → λ = idx / 10 */
  blendIdx: number
}

export interface MixBudgetProbe {
  taus: number[]
  alloc: number[]
  strayUniform: number
  strayBlend: number
  meanDistUniform: number
  meanDistBlend: number
  dreams: number
}

export function mixBudgetRegions(w: number, h: number): { levels: Rect; strips: Rect } {
  const y = 46
  const paneH = h - y - 60
  return {
    levels: { x: 16, y, w: w * 0.42, h: paneH },
    strips: { x: w * 0.47, y, w: w * 0.53 - 16, h: paneH },
  }
}

interface Wall {
  label: string
  kept: Int8Array[]
  strays: number
  distSum: number
  n: number
}

export function createMixBudget(
  shared: { current: MixBudgetShared },
  probe?: MixBudgetProbe,
  seed = 47,
): Stepper {
  const taus: number[] = []
  let acc = 0
  let runCounter = 0
  let lastLambda = -1
  const walls: Wall[] = [
    { label: 'uniform split', kept: [], strays: 0, distSum: 0, n: 0 },
    { label: 'τ-weighted split', kept: [], strays: 0, distSum: 0, n: 0 },
  ]

  const resetWall = (wl: Wall) => {
    wl.kept.length = 0
    wl.strays = 0
    wl.distSum = 0
    wl.n = 0
  }

  return {
    step(dt) {
      // measure τ one level per frame so the page never stalls
      if (taus.length < N_LEVELS) {
        const t = taus.length + 1
        taus.push(measureLevelTau(PRETRAINED[t - 1], tauProbeInput(t), TAU_SEED).tau)
        return
      }
      const lambda = shared.current.blendIdx / 10
      if (lambda !== lastLambda) {
        lastLambda = lambda
        runCounter = 0
        for (const wl of walls) resetWall(wl) // witnesses restart: they must describe THIS allocation
      }
      const allocU = allocBudget(taus, 0)
      const allocB = allocBudget(taus, lambda)
      acc += dt
      while (acc >= DREAM_PERIOD) {
        acc -= DREAM_PERIOD
        runCounter++
        const allocs = [allocU, allocB]
        walls.forEach((wl, k) => {
          const d = dreamAlloc(PRETRAINED, seed, runCounter, allocs[k])
          wl.kept.unshift(d)
          if (wl.kept.length > KEEP) wl.kept.pop()
          const dist = nearestGlyphDistance(d)
          wl.distSum += dist
          if (dist >= MB_STRAY_AT) wl.strays++
          wl.n++
        })
      }
      if (probe) {
        probe.taus = taus.slice()
        probe.alloc = allocB
        probe.strayUniform = walls[0].n > 0 ? walls[0].strays / walls[0].n : NaN
        probe.strayBlend = walls[1].n > 0 ? walls[1].strays / walls[1].n : NaN
        probe.meanDistUniform = walls[0].n > 0 ? walls[0].distSum / walls[0].n : NaN
        probe.meanDistBlend = walls[1].n > 0 ? walls[1].distSum / walls[1].n : NaN
        probe.dreams = walls[0].n
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const lambda = shared.current.blendIdx / 10
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(
        `sweep budget S = ${MB_BUDGET} per dream · allocation blend λ = ${fmt(lambda, 1)}`,
        16,
        28,
      )
      const { levels, strips } = mixBudgetRegions(w, h)

      if (taus.length < N_LEVELS) {
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(
          `measuring τ on level ${taus.length + 1}'s own chain (20,000 sweeps)…`,
          levels.x,
          levels.y + 24,
        )
        return
      }
      const allocU = allocBudget(taus, 0)
      const allocB = allocBudget(taus, lambda)

      // -- left: per-level stiffness and the allocation ---------------------
      paneFrame(ctx, levels)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('per level: |U| clamped · |W| free · τ measured · sweeps granted', levels.x, levels.y - 4)
      const rowH = levels.h / N_LEVELS
      const tauPeak = Math.max(...taus)
      const uPeak = Math.max(...PRETRAINED.map((m) => meanAbs(m.U)))
      const wPeak = Math.max(...PRETRAINED.map((m) => meanAbs(m.W)))
      for (let t = 1; t <= N_LEVELS; t++) {
        const m = PRETRAINED[t - 1]
        const y = levels.y + (t - 1) * rowH
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(`t=${t}`, levels.x + 4, y + rowH * 0.34)
        const bx = levels.x + 34
        const bw = levels.w - 118
        const bar = (frac: number, ink: string, row: number, label: string) => {
          const yy = y + 6 + row * (rowH - 14) * 0.25
          const bh = (rowH - 16) * 0.18
          ctx.fillStyle = ink
          ctx.fillRect(bx, yy, Math.max(2, frac * bw), bh)
          ctx.fillStyle = 'rgba(85,96,111,0.85)'
          ctx.fillText(label, bx + Math.max(2, frac * bw) + 4, yy + bh)
        }
        bar(meanAbs(m.U) / uPeak, PALETTE.held, 0, `|U| ${fmt(meanAbs(m.U), 2)}`)
        bar(meanAbs(m.W) / wPeak, PALETTE.hid, 1, `|W| ${fmt(meanAbs(m.W), 2)}`)
        bar(taus[t - 1] / tauPeak, PALETTE.ferro, 2, `τ ${fmt(taus[t - 1], 1)}`)
        bar(allocB[t - 1] / MB_BUDGET, PALETTE.meter, 3, `${allocB[t - 1]} sweeps`)
      }

      // -- right: two walls at the same bill --------------------------------
      const sc = Math.min(9, Math.floor((strips.w - 20) / (KEEP * (GLYPH_SIDE + 1.2))))
      walls.forEach((wl, k) => {
        const alloc = k === 0 ? allocU : allocB
        const ry = strips.y + 8 + k * (strips.h / 2)
        ctx.font = FONT_LABEL
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(`${wl.label} [${alloc.join(', ')}]`, strips.x, ry)
        wl.kept.forEach((d, i) => {
          const px = strips.x + i * (GLYPH_SIDE * sc + 6)
          if (px + GLYPH_SIDE * sc <= strips.x + strips.w) drawGlyph(ctx, px, ry + 6, sc, d)
        })
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.meter
        if (wl.n > 0) {
          ctx.fillText(
            `stray rate ${fmt(wl.strays / wl.n, 2)} · mean distance ${fmt(wl.distSum / wl.n, 2)} · ${wl.n} dreams`,
            strips.x,
            ry + 6 + GLYPH_SIDE * sc + 14,
          )
        }
      })

      // -- the equal-bill line — cheapness and honesty travel together ------
      ctx.font = FONT_LABEL
      ctx.fillStyle = PALETTE.bill
      ctx.fillText(
        `both walls, identical bill per dream: ${MB_BUDGET} sweeps + ${N_LEVELS} clamps + ${N_LEVELS} readouts — only the split differs`,
        16,
        h - 28,
      )
      ctx.fillStyle = 'rgba(85,96,111,0.75)'
      ctx.fillText(
        'τ measured on each kernel’s own (y,w) chain at clamped evidence · same seeds both walls',
        16,
        h - 10,
      )
    },
  }
}

export function MixBudget() {
  const [blendIdx, setBlendIdx] = useState(0)
  const shared = useRef<MixBudgetShared>({ blendIdx })
  shared.current.blendIdx = blendIdx

  return (
    <Sim height={380} create={() => createMixBudget(shared)}>
      <label className="sim-slider">
        <span>uniform</span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={blendIdx}
          onChange={(e) => setBlendIdx(Number(e.target.value))}
        />
        <span>τ-weighted</span>
      </label>
    </Sim>
  )
}
