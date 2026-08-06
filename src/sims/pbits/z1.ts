// The Z1 fabric, generated from its published offset rules (Part 2 infra).
//
// Per the Thermalizers paper's architecture description (arXiv:2608.01615 —
// UNVERIFIED second-hand, see articles/06-z1-compiler/RESEARCH.md): node
// (x, y) couples to (x+a, y+b), (x−b, y+a), (x−a, y−b), (x+b, y−a) for
// (a, b) ∈ {(1,0), (2,1), (2,3), (4,1)} — four rules × four rotations =
// degree 16. We generate it on a torus, which makes the degree exactly 16
// everywhere ("mostly regular" on the real die presumably reflects edge
// truncation).
//
// Two structural facts fall out of the rules and are asserted by
// scripts/check-z1.ts rather than trusted:
//   1. Every offset has odd parity (a+b odd), so (x+y) mod 2 is a legal
//      two-coloring — the checkerboard survives the knight-moves, which is
//      the entire chromatic-Gibbs story of Part 1 carried over unchanged.
//   2. Re-layering the graph by BFS distance from a visible set chosen on
//      ONE color class yields STRICTLY adjacent-layer edges: every node's
//      layer parity equals its color parity, and edges always join the two
//      colors. (With mixed-color sources the claim FAILS — two adjacent
//      visible cells share layer 0 — a boundary the check script measures.
//      Found by the check itself, 2026-08-05.) The sparse fabric re-hung by
//      one color's visible nodes is literally a layered (deep-Boltzmann)
//      architecture. This is the Part-2 F4 reveal.
//
// Asymmetric two-couplings-per-edge mode (J_uv ≠ J_vu) is deliberately NOT
// built: it breaks detailed balance, has no scalar energy, and Part 2 fences
// it into one confessed curiosity figure. When that figure is built it gets
// its own sweep handler as a new Schedule variant — lib.ts handlers stay
// untouched.

import { buildModel, buildChromatic, type Edge, type PbitModel, type Schedule } from './lib'

export const Z1_RULES: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [2, 1],
  [2, 3],
  [4, 1],
]

/** The 16 neighbor offsets: each rule under the four stated rotations. */
export function z1Offsets(): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (const [a, b] of Z1_RULES) {
    out.push([a, b], [-b, a], [-a, -b], [b, -a])
  }
  return out
}

export interface Z1Graph {
  w: number
  h: number
  n: number
  /** Undirected edge list (i < j), deduplicated. */
  edges: Array<[number, number]>
  /** Per-site neighbor lists. */
  nbr: Int32Array[]
  /** (x+y) mod 2 — legal iff every offset parity is odd (checked). */
  colors: Uint8Array
}

export function z1Graph(w: number, h: number): Z1Graph {
  const n = w * h
  const idx = (x: number, y: number) => (((y % h) + h) % h) * w + (((x % w) + w) % w)
  const seen = new Set<number>()
  const edges: Array<[number, number]> = []
  const nbrs: number[][] = Array.from({ length: n }, () => [])
  const offsets = z1Offsets()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y)
      for (const [a, b] of offsets) {
        const j = idx(x + a, y + b)
        const key = i < j ? i * n + j : j * n + i
        if (i === j || seen.has(key)) continue
        seen.add(key)
        edges.push(i < j ? [i, j] : [j, i])
        nbrs[i].push(j)
        nbrs[j].push(i)
      }
    }
  }
  const colors = new Uint8Array(n)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) colors[y * w + x] = (x + y) & 1
  return { w, h, n, edges, nbr: nbrs.map((a) => Int32Array.from(a)), colors }
}

/** Symmetric-coupling Z1 patch as a lib model (one J everywhere, or per-edge). */
export function z1Model(
  g: Z1Graph,
  beta: number,
  J: number | ((i: number, j: number) => number),
  clamp?: ArrayLike<number>,
): PbitModel {
  const jOf = typeof J === 'number' ? () => J : J
  const edges: Edge[] = g.edges.map(([i, j]) => ({ i, j, J: jOf(i, j) }))
  return buildModel(g.n, new Float32Array(g.n), edges, beta, clamp)
}

/** The chip's native schedule on this patch — throws if the coloring is illegal. */
export function z1Chromatic(m: PbitModel, g: Z1Graph): Schedule {
  return buildChromatic(m, g.colors, 2)
}

/**
 * BFS layers by distance to a visible set — the re-hanging that turns the
 * planar fabric into a layered architecture. layer[i] = distance (0 for
 * visible), or -1 if unreachable (never, on a connected torus patch).
 */
export function layersFromVisible(g: Z1Graph, visible: number[]): Int32Array {
  const layer = new Int32Array(g.n).fill(-1)
  const queue: number[] = []
  for (const v of visible) {
    layer[v] = 0
    queue.push(v)
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    const nb = g.nbr[i]
    for (let k = 0; k < nb.length; k++) {
      const j = nb[k]
      if (layer[j] === -1) {
        layer[j] = layer[i] + 1
        queue.push(j)
      }
    }
  }
  return layer
}
