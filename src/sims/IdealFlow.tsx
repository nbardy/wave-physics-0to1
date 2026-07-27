import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { potentialVelocity, surfaceCp, pressureDrag, pressureDragBySign } from './lib/potential'

// Lesson 03 §5 — d'Alembert's paradox. The ideal fluid of d'Alembert (1752) and
// Euler (1757) flows past a cylinder and exerts ZERO net drag, because the
// pressure field is fore-aft symmetric and its horizontal component integrates
// to nothing.
//
// PHYSICS HONESTY: the flow here is the closed-form potential-flow solution
// (uniform stream + doublet), from lib/potential.ts — see that file's header for
// why we use the analytic field rather than the numerical solver (so "0.000" is
// genuine cancellation, not a solver landing near zero). The markers are advected
// by that same analytic field purely for DISPLAY — they trace streamlines; they
// are not a fluid simulation and carry no forces. The drag meter reads the
// closed-form surface pressure through pressureDrag(); it COMPUTES the integral
// every frame, it does not assert the answer.
//
// SHOW THE CANCELLATION, DON'T CLAIM IT. A reader looked at an earlier version of
// this figure — bare "0.000" in a box — and asked "why isn't the disc getting
// pushed downstream?" Fair question: the figure was asserting the paradox instead
// of demonstrating it. So the surface load is now drawn (arrows along the normal
// at 28 rim stations, length ∝ |Cp|) and the meter reports the same integral in
// two signed piles — everything that pushes the disc downstream, everything that
// pulls it back — which cancel. It IS pushed downstream; it is pulled upstream by
// exactly as much. The eye can now check the books.

// Scene geometry (fractions of canvas). Cylinder sits left-of-center so there's
// room downstream to watch the streamlines rejoin with fore-aft symmetry.
const CX_FRAC = 0.32
const CY_FRAC = 0.5
const R_FRAC = 0.16 // radius as a fraction of height

const N_MARKERS = 90
const TRAIL = 14 // short ghost trail (samples)

// Fixed physics step, decoupled from RAF cadence. This sim has no numerical
// integrator with a stability bound — the velocity field is analytic and exact,
// evaluated pointwise — so "stability" here is just: advect markers with a small
// fixed dt and a bounded substep count so frame-rate never changes the picture.
const FIXED_DT = 1 / 120
const MAX_SUBSTEPS = 8

// Pressure colormap. We plot the pressure coefficient Cp = 1 − |u|²/U²
// (Bernoulli with ambient at the free stream), so the wash is DISPLAY-NORMALIZED
// by the current stream speed: the picture is identical at every slider position.
// That normalization is a display choice, not physics — the physical pressure
// really does grow like U².
//
// The two sides get their own saturation scale. Cp runs from +1 at the stagnation
// points to −3 at the shoulders, so one shared scale leaves the red lobes three
// times fainter than the cyan ones — and the fore-aft mirror symmetry of those
// red lobes is the entire argument of this figure, so it has to read at a glance.
// The wash therefore shows WHERE, not HOW MUCH; the arrows on the rim carry true
// magnitude, linear in |Cp| on one shared scale. (Cyan saturates at |Cp| = 2,
// short of its −3 extreme, so the shoulders read as a plateau rather than a thin
// hot ring right on the wall.)
interface Band {
  r: number
  g: number
  b: number
  /** Alpha at saturation. Tuning knob: raise for punch, lower if amber drowns. */
  alpha: number
  /** |Cp| at which this side saturates. */
  saturateAt: number
}
const BAND_HI: Band = { r: 0xdc, g: 0x26, b: 0x26, alpha: 0.55, saturateAt: 1 } // PALETTE.pHi
const BAND_LO: Band = { r: 0x08, g: 0x91, b: 0xb2, alpha: 0.45, saturateAt: 2 } // PALETTE.pLo
const PMAP_GAMMA = 0.6 // <1 fattens the lobes; amber markers still read on top
const PMAP_NX = 96
const PMAP_NY = 42

// Surface-load arrows: 28 stations, i·2π/28, which lands exactly on the nose, the
// tail and both shoulders — so the fore-aft mirror is exact in the picture too.
const N_ARROWS = 28
const CP_EXTREME = 3 // max |Cp| on the surface (the shoulders, θ = ±90°)
const ARROW_MAX_FRAC = 0.62 // longest arrow, as a fraction of R

/**
 * How a surface station is drawn. Two kinds, dispatched on the sign of Cp:
 * pressure above ambient PRESSES along the inward normal, below ambient SUCKS
 * along the outward normal. Both arrows live outside the disc so the fill can't
 * hide them; `tailOut`/`tipOut` are multiples of the arrow length along n̂.
 */
interface Load {
  color: string
  tailOut: number
  tipOut: number
}
const PRESS: Load = { color: PALETTE.pHi, tailOut: 1, tipOut: 0 } // outside → rim
const SUCTION: Load = { color: PALETTE.pLo, tailOut: 0, tipOut: 1 } // rim → outside

interface Scene {
  cx: number
  cy: number
  R: number
}

function sceneOf(w: number, h: number): Scene {
  return { cx: CX_FRAC * w, cy: CY_FRAC * h, R: R_FRAC * h }
}

// mulberry32 — deterministic scatter so Reset reproduces the exact figure.
function makeRand(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let z = Math.imul(s ^ (s >>> 15), 1 | s)
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

function createIdealFlow(uRef: { current: number }, width: number, height: number): Stepper {
  const scene = sceneOf(width, height)
  const rand = makeRand(0x1d3a1)

  // marker positions in pixels, plus a ring-buffer trail per marker
  const xs = new Float32Array(N_MARKERS)
  const ys = new Float32Array(N_MARKERS)
  const trail = new Float32Array(N_MARKERS * TRAIL * 2)
  let head = 0

  const insideDisc = (x: number, y: number) => {
    const dx = x - scene.cx
    const dy = y - scene.cy
    return dx * dx + dy * dy < scene.R * scene.R * 1.02
  }

  const spawn = (i: number, xPix: number) => {
    // scatter across the full height; nudge markers that land inside the disc
    // out to the inflow edge so we never seed a marker in the solid.
    let x = xPix
    let y = rand() * height
    while (insideDisc(x, y)) y = rand() * height
    xs[i] = x
    ys[i] = y
    for (let k = 0; k < TRAIL; k++) {
      trail[(i * TRAIL + k) * 2] = x
      trail[(i * TRAIL + k) * 2 + 1] = y
    }
  }

  for (let i = 0; i < N_MARKERS; i++) spawn(i, rand() * width)

  // Pressure colormap into a low-res offscreen canvas, redrawn each frame (U changes).
  const off = document.createElement('canvas')
  off.width = PMAP_NX
  off.height = PMAP_NY
  const offCtx = off.getContext('2d')
  const img = offCtx ? offCtx.createImageData(PMAP_NX, PMAP_NY) : null

  let acc = 0

  const advance = (dt: number) => {
    const U = uRef.current
    head = (head + 1) % TRAIL
    for (let i = 0; i < N_MARKERS; i++) {
      // RK2 (midpoint) in the analytic field — display advection only.
      const v1 = potentialVelocity(xs[i], ys[i], scene.cx, scene.cy, scene.R, U)
      const mx = xs[i] + v1.x * dt * 0.5
      const my = ys[i] + v1.y * dt * 0.5
      const v2 = potentialVelocity(mx, my, scene.cx, scene.cy, scene.R, U)
      xs[i] += v2.x * dt
      ys[i] += v2.y * dt

      // respawn on exit at the right (or top/bottom drift-out) from the left edge
      if (xs[i] > width + 4 || xs[i] < -4 || ys[i] > height + 4 || ys[i] < -4) {
        spawn(i, -2)
      }
      trail[(i * TRAIL + head) * 2] = xs[i]
      trail[(i * TRAIL + head) * 2 + 1] = ys[i]
    }
  }

  const drawPressure = (ctx: CanvasRenderingContext2D) => {
    if (!offCtx || !img) return
    const U = uRef.current
    const denom = Math.max(U * U, 1e-6)
    const d = img.data
    for (let j = 0; j < PMAP_NY; j++) {
      for (let i = 0; i < PMAP_NX; i++) {
        const x = ((i + 0.5) / PMAP_NX) * width
        const y = ((j + 0.5) / PMAP_NY) * height
        const k = (j * PMAP_NX + i) * 4
        const dx = x - scene.cx
        const dy = y - scene.cy
        if (dx * dx + dy * dy < scene.R * scene.R) {
          d[k + 3] = 0 // transparent over the solid disc
          continue
        }
        const v = potentialVelocity(x, y, scene.cx, scene.cy, scene.R, U)
        const speed2 = v.x * v.x + v.y * v.y
        // Cp = 1 − (|u|/U)²: +1 at full stagnation, negative where the flow is fast.
        const cp = 1 - speed2 / denom
        const band = cp >= 0 ? BAND_HI : BAND_LO
        const mag = Math.pow(Math.min(Math.abs(cp) / band.saturateAt, 1), PMAP_GAMMA)
        d[k] = band.r
        d[k + 1] = band.g
        d[k + 2] = band.b
        d[k + 3] = Math.round(mag * band.alpha * 255)
      }
    }
    offCtx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(off, 0, 0, width, height)
  }

  // THE SURFACE LOAD, DRAWN. One arrow per rim station, along the normal, length
  // ∝ |Cp| on one shared scale. Note what the reader gets to SEE: five red arrows
  // shoving the nose downstream, five mirror-image red arrows shoving the tail
  // upstream, and cyan suction fanning off both shoulders — every arrow paired
  // with its reflection across the vertical mid-line. Non-interactive: the arrows
  // depend only on θ, and Cp is independent of U, so the slider never moves them.
  const drawSurfaceLoad = (ctx: CanvasRenderingContext2D) => {
    const maxLen = ARROW_MAX_FRAC * scene.R
    ctx.save()
    ctx.lineWidth = 1.6
    ctx.lineCap = 'round'
    for (let i = 0; i < N_ARROWS; i++) {
      const theta = (i / N_ARROWS) * Math.PI * 2
      const cp = surfaceCp(theta)
      const load = cp >= 0 ? PRESS : SUCTION
      const len = (Math.abs(cp) / CP_EXTREME) * maxLen
      if (len < 1) continue // a sub-pixel arrow is a smudge, not a reading
      const nx = Math.cos(theta)
      const ny = Math.sin(theta)
      const rimX = scene.cx + scene.R * nx
      const rimY = scene.cy + scene.R * ny
      drawArrow(
        ctx,
        rimX + nx * len * load.tailOut,
        rimY + ny * len * load.tailOut,
        rimX + nx * len * load.tipOut,
        rimY + ny * len * load.tipOut,
        load.color,
      )
    }
    ctx.restore()
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < MAX_SUBSTEPS) {
        advance(FIXED_DT)
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)

      drawPressure(ctx)

      // the solid cylinder
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.arc(scene.cx, scene.cy, scene.R, 0, Math.PI * 2)
      ctx.fill()

      // amber markers with short ghost trails
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 1
      for (let i = 0; i < N_MARKERS; i++) {
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        let started = false
        for (let kk = 1; kk < TRAIL; kk++) {
          const idx = (i * TRAIL + ((head + kk) % TRAIL)) * 2
          const tx = trail[idx]
          const ty = trail[idx + 1]
          if (!started) {
            ctx.moveTo(tx, ty)
            started = true
          } else ctx.lineTo(tx, ty)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = PALETTE.dye
      for (let i = 0; i < N_MARKERS; i++) {
        ctx.beginPath()
        ctx.arc(xs[i], ys[i], 2.3, 0, Math.PI * 2)
        ctx.fill()
      }

      drawSurfaceLoad(ctx)

      // THE DRAG METER. Computed every frame from the closed-form surface
      // pressure (Cp = 1 − 4 sin²θ) via pressureDrag() — it integrates
      // −∮ p cosθ R dθ, which cancels to ~0 for this fore-aft-symmetric field.
      // The meter COMPUTES; it never asserts. Feed pressureDrag a lopsided
      // pressure sampler and it would read nonzero.
      //
      // THE SPLIT. The rim is partitioned by the SIGN of each station's own
      // streamwise load, not by geometry: every station lands in exactly one
      // bucket, so `downstream` is the whole of what shoves the disc along and
      // `upstream` the whole of what holds it back. `net` is NOT their sum — it is
      // pressureDrag() over the full circle, computed independently, so the fact
      // that the rows reconcile is arithmetic rather than construction. Break the
      // symmetry of `surfaceCp` and the three rows will disagree loudly.
      //
      // WHY BY SIGN AND NOT BY FACE (posterity — do not "restore" a front/back
      // split without reading this). Splitting the rim into the upstream and
      // downstream HALVES gives front = −1/3, back = +1/3 after the ÷2R below:
      // the upstream half is on balance sucked UPSTREAM. That is not a sign bug.
      // ∫_{π/2}^{3π/2} −(1−4sin²θ) cos θ dθ = −2/3 exactly, and the arrows show
      // why — the nose cap only reaches Cp = +1 over ±30°, the upstream shoulders
      // reach Cp = −3, and the suction beats the cap. True, and confusing enough
      // to cost a paragraph of defence. The sign partition answers the reader's
      // actual question instead: it IS pushed downstream, by exactly as much as it
      // is pulled back.
      const cpAt = (theta: number) => surfaceCp(theta)
      const { downstream, upstream } = pressureDragBySign(cpAt, scene.R, SIGN_SAMPLES)
      const net = pressureDrag(cpAt, scene.R, SIGN_SAMPLES)
      drawDragMeter(ctx, w, downstream, upstream, net, scene.R)
    },
  }
}

// A single arrow: shaft plus a two-stroke head at the tip.
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const head = Math.min(5, len * 0.55)
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * (ux * 0.87 - uy * 0.5), y1 - head * (uy * 0.87 + ux * 0.5))
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * (ux * 0.87 + uy * 0.5), y1 - head * (uy * 0.87 - ux * 0.5))
  ctx.stroke()
}

// The drag meter — same furniture as CorpuscleHail.tsx so the two figures read as
// siblings: rounded rect, sepia border/label, monospace value. This one is taller
// because it shows its working: the two signed halves of the load, and their sum.
const SEPIA = '#78716c' // lesson-03 history-furniture color (nameplates, meters)
// Fine enough that the four Cp sign changes (|sin θ| = 1/2) land accurately: the
// cells straddling them are ~0.7° wide and their integrand is ~0 there anyway.
const SIGN_SAMPLES = 512
const BAR_PX_PER_UNIT = 52 // balance bars: display units → pixels (±1.000 → 52px)

// Signed to three decimals, because in this figure the sign is the whole point:
// the reader has to see one push against the other. Two wrinkles.
// (1) toFixed(3) renders −1e-15 as "-0.000": the rounded number is zero and the
//     minus is an artifact of signed floats, so a value that rounds to zero
//     prints unsigned. Not a clamp — anything reaching ±0.001 keeps its sign.
// (2) the unsigned zero gets a leading space so the digits stay column-aligned
//     under the right-aligned monospace of the signed rows.
function fmt3(v: number): string {
  const s = v.toFixed(3)
  if (s === '-0.000' || s === '0.000') return ' 0.000'
  return v > 0 ? `+${s}` : s
}

function drawDragMeter(
  ctx: CanvasRenderingContext2D,
  w: number,
  downstream: number,
  upstream: number,
  net: number,
  R: number,
) {
  const bw = 152
  const bh = 106
  const bx = w - bw - 12
  const by = 12
  const r = 8

  // Report per unit frontal width (2R) so the reading is a drag coefficient and
  // doesn't drift when the canvas resizes. Display scaling only — it multiplies
  // all three rows alike and so cannot manufacture the cancellation.
  const scale = 1 / (2 * R)
  const f = downstream * scale
  const b = upstream * scale
  const n = net * scale

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
  ctx.arcTo(bx, by + bh, bx, by, r)
  ctx.arcTo(bx, by, bx + bw, by, r)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()
  ctx.strokeStyle = SEPIA
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = SEPIA
  ctx.font = '600 10px ui-sans-serif, system-ui'
  ctx.fillText('drag', bx + 12, by + 16)
  ctx.textAlign = 'right'
  ctx.font = '9px ui-sans-serif, system-ui'
  ctx.fillText('÷ 2R', bx + bw - 12, by + 16)

  // everything that pushes, then everything that pulls
  ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillStyle = '#17191d'
  ctx.fillText(fmt3(f), bx + bw - 12, by + 36)
  ctx.fillText(fmt3(b), bx + bw - 12, by + 54)
  ctx.textAlign = 'left'
  ctx.fillStyle = SEPIA
  ctx.font = '600 10px ui-sans-serif, system-ui'
  ctx.fillText('downstream', bx + 12, by + 36)
  ctx.fillText('upstream', bx + 12, by + 54)

  // Balance bars: each bucket drawn from a common centre line, signed —
  // rightward is downstream. Equal lengths, opposite directions, no digits needed.
  const mid = bx + bw / 2
  const maxHalf = bw / 2 - 14
  const barOf = (v: number) => Math.max(Math.min(v * BAR_PX_PER_UNIT, maxHalf), -maxHalf)
  ctx.fillStyle = PALETTE.pHi
  ctx.fillRect(mid, by + 62, barOf(f), 4)
  ctx.fillRect(mid, by + 69, barOf(b), 4)
  ctx.strokeStyle = SEPIA
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(mid + 0.5, by + 60)
  ctx.lineTo(mid + 0.5, by + 75)
  ctx.stroke()

  // hairline rule, then the sum
  ctx.beginPath()
  ctx.moveTo(bx + 12, by + 81.5)
  ctx.lineTo(bx + bw - 12, by + 81.5)
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.fillStyle = SEPIA
  ctx.fillText('net', bx + 12, by + 98)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#17191d'
  ctx.font = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillText(fmt3(n), bx + bw - 12, by + 98)
  ctx.restore()
}

export function IdealFlow() {
  const [u, setU] = useState(70)
  const uRef = useRef(u)
  uRef.current = u

  return (
    <Sim height={260} create={(w, h) => createIdealFlow(uRef, w, h)}>
      <label className="sim-slider">
        <span>stream speed</span>
        <input
          type="range"
          min={20}
          max={140}
          step={1}
          value={u}
          onChange={(e) => setU(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
