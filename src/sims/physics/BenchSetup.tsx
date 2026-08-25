import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK, drawArrow } from '../lib/chrome'
import { BENCH, fringeSpacing, intensityBoth } from './optics'

// PLAN figure 0 (the bench) — the apparatus every later figure quotes, drawn
// once as hardware: lamp, mask, screen, and the numbers (633 nm, a, d, L) that
// are the only inputs anything downstream uses. Top view. The slit pair is
// unresolvable at bench scale, so a loupe magnifies the card; INSIDE the loupe
// everything is at one true scale (300 px/mm — the drawn a and d really are
// 1:5), while the bench-scale gaps under it are exaggerated to stay visible.
// The printed dimensions, not the bench-scale drawing, carry the truth. No
// rays and no wavefronts anywhere: depicting either would take a side in the
// question the article opens with, so the bench stays agnostic — the only
// output shown is the measured pattern where it appears, on the screen.

/** Geometry shared with scripts/check-physics-figures.ts, css px at any width. */
export const SETUP = {
  axisY: 220,
  /** main-view screen scale, px per mm of screen position */
  pxPerMm: 2.5,
  /** loupe scale, px per mm — 0.04 mm slits drawn 12 px, 0.20 mm apart drawn 60 px */
  loupePxPerMm: 300,
  /** element x as a fraction of width */
  lampX: 0.085,
  cardX: 0.4,
  screenX: 0.84,
  /** loupe card bar offset right of cardX, px */
  loupeBarDx: 10,
  loupeTop: 16,
  loupeBot: 128,
} as const

const GREY_TEXT = 'rgba(85,96,111,0.9)'
const GREY_LINE = 'rgba(120,140,170,0.45)'

export function createBenchSetup(): Stepper {
  return {
    step() {},

    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const { axisY, pxPerMm, loupePxPerMm } = SETUP
      const lampX = SETUP.lampX * w
      const cardX = SETUP.cardX * w
      const scrX = SETUP.screenX * w

      // optical axis, behind everything
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(lampX + 26, axisY)
      ctx.lineTo(scrX - 4, axisY)
      ctx.stroke()
      ctx.setLineDash([])

      // illumination cone lamp → card: direction of travel, nothing more
      ctx.fillStyle = 'rgba(217,119,6,0.06)'
      ctx.beginPath()
      ctx.moveTo(lampX + 24, axisY)
      ctx.lineTo(cardX - 4, axisY - 23)
      ctx.lineTo(cardX - 4, axisY + 23)
      ctx.closePath()
      ctx.fill()

      // lamp: body, and an amber aperture — amber is the photon's ink
      ctx.fillStyle = 'rgba(107,114,128,0.12)'
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(lampX - 26, axisY - 18, 46, 36, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(217,119,6,0.25)'
      ctx.beginPath()
      ctx.arc(lampX + 22, axisY, 9, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = PALETTE.hit
      ctx.fillRect(lampX + 20, axisY - 5, 5, 10)

      // the mask: a bar with a pair of nicks the bench scale cannot resolve
      const gap = 4
      const web = 4
      ctx.fillStyle = PALETTE.wall
      ctx.fillRect(cardX - 3.5, 180, 7, axisY - web / 2 - gap - 180)
      ctx.fillRect(cardX - 3.5, axisY - web / 2, 7, web)
      ctx.fillRect(cardX - 3.5, axisY + web / 2 + gap, 7, 300 - (axisY + web / 2 + gap))

      // loupe: circle on the nicks, leader lines to the magnified card
      const r = 15
      const boxL = cardX - 92
      const boxR = cardX + 120
      ctx.strokeStyle = GREY_LINE
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cardX, axisY, r, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(120,140,170,0.3)'
      ctx.beginPath()
      ctx.moveTo(cardX - r * 0.7, axisY - r * 0.7)
      ctx.lineTo(boxL, SETUP.loupeBot)
      ctx.moveTo(cardX + r * 0.7, axisY - r * 0.7)
      ctx.lineTo(boxR, SETUP.loupeBot)
      ctx.stroke()

      ctx.fillStyle = 'rgba(20,24,33,0.03)'
      ctx.strokeStyle = GREY_LINE
      ctx.beginPath()
      ctx.roundRect(boxL, SETUP.loupeTop, boxR - boxL, SETUP.loupeBot - SETUP.loupeTop, 8)
      ctx.fill()
      ctx.stroke()

      // inside the loupe, one true scale: a = 0.04 mm → 12 px, d = 0.20 mm → 60 px
      const ix = cardX + SETUP.loupeBarDx
      const cy = (SETUP.loupeTop + SETUP.loupeBot) / 2
      const aPx = BENCH.a * 1000 * loupePxPerMm
      const dPx = BENCH.d * 1000 * loupePxPerMm
      const g1 = cy - dPx / 2 // top slit centre
      const g2 = cy + dPx / 2
      // the card runs border to border so it reads as a plate with two
      // openings, not three floating blocks
      ctx.fillStyle = PALETTE.wall
      ctx.fillRect(ix - 5, SETUP.loupeTop + 1, 10, g1 - aPx / 2 - (SETUP.loupeTop + 1))
      ctx.fillRect(ix - 5, g1 + aPx / 2, 10, dPx - aPx)
      ctx.fillRect(ix - 5, g2 + aPx / 2, 10, SETUP.loupeBot - 1 - (g2 + aPx / 2))

      // d: bracket right of the bar, between slit centrelines
      ctx.strokeStyle = INK
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(ix + 7, g1)
      ctx.lineTo(ix + 26, g1)
      ctx.moveTo(ix + 7, g2)
      ctx.lineTo(ix + 26, g2)
      ctx.stroke()
      ctx.setLineDash([])
      drawArrow(ctx, ix + 22, cy, ix + 22, g1, INK, 1)
      drawArrow(ctx, ix + 22, cy, ix + 22, g2, INK, 1)
      ctx.font = FONT_METER
      ctx.fillStyle = INK
      ctx.fillText('d = 0.20 mm', ix + 30, cy + 4)

      // a: one slit's width, arrows outside pointing in, label to the left
      ctx.strokeStyle = INK
      ctx.beginPath()
      ctx.moveTo(ix - 7, g1 - aPx / 2)
      ctx.lineTo(ix - 22, g1 - aPx / 2)
      ctx.moveTo(ix - 7, g1 + aPx / 2)
      ctx.lineTo(ix - 22, g1 + aPx / 2)
      ctx.stroke()
      drawArrow(ctx, ix - 16, g1 - aPx / 2 - 12, ix - 16, g1 - aPx / 2, INK, 1)
      drawArrow(ctx, ix - 16, g1 + aPx / 2 + 12, ix - 16, g1 + aPx / 2, INK, 1)
      const aLabel = 'a = 0.04 mm'
      ctx.fillText(aLabel, ix - 26 - ctx.measureText(aLabel).width, g1 + 4)

      ctx.font = FONT_LABEL
      ctx.fillStyle = GREY_TEXT
      ctx.fillText('magnified', boxL + 10, SETUP.loupeBot - 8)

      // the screen, with the pattern that grows on it — the derived meter's ink
      const scrTop = axisY - 30 * pxPerMm
      const scrBot = axisY + 30 * pxPerMm
      ctx.fillStyle = PALETTE.wall
      ctx.fillRect(scrX - 3, scrTop, 6, scrBot - scrTop)
      ctx.beginPath()
      ctx.moveTo(scrX - 3, scrTop)
      for (let py = scrTop; py <= scrBot; py++) {
        const xm = ((py - axisY) / pxPerMm) * 1e-3
        ctx.lineTo(scrX - 3 - (intensityBoth(BENCH, xm) / 4) * 30, py)
      }
      ctx.lineTo(scrX - 3, scrBot)
      ctx.closePath()
      ctx.fillStyle = 'rgba(124,58,237,0.16)'
      ctx.fill()
      ctx.strokeStyle = PALETTE.pdf
      ctx.lineWidth = 1.3
      ctx.stroke()

      // neighbouring bright bars, λL/d apart — same number the prose quotes
      const fringePx = fringeSpacing(BENCH) * 1000 * pxPerMm
      ctx.strokeStyle = INK
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(scrX + 3, axisY)
      ctx.lineTo(scrX + 14, axisY)
      ctx.moveTo(scrX + 3, axisY - fringePx)
      ctx.lineTo(scrX + 14, axisY - fringePx)
      ctx.moveTo(scrX + 10, axisY)
      ctx.lineTo(scrX + 10, axisY - fringePx)
      ctx.stroke()
      ctx.font = FONT_LABEL
      ctx.fillStyle = INK
      ctx.fillText('6.33 mm', scrX + 16, axisY - fringePx / 2 + 4)

      // L, the flight the phase is paid over
      drawArrow(ctx, (cardX + scrX) / 2, 282, cardX + 6, 282, INK, 1)
      drawArrow(ctx, (cardX + scrX) / 2, 282, scrX - 6, 282, INK, 1)
      ctx.font = FONT_METER
      const lLabel = 'L = 2.0 m'
      ctx.fillText(lLabel, (cardX + scrX) / 2 - ctx.measureText(lLabel).width / 2, 276)

      // nameplates
      ctx.font = FONT_LABEL
      ctx.fillStyle = GREY_TEXT
      const plate = (text: string, cx: number) =>
        ctx.fillText(text, cx - ctx.measureText(text).width / 2, 312)
      plate('lamp (633 nm)', lampX)
      plate('mask, two slits', cardX)
      plate('screen', scrX)
    },
  }
}

export function BenchSetup() {
  return <Sim height={320} animated={false} create={() => createBenchSetup()} />
}
