import { useParams, useSearchParams, Link } from 'react-router-dom'
import { lessonById, defaultVersion, versionOf } from '../lessons/registry'
import { SeriesBanner, SeriesNext } from '../components/SeriesNav'
import { VersionSwitch } from '../components/VersionSwitch'
import NewsletterSignup from '../components/NewsletterSignup'
import RelatedArticle from '../components/RelatedArticle'

export default function LessonView() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const lesson = id ? lessonById(id) : undefined

  if (!lesson) {
    return (
      <div className="prose lesson-not-found">
        <h1>Lesson not found</h1>
        <p>
          No lesson with id “{id}”. <Link to="/">Back to the curriculum.</Link>
        </p>
      </div>
    )
  }

  // `?v=` absent → the default version; present → that version, or a loud
  // miss listing what exists, never a silent fall back to the default.
  const wanted = params.get('v')
  const version = wanted === null ? defaultVersion(lesson) : versionOf(lesson, wanted)

  if (!version) {
    return (
      <div className="prose lesson-not-found">
        <h1>No such version</h1>
        <p>
          “{lesson.title}” has no version “{wanted}”. It has{' '}
          {lesson.versions.map((v, i) => (
            <span key={v.label}>
              {i > 0 && ', '}
              <Link to={i === 0 ? `/lesson/${lesson.id}` : `/lesson/${lesson.id}?v=${v.label}`}>
                {v.label}
              </Link>
            </span>
          ))}
          .
        </p>
      </div>
    )
  }

  // Keyed on the version so switching remounts every figure with fresh state.
  const { Content } = version
  return (
    <article className="prose lesson">
      <SeriesBanner lessonId={lesson.id} />
      <VersionSwitch lesson={lesson} active={version} />
      <Content key={version.label} />
      <SeriesNext lessonId={lesson.id} />
      <RelatedArticle lessonId={lesson.id} />
      <NewsletterSignup key={lesson.id} />
    </article>
  )
}
