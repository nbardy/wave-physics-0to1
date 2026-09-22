import './FiberStory.css'
/** Local story header keeps the epigraph and experiment together. */
export function FiberStoryHeader() {
  return <header>
    <h1>Fiber Bundles, the Universal Medium</h1>
    <blockquote style={{ background: 'transparent', borderLeft: '2px solid #a78bfa', borderRadius: 0, padding: '0.15rem 0 0.15rem 1.4rem', margin: '1.8rem 0 2rem', fontSize: '1.08em' }}>
      <p>What if waves are among the most beautiful &amp; powerful things in the world, and mathematicians generalized diff calculus so that there was a universal medium for all waves, yet didn’t tell anyone outside a few theoretical physicists?</p>
      <p>That would be fiber bundles. Just for openers.</p>
      <footer style={{ fontFamily: 'var(--font-ui, system-ui)', fontSize: '.75em', fontStyle: 'normal' }}>— Eric Weinstein, <a href="https://x.com/ericweinstein/status/2072746828731384136">the post that started this article</a></footer>
    </blockquote>
  </header>
}
