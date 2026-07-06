import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §11, the which-force picture gallery (plan fig 66), confessed as named-not-built.
// Past the Universal Wave Machine's last stop, nature runs richer fibers than
// circles: the weak and strong forces stand sphere-like faces over each point,
// with transport rules that act on one another (their connections do not
// commute — the one confessed difference); gravity stands the frames of
// spacetime itself over each event. The sentence never changes: a wave is a
// section, a force is a connection, and the covariant operator does the rest.
//
// This is an illustrated gallery, not a solver — each fiber is a schematic drawn
// in closed form, spun gently by playback time. There is no integrator and no
// PDE, so there is no stability condition to state; the honesty rule is met by
// not pretending to simulate what the article explicitly says it does not build.
// The one knob is the force selector.
//
// The forces are a sum type; the dispatcher is a thin table lookup and each
// force is drawn by one handler — no default branch.

export type Force = 'em' | 'weak' | 'strong' | 'gravity'

const FORCE_ORDER: readonly Force[] = ['em', 'weak', 'strong', 'gravity']
const FORCE_LABEL: Record<Force, string> = {
  em: 'electromagnetism',
  weak: 'weak',
  strong: 'strong',
  gravity: 'gravity',
}

interface ForceSpec {
  fiber: string // one line: what stands in the fiber
  group: string // the transport rule's "kind"
  note: string // the confessed difference (or "the one we built")
  commutes: boolean // do this force's connections commute? (EM yes, others no)
  drawFiber: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) => void
}

const INK = '#55606f'

// --------------------------------------------------------------- glyphs ------

function drawCircleFiber(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number): void {
  // the fiber we built: one circle, one needle
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  const ang = t * 0.6
  ctx.strokeStyle = PALETTE.theta
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(-ang) * r * 0.85, cy + Math.sin(-ang) * r * 0.85)
  ctx.stroke()
}

function drawSphereFiber(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, needles: number, tint: string): void {
  // a sphere-like face: a wire-globe with several needles (more directions to
  // point than a circle allows). Orthographic wireframe, spun by t.
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  // a couple of latitude/longitude wires to read as a sphere
  ctx.strokeStyle = 'rgba(107,114,128,0.5)'
  ctx.lineWidth = 1
  for (const lat of [-0.45, 0, 0.45]) {
    ctx.beginPath()
    ctx.ellipse(cx, cy + lat * r, r * Math.sqrt(1 - lat * lat), r * 0.28 * Math.sqrt(1 - lat * lat) + 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  const spin = t * 0.5
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * Math.abs(Math.cos(spin)) + 0.5, r, 0, 0, Math.PI * 2)
  ctx.stroke()
  // several needles pointing in different directions — the richer fiber
  for (let k = 0; k < needles; k++) {
    const ang = spin + (k / needles) * Math.PI * 2
    const rr = r * (0.6 + 0.25 * Math.sin(spin + k))
    ctx.strokeStyle = tint
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.55)
    ctx.stroke()
  }
}

function drawFrames(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number): void {
  // gravity: the frames of spacetime themselves — a little coordinate cross that
  // tilts from point to point (a tipping local frame, drawn schematically)
  const tilt = Math.sin(t * 0.6) * 0.4
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  // two frame axes (amber = the transported thing here is a whole frame)
  ctx.strokeStyle = PALETTE.theta
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(cx - c * r * 0.8, cy - s * r * 0.8)
  ctx.lineTo(cx + c * r * 0.8, cy + s * r * 0.8)
  ctx.moveTo(cx + s * r * 0.8, cy - c * r * 0.8)
  ctx.lineTo(cx - s * r * 0.8, cy + c * r * 0.8)
  ctx.stroke()
}

const FORCES: Record<Force, ForceSpec> = {
  em: {
    fiber: 'a circle of phase — the fiber you built',
    group: 'connection: one rotation per step',
    note: 'the whole article — this is the one we built',
    commutes: true,
    drawFiber: (ctx, cx, cy, r, t) => drawCircleFiber(ctx, cx, cy, r, t),
  },
  weak: {
    fiber: 'a sphere-like face — more directions than a circle allows',
    group: 'connection: rules that act on one another',
    note: 'the connections do not commute — the one confessed difference',
    commutes: false,
    drawFiber: (ctx, cx, cy, r, t) => drawSphereFiber(ctx, cx, cy, r, t, 2, PALETTE.theta),
  },
  strong: {
    fiber: 'a richer sphere-like face still — three charges to mix',
    group: 'connection: rules that act on one another',
    note: 'the connections do not commute — the one confessed difference',
    commutes: false,
    drawFiber: (ctx, cx, cy, r, t) => drawSphereFiber(ctx, cx, cy, r, t, 3, PALETTE.conn),
  },
  gravity: {
    fiber: 'the frames of spacetime, over each event',
    group: 'connection: how a frame is carried from event to event',
    note: 'the transported thing is a whole frame — same sentence, richer fiber',
    commutes: false,
    drawFiber: (ctx, cx, cy, r, t) => drawFrames(ctx, cx, cy, r, t),
  },
}

// -------------------------------------------------------------- rendering ----

function createWhichForce(forceRef: { current: Force }): Stepper {
  let t = 0
  return {
    step(dt) {
      t += dt // playback time only — a named-not-built illustration, nothing integrated
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const spec = FORCES[forceRef.current]

      // a base line with three fibers standing over it — the same picture the
      // whole lesson used, now with the fiber swapped for this force's
      const baseY = h * 0.62
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(w * 0.08, baseY)
      ctx.lineTo(w * 0.92, baseY)
      ctx.stroke()

      // fiber faces sit in a fixed band below the captions (y ≈ 56) and above
      // the base line, with r small enough that the circles never reach either
      const fiberCy = 56 + (baseY - 56) * 0.42
      const r = Math.min(w * 0.09, (fiberCy - 56) * 0.9, (baseY - fiberCy) * 0.55)
      for (let k = 0; k < 3; k++) {
        const cx = w * (0.28 + 0.22 * k)
        // fiber stem from the base line up to the face
        ctx.strokeStyle = 'rgba(107,114,128,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx, baseY)
        ctx.lineTo(cx, fiberCy + r)
        ctx.stroke()
        spec.drawFiber(ctx, cx, fiberCy, r, t + k * 0.7)
      }

      // captions
      ctx.fillStyle = INK
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(spec.fiber, w * 0.08, 24)
      ctx.fillStyle = PALETTE.conn
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(spec.group, w * 0.08, 42)

      // the commuting badge — the confessed difference, said in a word
      ctx.textAlign = 'right'
      ctx.fillStyle = spec.commutes ? INK : PALETTE.curv
      ctx.fillText(spec.commutes ? 'connections commute (abelian)' : "connections don't commute (non-abelian)", w * 0.92, 24)
      ctx.textAlign = 'left'

      ctx.fillStyle = 'rgba(85,96,111,0.85)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(spec.note, w * 0.08, h - 26)
      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.fillText('a wave is a section, a force is a connection — the covariant operator does the rest', w * 0.08, h - 10)
    },
  }
}

export function WhichForce() {
  const [force, setForce] = useState<Force>('em')
  const forceRef = useRef<Force>(force)
  forceRef.current = force
  return (
    // key={force}: switching rebuilds the stepper (fresh phase per force —
    // AGENTS.md create = fresh state, no mutated hybrid)
    <Sim key={force} height={280} create={() => createWhichForce(forceRef)}>
      <div className="sim-seg" style={{ marginLeft: 0 }}>
        {FORCE_ORDER.map((f) => (
          <button
            key={f}
            type="button"
            className={force === f ? 'seg-active' : ''}
            onClick={() => setForce(f)}
          >
            {FORCE_LABEL[f]}
          </button>
        ))}
      </div>
    </Sim>
  )
}
