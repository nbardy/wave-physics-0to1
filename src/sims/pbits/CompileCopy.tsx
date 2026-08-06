import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import {
  buildModel,
  drawHalo,
  drawLayerRail,
  drawSpin,
  edgeColor,
  sweep,
  u01,
  type PbitModel,
} from './lib'
import { drawKernelHeat, noisyCopyTarget } from './act3'

// PLAN F22 — hand-compile noisy-copy. Clamp x, wire it to y with one coupling,
// and drag J until the measured flip-rate meter reads 10%. Both conditionals
// (x held up, x held down) are sampled in parallel so the whole compiled
// kernel accumulates while the reader watches one row live. When the hand
// lands near the mark, the figure reveals the number it found: J = ½·ln 9,
// with β locked at 1 on-screen — the closed form the knob was secretly asking
// for. Target, compiled, and error tables sit side by side.

const BETA = 1 // locked — printed on the figure
const SAMPLES_PER_SEC = 240
export const J_STAR = 0.5 * Math.log(9)

function copyModel(J: number, x: 1 | -1): PbitModel {
  // site 0 is x (clamped), site 1 is y (free)
  return buildModel(2, [0, 0], [{ i: 0, j: 1, J }], BETA, [x, 0])
}

export interface CopyShared {
  J: number
  /** Which clamp the live pair displays. Both are always measured. */
  showX: 1 | -1
}

export interface CopyProbe {
  /** Measured flip rate (y ≠ x) per row, x = −1 then x = +1. */
  rate: [number, number]
  samples: number
  revealed: boolean
}

export function createCompileCopy(
  shared: { current: CopyShared },
  probe?: CopyProbe,
  seed = 89,
): Stepper {
  let J = shared.current.J
  let models: [PbitModel, PbitModel] = [copyModel(J, -1), copyModel(J, 1)]
  const spins: [Int8Array, Int8Array] = [Int8Array.from([-1, -1]), Int8Array.from([1, 1])]
  // counts[row] = [agree, flip]
  let counts = [
    [0, 0],
    [0, 0],
  ]
  let revealed = false
  let sweepN = 0
  let acc = 0

  return {
    step(dt) {
      if (shared.current.J !== J) {
        J = shared.current.J
        models = [copyModel(J, -1), copyModel(J, 1)]
        counts = [
          [0, 0],
          [0, 0],
        ] // the wire moved — fresh measurement
      }
      acc += dt * SAMPLES_PER_SEC
      acc = Math.min(acc, SAMPLES_PER_SEC / 4)
      while (acc >= 1) {
        acc -= 1
        sweepN++
        for (let row = 0; row < 2; row++) {
          sweep(models[row], spins[row], { kind: 'sequential' }, (site, salt) =>
            u01(seed + row, sweepN, site, salt),
          )
          counts[row][spins[row][1] === spins[row][0] ? 0 : 1]++
        }
      }
      const total = counts[0][0] + counts[0][1]
      const rateShown = total ? counts[shared.current.showX > 0 ? 1 : 0][1] / total : 0
      if (!revealed && total > 200 && Math.abs(J - J_STAR) < 0.06 && Math.abs(rateShown - 0.1) < 0.02)
        revealed = true
      if (probe) {
        probe.rate = [total ? counts[0][1] / total : 0, total ? counts[1][1] / total : 0]
        probe.samples = total
        probe.revealed = revealed
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const st = shared.current
      const row = st.showX > 0 ? 1 : 0
      const s = spins[row]
      const total = counts[0][0] + counts[0][1]

      // the live pair: x held, one wire, y flickering
      const x0 = w * 0.07
      const x1 = w * 0.24
      const cy = h * 0.24
      ctx.strokeStyle = edgeColor(st.J)
      ctx.lineWidth = 1 + st.J * 3
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      ctx.lineTo(x1, cy)
      ctx.stroke()
      ctx.globalAlpha = 1
      drawSpin(ctx, x0, cy, 16, s[0])
      drawHalo(ctx, x0, cy, 16)
      drawSpin(ctx, x1, cy, 16, s[1])
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.textAlign = 'center'
      ctx.fillText('x (held)', x0, cy + 34)
      ctx.fillText('y', x1, cy + 34)
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`J = ${fmt(st.J, 2)}`, w * 0.05, h * 0.5)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('β = 1 (locked)', w * 0.05, h * 0.5 + 16)

      // the flip-rate meter for the displayed row, with the 10% mark
      const gr: Rect = { x: w * 0.05, y: h * 0.62, w: w * 0.26, h: 14 }
      paneFrame(ctx, gr)
      const rate = total ? counts[row][1] / total : 0
      const gx = (v: number) => gr.x + Math.min(1, v / 0.5) * gr.w
      ctx.fillStyle = PALETTE.meter
      ctx.fillRect(gr.x + 1, gr.y + 2, Math.max(0, gx(rate) - gr.x - 1), gr.h - 4)
      ctx.strokeStyle = PALETTE.ghost
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gx(0.1), gr.y - 4)
      ctx.lineTo(gx(0.1), gr.y + gr.h + 4)
      ctx.stroke()
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(`flip rate: ${fmt(rate * 100, 1)}%`, gr.x, gr.y + gr.h + 18)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('gray mark: 10%', gr.x, gr.y + gr.h + 34)

      // the reveal — the number the hand found
      if (revealed) {
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText('J = ½ · ln 9 ≈ 1.099', gr.x, gr.y + gr.h + 58)
      }

      // target · compiled · error, side by side
      const target = noisyCopyTarget()
      const compiled: number[][] = [0, 1].map((r) => {
        const t = counts[r][0] + counts[r][1]
        const flip = t ? counts[r][1] / t : 0.5
        return r === 0 ? [1 - flip, flip] : [flip, 1 - flip]
      })
      const err = compiled.map((rw, r) => rw.map((v, c) => Math.abs(v - target[r][c])))
      const hm = (i: number): Rect => ({
        x: w * (0.38 + i * 0.21),
        y: 40,
        w: w * 0.17,
        h: h - 110,
      })
      drawKernelHeat(ctx, hm(0), target, {
        title: 'target',
        rowLabels: ['x-', 'x+'],
        colLabels: ['y-', 'y+'],
      })
      drawKernelHeat(ctx, hm(1), compiled, {
        title: 'compiled (measured)',
        rowLabels: ['x-', 'x+'],
        colLabels: ['y-', 'y+'],
      })
      drawKernelHeat(ctx, hm(2), err, {
        title: 'error',
        rowLabels: ['x-', 'x+'],
        colLabels: ['y-', 'y+'],
        ink: PALETTE.ferro,
      })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(`${total.toLocaleString()} samples per row`, w * 0.38, h - 44)
    },
  }
}

export function CompileCopy() {
  const [J, setJ] = useState(0.2)
  const [showX, setShowX] = useState<1 | -1>(1)
  const shared = useRef<CopyShared>({ J, showX })
  shared.current.J = J
  shared.current.showX = showX

  return (
    <Sim height={280} create={() => createCompileCopy(shared)}>
      <label className="sim-slider">
        <span>J</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={J}
          onChange={(e) => setJ(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={() => setShowX((v) => (v > 0 ? -1 : 1))}>
        hold x {showX > 0 ? 'down' : 'up'}
      </button>
    </Sim>
  )
}
