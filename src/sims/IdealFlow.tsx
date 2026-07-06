import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { potentialVelocity, surfaceCp, pressureDrag } from './lib/potential'

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

// Pressure colormap: p ∝ (U² − |u|²)/2 (Bernoulli, ambient at the free stream).
// We normalize by U² so the map's saturation is roughly speed-independent; the
// stagnation points read pHi (p above ambient) and the shoulders read pLo (p
// below ambient, where the flow speeds up over the top and bottom of the disc).
const PMAP_ALPHA = 0.35 // keep it subtle so amber markers stay readable
const PMAP_NX = 60
const PMAP_NY = 26

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
    const rHi = 0xdc, gHi = 0x26, bHi = 0x26 // PALETTE.pHi #dc2626
    const rLo = 0x08, gLo = 0x91, bLo = 0xb2 // PALETTE.pLo #0891b2
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
        // Bernoulli, normalized: +1 at full stagnation, negative where flow is fast
        const p = (U * U - speed2) / 2 / denom
        const mag = Math.min(Math.abs(p) * 1.4, 1)
        // diverging: p>0 → pHi, p<0 → pLo, transparent near ambient
        if (p >= 0) {
          d[k] = rHi
          d[k + 1] = gHi
          d[k + 2] = bHi
        } else {
          d[k] = rLo
          d[k + 1] = gLo
          d[k + 2] = bLo
        }
        d[k + 3] = Math.round(mag * PMAP_ALPHA * 255)
      }
    }
    offCtx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(off, 0, 0, width, height)
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

      // THE DRAG METER. Computed every frame from the closed-form surface
      // pressure (Cp = 1 − 4 sin²θ) via pressureDrag() — it integrates
      // −∮ p cosθ R dθ, which cancels to ~0 for this fore-aft-symmetric field.
      // The meter COMPUTES; it never asserts. Feed pressureDrag a lopsided
      // pressure sampler and it would read nonzero.
      const drag = pressureDrag((theta) => surfaceCp(theta), scene.R)
      drawDragMeter(ctx, w, drag)
    },
  }
}

// The drag meter — shared visual format with CorpuscleHail.tsx so the two
// figures read as siblings: rounded rect, sepia border/label, monospace value.
const SEPIA = '#78716c' // lesson-03 history-furniture color (nameplates, meters)

function drawDragMeter(ctx: CanvasRenderingContext2D, w: number, value: number) {
  const bw = 116
  const bh = 40
  const bx = w - bw - 12
  const by = 12
  const r = 8

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
  ctx.arcTo(bx, by + bh, bx, by, r)
  ctx.arcTo(bx, by, bx + bw, by, r)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fill()
  ctx.strokeStyle = SEPIA
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = SEPIA
  ctx.font = "600 10px ui-sans-serif, system-ui"
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('drag', bx + 12, by + 16)

  ctx.fillStyle = '#17191d'
  ctx.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(value.toFixed(3), bx + 12, by + 32)
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
