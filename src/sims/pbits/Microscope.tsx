import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, drawSpin, u01 } from './lib'
import { logisticNoise, sigma } from './act3'

// PLAN F17 — the p-bit under the microscope. One cell drawn as its circuit:
// two neighbor currents through programmable conductances, a bias DAC, a
// thermal noise source, all summing into a comparator. The knob is the bias
// DAC; the right pane records the MEASURED flip rate at every summed current
// the knob visits — each dot is a bin of real noisy-threshold events, never a
// plotted formula. The gray curve is exact σ(2I) for comparison: the measured
// dots land on it because a threshold plus logistic thermal noise IS the
// sigmoid (P(I + n > 0) = σ(2βI) when n ~ logistic with scale 1/(2β)).

const BETA = 1
const SAMPLES_PER_SEC = 240
const I_MAX = 3
const NBINS = 25
// The two neighbor currents cancel by construction (+0.8 and −0.8), so the
// summed current equals the bias and the knob sweeps I symmetrically.
const NBR = [
  { s: 1 as const, J: 0.8 },
  { s: -1 as const, J: 0.8 },
]

export interface MicroShared {
  h: number
}

export interface MicroProbe {
  /** Per-bin [center current, up count, total count]. */
  bins: Array<[number, number, number]>
}

export function createMicroscope(
  shared: { current: MicroShared },
  probe?: MicroProbe,
  seed = 41,
): Stepper {
  const up = new Float64Array(NBINS)
  const total = new Float64Array(NBINS)
  let out: 1 | -1 = 1
  let n = 0
  let acc = 0
  let lastNoise = 0

  const current = () => shared.current.h + NBR[0].J * NBR[0].s + NBR[1].J * NBR[1].s

  const binOf = (I: number) =>
    Math.min(NBINS - 1, Math.max(0, Math.floor(((I + I_MAX) / (2 * I_MAX)) * NBINS)))
  const binCenter = (b: number) => -I_MAX + ((b + 0.5) / NBINS) * 2 * I_MAX

  return {
    step(dt) {
      acc += dt * SAMPLES_PER_SEC
      acc = Math.min(acc, SAMPLES_PER_SEC / 4)
      const I = current()
      while (acc >= 1) {
        acc -= 1
        n++
        lastNoise = logisticNoise(u01(seed, n, 0, 0), BETA)
        out = I + lastNoise > 0 ? 1 : -1
        const b = binOf(I)
        total[b]++
        if (out > 0) up[b]++
      }
      if (probe) {
        probe.bins = []
        for (let b = 0; b < NBINS; b++) probe.bins.push([binCenter(b), up[b], total[b]])
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const I = current()

      // ---- the circuit, left ----
      const nodeX = w * 0.245
      const nodeY = h * 0.42
      const wire = (x0: number, y0: number, x1: number, y1: number, color: string, lw = 1.6) => {
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      const box = (x: number, y: number, bw: number, bh: number, label: string) => {
        ctx.strokeStyle = 'rgba(85,96,111,0.9)'
        ctx.lineWidth = 1.2
        ctx.strokeRect(x, y, bw, bh)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.95)'
        ctx.textAlign = 'center'
        ctx.fillText(label, x + bw / 2, y + bh / 2 + 4)
      }

      // neighbors feed weighted currents through conductances into the node
      NBR.forEach((nb, k) => {
        const y = nodeY + (k === 0 ? -46 : 46)
        // min box widths: at 360px the proportional boxes shrank below their
        // own labels (figure audit, 2026-08-11)
        const jBoxW = Math.max(w * 0.075, 46)
        drawSpin(ctx, w * 0.045, y, 9, nb.s)
        wire(w * 0.045 + 9, y, w * 0.085, y, 'rgba(85,96,111,0.8)')
        box(w * 0.085, y - 10, jBoxW, 20, `J = ${fmt(nb.J, 1)}`)
        wire(w * 0.085 + jBoxW, y, nodeX, nodeY, 'rgba(85,96,111,0.8)')
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'left'
        ctx.fillText(`${nb.J * nb.s > 0 ? '+' : '-'}${fmt(Math.abs(nb.J * nb.s), 1)}`, w * 0.19, y - 9)
      })

      // the bias DAC feeds the same node from below
      const narrowCirc = w < 520
      const dacX = Math.max(w * 0.035, 8)
      const dacW = narrowCirc ? 74 : w * 0.155
      box(dacX, h * 0.72, dacW, 22, narrowCirc ? `h = ${fmt(shared.current.h, 1)}` : `bias DAC  h = ${fmt(shared.current.h, 1)}`)
      wire(dacX + dacW, h * 0.72 + 11, nodeX, nodeY, 'rgba(85,96,111,0.8)')

      // the summing node and its current readout
      ctx.beginPath()
      ctx.arc(nodeX, nodeY, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1f2b'
      ctx.fill()
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.textAlign = 'left'
      ctx.fillText(`I = ${fmt(I, 2)}`, nodeX - 14, nodeY - 14)

      // thermal noise joins at the comparator input — drawn as a squiggle
      const nzX = nodeX + w * 0.035
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let t = 0; t <= 20; t++) {
        const x = nzX - 12 + (t / 20) * 24
        const y = h * 0.78 + Math.sin(t * 1.1 + lastNoise * 3) * 5
        if (t === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'center'
      ctx.fillText('thermal noise', nzX, h * 0.78 + 20)
      wire(nzX, h * 0.78 - 6, nzX, nodeY + 4, 'rgba(85,96,111,0.6)')

      // the comparator: a triangle deciding sign(I + noise)
      const cx = nodeX + w * 0.075
      wire(nodeX, nodeY, cx, nodeY, 'rgba(85,96,111,0.8)')
      ctx.strokeStyle = '#1a1f2b'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(cx, nodeY - 20)
      ctx.lineTo(cx, nodeY + 20)
      ctx.lineTo(cx + 34, nodeY)
      ctx.closePath()
      ctx.stroke()
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.textAlign = 'left'
      ctx.fillText('> 0 ?', cx + 4, nodeY + 4)

      // the output cell — the p-bit itself, flickering with the comparator
      wire(cx + 34, nodeY, cx + 52, nodeY, 'rgba(85,96,111,0.8)')
      drawSpin(ctx, cx + 64, nodeY, 12, out)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'center'
      ctx.fillText('β = 1', cx + 64, nodeY + 30)

      // ---- the measured flip-rate trace, right ----
      const r: Rect = { x: w * 0.56, y: 34, w: w * 0.4, h: h - 88 }
      paneFrame(ctx, r)
      const px = (Iv: number) => r.x + ((Iv + I_MAX) / (2 * I_MAX)) * r.w
      const py = (p: number) => r.y + (1 - p) * r.h
      // exact σ(2I) as the ghost
      ctx.strokeStyle = PALETTE.ghost
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let t = 0; t <= 60; t++) {
        const Iv = -I_MAX + (t / 60) * 2 * I_MAX
        if (t === 0) ctx.moveTo(px(Iv), py(sigma(2 * BETA * Iv)))
        else ctx.lineTo(px(Iv), py(sigma(2 * BETA * Iv)))
      }
      ctx.stroke()
      // measured dots — bins with enough events to mean something
      for (let b = 0; b < NBINS; b++) {
        if (total[b] < 30) continue
        ctx.beginPath()
        ctx.arc(px(binCenter(b)), py(up[b] / total[b]), 3.2, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.meter
        ctx.fill()
      }
      // the knob's current position on the axis
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(px(I), r.y)
      ctx.lineTo(px(I), r.y + r.h)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText('measured P(up) vs summed current I', r.x, r.y + r.h + 16)
      ctx.fillText('gray: exact σ(2I)', r.x, r.y + r.h + 30)
    },
  }
}

export function Microscope() {
  const [h, setH] = useState(0)
  const shared = useRef<MicroShared>({ h })
  shared.current.h = h

  return (
    <Sim height={280} create={() => createMicroscope(shared)}>
      <label className="sim-slider">
        <span>bias DAC</span>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.25}
          value={h}
          onChange={(e) => setH(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
