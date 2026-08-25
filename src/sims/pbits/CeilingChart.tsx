import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { FABRIC_FOOTPRINT } from './denoiseFabric'
import { GLYPH8_SIDE } from './glyphs8'

// Part 3, PLAN F12 — the ceiling, by arithmetic. The only scale figure the
// honesty rules permit: every number on this canvas is either a VERIFIED
// constant from articles/06-z1-compiler/RESEARCH.md (Thermalizers §IV E /
// Appendix K: an 8-bit embedding ≈ 14,000 p-bits at a 16×16 field; a
// 250,000-p-bit Z1 array reaches roughly 32×32–48×48) or arithmetic performed
// on one, live, in the draw call. No other scale source is admitted.
//
// The one honest wrinkle, shown rather than hidden: naive area scaling from
// the anchor (p-bits ∝ side² × bits) crosses the 250k ceiling near 68×68 —
// but the paper itself claims only 32–48. Embedding overheads grow with size
// (minor-embedding chains lengthen), so the naive curve is an optimistic
// lower bound and the band is the paper's own number. We plot both and say
// which is which — arithmetic, not hope. (PLAN's check spec expected the
// naive crossing to land inside the band; measured, it does not — the
// narrative follows the measurement, per the working agreement, and
// check-part3b.ts asserts the honest version.)
//
// Our own 8×8 binary model appears as a measured DOT, not a curve: one
// recipe, one size, its footprint counted from the placement itself
// (FABRIC_FOOTPRINT — pixels AND hidden layers). Extrapolating it would be
// the hope this figure exists to refuse.

export const ANCHOR_PBITS = 14000 // verified: 8-bit embedding, 16×16 field
export const ANCHOR_SIDE = 16
export const ANCHOR_BITS = 8
export const CEILING_PBITS = 250000 // verified: ~250k-node Z1 array
export const BAND_LO = 32 // verified: the paper's own stated 8-bit reach
export const BAND_HI = 48

/** Naive area scaling from the verified anchor: p-bits ∝ side² · bits. */
export function naivePbits(side: number, bits: number): number {
  return ANCHOR_PBITS * ((side * side) / (ANCHOR_SIDE * ANCHOR_SIDE)) * (bits / ANCHOR_BITS)
}

/** Where the naive curve crosses the ceiling. */
export function naiveCrossing(bits: number): number {
  return ANCHOR_SIDE * Math.sqrt(CEILING_PBITS / (ANCHOR_PBITS * (bits / ANCHOR_BITS)))
}

export interface CeilingShared {
  bits: 1 | 4 | 8
}

export interface CeilingProbe {
  anchorValue: number
  crossing: number
  oursPbits: number
  bandLo: number
  bandHi: number
}

const X_MAX = 80
const LOG_LO = 2 // 10² p-bits at the bottom …
const LOG_HI = 6 // … 10⁶ at the top

export function createCeilingChart(
  shared: { current: CeilingShared },
  probe?: CeilingProbe,
): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const narrow = w < 520
      const r: Rect = { x: narrow ? 40 : 56, y: 34, w: w - (narrow ? 56 : 84), h: h - 96 }
      paneFrame(ctx, r)
      const px = (side: number) => r.x + (side / X_MAX) * r.w
      const py = (p: number) =>
        r.y + r.h - ((Math.log10(Math.max(p, 1)) - LOG_LO) / (LOG_HI - LOG_LO)) * r.h

      // axes
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      for (let d = LOG_LO; d <= LOG_HI; d++) {
        const y = py(10 ** d)
        ctx.strokeStyle = 'rgba(120,140,170,0.18)'
        ctx.beginPath()
        ctx.moveTo(r.x, y)
        ctx.lineTo(r.x + r.w, y)
        ctx.stroke()
        ctx.fillText(d === 2 ? '10²' : d === 3 ? '10³' : d === 4 ? '10⁴' : d === 5 ? '10⁵' : '10⁶', r.x - (narrow ? 28 : 30), y + 4)
      }
      for (const s of [16, 32, 48, 64, 80]) ctx.fillText(`${s}`, px(s) - 6, r.y + r.h + 14)
      ctx.fillText('image side (pixels)', r.x + r.w / 2 - 40, r.y + r.h + 28)

      // the paper's own stated reach — a verified band, not our arithmetic
      ctx.fillStyle = PALETTE.ghost
      ctx.globalAlpha = 0.16
      ctx.fillRect(px(BAND_LO), r.y, px(BAND_HI) - px(BAND_LO), r.h)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(narrow ? 'paper: 32–48' : 'the paper’s stated 8-bit reach: 32–48', px(BAND_LO) + 4, r.y + 14)

      // the ceiling — the line a workload cannot cross
      const yCeil = py(CEILING_PBITS)
      ctx.strokeStyle = PALETTE.ferro
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(r.x, yCeil)
      ctx.lineTo(r.x + r.w, yCeil)
      ctx.stroke()
      ctx.fillStyle = PALETTE.ferro
      ctx.fillText(narrow ? 'Z1 ≈ 250,000' : 'the Z1 array: ≈ 250,000 p-bits', r.x + 6, yCeil - 6)

      // naive curves from the anchor, selected one in full ink
      const bitsAll: Array<1 | 4 | 8> = [1, 4, 8]
      for (const bits of bitsAll) {
        const on = bits === shared.current.bits
        ctx.strokeStyle = PALETTE.meter
        ctx.globalAlpha = on ? 0.95 : 0.25
        ctx.lineWidth = on ? 2.2 : 1.2
        ctx.beginPath()
        let started = false
        for (let s = 4; s <= X_MAX; s += 1) {
          const v = naivePbits(s, bits)
          if (v < 10 ** LOG_LO) continue
          const x = px(s)
          const y = py(Math.min(v, 10 ** LOG_HI))
          if (!started) {
            ctx.moveTo(x, y)
            started = true
          } else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
        if (on) {
          ctx.fillStyle = PALETTE.meter
          ctx.font = FONT_LABEL
          // keep the label inside the pane at narrow widths (360 clipped it)
          const label = `${bits}-bit, naive ×s²`
          const lx = Math.min(px(56), r.x + r.w - ctx.measureText(label).width - 4)
          ctx.fillText(label, lx, py(naivePbits(Math.min(56, X_MAX), bits)) - 8)
        }
      }

      // the verified anchor point (sits on the 8-bit curve by construction)
      ctx.beginPath()
      ctx.arc(px(ANCHOR_SIDE), py(ANCHOR_PBITS), 4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.sUp
      ctx.fill()
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText(
        narrow ? 'anchor: ≈14,000' : 'verified anchor: 16×16 @ 8-bit ≈ 14,000 p-bits',
        px(ANCHOR_SIDE) + 8,
        py(ANCHOR_PBITS) + 4,
      )

      // our measured dot — pixels AND hidden layers, counted from the placement
      ctx.beginPath()
      ctx.arc(px(GLYPH8_SIDE), py(FABRIC_FOOTPRINT), 4.5, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.sUp
      ctx.fill()
      ctx.strokeStyle = PALETTE.held
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px(GLYPH8_SIDE), py(FABRIC_FOOTPRINT), 7.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText(
        narrow ? `ours: 8×8, ${FABRIC_FOOTPRINT}` : `ours, measured: 8×8 binary — ${FABRIC_FOOTPRINT} p-bits`,
        px(GLYPH8_SIDE) + 10,
        py(FABRIC_FOOTPRINT) + 4,
      )

      // crossing readout + the honesty line
      const cross = naiveCrossing(shared.current.bits)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(
        `${shared.current.bits}-bit naive crossing: ${cross.toFixed(0)}×${cross.toFixed(0)}`,
        r.x,
        r.y + r.h + (narrow ? 42 : 44),
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        narrow
          ? 'the paper claims 32–48, not 68 — arithmetic, not hope'
          : 'naive scaling promises ~68×68 at 8-bit; the paper itself claims 32–48 — overheads grow. arithmetic, not hope.',
        r.x,
        r.y + r.h + (narrow ? 56 : 58),
      )
      if (probe) {
        probe.anchorValue = naivePbits(ANCHOR_SIDE, ANCHOR_BITS)
        probe.crossing = cross
        probe.oursPbits = FABRIC_FOOTPRINT
        probe.bandLo = BAND_LO
        probe.bandHi = BAND_HI
      }
    },
  }
}

export function CeilingChart() {
  const [bits, setBits] = useState<1 | 4 | 8>(8)
  const shared = useRef<CeilingShared>({ bits })
  shared.current.bits = bits

  return (
    <Sim height={300} animated={false} create={() => createCeilingChart(shared)}>
      <span>bits per pixel:</span>
      {([1, 4, 8] as const).map((b) => (
        <button key={b} type="button" disabled={bits === b} onClick={() => setBits(b)}>
          {b}
        </button>
      ))}
    </Sim>
  )
}
