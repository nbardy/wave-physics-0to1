import { memo, useRef, useState } from 'react'
import { Sim } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { TeX } from '../components/TeX'
import { createTimeline, ERAS, timelineMix, timelinePresentation } from './history/timeline'
import { HISTORY_COMPARISON_COLOR } from './history/flow'

interface Term {
  tex: string
  color: string
  who: string
  bornYear: number
}
const TERMS: Term[] = [
  { tex: '\\frac{\\partial u}{\\partial t}', color: PALETTE.vel, who: 'Euler', bornYear: 1757 },
  { tex: '+\\,(u\\cdot\\nabla)u', color: PALETTE.dye, who: 'Euler', bornYear: 1757 },
  { tex: '=\\,-\\frac{\\nabla p}{\\rho}', color: PALETTE.pHi, who: 'Euler', bornYear: 1757 },
  { tex: '+\\,\\nu\\nabla^2 u', color: PALETTE.visc, who: 'Navier', bornYear: 1822 },
  { tex: '\\text{with}\\;\\nabla\\cdot u = 0', color: PALETTE.div, who: 'Euler', bornYear: 1757 },
]

const SEPIA = '#78716c' // lesson-03 palette contract: history furniture
const MUTED = '#c9c5be' // very muted gray for not-yet-born TeX pieces

function TermStrip({ year }: { year: number }) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: '0.75rem 1rem',
          fontSize: '1.05rem',
        }}
      >
        {TERMS.map((term, i) => {
          const born = year >= term.bornYear
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ color: born ? term.color : MUTED }}>
                <TeX>{term.tex}</TeX>
              </span>
              <span style={{ color: SEPIA, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
                {born ? `${term.who} · ${term.bornYear}` : '—'}
              </span>
            </div>
          )
        })}
        {/* The final plate is separate from the historical equation terms. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ color: SEPIA, fontSize: '0.9rem' }}>smoothness</span>
          <span style={{ color: SEPIA, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
            open (2000–)
          </span>
        </div>
      </div>
      {year >= 1999 && (
        <div style={{ color: SEPIA, fontSize: '0.7rem', marginTop: '0.5rem', fontFamily: 'ui-monospace, monospace' }}>
          advection · Stam 1999 — projection · Chorin 1968 — grid · Harlow &amp; Welch 1965
        </div>
      )}
    </div>
  )
}

const MemoTermStrip = memo(TermStrip)

export function TimelineHero({ height = 300 }: { height?: number }) {
  const [position, setPosition] = useState(0)
  const positionRef = useRef(position)
  const timelineRef = useRef<ReturnType<typeof createTimeline> | null>(null)
  positionRef.current = position
  const { left, right, alpha } = timelineMix(position)
  const { base } = timelinePresentation(position)
  const era = ERAS[left], next = ERAS[right]
  const mixLabel = alpha === 0 ? `${era.year} · ${era.name}`
    : `${era.year} ${Math.round((1 - alpha) * 100)}%, ${base === left ? 'normal colors' : 'cyan comparison'} · ${next.year} ${Math.round(alpha * 100)}%, ${base === right ? 'normal colors' : 'cyan comparison'}`
  const key = (index: number) => (
    <span className="timeline-color-key" aria-hidden="true" style={{
      background: index === base ? `linear-gradient(90deg, ${PALETTE.dye} 50%, ${PALETTE.dye2} 50%)` : HISTORY_COMPARISON_COLOR,
    }} />
  )
  return (
    <div className="history-timeline">
      <div className="timeline-heading">
        <span className="timeline-years">
          {era.year}{alpha > 0 ? ` ↔ ${next.year}` : ''}
        </span>
        <span className="timeline-names">
          <span>{key(left)}{era.name}{alpha > 0 ? ` ${(100 * (1 - alpha)).toFixed(0)}%` : ''}</span>
          {alpha > 0 && <>{' · '}<span>{key(right)}{next.name} {(100 * alpha).toFixed(0)}%</span></>}
        </span>
      </div>
      <Sim height={height} aspectRatio={2} create={() => {
        const timeline = createTimeline(positionRef)
        timelineRef.current = timeline
        return timeline
      }}>
        <button type="button" onClick={() => timelineRef.current?.markWake()}>Mark the wake</button>
        <div className="timeline-scrubber">
          <input
            aria-label="Year"
            aria-valuetext={mixLabel}
            type="range"
            min={0}
            max={ERAS.length - 1}
            step={0.01}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          />
          <div className="timeline-notches">
            {ERAS.map((item, i) => (
              <button type="button" key={item.year} aria-label={`${item.year} · ${item.name}`}
                aria-pressed={position === i} onClick={() => setPosition(i)}
                style={{ left: `${i / (ERAS.length - 1) * 100}%` }}>
                <span className="timeline-notch" aria-hidden="true" />
                {item.year}
              </button>
            ))}
          </div>
        </div>
      </Sim>
      <MemoTermStrip year={ERAS[Math.round(position)].year} />
    </div>
  )
}
