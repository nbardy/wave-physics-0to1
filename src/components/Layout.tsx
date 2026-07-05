import { Link } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'

// The site chrome doesn't exist until you've scrolled past the opening title —
// so the top of any page reads like the first line of a document, not an app.
const REVEAL_AFTER = 120 // px scrolled before the header slides in (past the title)

export default function Layout({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AFTER)
    onScroll() // honor an initial scroll position (deep link, refresh mid-page)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app">
      <header className={`site-header${revealed ? ' is-revealed' : ''}`} aria-hidden={!revealed}>
        <Link to="/" className="brand">
          Wave&nbsp;Physics <span className="brand-mark">0&nbsp;→&nbsp;PhD</span>
        </Link>
        <nav className="site-nav">
          <Link to="/">Curriculum</Link>
          <Link to="/stack-check">Stack&nbsp;check</Link>
        </nav>
      </header>
      <main className="content">{children}</main>
      <footer className="site-colophon">
        <span>Wave Physics 0&nbsp;→&nbsp;PhD</span>
        <span>A self-study in fluid &amp; wave simulation.</span>
      </footer>
    </div>
  )
}
