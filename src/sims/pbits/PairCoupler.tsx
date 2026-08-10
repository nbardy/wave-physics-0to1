import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import {
  buildModel,
  countsToProbs,
  drawLayerRail,
  drawSpin,
  edgeColor,
  enumerate,
  localField,
  stateIndex,
  sweep,
  u01,
  type PbitModel,
  type Schedule,
} from './lib'

// PLAN F5/F6 — two coins that gossip. `mode="biases"`: two independent bias
// knobs and a two-part target — agreement 0.9 with BOTH coins staying fair.
// Biases can fake agreement only by pinning both coins to a rail (independence
// gives corr = tanh h₁ · tanh h₂, so high agreement forces extreme leans — the
// check script proved the one-part target reachable and killed it, 2026-08-05).
// `mode="wire"`: one coupling knob hits both targets at once. The exact
// four-state distribution rides along as the ghost (its first appearance in
// the lesson). `fieldGauge` overlays the second cell's local field — the
// number its coin actually consults.

const SAMPLE_DT = 1 / 120
const TARGET_CORR = 0.9
const SEQ: Schedule = { kind: 'sequential' }

// Rev. 2 addition: the CONNECTED correlation Cov(s₁,s₂) = ⟨s₁s₂⟩ − ⟨s₁⟩⟨s₂⟩
// prints beside raw agreement. Under independence it is zero no matter the
// biases — so the biases-mode cheat (agreement 0.93 by pinning both coins)
// leaves the connected gauge empty, while the wire fills it. The cheat,
// quantified on-canvas.

export type PairMode = 'biases' | 'wire'

export interface PairShared {
  h1: number
  h2: number
  J: number
}

/** Numbers the check script reads back out of a running stepper. */
export interface PairProbe {
  corr: number
  cov: number
  meanL: number
  meanR: number
}

function pairModel(shared: PairShared, mode: PairMode): PbitModel {
  const wired = mode === 'wire'
  return buildModel(
    2,
    wired ? [0, 0] : [shared.h1, shared.h2],
    wired ? [{ i: 0, j: 1, J: shared.J }] : [],
    1,
  )
}

export function createPairCoupler(
  shared: { current: PairShared },
  mode: PairMode,
  fieldGauge: boolean,
  probe?: PairProbe,
  seed = 23,
): Stepper {
  let m = pairModel(shared.current, mode)
  let exact = enumerate(m)
  let counts = new Float64Array(4)
  let s = Int8Array.from([1, -1])
  let sweepN = 0
  let acc = 0
  let knobKey = ''

  const key = () => `${shared.current.h1}|${shared.current.h2}|${shared.current.J}`

  return {
    step(dt) {
      if (key() !== knobKey) {
        knobKey = key()
        m = pairModel(shared.current, mode)
        exact = enumerate(m)
        counts = new Float64Array(4)
      }
      acc += dt
      while (acc >= SAMPLE_DT) {
        acc -= SAMPLE_DT
        sweepN++
        sweep(m, s, SEQ, (site, salt) => u01(seed, sweepN, site, salt))
        counts[stateIndex(s)]++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const wired = mode === 'wire'

      // the two coins and (in wire mode) the wire between them
      const x1 = w * 0.12
      const x2 = w * 0.34
      const cy = h * 0.34
      if (wired) {
        ctx.strokeStyle = edgeColor(shared.current.J)
        ctx.lineWidth = 1 + Math.abs(shared.current.J) * 3
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(x1, cy)
        ctx.lineTo(x2, cy)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      drawSpin(ctx, x1, cy, 20, s[0])
      drawSpin(ctx, x2, cy, 20, s[1])

      // each coin's lean — the second half of the target: stay fair
      const totalNow = counts[0] + counts[1] + counts[2] + counts[3]
      const meanL = totalNow ? ((counts[1] + counts[3]) / totalNow) * 2 - 1 : 0
      const meanR = totalNow ? ((counts[2] + counts[3]) / totalNow) * 2 - 1 : 0
      const lean = (cx: number, v: number) => {
        const lw = 44
        ctx.strokeStyle = 'rgba(120,140,170,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx - lw / 2, cy + 32)
        ctx.lineTo(cx + lw / 2, cy + 32)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, cy + 28)
        ctx.lineTo(cx, cy + 36)
        ctx.stroke()
        ctx.fillStyle = Math.abs(v) > 0.3 ? '#dc2626' : '#1a1f2b'
        ctx.beginPath()
        ctx.arc(cx + (v * lw) / 2, cy + 32, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = FONT_LABEL
        ctx.textAlign = 'center'
        ctx.fillText(`lean ${fmt(v, 2)}`, cx, cy + 50)
        ctx.textAlign = 'left'
      }
      lean(x1, meanL)
      lean(x2, meanR)

      if (wired) {
        // The update rule's first run in the lesson — say on-canvas that the
        // temperature is pinned, so σ(2(h+ΣJs)) is the whole story here and
        // the β dial the prose promises is visibly not on this figure yet
        // (final external audit item, 2026-08-06).
        // headTop drops these under the rail tabs on narrow canvases, where
        // they overprinted TARGET · ENERGY at 360px (figure audit, 2026-08-11)
        const headTop = w < 520 ? 38 : 24
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        // narrow + fieldGauge: β joins the P(up) line — a third header row
        // landed on the left coin at 360px (figure audit, 2026-08-11)
        if (!(w < 520 && fieldGauge)) ctx.fillText('β = 1 (locked)', w * 0.06, fieldGauge ? headTop + 36 : headTop)
      }
      if (fieldGauge) {
        // the second coin's local field, recomputed live as the first flickers
        const headTop = w < 520 ? 38 : 24
        const f = localField(m, s, 1)
        ctx.font = FONT_METER
        ctx.fillStyle = PALETTE.meter
        ctx.fillText(`field on the right coin: ${fmt(f, 2)}`, w * 0.06, headTop)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(
          w < 520
            ? `P(up) = ${fmt(100 / (1 + Math.exp(-2 * f)), 0)}% · β = 1 (locked)`
            : `P(up) = ${fmt(100 / (1 + Math.exp(-2 * f)), 0)}%`,
          w * 0.06,
          headTop + 18,
        )
      }

      // two stacked gauges: raw agreement ⟨s₁s₂⟩ with the target mark, and the
      // connected part Cov = ⟨s₁s₂⟩ − ⟨s₁⟩⟨s₂⟩ — the share biases cannot fake
      const total = counts[0] + counts[1] + counts[2] + counts[3]
      const corr = total
        ? (counts[0] + counts[3] - counts[1] - counts[2]) / total
        : 0
      const cov = corr - meanL * meanR
      const gauge = (y: number, v: number, label: string, mark?: number) => {
        const gr: Rect = { x: w * 0.06, y, w: w * 0.42, h: 10 }
        paneFrame(ctx, gr)
        const gx = (u: number) => gr.x + ((u + 1) / 2) * gr.w
        ctx.fillStyle = PALETTE.meter
        ctx.fillRect(Math.min(gx(0), gx(v)), gr.y + 2, Math.abs(gx(v) - gx(0)), gr.h - 4)
        if (mark !== undefined) {
          ctx.strokeStyle = PALETTE.ghost
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(gx(mark), gr.y - 4)
          ctx.lineTo(gx(mark), gr.y + gr.h + 4)
          ctx.stroke()
        }
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText(label, gr.x, gr.y + gr.h + 13)
      }
      // Narrow canvases shorten the gauge labels — the full wordings ran under
      // the histogram's columns at 360px (figure audit, 2026-08-11).
      if (w < 520) {
        gauge(h - 76, corr, `agreement: ${fmt(corr, 2)} (mark ${TARGET_CORR})`, TARGET_CORR)
        gauge(h - 40, cov, `connected: ${fmt(cov, 2)}`)
      } else {
        gauge(h - 76, corr, `agreement ⟨s₁s₂⟩: ${fmt(corr, 2)}   (target mark: ${TARGET_CORR})`, TARGET_CORR)
        gauge(h - 40, cov, `connected part ⟨s₁s₂⟩ − ⟨s₁⟩⟨s₂⟩: ${fmt(cov, 2)}`)
      }
      if (probe) {
        probe.corr = corr
        probe.cov = cov
        probe.meanL = meanL
        probe.meanR = meanR
      }

      // the four-state histogram against the exact ghost
      const br: Rect = { x: w * 0.56, y: 30, w: w * 0.38, h: h - 92 }
      const probs = countsToProbs(counts)
      let peak = 0
      for (let i = 0; i < 4; i++) peak = Math.max(peak, exact[i], probs[i])
      if (peak === 0) peak = 1
      const bw = br.w / 4
      const labels = ['−−', '+−', '−+', '++']
      for (let i = 0; i < 4; i++) {
        const bx = br.x + i * bw
        const gh = (exact[i] / peak) * br.h
        ctx.strokeStyle = PALETTE.ghost
        ctx.lineWidth = 1.4
        ctx.strokeRect(bx + bw * 0.12, br.y + br.h - gh, bw * 0.76, gh)
        const sh = (probs[i] / peak) * br.h
        ctx.fillStyle = PALETTE.meter
        ctx.globalAlpha = 0.55
        ctx.fillRect(bx + bw * 0.24, br.y + br.h - sh, bw * 0.52, sh)
        ctx.globalAlpha = 1
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'center'
        ctx.fillText(labels[i], bx + bw / 2, br.y + br.h + 14)
        ctx.textAlign = 'left'
      }
    },
  }
}

export function PairCoupler({
  mode,
  fieldGauge = false,
}: {
  mode: PairMode
  fieldGauge?: boolean
}) {
  const [h1, setH1] = useState(0)
  const [h2, setH2] = useState(0)
  const [J, setJ] = useState(mode === 'wire' ? 1 : 0)
  const shared = useRef<PairShared>({ h1, h2, J })
  shared.current = { h1, h2, J }

  return (
    <Sim height={240} create={() => createPairCoupler(shared, mode, fieldGauge)}>
      {mode === 'biases' ? (
        <>
          <label className="sim-slider">
            <span>left bias</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.05}
              value={h1}
              onChange={(e) => setH1(Number(e.target.value))}
            />
          </label>
          <label className="sim-slider">
            <span>right bias</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.05}
              value={h2}
              onChange={(e) => setH2(Number(e.target.value))}
            />
          </label>
        </>
      ) : (
        <label className="sim-slider">
          <span>disagree</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={J}
            onChange={(e) => setJ(Number(e.target.value))}
          />
          <span>agree</span>
        </label>
      )}
    </Sim>
  )
}
