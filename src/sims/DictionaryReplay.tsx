import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

// §9 "You Have Built Electromagnetism", the dictionary as its own figure
// (plan fig 43 + the per-row replays, figs 44–48). The MDX renders the dictionary
// as an HTML <table> and replays two of its rows with live sims already
// (RegaugeBrush for the gauge row, HolonomyLoop mode="field" for the B row). This
// figure is the dictionary made VISUAL: a selector steps through every row and
// draws three tiles — the thing you built (left, in its contract color), the
// name physics gives it (center), and where you have felt it in the kitchen
// (right, the household anchor). Every physics-side entry is pinned to a drawn
// household anchor so the reveal is never ghost-to-ghost.
//
// This is a schematic gallery, not a physics solver — each anchor is a small
// closed-form animation (a compass needle nudging, a spark flickering, the dial
// on the sealed core turning). There is no integrator, no PDE, hence no
// stability condition (the honest-sims rule: nothing here is simulated, so
// nothing is faked as a sim — it is an illustrated table). The one knob is the
// row selector.
//
// The rows are a sum type; the dispatcher below is a thin table lookup and each
// row is drawn by one handler over shared tile primitives — no default branch.

export type DictRow = 'potential' | 'gauge' | 'bfield' | 'efield' | 'flux'

const ROW_ORDER: readonly DictRow[] = ['potential', 'gauge', 'bfield', 'efield', 'flux']
const ROW_LABEL: Record<DictRow, string> = {
  potential: 'transport rule',
  gauge: 'regauge brush',
  bfield: 'B curvature',
  efield: 'E curvature',
  flux: 'holonomy',
}

interface RowSpec {
  built: string // what you built (left tile caption)
  builtColor: string // its contract color
  physics: string // what physics calls it (center tile)
  physicsColor: string
  felt: string // where you have felt it (right tile caption)
  /** Draw the "built" glyph in a box (bx, by, bw, bh) using phase t (seconds). */
  drawBuilt: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) => void
  /** Draw the household anchor in a box. */
  drawFelt: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) => void
}

// ----------------------------------------------------------- glyph helpers ---

const INK = '#55606f'

function clockFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, needle: number, needleColor: string, zero: number): void {
  ctx.strokeStyle = PALETTE.wall
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  // zero mark
  ctx.strokeStyle = PALETTE.gauge
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(-zero) * r * 0.78, cy + Math.sin(-zero) * r * 0.78)
  ctx.lineTo(cx + Math.cos(-zero) * r * 1.06, cy + Math.sin(-zero) * r * 1.06)
  ctx.stroke()
  // needle
  ctx.strokeStyle = needleColor
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(-needle) * r * 0.82, cy + Math.sin(-needle) * r * 0.82)
  ctx.stroke()
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, lw = 2): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return
  const ux = dx / len
  const uy = dy / len
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - ux * 7 + uy * 4, y1 - uy * 7 - ux * 4)
  ctx.lineTo(x1 - ux * 7 - uy * 4, y1 - uy * 7 + ux * 4)
  ctx.closePath()
  ctx.fill()
}

// -------------------------------------------------------------- row specs ----

const ROWS: Record<DictRow, RowSpec> = {
  potential: {
    built: 'the transport rule A(x)',
    builtColor: PALETTE.conn,
    physics: 'the electromagnetic potential',
    physicsColor: PALETTE.conn,
    felt: 'the tuner you drove to calm',
    drawBuilt(ctx, x, y, w, h, t) {
      // three fibers with a needle carried across, turning by A per step
      const cy = y + h * 0.55
      let phi = Math.PI / 2
      for (let k = 0; k < 3; k++) {
        const cx = x + w * (0.22 + 0.28 * k)
        phi += 0.5 * Math.sin(t * 0.6 + k) * 0.0 + 0.5 // steady turn per step
        clockFace(ctx, cx, cy, Math.min(w, h) * 0.13, phi, PALETTE.conn, 0)
      }
      arrow(ctx, x + w * 0.14, cy + Math.min(w, h) * 0.24, x + w * 0.86, cy + Math.min(w, h) * 0.24, PALETTE.conn, 1.6)
    },
    drawFelt(ctx, x, y, w, h, t) {
      // a slider being nudged toward a lock — the tuner
      const cx = x + w * 0.5
      const trackY = y + h * 0.5
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + w * 0.18, trackY)
      ctx.lineTo(x + w * 0.82, trackY)
      ctx.stroke()
      const knobX = cx + Math.sin(t * 0.9) * w * 0.14
      ctx.fillStyle = PALETTE.conn
      ctx.beginPath()
      ctx.arc(knobX, trackY, 6, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  gauge: {
    built: 'the regauge brush α(x)',
    builtColor: PALETTE.gauge,
    physics: 'a gauge transformation',
    physicsColor: PALETTE.gauge,
    felt: 'the prank that moved no rope',
    drawBuilt(ctx, x, y, w, h, t) {
      // three clocks whose green zero-marks spin while the amber needles hold
      const cy = y + h * 0.55
      for (let k = 0; k < 3; k++) {
        const cx = x + w * (0.22 + 0.28 * k)
        const zero = Math.sin(t * 0.8 + k * 1.3) * 0.9 // the brush repaints the marks
        clockFace(ctx, cx, cy, Math.min(w, h) * 0.13, Math.PI / 2, PALETTE.theta, zero)
      }
    },
    drawFelt(ctx, x, y, w, h) {
      // a rope hanging still — untouched by the brush above
      const cx = x + w * 0.5
      ctx.strokeStyle = PALETTE.theta
      ctx.lineWidth = 2.2
      ctx.beginPath()
      for (let s = 0; s <= 30; s++) {
        const f = s / 30
        const yy = y + h * 0.22 + f * h * 0.56
        const xx = cx + Math.sin(f * Math.PI * 2) * w * 0.08
        if (s === 0) ctx.moveTo(xx, yy)
        else ctx.lineTo(xx, yy)
      }
      ctx.stroke()
    },
  },
  bfield: {
    built: 'curvature F, space against space',
    builtColor: PALETTE.curv,
    physics: 'the magnetic field',
    physicsColor: PALETTE.bfield,
    felt: 'the compass needle, the fridge magnet',
    drawBuilt(ctx, x, y, w, h) {
      // a violet loop with a bright core: rotation per area
      const cx = x + w * 0.5
      const cy = y + h * 0.52
      const r = Math.min(w, h) * 0.24
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0, 'rgba(124,58,237,0.55)')
      grad.addColorStop(1, 'rgba(124,58,237,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = PALETTE.curv
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2)
      ctx.stroke()
    },
    drawFelt(ctx, x, y, w, h, t) {
      // a compass needle settling toward north
      const cx = x + w * 0.5
      const cy = y + h * 0.52
      const r = Math.min(w, h) * 0.24
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      const ang = -Math.PI / 2 + Math.sin(t * 1.4) * 0.18
      arrow(ctx, cx - Math.cos(ang) * r * 0.7, cy - Math.sin(ang) * r * 0.7, cx + Math.cos(ang) * r * 0.7, cy + Math.sin(ang) * r * 0.7, PALETTE.bfield, 2.4)
    },
  },
  efield: {
    built: 'curvature F, time against space',
    builtColor: PALETTE.curv,
    physics: 'the electric field',
    physicsColor: PALETTE.efield,
    felt: 'the doorknob spark, static cling',
    drawBuilt(ctx, x, y, w, h) {
      // schematic (confessed): time joins the base — a loop with one axis marked
      // "t". Drawn only schematically, per the article's own admission.
      const cx = x + w * 0.5
      const cy = y + h * 0.5
      const r = Math.min(w, h) * 0.22
      ctx.strokeStyle = PALETTE.curv
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      arrow(ctx, cx - r * 1.3, cy + r * 1.1, cx + r * 1.3, cy + r * 1.1, INK, 1.4) // space axis
      arrow(ctx, cx - r * 1.3, cy + r * 1.1, cx - r * 1.3, cy - r * 1.1, INK, 1.4) // time axis
      ctx.fillStyle = INK
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('x', cx + r * 1.3 - 8, cy + r * 1.1 + 14)
      ctx.fillText('t', cx - r * 1.3 - 12, cy - r * 1.1 + 4)
    },
    drawFelt(ctx, x, y, w, h, t) {
      // a doorknob and a jagged spark that flickers
      const kx = x + w * 0.62
      const ky = y + h * 0.5
      ctx.fillStyle = PALETTE.wall
      ctx.beginPath()
      ctx.arc(kx, ky, Math.min(w, h) * 0.1, 0, Math.PI * 2)
      ctx.fill()
      // spark from a fingertip on the left, flickering on a fast clock
      const on = (Math.sin(t * 8) > 0.4) ? 1 : 0.15
      ctx.strokeStyle = `rgba(220,38,38,${on})`
      ctx.lineWidth = 2
      ctx.beginPath()
      let sx = x + w * 0.24
      const sy = ky
      ctx.moveTo(sx, sy)
      for (let s = 0; s < 4; s++) {
        sx += (kx - x - w * 0.24) / 4
        ctx.lineTo(sx, sy + (s % 2 === 0 ? -6 : 6))
      }
      ctx.stroke()
    },
  },
  flux: {
    built: 'holonomy around a loop',
    builtColor: PALETTE.curv,
    physics: 'magnetic flux',
    physicsColor: PALETTE.curv,
    felt: 'the dial on the sealed core',
    drawBuilt(ctx, x, y, w, h) {
      // a loop enclosing a sealed core; the loop returns a needle rotated
      const cx = x + w * 0.5
      const cy = y + h * 0.52
      const r = Math.min(w, h) * 0.24
      // sealed core (curvature confined inside)
      ctx.fillStyle = 'rgba(124,58,237,0.4)'
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
      ctx.fill()
      // the loop
      ctx.strokeStyle = PALETTE.curv
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    },
    drawFelt(ctx, x, y, w, h, t) {
      // the dial on the sealed core, turning
      const cx = x + w * 0.5
      const cy = y + h * 0.52
      const r = Math.min(w, h) * 0.2
      ctx.strokeStyle = PALETTE.wall
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      const ang = t * 0.7
      arrow(ctx, cx, cy, cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.8, PALETTE.conn, 2.4)
    },
  },
}

// -------------------------------------------------------------- rendering ----

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  titleColor: string,
  body: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) => void,
  t: number,
): void {
  ctx.strokeStyle = 'rgba(107,114,128,0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)
  ctx.fillStyle = titleColor
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, x + w / 2, y + h - 10)
  ctx.textAlign = 'left'
  body(ctx, x, y + 8, w, h - 34, t)
}

function createDictionary(rowRef: { current: DictRow }): Stepper {
  let t = 0
  return {
    step(dt) {
      t += dt // playback time only — nothing is integrated, this is an illustrated table
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const row = ROWS[rowRef.current]
      const pad = 16
      const top = 34
      const tileW = (w - 4 * pad) / 3
      const tileH = h - top - pad

      // header
      ctx.fillStyle = INK
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('what you built', pad + 4, 22)
      ctx.textAlign = 'center'
      ctx.fillText('what physics calls it', pad * 2 + tileW * 1.5, 22)
      ctx.textAlign = 'right'
      ctx.fillText('where you have felt it', w - pad - 4, 22)
      ctx.textAlign = 'left'

      // left: what you built
      drawTile(ctx, pad, top, tileW, tileH, row.built, row.builtColor, row.drawBuilt, t)

      // center: the physics name, big, plus an equals bridge
      const cx0 = pad * 2 + tileW
      ctx.strokeStyle = 'rgba(107,114,128,0.3)'
      ctx.strokeRect(cx0, top, tileW, tileH)
      ctx.fillStyle = row.physicsColor
      ctx.font = 'italic 15px Georgia, "Times New Roman", serif'
      ctx.textAlign = 'center'
      wrapText(ctx, row.physics, cx0 + tileW / 2, top + tileH / 2 - 6, tileW - 20, 20)
      ctx.textAlign = 'left'
      // bridge arrows =
      ctx.fillStyle = INK
      ctx.font = '18px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('=', pad * 2 + tileW - pad / 2, top + tileH / 2)
      ctx.fillText('=', pad * 3 + tileW * 2 - pad / 2, top + tileH / 2)
      ctx.textAlign = 'left'

      // right: where you have felt it
      drawTile(ctx, pad * 3 + tileW * 2, top, tileW, tileH, row.felt, INK, row.drawFelt, t)
    },
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxW: number, lh: number): void {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  const y0 = cy - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lh))
}

export function DictionaryReplay() {
  const [rowSel, setRowSel] = useState<DictRow>('potential')
  const rowRef = useRef<DictRow>(rowSel)
  rowRef.current = rowSel
  return (
    // key={rowSel}: switching the row rebuilds the stepper via create (fresh
    // phase per row, never a mutated hybrid — AGENTS.md create = fresh state)
    <Sim key={rowSel} height={240} create={() => createDictionary(rowRef)}>
      <div className="sim-seg" style={{ marginLeft: 0 }}>
        {ROW_ORDER.map((r) => (
          <button
            key={r}
            type="button"
            className={rowSel === r ? 'seg-active' : ''}
            onClick={() => setRowSel(r)}
          >
            {ROW_LABEL[r]}
          </button>
        ))}
      </div>
    </Sim>
  )
}
