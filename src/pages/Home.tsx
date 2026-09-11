import { Link } from 'react-router-dom'
import { FIELDS, lessons, SERIES } from '../lessons/registry'
import { TocList } from '../components/Toc'

export default function Home() {
  return (
    <div className="home">
      <header className="masthead">
        <p className="masthead-eyebrow">Explorable lessons · one field at a time</p>
        <h1 className="masthead-title">Nick&rsquo;s Visual Math Lessons</h1>
        <p className="masthead-lede">
          Every lesson is a derivation you can poke at: rigorous where it has to be, and built
          around simulations that run the physics rather than illustrate it. The fields below are
          independent — start wherever you like.
        </p>
        <p className="masthead-links">
          <Link to="/all">Browse everything, by tag →</Link>
        </p>
      </header>

      {FIELDS.map(({ field, label, blurb }) => {
        const items = lessons.filter((l) => l.field === field).sort((a, b) => a.order - b.order)
        if (items.length === 0) return null
        const series = SERIES.find((s) => s.field === field)
        const more = series && { to: `/series/${series.id}`, label: 'Read it as a series →' }
        return <TocList key={field} label={label} blurb={blurb} more={more} items={items} />
      })}
    </div>
  )
}
