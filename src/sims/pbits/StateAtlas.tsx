import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import {
  condProbPlus,
  drawHalo,
  drawLayerRail,
  drawSpin,
  edgeColor,
  energy,
  frustratedLoop,
  stateIndex,
  u01,
  type LayerName,
} from './lib'

// PLAN rev.2 F7a–F7e — the STATE ATLAS. One figure family over the frustrated
// four-loop, five synchronized views of the same sixteen columns (same column
// = same state in every mode, read off the little spin-glyph under each):
//
//   energy       every state's E(s), the wires' satisfaction totaled (F7a)
//   weight       the raw weight e^{−βE}, β labeled inverse temperature (F7b)
//   normalize    Z as the visible stacked total; p = e^{−βE}/Z; live token (F7c)
//   observable   ⟨s₁s₂⟩ as a bar-weighted average, sampled live (F7d)
//   conditional  pin spins; the surviving columns re-normalize — the object a
//                Gibbs update draws from; slice ratio = σ(2β·field) (F7e)
//
// The atlas recomputes its own numbers from lib's `energy`; the check script
// holds them against `enumerate` and `condProbPlus` (oracle tier), so the two
// routes to every printed number are independent enough to disagree if either
// is wired wrong.

const N = 4
const STATES = 16
const TOKEN_SITE_HZ = 12 // normalize mode: one single-site update per tick, watchable
const OBS_SWEEPS_PER_SEC = 240 // observable mode: fast full sweeps for the live mean

export type AtlasMode = 'energy' | 'weight' | 'normalize' | 'observable' | 'conditional'

export interface AtlasShared {
  beta: number
  /** energy mode: which column's wires are being totaled */
  selected: number
  /** conditional mode: 0 = free, ±1 = pinned at that value */
  pins: Int8Array
}

/** Numbers the check script reads back out of a running stepper. */
export interface AtlasProbe {
  /** the mode's own drawn quantity, one value per column */
  heights: Float64Array
  Z: number
  tokenState: number
  samples: number
  /** observable mode: the live sampled ⟨s₁s₂⟩ */
  sampleMean: number
  /** conditional mode with exactly one free spin: the two routes to one number */
  sliceP: number
  ruleP: number
}

export function freshAtlasProbe(): AtlasProbe {
  return {
    heights: new Float64Array(STATES),
    Z: 0,
    tokenState: -1,
    samples: 0,
    sampleMean: 0,
    sliceP: NaN,
    ruleP: NaN,
  }
}

// ---------------------------------------------------------------------------
// The atlas's own arithmetic (checked against enumerate/condProbPlus).
// ---------------------------------------------------------------------------

export function spinsOf(idx: number): Int8Array {
  const s = new Int8Array(N)
  for (let k = 0; k < N; k++) s[k] = (idx >> k) & 1 ? 1 : -1
  return s
}

const E_MODEL = frustratedLoop(1) // energies are β-independent; β only enters the weight

export function atlasEnergies(): Float64Array {
  const E = new Float64Array(STATES)
  for (let idx = 0; idx < STATES; idx++) E[idx] = energy(E_MODEL, spinsOf(idx))
  return E
}

export interface AtlasExact {
  E: Float64Array
  w: Float64Array
  Z: number
  p: Float64Array
}

export function atlasExact(beta: number): AtlasExact {
  const E = atlasEnergies()
  const w = new Float64Array(STATES)
  let Z = 0
  for (let i = 0; i < STATES; i++) {
    w[i] = Math.exp(-beta * E[i])
    Z += w[i]
  }
  const p = new Float64Array(STATES)
  for (let i = 0; i < STATES; i++) p[i] = w[i] / Z
  return { E, w, Z, p }
}

/** Does state `idx` agree with every nonzero pin? */
export function pinsAllow(idx: number, pins: ArrayLike<number>): boolean {
  for (let k = 0; k < N; k++) {
    const pin = pins[k]
    if (pin !== 0 && ((idx >> k) & 1 ? 1 : -1) !== pin) return false
  }
  return true
}

/** The conditional slice: pinned-out columns go to zero, the rest re-normalize. */
export function atlasSlice(
  beta: number,
  pins: ArrayLike<number>,
): { p: Float64Array; mass: number } {
  const { p } = atlasExact(beta)
  const out = new Float64Array(STATES)
  let mass = 0
  for (let i = 0; i < STATES; i++) if (pinsAllow(i, pins)) mass += p[i]
  for (let i = 0; i < STATES; i++) if (pinsAllow(i, pins)) out[i] = p[i] / mass
  return { p: out, mass }
}

/** Sign of s₁·s₂ (the wired pair, sites 0 and 1) in state `idx`. */
export function pairSign(idx: number): number {
  return ((idx & 1 ? 1 : -1) * (idx & 2 ? 1 : -1)) as number
}

export function exactPairCorr(beta: number): number {
  const { p } = atlasExact(beta)
  let c = 0
  for (let i = 0; i < STATES; i++) c += p[i] * pairSign(i)
  return c
}

// ---------------------------------------------------------------------------
// Shared geometry — exported so pointer hit-tests and draw agree exactly.
// ---------------------------------------------------------------------------

export function atlasPane(mode: AtlasMode, w: number, h: number): Rect {
  const left = mode === 'energy' || mode === 'conditional' ? w * 0.35 : 26
  const right = mode === 'normalize' ? 88 : mode === 'observable' ? 96 : 26
  return { x: left, y: 30, w: w - left - right, h: h - 104 }
}

export function loopCellPos(w: number, h: number): Array<[number, number]> {
  const cx = w * 0.16
  const cy = 30 + (h - 104) / 2
  const r = 40
  return [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
  ]
}

const RAIL: Record<AtlasMode, LayerName> = {
  energy: 'energy',
  weight: 'target',
  normalize: 'target',
  observable: 'target',
  conditional: 'sampler',
}

// ---------------------------------------------------------------------------
// Drawing scaffold shared by the modes.
// ---------------------------------------------------------------------------

function colX(pane: Rect, i: number): number {
  return pane.x + (i * pane.w) / STATES
}

/** The state-glyph row: under column i, its four spins as four tiny dots. */
function drawGlyphRow(
  ctx: CanvasRenderingContext2D,
  pane: Rect,
  pins?: ArrayLike<number>,
): void {
  const bw = pane.w / STATES
  const gy = pane.y + pane.h + 10
  for (let i = 0; i < STATES; i++) {
    const x = colX(pane, i) + bw / 2
    for (let k = 0; k < N; k++) {
      const up = (i >> k) & 1
      const y = gy + k * 7
      ctx.beginPath()
      ctx.arc(x, y, 2.4, 0, Math.PI * 2)
      ctx.fillStyle = up ? PALETTE.sUp : PALETTE.sDn
      ctx.fill()
      if (pins && pins[k] !== 0) {
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.held
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }
}

/** Ghost-filled columns for a nonnegative per-state quantity. */
function drawColumns(
  ctx: CanvasRenderingContext2D,
  pane: Rect,
  v: ArrayLike<number>,
  alpha: (i: number) => number,
): void {
  const bw = pane.w / STATES
  let peak = 0
  for (let i = 0; i < STATES; i++) peak = Math.max(peak, v[i])
  if (peak === 0) peak = 1
  for (let i = 0; i < STATES; i++) {
    const bh = Math.max((v[i] / peak) * (pane.h - 8), v[i] > 0 ? 2 : 0)
    ctx.fillStyle = PALETTE.ghost
    ctx.globalAlpha = alpha(i)
    ctx.fillRect(colX(pane, i) + bw * 0.16, pane.y + pane.h - bh, bw * 0.68, bh)
    ctx.globalAlpha = 1
  }
}

function betaLabel(ctx: CanvasRenderingContext2D, x: number, beta: number, w: number): void {
  ctx.font = FONT_METER
  ctx.fillStyle = '#1a1f2b'
  ctx.fillText(`β = ${fmt(beta, 2)}`, x, 20)
  // narrow canvases skip the subtitle — it overprinted the rail tabs at 360px
  // (figure audit, 2026-08-11)
  if (w < 520) return
  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('inverse temperature — "coldness"', x + 64, 20)
}

// ---------------------------------------------------------------------------
// The stepper. One thin dispatch on mode; each draw handler is one clean path.
// ---------------------------------------------------------------------------

export function createStateAtlas(
  shared: { current: AtlasShared },
  mode: AtlasMode,
  probe?: AtlasProbe,
  seed = 41,
): Stepper {
  // sampler state (normalize's token; observable's live mean)
  let m = frustratedLoop(shared.current.beta)
  let lastBeta = shared.current.beta
  const s = Int8Array.from([1, 1, -1, 1])
  let site = 0
  let tick = 0
  let acc = 0
  let counts = new Float64Array(STATES)

  const onBetaMove = () => {
    if (shared.current.beta === lastBeta) return
    lastBeta = shared.current.beta
    m = frustratedLoop(lastBeta)
    counts = new Float64Array(STATES) // the target moved — fresh measurement
  }

  const oneSiteUpdate = () => {
    tick++
    const i = site
    site = (site + 1) % N
    s[i] = u01(seed, tick, i, 0) < condProbPlus(m, s, i) ? 1 : -1
  }

  const step: Record<AtlasMode, (dt: number) => void> = {
    energy: () => {},
    weight: () => onBetaMove(),
    normalize: (dt) => {
      onBetaMove()
      acc += dt * TOKEN_SITE_HZ
      while (acc >= 1) {
        acc -= 1
        oneSiteUpdate()
      }
    },
    observable: (dt) => {
      onBetaMove()
      acc += dt * OBS_SWEEPS_PER_SEC * N
      while (acc >= 1) {
        acc -= 1
        oneSiteUpdate()
        if (site === 0) counts[stateIndex(s)]++ // one record per full round
      }
    },
    conditional: () => {},
  }

  const drawLoop = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    state: Int8Array,
    pins: ArrayLike<number> | null,
    contributions: boolean,
  ) => {
    const pos = loopCellPos(w, h)
    for (let e = 0; e < E_MODEL.edges.length; e++) {
      const { i, j, J } = E_MODEL.edges[e]
      const free = pins !== null && (pins[i] === 0 || pins[j] === 0)
      const c = -J * state[i] * state[j] // this wire's term of E
      const [x0, y0] = pos[i]
      const [x1, y1] = pos[j]
      ctx.strokeStyle = edgeColor(J)
      ctx.lineWidth = 3
      ctx.globalAlpha = free ? 0.25 : 0.75
      if (!free && c > 0) ctx.setLineDash([5, 4]) // an unhappy wire, dashed
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      if (contributions && !free) {
        // label sits just outside the ring: push the edge midpoint away from center
        const ccx = w * 0.16
        const ccy = 30 + (h - 104) / 2
        const mx = (x0 + x1) / 2
        const my = (y0 + y1) / 2
        const len = Math.hypot(mx - ccx, my - ccy) || 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = edgeColor(J)
        ctx.textAlign = 'center'
        ctx.fillText(
          `${c > 0 ? '+' : '−'}${Math.abs(c)}`,
          mx + ((mx - ccx) / len) * 16,
          my + ((my - ccy) / len) * 16 + 4,
        )
        ctx.textAlign = 'left'
      }
    }
    for (let k = 0; k < N; k++) {
      const [x, y] = pos[k]
      if (pins !== null && pins[k] === 0) {
        // a free spin has no single face — dashed hollow cell
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(120,140,170,0.8)'
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        drawSpin(ctx, x, y, 15, state[k])
        if (pins !== null) drawHalo(ctx, x, y, 15)
      }
    }
  }

  const draw: Record<AtlasMode, (ctx: CanvasRenderingContext2D, w: number, h: number) => void> = {
    // F7a — the energy ladder: markers on rungs, the selected column's wires
    // totaled term by term on the loop at left.
    energy: (ctx, w, h) => {
      const pane = atlasPane('energy', w, h)
      paneFrame(ctx, pane)
      const E = atlasEnergies()
      let eMin = Infinity
      let eMax = -Infinity
      for (let i = 0; i < STATES; i++) {
        eMin = Math.min(eMin, E[i])
        eMax = Math.max(eMax, E[i])
      }
      const yOf = (e: number) =>
        pane.y + 10 + ((eMax - e) / (eMax - eMin)) * (pane.h - 20)
      const levels = Array.from(new Set(Array.from(E))).sort((a, b) => a - b)
      for (const lvl of levels) {
        const y = yOf(lvl)
        ctx.strokeStyle = 'rgba(120,140,170,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(pane.x + 4, y)
        ctx.lineTo(pane.x + pane.w - 4, y)
        ctx.stroke()
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'right'
        ctx.fillText(`E = ${lvl > 0 ? '+' : ''}${lvl}`, pane.x - 6, y + 4)
        ctx.textAlign = 'left'
      }
      const sel = shared.current.selected
      const bw = pane.w / STATES
      for (let i = 0; i < STATES; i++) {
        const x = colX(pane, i) + bw / 2
        const y = yOf(E[i])
        const on = i === sel
        ctx.fillStyle = on ? PALETTE.sUp : 'rgba(26,31,43,0.75)'
        const r = on ? 5.5 : 3.6
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        if (on) {
          ctx.strokeStyle = 'rgba(217,119,6,0.45)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, y + r + 2)
          ctx.lineTo(x, pane.y + pane.h + 4)
          ctx.stroke()
        }
      }
      drawGlyphRow(ctx, pane)
      // the selected state's loop, wires totaled
      const st = spinsOf(sel)
      drawLoop(ctx, w, h, st, null, true)
      const terms = E_MODEL.edges
        .map(({ i, j, J }) => {
          const c = -J * st[i] * st[j]
          return `${c > 0 ? '+' : '−'}${Math.abs(c)}`
        })
        .join(' ')
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`E = ${terms} = ${E[sel] > 0 ? '+' : ''}${E[sel]}`, 14, h - 12)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // narrow: right-aligned — beside the energy tally it mashed at 360px
      // (figure audit, 2026-08-11)
      if (w < 520) {
        ctx.textAlign = 'right'
        ctx.fillText('tap a column', pane.x + pane.w, h - 12)
        ctx.textAlign = 'left'
      } else {
        ctx.fillText('tap a column', pane.x + 4, h - 12)
      }
      if (probe) {
        probe.heights.set(E)
      }
    },

    // F7b — the raw weight e^{−βE}, before any normalization.
    weight: (ctx, w, h) => {
      const pane = atlasPane('weight', w, h)
      paneFrame(ctx, pane)
      const { w: wt, Z } = atlasExact(shared.current.beta)
      drawColumns(ctx, pane, wt, () => 0.5)
      drawGlyphRow(ctx, pane)
      betaLabel(ctx, pane.x, shared.current.beta, w)
      let lo = Infinity
      let hi = 0
      for (let i = 0; i < STATES; i++) {
        lo = Math.min(lo, wt[i])
        hi = Math.max(hi, wt[i])
      }
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`column height: e^−βE`, pane.x, h - 12)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'right'
      ctx.fillText(`tallest ÷ shortest: ${fmt(hi / lo, hi / lo > 20 ? 0 : 2)}×`, pane.x + pane.w, h - 12)
      ctx.textAlign = 'left'
      if (probe) {
        probe.heights.set(wt)
        probe.Z = Z
      }
    },

    // F7c — divide by the visible stacked total: p = e^{−βE}/Z, token live.
    normalize: (ctx, w, h) => {
      const pane = atlasPane('normalize', w, h)
      paneFrame(ctx, pane)
      const { w: wt, Z, p } = atlasExact(shared.current.beta)
      const cur = stateIndex(s)
      drawColumns(ctx, pane, p, (i) => (i === cur ? 0.75 : 0.45))
      drawGlyphRow(ctx, pane)
      // the token — where the sampler stands right now
      {
        const bw = pane.w / STATES
        let peak = 0
        for (let i = 0; i < STATES; i++) peak = Math.max(peak, p[i])
        const bh = (p[cur] / peak) * (pane.h - 8)
        ctx.beginPath()
        ctx.arc(colX(pane, cur) + bw / 2, pane.y + pane.h - bh - 9, 5.5, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.sUp
        ctx.fill()
      }
      // Z, as the stacked total the columns were divided by
      const sx = pane.x + pane.w + 22
      const stackH = pane.h * 0.92
      const sy0 = pane.y + pane.h
      let yAcc = 0
      for (let i = 0; i < STATES; i++) {
        const seg = (wt[i] / Z) * stackH
        ctx.fillStyle = PALETTE.ghost
        ctx.globalAlpha = i % 2 ? 0.55 : 0.35
        ctx.fillRect(sx, sy0 - yAcc - seg, 26, Math.max(seg - 0.5, 0.5))
        ctx.globalAlpha = 1
        yAcc += seg
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'center'
      ctx.fillText('Z', sx + 13, pane.y - 4)
      ctx.fillText('÷', sx - 12, pane.y + pane.h / 2)
      ctx.textAlign = 'left'
      betaLabel(ctx, pane.x, shared.current.beta, w)
      let sum = 0
      for (let i = 0; i < STATES; i++) sum += p[i]
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`Z = Σ e^−βE = ${fmt(Z, 2)}`, pane.x, h - 12)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'right'
      ctx.fillText(`columns sum to ${fmt(sum, 2)}`, pane.x + pane.w, h - 12)
      ctx.textAlign = 'left'
      if (probe) {
        probe.heights.set(p)
        probe.Z = Z
        probe.tokenState = cur
      }
    },

    // F7d — an observable as a bar-weighted average, sampled live against exact.
    observable: (ctx, w, h) => {
      const pane = atlasPane('observable', w, h)
      paneFrame(ctx, pane)
      const { p } = atlasExact(shared.current.beta)
      const mid = pane.y + pane.h / 2
      const bw = pane.w / STATES
      let peak = 0
      for (let i = 0; i < STATES; i++) peak = Math.max(peak, p[i])
      let total = 0
      for (let i = 0; i < STATES; i++) total += counts[i]
      // faint axis
      ctx.strokeStyle = 'rgba(120,140,170,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pane.x, mid)
      ctx.lineTo(pane.x + pane.w, mid)
      ctx.stroke()
      let sampled = 0
      for (let i = 0; i < STATES; i++) {
        const sign = pairSign(i)
        const dir = sign > 0 ? -1 : 1 // up above axis, down below
        const gh = (p[i] / peak) * (pane.h / 2 - 10)
        const x = colX(pane, i)
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.4
        ctx.strokeRect(x + bw * 0.14, dir < 0 ? mid - gh : mid, bw * 0.72, gh)
        const q = total ? counts[i] / total : 0
        const sh = (q / peak) * (pane.h / 2 - 10)
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.55
        ctx.fillRect(x + bw * 0.26, dir < 0 ? mid - sh : mid, bw * 0.48, sh)
        ctx.globalAlpha = 1
        sampled += q * sign
      }
      drawGlyphRow(ctx, pane)
      const exact = exactPairCorr(shared.current.beta)
      // the gauge: both estimates of ⟨s₁s₂⟩ on one [−1, 1] rail
      const gx = pane.x + pane.w + 40
      const gTop = pane.y + 8
      const gH = pane.h - 16
      const gy = (v: number) => gTop + ((1 - v) / 2) * gH
      ctx.strokeStyle = 'rgba(120,140,170,0.5)'
      ctx.beginPath()
      ctx.moveTo(gx, gTop)
      ctx.lineTo(gx, gTop + gH)
      ctx.stroke()
      ctx.strokeStyle = PALETTE.ghost
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(gx - 9, gy(exact))
      ctx.lineTo(gx + 9, gy(exact))
      ctx.stroke()
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gx - 13, gy(sampled))
      ctx.lineTo(gx + 13, gy(sampled))
      ctx.stroke()
      ctx.font = FONT_LABEL
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('⟨s₁s₂⟩', gx, gTop - 8)
      ctx.textAlign = 'left'
      betaLabel(ctx, pane.x, shared.current.beta, w)
      // Narrow canvases: two readouts, ends of the line — the three-label
      // row overprinted itself at 360px (figure audit, 2026-08-11).
      const narrowObs = w < 520
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`exact ⟨s₁s₂⟩ = ${fmt(exact, 3)}`, pane.x, h - 12)
      ctx.fillStyle = PALETTE.meter
      if (narrowObs) {
        ctx.textAlign = 'right'
        ctx.fillText(`sampled: ${fmt(sampled, 3)}`, pane.x + pane.w, h - 12)
        ctx.textAlign = 'left'
      } else {
        ctx.fillText(`sampled: ${fmt(sampled, 3)}`, pane.x + 170, h - 12)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(total).toLocaleString()} samples`, pane.x + pane.w, h - 12)
        ctx.textAlign = 'left'
      }
      if (probe) {
        for (let i = 0; i < STATES; i++) probe.heights[i] = p[i] * pairSign(i)
        probe.sampleMean = sampled
        probe.samples = total
      }
    },

    // F7e — the conditional slice: pinned-out columns collapse, the rest
    // re-normalize; with one spin left free the slice ratio IS σ(2β·field).
    conditional: (ctx, w, h) => {
      const pane = atlasPane('conditional', w, h)
      paneFrame(ctx, pane)
      const pins = shared.current.pins
      const { p, mass } = atlasSlice(shared.current.beta, pins)
      drawColumns(ctx, pane, p, (i) => (pinsAllow(i, pins) ? 0.5 : 0))
      // pinned-out columns keep a faint stub so absence is visible, not blank
      {
        const bw = pane.w / STATES
        for (let i = 0; i < STATES; i++) {
          if (pinsAllow(i, pins)) continue
          ctx.fillStyle = PALETTE.ghost
          ctx.globalAlpha = 0.2
          ctx.fillRect(colX(pane, i) + bw * 0.16, pane.y + pane.h - 2, bw * 0.68, 2)
          ctx.globalAlpha = 1
        }
      }
      drawGlyphRow(ctx, pane, pins)
      const state = new Int8Array(N)
      for (let k = 0; k < N; k++) state[k] = pins[k]
      drawLoop(ctx, w, h, state, pins, false)
      let nPinned = 0
      for (let k = 0; k < N; k++) if (pins[k] !== 0) nPinned++
      let sum = 0
      for (let i = 0; i < STATES; i++) sum += p[i]
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      // narrow: β sits at the far left — at pane.x it overprinted the rail's
      // TARGET tab at 360px (figure audit, 2026-08-11)
      ctx.fillText(`β = 1`, w < 520 ? 20 : pane.x, 20)
      if (w >= 520) {
        // subtitle overprinted the rail tabs at 360px (figure audit, 2026-08-11)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('inverse temperature, fixed', pane.x + 44, 20)
      }
      // Narrow canvases compress both bottom lines — they overprinted each
      // other at 360px (figure audit, 2026-08-11).
      const narrowCond = w < 520
      ctx.fillText(
        narrowCond
          ? `${STATES >> nPinned} live · sum ${fmt(sum, 2)} · was ${fmt(mass, 2)}`
          : `${STATES >> nPinned} live columns · sum = ${fmt(sum, 2)} · slice mass was ${fmt(mass, 2)}`,
        pane.x,
        h - 12,
      )
      ctx.fillText(narrowCond ? 'tap cells to pin' : 'tap a cell: free → held up → held down', 14, h - 12)
      let sliceP = NaN
      let ruleP = NaN
      if (nPinned === N - 1) {
        let free = 0
        for (let k = 0; k < N; k++) if (pins[k] === 0) free = k
        sliceP = 0
        for (let i = 0; i < STATES; i++) if ((i >> free) & 1) sliceP += p[i]
        // the other route: the §3 update rule, straight from the conditional
        const sc = Int8Array.from(pins)
        sc[free] = 1 // its own value never enters its own field
        ruleP = condProbPlus(frustratedLoop(shared.current.beta), sc, free)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        if (narrowCond) {
          // stacked under the loop, in the left column's free space — side by
          // side the rule readout fell off the 360px canvas
          ctx.font = FONT_LABEL
          ctx.fillText(`slice: P(s${free + 1}=+1) = ${fmt(sliceP, 3)}`, 8, h - 44)
          ctx.fillText(`rule: σ(2β·field) = ${fmt(ruleP, 3)}`, 8, h - 28)
        } else {
          ctx.fillText(`slice: P(s${free + 1}=+1) = ${fmt(sliceP, 3)}`, pane.x, h - 30)
          ctx.fillText(`rule: σ(2β·field) = ${fmt(ruleP, 3)}`, pane.x + 200, h - 30)
        }
      }
      if (probe) {
        probe.heights.set(p)
        probe.sliceP = sliceP
        probe.ruleP = ruleP
      }
    },
  }

  return {
    step(dt) {
      step[mode](dt)
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, RAIL[mode])
      draw[mode](ctx, w, h)
    },
  }
}

// ---------------------------------------------------------------------------
// The component. One shared ref per instance; energy and conditional modes are
// tap-driven and static, weight/normalize/observable carry the β knob.
// ---------------------------------------------------------------------------

export function StateAtlas({ mode }: { mode: AtlasMode }) {
  const [beta, setBeta] = useState(0.8)
  const shared = useRef<AtlasShared>({
    beta: mode === 'conditional' ? 1 : beta,
    selected: 15, // all-up: three wires happy, the disagree-wire caught unhappy
    pins: Int8Array.from([0, 0, 0, 1]),
  })
  shared.current.beta = mode === 'conditional' ? 1 : beta
  const hasKnob = mode === 'weight' || mode === 'normalize' || mode === 'observable'
  const animated = mode === 'normalize' || mode === 'observable'
  const interactive = mode === 'energy' || mode === 'conditional'

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (mode === 'energy') {
      const pane = atlasPane('energy', rect.width, rect.height)
      if (x >= pane.x && x <= pane.x + pane.w && y >= pane.y - 6 && y <= pane.y + pane.h + 40) {
        shared.current.selected = Math.min(
          STATES - 1,
          Math.max(0, Math.floor(((x - pane.x) / pane.w) * STATES)),
        )
      }
      return
    }
    if (mode === 'conditional') {
      const pos = loopCellPos(rect.width, rect.height)
      for (let k = 0; k < N; k++) {
        if (Math.hypot(x - pos[k][0], y - pos[k][1]) < 26) {
          const cur = shared.current.pins[k]
          shared.current.pins[k] = cur === 0 ? 1 : cur === 1 ? -1 : 0
          return
        }
      }
    }
  }

  const sim = (
    <Sim height={310} animated={animated} create={() => createStateAtlas(shared, mode)}>
      {hasKnob && (
        <label className="sim-slider">
          <span>hot</span>
          <input
            type="range"
            min={0.05}
            max={2.5}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(Number(e.target.value))}
          />
          <span>cold</span>
        </label>
      )}
    </Sim>
  )

  return interactive ? (
    <div className="sim-stir" onPointerDown={onPointer}>
      {sim}
    </div>
  ) : (
    sim
  )
}
