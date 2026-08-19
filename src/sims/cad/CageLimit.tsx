import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, FONT_LABEL, FONT_METER, type Rect } from '../lib/chrome'
import {
  cubeCage,
  facing,
  movedVertex,
  paintOrder,
  project,
  subdivide,
  type Camera,
  type Construction,
  type Mesh,
  type Vec3,
} from './mesh'

// CAD C1 figure 5 — the cage is not the surface.
//
// Both are on screen at once, always: the amber cage you edit and the blue limit
// the rule converges to. At level 0 they are the same object; every step pulls
// the surface further inside the cage and the counts under it multiply by four.
// The construction toggle shows where one step's new points come from — face
// centres in violet, edge points in green — so the vertex rule in the prose has
// a picture and not just a fraction.
//
// The refinement is memoised on (level, lift): rebuilding 1,536 quads inside the
// draw loop would burn the frame budget of every other figure on the page.

const LIFT_VERTEX = 6 // a top corner of the cube — valence 3, so an extraordinary point

export interface Shared {
  level: number
  lift: number
  construction: boolean
  yaw: number
  pitch: number
  drag: { x: number; y: number } | null
}

export function freshCageState(): Shared {
  return { level: 2, lift: 0, construction: false, yaw: 0.7, pitch: 0.42, drag: null }
}

export function cageWithLift(lift: number): Mesh {
  const cage = cubeCage()
  const v = cage.vertices[LIFT_VERTEX]
  return movedVertex(cage, LIFT_VERTEX, [v[0], v[1] + lift, v[2]] as Vec3)
}

/** Mix a hex colour toward white by `t` ∈ [0,1] — the figure's only shading model. */
function lighten(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

interface Cached {
  level: number
  lift: number
  mesh: Mesh
  cage: Mesh
  firstStep: Construction
}

function build(level: number, lift: number): Cached {
  const cage = cageWithLift(lift)
  const { mesh, firstStep } = subdivide(cage, level)
  return { level, lift, mesh, cage, firstStep }
}

export function createCageLimit(sharedRef: { current: Shared }): Stepper {
  let cache = build(sharedRef.current.level, sharedRef.current.lift)

  return {
    step() {},
    draw(ctx, w, h) {
      const s = sharedRef.current
      if (cache.level !== s.level || cache.lift !== s.lift) cache = build(s.level, s.lift)
      const r: Rect = { x: 4, y: 4, w: w - 8, h: h - 8 }
      const cam: Camera = {
        yaw: s.yaw,
        pitch: s.pitch,
        scale: Math.min(r.w, r.h) * 0.3,
        cx: r.x + r.w / 2,
        cy: r.y + r.h / 2,
      }
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      clipPane(ctx, r)

      // limit surface, back to front, back faces culled
      const order = paintOrder(cam, cache.mesh)
      for (const fi of order) {
        const face = cache.mesh.faces[fi]
        const towards = facing(cam, cache.mesh, fi)
        if (towards <= 0) continue
        ctx.beginPath()
        face.forEach((vi, i) => {
          const p = project(cam, cache.mesh.vertices[vi])
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.fillStyle = lighten(PALETTE.curve, 0.15 + 0.45 * (1 - towards))
        ctx.fill()
        if (cache.mesh.faces.length <= 400) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }

      // the cage, over everything, so the containment is never in doubt
      ctx.strokeStyle = PALETTE.ctrl
      ctx.lineWidth = 1.8
      for (const face of cache.cage.faces) {
        ctx.beginPath()
        face.forEach((vi, i) => {
          const p = project(cam, cache.cage.vertices[vi])
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.stroke()
      }
      cache.cage.vertices.forEach((v, i) => {
        const p = project(cam, v)
        ctx.beginPath()
        ctx.arc(p.x, p.y, i === LIFT_VERTEX ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.ctrl
        ctx.fill()
        if (i === LIFT_VERTEX) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      })

      if (s.construction) {
        for (const p of cache.firstStep.facePoints) {
          const q = project(cam, p)
          ctx.beginPath()
          ctx.arc(q.x, q.y, 4, 0, Math.PI * 2)
          ctx.fillStyle = PALETTE.basis
          ctx.fill()
        }
        for (const p of cache.firstStep.edgePoints) {
          const q = project(cam, p)
          ctx.beginPath()
          ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = PALETTE.knot
          ctx.fill()
        }
      }

      ctx.restore()
      paneFrame(ctx, r)

      const valence = cache.firstStep.valence[LIFT_VERTEX]
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('drag to orbit · amber cage, blue limit', r.x + 10, r.y + 18)
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.curve
      ctx.fillText(
        `level ${s.level}: ${cache.mesh.vertices.length} vertices, ${cache.mesh.faces.length} quads`,
        r.x + 10,
        r.y + r.h - 26,
      )
      ctx.fillStyle = PALETTE.ctrl
      ctx.fillText(
        `the lifted corner has valence ${valence} — extraordinary`,
        r.x + 10,
        r.y + r.h - 8,
      )
    },
  }
}

export function CageLimit() {
  const sharedRef = useRef<Shared>(freshCageState())
  const [level, setLevel] = useState(2)
  const [lift, setLift] = useState(0)
  const [construction, setConstruction] = useState(false)

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    sharedRef.current.drag = { x: e.clientX, y: e.clientY }
  }
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sharedRef.current
    if (!s.drag || e.buttons === 0) return
    s.yaw += (e.clientX - s.drag.x) * 0.01
    s.pitch = Math.max(-1.2, Math.min(1.2, s.pitch + (e.clientY - s.drag.y) * 0.008))
    s.drag = { x: e.clientX, y: e.clientY }
  }
  const up = () => {
    sharedRef.current.drag = null
  }

  return (
    <div className="sim-stir" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
      <Sim height={330} animated={false} create={() => createCageLimit(sharedRef)}>
        <label>
          level k {level}{' '}
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={level}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.level = v
              setLevel(v)
            }}
          />
        </label>
        <label>
          lift a corner {lift.toFixed(2)}{' '}
          <input
            type="range"
            min={0}
            max={1.4}
            step={0.01}
            value={lift}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.lift = v
              setLift(v)
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={construction}
            onChange={(e) => {
              sharedRef.current.construction = e.target.checked
              setConstruction(e.target.checked)
            }}
          />{' '}
          one-step construction
        </label>
      </Sim>
    </div>
  )
}
