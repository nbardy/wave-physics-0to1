import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { canvasFrac } from './lib/clocks'

// §7 "Around a Loop" + §8 "Curvature" — the plane of clocks (figs 34–42, minus
// the globe). A upgrades from a scalar on the line to a pair (A_x, A_y): one
// rotation-per-step for each direction of travel, drawn as one blue arrow per
// clock. The prescribed connection is the vector potential of a localized flux
// core of total flux Φ:
//   inside r < r_c :  F(r) = F₀ (1 − u)²,  u = (r/r_c)²,  F₀ = 3Φ/(π r_c²)
//   everywhere     :  A_φ(r) = Φ_enc(r) / (2πr),  Φ_enc(r) = Φ (1 − (1 − u)³)
// so F is nonzero ONLY inside the marked core while A circulates everywhere —
// which is the whole point of §7 (and the seed §9's Aharonov–Bohm replay
// redeems). Φ = 2.2 rad ≈ 126°: an encircling needle returns visibly rotated.
//
// Numerics honesty: there is NO time-stepped PDE in this figure. The field is
// closed-form; carrying a needle along a path is the line integral of a smooth
// prescribed A, tabulated ONCE at create() by the midpoint rule over TABLE_M
// segments (quadrature error O(1/M²) — an accuracy condition, not a stability
// condition; nothing is fed back, so nothing can blow up). step() only advances
// a playback parameter — the time-speed slider cannot touch the physics
// (RopeCircle precedent). The ∮A and ∬F meters are two INDEPENDENT live
// quadratures (midpoint rule on the loop; polar midpoint rule on the disc):
// when the Stokes readout shows them equal, the equality is computed each
// frame, not asserted.

const PHI = 2.2 // total flux through the core, rad (≈ 126°)
const TABLE_M = 1024 // transport-table segments (midpoint rule, error O(1/M²))
const LOOP_SEGS = 256 // ∮A·dl segments per frame
const FLUX_NR = 40 // ∬F dA: radial rings …
const FLUX_NA = 64 // … × angular samples per ring
const RUN_SECONDS = 6 // playback length of one carry at speed 1 (display only)
const GHOST_DS = 1 / 26 // drop a ghost needle every this much of the path
// Visual gain, confessed: A is in rad/px (max ≈ 7×10⁻³ here); each grid arrow
// is drawn A·ARROW_GAIN pixels long so the pair (A_x, A_y) is legible.
const ARROW_GAIN = 2600
const NEEDLE_LEN = 24 // carried-needle glyph length, px (a glyph, not a measurement)
const GRID = 44 // clock/arrow grid spacing, px
const INK = '#55606f'
const FONT = '13px system-ui, sans-serif'

export type HolonomyMode =
  | 'two-paths' // §7: two paths P→Q, arrivals disagree
  | 'two-loops' // §7 Prediction #2 marquee: encircling vs non-encircling loop
  | 'explore' // §7: fixed-size loop, draggable, live ∮A meter
  | 'gauge-check' // §7/§8 boundary check: pure-gauge A = ∂α, zero on every loop
  | 'shrink' // §8: radius slider, rotation-per-area → F
  | 'field' // §8: F heat map + live Stokes equality ∮A = ∬F

interface Vec {
  x: number
  y: number
}

type Path = (s: number) => Vec

/** The connection as data: sample A, sample F, plus its own scenery. */
interface AField {
  a(x: number, y: number, out: Vec): void
  f(x: number, y: number): number
  shade: HTMLCanvasElement // prerendered scalar picture (F in violet, α in green)
  drawMarks(ctx: CanvasRenderingContext2D): void // e.g. the dashed core edge
}

// ---------------------------------------------------------------- fields ----

/** Rasterize a [0,1] scalar once at create() — the heat-map is a picture of a
 *  closed-form field, so drawing it from a cached canvas fakes nothing. */
function renderShade(
  w: number,
  h: number,
  rgb: [number, number, number],
  maxAlpha: number,
  value: (x: number, y: number) => number,
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.floor(w))
  c.height = Math.max(1, Math.floor(h))
  const g = c.getContext('2d')
  if (!g) return c
  const img = g.createImageData(c.width, c.height)
  const d = img.data
  let k = 0
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const v = Math.min(1, Math.max(0, value(x, y)))
      d[k] = rgb[0]
      d[k + 1] = rgb[1]
      d[k + 2] = rgb[2]
      d[k + 3] = Math.round(v * maxAlpha * 255)
      k += 4
    }
  }
  g.putImageData(img, 0, 0)
  return c
}

/** Azimuthal A of a localized flux core at (cx, cy): F ≠ 0 only inside r_c. */
function fluxCoreField(w: number, h: number, cx: number, cy: number, rc: number): AField {
  const F0 = (3 * PHI) / (Math.PI * rc * rc)
  const f = (x: number, y: number) => {
    const u = ((x - cx) ** 2 + (y - cy) ** 2) / (rc * rc)
    return u >= 1 ? 0 : F0 * (1 - u) * (1 - u)
  }
  return {
    f,
    a(x, y, out) {
      const dx = x - cx
      const dy = y - cy
      const r2 = dx * dx + dy * dy
      const u = Math.min(r2 / (rc * rc), 1)
      // A_φ/r, with the r→0 limit taken analytically so there is no 0/0 at the
      // core center: Φ_enc/(2πr²) → 3Φ/(2π r_c²).
      const g = r2 < 1e-6 ? (3 * PHI) / (2 * Math.PI * rc * rc) : (PHI * (1 - (1 - u) ** 3)) / (2 * Math.PI * r2)
      out.x = -dy * g
      out.y = dx * g
    },
    shade: renderShade(w, h, [124, 58, 237], 0.5, (x, y) => f(x, y) / F0), // curv violet
    drawMarks(ctx) {
      // the marked region: dashed violet edge of the core
      ctx.strokeStyle = PALETTE.curv
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, rc, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    },
  }
}

/** Pure-gauge A = ∂α for a Gaussian bump α — the boundary check. The arrows
 *  are plainly nonzero, yet ∮A = 0 around every closed loop (it's a gradient);
 *  the meter reads the quadrature of that fact, not a hardcoded zero. */
function pureGaugeField(w: number, h: number): AField {
  const bx = 0.62 * w
  const by = 0.42 * h
  const sig = 0.2 * Math.min(w, h)
  const A0 = 0.9 // rad — peak of the α bump
  const alpha = (x: number, y: number) => A0 * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / (2 * sig * sig))
  return {
    f: () => 0, // the curl of a gradient is identically zero — exact, not approximate
    a(x, y, out) {
      const al = alpha(x, y)
      out.x = (-al * (x - bx)) / (sig * sig)
      out.y = (-al * (y - by)) / (sig * sig)
    },
    shade: renderShade(w, h, [5, 150, 105], 0.35, (x, y) => alpha(x, y) / A0), // gauge green
    drawMarks() {},
  }
}

// ------------------------------------------------------------ quadrature ----

/** Cumulative transport rotation Θ(s) = ∫₀ˢ A·dp along a path, tabulated once
 *  at create() (midpoint rule). Playback later only LOOKS UP this table. */
function tabulateTransport(field: AField, path: Path, m = TABLE_M): Float32Array {
  const t = new Float32Array(m + 1)
  const av: Vec = { x: 0, y: 0 }
  for (let k = 0; k < m; k++) {
    const p0 = path(k / m)
    const p1 = path((k + 1) / m)
    const pm = path((k + 0.5) / m)
    field.a(pm.x, pm.y, av)
    t[k + 1] = t[k] + av.x * (p1.x - p0.x) + av.y * (p1.y - p0.y)
  }
  return t
}

function lookup(table: Float32Array, s: number): number {
  const m = table.length - 1
  const f = Math.min(Math.max(s, 0), 1) * m
  const i = Math.min(Math.floor(f), m - 1)
  return table[i] + (table[i + 1] - table[i]) * (f - i)
}

/** ∮ A·dl around a circle — midpoint rule, recomputed live each frame. */
function loopIntegral(field: AField, cx: number, cy: number, r: number): number {
  const av: Vec = { x: 0, y: 0 }
  const dphi = (2 * Math.PI) / LOOP_SEGS
  let sum = 0
  for (let k = 0; k < LOOP_SEGS; k++) {
    const phi = (k + 0.5) * dphi
    field.a(cx + r * Math.cos(phi), cy + r * Math.sin(phi), av)
    sum += (-Math.sin(phi) * av.x + Math.cos(phi) * av.y) * r * dphi
  }
  return sum
}

/** ∬ F dA over the loop's disc — polar midpoint rule, independent of ∮A. */
function fluxIntegral(field: AField, cx: number, cy: number, r: number): number {
  const dr = r / FLUX_NR
  const dphi = (2 * Math.PI) / FLUX_NA
  let sum = 0
  for (let j = 0; j < FLUX_NR; j++) {
    const rho = (j + 0.5) * dr
    for (let i = 0; i < FLUX_NA; i++) {
      const phi = (i + 0.5) * dphi
      sum += field.f(cx + rho * Math.cos(phi), cy + rho * Math.sin(phi)) * rho * dr * dphi
    }
  }
  return sum
}

// --------------------------------------------------------------- drawing ----

const fmtDeg = (v: number) => `${Math.round((v * 180) / Math.PI)}°`
const fmtRad = (v: number) => `${v.toFixed(2)} rad (${fmtDeg(v)})`
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

function arrowHead(ctx: CanvasRenderingContext2D, tx: number, ty: number, ux: number, uy: number): void {
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(tx - ux * 6 + uy * 3.5, ty - uy * 6 - ux * 3.5)
  ctx.lineTo(tx - ux * 6 - uy * 3.5, ty - uy * 6 + ux * 3.5)
  ctx.closePath()
  ctx.fill()
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number): void {
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + dx, y + dy)
  ctx.stroke()
  arrowHead(ctx, x + dx, y + dy, dx / len, dy / len)
}

/** The base: a plane of faint clock faces (the fibers, seen from above). */
function drawPlane(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = 'rgba(107,114,128,0.16)'
  ctx.lineWidth = 1
  for (let y = GRID / 2; y < h; y += GRID) {
    for (let x = GRID / 2; x < w; x += GRID) {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

/** The connection pair (A_x, A_y): one blue arrow per clock. */
function drawAArrows(ctx: CanvasRenderingContext2D, field: AField, w: number, h: number): void {
  const av: Vec = { x: 0, y: 0 }
  ctx.strokeStyle = PALETTE.conn
  ctx.fillStyle = PALETTE.conn
  ctx.lineWidth = 1.4
  ctx.globalAlpha = 0.6
  for (let y = GRID / 2; y < h; y += GRID) {
    for (let x = GRID / 2; x < w; x += GRID) {
      field.a(x, y, av)
      const dx = av.x * ARROW_GAIN
      const dy = av.y * ARROW_GAIN
      if (Math.hypot(dx, dy) < 3) continue
      drawArrow(ctx, x, y, dx, dy)
    }
  }
  ctx.globalAlpha = 1
}

/** A transport needle: amber arrow glyph with a base dot. */
function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, color: string, lw = 2.4): void {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  drawArrow(ctx, x, y, Math.cos(ang) * NEEDLE_LEN, Math.sin(ang) * NEEDLE_LEN)
  ctx.beginPath()
  ctx.arc(x, y, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

/** A route drawn as a gray polyline with a small direction chevron. */
function drawPathLine(ctx: CanvasRenderingContext2D, path: Path): void {
  ctx.strokeStyle = 'rgba(107,114,128,0.6)'
  ctx.fillStyle = 'rgba(107,114,128,0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const segs = 96
  for (let k = 0; k <= segs; k++) {
    const p = path(k / segs)
    if (k === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  const p = path(0.09)
  const q = path(0.11)
  const len = Math.hypot(q.x - p.x, q.y - p.y)
  if (len > 1e-6) arrowHead(ctx, q.x, q.y, (q.x - p.x) / len, (q.y - p.y) / len)
}

/** The holonomy probe: violet ring with a traversal chevron and a center dot. */
function drawLoopRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.strokeStyle = PALETTE.curv
  ctx.fillStyle = PALETTE.curv
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  const phi = -Math.PI / 4
  arrowHead(ctx, cx + r * Math.cos(phi), cy + r * Math.sin(phi), -Math.sin(phi), Math.cos(phi))
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fill()
}

interface MeterLine {
  text: string
  color: string
}

function drawMeter(ctx: CanvasRenderingContext2D, lines: MeterLine[]): void {
  ctx.font = FONT
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = lines[i].color
    ctx.fillText(lines[i].text, 12, 20 + i * 18)
  }
}

function drawHint(ctx: CanvasRenderingContext2D, text: string, h: number): void {
  ctx.font = FONT
  ctx.fillStyle = 'rgba(85,96,111,0.7)'
  ctx.fillText(text, 12, h - 10)
}

// --------------------------------------------- handler: carried needles -----
// Shared by 'two-paths' and 'two-loops': two needles carried along two preset
// routes, then held at the end with a verdict. Transport comes from the
// precomputed tables — step() advances the playback parameter only.

interface Mark {
  x: number
  y: number
  text: string
}

interface RunnersCfg {
  field: AField
  paths: [Path, Path]
  dots: Vec[]
  marks: Mark[]
  live(r1: number, r2: number): MeterLine[]
  verdict(d1: number, d2: number): MeterLine[]
}

function createRunnersFig(cfg: RunnersCfg, speedRef: { current: number }): Stepper {
  const tables = [tabulateTransport(cfg.field, cfg.paths[0]), tabulateTransport(cfg.field, cfg.paths[1])]
  const START_ANG = -Math.PI / 2 // both needles start pointing straight up
  let s = 0
  let ghostS = 0
  const ghosts: { x: number; y: number; ang: number }[] = []
  const pushGhosts = (at: number) => {
    for (let i = 0; i < 2; i++) {
      const p = cfg.paths[i](at)
      ghosts.push({ x: p.x, y: p.y, ang: START_ANG + lookup(tables[i], at) })
    }
  }
  pushGhosts(0)

  return {
    step(dt) {
      if (s >= 1) return // run once, hold the verdict; Reset reruns
      s = Math.min(1, s + (dt * speedRef.current) / RUN_SECONDS)
      while (s - ghostS >= GHOST_DS) {
        ghostS += GHOST_DS
        pushGhosts(ghostS)
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawPlane(ctx, w, h)
      ctx.globalAlpha = 0.3
      ctx.drawImage(cfg.field.shade, 0, 0)
      ctx.globalAlpha = 1
      cfg.field.drawMarks(ctx)
      drawAArrows(ctx, cfg.field, w, h)
      drawPathLine(ctx, cfg.paths[0])
      drawPathLine(ctx, cfg.paths[1])
      ctx.fillStyle = INK
      ctx.font = FONT
      for (const d of cfg.dots) {
        ctx.beginPath()
        ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const m of cfg.marks) ctx.fillText(m.text, m.x, m.y)
      // the journey so far: ghost needles
      ctx.globalAlpha = 0.3
      for (const g of ghosts) drawNeedle(ctx, g.x, g.y, g.ang, PALETTE.theta, 1.6)
      ctx.globalAlpha = 1
      // the carried needles, live (at s = 1 this IS the returned/arrived needle)
      const r1 = lookup(tables[0], s)
      const r2 = lookup(tables[1], s)
      const done = s >= 1
      if (done) {
        // faint reference: the unrotated start orientation, under each arrival
        ctx.globalAlpha = 0.45
        drawNeedle(ctx, cfg.paths[0](1).x, cfg.paths[0](1).y, START_ANG, PALETTE.wall, 1.6)
        drawNeedle(ctx, cfg.paths[1](1).x, cfg.paths[1](1).y, START_ANG, PALETTE.wall, 1.6)
        ctx.globalAlpha = 1
      }
      const p1 = cfg.paths[0](s)
      const p2 = cfg.paths[1](s)
      drawNeedle(ctx, p1.x, p1.y, START_ANG + r1, PALETTE.theta)
      drawNeedle(ctx, p2.x, p2.y, START_ANG + r2, PALETTE.theta)
      drawMeter(ctx, done ? cfg.verdict(r1, r2) : cfg.live(r1, r2))
    },
  }
}

// ------------------------------------------------ handler: the loop probe ---
// Shared by 'explore', 'gauge-check', and 'field': one fixed-size loop, moved
// by pointer (drag, or tap to place — the tap-step equivalent), with live
// meters. A game, not a flow: step() is a no-op; state changes come from the
// pointer only (MobiusComb precedent).

interface DragRef {
  active: boolean
  fx: number
  fy: number
}

interface ProbeCfg {
  field: AField
  shadeAlpha: number
  loopR: number
  start: Vec
  readout(circ: number, flux: number): MeterLine[]
  hint: string
}

function createProbeFig(cfg: ProbeCfg, drag: DragRef): Stepper {
  let cx = cfg.start.x
  let cy = cfg.start.y
  return {
    step() {
      /* a game, not a flow — the pointer is the only dynamics */
    },
    draw(ctx, w, h) {
      if (drag.active) {
        cx = clamp(drag.fx * w, 12, w - 12)
        cy = clamp(drag.fy * h, 12, h - 12)
      }
      ctx.clearRect(0, 0, w, h)
      drawPlane(ctx, w, h)
      ctx.globalAlpha = cfg.shadeAlpha
      ctx.drawImage(cfg.field.shade, 0, 0)
      ctx.globalAlpha = 1
      cfg.field.drawMarks(ctx)
      drawAArrows(ctx, cfg.field, w, h)
      drawLoopRing(ctx, cx, cy, cfg.loopR)
      const circ = loopIntegral(cfg.field, cx, cy, cfg.loopR)
      const flux = fluxIntegral(cfg.field, cx, cy, cfg.loopR)
      drawMeter(ctx, cfg.readout(circ, flux))
      drawHint(ctx, cfg.hint, h)
    },
  }
}

// ----------------------------------------------------- per-mode creators ----

/** Shared core placement for the single-core modes. */
function coreGeom(w: number, h: number): { cx: number; cy: number; rc: number } {
  return { cx: 0.5 * w, cy: 0.52 * h, rc: 0.16 * Math.min(w, h) }
}

function createTwoPathsFig(speedRef: { current: number }, w: number, h: number): Stepper {
  const cy = 0.58 * h
  const rc = 0.16 * Math.min(w, h)
  const field = fluxCoreField(w, h, 0.5 * w, cy, rc)
  const P: Vec = { x: 0.12 * w, y: cy }
  const Q: Vec = { x: 0.88 * w, y: cy }
  // two smooth arcs P→Q, both clear of the core (F = 0 all along each path);
  // only the region enclosed BETWEEN them contains the core
  const arc =
    (bump: number): Path =>
    (s) => ({ x: P.x + s * (Q.x - P.x), y: cy + bump * Math.sin(Math.PI * s) })
  return createRunnersFig(
    {
      field,
      paths: [arc(-0.3 * h), arc(0.26 * h)],
      dots: [P, Q],
      marks: [
        { x: P.x - 4, y: P.y - 10, text: 'P' },
        { x: Q.x - 4, y: Q.y - 10, text: 'Q' },
        { x: 0.47 * w, y: cy - 0.3 * h - 8, text: 'path 1' },
        { x: 0.47 * w, y: cy + 0.26 * h + 18, text: 'path 2' },
      ],
      live: (r1, r2) => [
        { text: `two needles, same start, P → Q — rotations so far: ${fmtDeg(r1)} and ${fmtDeg(r2)}`, color: INK },
      ],
      verdict: (d1, d2) => [
        { text: `the arrivals disagree: ${fmtDeg(d1)} vs ${fmtDeg(d2)} — difference ${fmtDeg(d1 - d2)}`, color: PALETTE.curv },
        { text: 'exactly the flux enclosed between the paths · Reset to rerun', color: INK },
      ],
    },
    speedRef,
  )
}

function createTwoLoopsFig(speedRef: { current: number }, w: number, h: number): Stepper {
  const rc = 0.16 * Math.min(w, h)
  const c1: Vec = { x: 0.3 * w, y: 0.5 * h } // this loop encircles the core
  const c2: Vec = { x: 0.72 * w, y: 0.5 * h } // this one does not
  const field = fluxCoreField(w, h, c1.x, c1.y, rc)
  const R = 1.6 * rc // both loop paths stay outside the core itself
  const circle =
    (c: Vec): Path =>
    (s) => ({
      x: c.x + R * Math.cos(2 * Math.PI * s - Math.PI / 2),
      y: c.y + R * Math.sin(2 * Math.PI * s - Math.PI / 2),
    })
  return createRunnersFig(
    {
      field,
      paths: [circle(c1), circle(c2)],
      dots: [],
      marks: [
        { x: c1.x - 38, y: c1.y + R + 18, text: 'around the core' },
        { x: c2.x - 36, y: c2.y + R + 18, text: 'misses the core' },
      ],
      live: (r1, r2) => [
        { text: `two needles, both starting straight up — rotations so far: ${fmtDeg(r1)} and ${fmtDeg(r2)}`, color: INK },
      ],
      verdict: (d1, d2) => [
        { text: `around the core: returns rotated ${fmtDeg(d1)}`, color: PALETTE.curv },
        { text: `missing the core: returns rotated ${fmtDeg(d2)} — unrotated · Reset to rerun`, color: INK },
      ],
    },
    speedRef,
  )
}

function createExploreFig(drag: DragRef, w: number, h: number): Stepper {
  const { cx, cy, rc } = coreGeom(w, h)
  return createProbeFig(
    {
      field: fluxCoreField(w, h, cx, cy, rc),
      shadeAlpha: 0.25, // the core is a marked region here; its full violet picture is §8's
      loopR: 1.35 * rc, // fixed size — big enough to swallow the whole core
      start: { x: 0.18 * w, y: 0.3 * h },
      readout: (circ) => [{ text: `∮ A·dl = ${fmtRad(circ)}`, color: PALETTE.curv }],
      hint: 'drag the loop (or tap to place it) — the meter wakes exactly when the core is enclosed',
    },
    drag,
  )
}

function createGaugeCheckFig(drag: DragRef, w: number, h: number): Stepper {
  return createProbeFig(
    {
      field: pureGaugeField(w, h),
      shadeAlpha: 1,
      loopR: 0.216 * Math.min(w, h), // same probe size as 'explore'
      start: { x: 0.3 * w, y: 0.55 * h },
      readout: (circ) => [
        { text: `∮ A·dl = ${circ.toFixed(3)} rad`, color: PALETTE.curv },
        { text: 'this A is pure gauge (A = ∂α, the green bump): zero around every loop', color: INK },
      ],
      hint: 'drag the loop anywhere — arrows everywhere, holonomy nowhere',
    },
    drag,
  )
}

function createFieldFig(drag: DragRef, w: number, h: number): Stepper {
  const { cx, cy, rc } = coreGeom(w, h)
  return createProbeFig(
    {
      field: fluxCoreField(w, h, cx, cy, rc),
      shadeAlpha: 1, // §8: F earns its own violet picture
      loopR: 1.35 * rc,
      start: { x: 0.75 * w, y: 0.32 * h },
      readout: (circ, flux) => [
        { text: `∮ A·dl = ${circ.toFixed(2)} rad`, color: PALETTE.curv },
        { text: `∬ F dA = ${flux.toFixed(2)} rad`, color: PALETTE.curv },
        { text: 'two independent quadratures agree — Stokes, computed live', color: INK },
      ],
      hint: 'drag the loop — the boundary meter and the area meter never disagree',
    },
    drag,
  )
}

function createShrinkFig(radiusRef: { current: number }, w: number, h: number): Stepper {
  const { cx, cy, rc } = coreGeom(w, h)
  const field = fluxCoreField(w, h, cx, cy, rc)
  const rMin = 0.2 * rc
  const rMax = 2.4 * rc
  const F0rc2 = field.f(cx, cy) * rc * rc // F at the center, in rad per core-radius² = 3Φ/π
  return {
    step() {
      /* nothing evolves — the radius slider is the only dynamics */
    },
    draw(ctx, w2, h2) {
      const r = rMin + (rMax - rMin) * radiusRef.current
      ctx.clearRect(0, 0, w2, h2)
      drawPlane(ctx, w2, h2)
      ctx.drawImage(field.shade, 0, 0)
      field.drawMarks(ctx)
      drawAArrows(ctx, field, w2, h2)
      drawLoopRing(ctx, cx, cy, r)
      const circ = loopIntegral(field, cx, cy, r)
      const flux = fluxIntegral(field, cx, cy, r)
      const perArea = (circ / (Math.PI * r * r)) * rc * rc
      drawMeter(ctx, [
        { text: `∮ A·dl = ${circ.toFixed(2)} rad · ∬ F dA = ${flux.toFixed(2)} rad`, color: PALETTE.curv },
        { text: `rotation per area: ∮A / area = ${perArea.toFixed(2)} rad/r_c²`, color: PALETTE.curv },
        { text: `F at the center = ${F0rc2.toFixed(2)} rad/r_c² — shrink the loop toward it`, color: INK },
      ])
      drawHint(ctx, 'one knob: the radius — the per-loop fact becomes a per-area density', h2)
    },
  }
}

// ------------------------------------------------------------- component ----

interface Refs {
  speed: { current: number }
  radius: { current: number }
  drag: DragRef
}

/** Thin dispatcher: pick the one handler for the mode. Exhaustive — no default. */
function createHolonomy(mode: HolonomyMode, refs: Refs, w: number, h: number): Stepper {
  switch (mode) {
    case 'two-paths':
      return createTwoPathsFig(refs.speed, w, h)
    case 'two-loops':
      return createTwoLoopsFig(refs.speed, w, h)
    case 'explore':
      return createExploreFig(refs.drag, w, h)
    case 'gauge-check':
      return createGaugeCheckFig(refs.drag, w, h)
    case 'shrink':
      return createShrinkFig(refs.radius, w, h)
    case 'field':
      return createFieldFig(refs.drag, w, h)
  }
}

/** Which single control each mode owns (plus the shell's Play/Pause/Reset). */
type Knob = 'speed' | 'radius' | 'drag'
const MODE_KNOB: Record<HolonomyMode, Knob> = {
  'two-paths': 'speed',
  'two-loops': 'speed',
  explore: 'drag',
  'gauge-check': 'drag',
  shrink: 'radius',
  field: 'drag',
}

export function HolonomyLoop({ mode }: { mode: HolonomyMode }) {
  const [speed, setSpeed] = useState(1)
  const [radius, setRadius] = useState(0.85) // start big; the story is the shrink
  // mirror state into refs so the running stepper reads live values
  const speedRef = useRef(speed)
  speedRef.current = speed
  const radiusRef = useRef(radius)
  radiusRef.current = radius
  const dragRef = useRef<DragRef>({ active: false, fx: 0, fy: 0 })
  const knob = MODE_KNOB[mode]

  const onPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = canvasFrac(e)
    if (!p) return
    dragRef.current.active = e.buttons > 0
    dragRef.current.fx = p.fx
    dragRef.current.fy = p.fy
  }
  const dragProps =
    knob === 'drag'
      ? {
          onPointerDown: onPointer,
          onPointerMove: onPointer,
          onPointerUp: onPointer,
          style: { touchAction: 'none' as const },
        }
      : {}

  return (
    <div {...dragProps}>
      <Sim
        height={320}
        create={(w, h) => createHolonomy(mode, { speed: speedRef, radius: radiusRef, drag: dragRef.current }, w, h)}
      >
        {knob === 'speed' && (
          <label className="sim-slider">
            <span>slow</span>
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.05}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span>fast</span>
          </label>
        )}
        {knob === 'radius' && (
          <label className="sim-slider">
            <span>shrink</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <span>grow</span>
          </label>
        )}
      </Sim>
    </div>
  )
}
