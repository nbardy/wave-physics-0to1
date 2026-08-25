import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { N_NODES, fit, freshParams, type KernelParams } from './walkCompile'
import { drawSplitMeter, readSplitMeter, type SplitMeterData } from './part2lib'

// Part 2 — the split-meter, introduced as an object before WalkLeak uses it.
// One fixed, deliberately mediocre kernel (a short deterministic fit — the
// point is the instrument, not the kernel), and ONE knob: the depth T the
// right pane is asked about. The left pane never moves — per-step KL does not
// mention depth anywhere in its definition — while the right pane grows with
// every step the kernel is chained. The knob teaches the instrument's whole
// design: its two panes ask different questions, and only one of them can
// hear the word "deep."

const TEACH_ITERS = 80
const TEACH_LR = 0.35
export const TEACH_T_MAX = 30

const uniformQ = new Float64Array(N_NODES).fill(1 / N_NODES)

export function teachKernel(): KernelParams {
  const p = freshParams(3, true)
  for (let i = 0; i < TEACH_ITERS; i++) fit(p, uniformQ, 1, TEACH_LR)
  return p
}

export interface TeachMeterShared {
  T: number
}

export interface TeachMeterProbe {
  kl: number
  tv: number
}

export function createSplitMeterTeach(
  shared: { current: TeachMeterShared },
  probe?: TeachMeterProbe,
): Stepper {
  const p = teachKernel()
  let lastT = -1
  let data: SplitMeterData | null = null

  return {
    step() {
      if (shared.current.T !== lastT) {
        lastT = shared.current.T
        data = readSplitMeter(p, uniformQ, lastT)
      }
    },
    draw(ctx, w, h) {
      if (shared.current.T !== lastT || !data) {
        lastT = shared.current.T
        data = readSplitMeter(p, uniformQ, lastT)
      }
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const reading = drawSplitMeter(ctx, { x: 16, y: 26, w: w - 32, h: h - 62 }, data)
      if (probe) {
        probe.kl = reading.kl
        probe.tv = reading.tv
      }
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        w < 520
          ? 'same kernel at every depth — only one pane can hear it'
          : 'the same kernel at every depth — the left pane cannot hear the knob, the right pane is the knob',
        16,
        h - 8,
      )
    },
  }
}

export function SplitMeterTeach() {
  const [T, setT] = useState(1)
  const shared = useRef<TeachMeterShared>({ T })
  shared.current.T = T

  return (
    <Sim height={230} animated={false} create={() => createSplitMeterTeach(shared)}>
      <label className="sim-slider">
        <span>one step</span>
        <input
          type="range"
          min={1}
          max={TEACH_T_MAX}
          step={1}
          value={T}
          onChange={(e) => setT(Number(e.target.value))}
        />
        <span>{TEACH_T_MAX} deep</span>
      </label>
    </Sim>
  )
}
