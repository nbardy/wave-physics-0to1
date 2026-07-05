import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { clockRow, drawBase, laneSplit, type Lane } from './lib/clocks'
import { createAWave } from './lib/awave'

// §11 — the Universal Wave Machine (fig 61; figs 62–65 are its frozen presets).
// One construction contains every wave: choose the fiber, choose the connection,
// write the covariant wave operator. The dial is literally a sum type —
//   Mode = 'string' | 'phase' | 'charged' | 'light'
// (not a fiber × connection product: line-fiber × nontrivial-connection is
// uninhabited, so illegal states are unrepresentable). One handler per mode; the
// dial picks the fiber, the mass, and which field is live vs frozen scenery.
//
// Scheme (modes 1–3): leapfrog on the complex section ψ = (re, im),
//   ψ^{n+1} = 2ψ^n − ψ^{n−1} + C²·Lψ − (μΔt)²ψ,
// with the covariant Laplacian discretized through link phases
// U_i = e^{iA_{i+1/2}Δx} on edges (grid units, Δx = 1):
//   Lψ_i = U_i ψ_{i+1} − 2ψ_i + U*_{i−1} ψ_{i−1}.
// |U| = 1 makes L Hermitian with spectrum in [−4, 0] whatever A is, so the
// charged mode's stability is A-independent by construction — and "one group
// element per lattice edge" is exactly lattice gauge theory's discretization
// (RESEARCH.md §7). The string mode is the same kernel on real data: U ≡ 1 and
// im ≡ 0 stay that way exactly, so all three ψ-modes run ONE advance function.
// Mode 4 drives lib/awave.ts — the U ≡ 1, real-field member of the same leapfrog
// family, where the unknown is the connection itself.
//
// Stability: (c·Δt/Δx)² + (μ·Δt/2)² ≤ 1. Here C = c·Δt/Δx = COURANT = 0.9 and
// the mass slider maps DIRECTLY onto m = μ·Δt/2 ∈ [0, M_MAX = 0.4], so
//   0.9² + 0.4² = 0.81 + 0.16 = 0.97 ≤ 1  by construction — no runtime check.
//
// μ² confession (the free-phase mode's one constant): with μ > 0 this is the
// relativistic — Klein–Gordon — cousin of the schoolbook matter wave. A real
// electron obeys Schrödinger's first-order-in-time cousin, a difference the
// lesson names but does not build; the coupling rule (every ∂ → D) is identical
// either way, which is the dial's actual claim. Without μ the free phase wave is
// dynamically identical to the string and the dial's second stop shows nothing.

const GRID = 200 // ψ samples on a periodic base circle (wrapped ends)
const CLOCKS = 26 // fibers drawn in the top lane
const FIXED_DT = 1 / 240 // fixed physics step (= AWAVE_FIXED_DT), decoupled from RAF
const COURANT = 0.9 // C = c·Δt/Δx — see the stability note above
const M_MAX = 0.4 // slider ceiling on m = μ·Δt/2 — see the stability note above
const DAMP = 0.9999 // barely-there loss so wrapped packets don't pile up forever
const HW = 12 // seed packet half-width, grid cells
const K_CARRIER = 0.35 // seed packet carrier wavenumber, rad per cell
const A0 = 0.35 // charged mode: frozen A's peak, rad per link — |U| = 1 regardless
const RELAUNCH_SECONDS = 7 // light mode: re-pluck after the pulse has drained away
const SWAP_SECONDS = 1.8 // light mode: the staged amber→blue protagonist swap

// Visual gain factors, confessed: needle length is |ψ| × PHASOR_GAIN (clamped to
// the face); the frozen A(x) curve is plotted × A_VIS_GAIN so a 0.35-rad bump is
// legible; transported needles turn ∫A dx × TRANSPORT_GAIN (the hero's factor).
const PHASOR_GAIN = 1.15
const A_VIS_GAIN = 2.5
const TRANSPORT_GAIN = 0.9

const INK = '#55606f'
const FAINT = 'rgba(107,114,128,0.4)'
const SOFT = '#8b93a1'
const AMBER_RGB: [number, number, number] = [217, 119, 6] // PALETTE.theta
const BLUE_RGB: [number, number, number] = [37, 99, 235] // PALETTE.conn

export type UWMMode = 'string' | 'phase' | 'charged' | 'light'

const MODE_ORDER: readonly UWMMode[] = ['string', 'phase', 'charged', 'light']
const MODE_LABEL: Record<UWMMode, string> = {
  string: 'string',
  phase: 'free phase',
  charged: 'charged',
  light: 'light',
}
// μ² enters the equation only over a circle fiber with a section to be massive.
const MASS_ACTIVE: Record<UWMMode, boolean> = {
  string: false,
  phase: true,
  charged: true,
  light: false,
}

// ---------------------------------------------------------------------------
// state + the one covariant kernel
// ---------------------------------------------------------------------------

interface PsiState {
  re: Float32Array
  im: Float32Array
  rePrev: Float32Array
  imPrev: Float32Array
  reNext: Float32Array
  imNext: Float32Array
}

/** Gaussian packet × plane wave e^{ikx}; k = 0 gives a purely real pulse. */
function makePsi(k: number, centerFrac: number): PsiState {
  const s: PsiState = {
    re: new Float32Array(GRID),
    im: new Float32Array(GRID),
    rePrev: new Float32Array(GRID),
    imPrev: new Float32Array(GRID),
    reNext: new Float32Array(GRID),
    imNext: new Float32Array(GRID),
  }
  const c0 = centerFrac * (GRID - 1)
  const at = (x: number): [number, number] => {
    const env = Math.exp(-((x - c0) ** 2) / (2 * HW * HW))
    return [env * Math.cos(k * (x - c0)), env * Math.sin(k * (x - c0))]
  }
  for (let i = 0; i < GRID; i++) {
    const [r0, i0] = at(i)
    s.re[i] = r0
    s.im[i] = i0
    // traveling seed: the previous level is the same packet shifted C cells left
    const [rp, ip] = at(i - COURANT)
    s.rePrev[i] = rp
    s.imPrev[i] = ip
  }
  return s
}

interface Links {
  cu: Float32Array // cos of the link phase per edge i → i+1
  su: Float32Array // sin of the link phase per edge
}

function trivialLinks(): Links {
  const cu = new Float32Array(GRID).fill(1)
  const su = new Float32Array(GRID)
  return { cu, su }
}

/** Frozen background A(x): a smooth bump; links from edge-midpoint values. */
function bumpLinks(): { links: Links; aBg: Float32Array } {
  const aBg = new Float32Array(GRID)
  for (let i = 0; i < GRID; i++) {
    const f = i / (GRID - 1)
    aBg[i] = A0 * Math.exp(-((f - 0.6) ** 2) / (2 * 0.07 * 0.07))
  }
  const cu = new Float32Array(GRID)
  const su = new Float32Array(GRID)
  for (let i = 0; i < GRID; i++) {
    const aMid = 0.5 * (aBg[i] + aBg[(i + 1) % GRID])
    cu[i] = Math.cos(aMid)
    su[i] = Math.sin(aMid)
  }
  return { links: { cu, su }, aBg }
}

/**
 * The one leapfrog every ψ-mode runs. U_i ψ_{i+1} transports the right
 * neighbour back through the link; U*_{i−1} ψ_{i−1} the left. m = μ·Δt/2.
 */
function advanceCovariant(s: PsiState, links: Links, m: number): void {
  const { re, im, rePrev, imPrev, reNext, imNext } = s
  const { cu, su } = links
  const c2 = COURANT * COURANT
  const kMass = 4 * m * m // (μΔt)² = (2m)²
  for (let i = 0; i < GRID; i++) {
    const ir = i + 1 === GRID ? 0 : i + 1
    const il = i === 0 ? GRID - 1 : i - 1
    // U_i ψ_{i+1}
    const hopRre = cu[i] * re[ir] - su[i] * im[ir]
    const hopRim = cu[i] * im[ir] + su[i] * re[ir]
    // U*_{i−1} ψ_{i−1}
    const hopLre = cu[il] * re[il] + su[il] * im[il]
    const hopLim = cu[il] * im[il] - su[il] * re[il]
    const lapRe = hopRre - 2 * re[i] + hopLre
    const lapIm = hopRim - 2 * im[i] + hopLim
    reNext[i] = (2 * re[i] - rePrev[i] + c2 * lapRe - kMass * re[i]) * DAMP
    imNext[i] = (2 * im[i] - imPrev[i] + c2 * lapIm - kMass * im[i]) * DAMP
  }
  rePrev.set(re)
  imPrev.set(im)
  re.set(reNext)
  im.set(imNext)
}

// ---------------------------------------------------------------------------
// the shared stepper skeleton — every mode gets its advance called at FIXED_DT
// ---------------------------------------------------------------------------

interface Knobs {
  m: { current: number } // mass slider, already in m = μ·Δt/2 units
  speed: { current: number } // time-speed slider
}

function shell(knobs: Knobs, advance: () => void, draw: Stepper['draw']): Stepper {
  let acc = 0
  return {
    step(dt) {
      acc += dt * knobs.speed.current
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw,
  }
}

// ---------------------------------------------------------------------------
// draw helpers (each pane drawn from state; no pane owns state of its own)
// ---------------------------------------------------------------------------

const LANE_FRACS = [0.32, 0.34, 0.34]

function drawFaceRing(ctx: CanvasRenderingContext2D, x: number, cy: number, r: number): void {
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(x, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

/** String mode's fibers: line fibers (rails) with the section as amber dots. */
function drawRailRow(ctx: CanvasRenderingContext2D, lane: Lane, re: Float32Array): void {
  const row = clockRow(lane, CLOCKS)
  const mid = (lane.y0 + lane.y1) / 2
  const half = (lane.y1 - lane.y0) * 0.34
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(lane.x0, lane.y1)
  ctx.lineTo(lane.x1, lane.y1)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(107,114,128,0.45)'
  ctx.lineWidth = 1
  for (let c = 0; c < CLOCKS; c++) {
    ctx.beginPath()
    ctx.moveTo(row.cx[c], mid - half)
    ctx.lineTo(row.cx[c], mid + half)
    ctx.stroke()
  }
  ctx.fillStyle = PALETTE.theta
  for (let c = 0; c < CLOCKS; c++) {
    const gi = Math.round((c * (GRID - 1)) / (CLOCKS - 1))
    const u = Math.max(-1, Math.min(1, re[gi]))
    ctx.beginPath()
    ctx.arc(row.cx[c], mid - u * half * 0.95, 3.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * Circle-fiber modes: clock faces with phasor needles — angle arg ψ, length |ψ|.
 * The needle length is §11's one confessed representation upgrade: mode 3's
 * sliding fringes need amplitude; the angle-only needles of §5–6 cannot interfere.
 */
function drawPhasorRow(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  re: Float32Array,
  im: Float32Array,
): void {
  const row = clockRow(lane, CLOCKS)
  drawBase(ctx, row, lane)
  for (let c = 0; c < CLOCKS; c++) {
    drawFaceRing(ctx, row.cx[c], row.cy, row.r)
    const gi = Math.round((c * (GRID - 1)) / (CLOCKS - 1))
    const mag = Math.hypot(re[gi], im[gi])
    const len = row.r * 0.92 * Math.min(mag * PHASOR_GAIN, 1)
    if (len < 0.8) continue // a dead fiber has no needle to draw
    const a = -Math.atan2(im[gi], re[gi]) // canvas y grows downward; negate for CCW
    ctx.strokeStyle = PALETTE.theta
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(row.cx[c], row.cy)
    ctx.lineTo(row.cx[c] + Math.cos(a) * len, row.cy + Math.sin(a) * len)
    ctx.stroke()
  }
}

/**
 * Light mode's fibers: a reference needle parallel-transported from the left end
 * under the live A — the pulse arrives as a traveling kink in "parallel"
 * (the hero figure's bottom pane, replayed as the dial's last stop).
 */
function drawTransportRow(ctx: CanvasRenderingContext2D, lane: Lane, a: Float32Array): void {
  const row = clockRow(lane, CLOCKS)
  drawBase(ctx, row, lane)
  const n = a.length
  let phi = Math.PI / 2
  for (let c = 0; c < CLOCKS; c++) {
    drawFaceRing(ctx, row.cx[c], row.cy, row.r)
    ctx.strokeStyle = PALETTE.conn
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(row.cx[c], row.cy)
    ctx.lineTo(
      row.cx[c] + Math.cos(-phi) * row.r * 0.85,
      row.cy + Math.sin(-phi) * row.r * 0.85,
    )
    ctx.stroke()
    const from = Math.floor((c / CLOCKS) * n)
    const to = Math.floor(((c + 1) / CLOCKS) * n)
    for (let j = from; j < to; j++) phi += a[j] * TRANSPORT_GAIN * (1 / CLOCKS) * 8
  }
}

/** The waving curve, full grid resolution, fixed range ±1.25. */
function drawCurve(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  vals: Float32Array,
  color: string,
  label: string,
): void {
  const mid = (lane.y0 + lane.y1) / 2
  const amp = (lane.y1 - lane.y0) * 0.42
  const n = vals.length
  const x = (i: number) => lane.x0 + (i / (n - 1)) * (lane.x1 - lane.x0)
  const y = (v: number) => mid - (v / 1.25) * amp
  ctx.strokeStyle = 'rgba(120,140,170,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(lane.x0, mid)
  ctx.lineTo(lane.x1, mid)
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    if (i === 0) ctx.moveTo(x(i), y(vals[i]))
    else ctx.lineTo(x(i), y(vals[i]))
  }
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label, lane.x0 + 4, lane.y0 + 12)
}

/** Dashed ±|ψ| envelope — dispersion made visible when μ > 0. */
function drawEnvelope(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  re: Float32Array,
  im: Float32Array,
  mag: Float32Array,
): void {
  for (let i = 0; i < GRID; i++) mag[i] = Math.hypot(re[i], im[i])
  const mid = (lane.y0 + lane.y1) / 2
  const amp = (lane.y1 - lane.y0) * 0.42
  const x = (i: number) => lane.x0 + (i / (GRID - 1)) * (lane.x1 - lane.x0)
  const y = (v: number) => mid - (v / 1.25) * amp
  ctx.strokeStyle = 'rgba(217,119,6,0.35)'
  ctx.lineWidth = 1.2
  ctx.setLineDash([4, 4])
  for (const sign of [1, -1]) {
    ctx.beginPath()
    for (let i = 0; i < GRID; i++) {
      if (i === 0) ctx.moveTo(x(i), y(sign * mag[i]))
      else ctx.lineTo(x(i), y(sign * mag[i]))
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
}

/** Charged mode's frozen scenery: the background A(x), tinted blue, dimmed. */
function drawFrozenA(ctx: CanvasRenderingContext2D, lane: Lane, aBg: Float32Array): void {
  const mid = (lane.y0 + lane.y1) / 2
  const amp = (lane.y1 - lane.y0) * 0.42
  const x = (i: number) => lane.x0 + (i / (GRID - 1)) * (lane.x1 - lane.x0)
  const y = (v: number) => mid - (v / 1.25) * amp
  ctx.fillStyle = 'rgba(37,99,235,0.10)'
  ctx.strokeStyle = 'rgba(37,99,235,0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x(0), y(0))
  for (let i = 0; i < GRID; i++) ctx.lineTo(x(i), y(aBg[i] * A_VIS_GAIN))
  ctx.lineTo(x(GRID - 1), y(0))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(37,99,235,0.75)'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`A(x) — frozen scenery (×${A_VIS_GAIN})`, lane.x1 - 4, lane.y0 + 12)
  ctx.textAlign = 'left'
}

// ---------------------------------------------------------------------------
// the equation pane — one covariant equation, pieces graying and switching live
// ---------------------------------------------------------------------------

const EQ_FONT = 'italic 17px Georgia, "Times New Roman", serif'
const EQ_SUB_FONT = 'italic 11px Georgia, "Times New Roman", serif'
const FOOT1 = 'every mode runs the same leapfrog on the same covariant operator;'
const FOOT2 = 'the dial picks the fiber, the mass, and which field is live vs frozen scenery'

interface Glyph {
  t: string
  c: string
}

interface EqSpec {
  conn: string // color of the ' − iA' piece inside D
  mass: string // color of the ' − μ²' piece
  massAlpha: number // 1 when the mass term is in play, faint otherwise
  from: Glyph // the unknown before the swap (θ, amber)
  to: Glyph // the unknown after the swap (A, blue) — from === to in modes 1–3
  sub: string // the dial position's one-line reading
}

/**
 * ψtt = c²( ∂x − iA )²ψ − μ²ψ, drawn as colored segments; the unknown slots
 * crossfade from → to with swapT ∈ [0, 1] (mode 4's staged θ→A trade).
 */
function drawEqPane(ctx: CanvasRenderingContext2D, lane: Lane, spec: EqSpec, swapT: number): void {
  const yEq = lane.y0 + 26
  ctx.textAlign = 'left'
  const walk = (draw: boolean, startX: number): number => {
    let x = startX
    const main = (t: string, c: string, alpha = 1) => {
      ctx.font = EQ_FONT
      if (draw) {
        ctx.globalAlpha = alpha
        ctx.fillStyle = c
        ctx.fillText(t, x, yEq)
        ctx.globalAlpha = 1
      }
      x += ctx.measureText(t).width
    }
    const sub = (t: string, c: string) => {
      ctx.font = EQ_SUB_FONT
      if (draw) {
        ctx.fillStyle = c
        ctx.fillText(t, x, yEq + 5)
      }
      x += ctx.measureText(t).width
    }
    const slot = (alpha = 1) => {
      ctx.font = EQ_FONT
      const w = Math.max(ctx.measureText(spec.from.t).width, ctx.measureText(spec.to.t).width)
      if (draw) {
        ctx.globalAlpha = alpha * (1 - swapT)
        ctx.fillStyle = spec.from.c
        ctx.fillText(spec.from.t, x, yEq)
        ctx.globalAlpha = alpha * swapT
        ctx.fillStyle = spec.to.c
        ctx.fillText(spec.to.t, x, yEq)
        ctx.globalAlpha = 1
      }
      x += w
    }
    slot()
    sub('tt', INK)
    main(' = c²( ', INK)
    main('∂', INK)
    sub('x', INK)
    main(' − iA', spec.conn)
    main(' )² ', INK)
    slot()
    main('  − μ² ', spec.mass, spec.massAlpha)
    slot(spec.massAlpha)
    return x - startX
  }
  const total = walk(false, 0)
  const cx = (lane.x0 + lane.x1) / 2
  walk(true, cx - total / 2)

  ctx.textAlign = 'center'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillStyle = INK
  ctx.fillText(spec.sub, cx, yEq + 26)
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = SOFT
  ctx.fillText(FOOT1, cx, lane.y1 - 16)
  ctx.fillText(FOOT2, cx, lane.y1 - 4)
  ctx.textAlign = 'left'
}

// ---------------------------------------------------------------------------
// one handler per dial position — the thin dispatcher is CREATE below
// ---------------------------------------------------------------------------

const THETA_GLYPH: Glyph = { t: 'θ', c: PALETTE.theta }
const A_GLYPH: Glyph = { t: 'A', c: PALETTE.conn }

function createStringMachine(kn: Knobs): Stepper {
  // fiber = line, trivial connection: U ≡ 1, im ≡ 0 (and stays 0 exactly), μ = 0
  const s = makePsi(0, 0.3)
  const links = trivialLinks()
  const eq: EqSpec = {
    conn: FAINT,
    mass: FAINT,
    massAlpha: 0.35,
    from: THETA_GLYPH,
    to: THETA_GLYPH,
    sub: "fiber = line · trivial connection — lesson 01's string (and sound)",
  }
  return shell(kn, () => advanceCovariant(s, links, 0), (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const [fib, gr, eqLane] = laneSplit(w, h, LANE_FRACS)
    drawRailRow(ctx, fib, s.re)
    drawCurve(ctx, gr, s.re, PALETTE.theta, 'θ(x) — the section, one choice per line fiber')
    drawEqPane(ctx, eqLane, eq, 0)
  })
}

function createPhaseMachine(kn: Knobs): Stepper {
  // fiber = circle, A = 0: same kernel, complex data, live μ² — packets disperse
  const s = makePsi(K_CARRIER, 0.3)
  const links = trivialLinks()
  const mag = new Float32Array(GRID)
  const eq: EqSpec = {
    conn: FAINT,
    mass: INK,
    massAlpha: 1,
    from: THETA_GLYPH,
    to: THETA_GLYPH,
    sub: 'fiber = circle · A = 0 — free phase wave; μ² disperses packets (Klein–Gordon, not Schrödinger)',
  }
  return shell(kn, () => advanceCovariant(s, links, kn.m.current), (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const [fib, gr, eqLane] = laneSplit(w, h, LANE_FRACS)
    drawPhasorRow(ctx, fib, s.re, s.im)
    drawEnvelope(ctx, gr, s.re, s.im, mag)
    drawCurve(ctx, gr, s.re, PALETTE.theta, 'the phase wave — needle component (|amplitude| dashed)')
    drawEqPane(ctx, eqLane, eq, 0)
  })
}

function createChargedMachine(kn: Knobs): Stepper {
  // fiber = circle, frozen background A: link phases feed the SAME kernel; the
  // packet's local wavenumber shifts by A inside the bump — fringes slide (§9)
  const s = makePsi(K_CARRIER, 0.25)
  const { links, aBg } = bumpLinks()
  const mag = new Float32Array(GRID)
  const eq: EqSpec = {
    conn: PALETTE.conn,
    mass: INK,
    massAlpha: 1,
    from: THETA_GLYPH,
    to: THETA_GLYPH,
    sub: 'fiber = circle · frozen A(x) — the wave bends through the rule (§9 replayed)',
  }
  return shell(kn, () => advanceCovariant(s, links, kn.m.current), (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const [fib, gr, eqLane] = laneSplit(w, h, LANE_FRACS)
    drawPhasorRow(ctx, fib, s.re, s.im)
    drawFrozenA(ctx, gr, aBg)
    drawEnvelope(ctx, gr, s.re, s.im, mag)
    drawCurve(ctx, gr, s.re, PALETTE.theta, 'the charged wave — needle component')
    drawEqPane(ctx, eqLane, eq, 0)
  })
}

function lerpAmberBlue(t: number): string {
  const r = Math.round(AMBER_RGB[0] + (BLUE_RGB[0] - AMBER_RGB[0]) * t)
  const g = Math.round(AMBER_RGB[1] + (BLUE_RGB[1] - AMBER_RGB[1]) * t)
  const b = Math.round(AMBER_RGB[2] + (BLUE_RGB[2] - AMBER_RGB[2]) * t)
  return `rgb(${r},${g},${b})`
}

function createLightMachine(kn: Knobs): Stepper {
  // the fourth position is different in kind: no section left to wave — the
  // unknown IS the connection. lib/awave.ts owns the leapfrog (A_tt = c²A_xx,
  // its own fixed 1/240 step and Courant constant, stated in its header); the
  // staged amber→blue swap of the curve and the equation IS the thesis performed.
  const wave = createAWave(true)
  let sinceLaunch = 0
  let tLive = 0
  const eq: EqSpec = {
    conn: FAINT, // light is uncharged: the connection does not couple to itself
    mass: FAINT,
    massAlpha: 0.35,
    from: THETA_GLYPH,
    to: A_GLYPH,
    sub: 'the unknown is the connection itself — the medium is the wave',
  }
  const advance = () => {
    wave.step(FIXED_DT) // exactly one internal step per call (same fixed dt)
    sinceLaunch += FIXED_DT
    tLive += FIXED_DT
    if (sinceLaunch > RELAUNCH_SECONDS) {
      wave.pluck(0.15, 1) // absorbing ends drained the last pulse; send another
      sinceLaunch = 0
    }
  }
  return shell(kn, advance, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const swapT = Math.min(tLive / SWAP_SECONDS, 1)
    const [fib, gr, eqLane] = laneSplit(w, h, LANE_FRACS)
    drawTransportRow(ctx, fib, wave.a)
    drawCurve(ctx, gr, wave.a, lerpAmberBlue(swapT), 'A(x) — the connection, waving')
    drawEqPane(ctx, eqLane, eq, swapT)
  })
}

/** The dial, as code: a thin exhaustive dispatcher — one handler per position. */
const CREATE: Record<UWMMode, (kn: Knobs) => Stepper> = {
  string: createStringMachine,
  phase: createPhaseMachine,
  charged: createChargedMachine,
  light: createLightMachine,
}

// ---------------------------------------------------------------------------
// components — fig 61 (the dial) and figs 62–65 (frozen one-delta presets)
// ---------------------------------------------------------------------------

const SIM_HEIGHT = 380

/**
 * Fig 61 — the flagged finale: the mode dial plus two sliders (mass, time speed);
 * the only figure allowed more than one knob (PLAN §11 audit hooks).
 */
export function UniversalWaveMachine() {
  const [mode, setMode] = useState<UWMMode>('string')
  const [m, setM] = useState(0.18)
  const [speed, setSpeed] = useState(1)
  // mirror slider state into refs the running stepper reads (ViscosityDemo pattern)
  const mRef = useRef(m)
  mRef.current = m
  const speedRef = useRef(speed)
  speedRef.current = speed

  return (
    // key={mode}: turning the dial rebuilds the stepper via create — fresh state
    // per position, never a mutated hybrid (create = fresh state, AGENTS.md)
    <Sim
      key={mode}
      height={SIM_HEIGHT}
      create={() => CREATE[mode]({ m: mRef, speed: speedRef })}
    >
      <div className="sim-seg" style={{ marginLeft: 0 }}>
        {MODE_ORDER.map((mm) => (
          <button
            key={mm}
            type="button"
            className={mode === mm ? 'seg-active' : ''}
            onClick={() => setMode(mm)}
          >
            {MODE_LABEL[mm]}
          </button>
        ))}
      </div>
      <label className="sim-slider">
        <span>μ = 0</span>
        <input
          type="range"
          min={0}
          max={M_MAX}
          step={0.01}
          value={m}
          disabled={!MASS_ACTIVE[mode]}
          onChange={(e) => setM(Number(e.target.value))}
        />
        <span>heavy</span>
      </label>
      <label className="sim-slider" style={{ marginLeft: 0 }}>
        <span>slow</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}

// figs 62–65: each dial position frozen as its own figure — regular knob budget
// (one time-speed slider), mass pinned to a value that shows the stop's payoff
const PRESET_M: Record<UWMMode, number> = { string: 0, phase: 0.22, charged: 0.12, light: 0 }

export function UWMPreset({ mode }: { mode: UWMMode }) {
  const [speed, setSpeed] = useState(0.9)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const mRef = useRef(PRESET_M[mode]) // fixed per figure; mode prop is static

  return (
    <Sim height={SIM_HEIGHT} create={() => CREATE[mode]({ m: mRef, speed: speedRef })}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}
