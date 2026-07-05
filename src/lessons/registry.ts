import type { ComponentType } from 'react'
import Lesson01 from './lesson-01-navier-stokes.mdx'
import Lesson02 from './lesson-02-fiber-bundles.mdx'
import Lesson03 from './lesson-03-navier-stokes-history.mdx'

// Lesson lifecycle as a sum type — rendering dispatches on `kind`, no stray
// defaults. Add `draft` / `published` variants as lessons get written.
export type LessonStatus =
  | { kind: 'planned' }
  | { kind: 'draft' }
  | { kind: 'published' }

export interface Lesson {
  id: string
  order: number
  title: string
  blurb: string
  status: LessonStatus
  Content: ComponentType
}

export const lessons: Lesson[] = [
  {
    id: 'navier-stokes',
    order: 1,
    title: 'Building the Navier–Stokes Equations',
    blurb:
      'Meet each piece of fluid motion on its own, see why it alone falls short, then assemble the equation and run it live.',
    status: { kind: 'draft' },
    Content: Lesson01,
  },
  {
    id: 'fiber-bundles',
    order: 2,
    title: 'Fiber Bundles, the Universal Medium',
    blurb:
      'Light waves in no substance ever found. Build the geometric object that is its true medium — and earn the derivative that makes it move.',
    status: { kind: 'draft' },
    Content: Lesson02,
  },
  {
    id: 'navier-stokes-history',
    order: 3,
    title: 'The History of Navier–Stokes',
    blurb:
      'The partner to lesson 01: the same equation, built again — this time by history. Five discoveries, two strangers in the name, a 152-year paradox, and a million-dollar question still open.',
    status: { kind: 'planned' },
    Content: Lesson03,
  },
]

// Absence is meaningful here (unknown lesson id from the URL), so Option is honest.
export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
}
