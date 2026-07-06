import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// ─────────────────────────────────────────────────────────────────────────────
// HONESTY: This is an ILLUSTRATIVE CARTOON of Lewis Fry Richardson's 1922 energy
// cascade — "Big whorls have little whorls that feed on their velocity, and
// little whorls have lesser whorls and so on to viscosity." It is NOT turbulence
// and NOT a fluid solve. Eddies here are purely kinematic rings of orbiting
// tracer dots; a big parent spawns children at half its radius carrying reduced
// energy, they spawn grandchildren, and the smallest generation dies with a
// green (viscosity) tint. Nothing conserves energy or momentum — it's a moving
// picture of the poem, and the article says so.
// ─────────────────────────────────────────────────────────────────────────────

const GENERATIONS = 4 // parent → children → grandchildren → great-grandchildren
const CHILDREN_PER = 2 // each eddy spawns this many at the next scale
const PARENT_DOTS = 40 // ring size of the top eddy; children carry fewer
const FIXED_DT = 1 / 120 // fixed physics step
const RADIUS_FALLOFF = 0.5 // child radius = parent radius × this
const ENERGY_FALLOFF = 0.62 // child angular speed drops (reduced energy)
const LIFETIME = 5.0 // seconds a leaf (smallest) eddy lives before dying + respawn
const FADE_S = 1.2 // seconds a dying leaf spends fading with the green tint

// Orbits are kinematic: each dot's angle advances by ω·dt with ω fixed per eddy,
// so the motion is unconditionally stable — no CFL-type condition to satisfy.

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
  cx: number // orbit-center offset from PARENT center (as a fraction of parent R)
  cy: number
  r: number // orbit radius (fraction of the canvas min-dimension)
  omega: number // angular speed (rad/s)
  phase0: number // seeded phase offset
  dots: number // number of tracer dots on the ring
  born: number // sim time this eddy was (re)spawned
  isLeaf: boolean
}

function createCascade(speedRef: { current: number }): Stepper {
  const seed = (Math.random() * 2 ** 32) >>> 0 // fresh seed per create() → Reset reseeds
  const rand = mulberry32(seed)

  let t = 0
  let acc = 0

  // Build the whole hierarchy once. Leaves periodically die + respawn on a
  // seeded cycle so the cascade runs continuously with everything alive at once.
  const eddies: Eddy[] = []

  const spawn = (
    gen: number,
    cx: number,
    cy: number,
    r: number,
    omega: number,
    born: number,
  ) => {
    const isLeaf = gen === GENERATIONS - 1
    const dots = Math.max(6, Math.round(PARENT_DOTS * RADIUS_FALLOFF ** gen))
    const e: Eddy = {
      gen,
      cx,
      cy,
      r,
      omega,
      phase0: rand() * Math.PI * 2,
      dots,
      born,
      isLeaf,
    }
    eddies.push(e)
    if (!isLeaf) {
      // spawn children on opposite sides of this eddy's ring
      for (let c = 0; c < CHILDREN_PER; c++) {
        const ang = e.phase0 + (c / CHILDREN_PER) * Math.PI * 2
        const childR = r * RADIUS_FALLOFF
        spawn(
          gen + 1,
          cx + Math.cos(ang) * r * 0.9,
          cy + Math.sin(ang) * r * 0.9,
          childR,
          omega * ENERGY_FALLOFF * (rand() < 0.5 ? 1 : -1), // reduced energy, seeded spin sense
          born,
        )
      }
    }
  }

  spawn(0, 0, 0, 0.34, 0.7, 0)

  const advance = () => {
    t += FIXED_DT
    // respawn dead leaves so the cascade never runs dry
    for (const e of eddies) {
      if (!e.isLeaf) continue
      const age = t - e.born
      if (age > LIFETIME + FADE_S) {
        e.born = t // reincarnate this leaf in place
        e.phase0 = rand() * Math.PI * 2
      }
    }
  }

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

      for (const e of eddies) {
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
          const ang = e.phase0 + (d / e.dots) * Math.PI * 2 + e.omega * t
          const px = ox + Math.cos(ang) * rr
          const py = oy + Math.sin(ang) * rr
          ctx.beginPath()
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
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
