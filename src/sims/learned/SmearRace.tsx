import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, INK } from '../lib/chrome'
import { ADVECT_HELD_OUT, DT, FNX, FNY } from './advect'
import { relErr } from './advect'
import { CoarseLane, FineLane } from './advectRun'
import { FieldPainter, lazyStepper, meter, paneBorder, paneLabel, type Pane } from './figlib'

// The discretization error, made visible before anything tries to fix it.
//
// Two semi-Lagrangian solvers, same swirl, same seeded dye, same timestep. The
// left one runs at 96×64 — the standard. The right one runs at the budget the
// slider picks, and the meter reads how far it has wandered from the standard,
// averaged onto its own grid so blockiness alone scores zero. What the meter is
// charging for is the smearing: every backtrace lands between cells, every
// interpolation blurs a little, and a coarse grid takes bigger bites of blur
// per step. Nothing is unstable, nothing blows up — the coarse lane is simply,
// steadily, less true.

const T_SHOW = 420
const HOLD = 1.8

export function createSmearRace(factorRef: { current: number }): Stepper {
  const spec = ADVECT_HELD_OUT[0]
  const painter = new FieldPainter(FNX, FNY)
  let factor = 0
  let fine!: FineLane
  let coarse!: CoarseLane
  let coarsePainter!: FieldPainter
  let ghost!: Float32Array
  let steps = 0
  let hold = 0
  let err = 0
  let acc = 0

  const restart = () => {
    factor = factorRef.current
    fine = new FineLane(spec)
    coarse = new CoarseLane(spec, factor, null)
    coarsePainter = new FieldPainter(coarse.nx, coarse.ny)
    ghost = new Float32Array(coarse.nx * coarse.ny)
    steps = 0
    hold = 0
    err = 0
  }
  restart()

  return {
    step(dt) {
      if (factorRef.current !== factor) {
        restart()
        return
      }
      if (steps >= T_SHOW) {
        hold += dt
        if (hold > HOLD) restart()
        return
      }
      acc += dt
      let guard = 0
      while (acc >= DT && guard < 4) {
        fine.step()
        coarse.step()
        steps++
        acc -= DT
        guard++
      }
      fine.restrictInto(coarse.nx, coarse.ny, ghost)
      err = relErr(coarse.dye, ghost)
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const gap = 14
      const labelH = 16
      const meterH = 40
      const ph = Math.min(h - labelH - meterH, (((w - gap) / 2) * FNY) / FNX)
      const pw = (ph * FNX) / FNY
      const x0 = (w - (2 * pw + gap)) / 2
      const panes: Pane[] = [0, 1].map((i) => ({ x: x0 + i * (pw + gap), y: labelH, w: pw, h: ph }))

      painter.paint(ctx, panes[0], fine.dye, 'dye', 1, new Uint8Array(FNX * FNY))
      paneBorder(ctx, panes[0], false)
      paneLabel(ctx, panes[0], `the standard · 96 × 64`)

      coarsePainter.paint(ctx, panes[1], coarse.dye, 'dye', 1, new Uint8Array(coarse.nx * coarse.ny), false)
      paneBorder(ctx, panes[1], false)
      paneLabel(ctx, panes[1], `the budget · ${coarse.nx} × ${coarse.ny}`)

      const my = labelH + ph + 19
      ctx.font = FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.wall
      ctx.fillText('6,144 cells', panes[0].x, my)
      ctx.fillText(`${coarse.nx * coarse.ny} cells — ${(6144 / (coarse.nx * coarse.ny)).toFixed(0)}× fewer`, panes[1].x, my)
      ctx.font = FONT_METER
      meter(ctx, panes[1].x + pw, my, `wandered ${(err * 100).toFixed(0)}% from the standard`, PALETTE.div, 'right')
      meter(ctx, panes[0].x + pw, my, `${steps} steps`, INK, 'right')
    },
  }
}

export function SmearRace({ height = 260 }: { height?: number }) {
  const [factor, setFactor] = useState(4)
  const ref = useRef(factor)
  ref.current = factor
  return (
    <Sim height={height} create={() => lazyStepper(() => createSmearRace(ref))}>
      <div className="sim-seg">
        {[2, 4, 8].map((f) => (
          <button key={f} type="button" className={factor === f ? 'seg-active' : ''} onClick={() => setFactor(f)}>
            {96 / f} × {64 / f}
          </button>
        ))}
      </div>
    </Sim>
  )
}
