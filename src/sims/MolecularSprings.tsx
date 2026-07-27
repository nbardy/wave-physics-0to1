import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// Navier, 1822 — the molecular derivation, as a toy.
// Navier built viscosity out of central forces between molecules. Here a lattice
// of molecule dots relaxes each dot's horizontal velocity toward the average of
// its four neighbours. The top row is a conveyor (driven at constant speed); the
// bottom row is pinned at zero (no-slip). The steady state is the linear Couette
// profile.
//
// Update (exponential relaxation, unconditionally stable for λ ≤ 1):
//   u_i ← u_i + λ · (mean(neighbours) − u_i),   λ = ε · FIXED_DT
// We CLAMP λ ≤ 1. For λ ∈ (0,1] this is a convex blend toward the neighbour mean,
// so it can never overshoot — no explicit-Euler stability bound to trip over.
//
// THE JOKE (deliberate): the slider is labelled "ε (units: ?)". Navier's molecular
// constant could not be connected to anything measurable — the units were a
// mystery until Stokes recast it as a continuum viscosity. The knob is honest
// about that.
//
// THE KICK (staging, not physics): left alone, the lattice reaches its straight
// line and then every value of ε looks identical — a dead knob. So every
// KICK_PERIOD seconds the interior rows are re-randomized from a seeded generator.
// That is a restaging of the demonstration, NOT a physical process: nothing in
// Navier's molecules randomly resets. It exists so that ε is always visibly
// governing a smoothing that is still in progress.
//
// THE BONDS (what the springs actually pull with): between vertically adjacent
// molecules we draw Navier's central force, whose strength goes as the RELATIVE
// velocity |u[r] − u[r+1]|. Stroke WIDTH is that tension. Stroke OPACITY is the
// tension's departure from the mean seam gap — and that mean is not a constant we
// typed in: the seam gaps telescope, Σ(u[r] − u[r+1]) = u[0] − u[ROWS-1] = DRIVE,
// so the mean gap is always DRIVE/(ROWS-1) whatever the profile is doing.
//
// BOUNDARY CHECK (why it settles, and what you see): at equilibrium the profile is
// linear in row. A linear profile has zero neighbour-disagreement — the mean of a
// dot's up/down neighbours equals the dot itself — so (mean − u_i) = 0 and the
// update stops. On screen that is the bonds going even and their green glow dying
// to nothing: every seam pulling equally means every pull cancels.

const COLS = 16
const ROWS = 10
const SEAMS = ROWS - 1
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const DRIVE = 1 // conveyor speed of the top row (dimensionless)
const KICK_PERIOD = 3.0 // seconds between restagings of the disagreement
const MEAN_GAP = DRIVE / SEAMS // the seam gap a straight profile must have
const TENSION_FULL = 0.4 // |Δu| that saturates bond width
const EXCESS_FULL = 0.3 // |Δu − MEAN_GAP| that saturates the green glow

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createLattice(epsRef: { current: number }): Stepper {
  const rand = mulberry32((Math.random() * 2 ** 32) >>> 0) // fresh seed per create()

  // u[r] : one horizontal velocity per row (the lattice is horizontally uniform,
  // so we track a velocity per row — every dot in a row shares it).
  const u = new Float32Array(ROWS)
  const uNext = new Float32Array(ROWS)
  const offset = new Float32Array(ROWS) // accumulated horizontal shear offset per row
  u[0] = DRIVE // driven top row
  // u[ROWS-1] stays 0 (no-slip bottom)

  let sinceKick = KICK_PERIOD // kick immediately so the first frame already disagrees

  const kick = () => {
    for (let r = 1; r < ROWS - 1; r++) u[r] = rand() * DRIVE
  }

  let acc = 0
  const advance = () => {
    sinceKick += FIXED_DT
    if (sinceKick >= KICK_PERIOD) {
      sinceKick -= KICK_PERIOD
      kick()
    }

    let lambda = epsRef.current * FIXED_DT
    if (lambda > 1) lambda = 1 // clamp: convex blend stays stable
    for (let r = 1; r < ROWS - 1; r++) {
      // 4-neighbour mean; horizontally uniform so left/right neighbours equal u[r].
      // mean = (u[r-1] + u[r+1] + u[r] + u[r]) / 4
      const mean = (u[r - 1] + u[r + 1] + 2 * u[r]) / 4
      uNext[r] = u[r] + lambda * (mean - u[r])
    }
    uNext[0] = DRIVE
    uNext[ROWS - 1] = 0
    u.set(uNext)
    // advect the visible offset by the row velocity, wrap within one cell width
    for (let r = 0; r < ROWS; r++) {
      offset[r] += u[r] * FIXED_DT * DRIVE
    }
  }

  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 8) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const padX = 16
      const padY = 20
      const plotW = (w - 2 * padX) * 0.72 // leave room for the profile overlay
      const cellW = plotW / COLS
      const gridH = h - 2 * padY
      const rowY = (r: number) => padY + (r / (ROWS - 1)) * gridH
      // each row's dots are displaced by its wrapped shear offset
      const shear = (r: number) => ((offset[r] % 1) + 1) % 1
      const dotX = (r: number, c: number) => padX + (c + shear(r)) * cellW

      // inter-row bonds: Navier's central force between neighbouring molecules.
      // Width ∝ |Δu| (the pull); green opacity ∝ |Δu − MEAN_GAP| (how far this seam
      // still is from the straight profile) — that glow is what dies at equilibrium.
      ctx.strokeStyle = PALETTE.visc
      ctx.lineCap = 'round'
      for (let r = 0; r < SEAMS; r++) {
        const gap = u[r] - u[r + 1]
        const tension = Math.min(1, Math.abs(gap) / TENSION_FULL)
        const excess = Math.min(1, Math.abs(gap - MEAN_GAP) / EXCESS_FULL)
        ctx.lineWidth = 0.5 + 4.5 * tension
        ctx.globalAlpha = 0.1 + 0.8 * excess
        const y0 = rowY(r)
        const y1 = rowY(r + 1)
        ctx.beginPath()
        for (let c = 0; c < COLS; c++) {
          const x0 = dotX(r, c)
          // bond to the NEAREST molecule below, so a row wrapping its shear offset
          // never makes every bond flip tilt at once
          const raw = dotX(r + 1, c) - x0
          const dx = (((raw + cellW / 2) % cellW) + cellW) % cellW - cellW / 2
          ctx.moveTo(x0, y0)
          ctx.lineTo(x0 + dx, y1)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.lineCap = 'butt'

      // molecule dots, colored by velocity intensity (PALETTE.vel blue)
      for (let r = 0; r < ROWS; r++) {
        const speed = Math.abs(u[r])
        ctx.fillStyle = PALETTE.vel
        ctx.globalAlpha = 0.3 + 0.7 * Math.min(1, speed)
        for (let c = 0; c < COLS; c++) {
          ctx.beginPath()
          ctx.arc(dotX(r, c), rowY(r), 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // velocity-profile overlay on the right edge — mean horizontal velocity per
      // row. Relaxes toward a straight diagonal (the linear Couette profile).
      const ox = padX + plotW + 20
      const ow = w - padX - ox
      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(ox, padY, ow, gridH)
      // reference: the linear steady-state target
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(ox + ow, padY) // top row, u = DRIVE
      ctx.lineTo(ox, padY + gridH) // bottom row, u = 0
      ctx.stroke()
      ctx.setLineDash([])
      // live profile polyline (green)
      ctx.strokeStyle = PALETTE.visc
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let r = 0; r < ROWS; r++) {
        const px = ox + (u[r] / DRIVE) * ow
        const py = rowY(r)
        if (r === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    },
  }
}

export function MolecularSprings() {
  const [eps, setEps] = useState(120)
  const epsRef = useRef(eps)
  epsRef.current = eps

  return (
    <Sim height={260} create={() => createLattice(epsRef)}>
      <label className="sim-slider">
        <span>sluggish</span>
        <input
          type="range"
          min={10}
          max={240}
          step={1}
          value={eps}
          onChange={(e) => setEps(Number(e.target.value))}
        />
        <span>ε (units: ?)</span>
      </label>
    </Sim>
  )
}
