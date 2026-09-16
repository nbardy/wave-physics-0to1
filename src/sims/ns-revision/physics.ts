// Experiments used only by version II. Units and limitations are stated beside
// each model; the baseline simulations do not depend on this module.
export const PARCEL_END = 1.2
export const channelHalfWidth = (x: number) => .7 / (1 + x)
export const channelVelocity = (x: number, y: number) => [1 + x, -y] as const
export const parcelAt = (t: number) => ({ x: 1.05 * Math.exp(t) - 1, y: .24 * Math.exp(-t) })
// x,y in metres and t in seconds: u=(1+x,-y) with the dimensional coefficient
// 1/s suppressed. div u=1-1=0. Walls y=±.7/(1+x) are streamlines, with slip.
// Analytic trajectories have no timestep or numerical stability restriction.

export function layerMotion(nu: number, time = 2, n = 32) {
  const initial: number[] = Array.from({ length: n }, (_, i) => i >= n * .375 && i < n * .625 ? 1 : 0)
  let velocity = initial.slice()
  const travel = initial.map(() => 0)
  // Unit layer spacing; explicit diffusion alpha <= .2 < 1/2. Fixed physics
  // substeps, never RAF time. Trapezoidal integration measures displacement.
  const count = Math.max(1, Math.ceil(time * Math.max(200, nu / .2))), dt = time / count
  for (let s = 0; s < count; s++) {
    const next = velocity.map((v, i) => i === 0 || i === n - 1 ? 0 : v + nu * dt * (velocity[i - 1] - 2 * v + velocity[i + 1]))
    for (let i = 0; i < n; i++) travel[i] += .5 * dt * (velocity[i] + next[i])
    velocity = next
  }
  return { initial, velocity, travel }
}

// Periodic square, side L=1 m. v=U; the initial horizontal shear is
// u=U sin(2πy). NS reduces exactly to u_t + U u_y = nu u_yy; p is constant.
// All panes start with the same u/U. This is a laminar similarity experiment,
// not a turbulence model. The exact function is used only in independent checks.
export function exactShear(y: number, time: number, speed: number, nu: number) {
  return speed * Math.sin(2 * Math.PI * (y - speed * time)) * Math.exp(-4 * Math.PI ** 2 * nu * time)
}
export function shearFlow(speed: number, nu: number, tau: number, n = 48) {
  let u = Array.from({ length: n }, (_, i) => speed * Math.sin(2 * Math.PI * (i + .5) / n))
  const time = tau / speed
  // Centred space + RK4. These conservative bounds keep both the imaginary
  // advection spectrum and negative diffusion spectrum inside RK4's stability
  // region: U*dt/dy <= .1, nu*dt/dy² <= .1, their sum <= .1.
  const count = Math.max(1, Math.ceil(time * (speed * n + nu * n * n) / .1)), dt = time / count
  const rhs = (a: number[]) => a.map((v, i) => {
    const left = a[(i + n - 1) % n], right = a[(i + 1) % n]
    return -speed * n * .5 * (right - left) + nu * n * n * (left - 2 * v + right)
  })
  for (let s = 0; s < count; s++) {
    const a = rhs(u), b = rhs(u.map((v, i) => v + .5 * dt * a[i]))
    const c = rhs(u.map((v, i) => v + .5 * dt * b[i])), d = rhs(u.map((v, i) => v + dt * c[i]))
    u = u.map((v, i) => v + dt / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i]))
  }
  return { u, speed, nu, time, re: speed / nu }
}
export function similarity(factor: number, tau: number, n = 48) {
  return [shearFlow(1, .05, tau, n), shearFlow(factor, .05 * factor, tau, n), shearFlow(factor, .05, tau, n)]
}

// Synthetic Newtonian liquid at a fixed temperature; all values SI. The plate
// reading is calculated, not measured data. Infer mu from Fh/(AU), then pass that
// SAME value to a separate geometry. Infinite-plate / fully developed pipe limits.
export const APPARATUS = { mu: .1, density: 1000, gap: .001, area: .01, radius: .001, length: .1, pressure: 1000, interval: 10 } as const
export const plateForce = (speed: number) => APPARATUS.mu * APPARATUS.area * speed / APPARATUS.gap
export const inferViscosity = (force: number, speed: number) => force * APPARATUS.gap / (APPARATUS.area * speed)
// Navier slip: u(R)=-b du/dr|R. Lauga & Stone (2003), eqs 2.6–2.7:
// https://www.damtp.cam.ac.uk/user/lauga/papers/4.pdf
export const pipeVelocity = (r: number, radius: number, mu: number, slip = 0) => APPARATUS.pressure / (4 * mu * APPARATUS.length) * (radius * radius - r * r + 2 * slip * radius)
export const pipeFlux = (radius: number, mu: number, slip = 0) => Math.PI * APPARATUS.pressure * radius ** 4 / (8 * mu * APPARATUS.length) * (1 + 4 * slip / radius)
export function pipeComparison(count: number, mu: number, slip: number, time: number) {
  const radius = APPARATUS.radius / Math.sqrt(count)
  const reference = pipeFlux(APPARATUS.radius, mu)
  const bundle = count * pipeFlux(radius, mu, slip)
  return { radius, reference, bundle, referenceVolume: reference * time, bundleVolume: bundle * time }
}
