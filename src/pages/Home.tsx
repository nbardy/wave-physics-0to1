import { Link } from 'react-router-dom'
import { lessons, type LessonStatus } from '../lessons/registry'

// Thin dispatcher: badge label/style is chosen only by the status variant.
function StatusBadge({ status }: { status: LessonStatus }) {
  switch (status.kind) {
    case 'planned':
      return <span className="badge badge-planned">Planned</span>
    case 'draft':
      return <span className="badge badge-draft">Draft</span>
    case 'published':
      return <span className="badge badge-published">Published</span>
  }
}

export default function Home() {
  const ordered = [...lessons].sort((a, b) => a.order - b.order)
  return (
    <div className="home">
      <section className="hero">
        <h1>Wave Physics, 0 → PhD</h1>
        <p className="lede">
          A from-scratch self-study that starts at the fundamentals and builds toward the
          PhD-level mathematics of wave simulation. Every lesson pairs rigorous derivation with
          an interactive simulation you can poke at.
        </p>
      </section>

      <section className="lesson-list">
        <h2>Curriculum</h2>
        <ol className="lessons">
          {ordered.map((l) => (
            <li key={l.id} className="lesson-card">
              <Link to={`/lesson/${l.id}`}>
                <span className="lesson-order">{String(l.order).padStart(2, '0')}</span>
                <span className="lesson-body">
                  <span className="lesson-title">
                    {l.title} <StatusBadge status={l.status} />
                  </span>
                  <span className="lesson-blurb">{l.blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
