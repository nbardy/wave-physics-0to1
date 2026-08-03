// Closed-form kit for physics-01 (articles/physics/01-wave-particle/PLAN.md).
// Nothing here is integrated: every intensity is the exact Fraunhofer far-field
// of a two-slit mask, and every dot on a screen is a Monte-Carlo draw from that
// intensity. The honesty of this article lives in (a) the formulas being exact
// and (b) the histograms being measured from the draws rather than re-plotted
// from the formula that produced them.

// ---------------------------------------------------------------------------
// Geometry. SI throughout; the figures print millimetres and nanometres.
// ---------------------------------------------------------------------------

export interface Optics {
  /** wavelength, m */
  lambda: number
  /** slit separation (centre to centre), m */
  d: number
  /** width of each slit, m */
  a: number
  /** mask → screen distance, m */
  L: number
}

/**
 * The bench the article uses: a helium-neon line through a pair of slits.
 *   fringe spacing  λL/d = 6.33 mm      (about nine fringes on each side)
 *   envelope zero   λL/a = 31.7 mm      (just past the edge of the screen)
 *
 * Two approximations are in force and both are checked by `fresnelNumber` and
 * `maxAngle` below:
 *   Fraunhofer   a²/(λL) = 1.3e-3  ≪ 1   — the far field really is the far field
 *   small angle  x/L ≤ 0.015 rad         — sinθ ≈ tanθ ≈ θ to 1 part in 10⁴
 * Change any constant and those two numbers must be re-checked; they are what
 * make a single sinc²·cos² expression the truth rather than a cartoon.
 */
export const BENCH: Optics = {
  lambda: 633e-9,
  d: 0.20e-3,
  a: 0.04e-3,
  L: 2.0,
}

/** Half-width of the screen the figures draw, m. */
export const SCREEN_HALF = 0.030

export const fresnelNumber = (o: Optics) => (o.a * o.a) / (o.lambda * o.L)
export const maxAngle = (o: Optics) => SCREEN_HALF / o.L

/** Fringe spacing λL/d, m — the distance between neighbouring bright bars. */
export const fringeSpacing = (o: Optics) => (o.lambda * o.L) / o.d

function sinc2(u: number): number {
  if (Math.abs(u) < 1e-9) return 1
  const s = Math.sin(u) / u
  return s * s
}

/** Diffraction envelope of ONE slit of width a: sinc²(πa sinθ/λ). */
export function envelope(o: Optics, x: number): number {
  return sinc2((Math.PI * o.a * (x / o.L)) / o.lambda)
}

/** Phase difference between the two paths at screen position x: 2πd sinθ/λ. */
export function pathPhase(o: Optics, x: number): number {
  return (2 * Math.PI * o.d * (x / o.L)) / o.lambda
}

/**
 * Intensity with both slits open, in units where ONE open slit peaks at 1.
 *
 *   I(x) = 2 · envelope(x) · (1 + V cos δ)
 *
 * The factor 2 is not cosmetic: two open slits pass twice the light of one, and
 * ∫I_both = 2∫I_one across the screen precisely because ∫envelope·cos δ ≈ 0.
 * Normalising it away would delete the fact the hero figure is built on.
 *
 * `visibility` V is the fringe contrast (Imax−Imin)/(Imax+Imin). V = 1 is ideal
 * two-path interference, 4·envelope·cos²(δ/2); V = 0 is the classical sum of two
 * independent one-slit patterns. Everything between is what a partial which-path
 * measurement leaves behind — see `visibilityFrom` for where V comes from.
 */
export function intensityBoth(o: Optics, x: number, visibility = 1): number {
  return 2 * envelope(o, x) * (1 + visibility * Math.cos(pathPhase(o, x)))
}

/** Intensity with one slit blocked — the envelope alone, same units. */
export function intensityOne(o: Optics, x: number): number {
  return envelope(o, x)
}

// ---------------------------------------------------------------------------
// Fresnel diffraction of a single slit — valid at ANY Fresnel number, which is
// what lets one slider run from "a sharp shadow with a fringed edge" all the way
// to "a fan that has forgotten the slit". The Fraunhofer sinc² above is the
// a²/(λL) → 0 corner of this same integral; the ray-optics top hat is the
// a²/(λL) → ∞ corner. Neither is a separate theory.
//
//   U(x) ∝ ∫ exp(iπ(x−x′)²/(λL)) dx′  over the open aperture
//        = [C(v₂)−C(v₁)] + i[S(v₂)−S(v₁)],   v = (x′−x)√(2/(λL))
//
// with C, S the Fresnel integrals ∫₀ᵛ cos(πt²/2)dt and ∫₀ᵛ sin(πt²/2)dt.
// ---------------------------------------------------------------------------

// C and S are tabulated on |v| ≤ 8 by cumulative Simpson (both are odd, so half
// the range is stored), and continued beyond it by the standard asymptotic
// expansion. At the join the two agree to ~2e-4, which is a hundredth of a pixel
// on any screen this article draws.
const FRESNEL_MAX = 8
const FRESNEL_STEP = 0.0005
const FRESNEL_N = Math.round(FRESNEL_MAX / FRESNEL_STEP)

const { cTable, sTable } = (() => {
  const c = new Float64Array(FRESNEL_N + 1)
  const s = new Float64Array(FRESNEL_N + 1)
  const h = FRESNEL_STEP
  const f = (v: number) => Math.cos((Math.PI * v * v) / 2)
  const g = (v: number) => Math.sin((Math.PI * v * v) / 2)
  for (let i = 1; i <= FRESNEL_N; i++) {
    const v0 = (i - 1) * h
    const v1 = i * h
    const vm = (v0 + v1) / 2
    c[i] = c[i - 1] + (h / 6) * (f(v0) + 4 * f(vm) + f(v1))
    s[i] = s[i - 1] + (h / 6) * (g(v0) + 4 * g(vm) + g(v1))
  }
  return { cTable: c, sTable: s }
})()

/** Fresnel integral C(v) = ∫₀ᵛ cos(πt²/2) dt. Odd in v. */
export function fresnelC(v: number): number {
  const a = Math.abs(v)
  const sign = v < 0 ? -1 : 1
  if (a >= FRESNEL_MAX) {
    const t = (Math.PI * a * a) / 2
    return sign * (0.5 + Math.sin(t) / (Math.PI * a) - Math.cos(t) / (Math.PI * Math.PI * a * a * a))
  }
  const q = a / FRESNEL_STEP
  const i = Math.floor(q)
  return sign * (cTable[i] + (cTable[i + 1] - cTable[i]) * (q - i))
}

/** Fresnel integral S(v) = ∫₀ᵛ sin(πt²/2) dt. Odd in v. */
export function fresnelS(v: number): number {
  const a = Math.abs(v)
  const sign = v < 0 ? -1 : 1
  if (a >= FRESNEL_MAX) {
    const t = (Math.PI * a * a) / 2
    return sign * (0.5 - Math.cos(t) / (Math.PI * a) - Math.sin(t) / (Math.PI * Math.PI * a * a * a))
  }
  const q = a / FRESNEL_STEP
  const i = Math.floor(q)
  return sign * (sTable[i] + (sTable[i + 1] - sTable[i]) * (q - i))
}

/**
 * Intensity behind a single slit of width `a`, at any distance — 1 is the
 * unobstructed illumination, so a value near 1 means "the light is behaving
 * like a ray here" and the ripples above and below it are the wave arguing.
 */
export function fresnelSlitIntensity(o: Optics, a: number, x: number): number {
  const k = Math.sqrt(2 / (o.lambda * o.L))
  const v1 = (-a / 2 - x) * k
  const v2 = (a / 2 - x) * k
  const dc = fresnelC(v2) - fresnelC(v1)
  const ds = fresnelS(v2) - fresnelS(v1)
  return (dc * dc + ds * ds) / 2
}

/**
 * Englert's duality relation, saturated: for a pure state, path
 * distinguishability D and fringe visibility V obey V² + D² = 1.
 * (Englert, PRL 77, 2154 (1996); the inequality V² + D² ≤ 1 holds in general.)
 * The which-path figure moves D and reads the V this forces.
 */
export function visibilityFrom(distinguishability: number): number {
  const d = Math.min(1, Math.max(0, distinguishability))
  return Math.sqrt(Math.max(0, 1 - d * d))
}

// ---------------------------------------------------------------------------
// Sampling. A photon is not a little ball following a trajectory: the only
// thing the theory predicts is where it is likely to land. So the figures draw
// from the intensity — inverse-CDF over a fixed bin grid — and never place a
// dot by any other rule.
// ---------------------------------------------------------------------------

/** Deterministic PRNG (mulberry32), so Reset reproduces a run exactly. */
export function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Sampler {
  /** Draw a screen position, m, given a uniform u ∈ [0,1). */
  draw(u: number): number
  /** ∫I dx over the screen, in the same units as the intensity — how much
   *  light this configuration actually delivers. Two open slits deliver twice
   *  what one does, and the figures respect that rather than renormalising. */
  total: number
}

const BINS = 1024

/** Build an inverse-CDF sampler for an intensity profile over the screen. */
export function makeSampler(intensity: (x: number) => number, half = SCREEN_HALF): Sampler {
  const cdf = new Float64Array(BINS + 1)
  const dx = (2 * half) / BINS
  let acc = 0
  for (let i = 0; i < BINS; i++) {
    const x = -half + (i + 0.5) * dx
    acc += Math.max(0, intensity(x)) * dx
    cdf[i + 1] = acc
  }
  const total = acc
  return {
    total,
    draw(u: number): number {
      const target = u * total
      let lo = 0
      let hi = BINS
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cdf[mid + 1] < target) lo = mid + 1
        else hi = mid
      }
      // linear interpolation inside the winning bin
      const c0 = cdf[lo]
      const c1 = cdf[lo + 1]
      const f = c1 > c0 ? (target - c0) / (c1 - c0) : 0.5
      return -half + (lo + f) * dx
    },
  }
}

/**
 * Number of arrivals in one tick, drawn from a Poisson distribution of mean
 * `mean` (Knuth's method — fine for the small means these figures use).
 * Photon arrivals are Poisson; using a fixed count per tick would quietly
 * delete shot noise, which is the very thing that makes the dots look like
 * dots rather than like a fill pattern.
 */
export function poisson(mean: number, u: () => number): number {
  const limit = Math.exp(-mean)
  let k = 0
  let p = 1
  do {
    k++
    p *= u()
  } while (p > limit)
  return k - 1
}

// ---------------------------------------------------------------------------
// Constants for the quantum arithmetic the article actually prints.
// ---------------------------------------------------------------------------

export const PLANCK = 6.62607015e-34 // J·s, exact (SI 2019)
export const ELECTRON_CHARGE = 1.602176634e-19 // C, exact (SI 2019)
export const ELECTRON_MASS = 9.1093837015e-31 // kg
export const LIGHT_SPEED = 299792458 // m/s, exact

/** Photon energy in electron-volts for a frequency in Hz: E = hν. */
export const photonEnergyEv = (nu: number) => (PLANCK * nu) / ELECTRON_CHARGE

/** Frequency in Hz of a wavelength in m. */
export const freqOf = (lambda: number) => LIGHT_SPEED / lambda

/**
 * de Broglie wavelength, m, of an electron accelerated through `volts`.
 * Non-relativistic: p = √(2 m e V), λ = h/p. At 300 V the relativistic
 * correction is ~3e-4 — below anything this figure prints.
 */
export function deBroglieElectron(volts: number): number {
  const p = Math.sqrt(2 * ELECTRON_MASS * ELECTRON_CHARGE * volts)
  return PLANCK / p
}
