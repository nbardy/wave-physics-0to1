import { Link } from 'react-router-dom'
import { FIELD_SPEC, lessonById, seriesForLesson } from '../lessons/registry'

/**
 * The quiet strip above a series lesson: which series this is, which part
 * you are on, and the way to the series page. Renders nothing for a lesson
 * outside any series.
 */
export function SeriesBanner({ lessonId }: { lessonId: string }) {
  const hit = seriesForLesson(lessonId)
  if (!hit) return null
  const { series, index } = hit
  return (
    <p className="series-banner">
      <span>
        {FIELD_SPEC[series.field].label} · Part {index + 1} of {series.lessonIds.length}
      </span>
      <Link to={`/series/${series.id}`}>About this series →</Link>
    </p>
  )
}

/**
 * The footer under a series lesson: the next part by title, or — after the
 * finale — the way back to the whole arc.
 */
export function SeriesNext({ lessonId }: { lessonId: string }) {
  const hit = seriesForLesson(lessonId)
  if (!hit) return null
  const { series, index } = hit
  const nextId = series.lessonIds[index + 1]
  const next = nextId ? lessonById(nextId) : undefined
  return (
    <nav className="series-next" aria-label="series navigation">
      {next ? (
        <Link to={`/lesson/${next.id}`} className="series-next-link">
          <span className="series-next-eyebrow">
            Next in the series · Part {index + 2} of {series.lessonIds.length}
          </span>
          <span className="series-next-title">{next.title} →</span>
        </Link>
      ) : (
        <Link to={`/series/${series.id}`} className="series-next-link">
          <span className="series-next-eyebrow">The series ends here</span>
          <span className="series-next-title">Back to the whole trilogy →</span>
        </Link>
      )}
    </nav>
  )
}
