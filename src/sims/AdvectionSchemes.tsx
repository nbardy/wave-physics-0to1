import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { vortexField, drawArrow } from './lib/field'

// §5 — the named-solver beat (METHODOLOGY deviation #4). Two ways to move dye
// on a grid, same field, same timestep, SAME BLOB, side by side:
//   left  — explicit centered differences: q += -dt·(u·∇q) with centered
//           stencils. Unconditionally UNSTABLE for pure advection (no amount of
//           timestep shrinking rescues it) — ripples grow until the field is
//           garbage, and the violet marks negative dye, which cannot exist.
//   right — semi-Lagrangian: ask "whose dye arrives here?", trace the velocity
//           backward one step, interpolate. Stable at any timestep; the price
//           is a little smearing.
//
// The two panes were originally one pane behind a mode toggle, which hid the
// entire point: a reader saw one scheme at a time and had to hold the other in
// memory to notice they disagreed. Run together from one seed, the divergence
// is the figure. Both panes reset together when the left one dies, so the
// comparison always restarts fair — that reset is a restart of the
// demonstration, not physics.

const NX = 84
const NY = 64
const FIXED_DT = 1 / 60
// Wound fast enough that the spiral is legible within a couple of seconds and
// the unstable scheme reaches its blow-up in ~2–3 s; at the old 0.13 the figure
// looked like a stalled blur and taught nothing before a reader moved on.
const FIELD = vortexField(0.3)
// The blob is a SHARP-EDGED disc, not the smooth Gaussian this figure used to
// seed, and that is the whole reason it now demonstrates anything. Centered
// differences amplify grid-scale wavenumbers, and a Gaussian carries almost no
// energy there — measured, the old figure's "unstable" pane sat at |dye| ≤ 1.01
// for ten seconds and produced not one negative cell while the prose promised a
// scheme tearing itself apart. A discontinuous edge excites those modes at once:
// negative dye appears within half a second and spreads without stopping.
const FIELD_R = 0.13 // disc radius, fraction of width (y scaled to match aspect)
// Failure is counted in NEGATIVE CELLS, not peak amplitude: the corruption
// spreads (42 cells at 0.5 s → 600+ by 11 s) while the peak creeps only from
// 1.0 to ~1.8, so an amplitude trigger — the old |dye| > 8 — never fired at all.
const NEG_CELLS_RUINED = 420 // ~8% of the grid; reached around 8 s
const NEG_FLOOR = -0.05 // count a cell as impossible below this
const LINGER = 1.1 // s to hold on the wreckage before restarting both panes

type Pane = { dye: Float32Array; next: Float32Array }

function makePane(): Pane {
  return { dye: new Float32Array(NX * NY), next: new Float32Array(NX * NY) }
}

function sample(f: Float32Array, x: number, y: number) {
  const cx = Math.min(Math.max(x, 0), NX - 1.001)
  const cy = Math.min(Math.max(y, 0), NY - 1.001)
  const i0 = Math.floor(cx)
  const j0 = Math.floor(cy)
  const tx = cx - i0
  const ty = cy - j0
  const a = f[i0 + j0 * NX]
  const b = f[Math.min(i0 + 1, NX - 1) + j0 * NX]
  const c = f[i0 + Math.min(j0 + 1, NY - 1) * NX]
  const d = f[Math.min(i0 + 1, NX - 1) + Math.min(j0 + 1, NY - 1) * NX]
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

function createAdvectDemo(): Stepper {
  const naive = makePane()
  const back = makePane()
  let blownUp = false
  let sinceBlowUp = 0

  const seed = () => {
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const dx = (i / NX - 0.34) / FIELD_R
        const dy = (j / NY - 0.5) / (FIELD_R * (NX / NY))
        const v = Math.sqrt(dx * dx + dy * dy) <= 1 ? 1 : 0
        naive.dye[i + j * NX] = v
        back.dye[i + j * NX] = v
      }
    }
    blownUp = false
    sinceBlowUp = 0
  }
  seed()

  const off = document.createElement('canvas')
  off.width = NX
  off.height = NY
  const img = new ImageData(NX, NY)

  const stepNaive = () => {
    let negCells = 0
    for (let j = 1; j < NY - 1; j++) {
      for (let i = 1; i < NX - 1; i++) {
        const k = i + j * NX
        const v = FIELD(i / NX, j / NY, 0)
        const dqdx = (naive.dye[k + 1] - naive.dye[k - 1]) / 2
        const dqdy = (naive.dye[k + NX] - naive.dye[k - NX]) / 2
        naive.next[k] = naive.dye[k] - FIXED_DT * (v.x * NX * dqdx + v.y * NY * dqdy)
        if (naive.next[k] < NEG_FLOOR) negCells++
      }
    }
    const s = naive.dye
    naive.dye = naive.next
    naive.next = s
    return negCells
  }

  const stepBack = () => {
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const v = FIELD(i / NX, j / NY, 0)
        back.next[i + j * NX] = sample(back.dye, i - v.x * NX * FIXED_DT, j - v.y * NY * FIXED_DT)
      }
    }
    const s = back.dye
    back.dye = back.next
    back.next = s
  }

  const paint = (ctx: CanvasRenderingContext2D, f: Float32Array, x: number, y: number, w: number, h: number) => {
    const d = img.data
    for (let k = 0; k < f.length; k++) {
      const c = Math.min(Math.max(f[k], -1), 1)
      const o = k * 4
      if (c >= 0) {
        d[o] = 247 + (217 - 247) * c
        d[o + 1] = 249 + (119 - 249) * c
        d[o + 2] = 252 + (6 - 252) * c
      } else {
        // negative dye — physically impossible, the scheme's confession
        d[o] = 247 + (124 - 247) * -c
        d[o + 1] = 249 + (58 - 249) * -c
        d[o + 2] = 252 + (237 - 252) * -c
      }
      d[o + 3] = 255
    }
    const octx = off.getContext('2d')
    if (!octx) return
    octx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(off, x, y, w, h)
  }

  let acc = 0
  return {
    step(dt) {
      acc += dt
      let guard = 0
      while (acc >= FIXED_DT && guard < 6) {
        if (blownUp) {
          sinceBlowUp += FIXED_DT
          if (sinceBlowUp > LINGER) seed()
        } else {
          if (stepNaive() > NEG_CELLS_RUINED) {
            blownUp = true
            sinceBlowUp = 0
          }
          stepBack()
        }
        acc -= FIXED_DT
        guard++
      }
      acc = Math.min(acc, FIXED_DT)
    },
    draw(ctx, w, h) {
      const gap = 10
      const pw = (w - gap) / 2
      paint(ctx, naive.dye, 0, 0, pw, h)
      paint(ctx, back.dye, pw + gap, 0, pw, h)

      // the backtrace question, drawn on the pane that asks it
      const hx = 0.62
      const hy = 0.34
      const v = FIELD(hx, hy, 0)
      const px = pw + gap + hx * pw
      const py = hy * h
      ctx.strokeStyle = PALETTE.vel
      ctx.setLineDash([4, 3])
      drawArrow(ctx, px, py, -v.x * pw * 0.5, -v.y * h * 0.5, PALETTE.vel)
      ctx.setLineDash([])
      ctx.strokeStyle = PALETTE.wall
      ctx.strokeRect(px - 4, py - 4, 8, 8)

      ctx.font = '600 12px ui-sans-serif, system-ui'
      ctx.fillStyle = 'rgba(26,31,43,0.75)'
      ctx.fillText('the obvious update', 10, 18)
      ctx.fillText('trace backward', pw + gap + 10, 18)
      if (blownUp) {
        ctx.fillStyle = PALETTE.div
        ctx.fillText('field destroyed — restarting both', 10, h - 10)
      }
    },
  }
}

export function AdvectionSchemes({ height = 240 }: { height?: number }) {
  return <Sim height={height} create={() => createAdvectDemo()} />
}
