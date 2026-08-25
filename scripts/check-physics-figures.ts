/**
 * Renders every physics-01 figure headlessly and asserts the specific thing each
 * one has to show. Run with `bun run check:figures`.
 *
 * This exists because of the rule in AGENTS.md: a figure is verified by what it
 * teaches, not by whether it painted. Counting non-transparent pixels is
 * worthless — a background wash makes an empty pane read as fully painted. So
 * every check below samples for a named quantity (a bar's height, the width of
 * a lit patch, a fringe's contrast, a marker's position) and exercises each knob
 * to both ends.
 *
 * Renders land in `_figure_check/` (gitignored) so a failure can be looked at.
 */

import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Stepper } from '../src/components/Sim'
import { createBenchSetup, SETUP } from '../src/sims/physics/BenchSetup'
import { createPhotonRain } from '../src/sims/physics/PhotonRain'
import { createSlitSpread } from '../src/sims/physics/SlitSpread'
import { createPhasorSum } from '../src/sims/physics/PhasorSum'
import { createPhotoelectric } from '../src/sims/physics/Photoelectric'
import { createWhichPath } from '../src/sims/physics/WhichPath'
import { createRuler, MOVERS } from '../src/sims/physics/DeBroglieRuler'
import { BENCH, fringeSpacing } from '../src/sims/physics/optics'
import { PALETTE } from '../src/sims/lib/palette'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '_figure_check')
mkdirSync(OUT, { recursive: true })

const W = 640
let failures = 0

function ok(pass: boolean, label: string, detail: string) {
  if (!pass) failures++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${label}: ${detail}`)
}

/** A palette hex as [r,g,b], for matching one quantity's ink and no other. */
function ink(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

interface Shot {
  /** alpha at a css pixel */
  alpha(x: number, y: number): number
  /** first y in [y0,y1) at column x whose alpha exceeds `thr` */
  inkTop(x: number, y0: number, y1: number, thr?: number): number
  rgba(x: number, y: number): [number, number, number, number]
  /** does this pixel carry (roughly) the given quantity's colour? */
  isInk(x: number, y: number, hex: string, tol?: number): boolean
  /** first y in [y0,y1) at column x painted in the given quantity's colour */
  inkTopOf(x: number, y0: number, y1: number, hex: string, tol?: number): number
  /** centroid of one quantity's pixels inside a box, or null if it has none */
  centroid(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    hex: string,
    tol?: number,
  ): { x: number; y: number } | null
}

function render(name: string, h: number, make: () => Stepper, seconds = 0): Shot {
  const canvas = createCanvas(W, h)
  const ctx = canvas.getContext('2d')
  const stepper = make()
  // fixed timestep, exactly as the <Sim> shell drives it
  for (let i = 0; i < Math.round(seconds * 60); i++) stepper.step(1 / 60)
  stepper.draw(ctx as unknown as CanvasRenderingContext2D, W, h)
  writeFileSync(join(OUT, `${name}.png`), canvas.toBuffer('image/png'))
  const data = ctx.getImageData(0, 0, W, h).data
  const at = (x: number, y: number) => (Math.round(y) * W + Math.round(x)) * 4
  return {
    alpha: (x, y) => data[at(x, y) + 3],
    rgba: (x, y) => {
      const i = at(x, y)
      return [data[i], data[i + 1], data[i + 2], data[i + 3]]
    },
    inkTop(x, y0, y1, thr = 12) {
      for (let y = Math.ceil(y0); y < y1; y++) if (data[at(x, y) + 3] > thr) return y
      return y1
    },
    isInk(x, y, hex, tol = 46) {
      const i = at(x, y)
      if (data[i + 3] < 150) return false
      const [r, g, b] = ink(hex)
      return (
        Math.abs(data[i] - r) <= tol && Math.abs(data[i + 1] - g) <= tol && Math.abs(data[i + 2] - b) <= tol
      )
    },
    inkTopOf(x, y0, y1, hex, tol) {
      for (let y = Math.ceil(y0); y < y1; y++) if (this.isInk(x, y, hex, tol)) return y
      return y1
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

// ---------------------------------------------------------------------------
// 0 · BenchSetup — the loupe must resolve the slit pair at its true geometry
// (two openings, a wide, centres d apart, drawn at ONE scale so the 1:5 ratio
// is real), and the screen must carry a pattern fringed at λL/d. Both are
// measured off the pixels against the same BENCH constants the figure imports.
// ---------------------------------------------------------------------------
{
  const shot = render('00-bench-setup', 320, () => createBenchSetup())
  const ix = Math.round(SETUP.cardX * W + SETUP.loupeBarDx)

  // openings = runs of no-wall-ink along the loupe card's centre column
  const runs: Array<{ top: number; bot: number }> = []
  for (let y = SETUP.loupeTop + 2; y < SETUP.loupeBot - 2; y++) {
    if (shot.isInk(ix, y, PALETTE.wall)) continue
    const last = runs[runs.length - 1]
    if (last && last.bot === y - 1) last.bot = y
    else runs.push({ top: y, bot: y })
  }
  ok(runs.length === 2, 'bench · the loupe resolves exactly two slits', `${runs.length} opening(s)`)
  if (runs.length === 2) {
    const aWant = BENCH.a * 1000 * SETUP.loupePxPerMm
    const dWant = BENCH.d * 1000 * SETUP.loupePxPerMm
    const aMeas = (runs[0].bot - runs[0].top + runs[1].bot - runs[1].top) / 2 + 1
    const dMeas = (runs[1].top + runs[1].bot) / 2 - (runs[0].top + runs[0].bot) / 2
    ok(
      Math.abs(aMeas - aWant) <= 2,
      'bench · slit width a at the loupe scale',
      `${aMeas.toFixed(1)} px vs ${aWant.toFixed(1)} px for 0.04 mm`,
    )
    ok(
      Math.abs(dMeas - dWant) <= 2,
      'bench · separation d at the same scale (so the drawn ratio is the true 1:5)',
      `${dMeas.toFixed(1)} px vs ${dWant.toFixed(1)} px for 0.20 mm`,
    )
  }

  // the pattern on the screen: leftmost violet stroke pixel per row. The
  // profile's own face line adds ~2 px at every row, so "dark" is small, not 0.
  const face = SETUP.screenX * W - 3
  const extent = (py: number) => {
    for (let x = Math.round(face - 34); x < face; x++)
      if (shot.isInk(x, py, PALETTE.pdf)) return face - x
    return 0
  }
  const fringePx = fringeSpacing(BENCH) * 1000 * SETUP.pxPerMm
  const peak0 = extent(SETUP.axisY)
  const dark = extent(Math.round(SETUP.axisY - fringePx / 2))
  const peak1 = extent(Math.round(SETUP.axisY - fringePx))
  ok(peak0 > 24, 'bench · the pattern peaks on axis', `${peak0} px tall`)
  ok(dark < 6, 'bench · dark half a fringe off axis', `${dark} px (want < 6)`)
  ok(peak1 > 18, 'bench · next bright bar one fringe, λL/d, away', `${peak1} px at ${fringePx.toFixed(1)} px`)

  const lampTip = Math.round(SETUP.lampX * W + 22)
  ok(shot.isInk(lampTip, SETUP.axisY, PALETTE.hit), 'bench · the lamp aperture wears the photon ink', 'amber at the aperture')
}

// ---------------------------------------------------------------------------
// 1 · PhotonRain — with two slits open the marked column is starved; with one
// slit open the same column is nearly the brightest place on the screen.
// ---------------------------------------------------------------------------
{
  const H = 360
  const rate = { current: 2512 }
  const shot = render('01-photon-rain', H, () => createPhotonRain(rate), 90)
  const padX = 10
  const plotW = W - 2 * padX
  const toPxX = (x: number) => padX + ((x + 0.03) / 0.06) * plotW
  const stationH = (H - 8) / 2
  const bandH = stationH * 0.46
  const histH = stationH * 0.36
  const paneOf = (s: number) => {
    const bandTop = 4 + s * stationH + 16
    const base = bandTop + bandH + histH + 6
    return { base, top: base - histH }
  }
  // 2 px off the marker so the dashed red line itself is not what we measure
  const DARK = fringeSpacing(BENCH) / 2 + 0.0004
  const colH = (s: number, x: number) => {
    const p = paneOf(s)
    return p.base - shot.inkTop(toPxX(x), p.top, p.base)
  }
  const topDark = colH(0, DARK)
  const topMid = colH(0, 0)
  const botDark = colH(1, DARK)
  const botMid = colH(1, 0)
  ok(
    topDark < 0.15 * topMid,
    'hero · two slits starve the marked column',
    `column is ${(topDark / topMid).toFixed(3)}× the centre (want < 0.15)`,
  )
  ok(
    botDark > 0.8 * botMid,
    'hero · one slit floods the same column',
    `column is ${(botDark / botMid).toFixed(3)}× the centre (want > 0.8)`,
  )
  ok(
    topDark < botDark,
    'hero · opening the second slit makes that spot dimmer',
    `two slits ${topDark.toFixed(1)} px vs one slit ${botDark.toFixed(1)} px`,
  )
  ok(
    topMid > 3.4 * botMid,
    'hero · the bright bars stand four times the one-slit profile',
    `${(topMid / botMid).toFixed(2)}× (want ≈ 4)`,
  )
}

// ---------------------------------------------------------------------------
// 2 · SlitSpread — the knob must reverse the relationship it starts with:
// narrowing the slit past the crossover makes the lit patch grow.
// ---------------------------------------------------------------------------
{
  const H = 280
  const a = { current: 0 }
  const litWidth = (slit: number) => {
    a.current = slit
    const shot = render(`02-slit-${(slit * 1e3).toFixed(2)}mm`, H, () => createSlitSpread(a))
    const padX = 12
    const plotW = W - 2 * padX
    const base = H - 30
    const top = 26
    // half the pattern's own peak, in the figure's own y scale (ceiling 1.15)
    const halfY = base - (0.5 / 1.15) * (base - top)
    // Match the intensity curve's own blue and nothing else. Measuring "any ink"
    // finds the dashed reference line at I = 1, which spans the whole width and
    // makes every column read as lit — the exact false positive AGENTS names.
    let lo = -1
    let hi = -1
    for (let px = padX; px < padX + plotW; px++) {
      if (shot.inkTopOf(px, top, base, PALETTE.amp) <= halfY) {
        if (lo < 0) lo = px
        hi = px
      }
    }
    return lo < 0 ? 0 : ((hi - lo) / plotW) * 60 // mm
  }
  const wide = litWidth(6e-3)
  const mid = litWidth(0.5e-3)
  const narrow = litWidth(0.05e-3)
  ok(
    Math.abs(wide - 6) < 1.5,
    'slit · a wide slit still throws a slit-shaped patch',
    `6.00 mm slit → ${wide.toFixed(2)} mm lit`,
  )
  ok(
    narrow > 10 * 0.05,
    'slit · a narrow slit throws light far wider than itself',
    `0.05 mm slit → ${narrow.toFixed(2)} mm lit`,
  )
  ok(
    narrow > mid && mid < wide,
    'slit · the knob reverses: past the crossover, narrower means wider',
    `6.00 mm → ${wide.toFixed(1)},  0.50 mm → ${mid.toFixed(1)},  0.05 mm → ${narrow.toFixed(1)} mm`,
  )
}

// ---------------------------------------------------------------------------
// 3 · PhasorSum — the closing arrow must actually close. At the centre it spans
// two amplitude units; half a wavelength of path difference later it is nothing.
// ---------------------------------------------------------------------------
{
  const H = 280
  const x = { current: 0 }
  const paneW = Math.min(200, W * 0.42)
  const R = Math.min(paneW / 4.4, (H - 44) / 2.8)
  const ox = 2 + paneW / 2 - R
  const oy = 20 + (H - 44) / 2
  const armSpan = (at: number) => {
    x.current = at
    const shot = render(`03-phasor-${(at * 1e3).toFixed(2)}mm`, H, () => createPhasorSum(x))
    // Furthest pixel of the CLOSING arrow's own violet, from the arrow origin.
    // Measuring "any ink" reads the grey reference circle, whose radius is fixed
    // by the envelope alone — a knob that looks like it does nothing, and a
    // check that would prove nothing.
    let far = 0
    for (let px = 3; px < paneW; px++) {
      for (let py = 21; py < H - 25; py++) {
        if (shot.isInk(px, py, PALETTE.pdf, 30)) far = Math.max(far, Math.hypot(px - ox, py - oy))
      }
    }
    return far
  }
  const atCentre = armSpan(0)
  const atDark = armSpan(fringeSpacing(BENCH) / 2)
  ok(
    atCentre > 1.7 * R,
    'phasor · at the centre the two arrows point the same way',
    `tip reaches ${(atCentre / R).toFixed(2)} amplitude units (want ≈ 2)`,
  )
  ok(
    atDark < 0.5 * atCentre,
    'phasor · half a wavelength later the sum closes on itself',
    `tip reaches ${(atDark / R).toFixed(2)} units vs ${(atCentre / R).toFixed(2)} at the centre`,
  )
}

// ---------------------------------------------------------------------------
// 4 · Photoelectric — brightness must move one bar and not the other, and below
// the threshold frequency neither bar exists at any brightness.
// ---------------------------------------------------------------------------
{
  const H = 300
  const nu = { current: 9.0e14 }
  const bright = { current: 0.5 }
  const metal: { current: 'cesium' | 'sodium' | 'zinc' | 'platinum' } = { current: 'sodium' }
  const plotW = Math.max(150, W * 0.58)
  const bx = plotW + 14
  const bw = W - plotW - 14 - 2
  const barW = Math.min(46, (bw - 24) / 2)
  const baseY = 20 + (H - 44) - 14
  const topY = 36
  const span = baseY - topY
  const bars = (tag: string) => {
    const shot = render(`04-photoelectric-${tag}`, H, () =>
      createPhotoelectric({ nu, bright, metal }),
    )
    // Match each bar's own colour. Two decoys share these columns: the 22%-alpha
    // track behind every bar, and the dashed grey wave-prediction outline drawn
    // over the energy bar — measuring "any solid pixel" reads the outline and
    // reports the classical prediction as if it were the measurement.
    const h = (cx: number, hex: string) => (baseY - shot.inkTopOf(cx, topY, baseY, hex, 24)) / span
    return {
      count: h(bx + 4 + barW / 2, PALETTE.pdf),
      energy: h(bx + 4 + barW + 16 + barW / 2, PALETTE.ejecta),
    }
  }
  bright.current = 0.08
  const dim = bars('dim')
  bright.current = 1
  const blazing = bars('bright')
  ok(
    blazing.count > 5 * dim.count,
    'photoelectric · brightness controls how many electrons',
    `${(dim.count * 100).toFixed(0)}% → ${(blazing.count * 100).toFixed(0)}% of full scale`,
  )
  ok(
    Math.abs(blazing.energy - dim.energy) < 0.01,
    'photoelectric · brightness does not touch their energy',
    `${(dim.energy * 100).toFixed(1)}% → ${(blazing.energy * 100).toFixed(1)}% of full scale`,
  )
  nu.current = 1.6e15
  const uv = bars('uv')
  ok(
    uv.energy > blazing.energy + 0.15,
    'photoelectric · frequency does control their energy',
    `${(blazing.energy * 100).toFixed(1)}% → ${(uv.energy * 100).toFixed(1)}% of full scale`,
  )
  nu.current = 4.2e14
  metal.current = 'platinum'
  const dead = bars('below-threshold')
  ok(
    dead.count < 0.01 && dead.energy < 0.01,
    'photoelectric · below threshold, full brightness frees nothing',
    `count ${(dead.count * 100).toFixed(1)}%, energy ${(dead.energy * 100).toFixed(1)}%`,
  )
}

// ---------------------------------------------------------------------------
// 5 · WhichPath — the contrast of the drawn pattern must fall from full to flat
// as the knowledge knob is swept, and the marker must ride the quarter circle.
// ---------------------------------------------------------------------------
{
  const H = 280
  const d = { current: 0 }
  const dialW = Math.min(150, W * 0.3)
  const scr = { x: dialW + 14, w: W - dialW - 14 - 2 }
  const base = 20 + (H - 44) - 18
  const contrast = (D: number) => {
    d.current = D
    const shot = render(`05-whichpath-D${D.toFixed(2)}`, H, () => createWhichPath(d))
    let hi = -Infinity
    let lo = Infinity
    // One fringe either side of centre (±3.4 mm of a 6.33 mm period), so the
    // window holds a maximum and a minimum while the diffraction envelope has
    // only drooped 4% across it. Reading a wider window measures the envelope.
    const halfWin = (3.4 / 60) * scr.w
    const mid = scr.x + scr.w / 2
    for (let px = mid - halfWin; px < mid + halfWin; px++) {
      const height = base - shot.inkTopOf(px, 21, base, PALETTE.pdf, 30)
      hi = Math.max(hi, height)
      lo = Math.min(lo, height)
    }
    return (hi - lo) / (hi + lo)
  }
  const full = contrast(0)
  const half = contrast(0.7)
  const none = contrast(1)
  ok(full > 0.9, 'which-path · knowing nothing gives full-contrast fringes', `V = ${full.toFixed(3)}`)
  ok(
    none < 0.1 * full,
    'which-path · knowing exactly erases them',
    `V = ${none.toFixed(3)} vs ${full.toFixed(3)} (residual is the envelope's own droop)`,
  )
  ok(
    full > half && half > none,
    'which-path · the knob is continuous, not a two-position switch',
    `D=0 → ${full.toFixed(2)},  D=0.70 → ${half.toFixed(2)},  D=1 → ${none.toFixed(2)}`,
  )
  // V² + D² = 1 read off the marker's own pixel position
  d.current = 0.6
  const shot = render('05-whichpath-marker', H, () => createWhichPath(d))
  const ox = 2 + 22
  const oy = 20 + (H - 44) - 26
  const R = Math.min(dialW - 44, H - 44 - 48)
  // the marker's centroid, not its outermost pixel — a 4.5 px disc read by its
  // far edge overstates the radius by 4%, which would hide a real 4% drift
  const c = shot.centroid(ox - 8, oy - R - 8, ox + R + 8, oy + 8, PALETTE.hit, 30)
  const rr = c ? Math.hypot(c.x - ox, c.y - oy) / R : 0
  ok(
    Math.abs(rr - 1) < 0.03,
    'which-path · the marker cannot leave the unit circle',
    `|(D,V)| = ${rr.toFixed(3)} of the radius (want 1.000)`,
  )
}

// ---------------------------------------------------------------------------
// 6 · DeBroglieRuler — every specimen must land somewhere different, in the
// right order, and the selection must move the highlighted marker.
// ---------------------------------------------------------------------------
{
  const H = 310
  const sel = { current: MOVERS[0] }
  // The stalk lengths the figure cycles through, so each specimen's dot can be
  // found at its own height rather than anywhere in a band that also holds the
  // amber label text (whose leftmost pixel is not the marker).
  const AXIS_Y = 92
  const markerX = (i: number) => {
    sel.current = MOVERS[i]
    const shot = render(`06-ruler-${MOVERS[i].id}`, H, () => createRuler(sel))
    const dotY = AXIS_Y - (16 + (i % 3) * 20)
    const c = shot.centroid(2, dotY - 5, W - 2, dotY + 5, PALETTE.hit, 30)
    return c ? c.x : -1
  }
  const xs = MOVERS.map((_: unknown, i: number) => markerX(i))
  ok(
    xs.every((v) => v > 0),
    'ruler · every specimen is drawn on the axis',
    xs.map((v, i) => `${MOVERS[i].id}@${v}`).join(' '),
  )
  ok(
    xs.every((v, i) => i === 0 || v < xs[i - 1]),
    'ruler · heavier and faster means shorter, strictly, all the way down',
    'positions decrease monotonically left of the photon',
  )
  ok(
    new Set(xs).size === xs.length,
    'ruler · selecting a different specimen moves the marker',
    `${new Set(xs).size} distinct positions for ${xs.length} specimens`,
  )
}

console.log(failures === 0 ? '\nall figure checks passed' : `\n${failures} figure check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
