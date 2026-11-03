import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { allLessons, FIELD_SPEC, FIELDS, TAGS, TAG_LABEL, tagsInUse, type Catalogue, type Lesson, type Tag } from '../lessons/registry'
import { useCatalogue } from '../lessons/AudienceContext'
import { StatusTag } from '../components/Toc'
import { LessonPreview } from '../components/LessonPreview'
import './Topics.css'

type Filter = { kind: 'all' } | { kind: 'tag'; tag: Tag } | { kind: 'unknown'; raw: string }
const isTag = (s: string): s is Tag => (TAGS as readonly string[]).includes(s)

function parseFilter(raw: string | null): Filter {
  if (raw === null || raw === '') return { kind: 'all' }
  if (isTag(raw)) return { kind: 'tag', tag: raw }
  return { kind: 'unknown', raw }
}

function selectLessons(c: Catalogue, filter: Filter): Lesson[] {
  const all = allLessons(c)
  if (filter.kind === 'all') return all
  if (filter.kind === 'tag') return all.filter((l) => l.tags.includes(filter.tag))
  return []
}

function LessonCard({ lesson, part }: { lesson: Lesson; part?: number }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <Link to={`/lesson/${lesson.id}`} className="browse-card"
      onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true) }}
      onPointerLeave={() => setHovered(false)}
      onFocus={event => setFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}>
      <LessonPreview id={lesson.id} spec={lesson.preview} active={hovered || focused} />
      <span className="browse-card-caption">
        <span className="browse-card-meta">
          {part !== undefined ? <span className="browse-part">Part {String(part).padStart(2, '0')}</span>
            : <span>{lesson.tags.map(tag => TAG_LABEL[tag]).join(' · ')}</span>}
          {lesson.status.kind !== 'published' && <StatusTag status={lesson.status} />}
        </span>
        <span className="browse-card-title">{lesson.title}</span>
        <span className="browse-card-arrow" aria-hidden="true">↗</span>
      </span>
    </Link>
  )
}

export default function All() {
  const c = useCatalogue()
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params.get('tag'))
  const items = selectLessons(c, filter)
  const active = filter.kind === 'tag' ? filter.tag : null
  const selected = new Set(items.map((lesson) => lesson.id))
  const series = c.series.map((entry) => ({
    ...entry,
    parts: entry.lessonIds.flatMap((id, index) => {
      const lesson = c.lessons.find((l) => l.id === id)
      return lesson && selected.has(id) ? [{ lesson, number: index + 1 }] : []
    }),
  })).filter((entry) => entry.parts.length > 0)
  const seriesIds = new Set(series.flatMap((entry) => entry.parts.map(({ lesson }) => lesson.id)))
  const groups = FIELDS.map((field) => ({
    ...field,
    items: items.filter((lesson) => lesson.field === field.field && !seriesIds.has(lesson.id)),
  })).filter((field) => field.items.length > 0)
  const subjects = FIELDS.map((field) => ({
    ...field,
    count: items.filter((lesson) => lesson.field === field.field).length,
    anchor: groups.some((group) => group.field === field.field)
      ? `topic-${field.field}`
      : `series-${series.find((entry) => entry.field === field.field)?.id}`,
  })).filter((field) => field.count > 0)

  const select = (tag: Tag | null) => {
    const next = new URLSearchParams(params)
    if (tag) next.set('tag', tag)
    else next.delete('tag')
    setParams(next, { replace: true })
  }

  return (
    <div className="topics-page">
      <header className="browse-header">
        <Link className="browse-home" to="/">Nick’s Visual Math Lessons</Link>
        <div className="browse-heading">
          <h1>Topics &amp; series</h1>
          <p>{c.lessons.length} visual lessons</p>
        </div>
        <nav className="browse-subjects" aria-label="Jump to a subject">
          {subjects.map(({ field, label, count, anchor }) => (
            <a key={field} href={`#${anchor}`}>{label}<span>{count}</span></a>
          ))}
        </nav>
      </header>

      <details className="topics-filters" open={filter.kind !== 'all'}>
        <summary className="topics-filter-label" id="topic-filter-label">
          Filter by topic
          {filter.kind === 'tag' && <span className="topics-filter-selection">{TAG_LABEL[filter.tag]} · {items.length}</span>}
        </summary>
        <div className="tagbar" role="group" aria-labelledby="topic-filter-label">
          <button type="button" className={`tag tag--button${filter.kind === 'all' ? ' tag--active' : ''}`}
            aria-pressed={filter.kind === 'all'} onClick={() => select(null)}>All lessons</button>
          {tagsInUse(c).map(({ tag, count }) => (
            <button key={tag} type="button" className={`tag tag--button${active === tag ? ' tag--active' : ''}`}
              aria-pressed={active === tag} onClick={() => select(active === tag ? null : tag)}>
              {TAG_LABEL[tag]}<span className="tag-count">{count}</span>
            </button>
          ))}
        </div>
        <p className="topics-filter-result" role="status">
          {filter.kind === 'tag' && `${items.length} ${items.length === 1 ? 'lesson' : 'lessons'} tagged ${TAG_LABEL[filter.tag]}`}
          {filter.kind === 'unknown' && `No lessons tagged “${filter.raw}”`}
        </p>
      </details>

      {series.length > 0 && (
        <section className="browse-series-section" aria-label="Series">
          {series.map((entry) => (
            <article key={entry.id} id={`series-${entry.id}`} className="browse-series">
              <div className="browse-section-heading">
                <div>
                  <p className="browse-eyebrow">A series in {entry.lessonIds.length} parts{entry.parts.length < entry.lessonIds.length ? ` · ${entry.parts.length} matching` : ''}</p>
                  <h2><Link to={`/series/${entry.id}`}>{FIELD_SPEC[entry.field].label}</Link></h2>
                </div>
                <Link className="browse-series-link" to={`/series/${entry.id}`}>Explore the series <span aria-hidden="true">→</span></Link>
              </div>
              <ol className="browse-series-parts">
                {entry.parts.map(({ lesson, number }) => (
                  <li key={lesson.id} value={number}><LessonCard lesson={lesson} part={number} /></li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}

      {items.length === 0 ? (
        <p className="all-empty">No lessons match this topic. <button type="button" className="topics-reset" onClick={() => select(null)}>Show all lessons.</button></p>
      ) : (
        <div className="browse-groups">
          {groups.map(({ field, label, items: lessons }) => (
            <section key={field} id={`topic-${field}`} className="browse-group" aria-labelledby={`heading-${field}`}>
              <div className="browse-section-heading">
                <h2 id={`heading-${field}`}>{label}</h2>
                <span className="browse-count">{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span>
              </div>
              <ul className="browse-grid">
                {lessons.map(lesson => <li key={lesson.id}><LessonCard lesson={lesson} /></li>)}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="all-fields"><Link to="/">← All visual lessons</Link></p>
    </div>
  )
}
