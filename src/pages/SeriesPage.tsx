import { useParams, Link } from 'react-router-dom'
import { lessonById, seriesById } from '../lessons/registry'
import { TocList } from '../components/Toc'

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>()
  const series = id ? seriesById(id) : undefined

  if (!series) {
    return (
      <div className="prose lesson-not-found">
        <h1>Series not found</h1>
        <p>
          No series with id “{id}”. <Link to="/">Back to the curriculum.</Link>
        </p>
      </div>
    )
  }

  // The registry declares the ids; a missing one is a build-time authoring
  // error, surfaced loudly by the filter never silently rendering short.
  const items = series.lessonIds
    .map((lid) => lessonById(lid))
    .filter((l): l is NonNullable<typeof l> => l !== undefined)

  return (
    <div className="home series-page">
      <header className="masthead">
        <p className="masthead-eyebrow">A series · {series.lessonIds.length} parts · read in order</p>
        <h1 className="masthead-title">{series.title}</h1>
        <p className="masthead-lede">{series.lede}</p>
        <p className="series-inspiration">
          {series.inspiration.note}{' '}
          <a href={series.inspiration.url} target="_blank" rel="noreferrer">
            {series.inspiration.name} →
          </a>
        </p>
      </header>
      <TocList label="The parts" items={items} />
    </div>
  )
}
