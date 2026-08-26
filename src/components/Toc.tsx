import { Link } from 'react-router-dom'
import {
  lessonNumber,
  TAG_LABEL,
  type Lesson,
  type LessonStatus,
  type Tag,
} from '../lessons/registry'

const STATUS_LABEL: Record<LessonStatus['kind'], string> = {
  planned: 'Planned',
  draft: 'Draft',
  published: 'Published',
}

// Status is a quiet colored micro-label (the quantity palette), not a pill.
export function StatusTag({ status }: { status: LessonStatus }) {
  return <span className={`toc-status toc-status--${status.kind}`}>{STATUS_LABEL[status.kind]}</span>
}

/** The tag strip under a lesson blurb. Inert here — filtering lives on /all. */
function TagRow({ tags }: { tags: readonly Tag[] }) {
  return (
    <span className="toc-tags">
      {tags.map((t) => (
        <span key={t} className="tag">
          {TAG_LABEL[t]}
        </span>
      ))}
    </span>
  )
}

/**
 * One list of lessons under an eyebrow. Home passes one field's lessons per
 * list; /all passes the filtered flat set. The numbers come from the registry,
 * so a lesson prints the same number wherever it appears.
 */
export function TocList({
  label,
  blurb,
  more,
  items,
}: {
  label: string
  blurb?: string
  more?: { to: string; label: string }
  items: Lesson[]
}) {
  return (
    <nav className="toc" aria-label={label}>
      <div className="toc-head-block">
        <p className="toc-eyebrow">{label}</p>
        {blurb && <p className="toc-eyebrow-blurb">{blurb}</p>}
        {more && (
          <p className="toc-eyebrow-more">
            <Link to={more.to}>{more.label}</Link>
          </p>
        )}
      </div>
      <ol className="toc-list">
        {items.map((l) => (
          <li key={l.id} className="toc-item">
            <Link to={`/lesson/${l.id}`} className="toc-link">
              <span className="toc-num">{lessonNumber(l)}</span>
              <span className="toc-main">
                <span className="toc-head">
                  <span className="toc-title">{l.title}</span>
                  <StatusTag status={l.status} />
                </span>
                <span className="toc-blurb">{l.blurb}</span>
                <TagRow tags={l.tags} />
              </span>
              <span className="toc-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
