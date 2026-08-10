import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, clipPane, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail } from './lib'
import {
  buildMetaModel,
  gateDelta,
  gateLogit,
  gateRamp,
  makeGate,
  marqueeTriple,
  softplus,
} from './metaEbm'

// PLAN F15b — the soft-product gate: one hidden spin IS a product term.
// The specimen is the Act-IV model's own largest three-body coefficient
// W·x_m·x_m′ (as seen from its output site's Gibbs logit). Left: the two
// softplus ramps of Eq (42) and their difference — the gate as the substrate
// computes it. Middle: the target product surface over the four input
// corners, the gate's realized surface at the same corners (native constant
// and linear content already cancelled — that furniture the fabric owns),
// and the residual between them. Right: the residual across the whole knob
// range, dying exponentially — the one knob sweeps the coupling magnitude,
// which sharpens the softplus difference toward a ReLU. Measured decay:
// e^{−4a} per unit coupling (asserted in scripts/check-metaebm.ts).

const MODEL = buildMetaModel()
const MARQUEE = marqueeTriple(MODEL)
export const KNOB_MIN = 0.8
export const KNOB_MAX = 6

export interface SoftProductShared {
  /** Coupling magnitude a — the article's J_max knob. */
  a: number
}

export interface SoftProductProbe {
  residual: number
  realized: number
  target: number
}

const CORNERS: ReadonlyArray<[number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

/** Signed 2×2 corner surface: amber above zero, blue below, ferro override. */
function drawCornerTile(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  title: string,
  values: number[],
  scale: number,
  ink?: string,
): void {
  ctx.font = FONT_LABEL
  ctx.fillStyle = 'rgba(85,96,111,0.95)'
  ctx.textAlign = 'left'
  ctx.fillText(title, r.x, r.y - 6)
  const cw = r.w / 2
  const ch = r.h / 2
  CORNERS.forEach(([xm, xmp], k) => {
    const col = xmp > 0 ? 1 : 0
    const row = xm > 0 ? 0 : 1
    const v = values[k]
    const cx = r.x + col * cw
    const cy = r.y + row * ch
    ctx.fillStyle = ink ?? (v >= 0 ? PALETTE.sUp : PALETTE.sDn)
    ctx.globalAlpha = 0.9 * Math.min(1, Math.abs(v) / scale)
    ctx.fillRect(cx + 1, cy + 1, cw - 2, ch - 2)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#1a1f2b'
    ctx.textAlign = 'center'
    // digits fit their own cell — at 360px "−1.07" spilled into the neighbor
    // (figure audit, 2026-08-11)
    ctx.font = cw < 36 ? '500 8px ui-sans-serif, system-ui' : FONT_LABEL
    ctx.fillText(fmt(v, 2), cx + cw / 2, cy + ch / 2 + 4)
    ctx.font = FONT_LABEL
  })
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(85,96,111,0.9)'
  ctx.fillText('x_m′-  x_m′+', r.x + 6, r.y + r.h + 12)
  paneFrame(ctx, r)
}

export function createSoftProduct(
  shared: { current: SoftProductShared },
  probe?: SoftProductProbe,
): Stepper {
  const W = MARQUEE.W
  const absW = Math.abs(W)
  // The residual curve over the whole knob range is a fixed fact of (W, a) —
  // computed once, the knob only moves the dot along it.
  const AS: number[] = []
  const RS: number[] = []
  for (let a = KNOB_MIN; a <= KNOB_MAX + 1e-9; a += 0.05) {
    AS.push(a)
    RS.push(Math.abs(makeGate(a, W, 0, 1).C - W))
  }
  const R_LO = 1e-9
  const R_HI = 10

  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'substrate')
      const a = shared.current.a
      const gate = makeGate(a, W, MARQUEE.m, MARQUEE.mp)
      const target = CORNERS.map(([xm, xmp]) => W * xm * xmp)
      const realized = CORNERS.map(([xm, xmp]) => gateLogit(gate, xm, xmp))
      const resid = realized.map((v, k) => v - target[k])
      const residual = Math.max(...resid.map(Math.abs))
      if (probe) {
        probe.residual = residual
        probe.realized = gate.C
        probe.target = W
      }

      // --- left: the two ramps and their difference, in units of a ---------
      const rp: Rect = { x: 16, y: 44, w: w * 0.3, h: h - 122 }
      paneFrame(ctx, rp)
      ctx.save()
      clipPane(ctx, rp)
      const tauLo = -4.4
      const tauHi = 4.4
      const yMax = Math.max(2 * gate.beta, 1)
      const px = (tau: number) => rp.x + ((tau - tauLo) / (tauHi - tauLo)) * rp.w
      const py = (v: number) => rp.y + rp.h * (1 - (v / yMax) * 0.86) - rp.h * 0.06
      const trace = (f: (t: number) => number, color: string, width: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        for (let k = 0; k <= 160; k++) {
          const tau = tauLo + ((tauHi - tauLo) * k) / 160
          const y = py(f(tau * a))
          if (k === 0) ctx.moveTo(px(tau), y)
          else ctx.lineTo(px(tau), y)
        }
        ctx.stroke()
      }
      trace((t) => 0.5 * softplus(-2 * (t - gate.beta)), PALETTE.ghost, 1.2)
      trace((t) => 0.5 * softplus(-2 * (t + gate.beta)), PALETTE.ghost, 1.2)
      trace((t) => gateRamp(t, gate.beta), PALETTE.meter, 2)
      // the four input corners land here: t = a(u + s), u = x_m + x_m′
      for (const u of [2, 0, -2]) {
        const tau = u + gate.s
        ctx.beginPath()
        ctx.arc(px(tau), py(gateRamp(a * tau, gate.beta)), 3.6, 0, Math.PI * 2)
        ctx.fillStyle = PALETTE.sUp
        ctx.fill()
      }
      ctx.restore()
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'left'
      // header stays inside its own pane — the full wording ran into the
      // middle column's header at every width (figure audit, 2026-08-11)
      const fitText = (cands: string[], maxW: number): string =>
        cands.find((s) => ctx.measureText(s).width <= maxW) ?? cands[cands.length - 1]
      ctx.fillText(
        fitText(
          ['two softplus ramps · their difference is the gate', 'ramps · difference = gate', 'ramp difference'],
          rp.w + 20,
        ),
        rp.x,
        rp.y - 8,
      )
      ctx.fillText(
        fitText(['dots: where the four input corners land', 'dots: the 4 input corners', 'input corners'], rp.w + 20),
        rp.x,
        rp.y + rp.h + 14,
      )
      if (gate.beta < 0) {
        // at the knob's weak end the gate has no plateau — the curve and its
        // corner dots leave the pane's y-range, which read as a silently
        // blank pane (figure audit, 2026-08-11); say why on-canvas instead
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.fillText('β < 0 — no plateau: gate broken', rp.x + 6, rp.y + 16)
      }

      // --- middle: the corner surfaces ------------------------------------
      const scale = Math.max(absW * 1.05, 1e-9)
      const tile = (i: number): Rect => ({
        x: w * 0.37 + i * w * 0.115,
        y: 60,
        w: w * 0.095,
        h: h - 170,
      })
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(
        fitText(['W·x_m x_m′ at the four input corners', 'W·x_m x_m′ at the corners', 'four corners'], w * 0.75 - w * 0.37 - 8),
        w * 0.37,
        40,
      )
      drawCornerTile(ctx, tile(0), 'target', target, scale)
      drawCornerTile(ctx, tile(1), 'realized', realized, scale)
      drawCornerTile(ctx, tile(2), 'residual', resid, scale, PALETTE.ferro)
      // row labels beside the first tile
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.textAlign = 'right'
      const t0 = tile(0)
      ctx.fillText('x_m+', t0.x - 3, t0.y + t0.h * 0.25 + 4)
      ctx.fillText('x_m-', t0.x - 3, t0.y + t0.h * 0.75 + 4)
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = residual > 0.05 * absW ? PALETTE.ferro : PALETTE.meter
      ctx.fillText(
        `corner residual ${residual < 1e-3 ? residual.toExponential(1) : fmt(residual, 3)}`,
        w * 0.37,
        h - 66,
      )
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      // narrow cedes the note block to the prose — it collided with the
      // coupling readout at 360px (figure audit, 2026-08-11)
      if (w >= 520) {
        ctx.fillText(`one hidden spin · W = ${fmt(W, 2)} (the model's largest`, w * 0.37, h - 46)
        ctx.fillText(`three-body term) · constant + linear parts`, w * 0.37, h - 32)
        ctx.fillText('cancelled by native wires — the product remains', w * 0.37, h - 18)
      }

      // --- right: the residual across the whole knob, log scale -----------
      const cp: Rect = { x: w * 0.75, y: 44, w: w * 0.22, h: h - 122 }
      paneFrame(ctx, cp)
      ctx.save()
      clipPane(ctx, cp)
      const cx = (av: number) => cp.x + ((av - KNOB_MIN) / (KNOB_MAX - KNOB_MIN)) * cp.w
      const cy = (r: number) =>
        cp.y + cp.h * (1 - (Math.log(Math.max(r, R_LO)) - Math.log(R_LO)) / (Math.log(R_HI) - Math.log(R_LO)))
      ctx.strokeStyle = PALETTE.meter
      ctx.lineWidth = 1.8
      ctx.beginPath()
      AS.forEach((av, k) => {
        if (k === 0) ctx.moveTo(cx(av), cy(RS[k]))
        else ctx.lineTo(cx(av), cy(RS[k]))
      })
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx(a), cy(residual), 4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.sUp
      ctx.fill()
      ctx.restore()
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText(fitText(['residual vs coupling (log)', 'residual (log)'], w - cp.x - 8), cp.x, cp.y - 8)
      // measured decay rate over the hard-limit stretch of the curve
      const kA = AS.findIndex((v) => v >= 3.5)
      const slope =
        (Math.log(RS[RS.length - 1]) - Math.log(RS[kA])) / (AS[AS.length - 1] - AS[kA])
      ctx.fillText(
        fitText([`measured decay e^(${fmt(slope, 1)}·a)`, `decay e^(${fmt(slope, 1)}·a)`], w - cp.x - 8),
        cp.x,
        cp.y + cp.h + 14,
      )
      // under the decay pane — at the old top-right spot this overprinted the
      // rail tabs at every width (figure audit, 2026-08-11); narrow tucks it
      // bottom-left where the ceded note block freed the room
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      const couplingLabel = `coupling a = ${fmt(a, 2)} · β = 3a - ${fmt(gateDelta(absW), 2)}`
      if (w < 520) ctx.fillText(couplingLabel, 16, h - 18)
      else ctx.fillText(couplingLabel, cp.x - 30, cp.y + cp.h + 32)
    },
  }
}

export function SoftProduct() {
  const [a, setA] = useState(2.2)
  const shared = useRef<SoftProductShared>({ a })
  shared.current.a = a

  return (
    <Sim height={330} animated={false} create={() => createSoftProduct(shared)}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        coupling magnitude
        <input
          type="range"
          min={KNOB_MIN}
          max={KNOB_MAX}
          step={0.02}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
        />
      </label>
    </Sim>
  )
}
