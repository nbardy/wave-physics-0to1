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

// THE METER reads momentum handed to the disc per unit time, over two windows.
// Impacts are sparse — about five a second at the default speed — so a single
// window either thrashes (short) or lags the slider by seconds (long). Two
// windows side by side make that sparseness the point: the short one kicks
// with every corpuscle that lands, the long one is the drag Newton would quote.
// (An earlier one-second window did neither well: ±45% noise on ~5 impacts hid
// the U² trend, so the slider looked inert.)
const WINDOW_NOW_S = 0.2
const WINDOW_AVG_S = 6.0
// Slider band, px/s. U_DEFAULT is the "1×" the readout counts from.
const U_MIN = 20
const U_MAX = 140
const U_DEFAULT = 70
// Display normalization: drag_raw = Σ 2·m·|v·n̂|·|n̂ₓ| over impacts / window,
// with m = 1, which is O(hundreds) at U~100 — divide by DRAG_NORM. A display
// scaling, not physics.
const DRAG_NORM = 900

// Expected drag for a uniform hail at speed U, in the meter's units — the bars'
// full scale, so the average bar fills at U_MAX no matter the canvas width.
// Impact rate is ρ·U·2R (ρ = corpuscles per px²); each impact transfers
// 2U·cos²θ along x; cos²θ averaged over uniform y on the front face is 2/3.
// So ⟨drag⟩ = (8/3)·ρ·R·U², quadratic in U (the readout only shows it; no prose
// figure tests it).
function expectedDrag(scene: Scene, w: number, h: number, U: number): number {
  const rho = N_PARTICLES / (w * h)
  return ((8 / 3) * rho * scene.R * U * U) / DRAG_NORM
}

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

export function createCorpuscleHail(uRef: { current: number }, width: number, height: number): Stepper {
  const scene = sceneOf(width, height)
  const rand = makeRand(0x517a)
  const ghost = traceGhostStreamlines(scene, width, height)

  const xs = new Float32Array(N_PARTICLES)
  const ys = new Float32Array(N_PARTICLES)
  const vx = new Float32Array(N_PARTICLES)
  const vy = new Float32Array(N_PARTICLES)
  // 1 once a corpuscle has struck the disc: it then owns its reflected velocity
  // and the slider no longer speaks for it
  const bounced = new Uint8Array(N_PARTICLES)
  // Bars' full scale. Measured steady state runs ~1.2–1.3× the uniform-hail
  // formula: a corpuscle that strikes the disc bounces out the left edge and is
  // recycled in ~2·cx/U, while one that misses takes w/U, so the upstream
  // density sits above N/(w·h); on top of that the 6 s average sees only ~30
  // impacts at U_MAX, so it wanders ±20%. At ×1.3 the average bar clipped at
  // the slider's top (93–100% of scale at U=140); at ×1.7 a 40 s run at U=140
  // on a 640×360 canvas peaks at 0.86 of scale (2026-09-17).
  const fullScale = expectedDrag(scene, width, height, U_MAX) * 1.7

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
    bounced[i] = 0
  }

  for (let i = 0; i < N_PARTICLES; i++) spawn(i, false)

  const advance = (dt: number) => {
    const U = uRef.current
    simTime += dt
    for (let i = 0; i < N_PARTICLES; i++) {
      // The slider drives every corpuscle still in the stream, right now — not
      // only the ones that respawn. Before this, in-flight dots kept the speed
      // they were born with and the slow end took ~30 s to flush, so the knob
      // read as dead. A bounced corpuscle keeps its reflected velocity.
      if (!bounced[i]) vx[i] = U
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
        bounced[i] = 1
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
      }
    }

    // drop impacts older than the longest window
    const cutoff = simTime - WINDOW_AVG_S
    while (impacts.length && impacts[0].t < cutoff) impacts.shift()
  }

  // momentum per unit time over a trailing window, display-normalized
  const dragOver = (windowS: number) => {
    const cutoff = simTime - windowS
    let sum = 0
    for (let k = impacts.length - 1; k >= 0 && impacts[k].t >= cutoff; k--) sum += impacts[k].p
    return sum / windowS / DRAG_NORM
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

      // corpuscles as amber dots with a motion streak (no persistent trail
      // buffer — a ballistic dash back along the velocity, one twelfth of a
      // second long, so a faster hail wears a longer streak)
      ctx.strokeStyle = PALETTE.dye
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.35
      for (let i = 0; i < N_PARTICLES; i++) {
        const sp = Math.hypot(vx[i], vy[i]) || 1
        const dashLen = sp / 12
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

      // THE DRAG METER — same visual idiom as IdealFlow. Here it reads NONZERO:
      // corpuscles slam the front face and hand it momentum; there's nothing to
      // cancel because nothing hits the back. Two rows: the last 0.2 s, which
      // jumps with every landing, and the last 6 s, which is the drag.
      drawDragMeter(ctx, w, dragOver(WINDOW_NOW_S), dragOver(WINDOW_AVG_S), fullScale)
    },
  }
}

// Shared drag-meter idiom with IdealFlow.tsx: rounded rect, sepia border/label,
// monospace values, same corner of the canvas — so the two figures read as
// siblings and the opposite readings are directly comparable. IdealFlow's rows
// are the two signed halves of a surface integral cancelling; these rows are
// the same quantity at two time scales, each with a live bar on one shared
// scale (the expected drag at the slider's top).
function drawDragMeter(
  ctx: CanvasRenderingContext2D,
  w: number,
  now: number,
  avg: number,
  fullScale: number,
) {
  const bw = 172
  const bh = 62
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
  ctx.font = '600 10px ui-sans-serif, system-ui'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('drag', bx + 12, by + 16)

  const rows: { label: string; value: number; alpha: number }[] = [
    { label: 'now', value: now, alpha: 0.45 },
    { label: 'avg 6 s', value: avg, alpha: 1 },
  ]
  const labelX = bx + 12
  const barX = bx + 54
  const barW = bw - 54 - 46
  const valueX = bx + bw - 12
  rows.forEach((row, k) => {
    const y = by + 30 + k * 16
    ctx.fillStyle = SEPIA
    ctx.font = '10px ui-sans-serif, system-ui'
    ctx.fillText(row.label, labelX, y + 3)

    ctx.fillStyle = 'rgba(120,113,108,0.16)'
    ctx.fillRect(barX, y - 4, barW, 8)
    ctx.globalAlpha = row.alpha
    ctx.fillStyle = PALETTE.dye
    ctx.fillRect(barX, y - 4, barW * Math.min(1, row.value / fullScale), 8)
    ctx.globalAlpha = 1

    ctx.fillStyle = '#17191d'
    ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace'
    const txt = row.value.toFixed(2)
    ctx.fillText(txt, valueX - ctx.measureText(txt).width, y + 4)
  })
  ctx.restore()
}

export function CorpuscleHail() {
  const [u, setU] = useState(U_DEFAULT)
  const uRef = useRef(u)
  uRef.current = u

  return (
    <Sim height={260} create={(w, h) => createCorpuscleHail(uRef, w, h)}>
      <label className="sim-slider">
        <span>stream speed</span>
        <input
          type="range"
          min={U_MIN}
          max={U_MAX}
          step={1}
          value={u}
          onChange={(e) => setU(Number(e.target.value))}
        />
      </label>
      <span className="sim-readout">{(u / U_DEFAULT).toFixed(2)}×</span>
    </Sim>
  )
}
