// Part 3, Act IV data — the 8×8 sibling of glyphs.ts: seven binary glyphs for
// the one honest scale notch. Same contract as the 4×4 set: a glyph is an
// Int8Array(64), row-major, +1 = ink (sUp amber), −1 = blank (sDn blue).
// Chosen to be mutually distinguishable under moderate corruption — pairwise
// Hamming distances are MEASURED (not trusted) in scripts/check-part3b.ts.

import { PALETTE } from '../lib/palette'

export const GLYPH8_SIDE = 8
export const GLYPH8_PIX = GLYPH8_SIDE * GLYPH8_SIDE

function glyph8(rows: string[]): Int8Array {
  const g = new Int8Array(GLYPH8_PIX)
  rows.forEach((row, y) => {
    for (let x = 0; x < GLYPH8_SIDE; x++) g[y * GLYPH8_SIDE + x] = row[x] === '#' ? 1 : -1
  })
  return g
}

export const GLYPH8_NAMES = ['ring', 'plus', 'x', 'stripes', 'checker', 'tri', 'dot'] as const
export type Glyph8Name = (typeof GLYPH8_NAMES)[number]

export const GLYPHS8: Record<Glyph8Name, Int8Array> = {
  ring: glyph8([
    '########',
    '#......#',
    '#......#',
    '#......#',
    '#......#',
    '#......#',
    '#......#',
    '########',
  ]),
  plus: glyph8([
    '...##...',
    '...##...',
    '...##...',
    '########',
    '########',
    '...##...',
    '...##...',
    '...##...',
  ]),
  x: glyph8([
    '#......#',
    '##....##',
    '.##..##.',
    '..####..',
    '..####..',
    '.##..##.',
    '##....##',
    '#......#',
  ]),
  stripes: glyph8([
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
    '.##..##.',
  ]),
  checker: glyph8([
    '##..##..',
    '##..##..',
    '..##..##',
    '..##..##',
    '##..##..',
    '##..##..',
    '..##..##',
    '..##..##',
  ]),
  tri: glyph8([
    '#.......',
    '##......',
    '###.....',
    '####....',
    '#####...',
    '######..',
    '#######.',
    '########',
  ]),
  dot: glyph8([
    '........',
    '........',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '........',
    '........',
  ]),
}

export const GLYPH8_LIST: Int8Array[] = GLYPH8_NAMES.map((n) => GLYPHS8[n])

export function hamming8(a: Int8Array, b: Int8Array): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Distance from a 64-pixel state to the nearest of the given glyphs. */
export function nearestGlyph8Distance(s: Int8Array, glyphs: Int8Array[] = GLYPH8_LIST): number {
  let best = GLYPH8_PIX
  for (const g of glyphs) best = Math.min(best, hamming8(s, g))
  return best
}

/** One 8×8 glyph pane in the lesson's spin inks — the paint-box contract of
 * glyphs.ts's drawGlyph, at the new side. */
export function drawGlyph8(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cell: number,
  s: Int8Array,
  alpha = 1,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  for (let y = 0; y < GLYPH8_SIDE; y++) {
    for (let x = 0; x < GLYPH8_SIDE; x++) {
      ctx.fillStyle = s[y * GLYPH8_SIDE + x] > 0 ? PALETTE.sUp : PALETTE.sDn
      ctx.fillRect(px + x * cell, py + y * cell, cell - 1, cell - 1)
    }
  }
  ctx.restore()
}

/** The clamp halo around a whole 8×8 pane — this pane is held, deaf to persuasion. */
export function drawPane8Halo(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cell: number,
): void {
  ctx.strokeStyle = PALETTE.held
  ctx.lineWidth = 2
  ctx.strokeRect(px - 3, py - 3, GLYPH8_SIDE * cell + 5, GLYPH8_SIDE * cell + 5)
}
