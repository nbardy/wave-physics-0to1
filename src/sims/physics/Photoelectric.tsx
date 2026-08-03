import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'
import { LIGHT_SPEED, photonEnergyEv } from './optics'

// PLAN figure 4 — the evidence that will not bend.
//
// Shine light on a metal and electrons come off. Two knobs: how bright, and what
// colour. Three readouts, and the whole quarrel is between two of them:
//
//   how many electrons  ∝ brightness      (the wave picture is fine with this)
//   how fast the fastest one is = hν − φ  (the wave picture cannot survive this)
//
// The grey ghost bar is the wave prediction — energy delivered per electron
// rises with brightness, because a stronger field shakes a charge harder. Crank
// brightness and watch the ghost climb while the measured bar does not move at
// all. Below the threshold frequency the ghost keeps climbing and no electron
// comes off at any brightness whatsoever.

// Work functions in eV (CRC / standard polycrystalline values).
const METALS = {
  cesium: { label: 'cesium', phi: 2.14 },
  sodium: { label: 'sodium', phi: 2.36 },
  zinc: { label: 'zinc', phi: 4.33 },
  platinum: { label: 'platinum', phi: 5.65 },
} as const

type Metal = keyof typeof METALS
const METAL_ORDER = Object.keys(METALS) as Metal[]

const NU_MIN = 4.0e14 // 750 nm, deep red
const NU_MAX = 1.65e15 // 182 nm, ultraviolet
const E_MAX = 7 // eV — the plot ceiling, above every work function here

interface Knobs {
  nu: { current: number }
  bright: { current: number }
  metal: { current: Metal }
}

/** Einstein 1905: the fastest electron carries the photon's energy less the
 *  price of escaping. No photon of energy below φ frees anything, ever. */
const kineticMax = (nu: number, phi: number) => Math.max(0, photonEnergyEv(nu) - phi)

export function createPhotoelectric(k: Knobs): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const nu = k.nu.current
      const bright = k.bright.current // 0..1, relative
      const phi = METALS[k.metal.current].phi
      const nu0 = (phi * 1.602176634e-19) / 6.62607015e-34
      const K = kineticMax(nu, phi)
      const emits = nu > nu0

      const gap = 14
      const plotW = Math.max(150, w * 0.58)
      const plot = { x: 2, y: 20, w: plotW, h: h - 44 }
      const bars = { x: plotW + gap, y: 20, w: w - plotW - gap - 2, h: h - 44 }

      // --- left: the straight line the data falls on ------------------------
      const px = (f: number) => plot.x + ((f - NU_MIN) / (NU_MAX - NU_MIN)) * plot.w
      const py = (e: number) => plot.y + plot.h - 12 - (e / E_MAX) * (plot.h - 22)

      ctx.strokeStyle = 'rgba(120,140,170,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(plot.x, py(0))
      ctx.lineTo(plot.x + plot.w, py(0))
      ctx.stroke()

      // K(ν) = hν − φ, clipped at zero: flat on the dead side, straight after
      ctx.strokeStyle = PALETTE.ejecta
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(px(NU_MIN), py(0))
      ctx.lineTo(px(Math.min(NU_MAX, Math.max(NU_MIN, nu0))), py(0))
      ctx.lineTo(px(NU_MAX), py(kineticMax(NU_MAX, phi)))
      ctx.stroke()

      // the threshold: no light redder than this does anything
      if (nu0 > NU_MIN && nu0 < NU_MAX) {
        ctx.strokeStyle = PALETTE.cutoff
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(px(nu0), plot.y)
        ctx.lineTo(px(nu0), py(0))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.font = FONT_LABEL
        ctx.fillStyle = PALETTE.cutoff
        ctx.fillText('threshold', px(nu0) + 4, plot.y + 11)
      }

      ctx.beginPath()
      ctx.arc(px(nu), py(K), 4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.hit
      ctx.fill()

      paneFrame(ctx, plot)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('fastest electron (eV) vs frequency', plot.x + 4, 14)
      ctx.fillText('750 nm', plot.x + 4, h - 10)
      const uv = '182 nm'
      ctx.fillText(uv, plot.x + plot.w - ctx.measureText(uv).width, h - 10)

      // --- right: the two bars, and the ghost that disagrees ----------------
      const barW = Math.min(46, (bars.w - 24) / 2)
      const baseY = bars.y + bars.h - 14
      const topY = bars.y + 16
      const span = baseY - topY

      const drawBar = (bx: number, frac: number, color: string, label: string, value: string) => {
        const clamped = Math.max(0, Math.min(1, frac))
        ctx.fillStyle = color
        ctx.globalAlpha = 0.22
        ctx.fillRect(bx, topY, barW, span)
        ctx.globalAlpha = 1
        ctx.fillRect(bx, baseY - clamped * span, barW, clamped * span)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(label, bx, baseY + 12)
        ctx.font = FONT_METER
        ctx.fillStyle = color
        ctx.fillText(value, bx, topY - 5)
      }

      const rate = emits ? bright : 0
      drawBar(bars.x + 4, rate, PALETTE.pdf, 'electrons/s', emits ? `${Math.round(rate * 100)}%` : '0')

      const gx = bars.x + 4 + barW + 16
      drawBar(gx, K / E_MAX, PALETTE.ejecta, 'energy each', emits ? `${fmt(K, 2)} eV` : 'none')
      // The wave prediction — energy per electron grows with the field's
      // strength — drawn AFTER the bar, or the bar's own 22% track washes it out
      // and the disagreement the figure exists to show goes pale.
      const ghost = 0.08 + 0.9 * bright
      ctx.setLineDash([4, 3])
      ctx.lineWidth = 1.4
      ctx.strokeStyle = 'rgba(85,96,111,0.95)'
      ctx.beginPath()
      ctx.rect(gx, baseY - ghost * span, barW, ghost * span)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(107,114,128,0.95)'
      ctx.fillText('wave says', gx + barW + 5, baseY - ghost * span + 4)

      paneFrame(ctx, bars)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        `${Math.round(LIGHT_SPEED / nu / 1e-9)} nm · ${fmt(photonEnergyEv(nu), 2)} eV per photon`,
        bars.x + 4,
        14,
      )
    },
  }
}

export function Photoelectric() {
  const [nu, setNu] = useState(9.0e14)
  const [bright, setBright] = useState(0.5)
  const [metal, setMetal] = useState<Metal>('sodium')
  const nuRef = useRef(nu)
  const brightRef = useRef(bright)
  const metalRef = useRef(metal)
  nuRef.current = nu
  brightRef.current = bright
  metalRef.current = metal

  return (
    <Sim
      height={300}
      create={() => createPhotoelectric({ nu: nuRef, bright: brightRef, metal: metalRef })}
    >
      <div className="sim-seg" style={{ marginLeft: 0 }}>
        {METAL_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={metal === m ? 'seg-active' : ''}
            onClick={() => setMetal(m)}
          >
            {METALS[m].label}
          </button>
        ))}
      </div>
      <label className="sim-slider">
        <span>red</span>
        <input
          type="range"
          min={4.0e14}
          max={1.65e15}
          step={1e12}
          value={nu}
          onChange={(e) => setNu(Number(e.target.value))}
        />
        <span>ultraviolet</span>
      </label>
      <label className="sim-slider">
        <span>dim</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={bright}
          onChange={(e) => setBright(Number(e.target.value))}
        />
        <span>blinding</span>
      </label>
    </Sim>
  )
}
