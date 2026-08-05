// Terrain dressing for Act 2 of maths-01 v2 (PLAN §Palette): the invented
// backcountry map sheet. Same analytic landscape as lib.ts (landF/landGrad/
// landHess — exact derivatives, confessed in prose as invented terrain);
// this module only owns how it is PAINTED: hypsometric tints, the real
// cartographic convention — water, lowland green, upland brown, pale summit.

import { landF } from './lib'
import type { Rect, View } from './lib'

export const SEA_LEVEL = -0.9

/** Hypsometric tint for an elevation value (landF units). */
export function hypsoTint(f: number): [number, number, number] {
  if (f < SEA_LEVEL) {
    // water: deeper = darker
    const d = Math.min(1, (SEA_LEVEL - f) / 1.6)
    return [166 - 40 * d, 200 - 40 * d, 228 - 30 * d]
  }
  const t = Math.min(1, (f - SEA_LEVEL) / 2.6)
  if (t < 0.35) {
    // lowland greens
    const k = t / 0.35
    return [148 + 30 * k, 191 - 10 * k, 139 - 15 * k]
  }
  if (t < 0.75) {
    // upland browns
    const k = (t - 0.35) / 0.4
    return [178 + 30 * k, 181 - 40 * k, 124 - 30 * k]
  }
  // pale summit rock
  const k = (t - 0.75) / 0.25
  return [208 + 40 * k, 141 + 90 * k, 94 + 130 * k]
}

/** Paint the terrain into a cached offscreen canvas (the terrain never
 * changes; only overlays do). */
let cache: HTMLCanvasElement | null = null
export function terrainCanvas(view: View, res = 300): HTMLCanvasElement {
  if (cache) return cache
  const c = document.createElement('canvas')
  c.width = res
  c.height = res
  const ctx = c.getContext('2d')
  if (!ctx) return c
  const img = ctx.createImageData(res, res)
  const d = img.data
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = view.cx - view.half + ((i + 0.5) / res) * 2 * view.half
      const y = view.cy + view.half - ((j + 0.5) / res) * 2 * view.half
      const [r, g, b] = hypsoTint(landF(x, y))
      const o = (j * res + i) * 4
      d[o] = r
      d[o + 1] = g
      d[o + 2] = b
      d[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  cache = c
  return c
}

/** Contour dots of the real landF over a rect — the topo lines. */
export function drawContours(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  view: View,
  levels: number[],
  color = 'rgba(90,70,40,0.5)',
) {
  ctx.fillStyle = color
  const step = 3
  for (let yy = 0; yy < r.h; yy += step) {
    for (let xx = 0; xx < r.w; xx += step) {
      const x = view.cx - view.half + (xx / r.w) * 2 * view.half
      const y = view.cy + view.half - (yy / r.h) * 2 * view.half
      const v = landF(x, y)
      for (const L of levels) {
        if (Math.abs(v - L) < 0.02) {
          ctx.fillRect(r.x + xx, r.y + yy, 1.4, 1.4)
          break
        }
      }
    }
  }
}

export const CONTOUR_LEVELS = [-0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2, 1.5]
