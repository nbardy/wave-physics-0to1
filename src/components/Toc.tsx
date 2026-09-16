import { Link } from 'react-router-dom'
import { useState } from 'react'
import { LessonPreview } from './LessonPreview'
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

function LessonEntry({ lesson, numbered }: { lesson: Lesson; numbered: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <li className="toc-item">
      <Link to={`/lesson/${lesson.id}`} className="toc-link"
        onPointerEnter={e => { if (e.pointerType !== 'touch') setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onFocus={e => setFocused(e.currentTarget.matches(':focus-visible'))}
        onBlur={() => setFocused(false)}>
        {numbered && <span className="toc-num">{lessonNumber(lesson)}</span>}
        <span className="toc-head">
          <span className="toc-title">{lesson.title}</span>
          <StatusTag status={lesson.status} />
        </span>
        <span className="toc-arrow" aria-hidden="true">→</span>
        <LessonPreview id={lesson.id} spec={lesson.preview} active={hovered || focused} />
        <span className="toc-main">
          <span className="toc-blurb">{lesson.blurb}</span>
          <TagRow tags={lesson.tags} />
        </span>
      </Link>
    </li>
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
  numbered = true,
}: {
  label: string
  blurb?: string
  more?: { to: string; label: string }
  items: Lesson[]
  numbered?: boolean
}) {
  return (
    <nav className={`toc${numbered ? '' : ' toc--unnumbered'}`} aria-label={label}>
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
        {items.map(l => <LessonEntry key={l.id} lesson={l} numbered={numbered} />)}
      </ol>
    </nav>
  )
}
