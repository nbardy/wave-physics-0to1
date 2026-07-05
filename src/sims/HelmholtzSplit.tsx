import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { vortexField, drawArrowGrid, type FlowField } from './lib/field'

// §10 — Helmholtz, shown not proven: this field is literally built as
// (swirling, divergence-free part) + (gradient, curl-free part), and the
// segmented control lets the reader look at each ingredient alone.
// The theorem's content — that ANY smooth field splits this way — is stated
// in prose and outsourced for proof; the figure makes the split concrete.

const SWIRL = vortexField(0.16)
const BLOB = { x: 0.6, y: 0.45, w: 0.2 }

function gradPart(x: number, y: number) {
  const dx = x - BLOB.x
  const dy = y - BLOB.y
  const e = Math.exp(-((dx * dx + dy * dy) / (BLOB.w * BLOB.w)))
  return { x: dx * e * 1.2, y: dy * e * 1.2 }
}

export type HelmholtzMode = 'both' | 'swirl' | 'gradient'

function fieldOf(mode: HelmholtzMode): FlowField {
  return (x, y, t) => {
    const s = mode !== 'gradient' ? SWIRL(x, y, t) : { x: 0, y: 0 }
    const g = mode !== 'swirl' ? gradPart(x, y) : { x: 0, y: 0 }
    return { x: s.x + g.x, y: s.y + g.y }
  }
}

function createHelmholtz(mode: HelmholtzMode): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      // divergence tint: only the gradient part carries any (violet)
      if (mode !== 'swirl') {
        for (let yy = 0; yy < h; yy += 4) {
          for (let xx = 0; xx < w; xx += 4) {
            const dx = xx / w - BLOB.x
            const dy = yy / h - BLOB.y
            const e = Math.exp(-((dx * dx + dy * dy) / (BLOB.w * BLOB.w)))
            if (e < 0.08) continue
            ctx.fillStyle = `rgba(124,58,237,${e * 0.25})`
            ctx.fillRect(xx, yy, 4, 4)
          }
        }
      }
      drawArrowGrid(ctx, fieldOf(mode), 0, w, h, 32, 120)
      ctx.fillStyle = '#55606f'
      ctx.font = '12px ui-sans-serif, system-ui'
      const label =
        mode === 'both'
          ? 'the full field = swirl + pile-up'
          : mode === 'swirl'
            ? 'divergence-free part: pure swirl, no crime'
            : 'gradient part: all of the divergence lives here'
      ctx.fillText(label, 10, 20)
    },
  }
}

export function HelmholtzSplit({ height = 260 }: { height?: number }) {
  const [mode, setMode] = useState<HelmholtzMode>('both')
  return (
    <Sim height={height} create={() => createHelmholtz(mode)} key={mode}>
      <div className="sim-seg">
        {(['both', 'swirl', 'gradient'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={mode === m ? 'seg-active' : ''}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </Sim>
  )
}
