import { useId, useState, type ComponentPropsWithoutRef, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import './NewsletterSignup.css'

type SignupState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'success' }
  | { kind: 'error'; message: string }
const RSS_URL = 'https://physics.nicholasbardy.com/rss.xml'

export default function NewsletterSignup() {
  const emailId = useId()
  const noteId = `${emailId}-note`
  const { pathname } = useLocation()
  const [state, setState] = useState<SignupState>({ kind: 'idle' })
  const [rss, setRss] = useState<'idle' | 'copied' | 'manual'>('idle')
  const endpoint = import.meta.env.VITE_NEWSLETTER_API_URL
    ?? 'https://visual-explainers-newsletter.nicholasbardy.workers.dev'

  async function copyFeed() {
    try {
      await navigator.clipboard.writeText(RSS_URL)
      setRss('copied')
    } catch {
      setRss('manual')
    }
  }

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.kind === 'sending') return
    const form = new FormData(event.currentTarget)
    setState({ kind: 'sending' })
    try {
      if (!endpoint) throw new Error('Signup is being set up. Please check back shortly.')
      const response = await fetch(`${endpoint}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), website: form.get('website'), source: pathname, consent: true }),
        signal: AbortSignal.timeout(15000),
      })
      const result: unknown = await response.json()
      if (!response.ok || !result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error : 'Signup didn’t go through. Please try again.'
        throw new Error(message)
      }
      setState({ kind: 'success' })
    } catch (error) {
      setState({ kind: 'error', message: error instanceof Error && error.name === 'Error'
        ? error.message : 'Couldn’t connect. Please try again.' })
    }
  }

  return (
    <form
      className="newsletter-signup"
      onSubmit={subscribe}
      aria-label="Email and RSS subscription"
    >
      <p className="newsletter-signup-heading">Get emailed every new visual explainer</p>
      <div className="newsletter-signup-controls">
        {state.kind !== 'success' && <input
          id={emailId}
          name="email"
          type="email"
          aria-label="Your email address"
          autoComplete="email"
          placeholder="Your email address"
          aria-describedby={noteId}
          required
          maxLength={254}
          disabled={state.kind === 'sending'}
        />}
        <div className="newsletter-signup-actions">
          {state.kind !== 'success' && <>
            <button type="submit" disabled={state.kind === 'sending'}>
              {state.kind === 'sending' ? 'Signing up…' : 'Sign up'}
            </button>
            <span className="newsletter-or">or</span>
          </>}
          <button type="button" className="newsletter-rss-button" onClick={copyFeed}
            aria-label="Copy RSS feed link" title="Copy RSS feed link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="5" cy="19" r="2" fill="currentColor" />
              <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {rss === 'copied' ? 'Copied' : 'RSS'}
          </button>
        </div>
      </div>
      <div className="newsletter-honeypot" aria-hidden="true">
        <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="newsletter-signup-note" id={noteId} role="status" aria-live="polite">
        {state.kind === 'success' ? 'You’re on the list. See you at the next explainer.'
          : state.kind === 'error' ? state.message : 'New explainers only. Unsubscribe anytime.'}
      </div>
      {rss !== 'idle' && <div className="newsletter-rss-help">
        <div role="status" aria-live="polite">
          {rss === 'copied' ? 'Feed link copied. Paste it into your RSS reader.'
            : 'Copy this link into your RSS reader:'}
          {' '}<a href={RSS_URL}>Open feed →</a>
        </div>
        {rss === 'manual' && <input type="url" value={RSS_URL} readOnly autoFocus
          aria-label="RSS feed URL" onFocus={event => event.currentTarget.select()} />}
      </div>}
    </form>
  )
}

// Pages place this after their heading or introductory header.
export function NewsletterIntro() {
  const { pathname } = useLocation()
  return <div id="newsletter"><NewsletterSignup key={pathname} /></div>
}

// The shared MDX heading keeps the article title ahead of the signup box.
export function LessonTitle(props: ComponentPropsWithoutRef<'h1'>) {
  return <><h1 {...props} /><NewsletterIntro /></>
}
