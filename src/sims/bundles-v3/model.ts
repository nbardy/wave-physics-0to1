export const TAU = 2 * Math.PI
export function screenIntensity(s: number, flux: number) {
  return Math.exp(-2.6 * s * s) * (1 + Math.cos(6 * Math.PI * s + TAU * flux)) / 2
}
// Symmetric exterior gauge: line-integral phase on the two oriented semicircles.
// Positive enclosed flux uses the into-screen normal, so the upper route from
// left to right followed by the reverse lower route is positively oriented.
// χ(t)=g[t + .65 sin(πt)] is an explicit local change of phase coordinates.
// It contributes χ(t)−χ(0) on either route; endpoints cancel in interference.
export function routePhase(t: number, branch: 1 | -1, flux: number, gauge = 0) {
  return branch * Math.PI * flux * t + gauge * (t + .65 * Math.sin(Math.PI * t))
}
export function endpointIntensity(s: number, flux: number, gauge: number) {
  const relative = routePhase(1, 1, flux, gauge) - routePhase(1, -1, flux, gauge)
  return Math.exp(-2.6 * s * s) * (1 + Math.cos(6 * Math.PI * s + relative)) / 2
}
