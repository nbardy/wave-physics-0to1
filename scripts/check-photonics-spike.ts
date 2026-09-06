/**
 * Physics validation for the photonics FDTD spike (src/sims/photonics/fdtd.ts).
 * Run with `bun run check:photonics`. No browser, no canvas — every check is a
 * real physical prediction measured off the field arrays, never a mirror of
 * the implementation:
 *
 *   1 · numerical dispersion — a CW plane wave in vacuum must travel with the
 *       wavelength we injected (ppw = 20; on-axis Yee dispersion theory says
 *       −0.2% at this resolution, so a 2% band catches a real error while
 *       allowing peak-interpolation noise and the Mur edge's small ripple)
 *   2 · refractive index — inside an n = 1.5 slab the same wave must contract
 *       to λ/n (ppw drops to 13.3 → theory −0.7%, plus a Fabry–Pérot standing
 *       ripple from the 4% facial reflections → 4% band)
 *   3 · energy, PEC box — with sources off and mirror walls the time-centered
 *       energy ½⟨εE,E⟩ + ½⟨H⁺,H⁻⟩ is an exact invariant of the lossless
 *       leapfrog; float32 rounding leaves ~1e-5 drift, a genuine instability
 *       grows exponentially, so 1e-3 splits them with two orders of headroom
 *   4 · energy, Mur — after source-off the same energy must fall, never grow
 *       (absorption, and the blow-up guard), and almost all of it must leave
 *   5 · double slit — time-averaged intensity fringes on a screen must be
 *       spaced λL/d (the article's formula) within 12%
 *   6 · timing — informational ms/step so figure planning knows the budget
 */

import {
  C0,
  DT,
  createFdtd,
  stampIndexRect,
  stampWallRect,
  step,
  type FdtdState,
} from '../src/sims/photonics/fdtd'

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

function runSteps(s: FdtdState, n: number) {
  for (let i = 0; i < n; i++) step(s)
}

/**
 * Sub-cell positions of local maxima of `profile` on [lo, hi], via a 3-point
 * parabola, keeping only peaks above minFrac of the window's max (so noise
 * ripples and reflection ghosts don't register as fringes).
 */
function peakPositions(profile: Float64Array, lo: number, hi: number, minFrac: number): number[] {
  let max = 0
  for (let x = lo; x <= hi; x++) max = Math.max(max, profile[x])
  const peaks: number[] = []
  for (let x = lo + 1; x < hi; x++) {
    const a = profile[x - 1]
    const b = profile[x]
    const c = profile[x + 1]
    if (b > a && b >= c && b > minFrac * max) {
      const denom = a - 2 * b + c
      const delta = denom === 0 ? 0 : (0.5 * (a - c)) / denom
      peaks.push(x + delta)
    }
  }
  return peaks
}

function meanSpacing(peaks: number[]): number {
  return (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1)
}

interface Lobe {
  centroid: number
  peak: number
}

/**
 * Bright fringes as LOBES: contiguous runs above thrFrac of the window max,
 * each reduced to its intensity-weighted centroid. Raw local maxima are the
 * wrong tool for the double slit at this L: the screen is at ~half the
 * Fraunhofer distance, so the central maximum is a broad near-field flat-top
 * whose sub-percent ripple a parabolic peak-finder happily reads as two extra
 * fringes half a wavelength apart (it did — that bug is why this exists).
 */
function brightLobes(profile: Float64Array, lo: number, hi: number, thrFrac: number): Lobe[] {
  let max = 0
  for (let x = lo; x <= hi; x++) max = Math.max(max, profile[x])
  const thr = thrFrac * max
  const lobes: Lobe[] = []
  let sum = 0
  let wsum = 0
  let peak = 0
  for (let x = lo; x <= hi + 1; x++) {
    const v = x <= hi ? profile[x] : 0
    if (v > thr) {
      sum += v
      wsum += v * x
      peak = Math.max(peak, v)
    } else if (sum > 0) {
      lobes.push({ centroid: wsum / sum, peak })
      sum = 0
      wsum = 0
      peak = 0
    }
  }
  return lobes
}

/**
 * Time-centered field energy ½⟨εE,E⟩ + ½⟨H^{n+½},H^{n−½}⟩ — the quadratic
 * form the lossless Yee leapfrog conserves EXACTLY (the naive instantaneous
 * sum oscillates at 2ω because E and H live half a step apart). Advances the
 * state one step and returns the energy at the step boundary it crossed.
 */
function stepWithCenteredEnergy(
  s: FdtdState,
  ezPrev: Float32Array,
  hxPrev: Float32Array,
  hyPrev: Float32Array,
): number {
  ezPrev.set(s.ez)
  hxPrev.set(s.hx)
  hyPrev.set(s.hy)
  step(s)
  let e = 0
  let h = 0
  for (let k = 0; k < ezPrev.length; k++) {
    e += (ezPrev[k] * ezPrev[k]) / s.invEps[k]
    h += s.hx[k] * hxPrev[k] + s.hy[k] * hyPrev[k]
  }
  return 0.5 * (e + h)
}

const LAMBDA = 20 // vacuum wavelength in cells — ppw 20, chosen so on-axis grid dispersion is ~0.2% (it grows like 1/ppw²; at ppw 10 it would already be ~1%)

// ---------------------------------------------------------------------------
// 1 · numerical dispersion: inject λ = 20 cells, measure crest spacing far
// from the source after steady state. 2% band per the header.
// ---------------------------------------------------------------------------
{
  const nx = 520
  const ny = 80
  const s = createFdtd({ nx, ny, boundary: 'mur1' })
  s.sources.push({ i: 15, j0: 2, j1: ny - 3, wavelength: LAMBDA, amp: 1, rampPeriods: 4 })
  runSteps(s, 1400) // front crosses 520 cells in ~740 steps; the rest settles transients into the absorber
  const row = (ny >> 1) * nx
  const profile = new Float64Array(nx)
  for (let i = 0; i < nx; i++) profile[i] = s.ez[row + i]
  const peaks = peakPositions(profile, 60, 460, 0.3)
  const measured = meanSpacing(peaks)
  const err = (measured - LAMBDA) / LAMBDA
  ok(
    peaks.length >= 15,
    'dispersion · a steady plane wave fills the strip',
    `${peaks.length} crests between x=60 and x=460`,
  )
  ok(
    Math.abs(err) < 0.02,
    'dispersion · vacuum wavelength matches the injected λ',
    `measured ${measured.toFixed(3)} vs injected ${LAMBDA} cells (${(err * 100).toFixed(2)}%, ppw 20)`,
  )
}

// ---------------------------------------------------------------------------
// 2 · refractive index: same strip with an n = 1.5 slab; crests inside the
// glass must sit λ/n apart. 4% band per the header.
// ---------------------------------------------------------------------------
{
  const nx = 520
  const ny = 80
  const N_GLASS = 1.5
  const s = createFdtd({ nx, ny, boundary: 'mur1' })
  s.sources.push({ i: 15, j0: 2, j1: ny - 3, wavelength: LAMBDA, amp: 1, rampPeriods: 4 })
  stampIndexRect(s, 260, 2, 500, ny - 3, N_GLASS)
  runSteps(s, 2000) // slower slab: the front needs ~1100 steps to reach x=460, plus settling
  const row = (ny >> 1) * nx
  const profile = new Float64Array(nx)
  for (let i = 0; i < nx; i++) profile[i] = s.ez[row + i]
  const peaks = peakPositions(profile, 300, 460, 0.3)
  const want = LAMBDA / N_GLASS
  const measured = meanSpacing(peaks)
  const err = (measured - want) / want
  ok(
    Math.abs(err) < 0.04,
    'index · inside n = 1.5 glass the wave contracts to λ/n',
    `measured ${measured.toFixed(3)} vs λ/n = ${want.toFixed(3)} cells (${(err * 100).toFixed(2)}%, ppw 13.3 in glass)`,
  )
}

// ---------------------------------------------------------------------------
// 3 · energy, PEC box: fill with a point source, switch it off, and watch the
// centered energy. Exact invariant in exact arithmetic → 1e-3 splits float32
// rounding (~1e-5) from any real instability (exponential).
// ---------------------------------------------------------------------------
{
  const nx = 160
  const ny = 160
  const s = createFdtd({ nx, ny, boundary: 'pec' })
  s.sources.push({ i: 80, j0: 80, j1: 80, wavelength: LAMBDA, amp: 1, rampPeriods: 3 })
  runSteps(s, 600)
  s.sources = [] // off — from here the box is closed and lossless
  const ezPrev = new Float32Array(s.ez.length)
  const hxPrev = new Float32Array(s.hx.length)
  const hyPrev = new Float32Array(s.hy.length)
  const e0 = stepWithCenteredEnergy(s, ezPrev, hxPrev, hyPrev)
  let maxDrift = 0
  for (let i = 0; i < 1500; i++) {
    const e = stepWithCenteredEnergy(s, ezPrev, hxPrev, hyPrev)
    maxDrift = Math.max(maxDrift, Math.abs(e - e0) / e0)
  }
  ok(e0 > 0, 'energy · the box actually holds a field', `E₀ = ${e0.toExponential(3)}`)
  ok(
    maxDrift < 1e-3,
    'energy · mirror box conserves it over 1500 steps',
    `max relative drift ${maxDrift.toExponential(2)} (want < 1e-3)`,
  )
}

// ---------------------------------------------------------------------------
// 4 · energy, Mur: same box, absorbing walls. After source-off the energy
// must never rise between samples (blow-up guard) and nearly all of it must
// leave. The 1e-3·E₀ per-sample slack covers the centered form's last-digit
// wiggle as waves cross the boundary; a real instability exceeds it at once.
// ---------------------------------------------------------------------------
{
  const nx = 160
  const ny = 160
  const s = createFdtd({ nx, ny, boundary: 'mur1' })
  s.sources.push({ i: 80, j0: 80, j1: 80, wavelength: LAMBDA, amp: 1, rampPeriods: 3 })
  runSteps(s, 600)
  s.sources = []
  const ezPrev = new Float32Array(s.ez.length)
  const hxPrev = new Float32Array(s.hx.length)
  const hyPrev = new Float32Array(s.hy.length)
  const e0 = stepWithCenteredEnergy(s, ezPrev, hxPrev, hyPrev)
  let prev = e0
  let worstRise = 0
  let last = e0
  const SAMPLE = 25
  for (let sample = 0; sample < 100; sample++) {
    let e = prev
    for (let i = 0; i < SAMPLE; i++) e = stepWithCenteredEnergy(s, ezPrev, hxPrev, hyPrev)
    worstRise = Math.max(worstRise, (e - prev) / e0)
    prev = e
    last = e
  }
  ok(
    worstRise < 1e-3,
    'energy · Mur walls only ever drain it',
    `worst sample-to-sample rise ${worstRise.toExponential(2)} of E₀ over 2500 steps (want < 1e-3)`,
  )
  ok(
    last / e0 < 0.02,
    'energy · and nearly all of it leaves the box',
    `${((last / e0) * 100).toFixed(3)}% of E₀ remains after 2500 steps (want < 2%)`,
  )
}

// ---------------------------------------------------------------------------
// 5 · double slit: two slits d = 100 cells apart in an opaque wall, screen
// L ≈ 238 cells downstream, both ≫ λ = 20. Time-averaged intensity fringes
// must be spaced λL/d. The 12% band, itemized: grid dispersion −0.2%;
// tan θ vs sin θ at the first maximum +2%; near-field hyperbola corrections
// (L is ~half the Fraunhofer distance d²/λ) a few %; finite slit width and
// Mur edge reflections the rest. The wrong physics — e.g. spacing λL/2d, or
// the single-slit envelope — misses by ≥ 100%, far outside the band.
// ---------------------------------------------------------------------------
{
  const nx = 340
  const ny = 300
  const WALL_X0 = 60
  const WALL_X1 = 63
  const SLIT_D = 100 // centre-to-centre = 5λ
  const SLIT_HALF = 4 // slit width 9 ≈ λ/2, so each slit radiates a clean near-cylindrical wave
  const JC = 150 // optical axis
  const SCREEN_X = 300
  const L = SCREEN_X - (WALL_X0 + WALL_X1) / 2
  const predicted = (LAMBDA * L) / SLIT_D

  const s = createFdtd({ nx, ny, boundary: 'mur1' })
  s.sources.push({ i: 15, j0: 2, j1: ny - 3, wavelength: LAMBDA, amp: 1, rampPeriods: 4 })
  const jLo = JC - SLIT_D / 2 // 100
  const jHi = JC + SLIT_D / 2 // 200
  stampWallRect(s, WALL_X0, 0, WALL_X1, jLo - SLIT_HALF - 1)
  stampWallRect(s, WALL_X0, jLo + SLIT_HALF + 1, WALL_X1, jHi - SLIT_HALF - 1)
  stampWallRect(s, WALL_X0, jHi + SLIT_HALF + 1, WALL_X1, ny - 1)

  runSteps(s, 900) // source→screen is ~410 steps at c·dt = 0.7 cells/step; the rest lets reflections settle
  const intensity = new Float64Array(ny)
  const AVG_STEPS = 600 // ≈ 21 periods — a non-integer period count only smears the average by < 1/21
  for (let i = 0; i < AVG_STEPS; i++) {
    step(s)
    for (let j = 0; j < ny; j++) {
      const v = s.ez[j * nx + SCREEN_X]
      intensity[j] += v * v
    }
  }

  const lobes = brightLobes(intensity, 20, ny - 20, 0.5)
  ok(
    lobes.length >= 3,
    'slit · the screen carries a fringe pattern',
    `${lobes.length} bright lobes above 50% of peak, at ${lobes.map((l) => l.centroid.toFixed(1)).join(', ')}`,
  )
  // the central fringe and its two neighbours, measured about the axis
  const centroids = lobes.map((l) => l.centroid)
  const central = centroids.reduce((best, p) => (Math.abs(p - JC) < Math.abs(best - JC) ? p : best), -1e9)
  const below = centroids.filter((p) => p < central - LAMBDA / 2).pop() ?? NaN
  const above = centroids.find((p) => p > central + LAMBDA / 2) ?? NaN
  const measured = (above - below) / 2
  const err = (measured - predicted) / predicted
  ok(
    Number.isFinite(measured) && Math.abs(err) < 0.12,
    'slit · fringe spacing matches λL/d',
    `measured ${measured.toFixed(2)} vs λL/d = ${predicted.toFixed(2)} cells (${(err * 100).toFixed(1)}%; central trio at ${below.toFixed(1)}, ${central.toFixed(1)}, ${above.toFixed(1)})`,
  )
  // the fringes must actually modulate — deep minima between the maxima
  let valley = Infinity
  for (let j = Math.ceil(below); j <= Math.floor(above); j++) valley = Math.min(valley, intensity[j])
  const crest = intensity[Math.round(central)]
  ok(
    valley < 0.35 * crest,
    'slit · dark fringes between the bright ones',
    `valley/crest = ${(valley / crest).toFixed(3)} (want < 0.35)`,
  )
}

// ---------------------------------------------------------------------------
// 6 · timing (informational): ms per step at figure-relevant grid sizes.
// ---------------------------------------------------------------------------
for (const size of [256, 512]) {
  const s = createFdtd({ nx: size, ny: size, boundary: 'mur1' })
  s.sources.push({ i: 15, j0: 2, j1: size - 3, wavelength: LAMBDA, amp: 1, rampPeriods: 2 })
  runSteps(s, 20)
  const t0 = performance.now()
  runSteps(s, 100)
  const ms = (performance.now() - t0) / 100
  console.log(`info ${size}×${size}: ${ms.toFixed(2)} ms/step (${(1000 / ms).toFixed(0)} steps/s), c·dt = ${(C0 * DT).toFixed(3)} cells/step`)
}

console.log(failures === 0 ? '\nall photonics spike checks passed' : `\n${failures} photonics spike check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
