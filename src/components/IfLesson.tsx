import type { ReactNode } from 'react'
import { useCatalogue } from '../lessons/AudienceContext'
import { lessonById } from '../lessons/registry'

/**
 * Renders its children only when the visitor can open lesson `id`, so prose
 * never sends a reader to a draft. Available to every lesson's MDX.
 */
export function IfLesson({ id, children }: { id: string; children: ReactNode }) {
  const c = useCatalogue()
  return lessonById(c, id) ? <>{children}</> : null
}
