import { useEffect, useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE as P } from '../lib/palette'
import { createMaxwellModel, pulse, WAVE_LENGTH, WAVE_N } from '../bundles-v2/model'

type Point = [number, number]
type Context = CanvasRenderingContext2D
function path(c: Context, points: Point[]) {
  c.beginPath()
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
}
function arrow(c: Context, from: Point, to: Point, color: string) {
  const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy)
  if (length < 2) return
  const ux = dx / length, uy = dy / length, size = Math.min(6, length / 3)
  c.strokeStyle = color; c.lineWidth = 1.5
  path(c, [from, to]); c.stroke()
  path(c, [[to[0] - size * ux - size * .45 * uy, to[1] - size * uy + size * .45 * ux], to,
    [to[0] - size * ux + size * .45 * uy, to[1] - size * uy - size * .45 * ux]])
  c.stroke()
}

export function createVacuumField(showInitial: { current: boolean } = { current: true }): Stepper {
  // The shared model integrates c=1 Maxwell equations with fixed dt=1/120,
  // centered differences and RK4; dt/dx=2/9 < 2√2, its stability bound.
  const model = createMaxwellModel()
  return { step: dt => model.advance(dt), draw(c, w, h) {
    c.clearRect(0, 0, w, h)
    c.save()
    const state = model.read(), left = 26, length = w - 80
    const amplitude = Math.min(116, h * .33), base = h * .64
    // Orthographic projection of three perpendicular 3D axes. The projection
    // rows (cos20,0,sin20), (-sin20 sin17,-cos17,cos20 sin17).
    const project = (x: number, y = 0, z = 0): Point => [
      left + length * x / WAVE_LENGTH + Math.sin(Math.PI / 9) * amplitude * z,
      base - length * x / WAVE_LENGTH * Math.tan(Math.PI / 9) * Math.sin(17 * Math.PI / 180)
        - Math.cos(17 * Math.PI / 180) * amplitude * y + Math.cos(Math.PI / 9) * Math.sin(17 * Math.PI / 180) * amplitude * z,
    ]
    const label = (s: string, x: number, y: number, color = '#475569') => {
      c.fillStyle = color; c.font = '12px system-ui'; c.textAlign = 'left'; c.fillText(s, x, y)
    }
    const fieldPoints = (values: ArrayLike<number>, axis: 'e' | 'b') => Array.from({ length: WAVE_N }, (_, i) =>
      project(i * WAVE_LENGTH / WAVE_N, axis === 'e' ? values[i] : 0, axis === 'b' ? values[i] : 0))
    if (showInitial.current) {
      const initial = Float64Array.from({ length: WAVE_N }, (_, i) => pulse(i * WAVE_LENGTH / WAVE_N))
      c.strokeStyle = '#94a3b8'; c.lineWidth = 1.3; c.setLineDash([4, 5])
      for (const axis of ['e', 'b'] as const) { path(c, fieldPoints(initial, axis)); c.stroke() }
      c.setLineDash([])
    }
    // Ribbons terminate at the same spatial baseline; their heights are the
    // actual field samples, not paths followed by particles or photons.
    for (const [values, axis, color] of [[state.b, 'b', P.bfield], [state.e, 'e', P.efield]] as const) {
      const points = fieldPoints(values, axis)
      path(c, [project(0), ...points, project((WAVE_N - 1) * WAVE_LENGTH / WAVE_N)])
      c.closePath(); c.fillStyle = color; c.globalAlpha = .13; c.fill(); c.globalAlpha = 1
      path(c, points); c.strokeStyle = color; c.lineWidth = 2.4; c.stroke()
      for (let i = 0; i < WAVE_N; i += 5) {
        arrow(c, project(i * WAVE_LENGTH / WAVE_N), points[i], color)
      }
    }
    arrow(c, project(0), project(WAVE_LENGTH + .4), '#64748b')
    label('x', ...project(WAVE_LENGTH + .7))
    label('0', left - 9, base + 20)
    label('E_y', 18, 26, P.efield); label('B_z', 58, 26, P.bfield)
    label(`c = 1    t = ${state.time.toFixed(2)}`, w - 149, 26)
    // Small basis triad: the angle between projected vectors is not their 3D angle.
    const origin: Point = [w - 69, h - 51]
    arrow(c, origin, [origin[0], origin[1] - 32], P.efield)
    arrow(c, origin, [origin[0] + 25, origin[1] + 21], P.bfield)
    arrow(c, origin, [origin[0] + 34, origin[1] - 10], '#64748b')
    label('y', origin[0] - 12, origin[1] - 28, P.efield)
    label('z', origin[0] + 28, origin[1] + 25, P.bfield)
    label('x', origin[0] + 36, origin[1] - 8)
    if (showInitial.current) label('Dashed: initial field', 18, h - 24, '#64748b')
    c.restore()
  } }
}

export function VacuumField() {
  const [show, setShow] = useState(true), ref = useRef(show)
  const [height, setHeight] = useState(360)
  ref.current = show
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const update = () => setHeight(media.matches ? 300 : 360)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return <Sim height={height} create={() => createVacuumField(ref)}>
    <label><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> Show initial pulse</label>
  </Sim>
}
