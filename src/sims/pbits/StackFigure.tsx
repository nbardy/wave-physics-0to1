import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER } from '../lib/chrome'
import { drawLayerRail, type LayerName } from './lib'

// PLAN F24 — the stack, as one figure. Torx → Thermalizers → THRML →
// substrate, each layer mapped to its slot on the rail the whole lesson has
// worn: hover or tap a layer and its rail slot lights. Thermalizers is the
// arrow from TARGET to ENERGY, and the figure says so where the arrow is.

export interface StackLayer {
  name: string
  sub: string
  rail: LayerName
}

export const STACK: StackLayer[] = [
  { name: 'Torx', sub: 'stochastic programs: kernels, wired into circuits', rail: 'target' },
  { name: 'Thermalizers', sub: 'fits E(x, w, y) until the conditional matches', rail: 'energy' },
  { name: 'THRML', sub: 'biases, couplings, blocks, clamps — and Gibbs', rail: 'sampler' },
  { name: 'substrate', sub: 'JAX sim · this page’s sampler · Z1', rail: 'substrate' },
]

export interface StackShared {
  active: number
}

const BOX = { x: 0.2, w: 0.6, top: 0.13, gap: 0.215, h: 0.15 }

export function stackLayerAt(uy: number): number | null {
  for (let k = 0; k < STACK.length; k++) {
    const y = BOX.top + k * BOX.gap
    if (uy >= y && uy <= y + BOX.h) return k
  }
  return null
}

export function createStackFigure(shared: { current: StackShared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const active = shared.current.active
      drawLayerRail(ctx, w, STACK[active].rail)
      STACK.forEach((layer, k) => {
        const x = BOX.x * w
        const y = (BOX.top + k * BOX.gap) * h
        const bw = BOX.w * w
        const bh = BOX.h * h
        const on = k === active
        ctx.strokeStyle = on ? PALETTE.meter : 'rgba(85,96,111,0.6)'
        ctx.lineWidth = on ? 2.4 : 1.2
        ctx.strokeRect(x, y, bw, bh)
        if (on) {
          ctx.globalAlpha = 0.07
          ctx.fillStyle = PALETTE.meter
          ctx.fillRect(x, y, bw, bh)
          ctx.globalAlpha = 1
        }
        ctx.font = FONT_METER
        ctx.fillStyle = on ? PALETTE.meter : '#1a1f2b'
        ctx.textAlign = 'left'
        ctx.fillText(layer.name, x + 14, y + bh / 2 - 2)
        ctx.font = FONT_LABEL
        ctx.fillStyle = 'rgba(85,96,111,0.95)'
        ctx.fillText(layer.sub, x + 14, y + bh / 2 + 14)
        if (k < STACK.length - 1) {
          const ax = x + bw / 2
          const ay0 = y + bh
          const ay1 = (BOX.top + (k + 1) * BOX.gap) * h
          ctx.strokeStyle = 'rgba(85,96,111,0.7)'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(ax, ay0)
          ctx.lineTo(ax, ay1 - 4)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(ax, ay1)
          ctx.lineTo(ax - 4, ay1 - 6)
          ctx.lineTo(ax + 4, ay1 - 6)
          ctx.closePath()
          ctx.fillStyle = 'rgba(85,96,111,0.7)'
          ctx.fill()
        }
      })
      // the one annotation that matters: which arrow Thermalizers IS
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText(
        '← this arrow is Thermalizers (TARGET → ENERGY)',
        w * 0.5 + 12,
        (BOX.top + BOX.gap) * h - 6,
      )
      ctx.fillText('hover or tap a layer — its rail slot lights', BOX.x * w, h - 10)
    },
  }
}

export function StackFigure() {
  const shared = useRef<StackShared>({ active: 0 })

  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const k = stackLayerAt((e.clientY - rect.top) / rect.height)
    if (k !== null) shared.current.active = k
  }

  return (
    <div className="sim-stir" onPointerDown={pick} onPointerMove={pick}>
      <Sim height={300} animated={false} create={() => createStackFigure(shared)} />
    </div>
  )
}
