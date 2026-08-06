import { useRef } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { FONT_LABEL } from '../lib/chrome'
import { drawLayerRail } from './lib'
import { drawKernelHeat, noisyCopyTarget, type Kernel2 } from './act3'

// PLAN F21 — a stochastic kernel as a table. K(y|x): one row per input value,
// each row a probability distribution over the output. The reader edits the
// entries by dragging; rows renormalize by construction, because a row that
// does not sum to one is not a conditional distribution. Ships as noisy-copy.

export interface KernelShared {
  k: Kernel2
}

export function freshKernel(): Kernel2 {
  return noisyCopyTarget()
}

/** The edit affordance: push probability toward column `col` of row `row`. */
export function adjustKernel(k: Kernel2, row: number, col: number, delta: number): void {
  const p = Math.min(0.98, Math.max(0.02, k[row][col] + delta))
  k[row][col] = p
  k[row][1 - col] = 1 - p
}

const GRID = { x: 0.2, y: 0.14, w: 0.44, h: 0.62 }

export function kernelCellAt(ux: number, uy: number): { row: number; col: number } | null {
  if (ux < GRID.x || ux > GRID.x + GRID.w || uy < GRID.y || uy > GRID.y + GRID.h) return null
  return {
    row: Math.min(1, Math.floor(((uy - GRID.y) / GRID.h) * 2)),
    col: Math.min(1, Math.floor(((ux - GRID.x) / GRID.w) * 2)),
  }
}

export function createKernelTable(shared: { current: KernelShared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'target')
      const k = shared.current.k
      drawKernelHeat(
        ctx,
        { x: GRID.x * w, y: GRID.y * h, w: GRID.w * w, h: GRID.h * h },
        k,
        {
          title: 'K(y | x)',
          rowLabels: ['x = -', 'x = +'],
          colLabels: ['y = -', 'y = +'],
        },
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      ctx.fillText('drag up / down inside a cell to trade probability', w * 0.2, h - 26)
      ctx.fillText('each row sums to 1 — the other cell moves with it', w * 0.2, h - 10)
      // row sums, printed so the invariant is visible, not asserted
      ctx.textAlign = 'left'
      for (let r = 0; r < 2; r++) {
        ctx.fillStyle = 'rgba(85,96,111,0.75)'
        ctx.fillText(
          `Σ = ${(k[r][0] + k[r][1]).toFixed(2)}`,
          (GRID.x + GRID.w) * w + 12,
          (GRID.y + 0.1) * h + (r + 0.55) * ((GRID.h * h) / 2),
        )
      }
    },
  }
}

export function KernelTable() {
  const shared = useRef<KernelShared>({ k: freshKernel() })
  const drag = useRef<{ row: number; col: number; y: number } | null>(null)

  const unit = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      ux: (e.clientX - rect.left) / rect.width,
      uy: (e.clientY - rect.top) / rect.height,
      py: e.clientY,
    }
  }

  return (
    <div
      className="sim-stir"
      onPointerDown={(e) => {
        const u = unit(e)
        if (!u) return
        const cell = kernelCellAt(u.ux, u.uy)
        if (cell) drag.current = { ...cell, y: u.py }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const u = unit(e)
        if (!u) return
        adjustKernel(shared.current.k, d.row, d.col, (d.y - u.py) * 0.005)
        d.y = u.py
      }}
      onPointerUp={() => {
        drag.current = null
      }}
    >
      <Sim
        height={250}
        animated={false}
        create={() => {
          shared.current.k = freshKernel()
          return createKernelTable(shared)
        }}
      />
    </div>
  )
}
