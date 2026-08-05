// ACT IV data — six built-in 4×4 binary glyphs and the drawing vocabulary the
// act's figures share. A glyph is an Int8Array(16), row-major, +1 = ink
// (drawn in the lesson's sUp amber), −1 = blank (sDn blue). The six were
// chosen to be mutually distinguishable at 4×4 under moderate corruption:
// pairwise Hamming distances run 4–14.

import { PALETTE } from '../lib/palette'

export const GLYPH_SIDE = 4
export const GLYPH_PIX = GLYPH_SIDE * GLYPH_SIDE

function glyph(rows: string[]): Int8Array {
  const g = new Int8Array(GLYPH_PIX)
  rows.forEach((row, y) => {
    for (let x = 0; x < GLYPH_SIDE; x++) g[y * GLYPH_SIDE + x] = row[x] === '#' ? 1 : -1
  })
  return g
}

export const GLYPH_NAMES = ['bar', 'cross', 'box', 'x', 'checker', 'corner'] as const
export type GlyphName = (typeof GLYPH_NAMES)[number]

export const GLYPHS: Record<GlyphName, Int8Array> = {
  bar: glyph(['.##.', '.##.', '.##.', '.##.']),
  cross: glyph(['.##.', '####', '####', '.##.']),
  box: glyph(['####', '#..#', '#..#', '####']),
  x: glyph(['#..#', '.##.', '.##.', '#..#']),
  checker: glyph(['#.#.', '.#.#', '#.#.', '.#.#']),
  corner: glyph(['#...', '#...', '#...', '####']),
}

export const GLYPH_LIST: Int8Array[] = GLYPH_NAMES.map((n) => GLYPHS[n])

export function hamming(a: Int8Array, b: Int8Array): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Distance from a 16-pixel state to the nearest of the given glyphs. */
export function nearestGlyphDistance(s: Int8Array, glyphs: Int8Array[] = GLYPH_LIST): number {
  let best = GLYPH_PIX
  for (const g of glyphs) best = Math.min(best, hamming(s, g))
  return best
}

/** One 4×4 glyph pane: filled squares in the lesson's spin inks. */
export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cell: number,
  s: Int8Array,
  alpha = 1,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  for (let y = 0; y < GLYPH_SIDE; y++) {
    for (let x = 0; x < GLYPH_SIDE; x++) {
      ctx.fillStyle = s[y * GLYPH_SIDE + x] > 0 ? PALETTE.sUp : PALETTE.sDn
      ctx.fillRect(px + x * cell, py + y * cell, cell - 1, cell - 1)
    }
  }
  ctx.restore()
}

/** The clamp halo drawn around a whole pane — this pane is held, deaf to persuasion. */
export function drawPaneHalo(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cell: number,
): void {
  ctx.strokeStyle = PALETTE.held
  ctx.lineWidth = 2
  ctx.strokeRect(px - 3, py - 3, GLYPH_SIDE * cell + 5, GLYPH_SIDE * cell + 5)
}
