import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { clipPane, paneFrame, FONT_LABEL, FONT_METER, type Rect } from '../lib/chrome'
import { PANE_GAP, figureHeight, isStacked, useCanvasWidth } from './layout'

// CAD C1 figure 4 — where the T-mesh actually differs.
//
// This is a diagram of *support*, not a surface evaluator: it draws the control
// structure in parameter space, which is the only place the T-spline story
// happens. Both panes get the same edit request — one new knot line at the same
// place — and the counter under each says what the representation charged for
// it. Push the strip slider to full and the right pane becomes the left pane,
// which is the honest statement: a tensor grid is the T-mesh you get when every
// line runs the whole way.
//
// The footprints are computed the way a T-spline infers local knot vectors: from
// an anchor, walk outward and collect the lines you actually cross. An anchor
// beside the terminated strip crosses it; an anchor above the T-junction does
// not, and its support reaches further. That difference is the mechanism.

const COLS = 7
const ROWS = 6
const INSERT_AT = 3.5

export interface Shared {
  extent: number
  footprints: boolean
}

export function freshRefineState(): Shared {
  return { extent: 2, footprints: true }
}

/** Rows spanned by the refinement strip, centred in the patch. */
function band(extent: number): { lo: number; hi: number } {
  const lo = Math.floor((ROWS - extent) / 2)
  return { lo, hi: lo + extent - 1 }
}

interface Grid {
  x: (c: number) => number
  y: (r: number) => number
}

function gridOf(r: Rect): Grid {
  const pad = 34
  const w = r.w - pad * 2
  const h = r.h - pad * 2 - 26
  return {
    x: (c) => r.x + pad + (c / (COLS - 1)) * w,
    y: (row) => r.y + pad + h - (row / (ROWS - 1)) * h,
  }
}

/**
 * The support rectangle of the anchor at (col, row): walk two knot lines out in
 * each direction, counting the inserted strip only on the rows where it exists.
 */
function footprint(
  col: number,
  row: number,
  extent: number,
): { x0: number; x1: number; y0: number; y1: number } {
  const { lo, hi } = band(extent)
  const inStrip = row >= lo && row <= hi
  const verticals = [...Array(COLS).keys()].concat(inStrip ? [INSERT_AT] : []).sort((a, b) => a - b)
  const right = verticals.filter((v) => v > col)
  const left = verticals.filter((v) => v < col).reverse()
  return {
    x0: left[1] ?? left[left.length - 1] ?? 0,
    x1: right[1] ?? right[right.length - 1] ?? COLS - 1,
    y0: Math.max(0, row - 2),
    y1: Math.min(ROWS - 1, row + 2),
  }
}

function drawPane(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  title: string,
  extent: number,
  showFootprints: boolean,
) {
  const g = gridOf(r)
  const { lo, hi } = band(extent)
  const full = extent >= ROWS

  ctx.save()
  clipPane(ctx, r)

  if (showFootprints) {
    for (const row of [2, ROWS - 1]) {
      const f = footprint(3, row, extent)
      ctx.fillStyle = row === 2 ? 'rgba(124,58,237,0.16)' : 'rgba(8,145,178,0.16)'
      ctx.fillRect(g.x(f.x0), g.y(f.y1), g.x(f.x1) - g.x(f.x0), g.y(f.y0) - g.y(f.y1))
      ctx.strokeStyle = row === 2 ? 'rgba(124,58,237,0.6)' : 'rgba(8,145,178,0.6)'
      ctx.lineWidth = 1.2
      ctx.strokeRect(g.x(f.x0), g.y(f.y1), g.x(f.x1) - g.x(f.x0), g.y(f.y0) - g.y(f.y1))
    }
  }

  // the original grid
  ctx.strokeStyle = 'rgba(120,140,170,0.5)'
  ctx.lineWidth = 1
  for (let c = 0; c < COLS; c += 1) {
    ctx.beginPath()
    ctx.moveTo(g.x(c), g.y(0))
    ctx.lineTo(g.x(c), g.y(ROWS - 1))
    ctx.stroke()
  }
  for (let row = 0; row < ROWS; row += 1) {
    ctx.beginPath()
    ctx.moveTo(g.x(0), g.y(row))
    ctx.lineTo(g.x(COLS - 1), g.y(row))
    ctx.stroke()
  }

  // the inserted line — as far as this representation lets it stop
  ctx.strokeStyle = PALETTE.knot
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(g.x(INSERT_AT), g.y(lo))
  ctx.lineTo(g.x(INSERT_AT), g.y(hi))
  ctx.stroke()

  // original anchors
  for (let c = 0; c < COLS; c += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      ctx.beginPath()
      ctx.arc(g.x(c), g.y(row), 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(217,119,6,0.55)'
      ctx.fill()
    }
  }
  // the anchors the edit bought
  for (let row = lo; row <= hi; row += 1) {
    ctx.beginPath()
    ctx.arc(g.x(INSERT_AT), g.y(row), 4, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.knot
    ctx.fill()
  }
  // T-junctions: where the new line stops against a row
  if (!full) {
    ctx.strokeStyle = PALETTE.topo
    ctx.lineWidth = 2
    for (const row of [lo, hi]) {
      ctx.strokeRect(g.x(INSERT_AT) - 5, g.y(row) - 5, 10, 10)
    }
  }

  ctx.restore()
  paneFrame(ctx, r)

  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText(title, r.x + 10, r.y + 18)
  ctx.font = FONT_METER
  ctx.fillStyle = PALETTE.knot
  ctx.fillText(`+${extent} control points`, r.x + 10, r.y + r.h - 26)
  ctx.fillStyle = 'rgba(26,31,43,0.85)'
  ctx.fillText(`${COLS * ROWS + extent} total`, r.x + 10, r.y + r.h - 8)
  if (!full) {
    ctx.fillStyle = PALETTE.topo
    ctx.fillText('2 T-junctions', r.x + r.w - 96, r.y + r.h - 8)
  }
}

export function createRefineLocal(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const s = sharedRef.current
      // The comparison is the figure, so the two panes stay the same size as
      // each other in either arrangement — an unequal split would read as one
      // representation mattering more than the other.
      const stacked = isStacked(w)
      const pw = stacked ? w - 8 : (w - PANE_GAP - 8) / 2
      const ph = stacked ? (h - PANE_GAP - 8) / 2 : h - 8
      drawPane(ctx, { x: 4, y: 4, w: pw, h: ph }, 'tensor grid · the line must cross', ROWS, s.footprints)
      drawPane(
        ctx,
        stacked
          ? { x: 4, y: 4 + ph + PANE_GAP, w: pw, h: ph }
          : { x: 4 + pw + PANE_GAP, y: 4, w: pw, h: ph },
        'T-mesh · the line may stop',
        s.extent,
        s.footprints,
      )
    },
  }
}

export function RefineLocal() {
  const sharedRef = useRef<Shared>(freshRefineState())
  const [wrapRef, canvasWidth] = useCanvasWidth()
  const [extent, setExtent] = useState(2)
  const [footprints, setFootprints] = useState(true)

  return (
    <div ref={wrapRef}>
      <Sim
        height={figureHeight(canvasWidth, 300, 540)}
        animated={false}
        create={() => createRefineLocal(sharedRef)}
      >
        <label>
          strip spans {extent} of {ROWS} rows{' '}
          <input
            type="range"
            min={1}
            max={ROWS}
            step={1}
            value={extent}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.extent = v
              setExtent(v)
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={footprints}
            onChange={(e) => {
              sharedRef.current.footprints = e.target.checked
              setFootprints(e.target.checked)
            }}
          />{' '}
          support footprints
        </label>
      </Sim>
    </div>
  )
}
