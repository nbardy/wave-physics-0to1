import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, paneFrame } from '../lib/chrome'
import { BENCH, ELECTRON_CHARGE, ELECTRON_MASS, PLANCK, fringeSpacing } from './optics'

/** Speed a charge of one e reaches after falling through `volts`, from
 *  eV = ½mv². Non-relativistic: at 100 V the correction is 1e-4. */
const speedFromVolts = (volts: number, mass: number) =>
  Math.sqrt((2 * ELECTRON_CHARGE * volts) / mass)

// PLAN figure 6 — the same rule, applied to everything else.
//
// λ = h/p is not a fact about light. Every mover has one. The ruler is a log
// axis in metres; each specimen is placed at its own λ, computed from its own
// momentum, and the readout says what fringe spacing that λ would produce on
// the very bench the rest of the article has been using (λL/d, L = 2 m,
// d = 0.20 mm). Nothing is asserted about why big things don't diffract —
// the axis is 29 decades wide and says it for itself.

// A mover is either massless (its momentum comes from its wavelength) or
// massive (its momentum comes from mass × speed). Two constructors, two ways to
// get p, no branching anywhere else.
type Mover =
  | { kind: 'photon'; id: string; label: string; note: string; lambda: number }
  | { kind: 'massive'; id: string; label: string; note: string; mass: number; speed: number }

export const MOVERS: Mover[] = [
  {
    kind: 'photon',
    id: 'photon',
    label: 'red photon',
    note: 'the helium–neon line this article has been shining all along',
    lambda: 633e-9,
  },
  {
    kind: 'massive',
    id: 'electron',
    label: 'electron',
    note: 'accelerated through 100 volts — Davisson & Germer’s regime, 1927',
    mass: ELECTRON_MASS,
    speed: speedFromVolts(100, ELECTRON_MASS),
  },
  // No thermal atom here on purpose: a room-temperature helium atom sits at
  // 73 pm, four pixels from the 100-volt electron on a 29-decade axis, so its
  // only effect is to collide with the electron's label.
  {
    kind: 'massive',
    id: 'c60',
    label: 'C60 molecule',
    note: '60 carbon atoms in a ball at 200 m/s — Arndt et al. put these through a grating in 1999',
    mass: 1.19688e-24,
    speed: 200,
  },
  {
    kind: 'massive',
    id: 'dust',
    label: 'speck of dust',
    note: 'one microgram, drifting at a millimetre per second',
    mass: 1e-9,
    speed: 1e-3,
  },
  {
    kind: 'massive',
    id: 'baseball',
    label: 'baseball',
    note: '145 grams at 40 m/s',
    mass: 0.145,
    speed: 40,
  },
]

const momentum = (m: Mover): number =>
  m.kind === 'photon' ? PLANCK / m.lambda : m.mass * m.speed

const wavelength = (m: Mover): number => PLANCK / momentum(m)

const LANDMARKS: Array<{ at: number; label: string }> = [
  { at: 550e-9, label: 'green light' },
  { at: 1e-10, label: 'an atom' },
  { at: 1.7e-15, label: 'a proton' },
  { at: 1.616e-35, label: 'Planck length' },
]

const LOG_MIN = -36
const LOG_MAX = -5

const PROTON_WIDTH = 1.7e-15 // m, roughly — the charge radius doubled

/**
 * `2.4 × 10^-30`. Canvas has no rich text, and superscript digits above ³ live
 * outside Latin-1 — they render as tofu in any font that skips U+2074–2079, which
 * is not a risk worth taking for a decoration. The caret is plain and portable.
 */
function sci(x: number): string {
  const e = Math.floor(Math.log10(x))
  return `${(x / Math.pow(10, e)).toFixed(1)} × 10^${e}`
}

function formatLength(x: number): string {
  if (x >= 1e-3) return `${(x * 1e3).toPrecision(3)} mm`
  if (x >= 1e-6) return `${(x * 1e6).toPrecision(3)} µm`
  if (x >= 1e-9) return `${(x * 1e9).toPrecision(3)} nm`
  if (x >= 1e-12) return `${(x * 1e12).toPrecision(3)} pm`
  if (x >= 1e-15) return `${(x * 1e15).toPrecision(3)} fm`
  return `${sci(x)} m`
}

export function createRuler(sel: { current: Mover }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const padX = 14
      const plotW = w - 2 * padX
      const axisY = 92
      const toPxX = (x: number) =>
        padX + ((Math.log10(x) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * plotW

      ctx.strokeStyle = 'rgba(120,140,170,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padX, axisY + 0.5)
      ctx.lineTo(padX + plotW, axisY + 0.5)
      ctx.stroke()

      // decade ticks
      ctx.font = FONT_LABEL
      for (let e = LOG_MIN; e <= LOG_MAX; e += 5) {
        const px = toPxX(Math.pow(10, e))
        ctx.strokeStyle = 'rgba(120,140,170,0.35)'
        ctx.beginPath()
        ctx.moveTo(px, axisY - 4)
        ctx.lineTo(px, axisY + 4)
        ctx.stroke()
        ctx.fillStyle = 'rgba(85,96,111,0.75)'
        ctx.fillText(`1e${e}`, px - 12, axisY + 17)
      }

      // landmarks below the line
      for (const lm of LANDMARKS) {
        const px = toPxX(lm.at)
        ctx.strokeStyle = 'rgba(107,114,128,0.5)'
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(px, axisY + 4)
        ctx.lineTo(px, axisY + 26)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(107,114,128,0.95)'
        ctx.fillText(lm.label, px - ctx.measureText(lm.label).width / 2, axisY + 38)
      }

      // specimens above the line
      MOVERS.forEach((m, i) => {
        const lam = wavelength(m)
        const px = toPxX(lam)
        const active = m.id === sel.current.id
        const stalk = 16 + (i % 3) * 20
        ctx.strokeStyle = active ? PALETTE.hit : 'rgba(120,140,170,0.55)'
        ctx.lineWidth = active ? 1.6 : 1
        ctx.beginPath()
        ctx.moveTo(px, axisY - 2)
        ctx.lineTo(px, axisY - stalk)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(px, axisY - stalk, active ? 4.5 : 3, 0, Math.PI * 2)
        ctx.fillStyle = active ? PALETTE.hit : 'rgba(120,140,170,0.8)'
        ctx.fill()
        ctx.font = active ? FONT_METER : FONT_LABEL
        ctx.fillStyle = active ? PALETTE.hit : 'rgba(85,96,111,0.85)'
        const tw = ctx.measureText(m.label).width
        ctx.fillText(m.label, Math.min(w - padX - tw, Math.max(padX, px - tw / 2)), axisY - stalk - 8)
      })

      // the readout for the selected specimen
      const m = sel.current
      const lam = wavelength(m)
      const spacing = (lam * BENCH.L) / BENCH.d
      const box = { x: 2, y: axisY + 48, w: w - 4, h: h - axisY - 52 }
      paneFrame(ctx, box)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.amp
      ctx.fillText(`λ = h/p = ${formatLength(lam)}`, box.x + 10, box.y + 20)
      ctx.fillStyle = PALETTE.pdf
      ctx.fillText(
        `fringes on this bench: ${formatLength(spacing)} apart`,
        box.x + 10,
        box.y + 40,
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(m.note, box.x + 10, box.y + 60)
      // One ratio, always in the same direction, so the reader compares numbers
      // rather than parsing which way round the sentence went this time.
      const versus = `${sci(spacing / PROTON_WIDTH)} proton widths`
      ctx.fillStyle = 'rgba(107,114,128,0.95)'
      ctx.fillText(versus, box.x + 10, box.y + 78)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('de Broglie wavelength, metres', padX, 14)
      const note = `fringe spacing quoted for λL/d, L = ${BENCH.L} m, d = ${(BENCH.d * 1e3).toFixed(2)} mm`
      ctx.fillText(note, w - padX - ctx.measureText(note).width, 14)
      // fringeSpacing() is the formula the rest of the article quotes for light;
      // selecting the red photon should reproduce it exactly, which is a live
      // check that this figure and the optics kit are describing one bench.
      ctx.fillStyle = 'rgba(160,170,185,0.95)'
      ctx.fillText(
        `red light on this bench: ${formatLength(fringeSpacing(BENCH))} apart`,
        box.x + 10,
        box.y + 96,
      )
    },
  }
}

export function DeBroglieRuler() {
  const [sel, setSel] = useState<Mover>(MOVERS[1])
  const ref = useRef(sel)
  ref.current = sel

  return (
    <Sim height={310} create={() => createRuler(ref)}>
      <div className="sim-seg" style={{ marginLeft: 0 }}>
        {MOVERS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={sel.id === m.id ? 'seg-active' : ''}
            onClick={() => setSel(m)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </Sim>
  )
}
