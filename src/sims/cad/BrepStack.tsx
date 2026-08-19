import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, FONT_LABEL, FONT_METER, type Rect } from '../lib/chrome'
import { project, type Camera, type Vec3 } from './mesh'
import { ENTITY_GLOSS, ENTITY_LABEL, counts, faces, plate, type EntityKind, type Plate } from './brep'

// CAD C1 figure 6 — topology over geometry.
//
// Every other figure in this lesson answers "what value". This one answers
// "which thing", so the selector is the instrument and red is the pointing
// finger. The load-bearing selection is `surface`: it draws the unbounded plane
// the top face lies on, next to the face itself, and the gap between them is the
// entire idea — the plane is geometry, the wires are topology, and only the pair
// says where the material stops.
//
// The counts under the figure come from `counts()`, which computes the
// Euler–Poincaré balance rather than printing a remembered number. Drag the hole
// to nothing and the balance still holds, because the hole never stopped being a
// ring.

export interface Shared {
  entity: EntityKind
  hole: number
  thickness: number
  yaw: number
  pitch: number
  drag: { x: number; y: number } | null
}

export function freshBrepState(): Shared {
  return { entity: 'face', hole: 0.46, thickness: 0.34, yaw: 0.62, pitch: 0.5, drag: null }
}

function loopPath(ctx: CanvasRenderingContext2D, cam: Camera, loop: readonly Vec3[]) {
  loop.forEach((v, i) => {
    const p = project(cam, v)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  })
  ctx.closePath()
}

function meanDepth(cam: Camera, loops: readonly (readonly Vec3[])[]): number {
  let sum = 0
  let n = 0
  for (const loop of loops)
    for (const v of loop) {
      sum += project(cam, v).depth
      n += 1
    }
  return sum / n
}

/** The unbounded plane the top face lies on, drawn as a wide grid. */
function drawSupportPlane(ctx: CanvasRenderingContext2D, cam: Camera, p: Plate) {
  const y = p.halfThickness
  const R = 2.6
  ctx.strokeStyle = 'rgba(8,145,178,0.35)'
  ctx.lineWidth = 1
  for (let i = -6; i <= 6; i += 1) {
    const t = (i / 6) * R
    const a = project(cam, [t, y, -R])
    const b = project(cam, [t, y, R])
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    const c = project(cam, [-R, y, t])
    const d = project(cam, [R, y, t])
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(d.x, d.y)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(8,145,178,0.08)'
  ctx.beginPath()
  loopPath(ctx, cam, [
    [-R, y, -R],
    [R, y, -R],
    [R, y, R],
    [-R, y, R],
  ])
  ctx.fill()
}

export function createBrepStack(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      const s = sharedRef.current
      const p = plate(s.hole, s.thickness)
      const all = faces(p)
      const r: Rect = { x: 4, y: 4, w: w - 8, h: h - 8 }
      const cam: Camera = {
        yaw: s.yaw,
        pitch: s.pitch,
        scale: Math.min(r.w, r.h) * 0.33,
        cx: r.x + r.w / 2,
        cy: r.y + r.h / 2 - 10,
      }

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      clipPane(ctx, r)

      if (s.entity === 'surface') drawSupportPlane(ctx, cam, p)

      const order = all
        .map((f, i) => ({ i, d: meanDepth(cam, f.loops) }))
        .sort((a, b) => b.d - a.d)

      for (const { i } of order) {
        const face = all[i]
        ctx.beginPath()
        for (const loop of face.loops) loopPath(ctx, cam, loop)
        const isTop = i === 0
        const lit = s.entity === 'solid' || (s.entity === 'face' && isTop)
        ctx.fillStyle = lit ? 'rgba(220,38,38,0.22)' : 'rgba(37,99,235,0.14)'
        ctx.fill('evenodd')
        ctx.strokeStyle = s.entity === 'shell' ? PALETTE.topo : 'rgba(37,99,235,0.5)'
        ctx.lineWidth = s.entity === 'shell' ? 2 : 1
        ctx.stroke()
      }

      // the pointing finger
      const top = all[0]
      ctx.strokeStyle = PALETTE.topo
      ctx.lineWidth = 3
      if (s.entity === 'outerWire') {
        ctx.beginPath()
        loopPath(ctx, cam, top.loops[0])
        ctx.stroke()
      }
      if (s.entity === 'innerWire') {
        ctx.strokeStyle = PALETTE.hole
        ctx.beginPath()
        loopPath(ctx, cam, top.loops[1])
        ctx.stroke()
      }
      if (s.entity === 'edge') {
        const a = project(cam, top.loops[0][0])
        const b = project(cam, top.loops[0][1])
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      if (s.entity === 'vertex') {
        const a = project(cam, top.loops[0][0])
        ctx.beginPath()
        ctx.arc(a.x, a.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.topo
        ctx.fill()
      }
      if (s.entity === 'face' || s.entity === 'surface') {
        ctx.strokeStyle = PALETTE.topo
        ctx.lineWidth = 2.5
        ctx.beginPath()
        for (const loop of top.loops) loopPath(ctx, cam, loop)
        ctx.stroke()
      }

      ctx.restore()
      paneFrame(ctx, r)

      const c = counts(p)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('drag to orbit', r.x + 10, r.y + 18)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.topo
      ctx.fillText(`${ENTITY_LABEL[s.entity]} — ${ENTITY_GLOSS[s.entity]}`, r.x + 10, r.y + 38)
      ctx.fillStyle = 'rgba(26,31,43,0.85)'
      ctx.fillText(
        `V ${c.vertices} · E ${c.edges} · F ${c.faces} · rings ${c.rings}`,
        r.x + 10,
        r.y + r.h - 26,
      )
      ctx.fillStyle = PALETTE.basis
      ctx.fillText(
        // ASCII hyphen, not U+2212: the headless check renders through a font
        // that has no glyph for the true minus sign and paints tofu boxes.
        `V-E+F-R = ${c.euler} = 2(shells-genus) = ${2 * (c.shells - c.genus)}`,
        r.x + 10,
        r.y + r.h - 8,
      )
    },
  }
}

const ENTITIES: readonly EntityKind[] = [
  'solid',
  'shell',
  'face',
  'outerWire',
  'innerWire',
  'edge',
  'vertex',
  'surface',
]

export function BrepStack() {
  const sharedRef = useRef<Shared>(freshBrepState())
  const [entity, setEntity] = useState<EntityKind>('face')
  const [hole, setHole] = useState(0.46)
  const [thickness, setThickness] = useState(0.34)

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    sharedRef.current.drag = { x: e.clientX, y: e.clientY }
  }
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sharedRef.current
    if (!s.drag || e.buttons === 0) return
    s.yaw += (e.clientX - s.drag.x) * 0.01
    s.pitch = Math.max(0.08, Math.min(1.35, s.pitch + (e.clientY - s.drag.y) * 0.008))
    s.drag = { x: e.clientX, y: e.clientY }
  }
  const up = () => {
    sharedRef.current.drag = null
  }

  return (
    <div className="sim-stir" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
      <Sim height={330} animated={false} create={() => createBrepStack(sharedRef)}>
        <label>
          inspect{' '}
          <select
            value={entity}
            onChange={(e) => {
              const v = e.target.value as EntityKind
              sharedRef.current.entity = v
              setEntity(v)
            }}
          >
            {ENTITIES.map((k) => (
              <option key={k} value={k}>
                {ENTITY_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          hole {hole.toFixed(2)}{' '}
          <input
            type="range"
            min={0.12}
            max={0.72}
            step={0.01}
            value={hole}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.hole = v
              setHole(v)
            }}
          />
        </label>
        <label>
          thickness {thickness.toFixed(2)}{' '}
          <input
            type="range"
            min={0.08}
            max={0.7}
            step={0.01}
            value={thickness}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.thickness = v
              setThickness(v)
            }}
          />
        </label>
      </Sim>
    </div>
  )
}
