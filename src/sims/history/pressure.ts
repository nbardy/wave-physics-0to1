import { NX, NY, inside } from './wing'

export interface FaceFlow { u: Float64Array; v: Float64Array }
export const ui = (x: number, y: number) => x + y * (NX + 1)
export const vi = (x: number, y: number) => x + y * NX

// MAC divergence and gradient are an exact operator pair. Fixed inlet flux,
// impermeable solid faces / channel walls, p=0 at the open outlet. IC(0)-PCG
// solves the fluid-cell graph Laplacian to a measured residual, reusing pressure
// between steps. This is an elliptic solve; no timestep stability condition.
export function createWingProjector(nx = NX, ny = NY, spacing = 1) {
  const NX = nx, NY = ny
  const ui = (x: number, y: number) => x + y * (NX + 1)
  const vi = (x: number, y: number) => x + y * NX
  const n = NX * NY, solid = new Uint8Array(n)
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) solid[x + y * NX] = inside((x + .5) * spacing, (y + .5) * spacing) ? 1 : 0
  const freeU = new Uint8Array((NX + 1) * NY), freeV = new Uint8Array(NX * (NY + 1))
  for (let y = 0; y < NY; y++) for (let x = 0; x <= NX; x++)
    freeU[ui(x, y)] = !((x > 0 && solid[x - 1 + y * NX]) || (x < NX && solid[x + y * NX])) ? 1 : 0
  for (let y = 1; y < NY; y++) for (let x = 0; x < NX; x++)
    freeV[vi(x, y)] = !solid[x + (y - 1) * NX] && !solid[x + y * NX] ? 1 : 0
  const diagonal = new Float64Array(n), factor = new Float64Array(n)
  const west = new Int32Array(n).fill(-1), east = west.slice(), north = west.slice(), south = west.slice()
  const cells: number[] = []
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const k = x + y * NX
    if (solid[k]) continue
    cells.push(k)
    if (x > 0 && !solid[k - 1]) { west[k] = k - 1; diagonal[k]++ }
    if (x < NX - 1 && !solid[k + 1]) { east[k] = k + 1; diagonal[k]++ }
    if (y > 0 && !solid[k - NX]) { north[k] = k - NX; diagonal[k]++ }
    if (y < NY - 1 && !solid[k + NX]) { south[k] = k + NX; diagonal[k]++ }
    if (x === NX - 1) diagonal[k]++
    factor[k] = diagonal[k] - (west[k] >= 0 ? 1 / factor[west[k]] : 0) - (north[k] >= 0 ? 1 / factor[north[k]] : 0)
  }
  const rhs = new Float64Array(n), residual = rhs.slice(), direction = rhs.slice(), z = rhs.slice(), product = rhs.slice(), pressure = rhs.slice()
  const apply = (a: Float64Array, out: Float64Array) => {
    for (const k of cells) out[k] = diagonal[k] * a[k] - (west[k] >= 0 ? a[west[k]] : 0) - (east[k] >= 0 ? a[east[k]] : 0) - (north[k] >= 0 ? a[north[k]] : 0) - (south[k] >= 0 ? a[south[k]] : 0)
  }
  const dot = (a: Float64Array, b: Float64Array) => { let v = 0; for (const k of cells) v += a[k] * b[k]; return v }
  const precondition = () => {
    for (const k of cells) z[k] = residual[k] + (west[k] >= 0 ? z[west[k]] / factor[west[k]] : 0) + (north[k] >= 0 ? z[north[k]] / factor[north[k]] : 0)
    for (let i = cells.length - 1; i >= 0; i--) {
      const k = cells[i]
      z[k] = (z[k] + (east[k] >= 0 ? z[east[k]] : 0) + (south[k] >= 0 ? z[south[k]] : 0)) / factor[k]
    }
  }
  return {
    solid, freeU, freeV, pressure,
    project(flow: FaceFlow, tolerance = 1e-9) {
      const { u, v } = flow
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
        const k = x + y * NX
        rhs[k] = solid[k] ? 0 : -(u[ui(x + 1, y)] - u[ui(x, y)] + v[vi(x, y + 1)] - v[vi(x, y)])
      }
      apply(pressure, product)
      for (const k of cells) residual[k] = rhs[k] - product[k]
      const norm = Math.sqrt(dot(rhs, rhs)), target = Math.max(1e-10, norm * tolerance)
      precondition(); direction.set(z)
      let rz = dot(residual, z), error = Math.sqrt(dot(residual, residual)), iterations = 0
      while (error > target && iterations < 1200) {
        apply(direction, product)
        const alpha = rz / dot(direction, product)
        for (const k of cells) { pressure[k] += alpha * direction[k]; residual[k] -= alpha * product[k] }
        precondition()
        const next = dot(residual, z), beta = next / rz
        for (const k of cells) direction[k] = z[k] + beta * direction[k]
        rz = next; error = Math.sqrt(dot(residual, residual)); iterations++
      }
      for (let y = 0; y < NY; y++) for (let x = 1; x <= NX; x++) {
        if (freeU[ui(x, y)]) u[ui(x, y)] -= (x < NX ? pressure[x + y * NX] : 0) - pressure[x - 1 + y * NX]
      }
      for (let y = 1; y < NY; y++) for (let x = 0; x < NX; x++) {
        if (freeV[vi(x, y)]) v[vi(x, y)] -= pressure[x + y * NX] - pressure[x + (y - 1) * NX]
      }
      return { relativeResidual: error / Math.max(norm, 1e-10), iterations }
    },
  }
}
