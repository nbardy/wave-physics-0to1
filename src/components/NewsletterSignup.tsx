import { useId, type ComponentPropsWithoutRef } from 'react'
import './NewsletterSignup.css'

export default function NewsletterSignup() {
  const emailId = useId()
  const noteId = `${emailId}-note`

  return (
    <form
      className="newsletter-signup"
      action="https://commemorovindico385902.substack.com/subscribe"
      method="get"
      aria-label="Article email subscription"
    >
      <label htmlFor={emailId}>Get new articles by email</label>
      <div className="newsletter-signup-controls">
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          aria-describedby={noteId}
          required
        />
        <button type="submit">Subscribe</button>
      </div>
      <div className="newsletter-signup-note" id={noteId}>
        Signup continues on Substack.
      </div>
    </form>
  )
}

export function LessonTitle(props: ComponentPropsWithoutRef<'h1'>) {
  return (
    <>
      <h1 {...props} />
      <NewsletterSignup />
    </>
  )
}
