import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'

// Part 3 — the price of one flash ever, on canvas. Every number here is the
// check harness's own 4×4-oracle measurement (check-part3a.ts, tier 2):
// per-level exact KL of the shipped specialists and the shipped conditioned
// kernel against the exact reverse conditional, plus the untrained kernel's
// score at the noisiest level. The harness asserts the conditioned values
// within 0.01 of these constants on every run; the figure exists so the
// section's three factors land as bars instead of a prose list. The
// enumeration itself (2^16 outputs × hidden states per context) is a
// harness job — far too slow for a browser draw call — which is why these
// are recorded measurements, and the canvas says so on its face.

export const KL_SPECIALIST = [0.323, 0.768, 0.252] // t = 1 (gentle), 2, 3 (noisiest)
export const KL_CONDITIONED = [1.274, 0.922, 1.886]
export const KL_UNTRAINED_T3 = 0.896

const LEVEL_LABEL = ['gentle (t=1)', 'middle (t=2)', 'noisiest (t=3)']
// the harness's own full-precision factor readout — re-deriving these from
// the 3-decimal bar constants above would print ×3.9 where the audit says ×4.0
const FACTOR_LABEL = ['×4.0', '×1.20', '×7.5']
const KL_MAX = 2.1 // axis headroom over the tallest bar

export function createSharedPrice(): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const narrow = w < 520
      const r: Rect = { x: narrow ? 40 : 56, y: 34, w: w - (narrow ? 56 : 84), h: h - 92 }
      paneFrame(ctx, r)
      const py = (kl: number) => r.y + r.h - (kl / KL_MAX) * r.h

      // axis
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      for (const v of [0, 0.5, 1.0, 1.5, 2.0]) {
        const y = py(v)
        ctx.strokeStyle = 'rgba(120,140,170,0.18)'
        ctx.beginPath()
        ctx.moveTo(r.x, y)
        ctx.lineTo(r.x + r.w, y)
        ctx.stroke()
        ctx.fillText(v.toFixed(1), r.x - (narrow ? 26 : 30), y + 4)
      }
      ctx.save()
      ctx.translate(narrow ? 12 : 16, r.y + r.h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText('exact KL to the reverse conditional', 0, 0)
      ctx.restore()

      const slot = r.w / 3
      const bw = Math.min(34, slot * 0.22)
      for (let t = 0; t < 3; t++) {
        const cx = r.x + slot * (t + 0.5)
        const xs = cx - bw - 4
        const xc = cx + 4

        // specialist — outlined, the dedicated kernel this level would get
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.6
        ctx.strokeRect(xs, py(KL_SPECIALIST[t]), bw, r.y + r.h - py(KL_SPECIALIST[t]))

        // conditioned — filled, the one shared kernel serving all three
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.85
        ctx.fillRect(xc, py(KL_CONDITIONED[t]), bw, r.y + r.h - py(KL_CONDITIONED[t]))
        ctx.globalAlpha = 1

        // the factor, printed where the reader's eye lands
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.textAlign = 'center'
        ctx.fillText(FACTOR_LABEL[t], cx, py(KL_CONDITIONED[t]) - 8)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(LEVEL_LABEL[t], cx, r.y + r.h + 14)
        ctx.textAlign = 'left'
      }

      // the untrained line at the noisiest level — sharing loses to vagueness
      const cx3 = r.x + slot * 2.5
      const yUn = py(KL_UNTRAINED_T3)
      ctx.strokeStyle = PALETTE.ferro
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(cx3 - slot * 0.42, yUn)
      ctx.lineTo(cx3 + slot * 0.42, yUn)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = PALETTE.ferro
      ctx.textAlign = 'center'
      const unLabel = narrow ? `untrained: ${KL_UNTRAINED_T3}` : `an untrained kernel: ${KL_UNTRAINED_T3}`
      const unX = Math.min(cx3, r.x + r.w - ctx.measureText(unLabel).width / 2 - 4)
      ctx.fillText(unLabel, unX, yUn - 5)
      ctx.textAlign = 'left'

      // legend + provenance, on the canvas face
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      const ly = r.y + r.h + 30
      ctx.strokeStyle = PALETTE.ghost
      ctx.lineWidth = 1.6
      ctx.strokeRect(r.x, ly - 8, 10, 8)
      ctx.fillText('specialist, one per level', r.x + 16, ly)
      ctx.fillStyle = PALETTE.meter
      ctx.globalAlpha = 0.85
      ctx.fillRect(r.x + (narrow ? 150 : 170), ly - 8, 10, 8)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('shared, one flash ever', r.x + (narrow ? 166 : 186), ly)
      if (!narrow)
        ctx.fillText('measured by the 4×4 oracle; re-asserted by the check harness every run', r.x, ly + 14)
    },
  }
}

export function SharedPrice() {
  return <Sim height={280} animated={false} create={() => createSharedPrice()} />
}
