// Field-renderer kit — the shared instruments of the lesson (PLAN §2):
// analytic flow fields, arrow grids (Eulerian view), drifting markers with
// ghost trails (Lagrangian view), and speed-as-color maps.
// All fields take normalized coordinates x,y ∈ [0,1] and return velocity in
// normalized units per second. Renderers scale to canvas pixels.

import { PALETTE } from './palette'

export interface Vec2 {
  x: number
  y: number
}

/** A prescribed velocity field: (x, y ∈ [0,1], t seconds) → normalized velocity. */
export type FlowField = (x: number, y: number, t: number) => Vec2

// ---------------------------------------------------------------- fields

/** Steady uniform stream to the right. */
export function uniformField(speed: number): FlowField {
  return () => ({ x: speed, y: 0 })
}

/** Solid-body-ish vortex about the center, falling off outside radius r0. */
export function vortexField(strength: number, r0 = 0.35): FlowField {
  return (x, y) => {
    const dx = x - 0.5
    const dy = y - 0.5
    const r = Math.hypot(dx, dy) + 1e-6
    const fall = Math.exp(-((r / r0) ** 2))
    const s = (strength * fall) / r
    return { x: -dy * s * r, y: dx * s * r }
  }
}

/** Horizontal shear: fast on top, slow below. */
export function shearField(fast: number, slow: number): FlowField {
  return (_x, y) => ({ x: slow + (fast - slow) * (1 - y), y: 0 })
}

/**
 * A gently gusty breeze — sum of drifting sinusoids. Divergence-free by
 * construction (built from a streamfunction), so it's an honest incompressible
 * flow, not a random wiggle.
 */
export function breezeField(base: number, gust: number): FlowField {
  // streamfunction ψ(x,y,t); u = ∂ψ/∂y, v = -∂ψ/∂x (computed analytically)
  return (x, y, t) => {
    const u =
      base +
      gust *
        (Math.cos(4 * y * Math.PI + t * 0.9) * 0.6 +
          Math.cos(7 * y * Math.PI - t * 0.6 + x * 5) * 0.4)
    const v =
      gust *
      (Math.sin(5 * x * Math.PI - t * 0.7) * 0.25 +
        Math.sin(3 * x * Math.PI + t * 1.1 + y * 4) * 0.2)
    return { x: u, y: v }
  }
}

// ---------------------------------------------------------------- arrows

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  dx: number,
  dy: number,
  color: string,
) {
  const len = Math.hypot(dx, dy)
  if (len < 1.5) return
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(px + dx, py + dy)
  ctx.stroke()
  // head
  const hx = dx / len
  const hy = dy / len
  ctx.beginPath()
  ctx.moveTo(px + dx + hx * 4, py + dy + hy * 4)
  ctx.lineTo(px + dx - hy * 3 - hx * 1, py + dy + hx * 3 - hy * 1)
  ctx.lineTo(px + dx + hy * 3 - hx * 1, py + dy - hx * 3 - hy * 1)
  ctx.closePath()
  ctx.fill()
}

export function drawArrowGrid(
  ctx: CanvasRenderingContext2D,
  field: FlowField,
  t: number,
  w: number,
  h: number,
  spacing = 34,
  scale = 60,
  color: string = PALETTE.vel,
) {
  for (let py = spacing / 2; py < h; py += spacing) {
    for (let px = spacing / 2; px < w; px += spacing) {
      const v = field(px / w, py / h, t)
      drawArrow(ctx, px, py, v.x * scale, v.y * scale, color)
    }
  }
}

// ---------------------------------------------------------------- markers

const TRAIL = 40 // ghost-trail length in samples

/**
 * Drifting markers with ghost trails — parcels light enough to instantly match
 * the local flow. Markers that leave the frame respawn on the inflow side.
 */
export class MarkerSystem {
  xs: Float32Array
  ys: Float32Array
  trail: Float32Array // ring buffer [n][TRAIL][2]
  head = 0
  n: number

  constructor(n: number, seed = 1) {
    this.n = n
    this.xs = new Float32Array(n)
    this.ys = new Float32Array(n)
    this.trail = new Float32Array(n * TRAIL * 2)
    // deterministic scatter (mulberry32) so Reset reproduces the figure
    let s = seed
    const rand = () => {
      s |= 0
      s = (s + 0x6d2b79f5) | 0
      let z = Math.imul(s ^ (s >>> 15), 1 | s)
      z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296
    }
    for (let i = 0; i < n; i++) {
      this.xs[i] = rand()
      this.ys[i] = rand()
      for (let k = 0; k < TRAIL; k++) {
        this.trail[(i * TRAIL + k) * 2] = this.xs[i]
        this.trail[(i * TRAIL + k) * 2 + 1] = this.ys[i]
      }
    }
  }

  step(dt: number, field: FlowField, t: number) {
    this.head = (this.head + 1) % TRAIL
    for (let i = 0; i < this.n; i++) {
      const v = field(this.xs[i], this.ys[i], t)
      this.xs[i] += v.x * dt
      this.ys[i] += v.y * dt
      // respawn on exit — re-enter from the left at the same height band
      if (this.xs[i] > 1.02 || this.xs[i] < -0.02 || this.ys[i] > 1.02 || this.ys[i] < -0.02) {
        this.xs[i] = this.xs[i] > 1.02 ? -0.01 : Math.min(Math.max(this.xs[i], 0), 1)
        if (this.ys[i] > 1.02) this.ys[i] = 0
        if (this.ys[i] < -0.02) this.ys[i] = 1
        for (let k = 0; k < TRAIL; k++) {
          this.trail[(i * TRAIL + k) * 2] = this.xs[i]
          this.trail[(i * TRAIL + k) * 2 + 1] = this.ys[i]
        }
      }
      this.trail[(i * TRAIL + this.head) * 2] = this.xs[i]
      this.trail[(i * TRAIL + this.head) * 2 + 1] = this.ys[i]
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, withTrails = true, color: string = PALETTE.dye) {
    if (withTrails) {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      for (let i = 0; i < this.n; i++) {
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        let started = false
        for (let k = 1; k < TRAIL; k++) {
          const idx = (i * TRAIL + ((this.head + k) % TRAIL)) * 2
          const tx = this.trail[idx] * w
          const ty = this.trail[idx + 1] * h
          if (!started) {
            ctx.moveTo(tx, ty)
            started = true
          } else ctx.lineTo(tx, ty)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = color
    for (let i = 0; i < this.n; i++) {
      ctx.beginPath()
      ctx.arc(this.xs[i] * w, this.ys[i] * h, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// ---------------------------------------------------------------- speed map

/**
 * Speed as color — brighter blue = faster flow, background where still.
 * Rendered at low resolution into an offscreen canvas, scaled up smooth.
 */
export class SpeedMap {
  private off: HTMLCanvasElement
  private img: ImageData
  private res: { nx: number; ny: number }

  constructor(nx = 96, ny = 60) {
    this.res = { nx, ny }
    this.off = document.createElement('canvas')
    this.off.width = nx
    this.off.height = ny
    this.img = new ImageData(nx, ny)
  }

  draw(
    ctx: CanvasRenderingContext2D,
    field: FlowField,
    t: number,
    w: number,
    h: number,
    maxSpeed: number,
  ) {
    const { nx, ny } = this.res
    const d = this.img.data
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const v = field((i + 0.5) / nx, (j + 0.5) / ny, t)
        const s = Math.min(Math.hypot(v.x, v.y) / maxSpeed, 1)
        const k = (j * nx + i) * 4
        // background #f7f9fc → velocity blue #2563eb
        d[k] = 247 + (37 - 247) * s
        d[k + 1] = 249 + (99 - 249) * s
        d[k + 2] = 252 + (235 - 252) * s
        d[k + 3] = 255
      }
    }
    const octx = this.off.getContext('2d')
    if (!octx) return
    octx.putImageData(this.img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(this.off, 0, 0, w, h)
  }
}
