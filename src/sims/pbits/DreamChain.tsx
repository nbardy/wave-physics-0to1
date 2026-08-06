import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, drawArrow } from '../lib/chrome'
import { drawLayerRail, u01 } from './lib'
import { wFieldInto, yFieldInto, N_LEVELS, NV, type DenoiseModel } from './denoise'
import { GLYPH_SIDE, drawGlyph, drawPaneHalo, nearestGlyphDistance } from './glyphs'
import { PRETRAINED } from './pretrained'

// PLAN F27 — the generation chain, live. x₃ is sixteen fair coins; for
// t = 3…1 the current frame is clamped (halo), and the next-cleaner frame
// flickers under block Gibbs — sweep by visible sweep — until its turn is
// done and it becomes the clamped input of the level below. Finished dreams
// collect in a strip along the bottom, so the figure's product is visibly a
// distribution over the glyph family. The one knob is sweeps-per-level:
// starve the sampler and the dreams degrade — the claim that Gibbs time buys
// coherence, exercised at both ends.

const SWEEP_PERIOD = 0.12 // seconds per visible Gibbs sweep
const HOLD = 1.4 // seconds to hold a finished dream
const KEEP = 8 // finished dreams kept in the strip

const sigma2 = (f: number) => 1 / (1 + Math.exp(-2 * f))

export interface DreamChainShared {
  sweeps: number
}

export interface DreamChainProbe {
  finished: number
  withinFamily: number // finished dreams within hamming 3 of a glyph
  distSum: number // summed nearest-glyph distance — the continuous version
}

export function createDreamChain(
  shared: { current: DreamChainShared },
  probe?: DreamChainProbe,
  seed = 313,
  models: DenoiseModel[] = PRETRAINED,
): Stepper {
  let run = 0
  let level = N_LEVELS // level currently being sampled (its model is models[level-1])
  let sweepsDone = 0
  let acc = 0
  let holding = 0
  const frames: Array<Int8Array | null> = [null, null, null, null] // frames[t] = x_t
  const finished: Int8Array[] = []
  let finishedCount = 0
  let withinFamily = 0
  const y = new Int8Array(NV)
  const wHid = new Int8Array(4)
  const fy = new Float64Array(NV)
  const fw = new Float64Array(4)

  const startRun = () => {
    const x3 = new Int8Array(NV)
    for (let i = 0; i < NV; i++) x3[i] = u01(seed, run, i, 999) < 0.5 ? -1 : 1
    frames.fill(null)
    frames[N_LEVELS] = x3
    level = N_LEVELS
    sweepsDone = 0
    y.set(x3) // warm start
    const m = models[level - 1]
    wFieldInto(m, y, fw)
    for (let k = 0; k < m.nh; k++) wHid[k] = u01(seed, run, k, 3) < sigma2(fw[k]) ? 1 : -1
  }
  startRun()

  return {
    step(dt) {
      if (holding > 0) {
        holding -= dt
        if (holding <= 0) {
          run++
          startRun()
        }
        return
      }
      acc += dt
      while (acc >= SWEEP_PERIOD) {
        acc -= SWEEP_PERIOD
        const m = models[level - 1]
        const x = frames[level] as Int8Array
        const salt = run * 640 + level * 64 + sweepsDone
        yFieldInto(m, x, wHid, fy)
        for (let j = 0; j < NV; j++) y[j] = u01(seed, salt, j, 1) < sigma2(fy[j]) ? 1 : -1
        wFieldInto(m, y, fw)
        for (let k = 0; k < m.nh; k++)
          wHid[k] = u01(seed, salt, k, 2) < sigma2(fw[k]) ? 1 : -1
        sweepsDone++
        if (sweepsDone >= Math.max(1, Math.round(shared.current.sweeps))) {
          frames[level - 1] = Int8Array.from(y)
          level--
          sweepsDone = 0
          if (level === 0) {
            const done = frames[0] as Int8Array
            finished.unshift(done)
            if (finished.length > KEEP) finished.pop()
            finishedCount++
            const dist = nearestGlyphDistance(done)
            if (dist <= 3) withinFamily++
            if (probe) {
              probe.finished = finishedCount
              probe.withinFamily = withinFamily
              probe.distSum += dist
            }
            holding = HOLD
          } else {
            const m2 = models[level - 1]
            y.set(frames[level] as Int8Array)
            wFieldInto(m2, y, fw)
            for (let k = 0; k < m2.nh; k++)
              wHid[k] = u01(seed, run * 640 + level * 64, k, 3) < sigma2(fw[k]) ? 1 : -1
          }
        }
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'sampler')
      const cell = 16
      const pane = GLYPH_SIDE * cell
      const gap = (w - 60 - 4 * pane) / 3
      const py = 46
      for (let t = N_LEVELS; t >= 0; t--) {
        const px = 30 + (N_LEVELS - t) * (pane + gap)
        const known = frames[t]
        if (known) {
          drawGlyph(ctx, px, py, cell, known)
          if (t === level && holding <= 0) drawPaneHalo(ctx, px, py, cell)
        } else if (t === level - 1 && holding <= 0) {
          drawGlyph(ctx, px, py, cell, y, 0.9)
          ctx.font = FONT_LABEL
          ctx.fillStyle = PALETTE.meter
          ctx.fillText(
            `sweep ${sweepsDone + 1}/${Math.max(1, Math.round(shared.current.sweeps))}`,
            px,
            py + pane + 16,
          )
        } else {
          ctx.strokeStyle = 'rgba(120,140,170,0.4)'
          ctx.strokeRect(px, py, pane, pane)
        }
        ctx.font = FONT_METER
        ctx.fillStyle = '#1a1f2b'
        ctx.fillText(`x${t}`, px, py - 10)
        if (t > 0)
          drawArrow(
            ctx,
            px + pane + 6,
            py + pane / 2,
            px + pane + gap - 12,
            py + pane / 2,
            'rgba(85,96,111,0.7)',
            2,
          )
      }
      // the finished-dream strip: the product is a distribution
      const sy = py + pane + 40
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('finished dreams, newest first:', 30, sy - 6)
      const sc = 8
      finished.forEach((f, i) => {
        drawGlyph(ctx, 30 + i * (GLYPH_SIDE * sc + 10), sy, sc, f)
      })
    },
  }
}

export function DreamChain() {
  const [sweeps, setSweeps] = useState(6)
  const shared = useRef<DreamChainShared>({ sweeps })
  shared.current.sweeps = sweeps

  return (
    <Sim height={200} create={() => createDreamChain(shared)}>
      <label>
        sweeps per level: {sweeps}
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={sweeps}
          onChange={(e) => setSweeps(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
