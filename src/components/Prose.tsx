import { useState, type ReactNode } from 'react'
import { PALETTE, type PaletteKey } from '../sims/lib/palette'

/**
 * Colored vocabulary — the prose↔figure binding (Essence §3). A word printed in
 * the color of the quantity it names. `k` is typed against the palette contract,
 * so an unknown quantity is a compile error, not a silent gray.
 */
export function C({ k, children }: { k: PaletteKey; children: ReactNode }) {
  return <strong style={{ color: PALETTE[k], fontWeight: 600 }}>{children}</strong>
}

/**
 * Waypoint — a two-sentence "what you now hold" consolidation at act boundaries
 * (METHODOLOGY §0 deviation #3).
 */
export function Waypoint({ children }: { children: ReactNode }) {
  return (
    <aside className="waypoint">
      <span className="waypoint-label">where we stand</span>
      {children}
    </aside>
  )
}

/**
 * Predict — commit before reveal (METHODOLOGY §0 deviation #2). The reader picks
 * one of two answers; the figure below is revealed only after the commitment.
 * No scoring, no judgment — the readout sentence after the figure does that work.
 */
export function Predict({
  question,
  a,
  b,
  children,
}: {
  question: string
  a: string
  b: string
  children: ReactNode
}) {
  const [choice, setChoice] = useState<'a' | 'b' | null>(null)
  // The figure stays mounted throughout: pre-commit it runs live behind a heavy
  // blur + shimmer veil (the motion teases; the blur keeps meters and shapes
  // unreadable, so nothing is spoiled), and committing unblurs it in place.
  return (
    <div className="predict">
      <p className="predict-question">{question}</p>
      {choice === null ? (
        <div className="predict-options">
          <button type="button" onClick={() => setChoice('a')}>
            {a}
          </button>
          <button type="button" onClick={() => setChoice('b')}>
            {b}
          </button>
        </div>
      ) : (
        <p className="predict-committed">
          You predicted: <em>{choice === 'a' ? a : b}</em> — see for yourself.
        </p>
      )}
      <div
        className={choice === null ? 'predict-figure predict-veiled' : 'predict-figure'}
        aria-hidden={choice === null}
      >
        {children}
        <div className="predict-veil" />
      </div>
    </div>
  )
}
