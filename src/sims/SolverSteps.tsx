import { useEffect, useId, useRef, useState } from 'react'
import type { Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

export type SolverOperation = 'carry' | 'smooth' | 'balance'
const OPERATIONS: SolverOperation[] = ['carry', 'smooth', 'balance']
const LABELS = { carry: '1 · Carry', smooth: '2 · Smooth', balance: '3 · Balance' }
const EXPLANATIONS = {
  carry: 'Carry (advection). The blue arrows show a flow that is faster at the top. Over one second it carries the amber patch farther than the pink one and shears both. Their area stays the same. A solver carries velocity and other fields by following these same paths.',
  smooth: 'Smooth (viscosity). The upper layers initially move right and the lower layers left. After one second of exchanging momentum with their neighbors, the abrupt jump becomes a gradual change. Compare the arrows near the middle: their lengths measure speed.',
  balance: 'Balance (pressure projection). The proposed arrows spiral into the dashed box, bringing in more fluid than leaves. Subtracting a pressure gradient removes that convergence. The corrected arrows still rotate, but the box now has equal inflow and outflow.',
}
export const studyHeight = (w: number) => w < 520 ? 2 * (w * 0.68 + 76) + 16 : (w - 16) / 2 + 76
export interface Point { x: number; y: number }
const PATCHES = [{ y: 0.2, color: PALETTE.dye }, { y: 0.61, color: PALETTE.dye2 }]
export const carry = (p: Point, t: number): Point => ({ x: p.x + (0.5 - 0.45 * p.y) * t, y: p.y })
export function patch(y: number, t: number): Point[] {
  return [{ x: 0.12, y }, { x: 0.31, y }, { x: 0.31, y: y + 0.19 }, { x: 0.12, y: y + 0.19 }].map(p => carry(p, t))
}
export function area(points: Point[]) {
  return Math.abs(points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.y - q.x * p.y }, 0)) / 2
}
// u_t = nu u_yy; no-flux endpoints conserve total momentum. Explicit Euler
// with centered differences: nu dt / dy² = .35209 <= 1/2, so each update
// is a convex blend. Exactly 240 fixed steps, independent of screen cadence.
const ROWS = 65, DT = 1 / 240, NU = 0.02, DY = 1 / ROWS
export function smoothLayers() {
  const before = Float64Array.from({ length: ROWS }, (_, i) => i < 32 ? 1 : i > 32 ? -1 : 0)
  const after = before.slice(), next = new Float64Array(ROWS), alpha = NU * DT / (DY * DY)
  for (let t = 0; t < 240; t++) {
    for (let i = 0; i < ROWS; i++) next[i] = after[i] + alpha * ((after[i - 1] ?? after[i]) + (after[i + 1] ?? after[i]) - 2 * after[i])
    after.set(next)
  }
  return { before, after }
}
// Exact Helmholtz decomposition on an open square, centered at the origin.
// u* = (-y,x) + grad(phi), phi = -.75(x²+y²), Laplacian(phi)=-3.
// Specifying phi on the boundary fixes this Poisson solution. Subtracting its
// gradient leaves rotation (-y,x), divergence zero and the SAME curl (2).
// This isolates ONE projection, not a time integration or a sealed container.
export function pressureVelocity(x: number, y: number, corrected: boolean): Point {
  const compression = corrected ? 0 : 1.5
  return { x: -y - compression * x, y: x - compression * y }
}
export function boxInflow(corrected: boolean) {
  let outward = 0
  const n = 100, ds = 0.5 / n
  for (let i = 0; i < n; i++) {
    const z = -0.25 + (i + 0.5) * ds
    outward += ds * (pressureVelocity(0.25, z, corrected).x - pressureVelocity(-0.25, z, corrected).x
      + pressureVelocity(z, 0.25, corrected).y - pressureVelocity(z, -0.25, corrected).y)
  }
  return -outward
}
const jump = (u: Float64Array) => Math.max(...u.slice(1).map((v, i) => Math.abs(v - u[i])))
export function createSolverStudy(operation: SolverOperation): Stepper & { metrics: [number, number] } {
  const layers = smoothLayers()
  const metrics: [number, number] = operation === 'carry' ? [area(patch(0.2, 0)), area(patch(0.2, 1))]
    : operation === 'smooth' ? [jump(layers.before), jump(layers.after)] : [boxInflow(false), boxInflow(true)]
  return {
    metrics,
    step() {}, // Deliberately a static, computed before/after experiment. No RAF.
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
      const stacked = w < 520, pw = stacked ? w : (w - 16) / 2, ph = stacked ? (h - 16) / 2 : h
      const font = (n: number, bold = false) => { ctx.font = `${bold ? 600 : 400} ${n}px system-ui, sans-serif` }
      for (let side = 0; side < 2; side++) {
        ctx.save(); ctx.translate(stacked ? 0 : side * (pw + 16), stacked ? side * (ph + 16) : 0)
        font(14, true); ctx.fillStyle = '#303743'
        ctx.fillText(side === 0 ? 'Before' : operation === 'balance' ? 'After pressure correction' : 'After 1 second', 12, 21)
        const x0 = 12, y0 = 36, fw = pw - 24, fh = ph - 76
        ctx.fillStyle = '#f5f8fc'; ctx.fillRect(x0, y0, fw, fh)
        const X = (x: number) => x0 + x * fw, Y = (y: number) => y0 + y * fh
        const arrow = (x: number, y: number, dx: number, dy: number, color = PALETTE.vel) => {
          if (Math.hypot(dx, dy) < 1) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); return }
          const a = Math.atan2(dy, dx), head = 4
          ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy)
          ctx.moveTo(x + dx - head * Math.cos(a - 0.6), y + dy - head * Math.sin(a - 0.6))
          ctx.lineTo(x + dx, y + dy); ctx.lineTo(x + dx - head * Math.cos(a + 0.6), y + dy - head * Math.sin(a + 0.6)); ctx.stroke()
        }
        if (operation === 'carry') {
          for (let y = 0.12; y < 1; y += 0.25) for (const x of [0.07, 0.46, 0.8]) arrow(X(x), Y(y), (0.5 - 0.45 * y) * fw * 0.22, 0)
          for (const p of PATCHES) {
            const points = patch(p.y, side)
            ctx.beginPath(); points.forEach((v, i) => i ? ctx.lineTo(X(v.x), Y(v.y)) : ctx.moveTo(X(v.x), Y(v.y))); ctx.closePath()
            ctx.fillStyle = p.color + '22'; ctx.fill(); ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke()
            for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
              const q = carry({ x: 0.14 + a * 0.05, y: p.y + 0.02 + b * 0.05 }, side)
              ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 2, 0, 2 * Math.PI); ctx.fill()
            }
          }
        } else if (operation === 'smooth') {
          const u = side === 0 ? layers.before : layers.after
          ctx.strokeStyle = '#d9e0e9'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(X(0.5), Y(0.04)); ctx.lineTo(X(0.5), Y(0.96)); ctx.stroke()
          for (let i = 0; i <= 12; i++) {
            const y = i / 12, v = u[Math.round(y * (ROWS - 1))]
            arrow(X(0.5), Y(0.07 + 0.86 * y), v * fw * 0.34, 0)
          }
        } else {
          const unit = Math.min(fw, fh)
          const PX = (x: number) => x0 + fw / 2 + (x - 0.5) * unit
          const PY = (y: number) => y0 + fh / 2 + (y - 0.5) * unit
          ctx.strokeStyle = '#929dad'; ctx.lineWidth = 1.3; ctx.setLineDash([4, 4]); ctx.strokeRect(PX(0.25), PY(0.25), unit / 2, unit / 2); ctx.setLineDash([])
          const scale = unit * 0.19
          for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            const x = (i - 2) * 0.18, y = (j - 2) * 0.18
            const v = pressureVelocity(x, y, side === 1)
            arrow(PX(x + 0.5), PY(y + 0.5), v.x * scale, v.y * scale)
          }
        }
        font(12); ctx.fillStyle = '#616b7a'
        const label = operation === 'carry' ? 'Dye area' : operation === 'smooth' ? 'Largest row-to-row jump' : 'Net flow into box'
        ctx.fillText(label, 12, ph - 12)
        const value = operation === 'carry' ? `${Math.round(100 * metrics[side] / metrics[0])}%` : metrics[side].toFixed(2)
        font(12, true); ctx.fillStyle = '#303743'; ctx.textAlign = 'right'; ctx.fillText(value, pw - 12, ph - 12); ctx.textAlign = 'left'
        ctx.restore()
      }
    },
  }
}

export function SolverSteps() {
  const [operation, setOperation] = useState<SolverOperation>('carry')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const description = useId()
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const study = createSolverStudy(operation)
    const paint = () => {
      const w = canvas.clientWidth, h = studyHeight(w), dpr = window.devicePixelRatio || 1
      canvas.style.height = `${h}px`; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); study.draw(ctx, w, h)
    }
    const observer = new ResizeObserver(paint); observer.observe(canvas)
    window.addEventListener('resize', paint); paint()
    return () => { observer.disconnect(); window.removeEventListener('resize', paint) }
  }, [operation])
  return <>
    <div className="sim-controls" role="group" aria-label="Solver operation">
      {OPERATIONS.map(op => <button key={op} type="button" aria-pressed={op === operation}
        aria-describedby={description} onClick={() => setOperation(op)}
        style={op === operation ? { color: PALETTE.vel, background: '#eef4ff', borderColor: '#a8c3ff' } : undefined}>
        {LABELS[op]}
      </button>)}
    </div>
    <p id={description}>{EXPLANATIONS[operation]}</p>
    <figure className="sim">
      <canvas ref={canvasRef} className="sim-canvas" style={{ width: '100%' }} role="img"
        aria-label={`${LABELS[operation]}: ${EXPLANATIONS[operation]}`} />
    </figure>
  </>
}
