// Where the divergence fields come from.
//
// Every b in this article — training set, held-out set, out-of-distribution
// set, and every field a figure ever draws — is produced by running the CPU
// Stable Fluids solver from lesson 01 and reading `solver.div` after a step.
// That array is not a proxy for the projection's input; it IS the projection's
// input, written by `FluidSolver.project` before it starts sweeping. No
// synthetic Gaussians, no hand-drawn dipoles: the network is trained on the
// exact defect the exact solver hands it.
//
// The generator is deterministic (mulberry32, seeded per case) so a figure in
// the browser and an assertion in `scripts/check-learned.ts` are looking at the
// same numbers.

import { FluidSolver } from '../lib/solver'
import { NX, NY } from './net'
import type { Grid } from './poisson'

export interface Obstacle {
  cx: number
  cy: number
  r: number
}

export interface CaseSpec {
  id: string
  label: string
  inflow: number
  visc: number
  discs: readonly Obstacle[]
  airfoilDeg: number | null
  warmup: number
  stir: number
  seed: number
}

const DYE_ROWS = [8, 16, 24, 32, 40, 48, 56]
const FIXED_DT = 1 / 40

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSolver(spec: CaseSpec): FluidSolver {
  const s = new FluidSolver(NX, NY, spec.inflow, spec.visc)
  if (spec.airfoilDeg !== null) {
    s.setAirfoil(Math.round(NX * 0.3), Math.round(NY * 0.5), 26, (spec.airfoilDeg * Math.PI) / 180)
  }
  for (const d of spec.discs) s.addDisc(d.cx, d.cy, d.r)
  return s
}

/** Advance `steps` steps, stirring on the case's own deterministic schedule. */
export function advance(solver: FluidSolver, spec: CaseSpec, steps: number, rnd: () => number): void {
  for (let k = 0; k < steps; k++) {
    solver.injectDyeStripe(DYE_ROWS, 1)
    // Stirring is drawn from the case's own random stream rather than keyed to
    // `k`, because `advance` is called repeatedly to walk a case forward and a
    // phase-based schedule would fire on the first step of every call.
    if (spec.stir > 0 && rnd() < 1 / 17) {
      const cx = 6 + Math.floor(rnd() * (NX - 12))
      const cy = 6 + Math.floor(rnd() * (NY - 12))
      solver.addImpulse(cx, cy, (rnd() - 0.5) * spec.stir, (rnd() - 0.5) * spec.stir, 5)
    }
    solver.step(FIXED_DT)
  }
}

export interface CaseFields {
  grid: Grid
  /** The divergence the projection actually faced on the last step. */
  b: Float32Array
  solid: Uint8Array
}

/** Warm the case up and return the field the projection is looking at right now. */
export function buildCase(spec: CaseSpec): CaseFields {
  const solver = buildSolver(spec)
  const rnd = mulberry32(spec.seed)
  advance(solver, spec, spec.warmup, rnd)
  return {
    grid: { nx: NX, ny: NY, solid: solver.solid },
    b: Float32Array.from(solver.div),
    solid: solver.solid,
  }
}

/** `count` snapshots from one case, `every` steps apart — a training batch. */
export function sampleCase(spec: CaseSpec, count: number, every: number): CaseFields[] {
  const solver = buildSolver(spec)
  const rnd = mulberry32(spec.seed)
  advance(solver, spec, spec.warmup, rnd)
  const out: CaseFields[] = []
  for (let n = 0; n < count; n++) {
    advance(solver, spec, every, rnd)
    out.push({
      grid: { nx: NX, ny: NY, solid: solver.solid },
      b: Float32Array.from(solver.div),
      solid: solver.solid,
    })
  }
  return out
}

// ---------------------------------------------------------------- the sets
//
// Training and held-out cases are the SAME family — one disc in a channel,
// inflow and viscosity and disc geometry varied. The held-out cases differ only
// in their numbers, which is the easy kind of generalization and the only kind
// this network is entitled to claim.
//
// The out-of-distribution cases are structurally different: an airfoil instead
// of a disc, two obstacles instead of one, a stirred channel with no obstacle
// at all. The article does not hide how the network does on them.

const disc = (cx: number, cy: number, r: number): Obstacle => ({ cx, cy, r })

export const TRAIN_CASES: readonly CaseSpec[] = [
  { id: 't1', label: 'disc, slow', inflow: 16, visc: 1.0, discs: [disc(26, 32, 7)], airfoilDeg: null, warmup: 140, stir: 0, seed: 11 },
  { id: 't2', label: 'disc, fast', inflow: 30, visc: 0.4, discs: [disc(26, 32, 7)], airfoilDeg: null, warmup: 140, stir: 0, seed: 12 },
  { id: 't3', label: 'small disc, high', inflow: 24, visc: 0.6, discs: [disc(30, 24, 5)], airfoilDeg: null, warmup: 140, stir: 0, seed: 13 },
  { id: 't4', label: 'big disc, low', inflow: 20, visc: 1.4, discs: [disc(28, 42, 10)], airfoilDeg: null, warmup: 140, stir: 0, seed: 14 },
  { id: 't5', label: 'disc, stirred', inflow: 22, visc: 0.8, discs: [disc(24, 32, 8)], airfoilDeg: null, warmup: 140, stir: 90, seed: 15 },
  { id: 't6', label: 'disc, downstream', inflow: 26, visc: 0.5, discs: [disc(40, 30, 6)], airfoilDeg: null, warmup: 140, stir: 60, seed: 16 },
] as const

export const HELD_OUT_CASES: readonly CaseSpec[] = [
  { id: 'h1', label: 'held-out disc', inflow: 23, visc: 0.7, discs: [disc(27, 35, 8)], airfoilDeg: null, warmup: 190, stir: 0, seed: 101 },
  { id: 'h2', label: 'held-out disc, stirred', inflow: 28, visc: 0.9, discs: [disc(32, 28, 6)], airfoilDeg: null, warmup: 190, stir: 75, seed: 102 },
] as const

export const OOD_CASES: readonly CaseSpec[] = [
  { id: 'o1', label: 'airfoil at 14°', inflow: 24, visc: 0.6, discs: [], airfoilDeg: 14, warmup: 190, stir: 0, seed: 201 },
  { id: 'o2', label: 'two discs', inflow: 24, visc: 0.6, discs: [disc(24, 20, 6), disc(38, 46, 6)], airfoilDeg: null, warmup: 190, stir: 0, seed: 202 },
  { id: 'o3', label: 'open channel, stirred', inflow: 18, visc: 0.5, discs: [], airfoilDeg: null, warmup: 190, stir: 140, seed: 203 },
] as const
