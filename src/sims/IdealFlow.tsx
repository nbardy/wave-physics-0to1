import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { potentialVelocity, surfaceCp, pressureDrag, pressureDragBySign } from './lib/potential'

// Exact steady, irrotational cylinder flow, not a numerical Navier–Stokes run.
// Pressure is relative to the undisturbed stream. Removing that uniform ambient
// pressure leaves the net force unchanged. We split by the SIGN of each local
// horizontal load, NOT front/back: low-pressure shoulders also contribute.
export const IDEAL_FORCE_COLORS = { downstream: '#b45309', upstream: '#4f46e5' }
const REFERENCE_FORCE = pressureDragBySign(surfaceCp, 1, 2048).downstream

/** Forces per unit cylinder span, in fixed reference-force units. */
export function idealForces(speed: number, cp = surfaceCp) {
  const pressure = (theta: number) => speed * speed * cp(theta)
  const parts = pressureDragBySign(pressure, 1, 2048)
  return {
    downstream: parts.downstream / REFERENCE_FORCE,
    upstream: parts.upstream / REFERENCE_FORCE,
    // Independent full-circle integral: do not replace this with an asserted 0.
    net: pressureDrag(pressure, 1, 2048) / REFERENCE_FORCE,
  }
}

// Marker transport only: RK2 in the exact field, fixed at 120 Hz. R=1, max U=1.6
// and max surface speed=2U, so a marker travels <=0.027 radii per step. The field
// itself has no time integration or CFL condition. Slider range is 0.5–2 × Uref.
const DT = 1 / 120
const U_REF = 0.8
const TRAIL = 18
const STREAMS = [-2.4, -1.8, -1.3, -0.9, -0.55, -0.28, -0.1, 0.1, 0.28, 0.55, 0.9, 1.3, 1.8, 2.4]

// Solve the exact streamline equation ψ/U = y(1 − 1/(x²+y²)). Its positive
// exterior branch is monotone in y, so bisection cannot jump inside the body.
function streamlineY(x: number, psi: number) {
  let lo = Math.sqrt(Math.max(0, 1 - x * x)), hi = Math.abs(psi) + 2
  for (let i = 0; i < 30; i++) {
    const y = (lo + hi) / 2
    if (y * (1 - 1 / (x * x + y * y)) < Math.abs(psi)) lo = y
    else hi = y
  }
  return Math.sign(psi) * (lo + hi) / 2
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, color: string, thickness: number) {
  const head = Math.min(Math.abs(length) * 0.45, thickness * 1.8 + 2)
  if (Math.abs(length) < 0.4) return
  const end = x + length, sign = Math.sign(length)
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = thickness
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(end - sign * head * 0.7, y); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(end, y)
  ctx.lineTo(end - sign * head, y - head * 0.6)
  ctx.lineTo(end - sign * head, y + head * 0.6); ctx.closePath(); ctx.fill()
}

export interface IdealFlowStepper extends Stepper {
  measure: () => ReturnType<typeof idealForces> & { time: number; markers: number[][] }
}

export function createIdealFlow(speed: { current: number }, width: number, height: number): IdealFlowStepper {
  const radius = Math.min(62, width * 0.17), cx = width / 2
  const flowBottom = height - 148, cy = (42 + flowBottom) / 2
  const left = -cx / radius - 0.2, right = -left
  const paths = STREAMS.map(psi => Array.from({ length: 181 }, (_, i) => {
    const x = left + (right - left) * i / 180
    return [x, streamlineY(x, psi)]
  }))
  const markers = STREAMS.flatMap((psi, row) => Array.from({ length: 9 }, (_, i) => {
    const x = left + (right - left) * ((i + (row * 0.618 % 1)) / 9)
    const y = streamlineY(x, psi)
    return { x, y, psi, trail: Array.from({ length: TRAIL }, () => [x, y]) }
  }))
  let acc = 0, ticks = 0

  return {
    step(dt) {
      acc += Math.min(Math.max(0, dt), 0.25)
      while (acc + 1e-12 >= DT) {
        acc -= DT; ticks++
        const u = U_REF * speed.current
        for (const p of markers) {
          const v = potentialVelocity(p.x, p.y, 0, 0, 1, u)
          const mid = potentialVelocity(p.x + v.x * DT / 2, p.y + v.y * DT / 2, 0, 0, 1, u)
          p.x += mid.x * DT; p.y += mid.y * DT
          if (p.x > right) {
            p.x = left; p.y = streamlineY(left, p.psi)
            p.trail = Array.from({ length: TRAIL }, () => [p.x, p.y])
          }
          p.trail[ticks % TRAIL] = [p.x, p.y]
        }
      }
    },
    measure() {
      return { ...idealForces(speed.current), time: ticks * DT, markers: markers.map(p => [p.x, p.y]) }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, w, h)
      ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left'
      ctx.fillStyle = '#64748b'; ctx.fillText('IDEAL · NO FRICTION', 16, 25)
      ctx.textAlign = 'right'; ctx.fillText('flow →', w - 16, 25)

      ctx.save(); ctx.beginPath(); ctx.rect(0, 38, w, flowBottom - 38); ctx.clip()
      // Exact streamline guides make pressure recovery / the returning paths
      // visible immediately; moving parcels are transported by the same field.
      ctx.strokeStyle = '#dbe3ed'; ctx.lineWidth = 1
      for (const path of paths) {
        ctx.beginPath()
        path.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * radius, cy + y * radius) : ctx.moveTo(cx + x * radius, cy + y * radius))
        ctx.stroke()
      }
      ctx.strokeStyle = '#94a3b8'; ctx.fillStyle = '#64748b'; ctx.lineWidth = 1.4
      for (const p of markers) {
        ctx.beginPath()
        for (let i = 0; i < TRAIL; i++) {
          const [x, y] = p.trail[(ticks + 1 + i) % TRAIL]
          if (i === 0) ctx.moveTo(cx + x * radius, cy + y * radius)
          else ctx.lineTo(cx + x * radius, cy + y * radius)
        }
        ctx.stroke()
        ctx.beginPath(); ctx.arc(cx + p.x * radius, cy + p.y * radius, 1.8, 0, 2 * Math.PI); ctx.fill()
      }
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      ctx.setLineDash([3, 4]); ctx.strokeStyle = '#b8c3d2'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx, cy - radius - 12); ctx.lineTo(cx, cy + radius + 12); ctx.stroke(); ctx.setLineDash([])

      // Horizontal components of the gauge-pressure load, at equal-angle patches.
      // Reflect θ to π−θ: same pressure, opposite horizontal normal, equal arrows.
      for (let i = 0; i < 24; i++) {
        const theta = (i + 0.5) * 2 * Math.PI / 24
        const load = -surfaceCp(theta) * Math.cos(theta) * speed.current ** 2
        const x = cx + radius * Math.cos(theta), y = cy + radius * Math.sin(theta)
        arrow(ctx, x, y, load * radius * 0.15, load > 0 ? IDEAL_FORCE_COLORS.downstream : IDEAL_FORCE_COLORS.upstream, 1.7)
      }
      ctx.fillStyle = '#475569'; ctx.textAlign = 'center'; ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('fixed', cx, cy - 3); ctx.fillText('cylinder', cx, cy + 13)
      ctx.restore()

      const forces = idealForces(speed.current)
      const top = flowBottom + 4, center = w / 2, maxLength = w / 2 - 30
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, top, w, h - top)
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(16, top); ctx.lineTo(w - 16, top); ctx.stroke()
      ctx.fillStyle = '#64748b'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('Sum of horizontal pressure forces', center, top + 22)

      // One fixed scale throughout the slider range. At 1× each arrow is 1/4 of
      // its maximum length; at 2× it is four times longer. Gray keeps 1× in view.
      const y = top + 49
      arrow(ctx, center, y, -maxLength / 4, '#dbe3ed', 10)
      arrow(ctx, center, y, maxLength / 4, '#dbe3ed', 10)
      arrow(ctx, center, y, forces.upstream * maxLength / 4, IDEAL_FORCE_COLORS.upstream, 5)
      arrow(ctx, center, y, forces.downstream * maxLength / 4, IDEAL_FORCE_COLORS.downstream, 5)
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(center, y, 3, 0, 2 * Math.PI); ctx.fill()
      ctx.font = '600 13px system-ui, sans-serif'
      ctx.fillStyle = IDEAL_FORCE_COLORS.upstream; ctx.fillText(`← ${Math.abs(forces.upstream).toFixed(2)} upstream`, w * 0.25, top + 78)
      ctx.fillStyle = IDEAL_FORCE_COLORS.downstream; ctx.fillText(`${forces.downstream.toFixed(2)} downstream →`, w * 0.75, top + 78)
      ctx.fillStyle = '#1e293b'; ctx.font = '600 19px system-ui, sans-serif'
      const net = Math.abs(forces.net) < 0.0005 ? 0 : forces.net
      ctx.fillText(`Net drag  ${net.toFixed(3)}`, center, top + 110)
      ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#64748b'
      ctx.fillText('Force units: one directional total at 1× speed', center, top + 131)
    },
  }
}

export function IdealFlow() {
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed
  return (
    <div className="ideal-flow">
      <Sim height={400} create={(w, h) => createIdealFlow(speedRef, w, h)}>
        <label className="sim-slider">
          <span>Stream speed</span>
          <input aria-label="Ideal flow stream speed" type="range" min={0.5} max={2} step={0.01} value={speed}
            onChange={e => setSpeed(Number(e.target.value))} />
          <output style={{ minWidth: '3.1em', fontVariantNumeric: 'tabular-nums' }}>{speed.toFixed(2)}×</output>
        </label>
      </Sim>
    </div>
  )
}
