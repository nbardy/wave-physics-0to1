/**
 * CAD C1 checks — the mathematics the lesson's prose cites, asserted headlessly,
 * plus a thin pixel pass that would catch a figure that stopped drawing.
 *
 * The numeric targets are the ones printed in the article ("Δ around 1e-16",
 * "1,538 vertices and 1,536 quads", "misses by about 6e-2"), so a regression in
 * `src/sims/cad/` fails here rather than quietly making a sentence false.
 *
 * Run: bun run scripts/check-cad.ts
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PALETTE } from '../src/sims/lib/palette'
import {
  QUARTER_CIRCLE,
  basisValues,
  evaluate,
  insertKnot,
  makeRational,
  maxDeviation,
  multiplicity,
  openUniformKnots,
  polygonal,
  radiusError,
  type Spline,
  type Vec2,
} from '../src/sims/cad/spline'
import { catmullClark, cubeCage, plateCage, subdivide } from '../src/sims/cad/mesh'
import { counts, plate } from '../src/sims/cad/brep'
import { createBasisLocality, freshBasisState } from '../src/sims/cad/BasisLocality'
import { createKnotInsert, freshKnotState, refineOnce } from '../src/sims/cad/KnotInsert'
import { createWeightPull, freshWeightState } from '../src/sims/cad/WeightPull'
import { createRefineLocal, freshRefineState } from '../src/sims/cad/RefineLocal'
import { createCageLimit, freshCageState } from '../src/sims/cad/CageLimit'
import { createBrepStack, freshBrepState } from '../src/sims/cad/BrepStack'
import { ancestor, createOneObject, freshOneObjectState, heroFace } from '../src/sims/cad/OneObject'
import { isStacked } from '../src/sims/cad/layout'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

let failures = 0
function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures += 1
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

// --- the basis ------------------------------------------------------------

const POINTS: Vec2[] = [
  [-1.55, -0.55],
  [-1.0, 0.75],
  [-0.35, -0.8],
  [0.3, 0.85],
  [0.9, -0.6],
  [1.45, 0.55],
  [1.85, -0.1],
]

for (const degree of [2, 3, 4]) {
  const knots = openUniformKnots(POINTS.length, degree)
  let worst = 0
  let negative = 0
  for (let i = 0; i <= 400; i += 1) {
    const vals = basisValues(POINTS.length, degree, knots, i / 400)
    const sum = vals.reduce((a, b) => a + b, 0)
    worst = Math.max(worst, Math.abs(sum - 1))
    for (const v of vals) if (v < -1e-12) negative += 1
  }
  ok(worst < 1e-12, `basis/partition-of-unity p=${degree}`, `max |ΣN − 1| = ${worst.toExponential(1)}`)
  ok(negative === 0, `basis/nonnegative p=${degree}`, `${negative} negative samples`)

  // the locality claim the article makes in prose: p+1 functions awake inside a span
  const awake = basisValues(POINTS.length, degree, knots, 0.42).filter((v) => v > 1e-9).length
  ok(awake === degree + 1, `basis/awake-count p=${degree}`, `${awake} awake at u = 0.42`)
}

// compact support: the function belonging to P3 is identically zero outside [k3, k3+p+1]
{
  const degree = 3
  const knots = openUniformKnots(POINTS.length, degree)
  const [lo, hi] = [knots[3], knots[3 + degree + 1]]
  let leak = 0
  for (let i = 0; i <= 400; i += 1) {
    const u = i / 400
    if (u >= lo && u <= hi) continue
    if (basisValues(POINTS.length, degree, knots, u)[3] > 1e-12) leak += 1
  }
  ok(leak === 0, 'basis/compact-support', `N3 nonzero at ${leak} samples outside [${lo}, ${hi}]`)
}

// --- exact refinement -----------------------------------------------------

{
  const degree = 3
  const base: Spline = { points: POINTS, degree, knots: openUniformKnots(POINTS.length, degree) }
  const step = insertKnot(base, 0.37)
  ok(step.kind === 'refined', 'knot/inserts', `kind = ${step.kind}`)
  if (step.kind === 'refined') {
    ok(
      step.spline.points.length === base.points.length + 1,
      'knot/one-more-coordinate',
      `${base.points.length} → ${step.spline.points.length}`,
    )
    const delta = maxDeviation(polygonal(base), polygonal(step.spline))
    ok(delta < 1e-11, 'knot/curve-does-not-move', `Δ = ${delta.toExponential(2)}`)
  }

  // Keep inserting at one parameter and the spline runs out of coordinates once
  // multiplicity reaches p+1 — counting from whatever multiplicity u already had
  // in the open uniform vector, which for an interior knot is 1, not 0.
  const AT = 0.5
  const already = multiplicity(base.knots, AT)
  let s = base
  let refinements = 0
  let saturated = false
  for (let i = 0; i < 8; i += 1) {
    const r = insertKnot(s, AT)
    if (r.kind === 'saturated') {
      saturated = true
      break
    }
    s = r.spline
    refinements += 1
  }
  ok(
    saturated && already + refinements === degree + 1,
    'knot/saturates-at-p+1',
    `multiplicity ${already} + ${refinements} insertions = ${already + refinements}, p+1 = ${degree + 1}`,
  )
  const deltaAfter = maxDeviation(polygonal(base), polygonal(s))
  ok(deltaAfter < 1e-11, 'knot/still-exact-after-saturation', `Δ = ${deltaAfter.toExponential(2)}`)
}

// --- the denominator ------------------------------------------------------

{
  const eRational = radiusError(QUARTER_CIRCLE)
  ok(eRational < 1e-14, 'nurbs/quarter-circle-exact', `max |‖C‖−1| = ${eRational.toExponential(2)}`)

  const polyThroughSame = polygonal({
    points: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    degree: 2,
    knots: [0, 0, 0, 1, 1, 1],
  })
  const ePoly = radiusError(polyThroughSame)
  // the article says "about 6e-2" — hold it to the band, not to a remembered digit
  ok(ePoly > 4e-2 && ePoly < 8e-2, 'nurbs/polynomial-cannot', `max |‖C‖−1| = ${ePoly.toExponential(2)}`)

  // moving the middle weight off √2/2 destroys exactness — the knob is load-bearing
  const off = makeRational(
    {
      points: [
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      degree: 2,
      knots: [0, 0, 0, 1, 1, 1],
    },
    [1, 0.9, 1],
  )
  ok(radiusError(off) > 1e-2, 'nurbs/weight-is-not-a-tuning-knob', `w₁ = 0.9 → ${radiusError(off).toExponential(2)}`)

  // unit weights reduce the rational curve to the polynomial one, exactly
  const spline: Spline = { points: POINTS, degree: 3, knots: openUniformKnots(POINTS.length, 3) }
  const unit = maxDeviation(polygonal(spline), makeRational(spline, POINTS.map(() => 1)))
  ok(unit < 1e-15, 'nurbs/unit-weights-collapse', `Δ = ${unit.toExponential(2)}`)

  // and the rational coefficients are still a partition of unity
  let worst = 0
  const weighted = makeRational(spline, [1, 2.5, 0.4, 3, 1, 0.7, 1.8])
  for (let i = 0; i <= 200; i += 1) {
    const sum = evaluate(weighted, i / 200).weightedBasis.reduce((a, b) => a + b, 0)
    worst = Math.max(worst, Math.abs(sum - 1))
  }
  ok(worst < 1e-12, 'nurbs/rational-partition-of-unity', `max |ΣR − 1| = ${worst.toExponential(1)}`)
}

// --- subdivision ----------------------------------------------------------

{
  const cage = cubeCage()
  const one = catmullClark(cage)
  ok(
    one.mesh.vertices.length === 26 && one.mesh.faces.length === 24,
    'subd/one-step-on-a-cube',
    `${one.mesh.vertices.length} vertices, ${one.mesh.faces.length} quads`,
  )
  const four = subdivide(cage, 4).mesh
  ok(
    four.vertices.length === 1538 && four.faces.length === 1536,
    'subd/four-levels',
    `${four.vertices.length} vertices, ${four.faces.length} quads`,
  )
  ok(
    four.faces.every((f) => f.length === 4),
    'subd/all-quads',
    `${four.faces.length} faces, all of length 4`,
  )
  // the limit lives inside the cage — the partition-of-unity fact in 3-D
  const outside = four.vertices.filter((v) => v.some((c) => Math.abs(c) > 1 + 1e-12)).length
  ok(outside === 0, 'subd/limit-inside-cage', `${outside} vertices outside the unit cube`)
  ok(one.construction.valence.every((v) => v === 3), 'subd/cube-is-all-extraordinary', 'every cage vertex has valence 3')

  // the hero's provenance claim: cross-group edges are exactly the cage edges refined
  const LEVEL = 3
  const limit = subdivide(cage, LEVEL).mesh
  const owner = new Map<string, number[]>()
  limit.faces.forEach((face, fi) => {
    for (let i = 0; i < face.length; i += 1) {
      const a = face[i]
      const b = face[(i + 1) % face.length]
      const k = a < b ? `${a}:${b}` : `${b}:${a}`
      const list = owner.get(k)
      if (list) list.push(fi)
      else owner.set(k, [fi])
    }
  })
  let cross = 0
  for (const fis of owner.values()) {
    if (fis.length === 2 && ancestor(fis[0], LEVEL) !== ancestor(fis[1], LEVEL)) cross += 1
  }
  // 12 cage edges, each split into 2^LEVEL pieces
  ok(cross === 12 * 2 ** LEVEL, 'subd/face-groups-meet-on-cage-edges', `${cross} cross-group edges, expected ${12 * 2 ** LEVEL}`)
}

// --- the hero's plate ------------------------------------------------------

{
  // The properties that retired the cube hero (STORY_CANDIDATES.md, 2026-08-18):
  // the plate is genus 1 and every vertex is regular, so its limit is bicubic
  // B-spline EVERYWHERE — the claim the article's opening now rests on.
  const cage = plateCage()
  const V = cage.vertices.length
  const F = cage.faces.length
  const E = new Set(
    cage.faces.flatMap((f) => f.map((v, i) => [v, f[(i + 1) % f.length]].sort((a, b) => a - b).join(':'))),
  ).size
  ok(V - E + F === 0, 'plate/genus-one', `V−E+F = ${V - E + F} (0 = torus)`)
  const one = catmullClark(cage)
  ok(
    one.construction.valence.every((v) => v === 4),
    'plate/all-regular',
    `valence min ${Math.min(...one.construction.valence)} max ${Math.max(...one.construction.valence)} — no extraordinary points`,
  )
  const HERO_LEVEL = 3
  const limit = subdivide(cage, HERO_LEVEL).mesh
  ok(
    limit.vertices.length === 2048 && limit.faces.length === 2048,
    'plate/level-3-counts',
    `${limit.vertices.length} verts, ${limit.faces.length} quads (V = F because χ = 0)`,
  )
  const minR = Math.min(...limit.vertices.map((v) => Math.hypot(v[0], v[2])))
  ok(minR > 0.05, 'plate/hole-survives-refinement', `bore radius ${minR.toFixed(3)} at level 3`)

  // The four wires: independently re-derived, not read from heroFace — each of
  // the cage's 4 strip boundaries is 8 edges around, each split 2^3 ways.
  const owner = new Map<string, number[]>()
  limit.faces.forEach((face, fi) => {
    for (let i = 0; i < face.length; i += 1) {
      const a = face[i]
      const b = face[(i + 1) % face.length]
      const k = a < b ? `${a}:${b}` : `${b}:${a}`
      const list = owner.get(k)
      if (list) list.push(fi)
      else owner.set(k, [fi])
    }
  })
  let wireSegments = 0
  const wirePairs = new Set<string>()
  for (const fis of owner.values()) {
    if (fis.length !== 2) continue
    const [ga, gb] = [heroFace(fis[0]), heroFace(fis[1])]
    if (ga === gb) continue
    wireSegments += 1
    wirePairs.add(ga < gb ? `${ga}:${gb}` : `${gb}:${ga}`)
  }
  const expected = 4 * 8 * 2 ** HERO_LEVEL
  ok(wireSegments === expected, 'plate/four-wires', `${wireSegments} wire segments, expected ${expected}`)
  ok(
    wirePairs.size === 4 && !wirePairs.has('0:2') && !wirePairs.has('1:3'),
    'plate/wires-are-adjacent-strips',
    `strip adjacencies ${[...wirePairs].sort().join(', ')} — top never meets bottom, outer never meets bore`,
  )
}

// --- boundary representation ---------------------------------------------

for (const hole of [0.12, 0.46, 0.72]) {
  const c = counts(plate(hole, 0.34))
  ok(
    c.euler === 2 * (c.shells - c.genus),
    `brep/euler-poincare hole=${hole}`,
    `V−E+F−R = ${c.euler}, 2(S−G) = ${2 * (c.shells - c.genus)}`,
  )
}
{
  const c = counts(plate(0.46, 0.34))
  ok(c.vertices === 16 && c.edges === 24 && c.faces === 10, 'brep/plate-entity-counts', `V ${c.vertices} · E ${c.edges} · F ${c.faces}`)
  ok(c.vertices - c.edges + c.faces === 2, 'brep/naive-formula-misses-the-hole', 'V−E+F = 2, which is the answer for a plate with no hole')
}

// --- T-mesh support -------------------------------------------------------

{
  // Re-derived here rather than imported, so this is a check and not an echo:
  // an anchor beside the terminated strip crosses it and gets a smaller support
  // than one above the T-junction, which never meets that line.
  const extent = 2
  const rows = 6
  const cols = 7
  const insertAt = 3.5
  const lo = Math.floor((rows - extent) / 2)
  const reach = (row: number) => {
    const inStrip = row >= lo && row <= lo + extent - 1
    const lines = [...Array(cols).keys()].concat(inStrip ? [insertAt] : []).sort((a, b) => a - b)
    const right = lines.filter((v) => v > 3)
    return right[1]
  }
  ok(reach(2) < reach(rows - 1), 'tspline/local-knot-vectors-differ', `in-strip anchor reaches ${reach(2)}, T-junction anchor reaches ${reach(rows - 1)}`)
}

// --- the figures actually paint -------------------------------------------

const WIDE = 720
const TALL = 330
// A 390 px phone leaves the canvas ~340 px after the column padding and the
// figure's own border — the width the stacked layouts have to survive.
const PHONE = 340

function render(
  name: string,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  W = WIDE,
  H = TALL,
) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  draw(ctx, W, H)
  writeFileSync(join(OUT, `cad-${name}.png`), canvas.toBuffer('image/png'))
  const img = ctx.getImageData(0, 0, W, H)
  // Match one quantity's own colour, opaque strokes only — an alpha-blended
  // wash would match half the palette and pass on a blank figure.
  // `y0`/`y1` restrict the count to a horizontal band. Meters are drawn in the
  // figure's own palette, so a whole-frame count of (say) violet passes on the
  // Δ readout alone while the violet curve it claims to measure is missing —
  // the decoy failure AGENTS.md warns about. Band any check whose quantity has
  // a same-coloured label.
  const ink = (hex: string, tol = 26, y0 = 0, y1 = H) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    let n = 0
    for (let y = y0; y < y1; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4
        if (img.data[i + 3] < 200) continue
        if (
          Math.abs(img.data[i] - r) < tol &&
          Math.abs(img.data[i + 1] - g) < tol &&
          Math.abs(img.data[i + 2] - b) < tol
        )
          n += 1
      }
    }
    return n
  }
  // Shaded surfaces span a lightness ramp from PALETTE.curve toward white, so a
  // single-hex match only ever finds the darkest facets and would read "nearly
  // blank" on a fully drawn solid. This counts the ramp itself: blue-dominant
  // over both other channels. Amber, green, gray and red all fail it, and the
  // one palette colour that would pass (violet) is only drawn by the
  // construction toggle, which these renders leave off.
  const blueRamp = () => {
    let n = 0
    for (let i = 0; i < img.data.length; i += 4) {
      const [r, g, b, a] = [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
      if (a < 200) continue
      if (b > r + 45 && b > g + 25 && b > 150) n += 1
    }
    return n
  }
  return { ink, blueRamp }
}

{
  const s = { current: freshBasisState() }
  // drag the point whose support is highlighted — in the live figure a drag
  // selects the point it moved, so this is what a reader actually sees
  s.current.points[s.current.selected] = [0.35, 1.55]
  const { ink } = render('basis-locality', createBasisLocality(s).draw)
  ok(ink(PALETTE.ghost) > 300, 'fig/basis-ghost-curve', `${ink(PALETTE.ghost)} px of ghost ink`)
  ok(ink(PALETTE.ctrl) > 300, 'fig/basis-selected-support', `${ink(PALETTE.ctrl)} px of control ink`)
  ok(ink(PALETTE.curve) > 200, 'fig/basis-curve', `${ink(PALETTE.curve)} px of curve ink`)
  ok(ink(PALETTE.knot) > 40, 'fig/basis-knot-ticks', `${ink(PALETTE.knot)} px of knot ink`)
}

{
  let state = freshKnotState()
  state = refineOnce(state)
  state = refineOnce({ ...state, u: 0.3 })
  const s = { current: state }
  const { ink } = render('knot-insert', createKnotInsert(s).draw)
  ok(s.current.refined.points.length === 8, 'fig/knot-two-insertions', `${s.current.refined.points.length} control points`)
  ok(ink(PALETTE.ghost) > 120, 'fig/knot-ghost-polygon', `${ink(PALETTE.ghost)} px of ghost ink`)
  ok(ink(PALETTE.ctrl) > 120, 'fig/knot-new-polygon', `${ink(PALETTE.ctrl)} px of control ink`)
  ok(ink(PALETTE.knot) > 60, 'fig/knot-strip', `${ink(PALETTE.knot)} px of knot ink`)
  // Both curves must be legible as two curves, or "they coincide" is
  // unfalsifiable. Banded below the meters: the Δ readout is violet too.
  const BAND = [80, 260] as const
  ok(
    ink(PALETTE.curve, 26, ...BAND) > 1500,
    'fig/knot-original-curve',
    `${ink(PALETTE.curve, 26, ...BAND)} px of original ink on the curve`,
  )
  ok(
    ink(PALETTE.basis, 26, ...BAND) > 250,
    'fig/knot-refined-overlay',
    `${ink(PALETTE.basis, 26, ...BAND)} px of refined ink on the curve`,
  )
}

{
  const s = { current: freshWeightState() }
  s.current.weights[2] = 3.2
  const { ink } = render('weight-pull', createWeightPull(s).draw)
  ok(ink(PALETTE.curve) > 300, 'fig/weight-rational-curve', `${ink(PALETTE.curve)} px of curve ink`)
  ok(ink(PALETTE.hole) > 60, 'fig/weight-polynomial-miss', `${ink(PALETTE.hole)} px of polynomial ink`)
  ok(ink(PALETTE.ghost) > 300, 'fig/weight-true-circle', `${ink(PALETTE.ghost)} px of reference ink`)
}

{
  const s = { current: freshRefineState() }
  const { ink } = render('refine-local', createRefineLocal(s).draw)
  ok(ink(PALETTE.knot) > 100, 'fig/tmesh-refinement-lines', `${ink(PALETTE.knot)} px of knot ink`)
  ok(ink(PALETTE.topo) > 40, 'fig/tmesh-t-junctions', `${ink(PALETTE.topo)} px of junction ink`)
}

{
  const s = { current: { ...freshCageState(), level: 3, lift: 0.8 } }
  const { ink, blueRamp } = render('cage-limit', createCageLimit(s).draw)
  ok(ink(PALETTE.ctrl) > 200, 'fig/cage-wireframe', `${ink(PALETTE.ctrl)} px of cage ink`)
  ok(blueRamp() > 8000, 'fig/cage-limit-surface', `${blueRamp()} px of shaded surface`)
  // The article's claim about this figure is that refinement pulls the surface
  // inside the cage. At level 0 the surface IS the cage, so its silhouette is the
  // full cube; at level 3 the corners are rounded off and it must cover strictly
  // less of the frame from the same camera.
  const flat = { current: { ...freshCageState(), level: 0, lift: 0.8 } }
  const { blueRamp: flatRamp } = render('cage-limit-level0', createCageLimit(flat).draw)
  ok(
    blueRamp() < flatRamp() * 0.8,
    'fig/limit-pulls-inside-cage',
    `level 3 covers ${blueRamp()} px vs ${flatRamp()} px at level 0`,
  )
}

{
  const s = { current: { ...freshBrepState(), entity: 'surface' as const } }
  const { ink } = render('brep-stack', createBrepStack(s).draw)
  ok(ink(PALETTE.topo) > 150, 'fig/brep-trimmed-face', `${ink(PALETTE.topo)} px of entity ink`)
}

{
  const s = { current: { ...freshOneObjectState(), lens: 2 } }
  const { ink } = render('one-object', createOneObject(s).draw)
  ok(ink(PALETTE.topo) > 400, 'fig/hero-face-boundaries', `${ink(PALETTE.topo)} px of wire ink`)
  const cage = { current: { ...freshOneObjectState(), lens: 0 } }
  const { ink: cageInk } = render('one-object-cage', createOneObject(cage).draw)
  ok(cageInk(PALETTE.ctrl) > 300, 'fig/hero-cage-layer', `${cageInk(PALETTE.ctrl)} px of cage ink`)
  ok(cageInk(PALETTE.topo) < 10, 'fig/hero-lens-actually-fades', `${cageInk(PALETTE.topo)} px of wire ink at lens 0`)
}

// --- the two-pane figures survive a phone ---------------------------------
//
// Below STACK_BELOW these three re-lay out from side-by-side to stacked. A
// layout bug there does not throw — it silently draws panes with negative or
// near-zero width, which paints nothing. So each one is re-rendered at phone
// width and must still show the ink its claim depends on.

ok(isStacked(PHONE) && !isStacked(WIDE), 'mobile/breakpoint', `stacks at ${PHONE}, splits at ${WIDE}`)

{
  const s = { current: freshBasisState() }
  s.current.points[s.current.selected] = [0.35, 1.55]
  const { ink } = render('mobile-basis-locality', createBasisLocality(s).draw, PHONE, 520)
  ok(ink(PALETTE.ghost) > 300, 'mobile/basis-ghost-curve', `${ink(PALETTE.ghost)} px of ghost ink`)
  ok(ink(PALETTE.ctrl) > 300, 'mobile/basis-selected-support', `${ink(PALETTE.ctrl)} px of control ink`)
  ok(ink(PALETTE.curve) > 150, 'mobile/basis-curve', `${ink(PALETTE.curve)} px of curve ink`)
  ok(ink(PALETTE.knot) > 30, 'mobile/basis-knot-ticks', `${ink(PALETTE.knot)} px of knot ink`)
}

{
  const s = { current: freshWeightState() }
  s.current.weights[2] = 3.2
  const { ink } = render('mobile-weight-pull', createWeightPull(s).draw, PHONE, 560)
  ok(ink(PALETTE.curve) > 200, 'mobile/weight-rational-curve', `${ink(PALETTE.curve)} px of curve ink`)
  ok(ink(PALETTE.hole) > 40, 'mobile/weight-polynomial-miss', `${ink(PALETTE.hole)} px of polynomial ink`)
  ok(ink(PALETTE.ghost) > 200, 'mobile/weight-true-circle', `${ink(PALETTE.ghost)} px of reference ink`)
}

{
  const s = { current: freshRefineState() }
  const { ink } = render('mobile-refine-local', createRefineLocal(s).draw, PHONE, 540)
  ok(ink(PALETTE.knot) > 80, 'mobile/tmesh-refinement-lines', `${ink(PALETTE.knot)} px of knot ink`)
  ok(ink(PALETTE.topo) > 30, 'mobile/tmesh-t-junctions', `${ink(PALETTE.topo)} px of junction ink`)
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall green')
process.exit(failures ? 1 : 0)
