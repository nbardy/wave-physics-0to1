// Manufactured, area-preserving transport on the unit periodic square.
// Six sinusoidal shears followed by their inverses in reverse order. Each
// characteristic is exact: during an x shear y is constant, and vice versa.
// This prescribes velocity; it does not solve the momentum equation.
export const STROKE_STEPS = 24
export const STROKES = 6
export const TOTAL_STEPS = 2 * STROKES * STROKE_STEPS
export const RETURN_DT = 1 / 48
export const AMPLITUDE = .28
export const wrap = (x: number) => x - Math.floor(x)
export type Dye = { amber: Float64Array; rose: Float64Array }

export function stroke(step: number) {
  const part = Math.min(2 * STROKES - 1, Math.floor(step / STROKE_STEPS))
  const forward = part < STROKES
  const source = forward ? part : 2 * STROKES - 1 - part
  return { axis: source % 2 as 0 | 1, sign: forward ? 1 : -1, phase: .17 * Math.floor(source / 2) }
}

export function move(x: number, y: number, step: number, fraction = 1): [number, number] {
  const { axis, sign, phase } = stroke(step)
  const shift = fraction * sign * AMPLITUDE / STROKE_STEPS
  return axis === 0
    ? [wrap(x + shift * Math.sin(2 * Math.PI * (y + phase))), y]
    : [x, wrap(y + shift * Math.sin(2 * Math.PI * (x + phase)))]
}

// Apply one inverse per completed stroke, including the current partial stroke.
// This is the characteristic map, not interpolated grid state or playback data.
export function originAt(x: number, y: number, steps: number): [number, number] {
  const elapsed = Math.max(0, Math.min(TOTAL_STEPS, steps))
  // Each return stroke cancels its forward partner exactly. Evaluating the
  // surviving prefix avoids redundant trigonometry when sampling the reference.
  let remaining = Math.min(elapsed, TOTAL_STEPS - elapsed)
  while (remaining > 0) {
    const start = Math.floor((remaining - 1) / STROKE_STEPS) * STROKE_STEPS
    ;[x, y] = move(x, y, start, -(remaining - start))
    remaining = start
  }
  return [x, y]
}

export function initialDye(x: number, y: number): [number, number] {
  // Smooth compact discs avoid giving a discontinuous edge an unfair sampling
  // advantage; colours are passive concentrations, not separate fluids.
  const disc = (cx: number, cy: number) => {
    const d = Math.hypot(x - cx, y - cy), inner = .11, outer = .14
    return d < inner ? 1 : d >= outer ? 0 : .5 * (1 + Math.cos(Math.PI * (d - inner) / (outer - inner)))
  }
  return [disc(.34, .42), disc(.64, .59)]
}

export function exactDye(n: number, steps: number): Dye {
  const amber = new Float64Array(n * n), rose = amber.slice()
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const [x, y] = originAt((i + .5) / n, (j + .5) / n, steps)
    ;[amber[i + j * n], rose[i + j * n]] = initialDye(x, y)
  }
  return { amber, rose }
}

export function advectShear(a: Float64Array, n: number, step: number): Float64Array {
  const out = new Float64Array(a.length)
  const { axis, sign, phase } = stroke(step)
  // Linear semi-Lagrangian interpolation: convex weights keep values in the
  // input range for any displacement (no CFL stability restriction). Each row
  // or column shifts uniformly, so its sum is also conserved to roundoff HERE;
  // that conservation does not hold for arbitrary bilinear velocity fields.
  for (let row = 0; row < n; row++) {
    const shift = sign * AMPLITUDE / STROKE_STEPS * n * Math.sin(2 * Math.PI * ((row + .5) / n + phase))
    for (let col = 0; col < n; col++) {
      const departure = col - shift, lo = Math.floor(departure), t = departure - lo
      const left = (lo % n + n) % n, right = (left + 1) % n
      const k = axis === 0 ? col + row * n : row + col * n
      const a0 = axis === 0 ? left + row * n : row + left * n
      const a1 = axis === 0 ? right + row * n : row + right * n
      out[k] = a[a0] * (1 - t) + a[a1] * t
    }
  }
  return out
}

export function returnFrames(n: number, interval = 4) {
  let dye = exactDye(n, 0)
  const frames: Dye[] = [dye]
  for (let step = 0; step < TOTAL_STEPS; step++) {
    dye = { amber: advectShear(dye.amber, n, step), rose: advectShear(dye.rose, n, step) }
    if ((step + 1) % interval === 0) frames.push(dye)
  }
  return frames
}

export function returnError(dye: Dye, n: number): number {
  const exact = exactDye(n, TOTAL_STEPS)
  let difference = 0, initial = 0
  for (let k = 0; k < n * n; k++) {
    difference += Math.abs(dye.amber[k] - exact.amber[k]) + Math.abs(dye.rose[k] - exact.rose[k])
    initial += exact.amber[k] + exact.rose[k]
  }
  return difference / initial
}
