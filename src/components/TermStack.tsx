import { TeX } from './TeX'
import { PALETTE, type PaletteKey } from '../sims/lib/palette'

// The equation-with-birthdays display for lesson 03: Navier–Stokes assembled one
// term at a time, each term wearing its palette color and a nameplate for the
// person (and year) who first wrote it down. Terms not yet "discovered" show a
// muted placeholder rule instead of a name — the equation exists as a shape long
// before the physics under each term does.
//
// Pure DOM (not canvas): KaTeX for the math, flex-wrap so it reads cleanly at
// mobile widths. Physics colors come from PALETTE; the nameplate furniture uses
// the lesson-03 sepia (see SEPIA below).

// History-furniture color — nameplates, dates, hairline rules. This lesson's
// palette addition (not in lib/palette.ts, which is physics-quantity → color
// only). Warm gray so the historical chrome recedes behind the colored physics.
const SEPIA = '#78716c'

export type StackItem =
  | { kind: 'term'; tex: string; k: PaletteKey; name: string; year: string; filled: boolean }
  | { kind: 'sep'; tex: string }

// One clean path per kind — the type distinguishes the cases, so dispatch is a
// trivial switch with no default (StackItem is a closed union of two variants).
function renderItem(item: StackItem, i: number) {
  switch (item.kind) {
    case 'sep':
      return (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 0.15rem',
            // align the operator with the TeX row of neighboring terms, not the
            // full term column (which is taller because of the nameplate)
            alignSelf: 'flex-start',
            marginTop: '0.15rem',
            fontSize: '1.15rem',
          }}
        >
          <TeX>{item.tex}</TeX>
        </span>
      )
    case 'term':
      return <Term key={i} item={item} />
  }
}

function Term({ item }: { item: Extract<StackItem, { kind: 'term' }> }) {
  const nameplate = item.filled ? `${item.name} · ${item.year}` : '———'
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.1rem 0.35rem',
        gap: '0.28rem',
      }}
    >
      {/* KaTeX inherits currentColor, so coloring the wrapper colors the math */}
      <span style={{ color: PALETTE[item.k], fontSize: '1.15rem', lineHeight: 1.1 }}>
        <TeX>{item.tex}</TeX>
      </span>
      {/* hairline sepia rule between the math and its nameplate */}
      <span
        style={{
          display: 'block',
          width: '100%',
          height: 1,
          background: SEPIA,
          opacity: 0.4,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.62rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: SEPIA,
          // unfilled placeholder reads as absence, not a name
          opacity: item.filled ? 0.95 : 0.45,
        }}
      >
        {nameplate}
      </span>
    </span>
  )
}

export function TermStack({ items }: { items: StackItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0.25rem 0.35rem',
        padding: '0.9rem 0.5rem',
        color: 'var(--ink)',
      }}
    >
      {items.map(renderItem)}
    </div>
  )
}
