// Responsive layout for the CAD figures.
//
// The site has no width-based media queries: the prose column is fluid at
// `--max: 720px` and every canvas is `width: 100%` with a fixed pixel height.
// That works for one-pane figures and fails for two-pane ones, which split the
// width regardless of how little there is — on a 390 px phone the canvas is
// ~340 px and each pane lands at ~164 px, too narrow to read a meter in.
//
// So the breakpoint lives here rather than in CSS, and it is measured off the
// canvas rather than off `window.innerWidth` — the alternative would put a copy
// of the column's padding arithmetic in TypeScript and let the two drift.
//
// Extracted only once the pattern had three users, per AGENTS.md: BasisLocality,
// WeightPull, RefineLocal.

import { useEffect, useRef, useState, type RefObject } from 'react'

/** Below this canvas width, a two-pane figure stacks instead of splitting. */
export const STACK_BELOW = 520

/** The gap between panes, in either arrangement. */
export const PANE_GAP = 12

export function isStacked(canvasWidth: number): boolean {
  return canvasWidth < STACK_BELOW
}

/**
 * The figure's own canvas width, measured.
 *
 * Two consumers have to agree on it: the component picks the `<Sim>` height (a
 * stacked figure needs roughly twice as much), and `draw` picks the pane
 * rectangles from the width it is handed. Both read the same number.
 *
 * The initial value is the desktop width, so the first paint is the common case;
 * the observer corrects it before the reader sees anything on a narrow screen.
 * Changing `height` remounts the stepper, which is harmless here because every
 * CAD figure keeps its state in a ref outside the stepper.
 */
export function useCanvasWidth(): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const canvas = ref.current?.querySelector('canvas')
    if (!canvas) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(w)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

/** Pick a figure height for the arrangement the width forces. */
export function figureHeight(canvasWidth: number, wide: number, stacked: number): number {
  return isStacked(canvasWidth) ? stacked : wide
}
