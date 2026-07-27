import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Lesson 03 §5 (companion to IdealFlow.tsx) — Newton's corpuscular resistance
// model, from the Principia's Book II. Newton imagined the medium as a hail of
// independent corpuscles: each particle flies straight until it strikes the
// front face of the body and bounces off. Particles that miss sail past
// untouched; nothing flows AROUND the body, so there is a dead "shadow" wedge
// behind it and no wake.
//
// PHYSICS HONESTY: this IS Newton's model, and it is DELIBERATELY WRONG for a
// liquid. It is correct for rarefied hypersonics (a re-entry capsule in the thin
// upper atmosphere, where the mean free path is large and molecules really don't
// interact before hitting the hull) and completely wrong for water, where the
// fluid is dense and continuous and flows around obstacles. The article says so
// in prose. We render it as-is: no fluid coupling, particles never see each
// other, and momentum-per-time on the front face is the drag.
//
// THE GHOST: underneath the hail we stroke a faint gray set of ideal-flow
// streamlines around the same disc — what a continuous fluid would do with the
// same obstacle. It is decoration in the sense that nothing in the corpuscle
// simulation reads it, but it is the measurement the prose asks for: "nothing goes
// around it" is an absence, and an absence needs a presence to be seen against.
// The ghost is the classical potential solution for a cylinder, traced here from
// its own closed-form velocity field rather than borrowed from sims/lib/potential:
// this figure stays self-contained so the two can never drift into disagreeing
// about the same disc.
//   u = U(1 − R²(x²−y²)/r⁴),   v = −U·2R²xy/r⁴   (r² = x²+y², origin at the disc)
// Traced once in create() and stored as immutable polylines, so draw() stays pure.

// Same scene geometry as IdealFlow so the two figures line up as siblings.
const CX_FRAC = 0.32
const CY_FRAC = 0.5
const R_FRAC = 0.16 // radius as a fraction of height

const N_PARTICLES = 150

// Fixed physics step, decoupled from RAF cadence. The only "integration" here is
// straight-line ballistic motion (x += v·dt) plus a specular reflection at the
// front face — no stiff term, no CFL condition. Stability is trivial by
// construction: bounded substeps, exact reflection, particles reset on exit.
const FIXED_DT = 1 / 120
const MAX_SUBSTEPS = 8

// Rolling window (seconds) over which we average momentum transfer to the disc.
const WINDOW_S = 1.0
// Normalization so the meter sits in a sensible ~0.1–2 range for the slider's
// speed band. drag_raw = Σ (2·m·|v·n̂|) over impacts in the window / WINDOW_S;
// with m = 1 that's Σ 2|v·n̂| per second, which is O(hundreds) for U~100 and 150
// particles — divide by DRAG_NORM to bring it down. Chosen empirically for the
// U-range below; comment stays honest that it's a display scaling, not physics.
const DRAG_NORM = 900

const SEPIA = '#78716c' // lesson-03 history-furniture color (nameplates, meters)

interface Scene {
  cx: number
  cy: number
  R: number
}

function sceneOf(w: number, h: number): Scene {
  return { cx: CX_FRAC * w, cy: CY_FRAC * h, R: R_FRAC * h }
}

// Ideal (potential) flow past a cylinder, traced from the left edge. Unit free
// stream: only the DIRECTION of the field matters for a streamline, so we step a
// fixed arc-length along the normalized velocity. Returns screen-space polylines.
const GHOST_OFFSETS = [0.5, 1.0, 1.7, 2.6, 3.7] // seed |y−cy| in units of R
const GHOST_DS = 3 // arc-length step, px

function traceGhostStreamlines(scene: Scene, w: number, h: number): number[][] {
  const lines: number[][] = []
  const seeds: number[] = []
  for (const off of GHOST_OFFSETS) {
    seeds.push(scene.cy - off * scene.R, scene.cy + off * scene.R)
  }
  for (const y0 of seeds) {
    if (y0 < 4 || y0 > h - 4) continue
    const pts: number[] = []
    let x = 0
    let y = y0
    for (let s = 0; s < 4000 && x < w; s++) {
      pts.push(x, y)
      const dx = x - scene.cx
      const dy = y - scene.cy
      const r2 = dx * dx + dy * dy
      const rr = scene.R * scene.R
      const u = 1 - (rr * (dx * dx - dy * dy)) / (r2 * r2)
      const v = (-2 * rr * dx * dy) / (r2 * r2)
      const sp = Math.hypot(u, v) || 1
      x += (u / sp) * GHOST_DS
      y += (v / sp) * GHOST_DS
      // the surface is a streamline; numerical drift must not tunnel through it
      const nr = Math.hypot(x - scene.cx, y - scene.cy)
      if (nr < scene.R * 1.005) {
        const k = (scene.R * 1.005) / nr
        x = scene.cx + (x - scene.cx) * k
        y = scene.cy + (y - scene.cy) * k
      }
    }
    lines.push(pts)
  }
  return lines
}

// mulberry32 — deterministic scatter so Reset reproduces the figure.
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

function createCorpuscleHail(uRef: { current: number }, width: number, height: number): Stepper {
  const scene = sceneOf(width, height)
  const rand = makeRand(0x517a)
  const ghost = traceGhostStreamlines(scene, width, height)

  const xs = new Float32Array(N_PARTICLES)
  const ys = new Float32Array(N_PARTICLES)
  const vx = new Float32Array(N_PARTICLES)
  const vy = new Float32Array(N_PARTICLES)

  // rolling impact log: momentum transfers with the sim-time they happened at
  const impacts: { t: number; p: number }[] = []
  let simTime = 0

  // `atLeft` re-enters a spent corpuscle just outside the left edge — inside the
  // −8 recycle cutoff below, or it would be culled again on the next step and
  // never make it into frame. The inflow staggers itself: particles come back at
  // whatever moment they left.
  const spawn = (i: number, atLeft: boolean) => {
    const U = uRef.current
    xs[i] = atLeft ? -rand() * 7 : rand() * width
    ys[i] = rand() * height
    vx[i] = U
    vy[i] = 0
  }

  for (let i = 0; i < N_PARTICLES; i++) spawn(i, false)

  const advance = (dt: number) => {
    const U = uRef.current
    simTime += dt
    for (let i = 0; i < N_PARTICLES; i++) {
      // a live particle keeps the current stream speed on its x-motion unless it
      // has already bounced (then it retains its reflected velocity)
      const px = xs[i]
      const py = ys[i]
      const nx = px + vx[i] * dt
      const ny = py + vy[i] * dt

      const dxc = nx - scene.cx
      const dyc = ny - scene.cy
      const rr = dxc * dxc + dyc * dyc

      // Specular reflection off the FRONT face only. A particle hits the front
      // face if it crosses into the disc while moving toward it (v·n̂_out < 0,
      // i.e. moving into the surface). n̂ is the outward radial normal at the
      // contact point.
      const movingIn = vx[i] * dxc + vy[i] * dyc < 0
      if (rr < scene.R * scene.R && movingIn) {
        const nlen = Math.hypot(dxc, dyc) || 1
        const nX = dxc / nlen
        const nY = dyc / nlen
        const vdotn = vx[i] * nX + vy[i] * nY
        // reflect: v' = v − 2 (v·n̂) n̂  (elastic bounce, |v| preserved)
        vx[i] -= 2 * vdotn * nX
        vy[i] -= 2 * vdotn * nY
        // push the particle back onto the surface so it doesn't re-trigger
        xs[i] = scene.cx + nX * scene.R
        ys[i] = scene.cy + nY * scene.R
        // momentum transferred to the disc along the stream axis (x): the disc
        // feels 2·m·(v·n̂) worth of impulse; its drag-relevant component is the
        // change in the particle's x-momentum. m = 1.
        impacts.push({ t: simTime, p: 2 * Math.abs(vdotn) * Math.abs(nX) })
      } else {
        xs[i] = nx
        ys[i] = ny
      }

      // Respawn on exit (any edge) from the left inflow, fresh stream velocity.
      // The left cutoff is −8, not −width: a bounced corpuscle leaves the frame
      // travelling upstream, and letting it coast a full canvas-width before
      // recycling littered the incoming region with wrong-way dots drifting
      // against the hail.
      if (xs[i] > width + 4 || xs[i] < -8 || ys[i] > height + 4 || ys[i] < -4) {
        spawn(i, true)
        // keep U current on respawn
        vx[i] = U
        vy[i] = 0
      }
    }

    // drop impacts older than the window
    const cutoff = simTime - WINDOW_S
    while (impacts.length && impacts[0].t < cutoff) impacts.shift()
  }

  const dragValue = () => {
    let sum = 0
    for (const imp of impacts) sum += imp.p
    // momentum per unit time over the rolling window, then display-normalized
    return sum / WINDOW_S / DRAG_NORM
  }

  let acc = 0

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

      // THE GHOST: what a continuous fluid would do with this disc, under the hail
      // that does nothing of the kind. Faint, gray, and behind everything.
      ctx.strokeStyle = 'rgba(156,163,175,0.55)'
      ctx.lineWidth = 1
      for (const pts of ghost) {
        ctx.beginPath()
        ctx.moveTo(pts[0], pts[1])
        for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1])
        ctx.stroke()
      }
      // legend key, so the gray is identified rather than mysterious
      ctx.strokeStyle = 'rgba(156,163,175,0.9)'
      ctx.beginPath()
      ctx.moveTo(12, h - 14)
      ctx.lineTo(32, h - 14)
      ctx.stroke()
      ctx.fillStyle = SEPIA
      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.fillText('ideal flow', 38, h - 11)

      // the solid disc
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.arc(scene.cx, scene.cy, scene.R, 0, Math.PI * 2)
      ctx.fill()

      // corpuscles as amber dots with a short motion streak (no persistent trail
      // buffer — a straight ballistic dash back along the velocity reads as speed)
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.35
      for (let i = 0; i < N_PARTICLES; i++) {
        const sp = Math.hypot(vx[i], vy[i]) || 1
        const dashLen = 10
        ctx.beginPath()
        ctx.moveTo(xs[i], ys[i])
        ctx.lineTo(xs[i] - (vx[i] / sp) * dashLen, ys[i] - (vy[i] / sp) * dashLen)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = PALETTE.dye
      for (let i = 0; i < N_PARTICLES; i++) {
        ctx.beginPath()
        ctx.arc(xs[i], ys[i], 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // THE DRAG METER — same visual format as IdealFlow. Here it reads NONZERO:
      // corpuscles slam the front face and hand it momentum; there's nothing to
      // cancel because nothing hits the back. Value = Σ momentum-transfer over a
      // rolling ~1s window / WINDOW_S, display-normalized.
      drawDragMeter(ctx, w, dragValue())
    },
  }
}

// Shared drag-meter idiom with IdealFlow.tsx: rounded rect, sepia border/label,
// monospace value, same corner of the canvas — so the two figures read as
// siblings and the opposite readings are directly comparable. Not the identical
// box any more: IdealFlow's grew rows to show the two signed halves of its
// surface integral cancelling. Here there is nothing to cancel, so one row.
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

export function CorpuscleHail() {
  const [u, setU] = useState(70)
  const uRef = useRef(u)
  uRef.current = u

  return (
    <Sim height={260} create={(w, h) => createCorpuscleHail(uRef, w, h)}>
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
