import { Link, useSearchParams } from 'react-router-dom'
import { allLessons, FIELDS, TAGS, TAG_LABEL, tagsInUse, type Catalogue, type Lesson, type Tag } from '../lessons/registry'
import { useCatalogue } from '../lessons/AudienceContext'
import { TocList } from '../components/Toc'
import { NewsletterIntro } from '../components/NewsletterSignup'
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
    <div className="home topics-page">
      <header className="masthead masthead--compact">
        <p className="masthead-eyebrow">Explore the lessons</p>
        <h1 className="masthead-title">Topics &amp; series</h1>
        <p className="masthead-lede">
          Follow a series from the beginning, or explore a subject below.
        </p>
        <p className="topics-summary">
          {c.lessons.length} lessons · {FIELDS.filter(({ field }) => c.lessons.some((l) => l.field === field)).length} subjects · {c.series.length} series
        </p>
        <NewsletterIntro />
      </header>

      <details className="topics-filters" open={filter.kind !== 'all'}>
        <summary className="topics-filter-label" id="topic-filter-label">
          Filter lessons by topic
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
        <section className="topics-section" aria-labelledby="topics-series-heading">
          <div className="topics-section-heading">
            <h2 id="topics-series-heading">Series</h2>
            <p>Read the parts in order.</p>
          </div>
          {series.map((entry) => (
            <article key={entry.id} id={`series-${entry.id}`} className="topics-series">
              <div className="topics-series-heading">
                <div>
                  <p className="topics-series-count">{entry.lessonIds.length} parts{entry.parts.length < entry.lessonIds.length ? ` · ${entry.parts.length} matching` : ''}</p>
                  <h3><Link to={`/series/${entry.id}`}>{entry.title}</Link></h3>
                </div>
                <Link className="topics-series-start" to={`/series/${entry.id}`}>View series <span aria-hidden="true">→</span></Link>
              </div>
              <ol className="topics-series-parts">
                {entry.parts.map(({ lesson, number }) => (
                  <li key={lesson.id}>
                    <Link to={`/lesson/${lesson.id}`} className="topics-series-part">
                      <span className="topics-part-number">{String(number).padStart(2, '0')}</span>
                      <span>{lesson.title}</span><span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}
      <div className="topics-section-heading topics-directory-heading">
        <h2 id="topics-subjects-heading">Topics</h2>
        <p>Browse by subject, or filter across them.</p>
      </div>

      <nav className="topic-directory" aria-label="Jump to a subject">
        {subjects.map(({ field, label, count, anchor }) => (
          <a key={field} href={`#${anchor}`} className="topic-directory-link">
            <span>{label}</span>
            <span className="topic-directory-count">{count} {count === 1 ? 'lesson' : 'lessons'} <span aria-hidden="true">↗</span></span>
          </a>
        ))}
      </nav>


      {items.length === 0 ? (
        <p className="all-empty">No lessons match this topic. <button type="button" className="topics-reset" onClick={() => select(null)}>Show all lessons.</button></p>
      ) : (
        <>
          {groups.length > 0 && (
            <section className="topics-section" aria-labelledby="topics-subjects-heading">
              {groups.map(({ field, label, items: lessons }) => (
                <div key={field} id={`topic-${field}`} className="topics-group">
                  <TocList label={`${label} · ${lessons.length}`} items={lessons} compact headingLevel={3} />
                </div>
              ))}
            </section>
          )}
        </>
      )}
      <p className="all-fields"><Link to="/">← All visual lessons</Link></p>
    </div>
  )
}
