import { useRef } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import {
  brushField,
  clockRow,
  drawAngleGraph,
  drawBase,
  drawClocks,
  laneSplit,
} from './lib/clocks'

// §5 — the Prankster's Derivative (figs 20–25), the central broken demo.
// Three lanes: the whirled rope (the visible motion), the clock-row, and the
// plotted θ(x). The regauge brush rotates each fiber's zero-mark by α(x);
// the plotted θ writhes, the rope above never moves.
//
// Clock-kit state contract (PLAN.md §Production, "so the regauge demo cannot
// refute its own claim"): the stepper holds θ_phys(x,t) — the prescribed
// traveling wave θ_phys = kx − ωt, same constants as §4's RopeCircle — and the
// gauge data α(x) separately. The brush writes ONLY α; nothing ever touches
// θ_phys. Rendering: the rope and the needles' absolute angles come from
// θ_phys alone; the zero marks are drawn at −α (the kit's `zeros` option); the
// graph plots the LABEL θ = θ_phys + α (math #3). "Nothing physical changed"
// therefore holds by construction, not by care.
//
// Dual meter (readouts, not knobs — the brush stays the one control):
//   rope-energy    = string recipe on θ_phys        — still, by construction
//   formula-energy = string recipe on the label θ+α — the twist term jumps
// Both use the wave's exact ∂θ/∂t = −ω (α is static, so the rate term is
// shared); the twist terms are measured numerically from the drawn arrays,
// because the twist is exactly what the brush corrupts. Steady wave reads 1.0.
//
// No integrator anywhere: θ_phys is the closed-form traveling solution, so
// there is no timestep scheme and no stability condition to satisfy — nothing
// can go unstable. The brush blend below is UI smoothing (per-frame, like
// MobiusComb's comb), not physics: it moves labels only.

const N = 28 // clock fibers — matches §4's clock-row
const K = (2 * Math.PI * 2.2) / 1 // ~2.2 turns across x ∈ [0,1] (RopeCircle's K)
const OMEGA = 2.6 // rad/s (RopeCircle's ω); wave speed c = ω/k
const ROPE_SAMPLES = 140

// Brush constants. SIGMA is the Gaussian kernel half-width as a fraction of the
// row — wide enough that one finger stroke is a meaningful α edit (the plan's
// touch-kernel constraint). BLEND is the per-frame pull of α toward the
// pointer's target angle — confessed frame-rate-dependent UI smoothing.
const BRUSH_SIGMA = 0.06
const BRUSH_BLEND = 0.22

// Meter bar: 46 px per unit of normalized energy — a display gain only; the
// printed number is the honest readout.
const BAR_PX_PER_UNIT = 46
const BAR_MAX_PX = 150

export type RegaugeStage = 'pre' | 'brush' | 'stripped'

// One clean path: the stage is dispatched ONCE into plain numbers; the draw
// handler multiplies by them and never asks "which stage am I?" again.
interface StageConfig {
  brushGain: 0 | 1 // 0 = brush holstered (pre-prediction), 1 = live
  roomAlpha: number // rope + graph + base + meters: 1 = full room, ~0.1 = stripped
  hint: string
}

const STAGES: Record<RegaugeStage, StageConfig> = {
  pre: {
    brushGain: 0,
    roomAlpha: 1,
    hint: 'both meters read the same steady wave — commit your prediction before the brush arrives',
  },
  brush: {
    brushGain: 1,
    roomAlpha: 1,
    hint: 'drag across the clocks (or tap) — the brush repaints each zero mark by α(x)',
  },
  stripped: {
    brushGain: 1,
    roomAlpha: 0.1,
    hint: 'the room and rope fade — only the clock faces and your convention remain',
  },
}

interface DragRef {
  active: boolean
  pending: boolean // set on pointerdown so a quick tap still lands one brush application
  fx: number // pointer position, fraction of the canvas
  fy: number
}

function createRegauge(cfg: StageConfig, drag: DragRef): Stepper {
  let t = 0
  const thetaPhys = new Float32Array(N) // the wave — no brush ever writes here
  const alpha = new Float32Array(N) // the gauge data — the ONLY thing the brush writes
  const label = new Float32Array(N) // θ = θ_phys + α, the plotted label
  const negAlpha = new Float32Array(N) // zero marks drawn at −α (kit convention)

  return {
    step(dt) {
      t += dt // exact solution in t — playback time, not an integrator
    },
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h)
      const [ropeLane, clockLane, graphLane] = laneSplit(w, h, [0.3, 0.42, 0.28])
      const row = clockRow(clockLane, N)

      // --- the brush: reads the pointer, writes α only ---------------------
      if (drag.active || drag.pending) {
        drag.pending = false
        const px = drag.fx * w
        const py = drag.fy * h
        const fRow = Math.max(0, Math.min(1, (px - clockLane.x0) / (clockLane.x1 - clockLane.x0)))
        // vertical offset from the clock-row centerline sets the target angle:
        // half the clock lane's height maps to ±π (generous — a drag anywhere
        // on the canvas brushes at that x, saturated at the rim)
        const half = (clockLane.y1 - clockLane.y0) * 0.5
        const target = Math.max(-1, Math.min(1, (row.cy - py) / half)) * Math.PI
        const idx = Math.round(fRow * (N - 1))
        brushField(alpha, fRow, (target - alpha[idx]) * BRUSH_BLEND * cfg.brushGain, BRUSH_SIGMA)
      }

      // --- state → render fields -------------------------------------------
      for (let i = 0; i < N; i++) {
        thetaPhys[i] = K * (i / (N - 1)) - OMEGA * t
        label[i] = thetaPhys[i] + alpha[i]
        negAlpha[i] = -alpha[i]
      }

      // --- rope lane: the visible motion, drawn from θ_phys alone ----------
      const midY = (ropeLane.y0 + ropeLane.y1) / 2
      const amp = (ropeLane.y1 - ropeLane.y0) * 0.42
      const rx = (f: number) => ropeLane.x0 + f * (ropeLane.x1 - ropeLane.x0)
      for (let i = 0; i < ROPE_SAMPLES - 1; i++) {
        const f0 = i / (ROPE_SAMPLES - 1)
        const f1 = (i + 1) / (ROPE_SAMPLES - 1)
        const th0 = K * f0 - OMEGA * t
        const th1 = K * f1 - OMEGA * t
        const depth = (Math.cos(th0) + 1) / 2 // 0 = far, 1 = near
        ctx.strokeStyle = `rgba(217,119,6,${(0.35 + 0.65 * depth) * cfg.roomAlpha})`
        ctx.lineWidth = 1.5 + depth * 1.5
        ctx.beginPath()
        ctx.moveTo(rx(f0), midY + Math.sin(th0) * amp)
        ctx.lineTo(rx(f1), midY + Math.sin(th1) * amp)
        ctx.stroke()
      }

      // --- clock lane: needles from θ_phys, zero marks from α --------------
      // Passing zeros = −α with theta = label makes the drawn needle's absolute
      // angle −(−α + θ_phys + α) = −θ_phys: the brush visibly spins the green
      // marks while the amber needles stay frozen — the contract, on screen.
      ctx.globalAlpha = cfg.roomAlpha
      drawBase(ctx, row, clockLane)
      ctx.globalAlpha = 1
      drawClocks(ctx, row, label, { zeros: negAlpha })

      // --- graph lane: the plotted label θ = θ_phys + α ---------------------
      ctx.globalAlpha = cfg.roomAlpha
      drawAngleGraph(ctx, graphLane, row, label, PALETTE.theta, 'θ(x) — the plotted needle angle')

      // --- the dual meter ----------------------------------------------------
      // Twist terms measured from the same arrays the panes draw; rate term is
      // the exact ω both share (α is time-independent). Normalized so the
      // steady wave reads 1.00.
      const dxs = 1 / (N - 1)
      const c2 = (OMEGA / K) ** 2
      let ropeE = 0
      let formulaE = 0
      for (let i = 0; i < N - 1; i++) {
        const twistPhys = (thetaPhys[i + 1] - thetaPhys[i]) / dxs
        const twistLabel = (label[i + 1] - label[i]) / dxs
        ropeE += (OMEGA * OMEGA + c2 * twistPhys * twistPhys) * dxs
        formulaE += (OMEGA * OMEGA + c2 * twistLabel * twistLabel) * dxs
      }
      ropeE /= 2 * OMEGA * OMEGA
      formulaE /= 2 * OMEGA * OMEGA

      const meter = (y: number, name: string, v: number) => {
        ctx.fillStyle = '#55606f'
        ctx.font = '12px system-ui, sans-serif'
        ctx.fillText(name, 12, y)
        const bx = 116
        ctx.fillStyle = 'rgba(85,96,111,0.18)'
        ctx.fillRect(bx, y - 9, BAR_MAX_PX, 10)
        ctx.fillStyle = '#55606f'
        ctx.fillRect(bx, y - 9, Math.min(v * BAR_PX_PER_UNIT, BAR_MAX_PX), 10)
        ctx.fillText(v.toFixed(2), bx + BAR_MAX_PX + 8, y)
      }
      meter(20, 'rope energy', ropeE)
      meter(38, 'formula energy', formulaE)
      ctx.globalAlpha = 1

      ctx.fillStyle = 'rgba(85,96,111,0.7)'
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText(cfg.hint, 12, h - 10)
    },
  }
}

export function RegaugeBrush({ stage }: { stage: RegaugeStage }) {
  const dragRef = useRef<DragRef>({ active: false, pending: false, fx: 0, fy: 0 })

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.querySelector('canvas')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const d = dragRef.current
    d.active = e.buttons > 0
    d.fx = (e.clientX - rect.left) / rect.width
    d.fy = (e.clientY - rect.top) / rect.height
    // tap-step equivalent (the plan's mobile ledger): a tap places one smooth
    // α bump at the tap point even if no draw frame runs while the button is down
    if (e.type === 'pointerdown') d.pending = true
  }

  // Same lane geometry in every stage — the stripped beat is the SAME figure
  // with the room faded (reuse-with-overlay identity, not a rebuild).
  return (
    <div
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onPointerUp={onPointer}
      style={{ touchAction: 'none' }}
    >
      <Sim height={340} create={() => createRegauge(STAGES[stage], dragRef.current)} />
    </div>
  )
}
