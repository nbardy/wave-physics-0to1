import type { ReactElement } from 'react'
import { useCatalogue } from '../lessons/AudienceContext'
import type { Audience } from '../lessons/registry'

// The quiet line at the top of every page while drafts are visible, so the
// editor knows the flag is on and how to see what a reader sees.
const BANNER: Record<Audience['kind'], () => ReactElement | null> = {
  reader: () => null,
  editor: () => (
    <p className="draft-banner" role="status">
      Drafts and versions are visible. Add <code>?draft=false</code> to any address to see the reader’s view.
    </p>
  ),
}

export function DraftBanner() {
  const { audience } = useCatalogue()
  return BANNER[audience.kind]()
}
