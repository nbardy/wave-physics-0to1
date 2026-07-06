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
 * Surface pressure coefficient at angle θ (measured from the upstream nose):
 * slip speed on the wall is 2U sin θ, so Bernoulli gives Cp = 1 − 4 sin²θ.
 * Fore-aft symmetric: Cp(θ) = Cp(π − θ). That symmetry IS the paradox.
 */
export function surfaceCp(theta: number): number {
  const s = Math.sin(theta)
  return 1 - 4 * s * s
}

/**
 * Drag per unit span from a surface-pressure sampler, by numerical quadrature:
 *   D = −∮ p n̂·x̂ ds = −∫₀^{2π} p(θ) cos θ · R dθ
 * For `surfaceCp` this integrates to zero analytically; the quadrature returns
 * ~1e-16. The meter that displays this value is computing it, not asserting it —
 * feed it any other pressure distribution and it will happily read nonzero.
 */
export function pressureDrag(pAt: (theta: number) => number, R: number, samples = 256): number {
  let drag = 0
  const dTheta = (2 * Math.PI) / samples
  for (let i = 0; i < samples; i++) {
    const theta = (i + 0.5) * dTheta
    drag += -pAt(theta) * Math.cos(theta) * R * dTheta
  }
  return drag
}
