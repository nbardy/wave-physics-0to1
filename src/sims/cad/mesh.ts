// Catmull–Clark subdivision and the small orthographic camera the CAD figures
// use to put a 3-D cage on a 2-D canvas.
//
// Ported from the standalone `cad-primitives-explainer` project (archived under
// `articles/cad/01-cad-primitives/source/`), which ran the same refinement
// against a WebGPU renderer. The counts this produces are checked:
// `scripts/check-cad.ts` asserts one step on a closed cube gives 26 vertices
// and 24 quads, and four steps give 1538 and 1536 — the same numbers the source
// project's QA recorded, so the port is verified against its origin rather than
// against itself.

export type Vec3 = readonly [number, number, number]

export interface Mesh {
  readonly vertices: readonly Vec3[]
  readonly faces: readonly (readonly number[])[]
}

/** The intermediate points one Catmull–Clark step builds, kept so a figure can show the step rather than assert it. */
export interface Construction {
  readonly facePoints: readonly Vec3[]
  readonly edgePoints: readonly Vec3[]
  readonly edgeMidpoints: readonly Vec3[]
  readonly edges: readonly { readonly a: number; readonly b: number; readonly faces: readonly number[] }[]
  /** How many faces meet at each original vertex — 4 is regular, anything else extraordinary. */
  readonly valence: readonly number[]
}

const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`)

function mean(points: readonly Vec3[]): Vec3 {
  let x = 0
  let y = 0
  let z = 0
  for (const p of points) {
    x += p[0]
    y += p[1]
    z += p[2]
  }
  const n = points.length
  return [x / n, y / n, z / n]
}

/**
 * One Catmull–Clark step: face points, edge points, repositioned vertices, and
 * a quad per (face, corner) pair.
 *
 * The vertex rule is the article's displayed equation,
 * P' = (F̄ + 2Ē + (n−3)P) / n, with the standard crease rule on boundary
 * vertices (¾ P + ¼ of the two boundary neighbours) so an open cage stays put
 * at its border instead of shrinking away from it.
 */
export function catmullClark(mesh: Mesh): { mesh: Mesh; construction: Construction } {
  const { vertices, faces } = mesh
  const facePoints = faces.map((f) => mean(f.map((i) => vertices[i])))

  const edgeMap = new Map<string, { a: number; b: number; faces: number[] }>()
  const vertexFaces: number[][] = vertices.map(() => [])
  const vertexEdges: number[][] = vertices.map(() => [])

  faces.forEach((face, fi) => {
    for (const vi of face) vertexFaces[vi].push(fi)
    for (let i = 0; i < face.length; i += 1) {
      const a = face[i]
      const b = face[(i + 1) % face.length]
      const k = key(a, b)
      const found = edgeMap.get(k)
      if (found) found.faces.push(fi)
      else edgeMap.set(k, { a: Math.min(a, b), b: Math.max(a, b), faces: [fi] })
    }
  })

  const edges = [...edgeMap.values()]
  edges.forEach((e, ei) => {
    vertexEdges[e.a].push(ei)
    vertexEdges[e.b].push(ei)
  })

  const edgeMidpoints = edges.map((e) => mean([vertices[e.a], vertices[e.b]]))
  const edgePoints = edges.map((e, ei) =>
    e.faces.length < 2
      ? edgeMidpoints[ei]
      : mean([vertices[e.a], vertices[e.b], facePoints[e.faces[0]], facePoints[e.faces[1]]]),
  )

  const vertexPoints = vertices.map((p, vi) => {
    const incidentEdges = vertexEdges[vi]
    const boundary = incidentEdges.filter((ei) => edges[ei].faces.length < 2)
    if (boundary.length >= 2) {
      const neighbours = boundary.map((ei) => {
        const e = edges[ei]
        return vertices[e.a === vi ? e.b : e.a]
      })
      const m = mean(neighbours)
      return [
        0.75 * p[0] + 0.25 * m[0],
        0.75 * p[1] + 0.25 * m[1],
        0.75 * p[2] + 0.25 * m[2],
      ] as Vec3
    }
    const incidentFaces = vertexFaces[vi]
    const n = incidentFaces.length
    if (n === 0) return p
    const F = mean(incidentFaces.map((fi) => facePoints[fi]))
    const E = mean(incidentEdges.map((ei) => edgeMidpoints[ei]))
    return [
      (F[0] + 2 * E[0] + (n - 3) * p[0]) / n,
      (F[1] + 2 * E[1] + (n - 3) * p[1]) / n,
      (F[2] + 2 * E[2] + (n - 3) * p[2]) / n,
    ] as Vec3
  })

  const edgeOffset = vertexPoints.length
  const faceOffset = edgeOffset + edgePoints.length
  const edgeIndex = new Map(edges.map((e, i) => [key(e.a, e.b), edgeOffset + i]))

  const newFaces: number[][] = []
  faces.forEach((face, fi) => {
    const fp = faceOffset + fi
    for (let i = 0; i < face.length; i += 1) {
      const cur = face[i]
      const next = face[(i + 1) % face.length]
      const prev = face[(i - 1 + face.length) % face.length]
      newFaces.push([cur, edgeIndex.get(key(cur, next))!, fp, edgeIndex.get(key(prev, cur))!])
    }
  })

  return {
    mesh: { vertices: [...vertexPoints, ...edgePoints, ...facePoints], faces: newFaces },
    construction: {
      facePoints,
      edgePoints,
      edgeMidpoints,
      edges,
      valence: vertexFaces.map((f) => f.length),
    },
  }
}

/** `levels` steps of refinement, plus the construction data of the first step. */
export function subdivide(mesh: Mesh, levels: number): { mesh: Mesh; firstStep: Construction } {
  const first = catmullClark(mesh)
  let current = first.mesh
  for (let i = 1; i < levels; i += 1) current = catmullClark(current).mesh
  return { mesh: levels === 0 ? mesh : current, firstStep: first.construction }
}

/** A closed cube cage — six quads, every vertex of valence 3 (all extraordinary). */
export function cubeCage(): Mesh {
  const s = 1
  return {
    vertices: [
      [-s, -s, -s],
      [s, -s, -s],
      [s, s, -s],
      [-s, s, -s],
      [-s, -s, s],
      [s, -s, s],
      [s, s, s],
      [-s, s, s],
    ],
    faces: [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ],
  }
}

/** Move one cage vertex, returning a fresh mesh (the stepper never mutates its cage in place). */
export function movedVertex(mesh: Mesh, index: number, to: Vec3): Mesh {
  return { vertices: mesh.vertices.map((v, i) => (i === index ? to : v)), faces: mesh.faces }
}

// --- camera ---------------------------------------------------------------

/** Orthographic view: yaw about the vertical axis, pitch above the horizon. */
export interface Camera {
  readonly yaw: number
  readonly pitch: number
  /** Pixels per world unit. */
  readonly scale: number
  readonly cx: number
  readonly cy: number
}

/** Screen position and view-space depth (larger = further from the eye). */
export function project(cam: Camera, v: Vec3): { x: number; y: number; depth: number } {
  const cy = Math.cos(cam.yaw)
  const sy = Math.sin(cam.yaw)
  const cp = Math.cos(cam.pitch)
  const sp = Math.sin(cam.pitch)
  const x1 = v[0] * cy + v[2] * sy
  const z1 = -v[0] * sy + v[2] * cy
  const y1 = v[1] * cp - z1 * sp
  const depth = v[1] * sp + z1 * cp
  return { x: cam.cx + cam.scale * x1, y: cam.cy - cam.scale * y1, depth }
}

/** Face indices sorted back-to-front — the painter's order for a convex-ish mesh. */
export function paintOrder(cam: Camera, mesh: Mesh): number[] {
  const depths = mesh.faces.map((f) => {
    let d = 0
    for (const i of f) d += project(cam, mesh.vertices[i]).depth
    return d / f.length
  })
  return mesh.faces.map((_, i) => i).sort((a, b) => depths[b] - depths[a])
}

/**
 * How squarely a face points at the eye: +1 head-on, 0 at the silhouette,
 * negative when it faces away and should be culled.
 *
 * `project` returns a depth that grows *away* from the viewer, so its gradient
 *
 *     d = (−sin(yaw)·cos(pitch),  sin(pitch),  cos(yaw)·cos(pitch))
 *
 * points away from the eye and the eye direction is −d. This is worth one
 * function rather than one expression per figure: flipping the sign culls
 * exactly the faces you meant to keep and shades the survivors inside-out,
 * which reads as a lighting problem instead of a normals problem. It shipped
 * that way once (2026-08-16, caught by the hero's rendered check image).
 */
export function facing(cam: Camera, mesh: Mesh, faceIndex: number): number {
  const n = faceNormal(mesh, faceIndex)
  const cp = Math.cos(cam.pitch)
  return (
    n[0] * Math.sin(cam.yaw) * cp - n[1] * Math.sin(cam.pitch) - n[2] * Math.cos(cam.yaw) * cp
  )
}

/** Unit normal of a face, from its first three vertices. */
export function faceNormal(mesh: Mesh, faceIndex: number): Vec3 {
  const f = mesh.faces[faceIndex]
  const a = mesh.vertices[f[0]]
  const b = mesh.vertices[f[1]]
  const c = mesh.vertices[f[2]]
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const w: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
  const len = Math.hypot(n[0], n[1], n[2]) || 1
  return [n[0] / len, n[1] / len, n[2] / len]
}
