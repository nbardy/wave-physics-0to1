import { NX, NY } from './wing'
import { createWingProjector, ui, vi, type FaceFlow } from './pressure'
export { ui, vi, type FaceFlow } from './pressure'

// One discrete pressure projection, not a time-dependent Navier–Stokes solve.
// Face-centred (MAC) velocities make divergence and pressure gradient an exact
// operator pair. Solid faces and channel walls carry zero normal flux; the
// left inlet is fixed and the right outlet has p=0. Solve -L p = -div(u*).
// Incomplete-Cholesky-preconditioned conjugate gradients stop on a measured residual.
export const FLOW_SPEED = 28
export interface FluxBox { left: number; right: number; top: number; bottom: number }
export const PROBE: FluxBox = { left: 34, right: 64, top: 35, bottom: 49 }
export interface Projection {
  before: FaceFlow
  after: FaceFlow
  pressure: Float64Array
  solid: Uint8Array
  relativeResidual: number
  iterations: number
}
export function projectWingFlow(): Projection {
  const projector = createWingProjector()
  const before: FaceFlow = { u: new Float64Array((NX + 1) * NY), v: new Float64Array(NX * (NY + 1)) }
  for (let k = 0; k < before.u.length; k++) before.u[k] = projector.freeU[k] ? FLOW_SPEED : 0
  const after: FaceFlow = { u: before.u.slice(), v: before.v.slice() }
  const result = projector.project(after)
  return { before, after, pressure: projector.pressure, solid: projector.solid, ...result }
}

export function boxFlux(flow: FaceFlow, box = PROBE) {
  const faces = [0, 0, 0, 0] // signed OUTWARD: left, right, top, bottom
  for (let y = box.top; y < box.bottom; y++) {
    faces[0] -= flow.u[ui(box.left, y)]
    faces[1] += flow.u[ui(box.right, y)]
  }
  for (let x = box.left; x < box.right; x++) {
    faces[2] -= flow.v[vi(x, box.top)]
    faces[3] += flow.v[vi(x, box.bottom)]
  }
  // Sum flux face by face, so counterflows on one side never cancel first.
  let incoming = 0, outgoing = 0
  const add = (q: number) => { if (q > 0) outgoing += q; else incoming -= q }
  for (let y = box.top; y < box.bottom; y++) { add(-flow.u[ui(box.left, y)]); add(flow.u[ui(box.right, y)]) }
  for (let x = box.left; x < box.right; x++) { add(-flow.v[vi(x, box.top)]); add(flow.v[vi(x, box.bottom)]) }
  return { faces, incoming, outgoing, ratio: outgoing / incoming }
}

export function blendFlow(projection: Projection, amount: number, out: FaceFlow): void {
  for (const name of ['u', 'v'] as const) for (let k = 0; k < out[name].length; k++) {
    out[name][k] = projection.before[name][k] + amount * (projection.after[name][k] - projection.before[name][k])
  }
}
export function sampleFlow(flow: FaceFlow, x: number, y: number) {
  const sample = (a: Float64Array, w: number, h: number, px: number, py: number) => {
    px = Math.max(0, Math.min(w - 1.001, px)); py = Math.max(0, Math.min(h - 1.001, py))
    const i = Math.floor(px), j = Math.floor(py), tx = px - i, ty = py - j, k = i + j * w
    return (1 - ty) * ((1 - tx) * a[k] + tx * a[k + 1]) + ty * ((1 - tx) * a[k + w] + tx * a[k + w + 1])
  }
  return { x: sample(flow.u, NX + 1, NY, x, y - 0.5), y: sample(flow.v, NX, NY + 1, x - 0.5, y) }
}
