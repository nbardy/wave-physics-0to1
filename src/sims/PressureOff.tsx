import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { NX, NY, inside, drawWing, type Point } from './history/wing'
import { PROBE, boxFlux, blendFlow, projectWingFlow, sampleFlow, type FaceFlow } from './history/projection'

const DT = 1 / 120
const HEAD = 27
const FOOT = 28
const GAP = 18
const VIEW_WIDTH = 168
const INK = '#41464f'
const MUTED = '#7b818c'
interface Particle { x: number; y: number; color: number }
export interface PressureComparison extends Stepper {
  setPressure: (amount: number) => void
  measure: () => { reference: ReturnType<typeof boxFlux>; experiment: ReturnType<typeof boxFlux> }
}

// Trace the same two inlet heights through each field. These are computed
// streamlines, not decorative curves or a density simulation.
export function tracePressurePaths(field: FaceFlow): Point[][] {
  return [45, 56].map(y => {
    const path: Point[] = [{ x: 2, y }]
    let p = path[0]
    const dt = 1 / 180
    for (let i = 0; i < 5000; i++) {
      const a = sampleFlow(field, p.x, p.y)
      const b = sampleFlow(field, p.x + a.x * dt / 2, p.y + a.y * dt / 2)
      const next = { x: p.x + b.x * dt, y: p.y + b.y * dt }
      if (inside(next.x, next.y) || Math.hypot(b.x, b.y) < 0.1) break
      path.push(next)
      p = next
      if (p.x > NX - 2 || p.y < 1 || p.y > NY - 1) break
    }
    return path
  })
}

export function createPressureComparison(initialPressure = 0): PressureComparison {
  const projection = projectWingFlow()
  if (projection.relativeResidual > 1e-7) throw new Error('Pressure comparison did not converge')
  const experiment: FaceFlow = { u: projection.before.u.slice(), v: projection.before.v.slice() }
  let pressure = initialPressure
  blendFlow(projection, pressure, experiment)
  const referenceFlux = boxFlux(projection.after)
  let experimentFlux = boxFlux(experiment)
  const referencePaths = tracePressurePaths(projection.after)
  let experimentPaths = tracePressurePaths(experiment)
  let seed = 1757
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
  // Identical initial tracer positions in both fields. Dots trace prescribed
  // velocities; their count is NOT a density or volume-conservation estimator.
  const spawn = (p: Particle, scatter = false) => {
    const row = Math.floor(random() * 12)
    p.x = scatter ? 2 + random() * (NX - 4) : 2
    p.y = 22 + row * 5.4 + (random() - 0.5)
    p.color = row < 6 ? 0 : 1
    if (inside(p.x, p.y)) p.x = 2
  }
  const first: Particle[] = Array.from({ length: 240 }, () => {
    const p: Particle = { x: 0, y: 0, color: 0 }
    spawn(p, true)
    return p
  })
  const particles = [first, first.map(p => ({ ...p }))]
  const advance = (marks: Particle[], field: FaceFlow) => {
    for (const p of marks) {
      // RK2 with fixed DT. Speeds in this solved field stay below 70 cells/s,
      // so a step is under 0.6 cell. No PDE time integration is performed.
      const v = sampleFlow(field, p.x, p.y)
      const mid = sampleFlow(field, p.x + v.x * DT / 2, p.y + v.y * DT / 2)
      const x = p.x + mid.x * DT, y = p.y + mid.y * DT
      // Tracers stop at the impermeable body, rather than being drawn through it.
      if (!inside(x, y)) { p.x = x; p.y = y }
      if (p.x < 0 || p.x > NX - 2 || p.y < 1 || p.y > NY - 1) spawn(p)
    }
  }
  let acc = 0
  return {
    setPressure(amount) {
      pressure = Math.max(0, Math.min(1, amount))
      blendFlow(projection, pressure, experiment)
      experimentFlux = boxFlux(experiment)
      experimentPaths = tracePressurePaths(experiment)
      // The control changes the field. Old tracer positions are retained;
      // released parcels now follow the repaired velocity on the next step.
    },
    measure: () => ({ reference: referenceFlux, experiment: experimentFlux }),
    step(dt) {
      acc += dt
      while (acc + 1e-10 >= DT) {
        advance(particles[0], projection.after)
        advance(particles[1], experiment)
        acc -= DT
      }
    },
    draw(ctx, width, height) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      const paneHeight = (height - GAP) / 2
      const scale = width / VIEW_WIDTH
      const fieldHeight = paneHeight - HEAD - FOOT
      const viewTop = NY / 2 - fieldHeight / scale / 2
      const labels = ['With pressure', pressure === 0 ? 'Without pressure' : pressure === 1 ? 'Pressure restored' : 'Partly restored']
      const fluxes = [referenceFlux, experimentFlux]
      for (let row = 0; row < 2; row++) {
        const y0 = row * (paneHeight + GAP)
        const field = row === 0 ? projection.after : experiment
        const flux = fluxes[row]
        ctx.save()
        ctx.translate(0, y0)
        ctx.fillStyle = INK
        ctx.font = '600 14px ui-sans-serif, system-ui'
        ctx.fillText(labels[row], 8, 18)
        ctx.save()
        ctx.beginPath(); ctx.rect(0, HEAD, width, fieldHeight); ctx.clip()
        ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, HEAD, width, fieldHeight)
        ctx.translate(0, HEAD - viewTop * scale)
        const xBox = PROBE.left * scale, yBox = PROBE.top * scale
        const boxW = (PROBE.right - PROBE.left) * scale, boxH = (PROBE.bottom - PROBE.top) * scale
        ctx.fillStyle = 'rgba(37,99,235,0.055)'; ctx.fillRect(xBox, yBox, boxW, boxH)
        // Faint instantaneous direction marks make the turning visible even
        // while paused. They sample the same face field that moves the dots.
        ctx.lineWidth = 0.8; ctx.strokeStyle = '#cad1dc'
        for (let y = 27; y < 83; y += 8) for (let x = 12; x < NX - 8; x += 14) {
          if (inside(x, y)) continue
          const v = sampleFlow(field, x, y)
          ctx.beginPath(); ctx.moveTo(x * scale, y * scale)
          ctx.lineTo((x + v.x * 0.16) * scale, (y + v.y * 0.16) * scale); ctx.stroke()
        }
        for (const p of particles[row]) {
          const v = sampleFlow(field, p.x, p.y)
          ctx.strokeStyle = p.color === 0 ? PALETTE.dye : PALETTE.dye2
          ctx.fillStyle = ctx.strokeStyle
          ctx.globalAlpha = 0.4; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo((p.x - v.x * 0.08) * scale, (p.y - v.y * 0.08) * scale)
          ctx.lineTo(p.x * scale, p.y * scale); ctx.stroke()
          ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(p.x * scale, p.y * scale, 1.35, 0, 2 * Math.PI); ctx.fill()
        }
        ctx.globalAlpha = 1
        const paths = row === 0 ? referencePaths : experimentPaths
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i]
          ctx.strokeStyle = i === 0 ? PALETTE.dye : PALETTE.dye2
          ctx.lineWidth = 1.8
          ctx.beginPath()
          path.forEach((p, j) => j === 0 ? ctx.moveTo(p.x * scale, p.y * scale) : ctx.lineTo(p.x * scale, p.y * scale))
          ctx.stroke()
          // Direction heads ride the actual tangent to the computed path.
          for (const targetX of [28, 77, 130]) {
            const j = path.findIndex(p => p.x >= targetX)
            if (j < 1) continue
            const p = path[j], prev = path[j - 1]
            const angle = Math.atan2(p.y - prev.y, p.x - prev.x)
            ctx.save(); ctx.translate(p.x * scale, p.y * scale); ctx.rotate(angle)
            ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(0, 0); ctx.lineTo(-5, 3); ctx.stroke(); ctx.restore()
          }
        }
        drawWing(ctx, NX * scale, NY * scale)
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.25; ctx.setLineDash([4, 3])
        ctx.strokeRect(xBox, yBox, boxW, boxH); ctx.setLineDash([])
        ctx.restore()
        const meterY = paneHeight - 9
        ctx.fillStyle = MUTED; ctx.font = '12px ui-sans-serif, system-ui'
        ctx.fillText('Outflow / inflow', 8, meterY)
        const barX = Math.max(157, width - 158), barW = width - barX - 57
        ctx.fillStyle = '#e5e9f0'; ctx.fillRect(barX, meterY - 7, barW, 4)
        ctx.fillStyle = row === 0 || pressure === 1 ? PALETTE.vel : PALETTE.dye
        ctx.fillRect(barX, meterY - 7, barW * Math.min(1, flux.ratio), 4)
        ctx.font = '600 13px ui-monospace, monospace'; ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(flux.ratio * 100)}%`, width - 8, meterY + 1)
        ctx.restore()
      }
    },
  }
}

export function PressureOff() {
  const [pressure, setPressure] = useState(0)
  const pressureRef = useRef(0)
  const simRef = useRef<PressureComparison | null>(null)
  return (
    <Sim aspectRatio={1.12} create={() => {
      const sim = createPressureComparison(pressureRef.current)
      simRef.current = sim
      return sim
    }}>
      <label className="sim-slider">
        <span>Restore pressure</span>
        <input type="range" aria-label="Restore pressure" min={0} max={100} step={1} value={pressure}
          onChange={e => {
            const value = Number(e.target.value)
            pressureRef.current = value / 100
            simRef.current?.setPressure(value / 100)
            setPressure(value)
          }} />
        <span>{pressure}%</span>
      </label>
    </Sim>
  )
}
