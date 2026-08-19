// The boundary representation the CAD lesson inspects: a rectangular plate with
// one square through-hole, built as topology over geometry rather than as a
// mesh. Ported from the standalone `cad-primitives-explainer` project (archived
// under `articles/cad/01-cad-primitives/source/`).
//
// The point of this file is that nothing here is a surface basis. The plate's
// faces are *bounded regions of* planes; the wires say which region. Change the
// hole size and no geometry is re-fitted — only the inner wire moves, and the
// same infinite planes go on supporting the same faces.

import type { Vec3 } from './mesh'

/**
 * Which entity of the hierarchy is under inspection. A closed union, because
 * the B-rep hierarchy is closed: there is no eighth kind of thing in a solid,
 * and an unknown selection should be a compile error rather than a blank
 * highlight.
 */
export type EntityKind =
  | 'solid'
  | 'shell'
  | 'face'
  | 'outerWire'
  | 'innerWire'
  | 'edge'
  | 'vertex'
  | 'surface'

export const ENTITY_LABEL: Record<EntityKind, string> = {
  solid: 'Solid',
  shell: 'Shell',
  face: 'Top Face',
  outerWire: 'Outer Wire',
  innerWire: 'Inner Wire',
  edge: 'Edge',
  vertex: 'Vertex',
  surface: 'Underlying Surface',
}

/** What each entity actually is — printed as the figure's readout. */
export const ENTITY_GLOSS: Record<EntityKind, string> = {
  solid: 'the region of space the closed shell bounds',
  shell: 'every face, oriented outward, closed with no gaps',
  face: 'a bounded region of one plane',
  outerWire: 'the oriented loop of edges bounding the face outside',
  innerWire: 'a second loop, oriented the other way — the hole',
  edge: 'a bounded interval of one curve',
  vertex: 'a point where edges meet',
  surface: 'the unbounded plane the face lies on — geometry, not topology',
}

export interface Plate {
  /** Top outer wire, counter-clockwise seen from above. */
  readonly outer: readonly Vec3[]
  /** Top inner wire — the hole — wound the opposite way. */
  readonly inner: readonly Vec3[]
  readonly halfThickness: number
}

/** A face as a polygon loop (or two, when it is the pierced top or bottom). */
export interface Face {
  readonly loops: readonly (readonly Vec3[])[]
  readonly label: string
}

const SQUARE: readonly (readonly [number, number])[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

export function plate(holeHalfWidth: number, halfThickness: number): Plate {
  const y = halfThickness
  return {
    outer: SQUARE.map(([x, z]) => [x, y, z] as Vec3),
    // reversed: an inner wire runs against its outer wire, which is how a
    // trimming loop says "this side is not material".
    inner: [...SQUARE].reverse().map(([x, z]) => [x * holeHalfWidth, y, z * holeHalfWidth] as Vec3),
    halfThickness,
  }
}

const lower = (p: Vec3, t: number): Vec3 => [p[0], -t, p[2]]

/** Every face of the closed shell: pierced top, pierced bottom, four outer walls, four bore walls. */
export function faces(p: Plate): Face[] {
  const t = p.halfThickness
  const out: Face[] = [
    { loops: [p.outer, p.inner], label: 'top' },
    {
      loops: [p.outer.map((v) => lower(v, t)), p.inner.map((v) => lower(v, t))],
      label: 'bottom',
    },
  ]
  const wall = (loop: readonly Vec3[], label: string) => {
    for (let i = 0; i < loop.length; i += 1) {
      const a = loop[i]
      const b = loop[(i + 1) % loop.length]
      out.push({ loops: [[a, b, lower(b, t), lower(a, t)]], label })
    }
  }
  wall(p.outer, 'outer wall')
  wall(p.inner, 'bore wall')
  return out
}

/**
 * The entity counts of the plate — the numbers a kernel would report, computed
 * from the model rather than typed into prose.
 *
 * `euler` is the Euler–Poincaré invariant in the form B-reps actually use,
 *
 *     V − E + F − R = 2(S − G),
 *
 * where R counts *inner* loops (the plate has two: one on the top face, one on
 * the bottom) and G is the genus. A plate with a through-hole is a torus, so
 * G = 1 and the right-hand side is 0. Plain V − E + F = 2 would be the answer
 * for a plate with no hole, which is exactly the trap: the hole is invisible to
 * the naive formula because it lives in the loop structure, not in the counts of
 * faces and edges. `scripts/check-cad.ts` asserts the balance holds.
 */
export function counts(p: Plate): {
  vertices: number
  edges: number
  faces: number
  wires: number
  rings: number
  shells: number
  genus: number
  euler: number
} {
  const n = p.outer.length
  const vertices = 4 * n // outer and inner loops, top and bottom
  const edges = 6 * n // 2n around the top, 2n around the bottom, 2n vertical
  const f = 2 + 2 * n // pierced top and bottom, plus one wall per boundary edge
  const wires = 4 + 2 * n // two loops on each pierced face, one per wall
  const rings = 2 // the inner loops: the hole seen from above and from below
  return {
    vertices,
    edges,
    faces: f,
    wires,
    rings,
    shells: 1,
    genus: 1,
    euler: vertices - edges + f - rings,
  }
}
