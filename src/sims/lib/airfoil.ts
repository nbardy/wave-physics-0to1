// NACA four-digit airfoil rasterized into a solid-cell mask, shared by the
// CPU and GPU solvers (both keep a CPU-side mask; only the buffer type
// differs). The mask REPLACES the previous obstacle: a tilt slider re-stamps
// the whole mask, so stamping must start from a clean slate.
//
// Geometry: standard NACA camber line + thickness envelope (closed trailing
// edge, −0.1036 final coefficient). Grid j grows downward, so a positive
// angle of attack (nose up on screen) is a plain +angle rotation in grid
// coordinates, and the camber bulge (suction side up) sits at local −y.
//
// The trailing edge tapers toward zero thickness, which on a grid becomes a
// knife edge: a one-cell-thick solid sheet whose Neumann pressure mirror is
// nearly singular — measured here, it drives local velocities to ~8× the
// inflow. So the half-thickness gets a floor measured in CHORD units (not
// grid cells: a per-cell floor silently thins 4× on the 4× GPU grid, which
// is exactly how the knife edge slipped in). A despeckle pass then shaves
// single-cell staircase spikes for the same reason. Both are honesty
// tradeoffs of the blunt-tail kind: the wing is drawn exactly as the solver
// sees it.

const CAMBER = 0.05 // m: max camber, fraction of chord (NACA 5x12-ish, slightly exaggerated for pixels)
const CAMBER_POS = 0.4 // p: camber max position, fraction of chord
const THICKNESS = 0.14 // t: max thickness, fraction of chord
const MIN_HALF_THICK_FRAC = 0.02 // of chord — blunts the tail enough to keep the pressure solve sane
const MIN_HALF_THICK_CELLS = 0.75 // absolute floor for very small chords

function halfThickness(xc: number, chord: number): number {
  const yt =
    5 *
    THICKNESS *
    chord *
    (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1036 * xc ** 4)
  return Math.max(yt, MIN_HALF_THICK_FRAC * chord, MIN_HALF_THICK_CELLS)
}

function camberLine(xc: number, chord: number): number {
  if (xc < CAMBER_POS) {
    return ((CAMBER / CAMBER_POS ** 2) * (2 * CAMBER_POS * xc - xc * xc)) * chord
  }
  return ((CAMBER / (1 - CAMBER_POS) ** 2) * (1 - 2 * CAMBER_POS + 2 * CAMBER_POS * xc - xc * xc)) * chord
}

/**
 * Clear `solid` and stamp one airfoil. The pivot (the point the tilt rotates
 * about) is the quarter-chord, the standard aerodynamic reference point.
 */
export function stampAirfoilMask(
  solid: Uint8Array | Uint32Array,
  nx: number,
  ny: number,
  pivotX: number,
  pivotY: number,
  chord: number,
  angleRad: number,
): void {
  solid.fill(0)
  const cosA = Math.cos(-angleRad)
  const sinA = Math.sin(-angleRad)
  const pivotChord = 0.25 * chord
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const dx = i - pivotX
      const dy = j - pivotY
      // rotate grid → wing-local (inverse of the +angle nose-up rotation)
      const lx = dx * cosA - dy * sinA + pivotChord
      const ly = dx * sinA + dy * cosA
      if (lx < 0 || lx > chord) continue
      const xc = lx / chord
      if (Math.abs(ly + camberLine(xc, chord)) <= halfThickness(xc, chord)) {
        solid[i + j * nx] = 1
      }
    }
  }
  despeckle(solid, nx, ny)
}

// One morphological pass over the stamped mask: shave solid cells with at
// most one solid orthogonal neighbor (staircase spikes), fill fluid cells
// walled in on three or four sides (staircase pits). Both configurations are
// near-singular for the solid-Neumann pressure stencil.
function despeckle(solid: Uint8Array | Uint32Array, nx: number, ny: number): void {
  const orig = solid.slice()
  const at = (i: number, j: number) =>
    i >= 0 && i < nx && j >= 0 && j < ny ? (orig[i + j * nx] as number) : 0
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const n = at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1)
      if (orig[i + j * nx]) {
        if (n <= 1) solid[i + j * nx] = 0
      } else if (n >= 3) {
        solid[i + j * nx] = 1
      }
    }
  }
}
