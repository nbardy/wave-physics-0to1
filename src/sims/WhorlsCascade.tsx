import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// ─────────────────────────────────────────────────────────────────────────────
// HONESTY: This is an ILLUSTRATIVE CARTOON of Lewis Fry Richardson's 1922 energy
// cascade — "Big whorls have little whorls that feed on their velocity, and
// little whorls have lesser whorls and so on to viscosity." It is NOT turbulence
// and NOT a fluid solve. Eddies here are purely kinematic rings of orbiting
// tracer dots; nothing conserves energy or momentum — it's a moving picture of
// the poem, and the article says so.
//
// What the cartoon does take literally, because the poem does:
//  · CARRIED. A child eddy's centre is not a fixed point. It sits ON its parent's
//    ring and is swept around it at the parent's angular rate, every step:
//      centre_child = centre_parent + RIDE · r_parent · (cos θ, sin θ),
//      θ̇ = ω_parent            (the rate of the parent parcel it rides on)
//    so the whole sub-tree of a big whorl travels with the big whorl.
//  · FED ON ITS VELOCITY. A child's spin is derived from its parent's
//    instantaneous ring speed, not from an independent constant:
//      v_child = SPEED_FALLOFF · v_parent,   ω_child = v_child / r_child
//    Because r halves each generation, ω grows down the cascade (small eddies
//    turn over faster) while the ring SPEED decays — energy thinning out on the
//    way down, which is the line the poem is making.
// ─────────────────────────────────────────────────────────────────────────────

const GENERATIONS = 4 // parent → children → grandchildren → great-grandchildren
const CHILDREN_PER = 2 // each eddy spawns this many at the next scale
const PARENT_DOTS = 40 // ring size of the top eddy; children carry fewer
const FIXED_DT = 1 / 120 // fixed physics step
const ROOT_R = 0.27 // top eddy radius as a fraction of min(w,h)
const ROOT_OMEGA = 0.7 // top eddy angular rate (rad/s)
const RADIUS_FALLOFF = 0.5 // child radius = parent radius × this
const SPEED_FALLOFF = 0.62 // child RING SPEED = parent ring speed × this
const RIDE = 0.9 // a child sits at this fraction of its parent's radius
const LIFETIME = 5.0 // seconds a leaf (smallest) eddy lives before dying + respawn
const FADE_S = 1.2 // seconds a dying leaf spends fading with the green tint

// Orbits are kinematic: every angle advances by ω·dt with ω fixed per eddy, and the
// centres are resolved by composing those angles down the tree. No state feeds back
// into ω, so the motion is unconditionally stable — no CFL-type condition to satisfy.

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Eddy {
  gen: number // 0 = parent … GENERATIONS-1 = leaf
  children: Eddy[] // empty for a leaf
  rideAngle: number // where this eddy sits on its parent's ring (rad)
  rideOmega: number // rate that angle advances at = the PARENT's ω (0 for the root)
  r: number // own orbit radius (fraction of the canvas min-dimension)
  omega: number // own angular speed (rad/s, signed)
  phase: number // rotation phase of this eddy's own dot ring
  dots: number // number of tracer dots on the ring
  born: number // sim time this eddy was (re)spawned
  isLeaf: boolean
  cx: number // resolved centre, recomputed every step (fraction of min-dimension)
  cy: number
}

function createCascade(speedRef: { current: number }): Stepper {
  const seed = (Math.random() * 2 ** 32) >>> 0 // fresh seed per create() → Reset reseeds
  const rand = mulberry32(seed)

  let t = 0
  let acc = 0

  const all: Eddy[] = [] // flat list for stepping/drawing; `root` owns the tree shape

  const spawn = (gen: number, r: number, omega: number, rideOmega: number): Eddy => {
    const isLeaf = gen === GENERATIONS - 1
    const e: Eddy = {
      gen,
      children: [],
      rideAngle: rand() * Math.PI * 2,
      rideOmega,
      r,
      omega,
      phase: rand() * Math.PI * 2,
      dots: Math.max(6, Math.round(PARENT_DOTS * RADIUS_FALLOFF ** gen)),
      born: 0,
      isLeaf,
      cx: 0,
      cy: 0,
    }
    all.push(e)
    // recursion depth bound: the leaf generation spawns nothing, so this terminates
    if (isLeaf) return e
    // children ride this eddy's ring, so their spin comes from ITS ring speed
    const ringSpeed = Math.abs(omega) * r
    const childR = r * RADIUS_FALLOFF
    const childOmegaMag = (SPEED_FALLOFF * ringSpeed) / childR
    for (let c = 0; c < CHILDREN_PER; c++) {
      const child = spawn(gen + 1, childR, childOmegaMag * (rand() < 0.5 ? 1 : -1), omega)
      // spread the siblings around the parent ring, then let it carry them
      child.rideAngle = e.rideAngle + (c / CHILDREN_PER) * Math.PI * 2
      e.children.push(child)
    }
    return e
  }

  const root = spawn(0, ROOT_R, ROOT_OMEGA, 0)

  // Resolve every centre from the root outward: a child's centre is a point ON the
  // parent's ring, at the angle the parent has carried it to.
  const resolve = (e: Eddy, cx: number, cy: number) => {
    e.cx = cx
    e.cy = cy
    for (const c of e.children) {
      resolve(
        c,
        cx + Math.cos(c.rideAngle) * e.r * RIDE,
        cy + Math.sin(c.rideAngle) * e.r * RIDE,
      )
    }
  }

  const advance = () => {
    t += FIXED_DT
    for (const e of all) {
      e.phase += e.omega * FIXED_DT // this eddy's own dots go round
      e.rideAngle += e.rideOmega * FIXED_DT // …while the parent carries the whole eddy
      // respawn dead leaves so the cascade never runs dry
      if (e.isLeaf && t - e.born > LIFETIME + FADE_S) {
        e.born = t
        e.phase = rand() * Math.PI * 2
      }
    }
    resolve(root, 0, 0)
  }

  resolve(root, 0, 0) // centres are valid before the first step

  return {
    step(dt) {
      const speed = speedRef.current
      acc += dt * speed
      let guard = 0
      while (acc >= FIXED_DT && guard < 12) {
        advance()
        acc -= FIXED_DT
        guard++
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const cxPx = w * 0.5
      const cyPx = h * 0.5
      const scale = Math.min(w, h)

      for (const e of all) {
        const ox = cxPx + e.cx * scale
        const oy = cyPx + e.cy * scale
        const rr = e.r * scale

        // leaf fade: last FADE_S of life the dots fade out with a green tint
        let alpha = 1
        let greenMix = 0
        if (e.isLeaf) {
          const age = t - e.born
          if (age > LIFETIME) {
            const f = Math.min(1, (age - LIFETIME) / FADE_S)
            alpha = 1 - f
            greenMix = f // viscosity eating the little whorl
          }
        }
        if (alpha <= 0.02) continue

        const color = greenMix > 0 ? PALETTE.visc : PALETTE.dye
        ctx.fillStyle = color
        ctx.globalAlpha = alpha * (e.gen === 0 ? 0.9 : 0.75)
        const dotR = Math.max(1.2, 3.2 * RADIUS_FALLOFF ** e.gen)
        for (let d = 0; d < e.dots; d++) {
          const ang = e.phase + (d / e.dots) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(ox + Math.cos(ang) * rr, oy + Math.sin(ang) * rr, dotR, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    },
  }
}

export function WhorlsCascade({ height = 300 }: { height?: number }) {
  // ONE knob: time-speed (the house default knob).
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed

  return (
    <Sim height={height} create={() => createCascade(speedRef)}>
      <label className="sim-slider">
        <span>slow</span>
        <input
          type="range"
          min={0.15}
          max={2.5}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>fast</span>
      </label>
    </Sim>
  )
}
