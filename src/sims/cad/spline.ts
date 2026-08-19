// B-spline and NURBS machinery for the CAD lesson: the Cox–de Boor recurrence,
// exact knot insertion, and the rational projection that turns a polynomial
// basis into one that can hold a circle.
//
// Ported from the standalone `cad-primitives-explainer` project (archived under
// `articles/cad/01-cad-primitives/source/`), which computed the same quantities
// in untyped JS. The numbers here are load-bearing: `scripts/check-cad.ts`
// asserts partition of unity and that one knot insertion moves the curve by
// less than 1e-11, so a regression in this file fails loudly rather than
// producing a figure that merely looks spline-ish.

export type Vec2 = readonly [number, number]

/**
 * The finite coordinates of a spline: control points, degree, and the knot
 * vector that says where the polynomial pieces join.
 *
 * Every knot vector this module produces or accepts is **clamped** (open
 * uniform): the first and last knots carry multiplicity `degree + 1`, so the
 * curve starts at the first control point and ends at the last. `basisValues`
 * relies on that — see the note there.
 */
export interface Spline {
  readonly points: readonly Vec2[]
  readonly degree: number
  readonly knots: readonly number[]
}

/**
 * The lesson's central distinction, encoded as a sum type rather than a
 * weights-may-be-absent flag: a polynomial B-spline and a rational NURBS are
 * two different objects that happen to share a basis. Dispatch picks the
 * handler; neither handler ever asks what it is holding.
 */
export type Curve =
  | { readonly kind: 'polynomial'; readonly spline: Spline }
  | { readonly kind: 'rational'; readonly spline: Spline; readonly weights: readonly number[] }

/** One evaluation of a curve, with the coefficients that produced it. */
export interface Sample {
  /** The point on the curve at `u`. */
  readonly point: Vec2
  /** The polynomial basis N_{i,p}(u) — always the Cox–de Boor values. */
  readonly basis: readonly number[]
  /**
   * The coefficients actually multiplying each control point. For a polynomial
   * curve these are `basis`; for a rational curve they are the normalized
   * R_{i,p}(u) = N_i w_i / Σ N_j w_j. Both sum to one, which is why both curves
   * are averages of their control points and stay inside the hull.
   */
  readonly weightedBasis: readonly number[]
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/**
 * A clamped, uniformly spaced knot vector for `count` control points of the
 * given degree. Throws rather than repairing: a spline with fewer than
 * `degree + 1` control points is not a spline with a fallback, it is a caller
 * bug.
 */
export function openUniformKnots(count: number, degree: number): number[] {
  if (!Number.isInteger(count) || !Number.isInteger(degree)) {
    throw new TypeError('count and degree must be integers')
  }
  if (count < degree + 1) {
    throw new RangeError(`a degree-${degree} spline needs at least ${degree + 1} control points`)
  }
  const knotCount = count + degree + 1
  const knots = new Array<number>(knotCount).fill(0)
  const interior = count - degree - 1
  for (let i = 1; i <= interior; i += 1) knots[degree + i] = i / (interior + 1)
  for (let i = knotCount - degree - 1; i < knotCount; i += 1) knots[i] = 1
  return knots
}

/** The knot span containing `u` — the index `s` with u ∈ [k_s, k_{s+1}). */
export function findSpan(count: number, degree: number, knots: readonly number[], u: number): number {
  const n = count - 1
  if (u >= knots[n + 1]) return n
  if (u <= knots[degree]) return degree
  let low = degree
  let high = n + 1
  let mid = Math.floor((low + high) / 2)
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid
    else low = mid
    mid = Math.floor((low + high) / 2)
  }
  return mid
}

/** How many times `u` already appears in the knot vector. */
export function multiplicity(knots: readonly number[], u: number, eps = 1e-8): number {
  let m = 0
  for (const k of knots) if (Math.abs(k - u) <= eps) m += 1
  return m
}

/**
 * All `count` basis functions N_{i,p}(u), by the Cox–de Boor recurrence.
 *
 * The array is only `count` long, not `count + degree`, so the recurrence reads
 * a zero where N_{count,p−1} would be. That is exact for clamped knot vectors —
 * the dropped functions live on the repeated end knots, which are zero-length
 * spans — and wrong for a periodic one. This module only builds clamped
 * vectors, and `scripts/check-cad.ts` asserts the values sum to 1 across the
 * domain, which is the property that would break first if that ever changed.
 */
export function basisValues(
  count: number,
  degree: number,
  knots: readonly number[],
  uRaw: number,
): number[] {
  const u = clamp(uRaw, knots[degree], knots[count])
  const values = new Array<number>(count).fill(0)
  const atEnd = Math.abs(u - knots[count]) < 1e-10

  for (let i = 0; i < count; i += 1) {
    const inSpan = knots[i] <= u && u < knots[i + 1]
    values[i] = inSpan || (atEnd && i === count - 1) ? 1 : 0
  }

  for (let p = 1; p <= degree; p += 1) {
    const next = new Array<number>(count).fill(0)
    for (let i = 0; i < count; i += 1) {
      const dLeft = knots[i + p] - knots[i]
      const dRight = knots[i + p + 1] - knots[i + 1]
      // 0/0 terms are defined to be 0 — the standard convention, and the reason
      // repeated knots drop continuity instead of producing NaN.
      const left = dLeft === 0 ? 0 : ((u - knots[i]) / dLeft) * values[i]
      const right =
        dRight === 0 || i + 1 >= count ? 0 : ((knots[i + p + 1] - u) / dRight) * values[i + 1]
      next[i] = left + right
    }
    for (let i = 0; i < count; i += 1) values[i] = next[i]
  }
  return values
}

function evalPolynomial(spline: Spline, u: number): Sample {
  const basis = basisValues(spline.points.length, spline.degree, spline.knots, u)
  let x = 0
  let y = 0
  for (let i = 0; i < spline.points.length; i += 1) {
    x += basis[i] * spline.points[i][0]
    y += basis[i] * spline.points[i][1]
  }
  return { point: [x, y], basis, weightedBasis: basis }
}

function evalRational(spline: Spline, weights: readonly number[], u: number): Sample {
  const basis = basisValues(spline.points.length, spline.degree, spline.knots, u)
  let x = 0
  let y = 0
  let denom = 0
  for (let i = 0; i < spline.points.length; i += 1) {
    const wb = basis[i] * weights[i]
    denom += wb
    x += wb * spline.points[i][0]
    y += wb * spline.points[i][1]
  }
  // Weights are positive by construction (`makeRational` rejects otherwise) and
  // the basis is a partition of unity, so the denominator cannot vanish. If it
  // does, the invariant broke upstream and we want to know, not to limp on.
  if (!(Math.abs(denom) > 1e-12)) {
    throw new RangeError('rational denominator vanished — weights are no longer positive')
  }
  const weightedBasis = basis.map((n, i) => (n * weights[i]) / denom)
  return { point: [x / denom, y / denom], basis, weightedBasis }
}

/** The thin dispatcher: pick the handler, do no work here. */
export function evaluate(curve: Curve, u: number): Sample {
  switch (curve.kind) {
    case 'polynomial':
      return evalPolynomial(curve.spline, u)
    case 'rational':
      return evalRational(curve.spline, curve.weights, u)
  }
}

/** Build a rational curve, rejecting the weights that would make it degenerate. */
export function makeRational(spline: Spline, weights: readonly number[]): Curve {
  if (weights.length !== spline.points.length) {
    throw new RangeError('one weight per control point')
  }
  for (const w of weights) {
    if (!(w > 0)) throw new RangeError('NURBS weights must be strictly positive')
  }
  return { kind: 'rational', spline, weights }
}

export function polygonal(spline: Spline): Curve {
  return { kind: 'polynomial', spline }
}

/** `samples + 1` points along the curve, endpoints included. */
export function sampleCurve(curve: Curve, samples = 200): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i += 1) out.push(evaluate(curve, i / samples).point)
  return out
}

/**
 * The result of asking for one more knot. `saturated` is not an error and not a
 * silently-unchanged spline: it is the honest answer that `u` already carries
 * multiplicity `p + 1`, so no further coordinate exists there to hand out.
 */
export type Refinement =
  | { readonly kind: 'refined'; readonly spline: Spline }
  | { readonly kind: 'saturated'; readonly spline: Spline }

/**
 * Boehm's exact single knot insertion. The control-point count goes up by one
 * and the represented curve does not move — the new points are convex
 * combinations of adjacent old ones, so the change is one of coordinates, not
 * of shape.
 */
export function insertKnot(spline: Spline, uRaw: number): Refinement {
  const { points, degree, knots } = spline
  const u = clamp(uRaw, 0, 1)
  const n = points.length - 1
  const m = knots.length - 1
  const span = findSpan(points.length, degree, knots, u)
  const mult = multiplicity(knots, u)

  if (mult >= degree + 1) return { kind: 'saturated', spline }

  const newPoints = new Array<Vec2>(points.length + 1)
  const newKnots = new Array<number>(knots.length + 1)

  for (let i = 0; i <= span; i += 1) newKnots[i] = knots[i]
  newKnots[span + 1] = u
  for (let i = span + 1; i <= m; i += 1) newKnots[i + 1] = knots[i]

  for (let i = 0; i <= span - degree; i += 1) newPoints[i] = points[i]
  for (let i = span - mult; i <= n; i += 1) newPoints[i + 1] = points[i]
  for (let i = span - degree + 1; i <= span - mult; i += 1) {
    const d = knots[i + degree] - knots[i]
    const a = d === 0 ? 0 : (u - knots[i]) / d
    newPoints[i] = [
      a * points[i][0] + (1 - a) * points[i - 1][0],
      a * points[i][1] + (1 - a) * points[i - 1][1],
    ]
  }

  return { kind: 'refined', spline: { points: newPoints, degree, knots: newKnots } }
}

/** Largest sampled distance between two curves — the honesty meter for refinement. */
export function maxDeviation(a: Curve, b: Curve, samples = 400): number {
  let worst = 0
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples
    const p = evaluate(a, u).point
    const q = evaluate(b, u).point
    worst = Math.max(worst, Math.hypot(p[0] - q[0], p[1] - q[1]))
  }
  return worst
}

/**
 * The exact quarter circle: a degree-2 rational curve on three control points
 * with the middle weight at √2/2. No polynomial B-spline of any degree can do
 * this — that inability is the whole reason NURBS exist.
 */
export const QUARTER_CIRCLE: Curve = makeRational(
  {
    points: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    degree: 2,
    knots: [0, 0, 0, 1, 1, 1],
  },
  [1, Math.SQRT1_2, 1],
)

/** Worst |‖C(u)‖ − 1| over the domain — how far a curve is from the unit circle. */
export function radiusError(curve: Curve, samples = 400): number {
  let worst = 0
  for (let i = 0; i <= samples; i += 1) {
    const [x, y] = evaluate(curve, i / samples).point
    worst = Math.max(worst, Math.abs(Math.hypot(x, y) - 1))
  }
  return worst
}
