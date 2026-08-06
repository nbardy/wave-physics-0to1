import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL, FONT_METER, drawArrow, fmt } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { cumulativeFlip, flipAt, forwardChain, N_LEVELS } from './denoise'
import { GLYPHS, GLYPH_NAMES, GLYPH_SIDE, drawGlyph, hamming, type GlyphName } from './glyphs'

// PLAN F25 — the corruption filmstrip. One glyph, run forward through the
// bit-flip schedule: four panes t = 0…3, a fresh corruption draw every beat so
// the strip reads as a distribution over ruins, not one ruin. The knob scales
// the per-step flip probabilities (the last step stays pinned at ½ — the final
// frame is fair coins no matter what). Contrast in one frame: the clean glyph
// and its erasure are always on screen together, with the per-step flip count
// printed under each arrow.

const REDRAW_PERIOD = 0.9 // seconds between fresh corruption draws (fixed-step)

export interface FilmstripShared {
  glyph: GlyphName
  scale: number
}

export interface FilmstripProbe {
  frames: Int8Array[]
}

export function createFilmstrip(
  shared: { current: FilmstripShared },
  probe?: FilmstripProbe,
  seed = 41,
): Stepper {
  let acc = 0
  let run = 0
  let frames = forwardChain(GLYPHS[shared.current.glyph], seed, run, shared.current.scale)
  let last = { ...shared.current }

  const refresh = () => {
    frames = forwardChain(GLYPHS[shared.current.glyph], seed, run, shared.current.scale)
    if (probe) probe.frames = frames
  }
  if (probe) probe.frames = frames

  return {
    step(dt) {
      if (shared.current.glyph !== last.glyph || shared.current.scale !== last.scale) {
        last = { ...shared.current }
        refresh()
      }
      acc += dt
      while (acc >= REDRAW_PERIOD) {
        acc -= REDRAW_PERIOD
        run++
        refresh()
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'target')
      const cell = Math.min(26, (w - 200) / (4 * GLYPH_SIDE))
      const pane = GLYPH_SIDE * cell
      const gap = (w - 40 - 4 * pane) / 3
      const py = 52
      for (let t = 0; t <= N_LEVELS; t++) {
        const px = 20 + t * (pane + gap)
        drawGlyph(ctx, px, py, cell, frames[t])
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.textAlign = 'left'
        ctx.fillText(t === 0 ? 'the glyph' : `t = ${t}`, px, py - 10)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        const rho = cumulativeFlip(t, shared.current.scale)
        ctx.fillText(
          t === 0 ? '' : `${hamming(frames[t], frames[0])} px astray`,
          px,
          py + pane + 16,
        )
        ctx.fillText(t === 0 ? '' : `ρ = ${fmt(rho, 2)}`, px, py + pane + 30)
        if (t < N_LEVELS) {
          const ax = px + pane + 6
          drawArrow(ctx, ax, py + pane / 2, ax + gap - 12, py + pane / 2, 'rgba(85,96,111,0.7)', 2)
          ctx.textAlign = 'center'
          ctx.fillText(
            `flip ${Math.round(flipAt(t + 1, shared.current.scale) * 100)}%`,
            ax + (gap - 6) / 2,
            py + pane / 2 - 8,
          )
          ctx.textAlign = 'left'
        }
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('a fresh corruption every beat — the strip is a distribution, not a picture', 20, h - 10)
    },
  }
}

export function Filmstrip() {
  const [glyph, setGlyph] = useState<GlyphName>('cross')
  const [scale, setScale] = useState(1)
  const shared = useRef<FilmstripShared>({ glyph, scale })
  shared.current.glyph = glyph
  shared.current.scale = scale

  return (
    <Sim height={210} create={() => createFilmstrip(shared)}>
      <button
        type="button"
        onClick={() =>
          setGlyph(GLYPH_NAMES[(GLYPH_NAMES.indexOf(glyph) + 1) % GLYPH_NAMES.length])
        }
      >
        glyph: {glyph}
      </button>
      <label>
        noise per step
        <input
          type="range"
          min={0.4}
          max={1.6}
          step={0.05}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
