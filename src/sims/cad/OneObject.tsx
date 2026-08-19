import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { paneFrame, clipPane, FONT_LABEL, FONT_METER, type Rect } from '../lib/chrome'
import { cubeCage, facing, paintOrder, project, subdivide, type Camera, type Mesh } from './mesh'

// CAD C1 hero — the same object under three descriptions.
//
// The lens does not switch between three models. There is one model: a cage,
// the limit surface its refinement converges to, and a partition of that surface
// into bounded faces. Sliding the lens fades between which description is
// drawing, and the object underneath never changes — which is the article's
// whole argument, made before a word of it is claimed.
//
// The face partition is not decoration. Catmull–Clark emits each original face's
// children as a contiguous block of 4^k quads (see `catmullClark`), so quad
// `i` descends from cage face `i >> 2k`. The red strokes are exactly the
// boundaries between those blocks — the wires a B-rep would record if this
// surface were handed to a kernel.

const LEVEL = 3

export interface Shared {
  lens: number
  yaw: number
  pitch: number
  drag: { x: number; y: number } | null
}

export function freshOneObjectState(): Shared {
  // Opens on the surface alone, not on a blend. A half-faded cage over a
  // half-faded surface is the one position where the object reads as neither.
  return { lens: 1, yaw: 0.7, pitch: 0.45, drag: null }
}

/** Which cage face quad `i` descends from, after `level` steps of refinement. */
export function ancestor(i: number, level: number): number {
  return Math.floor(i / 4 ** level)
}

function lighten(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

const CAGE: Mesh = cubeCage()
const LIMIT: Mesh = subdivide(CAGE, LEVEL).mesh

function layerName(lens: number): string {
  if (lens < 0.66) return 'control structure — a cage a designer edits'
  if (lens < 1.4) return 'surface geometry — the limit the rule converges to'
  return 'boundary topology — the same surface, cut into named faces'
}

export function createOneObject(sharedRef: { current: Shared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      const s = sharedRef.current
      const r: Rect = { x: 4, y: 4, w: w - 8, h: h - 8 }
      const cam: Camera = {
        yaw: s.yaw,
        pitch: s.pitch,
        scale: Math.min(r.w, r.h) * 0.31,
        cx: r.x + r.w / 2,
        cy: r.y + r.h / 2,
      }
      const aCage = Math.max(0, 1 - s.lens)
      const aSurface = Math.min(1, s.lens)
      const aWires = Math.max(0, s.lens - 1)

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      clipPane(ctx, r)

      if (aSurface > 0.01) {
        ctx.globalAlpha = aSurface
        for (const fi of paintOrder(cam, LIMIT)) {
          const towards = facing(cam, LIMIT, fi)
          if (towards <= 0) continue
          const face = LIMIT.faces[fi]
          ctx.beginPath()
          face.forEach((vi, i) => {
            const p = project(cam, LIMIT.vertices[vi])
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.closePath()
          // alternate group tint only once the topology layer is fading in, so
          // the surface layer reads as one continuous skin until it is cut
          const group = ancestor(fi, LEVEL)
          const tint = 0.15 + 0.42 * (1 - towards) + (aWires > 0 && group % 2 === 1 ? 0.12 : 0)
          ctx.fillStyle = lighten(PALETTE.curve, Math.min(0.92, tint))
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      if (aWires > 0.01) {
        // the cuts: an edge of the limit mesh whose two quads have different ancestors
        ctx.globalAlpha = aWires
        ctx.strokeStyle = PALETTE.topo
        ctx.lineWidth = 2.4
        const owner = new Map<string, number[]>()
        LIMIT.faces.forEach((face, fi) => {
          for (let i = 0; i < face.length; i += 1) {
            const a = face[i]
            const b = face[(i + 1) % face.length]
            const key = a < b ? `${a}:${b}` : `${b}:${a}`
            const list = owner.get(key)
            if (list) list.push(fi)
            else owner.set(key, [fi])
          }
        })
        for (const [key, fis] of owner) {
          if (fis.length < 2) continue
          if (ancestor(fis[0], LEVEL) === ancestor(fis[1], LEVEL)) continue
          const [a, b] = key.split(':').map(Number)
          const pa = project(cam, LIMIT.vertices[a])
          const pb = project(cam, LIMIT.vertices[b])
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      if (aCage > 0.01) {
        ctx.globalAlpha = aCage
        ctx.strokeStyle = PALETTE.ctrl
        ctx.lineWidth = 2
        for (const face of CAGE.faces) {
          ctx.beginPath()
          face.forEach((vi, i) => {
            const p = project(cam, CAGE.vertices[vi])
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.closePath()
          ctx.stroke()
        }
        for (const v of CAGE.vertices) {
          const p = project(cam, v)
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = PALETTE.ctrl
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      ctx.restore()
      paneFrame(ctx, r)

      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('drag to orbit', r.x + 10, r.y + 18)
      ctx.font = FONT_METER
      ctx.fillStyle = aWires > 0.5 ? PALETTE.topo : aSurface > 0.5 ? PALETTE.curve : PALETTE.ctrl
      ctx.fillText(layerName(s.lens), r.x + 10, r.y + r.h - 10)
    },
  }
}

export function OneObject() {
  const sharedRef = useRef<Shared>(freshOneObjectState())
  const [lens, setLens] = useState(1)

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
      <Sim height={330} animated={false} create={() => createOneObject(sharedRef)}>
        <label>
          representation lens{' '}
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={lens}
            onChange={(e) => {
              const v = Number(e.target.value)
              sharedRef.current.lens = v
              setLens(v)
            }}
          />
        </label>
      </Sim>
    </div>
  )
}
