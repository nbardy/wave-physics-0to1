import { Link, useSearchParams } from 'react-router-dom'
import { allLessons, TAGS, TAG_LABEL, tagsInUse, type Lesson, type Tag } from '../lessons/registry'
import { TocList } from '../components/Toc'

// What the ?tag= parameter means, as a sum type. A string that isn't a known
// tag is its own case — the page says so rather than quietly showing everything.
type Filter = { kind: 'all' } | { kind: 'tag'; tag: Tag } | { kind: 'unknown'; raw: string }

const isTag = (s: string): s is Tag => (TAGS as readonly string[]).includes(s)

function parseFilter(raw: string | null): Filter {
  if (raw === null || raw === '') return { kind: 'all' }
  if (isTag(raw)) return { kind: 'tag', tag: raw }
  return { kind: 'unknown', raw }
}

function selectLessons(filter: Filter): Lesson[] {
  const all = allLessons()
  if (filter.kind === 'all') return all
  if (filter.kind === 'tag') return all.filter((l) => l.tags.includes(filter.tag))
  return []
}

function heading(filter: Filter, count: number): string {
  if (filter.kind === 'all') return `Every lesson · ${count}`
  if (filter.kind === 'tag') return `${TAG_LABEL[filter.tag]} · ${count}`
  return `“${filter.raw}” · 0`
}

export default function All() {
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params.get('tag'))
  const items = selectLessons(filter)
  const active = filter.kind === 'tag' ? filter.tag : null

  const select = (tag: Tag | null) => setParams(tag ? { tag } : {}, { replace: true })

  return (
    <div className="home">
      <header className="masthead masthead--compact">
        <p className="masthead-eyebrow">Index</p>
        <h1 className="masthead-title">All lessons</h1>
        <p className="masthead-lede">
          Every lesson from every field, in one list. The tags cut across the fields — a lesson can
          be filed under waves and still be mostly linear algebra.
        </p>
      </header>

      <div className="tagbar" role="group" aria-label="Filter by tag">
        <button
          type="button"
          className={`tag tag--button${filter.kind === 'all' ? ' tag--active' : ''}`}
          aria-pressed={filter.kind === 'all'}
          onClick={() => select(null)}
        >
          All
        </button>
        {tagsInUse().map(({ tag, count }) => (
          <button
            key={tag}
            type="button"
            className={`tag tag--button${active === tag ? ' tag--active' : ''}`}
            aria-pressed={active === tag}
            onClick={() => select(active === tag ? null : tag)}
          >
            {TAG_LABEL[tag]}
            <span className="tag-count">{count}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="all-empty">
          No lesson carries that tag. <Link to="/all">Show everything.</Link>
        </p>
      ) : (
        <TocList label={heading(filter, items.length)} items={items} />
      )}

      <p className="all-fields">
        <Link to="/">← Back to the fields</Link>
      </p>
    </div>
  )
}
