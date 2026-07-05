import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { laneSplit, type Lane } from './lib/clocks'

// The Aharonov–Bohm two-path toy — fig 2 (planted, §1) and its §9 redemptions
// (figs 49–50). One component, three configs via the `mode` prop:
//   'plant'    — §1's fig 2: a beam split along two paths around a sealed core,
//                a screen where the arrivals land as stripes, and one dial on
//                the sealed core. Operational labels only — the words electron,
//                interference, flux, and phase are reserved for §9.
//   'revealed' — §9's fig 49: the identical figure with overlays unlocked — the
//                holonomy meter (the two arriving needles), the circulating-A
//                arrows with F confined inside the core, and the fringe-shift-
//                vs-enclosed-flux readout pane, axis in units of h/e.
//   'tonomura' — §9's fig 50: one overlay delta — the core drawn as a
//                superconducting torus; the dial's step pins the flux to
//                multiples of h/2e, so the fringes sit displaced by exactly
//                half a period at the odd stops.
//
// HONESTY (the AB-toy confession, per PLAN §Production): this is phasor
// arithmetic — the two path phases are added; it is not a Schrödinger solver.
// The fringe shift is exact anyway, which is itself the point: only the loop
// integral ∮A matters. The figure computes the closed-form answer
//   I(y) ∝ 1 + cos(Δφ_geom(y) + 2π·Φ/Φ₀),   Φ₀ = h/e ≈ 4.14×10⁻¹⁵ Wb,
// so nothing dynamical is faked and there is no integrator — the honesty
// rules' stability clause is satisfied vacuously. Fringes move only because
// the dial does. The only time-dependence is decorative pacing (the marching
// beam dashes) plus the arrival sampler, which draws landing dots from the
// exact I(y) on a fixed timestep.
//
// VISUAL GAIN FACTORS, confessed: fringe spacing and the envelope are drawn
// for legibility and are wildly not to scale (real AB fringes are microns
// across centimeters); the dash speed is pacing, not a propagation speed.

export type ABMode = 'plant' | 'revealed' | 'tonomura'

const PHI_MAX = 3 // dial range, in units of Φ₀ = h/e
const NF = 6 // fringes across the screen — legibility, not scale (confessed above)
const ENV_SIGMA = 0.2 // envelope half-width as a fraction of the screen — same confession

// Fixed sampling step for the arrival dots — arrivals per second must not
// depend on RAF cadence (house rule), even though no PDE is being stepped.
const FIXED_DT = 1 / 120
const ARRIVAL_RATE = 90 // landings per second
const ARRIVAL_LIFE = 2.2 // seconds a landed dot stays visible
const MAX_ARRIVALS = 260

// Tonomura's superconducting sheath traps flux only in units of h/2e
// (≈ 2.07×10⁻¹⁵ Wb) — half the AB period. The dial's step = 0.5 (in h/e
// units) pins the flux by construction; no runtime snapping anywhere.
const TONOMURA_STOPS = [0, 0.5, 1, 1.5, 2, 2.5, 3]

/** Exact two-path fringe intensity at fractional screen position fy ∈ [0,1].
 *  Δφ_geom is linear in fy (small-angle two-path geometry), the flux enters
 *  only through the loop term 2π·Φ/Φ₀ — continuous in Φ, period exactly h/e. */
function intensity(fy: number, phi: number): number {
  const d = fy - 0.5
  const env = Math.exp(-(d * d) / (2 * ENV_SIGMA * ENV_SIGMA))
  return env * 0.5 * (1 + Math.cos(2 * Math.PI * (NF * d + phi)))
}

/** Canvas geometry of the apparatus, derived fresh each draw from its lane. */
interface Geom {
  lane: Lane
  cx: number
  cy: number
  rCore: number
  srcX: number
  srcY: number
  screenX: number
  stripW: number
  sy0: number
  sy1: number
}

function apparatusGeom(lane: Lane): Geom {
  const cy = (lane.y0 + lane.y1) / 2
  const laneH = lane.y1 - lane.y0
  return {
    lane,
    cx: lane.x0 + (lane.x1 - lane.x0) * 0.44,
    cy,
    rCore: Math.min(laneH * 0.17, 30),
    srcX: lane.x0 + 10,
    srcY: cy,
    screenX: lane.x1 - 26,
    stripW: 14,
    sy0: lane.y0 + 18,
    sy1: lane.y1 - 20,
  }
}

interface ABConfig {
  height: number
  fracs: number[] // lane fractions: [apparatus] or [apparatus, readout]
  dial: { step: number; left: string; right: string }
  coreLabel: string
  screenLabel: string
  hint: string
  drawCore: (ctx: CanvasRenderingContext2D, g: Geom) => void
  drawOverlays: (ctx: CanvasRenderingContext2D, lanes: Lane[], g: Geom, phi: number) => void
}

// ---------------------------------------------------------------- drawing kit

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
): void {
  const len = Math.hypot(dx, dy)
  if (len < 1.5) return
  const ux = dx / len
  const uy = dy / len
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + dx, y + dy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + dx + ux * 4, y + dy + uy * 4)
  ctx.lineTo(x + dx - uy * 2.6, y + dy + ux * 2.6)
  ctx.lineTo(x + dx + uy * 2.6, y + dy - ux * 2.6)
  ctx.closePath()
  ctx.fill()
}

function drawPaths(ctx: CanvasRenderingContext2D, g: Geom, t: number): void {
  const endX = g.screenX - 2
  for (const s of [-1, 1]) {
    const by = g.cy + s * g.rCore * 2.3
    ctx.strokeStyle = 'rgba(217,119,6,0.55)' // θ-amber: the thing that travels
    ctx.lineWidth = 1.8
    ctx.setLineDash([3, 7])
    ctx.lineDashOffset = -t * 26 // marching dashes — pacing only, confessed above
    ctx.beginPath()
    ctx.moveTo(g.srcX, g.srcY)
    ctx.bezierCurveTo(
      g.cx - (g.cx - g.srcX) * 0.4,
      by,
      g.cx + (endX - g.cx) * 0.4,
      by,
      endX,
      g.cy,
    )
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.fillStyle = PALETTE.theta
  ctx.beginPath()
  ctx.arc(g.srcX, g.srcY, 4, 0, Math.PI * 2)
  ctx.fill()
}

interface Arrival {
  fy: number // fractional landing height on the screen
  jx: number // fractional jitter across the strip
  age: number
}

function drawScreen(
  ctx: CanvasRenderingContext2D,
  g: Geom,
  phi: number,
  arrivals: readonly Arrival[],
): void {
  const hpx = g.sy1 - g.sy0
  ctx.fillStyle = 'rgba(107,114,128,0.08)'
  ctx.fillRect(g.screenX, g.sy0, g.stripW, hpx)
  // the long-run record: one scanline per pixel, alpha ∝ the exact I(y)
  for (let py = 0; py < hpx; py++) {
    const I = intensity(py / hpx, phi)
    if (I < 0.02) continue
    ctx.fillStyle = `rgba(217,119,6,${(I * 0.85).toFixed(3)})`
    ctx.fillRect(g.screenX, g.sy0 + py, g.stripW, 1)
  }
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.2
  ctx.strokeRect(g.screenX, g.sy0, g.stripW, hpx)
  // the arrivals: dots sampled from the same I(y), fading with age
  for (const a of arrivals) {
    const alpha = Math.max(0, 1 - a.age / ARRIVAL_LIFE) * 0.85
    ctx.fillStyle = `rgba(31,41,55,${alpha.toFixed(3)})`
    ctx.beginPath()
    ctx.arc(g.screenX + 2 + a.jx * (g.stripW - 4), g.sy0 + a.fy * hpx, 1.7, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawDiskCore(ctx: CanvasRenderingContext2D, g: Geom): void {
  const { cx, cy, rCore: r } = g
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = 'rgba(107,114,128,0.15)'
  ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r)
  ctx.strokeStyle = 'rgba(107,114,128,0.35)'
  ctx.lineWidth = 1
  for (let d = -2 * r; d <= 2 * r; d += 8) {
    ctx.beginPath()
    ctx.moveTo(cx + d - r, cy + r)
    ctx.lineTo(cx + d + r, cy - r)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

function drawTorusCore(ctx: CanvasRenderingContext2D, g: Geom): void {
  const { cx, cy, rCore: r } = g
  const ri = r * 0.55
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.arc(cx, cy, ri, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(107,114,128,0.22)'
  ctx.fill('evenodd')
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, ri, 0, Math.PI * 2)
  ctx.stroke()
}

/** The one dial on the sealed core — the figure's single knob, drawn in place. */
function drawDial(ctx: CanvasRenderingContext2D, g: Geom, phi: number): void {
  const r = g.rCore * 0.42
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // reference tick at the dial's zero
  ctx.beginPath()
  ctx.moveTo(g.cx, g.cy - r)
  ctx.lineTo(g.cx, g.cy - r - 4)
  ctx.stroke()
  const a = -Math.PI / 2 + (phi / PHI_MAX) * 1.5 * Math.PI
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(g.cx, g.cy)
  ctx.lineTo(g.cx + Math.cos(a) * r * 0.8, g.cy + Math.sin(a) * r * 0.8)
  ctx.stroke()
}

function drawLabels(ctx: CanvasRenderingContext2D, g: Geom, cfg: ABConfig): void {
  ctx.fillStyle = '#55606f'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(cfg.hint, g.lane.x0, g.lane.y0 + 10)
  ctx.textAlign = 'center'
  ctx.fillText(cfg.coreLabel, g.cx, g.lane.y1 - 2)
  ctx.textAlign = 'right'
  ctx.fillText(cfg.screenLabel, g.lane.x1, g.lane.y1 - 2)
  ctx.textAlign = 'left'
}

// ------------------------------------------------------------------- overlays

/** F confined inside the disk core — the violet fill grows with the dial. */
function shadeDiskFlux(ctx: CanvasRenderingContext2D, g: Geom, phi: number): void {
  ctx.fillStyle = `rgba(124,58,237,${(0.3 * Math.min(Math.abs(phi), 1)).toFixed(3)})`
  ctx.beginPath()
  ctx.arc(g.cx, g.cy, g.rCore, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PALETTE.curv
  ctx.font = 'bold 12px system-ui, sans-serif'
  ctx.fillText('F', g.cx - g.rCore * 0.62, g.cy - g.rCore * 0.42)
}

/** F trapped in the superconducting ring itself — the annulus, not the hole. */
function shadeTorusFlux(ctx: CanvasRenderingContext2D, g: Geom, phi: number): void {
  ctx.beginPath()
  ctx.arc(g.cx, g.cy, g.rCore, 0, Math.PI * 2)
  ctx.arc(g.cx, g.cy, g.rCore * 0.55, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(124,58,237,${(0.3 * Math.min(Math.abs(phi), 1)).toFixed(3)})`
  ctx.fill('evenodd')
  ctx.fillStyle = PALETTE.curv
  ctx.font = 'bold 12px system-ui, sans-serif'
  ctx.fillText('F', g.cx - 4, g.cy - g.rCore * 0.7)
}

/** Circulating-A arrows outside the core; the outer ring is shorter — A ∝ 1/r. */
function drawAArrows(ctx: CanvasRenderingContext2D, g: Geom, phi: number): void {
  const mag = Math.min(Math.abs(phi) / PHI_MAX, 1)
  const dir = phi >= 0 ? 1 : -1
  for (const [rr, scale] of [
    [1.7, 1],
    [2.45, 0.7],
  ] as const) {
    const R = g.rCore * rr
    const L = 16 * mag * scale
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const px = g.cx + Math.cos(a) * R
      const py = g.cy + Math.sin(a) * R
      // tangent (sin a, −cos a): counterclockwise on screen for Φ > 0
      const tx = Math.sin(a) * dir
      const ty = -Math.cos(a) * dir
      drawArrow(ctx, px - (tx * L) / 2, py - (ty * L) / 2, tx * L, ty * L, PALETTE.conn)
    }
  }
  ctx.fillStyle = PALETTE.conn
  ctx.font = 'bold 12px system-ui, sans-serif'
  const la = -0.9
  ctx.fillText('A', g.cx + Math.cos(la) * g.rCore * 2.1 + 8, g.cy + Math.sin(la) * g.rCore * 2.1)
}

/** The holonomy meter — the loan repaid via two added clock needles: the two
 *  arriving needles, whose misalignment is exactly the loop holonomy 2π·Φ/Φ₀. */
function drawHolonomyMeter(ctx: CanvasRenderingContext2D, g: Geom, phi: number): void {
  const mx = g.lane.x0 + 34
  const my = g.lane.y0 + 36
  const r = 22
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(mx, my, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  const hol = 2 * Math.PI * phi
  // the violet holonomy arc between the two needles (whole turns read as a
  // full circle here; the text below carries the turn count)
  ctx.strokeStyle = PALETTE.curv
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(mx, my, r * 0.55, -Math.PI / 2 - hol, -Math.PI / 2, false)
  ctx.stroke()
  // needle from the over-path (the reference) — solid
  ctx.strokeStyle = PALETTE.theta
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(mx, my)
  ctx.lineTo(mx, my - r * 0.85)
  ctx.stroke()
  // needle from the under-path — dashed, rotated by the holonomy
  const a2 = -Math.PI / 2 - hol
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(mx, my)
  ctx.lineTo(mx + Math.cos(a2) * r * 0.85, my + Math.sin(a2) * r * 0.85)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#55606f'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('the two arriving needles', mx + r + 8, my - 4)
  ctx.fillStyle = PALETTE.curv
  ctx.fillText(`∮A = ${phi.toFixed(2)} × 2π`, mx + r + 8, my + 12)
}

/** The fringe-shift-vs-enclosed-flux readout pane. The response line is
 *  CONTINUOUS in flux by figure-spec constraint — NOT a staircase; steps
 *  would be superconducting flux quantization, a different phenomenon.
 *  In the Tonomura config the *knob* is pinned to h/2e stops (hollow dots),
 *  but the line stays linear: the pinning lives in the dial, not the physics. */
function drawReadout(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  phi: number,
  stops: readonly number[],
  note: string,
): void {
  const px0 = lane.x0 + 46
  const px1 = lane.x1 - 14
  const py0 = lane.y0 + 12
  const py1 = lane.y1 - 26
  const X = (v: number) => px0 + (v / PHI_MAX) * (px1 - px0)
  const Y = (v: number) => py1 - (v / PHI_MAX) * (py1 - py0)
  ctx.strokeStyle = 'rgba(107,114,128,0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px0, py0)
  ctx.lineTo(px0, py1)
  ctx.lineTo(px1, py1)
  ctx.stroke()
  ctx.fillStyle = '#55606f'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (const v of [1, 2, 3]) {
    ctx.beginPath()
    ctx.moveTo(X(v), py1)
    ctx.lineTo(X(v), py1 + 4)
    ctx.stroke()
    ctx.fillText(String(v), X(v), py1 + 15)
  }
  ctx.textAlign = 'right'
  for (const v of [1, 2, 3]) {
    ctx.beginPath()
    ctx.moveTo(px0 - 4, Y(v))
    ctx.lineTo(px0, Y(v))
    ctx.stroke()
    ctx.fillText(String(v), px0 - 7, Y(v) + 4)
  }
  ctx.textAlign = 'center'
  ctx.fillText('enclosed flux Φ  (units of h/e ≈ 4.14×10⁻¹⁵ Wb)', (px0 + px1) / 2, lane.y1 - 6)
  ctx.textAlign = 'left'
  ctx.fillText('fringe shift (whole fringes)', px0 + 6, py0 + 4)
  // the linear response — slides continuously, recurs exactly once per h/e
  ctx.strokeStyle = PALETTE.theta
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(X(0), Y(0))
  ctx.lineTo(X(PHI_MAX), Y(PHI_MAX))
  ctx.stroke()
  // Tonomura's accessible stops: multiples of h/2e on the same continuous line
  ctx.strokeStyle = PALETTE.curv
  ctx.lineWidth = 1.4
  for (const s of stops) {
    ctx.beginPath()
    ctx.arc(X(s), Y(s), 3, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = PALETTE.curv
  ctx.beginPath()
  ctx.arc(X(phi), Y(phi), 4.5, 0, Math.PI * 2)
  ctx.fill()
  if (note) {
    ctx.textAlign = 'right'
    ctx.fillText(note, px1, py0 + 4)
    ctx.textAlign = 'left'
  }
}

function noOverlays(): void {
  /* the plant keeps its secrets — §9 unlocks them on the same component */
}

function overlaysRevealed(
  ctx: CanvasRenderingContext2D,
  lanes: Lane[],
  g: Geom,
  phi: number,
): void {
  shadeDiskFlux(ctx, g, phi)
  drawAArrows(ctx, g, phi)
  drawHolonomyMeter(ctx, g, phi)
  drawReadout(ctx, lanes[1], phi, [], '')
}

function overlaysTonomura(
  ctx: CanvasRenderingContext2D,
  lanes: Lane[],
  g: Geom,
  phi: number,
): void {
  shadeTorusFlux(ctx, g, phi)
  drawAArrows(ctx, g, phi)
  drawHolonomyMeter(ctx, g, phi)
  drawReadout(ctx, lanes[1], phi, TONOMURA_STOPS, 'flux pinned to n·h/2e ≈ n·2.07×10⁻¹⁵ Wb')
}

// -------------------------------------------------------------------- configs

const CONFIGS: Record<ABMode, ABConfig> = {
  plant: {
    height: 280,
    fracs: [1],
    // §1 contract: no numbers, no jargon — the knob is just the dial
    dial: { step: 0.01, left: 'the dial on the sealed core', right: '' },
    coreLabel: 'sealed core',
    screenLabel: 'where arrivals land',
    hint: 'turn the dial — the stripes slide, yet nothing touches either path',
    drawCore: drawDiskCore,
    drawOverlays: noOverlays,
  },
  revealed: {
    height: 400,
    fracs: [0.64, 0.36],
    dial: { step: 0.01, left: 'Φ = 0', right: 'Φ = 3·h/e' },
    coreLabel: 'flux Φ sealed inside',
    screenLabel: 'electrons land here',
    hint: '',
    drawCore: drawDiskCore,
    drawOverlays: overlaysRevealed,
  },
  tonomura: {
    height: 400,
    fracs: [0.64, 0.36],
    // step = 0.5·(h/e) = h/2e: the superconductor's own flux quantum — the
    // dial is pinned by construction, so odd stops shift by exactly half a fringe
    dial: { step: 0.5, left: 'Φ = 0', right: 'Φ = 3·h/e' },
    coreLabel: 'superconducting torus',
    screenLabel: 'electrons land here',
    hint: '',
    drawCore: drawTorusCore,
    drawOverlays: overlaysTonomura,
  },
}

// -------------------------------------------------------------------- stepper

function createAB(cfg: ABConfig, phiRef: { current: number }): Stepper {
  let t = 0 // pacing clock for the marching dashes
  let acc = 0
  let spawnCarry = 0
  const arrivals: Arrival[] = [] // fresh on create — Reset clears the record

  const sampleArrival = (phi: number) => {
    // rejection sampling from the exact I(y); peak intensity ≤ 1 so the
    // acceptance test needs no normalization. 16 misses ⇒ skip this arrival
    // (thins the beam slightly; never biases where the dots land).
    for (let tries = 0; tries < 16; tries++) {
      const fy = Math.random()
      if (Math.random() < intensity(fy, phi)) {
        arrivals.push({ fy, jx: Math.random(), age: 0 })
        return
      }
    }
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        t += FIXED_DT
        spawnCarry += ARRIVAL_RATE * FIXED_DT
        while (spawnCarry >= 1) {
          sampleArrival(phiRef.current)
          spawnCarry -= 1
        }
        for (const a of arrivals) a.age += FIXED_DT
        while (arrivals.length > 0 && arrivals[0].age > ARRIVAL_LIFE) arrivals.shift()
        if (arrivals.length > MAX_ARRIVALS) arrivals.splice(0, arrivals.length - MAX_ARRIVALS)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const lanes = laneSplit(w, h, cfg.fracs)
      const g = apparatusGeom(lanes[0])
      const phi = phiRef.current
      drawPaths(ctx, g, t)
      drawScreen(ctx, g, phi, arrivals)
      cfg.drawCore(ctx, g)
      cfg.drawOverlays(ctx, lanes, g, phi)
      drawDial(ctx, g, phi) // after overlays: the dial sits on top of the flux shading
      drawLabels(ctx, g, cfg)
    },
  }
}

// ------------------------------------------------------------------ component

export function ABInterference({ mode }: { mode: ABMode }) {
  const cfg = CONFIGS[mode]
  const [phi, setPhi] = useState(0)
  // mirror the dial into a ref so the running stepper reads the live value
  const phiRef = useRef(phi)
  phiRef.current = phi

  return (
    <Sim height={cfg.height} create={() => createAB(cfg, phiRef)}>
      <label className="sim-slider">
        <span>{cfg.dial.left}</span>
        <input
          type="range"
          min={0}
          max={PHI_MAX}
          step={cfg.dial.step}
          value={phi}
          onChange={(e) => setPhi(Number(e.target.value))}
        />
        <span>{cfg.dial.right}</span>
      </label>
    </Sim>
  )
}
