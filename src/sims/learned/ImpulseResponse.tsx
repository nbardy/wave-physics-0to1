import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { CX, CY, NX, NY, makeActivations, propose } from './net'
import { solveCG, type Grid } from './poisson'
import { WEIGHTS } from './weights'
import { FieldPainter, lazyStepper, maxAbs, paneBorder, paneLabel, relFieldError, type Pane } from './figlib'

// What did it actually learn?
//
// Poke the divergence field in exactly one cell and solve. The true answer is
// the Green's function of the discrete Laplacian: a symmetric well, deepest at
// the poke, falling off like the logarithm of distance, identical wherever you
// put the spike. That is what "learned to solve Poisson" would look like.
//
// The network's answer is a different object, and the figure's whole job is to
// let the reader see the difference rather than be told about it. Drag the
// spike across the channel and watch the true response slide with it while the
// proposal does something less obedient. A network trained on the divergence
// fields of wakes learned what the pressure around a wake looks like. That is a
// weaker claim than solving Poisson, and it is exactly the claim that predicts
// the out-of-distribution numbers three sections earlier.

export function createImpulseResponse(posRef: { current: number }): Stepper {
  // A clean channel: no obstacle, so the true response is the textbook one and
  // nothing in the picture is a boundary artefact.
  const grid: Grid = { nx: NX, ny: NY, solid: new Uint8Array(NX * NY) }
  const solidCoarse = new Float32Array(CX * CY)
  const b = new Float32Array(NX * NY)
  const star = new Float32Array(NX * NY)
  const p0 = new Float32Array(NX * NY)
  const act = makeActivations()
  const painter = new FieldPainter()
  let at = -1
  let error = 0
  let row = NY >> 1

  const rebuild = () => {
    at = posRef.current
    const i = Math.round(4 + (at / 100) * (NX - 9))
    row = NY >> 1
    b.fill(0)
    // A 2×2 poke rather than a single cell: one cell is below the grid's own
    // resolution and the true response is then dominated by the stencil rather
    // than by the physics.
    for (const dj of [0, 1]) for (const di of [0, 1]) b[i + di + (row + dj) * NX] = 1
    star.fill(0)
    solveCG(grid, star, b, 1e-6, 4000)
    propose(grid, WEIGHTS, b, solidCoarse, p0, act)
    error = relFieldError(grid, p0, star)
  }
  rebuild()

  return {
    step() {
      if (posRef.current !== at) rebuild()
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 12
      const labelH = 16
      const profileH = 60
      const meterH = 26
      const availH = h - labelH - profileH - meterH
      const ph = Math.min(availH, (((w - gap) / 2) * NY) / NX)
      const pw = (ph * NX) / NY
      const x0 = (w - (2 * pw + gap)) / 2
      const panes: Pane[] = [0, 1].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      // One scale for both panes — the comparison is the figure.
      const scale = Math.max(maxAbs(grid, star), maxAbs(grid, p0))
      painter.paint(ctx, panes[0], star, 'pressure', scale, grid.solid)
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], 'the true response')
      painter.paint(ctx, panes[1], p0, 'pressure', scale, grid.solid)
      paneBorder(ctx, panes[1], true)
      paneLabel(ctx, panes[1], 'what the network proposes', PALETTE.dye)

      // ---- profile through the poked row, both curves on one axis
      const prof = { x: x0, y: labelH + ph + 16, w: 2 * pw + gap, h: profileH - 22 }
      ctx.strokeStyle = 'rgba(120,140,170,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(prof.x, prof.y + prof.h)
      ctx.lineTo(prof.x + prof.w, prof.y + prof.h)
      ctx.stroke()

      const draw = (f: Float32Array, color: string, dash: number[]) => {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.setLineDash(dash)
        ctx.beginPath()
        for (let i = 1; i < NX - 1; i++) {
          const x = prof.x + ((i - 1) / (NX - 3)) * prof.w
          const y = prof.y + prof.h - (Math.abs(f[i + row * NX]) / (scale || 1)) * prof.h
          if (i === 1) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.restore()
      }
      draw(star, PALETTE.pLo, [])
      draw(p0, PALETTE.dye, [5, 3])

      ctx.font = FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('depth of the well along the poked row', prof.x, prof.y - 4)
      ctx.textAlign = 'right'
      ctx.fillStyle = PALETTE.pLo
      ctx.fillText('true', prof.x + prof.w - 44, prof.y - 4)
      ctx.fillStyle = PALETTE.dye
      ctx.fillText('proposed', prof.x + prof.w, prof.y - 4)

      ctx.font = FONT_METER
      ctx.textAlign = 'left'
      ctx.fillStyle = error > 0.5 ? PALETTE.div : PALETTE.pLo
      ctx.fillText(`${(error * 100).toFixed(0)}% of this response is wrong`, 0, h - 6)
      ctx.textAlign = 'right'
      ctx.fillStyle = INK
      ctx.font = FONT_LABEL
      ctx.fillText('on a wake it was 11%', w, h - 6)
    },
  }
}

export function ImpulseResponse({ height = 330 }: { height?: number }) {
  const [pos, setPos] = useState(30)
  const ref = useRef(pos)
  ref.current = pos
  return (
    <Sim height={height} animated={false} create={() => lazyStepper(() => createImpulseResponse(ref))}>
      <label className="sim-slider">
        <span>upstream</span>
        <input type="range" min={0} max={100} step={2} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
        <span>where the poke goes</span>
      </label>
    </Sim>
  )
}
