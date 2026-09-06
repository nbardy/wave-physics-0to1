import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame } from '../lib/chrome'

// PLAN figs 12–13 — Mercury grades them.
//
// Three lanes, one integrator, one difference: a Newtonian orbit (gray),
// the 1913 draft's correction (red), and the November 1915 correction
// (green), integrated side by side with velocity Verlet at a fixed
// timestep (stability note beside FIXED_DT below). The confession, stated
// in prose where this figure lands: strengths and time are rescaled so the
// fan opens visibly — the history (18″ vs 43″) supplies the scale, the
// simulation supplies the ratio, which is the same 18/43 = 0.42 by
// construction of the two strengths and by measurement of the two fans.
// Perihelion passages are DETECTED (radial-velocity sign change), never
// pasted: the ticks and the ratio meter come from the integrated states.
//
// One knob: eccentricity — precession steepens with e while the ratio
// holds, so the knob changes something the claim depends on.

export const GM = 1
export const SEMI_MAJOR = 1.5
// Full-law strength: opens the fan ~2°/orbit at e = 0.25. Rescaled for
// visibility (the true relativistic correction would need ~10⁸ visually
// identical orbits to open this far); the draft/full ratio is the claim.
export const EPS_FULL = 0.0026
// The draft's measured fraction of the observed anomaly: 18/43 (RESEARCH.md
// §4 — Einstein–Besso manuscript vs. Nov 18, 1915). Draft strength is set by
// this historical ratio; the figure then MEASURES whether the integrated
// orbits honor it.
export const DRAFT_FRACTION = 18 / 43
// Fixed physics timestep, decoupled from frame rate. Velocity Verlet is
// symplectic (no secular energy drift); at this dt the Newtonian lane's
// spurious pericenter drift is <1% of the full-law signal (guarded by the
// headless check), so the fans are physics, not integrator artifact.
const FIXED_DT = 0.006
const SUBSTEP_CAP = 40
const TRAIL_EVERY = 8
const TRAIL_MAX = 2600

interface Lane {
  x: number
  y: number
  vx: number
  vy: number
  eps: number
  trail: Array<{ x: number; y: number }>
  tick: number
  rPrev: number
  drPrev: number
  periAngles: number[]
  angleCum: number
  anglePrev: number
}

function laneIC(eps: number, e: number): Lane {
  const rp = SEMI_MAJOR * (1 - e)
  const v = Math.sqrt((GM * (1 + e)) / (SEMI_MAJOR * (1 - e)))
  return {
    x: rp, y: 0, vx: 0, vy: v, eps,
    trail: [{ x: rp, y: 0 }], tick: 0,
    rPrev: rp, drPrev: 0, periAngles: [],
    angleCum: 0, anglePrev: 0,
  }
}

function accel(x: number, y: number, eps: number): [number, number] {
  const r = Math.hypot(x, y)
  // Newtonian 1/r² with the post-Newtonian-style 1/r³ correction beside it:
  // a = -(GM/r²)(1 + 3ε/r)·r̂. ε = 0 is Newton; ε_FULL the 1915 pace.
  const s = (-GM / (r * r)) * (1 + (3 * eps) / r)
  return [(s * x) / r, (s * y) / r]
}

function verletStep(l: Lane) {
  const [ax0, ay0] = accel(l.x, l.y, l.eps)
  l.vx += 0.5 * FIXED_DT * ax0
  l.vy += 0.5 * FIXED_DT * ay0
  l.x += FIXED_DT * l.vx
  l.y += FIXED_DT * l.vy
  const [ax1, ay1] = accel(l.x, l.y, l.eps)
  l.vx += 0.5 * FIXED_DT * ax1
  l.vy += 0.5 * FIXED_DT * ay1
  // heading bookkeeping (unwrapped) for perihelion advance
  const a = Math.atan2(l.y, l.x)
  let d = a - l.anglePrev
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  l.angleCum += d
  l.anglePrev = a
  // perihelion: radial velocity changes − → +
  const r = Math.hypot(l.x, l.y)
  const dr = r - l.rPrev
  if (l.drPrev < 0 && dr >= 0 && l.tick > 200) {
    l.periAngles.push(l.angleCum)
    if (l.periAngles.length > 12) l.periAngles.shift()
  }
  l.rPrev = r
  l.drPrev = dr
  l.tick++
  if (l.tick % TRAIL_EVERY === 0) {
    l.trail.push({ x: l.x, y: l.y })
    if (l.trail.length > TRAIL_MAX) l.trail.shift()
  }
}

/** Mean advance per orbit in radians, from detected perihelia (or 0). */
export function laneAdvance(lane: Pick<Lane, 'periAngles'>): number {
  const p = lane.periAngles
  if (p.length < 2) return 0
  let sum = 0
  for (let i = 1; i < p.length; i++) {
    let d = p[i] - p[i - 1]
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    sum += d
  }
  return sum / (p.length - 1)
}

/**
 * Headless measurement hook (used by scripts/check-grossmann.ts and nothing
 * on screen): integrate all three lanes for `simSeconds` of stepper time at
 * eccentricity `e` and return the measured advance per orbit in radians.
 * The figure's own step() path is not reused here — this is the same state
 * and the same Verlet kernel, driven without a canvas.
 */
export function measureMercuryAdvances(
  e: number,
  simSeconds: number,
): { newton: number; draft: number; full: number } {
  const st = createMercuryState(e)
  const steps = Math.round(simSeconds * 60)
  for (let i = 0; i < steps; i++) {
    let acc = 1 / 60
    let n = 0
    while (acc >= FIXED_DT && n < SUBSTEP_CAP) {
      verletStep(st.newton)
      verletStep(st.draft)
      verletStep(st.full)
      acc -= FIXED_DT
      n++
    }
  }
  return {
    newton: laneAdvance(st.newton),
    draft: laneAdvance(st.draft),
    full: laneAdvance(st.full),
  }
}

export interface MercuryState {
  newton: Lane
  draft: Lane
  full: Lane
  acc: number
}

export function createMercuryState(e: number): MercuryState {
  return {
    newton: laneIC(0, e),
    draft: laneIC(EPS_FULL * DRAFT_FRACTION, e),
    full: laneIC(EPS_FULL, e),
    acc: 0,
  }
}

export function createMercuryGrade(eRef: { current: number }): Stepper {
  let st: MercuryState | null = null
  let lastE = -1
  return {
    step(dt: number) {
      const e = eRef.current
      if (!st || e !== lastE) {
        st = createMercuryState(e)
        lastE = e
      }
      st.acc += Math.min(dt, 0.05)
      let n = 0
      while (st.acc >= FIXED_DT && n < SUBSTEP_CAP) {
        verletStep(st.newton)
        verletStep(st.draft)
        verletStep(st.full)
        st.acc -= FIXED_DT
        n++
      }
    },
    draw(ctx, w, h) {
      const e = eRef.current
      if (!st || e !== lastE) {
        st = createMercuryState(e)
        lastE = e
      }
      ctx.clearRect(0, 0, w, h)
      // Two meter lines at 13px type need ≥18px leading — 14px collided
      // (reader pass 2026-09-03: the lines superimposed).
      const pane = { x: 2, y: 20, w: w - 4, h: h - 66 }
      paneFrame(ctx, pane)
      const half = SEMI_MAJOR * (1 + e) * 1.18
      const px = (x: number) => pane.x + pane.w / 2 + (x / half) * (pane.w / 2)
      const py = (y: number) => pane.y + pane.h / 2 - (y / half) * (pane.h / 2)
      const lanes: Array<{ l: Lane; ink: string; width: number }> = [
        { l: st.newton, ink: 'rgba(107,114,128,0.75)', width: 1 },
        { l: st.draft, ink: PALETTE.entwurf, width: 1.6 },
        { l: st.full, ink: PALETTE.gr1915, width: 1.6 },
      ]
      // sun
      ctx.beginPath()
      ctx.arc(px(0), py(0), 4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.geoCurved
      ctx.fill()
      for (const { l, ink, width } of lanes) {
        ctx.strokeStyle = ink
        ctx.lineWidth = width
        ctx.beginPath()
        l.trail.forEach((p, i) => {
          if (i === 0) ctx.moveTo(px(p.x), py(p.y))
          else ctx.lineTo(px(p.x), py(p.y))
        })
        ctx.stroke()
        // perihelion tick fan: each detected passage gets a tick
        for (const a of l.periAngles) {
          const r0 = SEMI_MAJOR * (1 - e)
          ctx.beginPath()
          ctx.moveTo(px(Math.cos(a) * r0 * 0.92), py(Math.sin(a) * r0 * 0.92))
          ctx.lineTo(px(Math.cos(a) * r0 * 1.08), py(Math.sin(a) * r0 * 1.08))
          ctx.stroke()
        }
      }
      const aN = laneAdvance(st.newton)
      const aD = laneAdvance(st.draft)
      const aF = laneAdvance(st.full)
      const ratio = aF > 0 ? aD / aF : 0
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.gr1915
      ctx.fillText(`1915 law ${fmt((aF * 180) / Math.PI, 2)}°/orbit`, pane.x + 4, h - 40)
      ctx.fillStyle = PALETTE.entwurf
      ctx.fillText(`draft ${fmt((aD * 180) / Math.PI, 2)}°/orbit`, pane.x + 4, h - 20)
      const r = `ratio ${fmt(ratio, 2)} (history 18/43 = ${fmt(DRAFT_FRACTION, 2)})`
      ctx.fillStyle = PALETTE.geoCurv
      ctx.fillText(r, pane.x + pane.w - ctx.measureText(r).width - 4, h - 10)
      void aN
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('three lanes, one integrator — the fans open differently', pane.x + 4, 14)
    },
  }
}

export function MercuryGrade() {
  const [e, setE] = useState(0.25)
  const eRef = useRef(e)
  eRef.current = e

  return (
    <Sim height={340} create={() => createMercuryGrade(eRef)}>
      <label className="sim-slider">
        <span>near-circular</span>
        <input
          type="range"
          min={0.05}
          max={0.4}
          step={0.01}
          value={e}
          onChange={(e_) => setE(Number(e_.target.value))}
        />
        <span>eccentric</span>
      </label>
    </Sim>
  )
}
