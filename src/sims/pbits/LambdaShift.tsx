import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE } from '../lib/palette'
import { FONT_LABEL, FONT_METER, fmt, paneFrame, type Rect } from '../lib/chrome'
import { drawLayerRail, tvDistance } from './lib'
import { drawKernelHeat } from './act3'

// Part 2, PLAN F10 — the λ-shift deep cut (Thermalizers; claims ledger in
// articles/06-z1-compiler/RESEARCH.md, λ-shift invariance line). Two energy
// models over the same in/hidden/out partition, built so their energies
// differ ONLY by a function λ(x) of the input: E_B(x,w,y) = E_A(x,w,y) + λ(x).
// Given x, e^{−λ(x)} is a constant factor over every (w,y) — the forward
// normalization divides it out, so K_B(y|x) = K_A(y|x) EXACTLY, at any λ.
// The joint law is not so lucky: p_B(x,y) ∝ e^{−λ(x)} p_A(x,y), so the
// BACKWARD conditional K(x|y) reweights by input and the two models part
// company. The cancellation is computed, never assumed: λ enters every
// energy evaluation and the forward panes still refuse to move — that
// refusal, next to backward panes that do move, is the figure.
//
// Everything is exact enumeration: 2 input spins × 1 hidden × 2 output
// spins = 32 configs. β = 1, folded into the parameters.

// The fixed shared energy — one arbitrary-but-frozen thermodynamic kernel.
const U = [
  [0.9, -0.5],
  [0.4, 0.7],
] // in–out couplings x_i y_k
const A_IN_HID = [0.6, -0.8] // in–hidden x_i w
const B_HID_OUT = [0.5, 0.9] // hidden–out w y_k
const C_HID = 0.3 // hidden bias
const D_OUT = [0.2, -0.3] // output biases

/** λ's fixed shape over the four inputs; the knob scales it. */
export const LAMBDA_SHAPE: readonly number[] = [1.0, -0.6, 0.4, -1.0]

const sp = (cfg: number, k: number) => ((cfg >> k) & 1 ? 1 : -1)

/** −E_A(x, w, y): the shared energy, before any λ offset. */
export function negEnergyA(x: number, wSpin: number, y: number): number {
  let e = C_HID * wSpin
  for (let i = 0; i < 2; i++) {
    const xi = sp(x, i)
    e += A_IN_HID[i] * xi * wSpin
    for (let k = 0; k < 2; k++) e += U[i][k] * xi * sp(y, k)
  }
  for (let k = 0; k < 2; k++) e += (B_HID_OUT[k] * wSpin + D_OUT[k]) * sp(y, k)
  return e
}

export type LambdaModel = 'A' | 'B'

/** The per-input offsets a model carries: A has none, B has λ·shape. */
export function offsetsFor(model: LambdaModel, mag: number): number[] {
  return model === 'A' ? [0, 0, 0, 0] : LAMBDA_SHAPE.map((g) => mag * g)
}

/** Exact K(y|x): clamp x, marginalize the hidden spin, normalize over y.
 *  λ(x) is included in every weight — the invariance is computed, not coded. */
export function forwardKernel(lamX: ArrayLike<number>, x: number): Float64Array {
  const out = new Float64Array(4)
  let z = 0
  for (let y = 0; y < 4; y++) {
    let s = 0
    for (const w of [-1, 1]) s += Math.exp(negEnergyA(x, w, y) - lamX[x])
    out[y] = s
    z += s
  }
  for (let y = 0; y < 4; y++) out[y] /= z
  return out
}

/** Exact K(x|y) from the model's full joint (all spins free). */
export function backwardKernel(lamX: ArrayLike<number>, y: number): Float64Array {
  const out = new Float64Array(4)
  let z = 0
  for (let x = 0; x < 4; x++) {
    let s = 0
    for (const w of [-1, 1]) s += Math.exp(negEnergyA(x, w, y) - lamX[x])
    out[x] = s
    z += s
  }
  for (let x = 0; x < 4; x++) out[x] /= z
  return out
}

/** max_x TV(K_A(·|x), K_B(·|x)) — the forward claim: ≡ 0 at any λ. */
export function forwardMaxTV(mag: number): number {
  const lamA = offsetsFor('A', mag)
  const lamB = offsetsFor('B', mag)
  let worst = 0
  for (let x = 0; x < 4; x++) {
    worst = Math.max(worst, tvDistance(forwardKernel(lamA, x), forwardKernel(lamB, x)))
  }
  return worst
}

/** max_y TV(K_A(·|y), K_B(·|y)) — the backward side, which λ does move. */
export function backwardMaxTV(mag: number): number {
  const lamA = offsetsFor('A', mag)
  const lamB = offsetsFor('B', mag)
  let worst = 0
  for (let y = 0; y < 4; y++) {
    worst = Math.max(worst, tvDistance(backwardKernel(lamA, y), backwardKernel(lamB, y)))
  }
  return worst
}

export interface LambdaShared {
  mag: number
}

/** The two λ-sensitive-vs-insensitive canvas regions, for the pixel check:
 *  every λ-dependent ink outside `fwd` must land in `bwd` or the left column. */
export function lambdaRegions(w: number, h: number): { fwd: Rect; bwd: Rect } {
  return {
    fwd: { x: 128, y: 24, w: w - 144, h: h * 0.44 },
    bwd: { x: 128, y: h * 0.5, w: w - 144, h: h * 0.47 },
  }
}

const CTX_LABELS = ['--', '+-', '-+', '++']

export function createLambdaShift(shared: { current: LambdaShared }): Stepper {
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      drawLayerRail(ctx, w, 'energy')
      const mag = shared.current.mag
      const lamA = offsetsFor('A', mag)
      const lamB = offsetsFor('B', mag)
      const { fwd, bwd } = lambdaRegions(w, h)

      // ---- left column: λ(x) as a per-input energy offset --------------------
      const lp: Rect = { x: 14, y: 46, w: 100, h: 120 }
      paneFrame(ctx, lp)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.textAlign = 'left'
      ctx.fillText('λ(x) per input', lp.x, lp.y - 8)
      const zero = lp.y + lp.h / 2
      const bw = lp.w / 4
      const scale = lp.h / 2 / 3.2 // full slider range fits the pane
      ctx.strokeStyle = 'rgba(120,140,170,0.5)'
      ctx.beginPath()
      ctx.moveTo(lp.x, zero)
      ctx.lineTo(lp.x + lp.w, zero)
      ctx.stroke()
      for (let x = 0; x < 4; x++) {
        const v = lamB[x]
        ctx.fillStyle = PALETTE.sUp
        ctx.globalAlpha = 0.85
        const hgt = Math.abs(v) * scale
        ctx.fillRect(lp.x + x * bw + bw * 0.2, v >= 0 ? zero - hgt : zero, bw * 0.6, hgt)
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'center'
        ctx.fillText(CTX_LABELS[x], lp.x + (x + 0.5) * bw, lp.y + lp.h + 12)
      }
      ctx.textAlign = 'left'
      ctx.font = FONT_METER
      ctx.fillStyle = '#1a1f2b'
      ctx.fillText(`λ = ${fmt(mag, 1)}`, lp.x, lp.y + lp.h + 32)
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.9)'
      ctx.fillText('E_B = E_A + λ(x)', lp.x, lp.y + lp.h + 48)

      // ---- pane geometry for both rows ---------------------------------------
      const gap = 12
      const paneW = (fwd.w - 2 * gap) / 3
      const paneAt = (row: Rect, k: number): Rect => ({
        x: row.x + k * (paneW + gap),
        y: row.y + 22,
        w: paneW,
        h: row.h - 46,
      })

      // ---- forward row: identical, and overlaid to prove it ------------------
      const fA = [0, 1, 2, 3].map((x) => Array.from(forwardKernel(lamA, x)))
      const fB = [0, 1, 2, 3].map((x) => Array.from(forwardKernel(lamB, x)))
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('FORWARD  K(y|x) — clamp x, marginalize w', fwd.x, fwd.y + 12)
      drawKernelHeat(ctx, paneAt(fwd, 0), fA, {
        title: 'model A',
        rowLabels: CTX_LABELS,
        colLabels: ['--', '+-', '-+', '++'],
        numbers: false,
      })
      drawKernelHeat(ctx, paneAt(fwd, 1), fB, {
        title: 'model B (+λ)',
        rowLabels: CTX_LABELS,
        colLabels: ['--', '+-', '-+', '++'],
        numbers: false,
      })
      // overlay: A filled, B outlined — 16 bars; B's outline hugging A's fill
      // at every λ IS the invariance, drawn rather than asserted
      const op = paneAt(fwd, 2)
      paneFrame(ctx, op)
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('A filled · B outlined', op.x, op.y - 4)
      const barW = op.w / 16
      for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
          const k = x * 4 + y
          const bx = op.x + k * barW
          const ha = fA[x][y] * (op.h - 14)
          const hb = fB[x][y] * (op.h - 14)
          ctx.fillStyle = PALETTE.meter
          ctx.globalAlpha = 0.55
          ctx.fillRect(bx + 1, op.y + op.h - ha, barW - 2, ha)
          ctx.globalAlpha = 1
          ctx.strokeStyle = '#1a1f2b'
          ctx.lineWidth = 1
          ctx.strokeRect(bx + 1, op.y + op.h - hb, barW - 2, hb)
        }
        ctx.fillStyle = 'rgba(85,96,111,0.9)'
        ctx.textAlign = 'center'
        ctx.fillText(CTX_LABELS[x], op.x + (x * 4 + 2) * barW, op.y + op.h - 3)
        ctx.textAlign = 'left'
      }
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.meter
      ctx.fillText(
        `forward: max TV(A, B) = ${forwardMaxTV(mag).toFixed(6)} — λ cannot touch it`,
        fwd.x,
        fwd.y + fwd.h - 2,
      )

      // ---- backward row: the same λ, now visible -----------------------------
      const bA = [0, 1, 2, 3].map((y) => Array.from(backwardKernel(lamA, y)))
      const bB = [0, 1, 2, 3].map((y) => Array.from(backwardKernel(lamB, y)))
      const bD = bA.map((row, y) => row.map((v, x) => Math.abs(v - bB[y][x])))
      ctx.font = FONT_LABEL
      ctx.fillStyle = 'rgba(85,96,111,0.95)'
      ctx.fillText('BACKWARD  K(x|y) — the joint remembers λ', bwd.x, bwd.y + 12)
      drawKernelHeat(ctx, paneAt(bwd, 0), bA, {
        title: 'model A',
        rowLabels: CTX_LABELS,
        colLabels: ['--', '+-', '-+', '++'],
        numbers: false,
      })
      drawKernelHeat(ctx, paneAt(bwd, 1), bB, {
        title: 'model B (+λ)',
        rowLabels: CTX_LABELS,
        colLabels: ['--', '+-', '-+', '++'],
        numbers: false,
      })
      drawKernelHeat(ctx, paneAt(bwd, 2), bD, {
        title: '|A - B|', // ASCII hyphen — U+2212 is tofu in the headless font
        rowLabels: CTX_LABELS,
        colLabels: ['--', '+-', '-+', '++'],
        numbers: false,
        ink: PALETTE.ferro,
      })
      ctx.font = FONT_METER
      ctx.fillStyle = PALETTE.ferro
      ctx.fillText(`backward: max TV(A, B) = ${fmt(backwardMaxTV(mag), 3)}`, bwd.x, bwd.y + bwd.h - 2)
    },
  }
}

export function LambdaShift() {
  const [mag, setMag] = useState(1.5)
  const shared = useRef<LambdaShared>({ mag })
  shared.current.mag = mag

  return (
    <Sim height={400} animated={false} create={() => createLambdaShift(shared)}>
      <label className="sim-slider">
        <span>λ = 0</span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={mag}
          onChange={(e) => setMag(Number(e.target.value))}
        />
        <span>λ = 3</span>
      </label>
    </Sim>
  )
}
