import type { ComponentType } from 'react'
import Lesson01 from './lesson-01-navier-stokes.mdx'
import Lesson02 from './lesson-02-fiber-bundles.mdx'
import Lesson03 from './lesson-03-navier-stokes-history.mdx'
import Maths01 from './maths-01-jacobian-hessian.mdx'
import Physics01 from './physics-01-wave-particle.mdx'
import Physics02 from './physics-02-pbits.mdx'

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

export type Field = 'physics' | 'waves' | 'maths'

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
}

export const FIELD_ORDER: readonly Field[] = ['physics', 'waves', 'maths']

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

export interface Lesson {
  id: string
  field: Field
  order: number
  title: string
  blurb: string
  tags: readonly Tag[]
  status: LessonStatus
  Content: ComponentType
}

export const lessons: Lesson[] = [
  {
    id: 'wave-particle-duality',
    field: 'physics',
    order: 1,
    title: 'Is Light a Wave or a Particle?',
    blurb:
      'It cannot be both. It is both. Send photons through two slits one at a time, watch the contradiction assemble itself, and find the rule that makes a paradox compute.',
    tags: ['quantum', 'optics', 'waves', 'probability'],
    status: { kind: 'draft' },
    Content: Physics01,
  },
  {
    id: 'pbits',
    field: 'physics',
    order: 2,
    title: 'A Computer Made of Noise',
    blurb:
      'A chip that computes with the thermal noise every other chip fights. Build it from one flickering coin — and build the instrument that catches a fast sampler telling a confident lie.',
    tags: ['probability', 'simulation'],
    status: { kind: 'draft' },
    Content: Physics02,
  },
  {
    id: 'navier-stokes',
    field: 'waves',
    order: 1,
    title: 'Building the Navier–Stokes Equations',
    blurb:
      'Meet each piece of fluid motion on its own, see why it alone falls short, then assemble the equation and run it live.',
    tags: ['fluids', 'pde', 'simulation'],
    status: { kind: 'published' },
    Content: Lesson01,
  },
  {
    id: 'fiber-bundles',
    field: 'waves',
    order: 2,
    title: 'Fiber Bundles, the Universal Medium',
    blurb:
      'Light waves in no substance ever found. Build the geometric object that is its true medium — and earn the derivative that makes it move.',
    tags: ['geometry', 'waves', 'electromagnetism'],
    status: { kind: 'draft' },
    Content: Lesson02,
  },
  {
    id: 'navier-stokes-history',
    field: 'waves',
    order: 3,
    title: 'The History of Navier–Stokes',
    blurb:
      'The partner to lesson 01: the same equation, built again — this time by history. Five discoveries, two strangers in the name, a 152-year paradox, and a million-dollar question still open.',
    tags: ['fluids', 'history', 'pde'],
    status: { kind: 'draft' },
    Content: Lesson03,
  },
  {
    id: 'jacobian-hessian',
    field: 'maths',
    order: 1,
    title: 'The Jacobian and the Hessian',
    blurb:
      'Zoom into any smooth map and a parallelogram lattice appears — four numbers per point. The Jacobian is that lattice; the Hessian is the same zoom aimed at the gradient.',
    tags: ['calculus', 'linear-algebra', 'geometry'],
    status: { kind: 'draft' },
    Content: Maths01,
  },
]

// Absence is meaningful here (unknown lesson id from the URL), so Option is honest.
export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
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
