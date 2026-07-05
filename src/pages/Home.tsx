import { Link } from 'react-router-dom'
import { lessons, type LessonStatus } from '../lessons/registry'

const STATUS_LABEL: Record<LessonStatus['kind'], string> = {
  planned: 'Planned',
  draft: 'Draft',
  published: 'Published',
}

// Status is a quiet colored micro-label (the quantity palette), not a pill.
function StatusTag({ status }: { status: LessonStatus }) {
  return <span className={`toc-status toc-status--${status.kind}`}>{STATUS_LABEL[status.kind]}</span>
}

export default function Home() {
  const ordered = [...lessons].sort((a, b) => a.order - b.order)
  return (
    <div className="home">
      <header className="masthead">
        <p className="masthead-eyebrow">A self-study · fluid &amp; wave simulation</p>
        <h1 className="masthead-title">Wave Physics, 0&nbsp;→&nbsp;PhD</h1>
        <p className="masthead-lede">
          A from-scratch self-study that starts at the fundamentals and builds toward the
          PhD-level mathematics of wave simulation. Every lesson pairs a rigorous derivation with
          an interactive simulation you can poke at.
        </p>
      </header>

      <nav className="toc" aria-label="Curriculum">
        <p className="toc-eyebrow">Curriculum</p>
        <ol className="toc-list">
          {ordered.map((l) => (
            <li key={l.id} className="toc-item">
              <Link to={`/lesson/${l.id}`} className="toc-link">
                <span className="toc-num">{String(l.order).padStart(2, '0')}</span>
                <span className="toc-main">
                  <span className="toc-head">
                    <span className="toc-title">{l.title}</span>
                    <StatusTag status={l.status} />
                  </span>
                  <span className="toc-blurb">{l.blurb}</span>
                </span>
                <span className="toc-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
