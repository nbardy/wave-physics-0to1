import { Link } from 'react-router-dom'
import './RelatedArticle.css'

const RELATED: Record<string, { to: string; title: string; description: string }> = {
  'navier-stokes': {
    to: 'navier-stokes-history',
    title: 'The History of Navier–Stokes',
    description: 'Follow the discoveries, experiments, and wrong turns that brought the equation together.',
  },
  'navier-stokes-history': {
    to: 'navier-stokes',
    title: 'Building the Navier–Stokes Equations',
    description: 'Build the equation term by term, and see what each piece does to a moving fluid.',
  },
}

export default function RelatedArticle({ lessonId }: { lessonId: string }) {
  const related = RELATED[lessonId]
  if (!related) return null
  return (
    <aside className="related-article" aria-label="Related article">
      <span className="related-article-kicker">You might also enjoy</span>
      <Link to={`/lesson/${related.to}`}>{related.title} <span aria-hidden="true">→</span></Link>
      <p>{related.description}</p>
    </aside>
  )
}
