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
// BOUNDARY CHECK (why it settles): at equilibrium the profile is linear in row.
// A linear profile has zero neighbour-disagreement — the mean of a dot's up/down
// neighbours equals the dot itself — so (mean − u_i) = 0 and the update stops.

const COLS = 24
const ROWS = 10
const FIXED_DT = 1 / 240 // fixed physics step, decoupled from RAF cadence
const DRIVE = 1 // conveyor speed of the top row (dimensionless)

function createLattice(epsRef: { current: number }): Stepper {
  // u[r] : one horizontal velocity per row (the lattice is horizontally uniform,
  // so we track a velocity per row — every dot in a row shares it).
  const u = new Float32Array(ROWS)
  const uNext = new Float32Array(ROWS)
  const offset = new Float32Array(ROWS) // accumulated horizontal shear offset per row
  u[0] = DRIVE // driven top row
  // u[ROWS-1] stays 0 (no-slip bottom)

  let acc = 0
  const advance = () => {
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

      // molecule dots, displaced horizontally by the wrapped shear offset,
      // colored by velocity intensity (PALETTE.vel blue)
      for (let r = 0; r < ROWS; r++) {
        const speed = Math.abs(u[r])
        const shear = ((offset[r] % 1) + 1) % 1 // wrap into [0,1) cell fraction
        const a = 0.25 + 0.75 * Math.min(1, speed)
        ctx.fillStyle = PALETTE.vel
        ctx.globalAlpha = a
        for (let c = 0; c < COLS; c++) {
          const x = padX + (c + shear) * cellW
          ctx.beginPath()
          ctx.arc(x, rowY(r), 2.6, 0, Math.PI * 2)
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
