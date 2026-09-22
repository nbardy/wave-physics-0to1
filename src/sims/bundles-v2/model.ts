export const TAU = 2 * Math.PI
export function intensity(phase: number) { return (1 + Math.cos(phase)) / 2 }
export function gaugeSample(gauge: number) {
  const theta = [0.2, 0.65, 1.1, 0.85, 0.35]
  const alpha = theta.map((_, i) => gauge * Math.sin(i * 1.3))
  const links = [0.15, 0.15, 0.15, 0.15]
  const phase = theta.map((t, i) => t + alpha[i])
  const transport = links.map((u, i) => u + alpha[i + 1] - alpha[i])
  const naive = phase.slice(1).map((t, i) => 2 - 2 * Math.cos(t - phase[i]))
  const covariant = phase.slice(1).map((t, i) => 2 - 2 * Math.cos(t - phase[i] - transport[i]))
  return { phase, transport, alpha, naive, covariant }
}
export function loopSample(flux: number, gauge: number) {
  const alpha = [0, gauge, -0.6 * gauge, 0.3 * gauge]
  const links = alpha.map((a, i) => flux / 4 + alpha[(i + 1) % 4] - a)
  return { alpha, links, phase: links.reduce((a, b) => a + b, 0) }
}

export const WAVE_N = 320
export const WAVE_LENGTH = 12
export const WAVE_DT = 1 / 120
const DX = WAVE_LENGTH / WAVE_N
// c = 1. Centered-space Maxwell + RK4: dt/dx <= 2 sqrt(2), here 2/9.
// Periodic boundaries; temporal integration uses fixed steps independent of RAF.
export function pulse(x: number) {
  const d = ((x - 3 + WAVE_LENGTH * 1.5) % WAVE_LENGTH) - WAVE_LENGTH / 2
  return Math.exp(-d * d / 0.4)
}
export function createMaxwellModel() {
  let e = Float64Array.from({ length: WAVE_N }, (_, i) => pulse(i * DX))
  let b = e.slice()
  let time = 0, acc = 0
  const rhs = (a: Float64Array, other: Float64Array) => a.map((_, i) =>
    -(other[(i + 1) % WAVE_N] - other[(i + WAVE_N - 1) % WAVE_N]) / (2 * DX))
  const plus = (a: Float64Array, k: Float64Array, s: number) => a.map((v, i) => v + s * k[i])
  return {
    advance(dt: number) {
      acc += dt
      while (acc + 1e-12 >= WAVE_DT) {
        const h = WAVE_DT
        const e1 = rhs(e, b), b1 = rhs(b, e)
        const e2 = rhs(e, plus(b, b1, h / 2)), b2 = rhs(b, plus(e, e1, h / 2))
        const e3 = rhs(e, plus(b, b2, h / 2)), b3 = rhs(b, plus(e, e2, h / 2))
        const e4 = rhs(e, plus(b, b3, h)), b4 = rhs(b, plus(e, e3, h))
        e = e.map((v, i) => v + h * (e1[i] + 2 * e2[i] + 2 * e3[i] + e4[i]) / 6)
        b = b.map((v, i) => v + h * (b1[i] + 2 * b2[i] + 2 * b3[i] + b4[i]) / 6)
        time += h; acc -= h
      }
    },
    read: () => ({ e: e.slice(), b: b.slice(), time }),
  }
}
