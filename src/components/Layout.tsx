import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import NewsletterSignup from './NewsletterSignup'

// Keep the site navigation tucked away until the reader starts scrolling.
const REVEAL_AFTER = 120 // px scrolled before the header slides in

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
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
          Nick&rsquo;s <span className="brand-mark">Visual&nbsp;Math&nbsp;Lessons</span>
        </Link>
        <nav className="site-nav">
          <Link to="/">Fields</Link>
          <Link to="/all">All</Link>
          <Link to="/stack-check">Stack&nbsp;check</Link>
        </nav>
      </header>
      <main className="content">
        <div id="newsletter" className="newsletter-placement--start">
          <NewsletterSignup key={`${pathname}-start`} />
        </div>
        {children}
        <div className="newsletter-placement--end">
          <NewsletterSignup key={`${pathname}-end`} />
        </div>
      </main>
      <footer className="site-colophon">
        <span>Nick&rsquo;s Visual Math Lessons</span>
        <span>Explorable physics and mathematics.</span>
        <a href={`${import.meta.env.BASE_URL}rss.xml`}>RSS</a>
      </footer>
    </div>
  )
}
