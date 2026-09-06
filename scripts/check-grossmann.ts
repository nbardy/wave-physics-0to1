/**
 * Renders every physics-02 (Einstein–Grossmann) figure headlessly and asserts
 * the specific thing each one has to show. Run with `bun run check:grossmann`.
 *
 * Same contract as scripts/check-physics-figures.ts: sample each quantity's
 * OWN colour (never "any ink"), and exercise every knob to both ends.
 * Renders land in `_figure_check/grossmann/` (gitignored).
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import {
  createStraightLines,
  geodesicEndSeparation,
  K_MAX,
  SHEET_LEN,
  SHEET_SEP,
} from '../src/sims/physics/StraightLines'
import { createLoopMeter, LOOP_A_MAX, LOOP_K, loopRotation } from '../src/sims/physics/LoopMeter'
import {
  createCovarianceMachine,
  draftReading,
  fullReading,
} from '../src/sims/physics/CovarianceMachine'
import { createFallTest } from '../src/sims/physics/FallTest'
import {
  createMercuryGrade,
  DRAFT_FRACTION,
  measureMercuryAdvances,
} from '../src/sims/physics/MercuryGrade'
import { PALETTE } from '../src/sims/lib/palette'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check', 'grossmann')
mkdirSync(OUT, { recursive: true })

const W = 640
let failures = 0

function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

function ink(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

interface Shot {
  isInk(x: number, y: number, hex: string, tol?: number): boolean
  centroid(
    x0: number, y0: number, x1: number, y1: number, hex: string, tol?: number,
  ): { x: number; y: number } | null
}

function render(name: string, h: number, make: () => Stepper, seconds = 0, w = W): Shot {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const stepper = make()
  for (let i = 0; i < Math.round(seconds * 60); i++) stepper.step(1 / 60)
  stepper.draw(ctx as unknown as CanvasRenderingContext2D, w, h)
  writeFileSync(join(OUT, `${name}.png`), canvas.toBuffer('image/png'))
  const data = ctx.getImageData(0, 0, w, h).data
  const at = (x: number, y: number) => (Math.round(y) * w + Math.round(x)) * 4
  return {
    isInk(x, y, hex, tol = 46) {
      const i = at(x, y)
      if (data[i + 3] < 150) return false
      const [r, g, b] = ink(hex)
      return (
        Math.abs(data[i] - r) <= tol && Math.abs(data[i + 1] - g) <= tol && Math.abs(data[i + 2] - b) <= tol
      )
    },
    centroid(x0, y0, x1, y1, hex, tol) {
      let sx = 0
      let sy = 0
      let n = 0
      for (let x = Math.ceil(x0); x < x1; x++)
        for (let y = Math.ceil(y0); y < y1; y++)
          if (this.isInk(x, y, hex, tol)) {
            sx += x
            sy += y
            n++
          }
      return n === 0 ? null : { x: sx / n, y: sy / n }
    },
  }
}

/** Vertical extent (px) of one ink at a column — the drawn curve separation. */
function extentAt(shot: Shot, x: number, y0: number, y1: number, hex: string): number {
  let lo = -1
  let hi = -1
  for (let y = Math.ceil(y0); y < y1; y++) {
    if (shot.isInk(x, y, hex, 40)) {
      if (lo < 0) lo = y
      hi = y
    }
  }
  return lo < 0 ? 0 : hi - lo + 1
}

// ---------------------------------------------------------------------------
// 1 · StraightLines — flat pair stays apart at every K; curved pair meets.
// ---------------------------------------------------------------------------
{
  const H = 300
  const k = { current: 0 }
  const paneH = (H - 24 - 10) / 2
  // Near the right end but still on the drawn curves (they run x = 10..622).
  const colX = W - 24
  const flatExtent = (kk: number) => {
    k.current = kk
    const shot = render(`01-straight-K${kk.toFixed(4)}`, H, () => createStraightLines(k))
    return extentAt(shot, colX, 20, 20 + paneH, PALETTE.geoFlat)
  }
  const curvedExtent = (kk: number) => {
    k.current = kk
    const shot = render(`01-curved-K${kk.toFixed(4)}`, H, () => createStraightLines(k))
    return extentAt(shot, colX, 20 + paneH + 10, 20 + 2 * paneH + 10, PALETTE.geoCurved)
  }
  const f0 = flatExtent(0)
  const fMax = flatExtent(K_MAX)
  const c0 = curvedExtent(0)
  const cMax = curvedExtent(K_MAX)
  ok(
    Math.abs(fMax - f0) <= 3,
    'hero · the flat pair stays apart at every curvature',
    `${f0}px at K=0 vs ${fMax}px at K=max`,
  )
  ok(
    cMax < 0.7 * c0,
    'hero · the curved pair meets as curvature rises',
    `${c0}px at K=0 vs ${cMax}px at K=max`,
  )
  const want = geodesicEndSeparation(SHEET_SEP, SHEET_LEN, K_MAX) / SHEET_SEP
  ok(
    Math.abs(cMax / Math.max(c0, 1) - want) < 0.2,
    'hero · the meeting follows cos(L·√K)',
    `measured fraction ${(cMax / Math.max(c0, 1)).toFixed(2)} vs ${want.toFixed(2)}`,
  )
}

// ---------------------------------------------------------------------------
// 2 · LoopMeter — the returning arrow rotates with loop area; triangle agrees.
// ---------------------------------------------------------------------------
{
  const H = 280
  const a = { current: 0 }
  const paneW = (W - 4 - 14) / 2
  const violetX = (aa: number) => {
    a.current = aa
    const shot = render(`02-loop-A${aa.toFixed(1)}`, H, () => createLoopMeter(a))
    const c = shot.centroid(2, 20, 2 + paneW, H - 24, PALETTE.geoCurv, 40)
    return c ? c.x : -1
  }
  const wedgeViolet = (aa: number) => {
    a.current = aa
    const shot = render(`02-wedge-A${aa.toFixed(1)}`, H, () => createLoopMeter(a))
    // All violet in the right pane: corner wedges plus the (constant) meter
    // text. The wedges gain rot/3 of extra sweep per corner as the knob
    // turns, so the count must grow well beyond text noise.
    const rx = 2 + paneW + 14
    let n = 0
    for (let x = Math.ceil(rx); x < rx + paneW; x++)
      for (let y = 20; y < H - 24; y++) if (shot.isInk(x, y, PALETTE.geoCurv, 40)) n++
    return n
  }
  const x0 = violetX(0)
  const xMax = violetX(LOOP_A_MAX)
  ok(x0 > 0 && xMax > 0, 'loop · the violet arrow is drawn at both ends', `x=${x0} → ${xMax}`)
  ok(
    xMax - x0 > 8,
    'loop · a larger loop returns the arrow further rotated',
    `centroid shifts ${(xMax - x0).toFixed(1)}px`,
  )
  ok(
    Math.abs(loopRotation(LOOP_K, LOOP_A_MAX) - LOOP_K * LOOP_A_MAX) < 1e-12 &&
      loopRotation(LOOP_K, 0) === 0,
    'loop · rotation is K·A with zero intercept',
    `max ${(loopRotation(LOOP_K, LOOP_A_MAX) * 180 / Math.PI).toFixed(1)}°`,
  )
  const w0 = wedgeViolet(0)
  const wMax = wedgeViolet(LOOP_A_MAX)
  // Each of the three wedges gains rot/3 of sweep at radius 20, so the
  // predicted extra ink is 3·½·20²·(rot/3) = ½·400·rot = 200px at Amax.
  const wantSpill = 0.5 * 20 * 20 * loopRotation(LOOP_K, LOOP_A_MAX)
  ok(
    Math.abs(wMax - w0 - wantSpill) < 100,
    'loop · the triangle wedges spill by the predicted area',
    `violet ${w0}px → ${wMax}px (want +${wantSpill.toFixed(0)}px)`,
  )
}

// ---------------------------------------------------------------------------
// 3 · CovarianceMachine — the draft bar slides with the grid; 1915 sits still.
// ---------------------------------------------------------------------------
{
  const H = 280
  const theta = { current: 0 }
  const paneW = (W - 4 - 14) / 2
  const right = { x: 2 + paneW + 14 }
  const redH = (t: number) => {
    theta.current = t
    const shot = render(`03-cov-${(t * 180 / Math.PI).toFixed(0)}deg`, H, () =>
      createCovarianceMachine(theta),
    )
    return extentAt(shot, right.x + 14 + 26, 20, H - 24, PALETTE.entwurf)
  }
  const greenH = (t: number) => {
    theta.current = t
    const shot = render(`03-cov-green-${(t * 180 / Math.PI).toFixed(0)}deg`, H, () =>
      createCovarianceMachine(theta),
    )
    return extentAt(shot, right.x + 14 + 52 + 8 + 26, 20, H - 24, PALETTE.gr1915)
  }
  const r0 = redH(0)
  const r90 = redH(Math.PI / 2)
  const g0 = greenH(0)
  const g90 = greenH(Math.PI / 2)
  ok(r0 > 40, 'covariance · the draft answers fully on its home grid', `${r0}px tall`)
  ok(r90 < 0.15 * r0, 'covariance · rotated 90° the draft answer dies', `${r90}px vs ${r0}px`)
  ok(
    Math.abs(g90 - g0) <= 3 && g0 > 40,
    'covariance · the 1915 answer sits still under rotation',
    `${g0}px → ${g90}px`,
  )
  ok(
    Math.abs(draftReading(0) - fullReading()) < 1e-12,
    'covariance · both laws agree on the home grid',
    `draft ${draftReading(0).toFixed(2)} = full ${fullReading().toFixed(2)}`,
  )
}

// ---------------------------------------------------------------------------
// 4 · MercuryGrade — Newton closes, the draft trails at 18/43 of the 1915 fan.
// ---------------------------------------------------------------------------
{
  // Numeric truth first: integrate headlessly and read the detected fans.
  // 420 stepper-seconds ≈ 34 orbits at e = 0.25 — plenty for the mean.
  const m = measureMercuryAdvances(0.25, 420)
  const deg = (r: number) => (r * 180) / Math.PI
  ok(
    deg(m.full) > 0.5 && deg(m.full) < 4,
    'mercury · the 1915 lane opens a visible fan',
    `${deg(m.full).toFixed(2)}°/orbit`,
  )
  ok(
    Math.abs(m.newton) < 0.05 * m.full,
    'mercury · the Newtonian lane closes (integrator honesty)',
    `${deg(m.newton).toFixed(3)}°/orbit vs ${deg(m.full).toFixed(2)}° signal`,
  )
  const ratio = m.draft / m.full
  ok(
    Math.abs(ratio - DRAFT_FRACTION) < 0.05,
    'mercury · the draft trails at 18/43 of the 1915 fan',
    `measured ${ratio.toFixed(3)} vs history ${DRAFT_FRACTION.toFixed(3)}`,
  )
  // The eccentricity knob to both ends: the fan steepens, the ratio holds.
  for (const ee of [0.05, 0.4]) {
    const me = measureMercuryAdvances(ee, 420)
    ok(
      Math.abs(me.draft / me.full - DRAFT_FRACTION) < 0.08,
      `mercury · ratio holds at e = ${ee.toFixed(2)}`,
      `measured ${(me.draft / me.full).toFixed(3)}; 1915 fan ${deg(me.full).toFixed(2)}°/orbit`,
    )
  }
  // Pixels: all three lanes actually painted, in their own inks.
  const e = { current: 0.25 }
  const canvas = createCanvas(W, 340)
  const ctx = canvas.getContext('2d')
  const stepper = createMercuryGrade(e)
  for (let i = 0; i < Math.round(420 * 60); i++) stepper.step(1 / 60)
  stepper.draw(ctx as unknown as CanvasRenderingContext2D, W, 340)
  writeFileSync(join(OUT, '04-mercury.png'), canvas.toBuffer('image/png'))
  const data = ctx.getImageData(0, 0, W, 340).data
  const countInk = (hex: string, tol = 46) => {
    const [r, g, b] = ink(hex)
    let n = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 150) continue
      if (Math.abs(data[i] - r) <= tol && Math.abs(data[i + 1] - g) <= tol && Math.abs(data[i + 2] - b) <= tol)
        n++
    }
    return n
  }
  const nRed = countInk(PALETTE.entwurf)
  const nGreen = countInk(PALETTE.gr1915)
  ok(nRed > 500 && nGreen > 500, 'mercury · draft and 1915 lanes both paint', `red ${nRed}px, green ${nGreen}px`)
}

// ---------------------------------------------------------------------------
// 5 · FallTest — all three balls fall together at every drop height.
// ---------------------------------------------------------------------------
{
  const H = 280
  const h = { current: 5 }
  const fallLevel = (hh: number) => {
    h.current = hh
    // mid-fall: 0.25 s after release (off the line at every height;
    // at h = 1 a later sample would catch both balls clamped to the floor,
    // which would prove nothing)
    const shot = render(`05-fall-h${hh.toFixed(1)}`, H, () => createFallTest(h), 0.25)
    const paneW = W - 4
    const box = (f: number) => {
      const cx = 2 + f * paneW
      return { x0: cx - 14, x1: cx + 14 }
    }
    const red = box(0.5)
    const green = box(0.7)
    const cR = shot.centroid(red.x0, 20, red.x1, H - 28, PALETTE.entwurf, 40)
    const cG = shot.centroid(green.x0, 20, green.x1, H - 28, PALETTE.gr1915, 40)
    return { cR, cG }
  }
  for (const hh of [1, 10]) {
    const { cR, cG } = fallLevel(hh)
    ok(cR !== null && cG !== null, `fall · all three balls are drawn (h = ${hh})`, 'red + green ink found')
    if (cR && cG) {
      ok(
        Math.abs(cR.y - cG.y) <= 3,
        `fall · draft and 1915 land together (h = ${hh})`,
        `levels differ by ${Math.abs(cR.y - cG.y).toFixed(1)}px`,
      )
    }
  }
}

// ---------------------------------------------------------------------------
// 6 · Mobile widths — every figure still teaches at 380px. Layouts are all
// relative to w by construction; this guards a future edit pinning a
// pixel constant (a pane edge, a bar centre, a meter column) that strands
// a quantity off-canvas on a phone.
// ---------------------------------------------------------------------------
{
  const MW = 380
  // hero: curved pair still meets at max curvature
  const k = { current: K_MAX }
  const hero = render('06-m-hero', 300, () => createStraightLines(k), 0, MW)
  const paneH = (300 - 24 - 10) / 2
  const mTop = extentAt(hero, MW - 24, 20, 20 + paneH, PALETTE.geoFlat)
  const mBot = extentAt(hero, MW - 24, 20 + paneH + 10, 20 + 2 * paneH + 10, PALETTE.geoCurved)
  ok(mTop > 10 && mBot > 0 && mBot < mTop, 'mobile · hero still meets at 380px', `flat ${mTop}px vs curved ${mBot}px`)
  // loop: violet arrow drawn
  const a = { current: LOOP_A_MAX }
  const loop = render('06-m-loop', 280, () => createLoopMeter(a), 0, MW)
  const paneW = (MW - 4 - 14) / 2
  const c = loop.centroid(2, 20, 2 + paneW, 280 - 24, PALETTE.geoCurv, 40)
  ok(c !== null, 'mobile · loop arrow drawn at 380px', c ? `x=${c.x.toFixed(0)}` : 'absent')
  // covariance: draft bar tall on its home grid
  const theta = { current: 0 }
  const cov = render('06-m-cov', 280, () => createCovarianceMachine(theta), 0, MW)
  const rpw = (MW - 4 - 14) / 2
  const barH = extentAt(cov, 2 + rpw + 14 + 14 + 26, 20, 280 - 24, PALETTE.entwurf)
  ok(barH > 30, 'mobile · draft bar stands at 380px', `${barH}px tall`)
  // mercury: both lanes paint
  const e = { current: 0.25 }
  const merc = render('06-m-mercury', 340, () => createMercuryGrade(e), 120, MW)
  const red = merc.centroid(2, 20, MW - 2, 340 - 44, PALETTE.entwurf, 46)
  const green = merc.centroid(2, 20, MW - 2, 340 - 44, PALETTE.gr1915, 46)
  ok(red !== null && green !== null, 'mobile · both mercury lanes paint at 380px', 'red + green found')
  // fall: all three balls drawn, together
  const h = { current: 5 }
  const fall = render('06-m-fall', 280, () => createFallTest(h), 0.25, MW)
  const cc = (f: number, hex: string) => {
    const cx = 2 + f * (MW - 4)
    return fall.centroid(cx - 14, 20, cx + 14, 280 - 28, hex, 40)
  }
  const cR = cc(0.5, PALETTE.entwurf)
  const cG = cc(0.7, PALETTE.gr1915)
  ok(
    cR !== null && cG !== null && Math.abs(cR.y - cG.y) <= 3,
    'mobile · fall test holds at 380px',
    cR && cG ? `levels differ by ${Math.abs(cR.y - cG.y).toFixed(1)}px` : 'ink absent',
  )
}

console.log(failures === 0 ? '\nall grossmann checks passed' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
