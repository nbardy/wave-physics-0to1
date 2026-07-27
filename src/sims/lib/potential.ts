// Analytic potential flow past a circular cylinder (uniform stream + doublet).
// This is the *ideal fluid* of d'Alembert (1752) and Euler (1757): no viscosity,
// no separation, and — the point of lesson 03 §5 — exactly zero drag. We use the
// closed-form solution rather than the numerical solver because the marquee
// reading "0.000" must be genuine cancellation, not a solver coincidentally
// close to zero. The swap is confessed in prose where the two share a section.

export interface Vec2 {
  x: number
  y: number
}

/**
 * Velocity of the uniform-stream-plus-doublet field at (x, y) for a cylinder of
 * radius R centered at (cx, cy), free stream U in +x. Standard result:
 *   u = U (1 − R² (dx² − dy²) / r⁴),  v = −2 U R² dx dy / r⁴
 * On the surface r = R the radial component vanishes (the wall is a streamline);
 * far away the flow is (U, 0). Inside the cylinder we return zero.
 */
export function potentialVelocity(
  x: number,
  y: number,
  cx: number,
  cy: number,
  R: number,
  U: number,
): Vec2 {
  const dx = x - cx
  const dy = y - cy
  const r2 = dx * dx + dy * dy
  if (r2 < R * R) return { x: 0, y: 0 }
  const r4 = r2 * r2
  const k = (R * R) / r4
  return { x: U * (1 - k * (dx * dx - dy * dy)), y: -U * (2 * k * dx * dy) }
}

/**
 * Surface pressure coefficient at surface angle θ: slip speed on the wall is
 * 2U|sin θ|, so Bernoulli gives Cp = 1 − 4 sin²θ.
 * Fore-aft symmetric: Cp(θ) = Cp(π − θ). That symmetry IS the paradox.
 *
 * ANGLE CONVENTION (subtle — it used to only be documented as "from the upstream
 * nose", which is harmless here but wrong for anything that needs a sign): θ is
 * the ordinary polar angle of the surface point measured from +x, the downstream
 * direction, so the surface point is (cx + R cos θ, cy + R sin θ) and the OUTWARD
 * normal is (cos θ, sin θ). Cp itself can't tell the two conventions apart —
 * it's symmetric — but `pressureDragOverArc` below can, because cos θ flips sign
 * between them. Measure θ from +x.
 */
export function surfaceCp(theta: number): number {
  const s = Math.sin(theta)
  return 1 - 4 * s * s
}

/**
 * The streamwise load per radian at one surface station — the integrand every
 * integral below shares, defined exactly once so no caller can re-derive it
 * slightly differently:
 *   f(θ) = −p(θ) cos θ · R
 * Pressure pushes along the inward normal, so the force on the body is
 * −∮ p n̂ ds; with n̂ = (cos θ, sin θ) its x-component carries the minus sign.
 * Positive = downstream (+x), negative = upstream.
 */
function streamwiseLoad(pAt: (theta: number) => number, theta: number, R: number): number {
  return -pAt(theta) * Math.cos(theta) * R
}

/**
 * Streamwise pressure force per unit span over an ARC of the cylinder, by
 * midpoint quadrature:
 *   D(θ₀,θ₁) = ∫_{θ₀}^{θ₁} f(θ) dθ
 *
 * `pressureDrag` is the full circle. Because every integral here is the same
 * midpoint rule over the same integrand, an arc pair with `samples` each lands
 * on exactly the same abscissae as the full circle with `2 · samples` — so the
 * parts and the whole agree to floating-point noise, and that agreement is
 * arithmetic, not an assertion.
 */
export function pressureDragOverArc(
  pAt: (theta: number) => number,
  R: number,
  theta0: number,
  theta1: number,
  samples: number,
): number {
  let drag = 0
  const dTheta = (theta1 - theta0) / samples
  for (let i = 0; i < samples; i++) {
    drag += streamwiseLoad(pAt, theta0 + (i + 0.5) * dTheta, R) * dTheta
  }
  return drag
}

/** The rim partitioned by which way its pressure load pulls the body. */
export interface DragBySign {
  /** Total of the stations that push the body downstream (+x). Non-negative. */
  downstream: number
  /** Total of the stations that pull it upstream (−x). Non-positive. */
  upstream: number
}

/**
 * The full circle partitioned by the SIGN of the local streamwise load, rather
 * than by geometry: every station on the rim is counted exactly once, into
 * whichever bucket its own contribution belongs. `downstream + upstream` is
 * therefore the same quantity `pressureDrag` returns, computed a different way.
 *
 * For `surfaceCp` the partition boundaries are the four points where Cp changes
 * sign, |sin θ| = 1/2 (θ = 30°, 150°, 210°, 330°) — Cp itself is what flips, so
 * the buckets are "pressed nose cap and sucked downstream shoulders" against
 * "pressed tail cap and sucked upstream shoulders". Take `samples` fine enough
 * that a straddling cell's mis-assignment stays negligible: the integrand is
 * continuous through those crossings, so the error there is O(h²).
 */
export function pressureDragBySign(
  pAt: (theta: number) => number,
  R: number,
  samples: number,
): DragBySign {
  let downstream = 0
  let upstream = 0
  const dTheta = (2 * Math.PI) / samples
  for (let i = 0; i < samples; i++) {
    const contribution = streamwiseLoad(pAt, (i + 0.5) * dTheta, R) * dTheta
    if (contribution >= 0) downstream += contribution
    else upstream += contribution
  }
  return { downstream, upstream }
}

/**
 * Drag per unit span from a surface-pressure sampler: the full-circle case of
 * `pressureDragOverArc`. For `surfaceCp` this integrates to zero analytically;
 * the quadrature returns ~1e-15. The meter that displays this value is computing
 * it, not asserting it — feed it any other pressure distribution and it will
 * happily read nonzero.
 */
export function pressureDrag(pAt: (theta: number) => number, R: number, samples = 256): number {
  return pressureDragOverArc(pAt, R, 0, 2 * Math.PI, samples)
}
