import { useId, useState, type ComponentPropsWithoutRef, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import './NewsletterSignup.css'

type SignupState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'success' }
  | { kind: 'error'; message: string }

export default function NewsletterSignup() {
  const emailId = useId()
  const noteId = `${emailId}-note`
  const { pathname } = useLocation()
  const [state, setState] = useState<SignupState>({ kind: 'idle' })
  const endpoint = import.meta.env.VITE_NEWSLETTER_API_URL
    ?? 'https://visual-explainers-newsletter.nicholasbardy.workers.dev'

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
      aria-label="Article email subscription"
    >
      <label htmlFor={emailId}>Get emailed every new visual explainer</label>
      {state.kind !== 'success' && <div className="newsletter-signup-controls">
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          aria-describedby={noteId}
          required
          maxLength={254}
          disabled={state.kind === 'sending'}
        />
        <button type="submit" disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>}
      <div className="newsletter-honeypot" aria-hidden="true">
        <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="newsletter-signup-note" id={noteId} role="status" aria-live="polite">
        {state.kind === 'success' ? 'You’re on the list. See you at the next explainer.'
          : state.kind === 'error' ? state.message : 'New explainers only. Unsubscribe anytime.'}
      </div>
      <a className="newsletter-rss" href={`${import.meta.env.BASE_URL}rss.xml`}>Or follow via RSS →</a>
    </form>
  )
}

// Every MDX article gets the same signup directly below its title.
export function LessonTitle(props: ComponentPropsWithoutRef<'h1'>) {
  return <><h1 {...props} /><NewsletterSignup /></>
}
