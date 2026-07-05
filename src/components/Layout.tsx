import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <header className="site-header">
        <Link to="/" className="brand">
          Wave Physics <span className="brand-arrow">0&nbsp;→&nbsp;1</span>
        </Link>
        <nav className="site-nav">
          <Link to="/">Curriculum</Link>
          <Link to="/stack-check">Stack&nbsp;check</Link>
        </nav>
      </header>
      <main className="content">{children}</main>
      <footer className="site-footer">
        A 0&nbsp;→&nbsp;PhD self-study in wave physics &amp; simulation.
      </footer>
    </div>
  )
}
