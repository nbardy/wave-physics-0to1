import { Link } from 'react-router-dom'
import type { Lesson, LessonVersion } from '../lessons/registry'

/**
 * The strip above a lesson that carries more than one version: one button per
 * version (I · II · III), the active one filled, and the active version's
 * note under it so a reader knows which draft they are holding. Renders
 * nothing for a lesson with a single version — the default reader never sees
 * that versions exist.
 */
export function VersionSwitch({ lesson, active }: { lesson: Lesson; active: LessonVersion }) {
  if (lesson.versions.length < 2) return null
  return (
    <nav className="version-switch" aria-label="lesson versions">
      <div className="version-switch-row">
        <span className="version-switch-eyebrow">Versions</span>
        {lesson.versions.map((v) => (
          <Link
            key={v.label}
            to={v === lesson.versions[0] ? `/lesson/${lesson.id}` : `/lesson/${lesson.id}?v=${v.label}`}
            className={v.label === active.label ? 'version-pill version-pill--active' : 'version-pill'}
            title={`${v.author} — ${v.note}`}
            aria-current={v.label === active.label ? 'page' : undefined}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <p className="version-switch-note">
        <span className="version-switch-author">{active.author}</span> · {active.note}
      </p>
    </nav>
  )
}
