import { memo, useRef, useState } from 'react'
import { Sim } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { TeX } from '../components/TeX'
import { createTimeline, ERAS, timelineMix, timelinePresentation } from './history/timeline'
import { HISTORY_COMPARISON_COLOR } from './history/flow'

// A nameplate a term carries from a given year on. `written` says whether the
// term stood in an equation of motion by then: Newton stated the shear law as a
// hypothesis in 1687 and never wrote it into one, so the viscous term keeps its
// muted color under his plate until Navier.
interface Plate {
  year: number
  label: string
  written: boolean
}
interface Term {
  tex: string
  color: string
  plates: Plate[]
}
const EULER: Plate[] = [{ year: 1757, label: 'Euler · 1757', written: true }]
const TERMS: Term[] = [
  { tex: '\\frac{\\partial u}{\\partial t}', color: PALETTE.vel, plates: EULER },
  { tex: '+\\,(u\\cdot\\nabla)u', color: PALETTE.dye, plates: EULER },
  { tex: '=\\,-\\frac{\\nabla p}{\\rho}', color: PALETTE.pHi, plates: EULER },
  { tex: '+\\,\\nu\\nabla^2 u', color: PALETTE.visc, plates: [
    { year: 1687, label: 'Newton · 1687 · hypothesis', written: false },
    { year: 1822, label: 'Navier · 1822', written: true },
    { year: 1845, label: 'Navier · 1822 · Stokes · 1845', written: true },
  ] },
  { tex: '\\text{with}\\;\\nabla\\cdot u = 0', color: PALETTE.div, plates: EULER },
]
// Mathematics the equation borrowed, dated by when it arrived. Absence before
// the first plate is the meaning: nothing had been written yet.
const plateAt = (plates: Plate[], year: number): Plate | undefined => plates.filter(p => p.year <= year).at(-1)
const TOOLS: { year: number; label: string }[] = [
  { year: 1747, label: 'd’Alembert · 1747 · partial differential equation' },
  { year: 1822, label: 'Fourier · 1822 · heat operator' },
  { year: 1823, label: 'Cauchy · 1823 · stress tensor' },
  { year: 1845, label: 'Stokes · 1845 · viscosity measured' },
  { year: 1883, label: 'Reynolds · 1883 · UL/ν' },
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
          const plate = plateAt(term.plates, year)
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ color: plate?.written ? term.color : MUTED }}>
                <TeX>{term.tex}</TeX>
              </span>
              <span style={{ color: SEPIA, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
                {plate ? plate.label : '—'}
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem 1rem', marginTop: '0.55rem', fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
        {TOOLS.map(tool => (
          <span key={tool.year} style={{ color: year >= tool.year ? SEPIA : MUTED }}>{tool.label}</span>
        ))}
      </div>
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
