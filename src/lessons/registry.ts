import type { ComponentType } from 'react'
import type { LessonPreviewSpec } from '../components/previewSpec'
import Lesson01I from './lesson-01-navier-stokes.I.mdx'
import Lesson01II from './lesson-01-navier-stokes.II.mdx'
import Lesson02 from './lesson-02-fiber-bundles.mdx'
import Lesson03 from './lesson-03-navier-stokes-history.mdx'
import Lesson04I from './lesson-04-learned-solver.I.mdx'
import Lesson04II from './lesson-04-learned-solver.II.mdx'
import Lesson05 from './lesson-05-where-simulation-is-wrong.mdx'
import Maths01 from './maths-01-jacobian-hessian.mdx'
import Physics01 from './physics-01-wave-particle.mdx'
import Physics02G from './physics-02-einstein-grossmann.mdx'
import Physics02 from './physics-02-pbits.mdx'
import Physics03 from './physics-03-z1.mdx'
import Thermo03 from './thermo-03-diffusion.mdx'
import Cad01 from './cad-01-primitives.mdx'

// Lesson lifecycle as a sum type — rendering dispatches on `kind`, no stray
// defaults. Add `draft` / `published` variants as lessons get written.
export type LessonStatus =
  | { kind: 'planned' }
  | { kind: 'draft' }
  | { kind: 'published' }

// ---------------------------------------------------------------------------
// Fields — the top-level clusters. Home renders one group per field, in this
// order; a lesson belongs to exactly one. Numbering is per-field, so the
// prefix keeps `P1` and `01` and `M1` distinguishable at a glance.
// ---------------------------------------------------------------------------

export type Field = 'physics' | 'thermo' | 'waves' | 'maths' | 'cad'

export interface FieldSpec {
  field: Field
  label: string
  prefix: string
  blurb: string
}

// A Record keyed by Field, so adding a field is a compile error until it has a
// spec — no lookup can miss, and `fieldSpec` needs no fallback.
export const FIELD_SPEC: Record<Field, FieldSpec> = {
  physics: {
    field: 'physics',
    label: 'Broad physics',
    prefix: 'P',
    blurb: 'Standalone lessons on whatever the physics is actually doing. No curriculum order.',
  },
  thermo: {
    field: 'thermo',
    label: 'Thermodynamic computing',
    prefix: 'T',
    blurb:
      'A series, read in order: chips that compute with the thermal noise every other chip spends its power budget fighting.',
  },
  waves: {
    field: 'waves',
    label: 'Waves, 0 → 1',
    prefix: '',
    blurb: 'The spine: fluid and wave simulation from the fundamentals up, read in order.',
  },
  maths: {
    field: 'maths',
    label: 'Maths',
    prefix: 'M',
    blurb: 'The machinery the physics keeps borrowing, taught on its own terms.',
  },
  cad: {
    field: 'cad',
    label: 'CAD maths',
    prefix: 'C',
    blurb:
      'The geometry inside every solid modeller: spline bases, the meshes that author them, and the topology that decides which side is metal.',
  },
}

export const FIELD_ORDER: readonly Field[] = ['physics', 'thermo', 'waves', 'maths', 'cad']

export const FIELDS: readonly FieldSpec[] = FIELD_ORDER.map((f) => FIELD_SPEC[f])

// ---------------------------------------------------------------------------
// Tags — a deliberately small cross-cutting vocabulary. The union is closed, so
// a typo in a lesson entry is a compile error rather than an orphan chip. Add a
// tag only when a second lesson would carry it.
// ---------------------------------------------------------------------------

export const TAGS = [
  'calculus',
  'linear-algebra',
  'geometry',
  'probability',
  'pde',
  'fluids',
  'waves',
  'quantum',
  'optics',
  'electromagnetism',
  'history',
  'simulation',
] as const

export type Tag = (typeof TAGS)[number]

export const TAG_LABEL: Record<Tag, string> = {
  calculus: 'calculus',
  'linear-algebra': 'linear algebra',
  geometry: 'geometry',
  probability: 'probability',
  pde: 'PDEs',
  fluids: 'fluids',
  waves: 'waves',
  quantum: 'quantum',
  optics: 'optics',
  electromagnetism: 'electromagnetism',
  history: 'history',
  simulation: 'simulation',
}

// ---------------------------------------------------------------------------
// Versions — one lesson can carry several complete drafts side by side so
// they can be read against each other (baseline vs. rewrites). The first
// entry is what the site shows by default; the rest are reached from the
// switch above the article (`?v=II`). Labels are the Roman numerals a
// reader sees. To add one: drop `<name>.<label>.mdx` beside the others and
// append an entry here — nothing else changes.
// ---------------------------------------------------------------------------

export interface LessonVersion {
  label: string
  author: string
  note: string
  /** Omitted versions inherit the lesson's status. Working rewrites stay draft. */
  status?: LessonStatus
  Content: ComponentType
}

// A lesson always has at least one version, so the type says so and no
// reader of `versions[0]` needs a guard.
export type LessonVersions = readonly [LessonVersion, ...LessonVersion[]]

/** The single-version case, which is every lesson until a rewrite lands. */
function sole(Content: ComponentType): LessonVersions {
  return [{ label: 'I', author: 'baseline', note: 'the only version', Content }]
}

export interface Lesson {
  id: string
  field: Field
  order: number
  title: string
  blurb: string
  tags: readonly Tag[]
  status: LessonStatus
  versions: LessonVersions
  preview: LessonPreviewSpec
}

// Vite's published-lessons-only build plugin strips unpublished entries and MDX
// imports. Dev sees this full catalogue; production lookups cannot reach drafts.
export const lessons: Lesson[] = [
  {
    id: 'wave-particle-duality',
    preview: { poster: new URL('../assets/lesson-previews/wave-particle-duality.png', import.meta.url).href,
      width: 720, height: 360, warmup: 6,
      load: () => import('../sims/physics/PhotonRain').then(m => m.createPhotonRain({ current: 500 })) },
    field: 'physics',
    order: 1,
    title: 'Is Light a Wave or a Particle?',
    blurb:
      'It cannot be both. It is both. Send photons through two slits one at a time, watch the contradiction assemble itself, and find the rule that makes a paradox compute.',
    tags: ['quantum', 'optics', 'waves', 'probability'],
    status: { kind: 'draft' },
    versions: sole(Physics01),
  },
  {
    id: 'einstein-grossmann',
    preview: { poster: new URL('../assets/lesson-previews/einstein-grossmann.png', import.meta.url).href,
      width: 720, height: 360, warmup: 96,
      load: () => import('../sims/physics/MercuryGrade').then(m => m.createMercuryGrade({ current: 0.45 })) },
    field: 'physics',
    order: 2,
    title: 'The Draft That Had to Fail',
    blurb:
      'Einstein had the physics of gravity and no mathematics to write it in; his classmate Grossmann answered with curved geometry. Their joint draft got the shape right and the law wrong — and Mercury graded it.',
    tags: ['geometry', 'history'],
    status: { kind: 'draft' },
    versions: sole(Physics02G),
  },
  {
    id: 'pbits',
    preview: { poster: new URL('../assets/lesson-previews/pbits.png', import.meta.url).href,
      width: 720, height: 460, warmup: 3,
      crop: { x: 12, y: 30, width: 432, height: 344 },
      load: () => import('../sims/pbits/BilledWall').then(m => m.createBilledWall(false)) },
    field: 'thermo',
    order: 1,
    title: 'A Computer Made of Noise',
    blurb:
      'Randomly flipping bits can be connected and trained to generate patterns. Small simulations show how the sampling works and compare its results with exact probabilities.',
    tags: ['probability', 'simulation'],
    status: { kind: 'draft' },
    versions: sole(Physics02),
  },
  {
    id: 'z1-compiler',
    preview: { poster: new URL('../assets/lesson-previews/z1-compiler.png', import.meta.url).href,
      width: 720, height: 380, warmup: 3,
      load: () => import('../sims/pbits/WalkHero').then(m => m.createWalkHero(true)) },
    field: 'thermo',
    order: 2,
    title: 'Compiling Into Heat',
    blurb:
      'Extropic’s Z1 has fixed wiring. Compiling a probabilistic program onto it means fitting each step to the available connections, then checking how approximation errors accumulate as the steps run.',
    tags: ['probability', 'simulation'],
    status: { kind: 'draft' },
    versions: sole(Physics03),
  },
  {
    id: 'ebm-diffusion',
    preview: { poster: new URL('../assets/lesson-previews/ebm-diffusion.png', import.meta.url).href,
      width: 720, height: 460, warmup: 3,
      load: () => import('../sims/pbits/BilledWall').then(m => m.createBilledWall(false)) },
    field: 'thermo',
    order: 3,
    title: 'Diffusion on a Dreaming Machine',
    blurb:
      'A diffusion model generates small binary images on a model of Z1. Estimated costs for writing inputs, sampling, readout, and reprogramming show how execution order changes the energy used per image.',
    tags: ['probability', 'simulation'],
    status: { kind: 'draft' },
    versions: sole(Thermo03),
  },
  {
    id: 'navier-stokes',
    preview: { poster: new URL('../assets/lesson-previews/navier-stokes.png', import.meta.url).href,
      width: 720, height: 360, warmup: 2,
      load: () => import('../sims/history/flow').then(m => m.createHistoryFlow('yours')) },
    field: 'waves',
    order: 1,
    title: 'Building the Navier–Stokes Equations',
    blurb:
      'Meet each piece of fluid motion on its own, see why it alone falls short, then assemble the equation and run it live.',
    tags: ['fluids', 'pde', 'simulation'],
    status: { kind: 'published' },
    versions: [
      {
        label: 'I',
        author: 'baseline',
        note: 'Construction revision checkpoint · 11 September 2026',
        Content: Lesson01I,
      },
      {
        label: 'II',
        author: 'working draft',
        status: { kind: 'draft' },
        note: 'Revised experiments · parcels, viscosity, matched flows, and plate-to-pipe prediction',
        Content: Lesson01II,
      },
    ],
  },
  {
    id: 'fiber-bundles',
    preview: { poster: new URL('../assets/lesson-previews/fiber-bundles.png', import.meta.url).href,
      width: 720, height: 340, warmup: 1,
      crop: { x: 0, y: 30, width: 720, height: 270 },
      load: () => import('../sims/HopfMonopole').then(m => m.createHopfMonopole({
        down: false, pressed: false, fx: 0, fy: 0,
      })) },
    field: 'waves',
    order: 2,
    title: 'Fiber Bundles, the Universal Medium',
    blurb:
      'Light waves in no substance ever found. Build the geometric object that is its true medium — and earn the derivative that makes it move.',
    tags: ['geometry', 'waves', 'electromagnetism'],
    status: { kind: 'draft' },
    versions: sole(Lesson02),
  },
  {
    id: 'navier-stokes-history',
    preview: { poster: new URL('../assets/lesson-previews/navier-stokes-history.png', import.meta.url).href,
      width: 720, height: 360, warmup: 1,
      load: () => import('../sims/history/flow').then(m => m.createHistoryFlow('euler')) },
    field: 'waves',
    order: 3,
    title: 'The History of Navier–Stokes',
    blurb:
      'The partner to lesson 01: the same equation, built again — this time by history. Five discoveries, two strangers in the name, a 152-year paradox, and a million-dollar question still open.',
    tags: ['fluids', 'history', 'pde'],
    status: { kind: 'published' },
    versions: sole(Lesson03),
  },
  {
    id: 'learned-solver',
    preview: { poster: new URL('../assets/lesson-previews/learned-solver.png', import.meta.url).href,
      width: 720, height: 300, warmup: 0,
      load: () => import('../sims/learned/WarmStartRace').then(m => m.createWarmStartRace({
        spec: m.RACE_CASES[0], tolRef: { current: 0.001 },
      })) },
    field: 'waves',
    order: 4,
    title: 'Teaching a Solver to Guess',
    blurb:
      'A network of 809 weights, trained on this site’s own solver, writes the pressure field before the first sweep: nine tenths right, and worse than an empty grid on the meter the solve stops by. The sweeps that start from it win anyway. Why the meter cannot see what the guess got right, why the guess cannot move the answer, and the 1952 algorithm that beats it.',
    tags: ['fluids', 'simulation', 'linear-algebra'],
    status: { kind: 'draft' },
    versions: [
      {
        label: 'I',
        author: 'baseline',
        note: 'v2 as built 2026-08-25: two networks, the map act, ~6,050 words',
        Content: Lesson04I,
      },
      {
        label: 'II',
        author: 'Fable',
        note: 'v3 rewritten from scratch 2026-09-02: one network, one failure chain, ~2,650 words',
        Content: Lesson04II,
      },
    ],
  },
  {
    id: 'where-the-simulation-is-wrong',
    preview: { poster: new URL('../assets/lesson-previews/where-the-simulation-is-wrong.png', import.meta.url).href,
      width: 720, height: 300, warmup: 1,
      load: () => import('../sims/learned/SmearRace').then(m => m.createSmearRace({ current: 4 })) },
    field: 'waves',
    order: 5,
    title: 'Where the Simulation Is Wrong',
    blurb:
      'Five places a fluid or wave model is wrong, and every way a network is now used to fix them, ordered by what can still check it: a residual that acquits, a conservation law that only convicts, a finer run, an observation, or nothing. The gain grows down the ladder and the checks vanish.',
    tags: ['fluids', 'simulation', 'waves'],
    status: { kind: 'draft' },
    versions: sole(Lesson05),
  },
  {
    id: 'jacobian-hessian',
    preview: { poster: new URL('../assets/lesson-previews/jacobian-hessian.png', import.meta.url).href,
      width: 720, height: 300, warmup: 0,
      load: () => import('../sims/maths/WarpLoupe').then(m => m.createWarpLoupe('return', { current: {
        probe: { x: 0.45, y: 0.3 }, zoom: 0.55, preset: 'swirl', flowK: 0.9,
      } })) },
    field: 'maths',
    order: 1,
    title: 'The Jacobian and the Hessian',
    blurb:
      'Zoom into any smooth map and a parallelogram lattice appears — four numbers per point. The Jacobian is that lattice; the Hessian is the same zoom aimed at the gradient.',
    tags: ['calculus', 'linear-algebra', 'geometry'],
    status: { kind: 'draft' },
    versions: sole(Maths01),
  },
  {
    id: 'cad-primitives',
    preview: { poster: new URL('../assets/lesson-previews/cad-primitives.png', import.meta.url).href,
      width: 720, height: 330, warmup: 0,
      load: () => import('../sims/cad/OneObject').then(m => m.createOneObjectPreview()) },
    field: 'cad',
    order: 1,
    title: 'Basis, Cage, and Boundary',
    blurb:
      'B-splines, NURBS, T-splines, SubD, and B-rep are not five ways to draw the same surface. Three are bases, one is an authoring mesh, one is topology — and one part carries all of them at once.',
    tags: ['geometry', 'linear-algebra', 'simulation'],
    status: { kind: 'draft' },
    versions: sole(Cad01),
  },
]

// ---------------------------------------------------------------------------
// Series — an ordered run of lessons meant to be read as one arc. Membership
// is declared here rather than inferred from `field`, so a field can later
// hold standalone lessons beside a series without the navigation lying.
// ---------------------------------------------------------------------------

export interface Series {
  id: string
  field: Field
  title: string
  lede: string
  inspiration: { name: string; url: string; note: string }
  lessonIds: readonly string[]
}

const seriesCatalog: readonly Series[] = [
  {
    id: 'thermo',
    field: 'thermo',
    title: 'Thermodynamic Computing — the trilogy',
    lede:
      'Extropic is a hardware company building chips for probabilistic AI. Its approach to thermodynamic computing uses thermal noise to make bits flip at random, while programmable connections control which patterns are likely to appear. Those patterns can represent samples from a trained model, including images. The three parts explain the physics, how a compiler maps programs onto the chip, and how to estimate the energy cost of generating an image.',
    inspiration: {
      name: 'Extropic',
      url: 'https://extropic.ai',
      note:
        'The simulations are based on Extropic’s published Z1 design and its Torx (arXiv:2608.01612) and Thermalizers (arXiv:2608.01615) papers. This series is independent and unaffiliated.',
    },
    lessonIds: ['pbits', 'z1-compiler', 'ebm-diffusion'],
  },
]

// Navigation and part counts use only lessons present in this build.
export const SERIES: readonly Series[] = seriesCatalog.map(series => ({
  ...series,
  lessonIds: series.lessonIds.filter(id => lessons.some(lesson => lesson.id === id)),
})).filter(series => series.lessonIds.length > 0)

// Absence is meaningful for both lookups (unknown URL id; lesson outside any
// series), so Option is honest.
export function seriesById(id: string): Series | undefined {
  return SERIES.find((s) => s.id === id)
}

export function seriesForLesson(
  lessonId: string,
): { series: Series; index: number } | undefined {
  for (const series of SERIES) {
    const index = series.lessonIds.indexOf(lessonId)
    if (index !== -1) return { series, index }
  }
  return undefined
}

// Absence is meaningful here (unknown lesson id from the URL), so Option is honest.
export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
}

/** The version the site shows when the URL names none. */
export function defaultVersion(lesson: Lesson): LessonVersion {
  return lesson.versions[0]
}

// Absence is meaningful (a `?v=` label no version carries), so Option is honest.
export function versionOf(lesson: Lesson, label: string): LessonVersion | undefined {
  return lesson.versions.find((v) => v.label === label)
}

/** Lesson number as it is printed: `P1`, `02`, `M1`. */
export function lessonNumber(lesson: Lesson): string {
  const { prefix } = FIELD_SPEC[lesson.field]
  return prefix ? `${prefix}${lesson.order}` : String(lesson.order).padStart(2, '0')
}

/** Only tags some lesson actually carries, in TAGS order, with their counts. */
export function tagsInUse(): Array<{ tag: Tag; count: number }> {
  return TAGS.map((tag) => ({
    tag,
    count: lessons.filter((l) => l.tags.includes(tag)).length,
  })).filter((t) => t.count > 0)
}

/** Every lesson, field order first, then per-field order. */
export function allLessons(): Lesson[] {
  const rank = (f: Field) => FIELD_ORDER.indexOf(f)
  return [...lessons].sort((a, b) => rank(a.field) - rank(b.field) || a.order - b.order)
}
