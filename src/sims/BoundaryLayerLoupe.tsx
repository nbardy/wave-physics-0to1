import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { FluidSolver } from './lib/solver'
import { PALETTE } from './lib/palette'
import { MarkerSystem, type FlowField } from './lib/field'

const NX = 144, NY = 88, INFLOW = 26, DISC_R = 7
const DISC_CX = Math.round(NX * .26), DISC_CY = Math.round(NY * .5) + 1
export const LOUPE_DT = 1 / 40
// Fixed physics timestep. Semi-Lagrangian advection is bounded and viscosity
// uses implicit Gauss–Seidel relaxation. Re=130 is a moderate, grid-resolved
// illustration, NOT the asymptotic high-Re Prandtl limit or validated drag data.
const VISCOSITY = INFLOW * 2 * DISC_R / 130
const SPAN = 8
const IDEAL_COLOR = '#78716c'
export type ProfileSample = { distance: number; viscous: number; ideal: number }
export interface LoupeStepper extends Stepper {
  measure: () => { time: number; angle: number; drag: number; samples: ProfileSample[] }
}

export function createLoupe(probe: { current: number }): LoupeStepper {
  const solver = new FluidSolver(NX, NY, INFLOW, VISCOSITY)
  solver.addDisc(DISC_CX, DISC_CY, DISC_R)
  // These normals point from the FLUID INTO THE SOLID. Hence +sum(p*nx)
  // gives downstream pressure force on the body. Pressure storage contains dt.
  const faces: { k: number; nx: number }[] = []
  for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
    const k = i + j * NX
    if (solver.solid[k]) continue
    if (solver.solid[k - 1]) faces.push({ k, nx: -1 })
    if (solver.solid[k + 1]) faces.push({ k, nx: 1 })
  }
  const markers = new MarkerSystem(150, 1904)
  const inletY = (i: number) => DISC_CY + (((i * .61803398875) % 1) * 2 - 1) * 15
  for (let i = 0; i < markers.n; i++) {
    markers.xs[i] = (DISC_CX - 21 + i / markers.n * 80) / NX
    markers.ys[i] = inletY(i) / NY
  }
  const field: FlowField = (x, y) => ({
    x: bilerp(solver.u, x * NX, y * NY) / NX,
    y: bilerp(solver.v, x * NX, y * NY) / NY,
  })
  let time = 0, acc = 0, drag = 0
  function advance() {
    solver.step(LOUPE_DT)
    time += LOUPE_DT
    markers.step(LOUPE_DT, field, time)
    // Recycle tracers at the displayed window's edges, not the distant channel
    // walls where the old markers accumulated out of view. This changes only
    // the visualization's dye sources, never the velocity or pressure solve.
    for (let i = 0; i < markers.n; i++) {
      const x = markers.xs[i] * NX, y = markers.ys[i] * NY
      if (x < DISC_CX - 22 || x > DISC_CX + 60 || Math.abs(y - DISC_CY) > 18 ||
        Math.hypot(x - DISC_CX, y - DISC_CY) < DISC_R) {
        markers.xs[i] = (DISC_CX - 21) / NX
        markers.ys[i] = inletY(i) / NY
      }
    }
    let fx = 0
    for (const f of faces) fx += solver.p[f.k] / LOUPE_DT * f.nx
    const cd = fx / (.5 * INFLOW ** 2 * 2 * DISC_R)
    drag += (1 - Math.exp(-LOUPE_DT / .5)) * (cd - drag)
  }
  // Start with developed motion. Moving a probe never resets this flow.
  // The reversed run at the Rear preset (160°) only forms after about 8 s
  // (360 steps) of flow, and the prose promises it on arrival. Running all 360
  // here froze the page ~3 s at mount (Sim builds every figure on load), so 200
  // run now and the remaining 160 catch up over the first visible frames.
  for (let i = 0; i < 200; i++) advance()
  let catchUp = 160
  const sampleProfile = () => {
    const theta = Math.PI + probe.current * Math.PI / 180
    const nx = Math.cos(theta), ny = Math.sin(theta)
    const tx = -ny, ty = nx // tangent oriented from nose toward tail on upper half
    const samples: ProfileSample[] = []
    for (let i = 0; i <= 24; i++) {
      const distance = i / 24 * SPAN, r = DISC_R + distance
      const x = DISC_CX + nx * r, y = DISC_CY + ny * r
      // The surface point is the imposed no-slip boundary value. Off-wall
      // samples interpolate the numerical grid; they are not exact wall data.
      const viscous = i === 0 ? 0 : (bilerp(solver.u, x, y) * tx + bilerp(solver.v, x, y) * ty) / INFLOW
      // Exact unbounded, zero-circulation cylinder potential flow, normalized
      // by inlet U. Comparison of models, not matched outer-boundary solutions.
      const ideal = -Math.sin(theta) * (1 + DISC_R ** 2 / r ** 2)
      samples.push({ distance: distance / DISC_R, viscous, ideal })
    }
    return samples
  }
  return {
    measure: () => ({ time, angle: probe.current, drag, samples: sampleProfile() }),
    step(dt) {
      for (let i = 0; i < 6 && catchUp > 0; i++, catchUp--) advance()
      acc += dt
      while (acc + 1e-12 >= LOUPE_DT) { advance(); acc -= LOUPE_DT }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, w, h)
      const mapH = 202, scale = Math.min((w - 28) / 82, (mapH - 48) / 38)
      const mapLeft = (w - 82 * scale) / 2
      const px = (x: number) => mapLeft + (x - DISC_CX + 22) * scale
      const py = (y: number) => 44 + (mapH - 48) / 2 + (y - DISC_CY) * scale
      ctx.font = '600 12px system-ui, sans-serif'
      ctx.fillStyle = '#475569'; ctx.fillText('Flow →', 18, 23)
      ctx.textAlign = 'right'; ctx.fillText(`Pressure drag Cd  ${drag.toFixed(2)}`, w - 18, 23)
      ctx.textAlign = 'left'
      ctx.save(); ctx.beginPath(); ctx.rect(12, 34, w - 24, mapH - 34); ctx.clip()
      // Short, pale direction strokes locate the wake without hiding the probe.
      ctx.strokeStyle = '#cad5e2'; ctx.lineWidth = 1
      for (let y = DISC_CY - 16; y <= DISC_CY + 16; y += 4) {
        for (let x = DISC_CX - 20; x < DISC_CX + 60; x += 5) {
          if (Math.hypot(x - DISC_CX, y - DISC_CY) < DISC_R + 1) continue
          const u = bilerp(solver.u, x, y) / INFLOW, v = bilerp(solver.v, x, y) / INFLOW
          ctx.beginPath(); ctx.moveTo(px(x), py(y)); ctx.lineTo(px(x) + u * 7, py(y) + v * 7); ctx.stroke()
        }
      }
      ctx.fillStyle = PALETTE.dye
      for (let i = 0; i < markers.n; i++) {
        const x = markers.xs[i] * NX, y = markers.ys[i] * NY
        if (Math.hypot(x - DISC_CX, y - DISC_CY) < DISC_R) continue
        ctx.beginPath(); ctx.arc(px(x), py(y), 1.7, 0, 2 * Math.PI); ctx.fill()
      }
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath(); ctx.arc(px(DISC_CX), py(DISC_CY), DISC_R * scale, 0, 2 * Math.PI); ctx.fill()
      const theta = Math.PI + probe.current * Math.PI / 180
      const point = (r: number) => ({ x: px(DISC_CX + Math.cos(theta) * r), y: py(DISC_CY + Math.sin(theta) * r) })
      const a = point(DISC_R), b = point(DISC_R + SPAN)
      ctx.strokeStyle = PALETTE.vel; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a.x, a.y, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      ctx.fillStyle = PALETTE.vel; ctx.font = '600 12px system-ui, sans-serif'
      ctx.textAlign = 'center'; ctx.fillText(`${probe.current}°`, b.x, Math.max(46, b.y - 9)); ctx.textAlign = 'left'
      ctx.restore()

      // The readout stays still, separate from the sampling point and cursor.
      const chartTop = mapH + 78, chartBottom = h - 62
      const chartLeft = 55, chartRight = w - 24
      const xMin = -.5, xMax = 2.2
      const sx = (speed: number) => chartLeft + (speed - xMin) / (xMax - xMin) * (chartRight - chartLeft)
      const sy = (distance: number) => chartBottom - distance / (SPAN / DISC_R) * (chartBottom - chartTop)
      ctx.fillStyle = '#334155'; ctx.font = '600 13px system-ui, sans-serif'
      ctx.fillText('Speed along the surface', 18, mapH + 18)
      ctx.font = '12px system-ui, sans-serif'
      for (const [i, label, color] of [[0, 'With viscosity', PALETTE.vel], [1, 'Frictionless', IDEAL_COLOR]] as const) {
        const x = 18 + i * 154
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(i === 1 ? [4, 3] : [])
        ctx.beginPath(); ctx.moveTo(x, mapH + 38); ctx.lineTo(x + 19, mapH + 38); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = color; ctx.fillText(label, x + 25, mapH + 42)
      }
      ctx.fillStyle = '#64748b'; ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('Distance from wall / radius', chartLeft, chartTop - 12)
      ctx.textAlign = 'center'
      for (const value of [0, 1, 2]) {
        ctx.strokeStyle = value === 0 ? '#94a3b8' : '#e2e8f0'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(sx(value), chartTop); ctx.lineTo(sx(value), chartBottom); ctx.stroke()
        ctx.fillStyle = '#64748b'; ctx.fillText(String(value), sx(value), chartBottom + 18)
      }
      ctx.textAlign = 'right'
      for (const value of [0, .5, 1]) {
        ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(chartLeft, sy(value)); ctx.lineTo(chartRight, sy(value)); ctx.stroke()
        ctx.fillStyle = '#64748b'; ctx.fillText(value === 0 ? 'Wall' : String(value), chartLeft - 8, sy(value) + 4)
      }
      ctx.textAlign = 'left'
      const samples = sampleProfile()
      ctx.save(); ctx.beginPath(); ctx.rect(chartLeft, chartTop, chartRight - chartLeft, chartBottom - chartTop + 2); ctx.clip()
      for (const kind of ['ideal', 'viscous'] as const) {
        ctx.strokeStyle = kind === 'ideal' ? IDEAL_COLOR : PALETTE.vel
        ctx.lineWidth = 2.4; ctx.setLineDash(kind === 'ideal' ? [5, 4] : [])
        ctx.beginPath()
        samples.forEach((p, i) => i ? ctx.lineTo(sx(p[kind]), sy(p.distance)) : ctx.moveTo(sx(p[kind]), sy(p.distance)))
        ctx.stroke()
      }
      ctx.setLineDash([])
      // Negative values use the same scale: no exaggerated reverse-arrow floor.
      ctx.fillStyle = PALETTE.pHi
      for (const p of samples) if (p.viscous < -.02) {
        ctx.beginPath(); ctx.arc(sx(p.viscous), sy(p.distance), 2.5, 0, 2 * Math.PI); ctx.fill()
      }
      ctx.restore()
      ctx.fillStyle = PALETTE.vel; ctx.beginPath(); ctx.arc(sx(0), chartBottom, 3.5, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = '#64748b'; ctx.textAlign = 'center'
      ctx.fillText('← reverse     Speed / inlet speed     forward →', (chartLeft + chartRight) / 2, h - 16)
      ctx.textAlign = 'left'
    },
  }
}

/** Bilinear read of a solver field at fractional grid coords (clamped to the grid). */
function bilerp(f: Float32Array, x: number, y: number): number {
  const cx = Math.min(Math.max(x, 0), NX - 1.001)
  const cy = Math.min(Math.max(y, 0), NY - 1.001)
  const i0 = Math.floor(cx)
  const j0 = Math.floor(cy)
  const tx = cx - i0
  const ty = cy - j0
  const k = i0 + j0 * NX
  const a = f[k]
  const b = f[k + 1]
  const c = f[k + NX]
  const d = f[k + NX + 1]
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

export function BoundaryLayerLoupe({ height = 490 }: { height?: number }) {
  const [angle, setAngle] = useState(90)
  const probe = useRef(angle)
  probe.current = angle
  return (
    <div className="boundary-probe">
      <Sim height={height} create={() => createLoupe(probe)}>
        <div className="boundary-probe-presets" role="group" aria-label="Probe location">
          {/* Rear sits at 160, not 145: measured over 40 s (2026-09-23), 145°
              averages 1.8 reversed samples and 160° averages 11, so the red
              run the prose promises is visible at the preset. */}
          {([['Front', 45], ['Shoulder', 90], ['Rear', 160]] as const).map(([label, value]) => (
            <button type="button" key={label} aria-pressed={angle === value} onClick={() => setAngle(value)}>{label}</button>
          ))}
        </div>
        <label className="sim-slider">
          <span>Probe position</span>
          <input type="range" aria-label="Boundary probe position" min={20} max={160} step={1}
            value={angle} onChange={e => setAngle(Number(e.target.value))} />
          <span>{angle}°</span>
        </label>
      </Sim>
    </div>
  )
}
