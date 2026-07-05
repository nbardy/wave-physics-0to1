// GPU replacement for SolverRenderer: instead of colormapping at *grid*
// resolution into 8-bit ImageData and letting drawImage stretch it (bilinear
// diamonds, banding), a fragment shader samples the float dye field per
// *display* pixel and applies the color ramp after interpolation. Same
// palette bytes as solver.ts's renderer — background → amber, wall gray,
// divergence violet.
//
// The pass renders into an offscreen WebGPU canvas which the Stepper's 2-D
// draw() blits with drawImage — the <Sim> shell and its 2-D overlays (Re
// label, captions) stay untouched.

import { PALETTE } from '../palette'
import type { FluidSolverGPU } from './solver_gpu'

function hexToVec3(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  return `vec3f(${r.toFixed(5)}, ${g.toFixed(5)}, ${b.toFixed(5)})`
}

export type Overlay = 'none' | 'divergence'

export class DyeRendererGPU {
  readonly canvas: HTMLCanvasElement
  private readonly gpuCtx: GPUCanvasContext
  private readonly pipeline: GPURenderPipeline
  private readonly uni: GPUBuffer
  private readonly uniData = new Float32Array(4)

  constructor(
    private readonly device: GPUDevice,
    private readonly solver: FluidSolverGPU,
    widthPx: number,
    heightPx: number,
  ) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = Math.max(1, Math.floor(widthPx))
    this.canvas.height = Math.max(1, Math.floor(heightPx))
    const ctx = this.canvas.getContext('webgpu')
    if (!ctx) throw new Error('webgpu canvas context unavailable despite a live device')
    this.gpuCtx = ctx
    const format = navigator.gpu.getPreferredCanvasFormat()
    this.gpuCtx.configure({ device, format, alphaMode: 'opaque' })

    this.uni = device.createBuffer({
      size: this.uniData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // Non-sRGB canvas format: fragment outputs are stored as raw bytes, so
    // these are the exact 0–255 values SolverRenderer writes, divided by 255.
    const code = /* wgsl */ `
      const NX: f32 = ${solver.nx}.0;
      const NY: f32 = ${solver.ny}.0;
      const BG = vec3f(${(247 / 255).toFixed(5)}, ${(249 / 255).toFixed(5)}, ${(252 / 255).toFixed(5)});
      const DYE = ${hexToVec3(PALETTE.dye)};
      const WALL = ${hexToVec3(PALETTE.wall)};
      const DIV = ${hexToVec3(PALETTE.div)};

      struct Uni { mode: f32, div_gain: f32, pad0: f32, pad1: f32 }
      @group(0) @binding(0) var<uniform> U: Uni;
      @group(0) @binding(1) var<storage, read> dye: array<f32>;
      @group(0) @binding(2) var<storage, read> solid: array<u32>;
      @group(0) @binding(3) var<storage, read> div: array<f32>;

      fn cell(i: u32, j: u32) -> u32 { return i + j * u32(NX); }

      fn bilerp(field: u32, x: f32, y: f32) -> f32 {
        // field: 0 = dye, 1 = div — WGSL can't pass storage arrays around
        let cx = clamp(x, 0.0, NX - 1.001);
        let cy = clamp(y, 0.0, NY - 1.001);
        let i0 = u32(floor(cx));
        let j0 = u32(floor(cy));
        let tx = cx - f32(i0);
        let ty = cy - f32(j0);
        let i1 = min(i0 + 1u, u32(NX) - 1u);
        let j1 = min(j0 + 1u, u32(NY) - 1u);
        var a: f32; var b: f32; var c: f32; var d: f32;
        if (field == 0u) {
          a = dye[cell(i0, j0)]; b = dye[cell(i1, j0)];
          c = dye[cell(i0, j1)]; d = dye[cell(i1, j1)];
        } else {
          a = div[cell(i0, j0)]; b = div[cell(i1, j0)];
          c = div[cell(i0, j1)]; d = div[cell(i1, j1)];
        }
        return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
      }

      struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f }

      @vertex fn vs(@builtin(vertex_index) vi: u32) -> VOut {
        // fullscreen triangle; uv.y flipped so grid row 0 is the top
        let xy = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
        var out: VOut;
        out.pos = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
        out.uv = vec2f(xy.x, 1.0 - xy.y);
        return out;
      }

      @fragment fn fs(in: VOut) -> @location(0) vec4f {
        let gx = in.uv.x * NX - 0.5;
        let gy = in.uv.y * NY - 0.5;
        // walls sample nearest — a crisp disc edge is the honest shape
        let si = u32(clamp(round(gx), 0.0, NX - 1.0));
        let sj = u32(clamp(round(gy), 0.0, NY - 1.0));
        if (solid[cell(si, sj)] != 0u) { return vec4f(WALL, 1.0); }
        let t = clamp(bilerp(0u, gx, gy), 0.0, 1.0);
        var rgb = mix(BG, DYE, t);
        if (U.mode == 1.0) {
          let dv = min(abs(bilerp(1u, gx, gy)) * U.div_gain, 1.0);
          rgb = mix(rgb, DIV, dv);
        }
        return vec4f(rgb, 1.0);
      }
    `

    const module = device.createShaderModule({ label: 'dye-render', code })
    this.pipeline = device.createRenderPipeline({
      label: 'dye-render',
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    })
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, overlay: Overlay) {
    this.uniData[0] = overlay === 'divergence' ? 1 : 0
    // |∇·u| in grid units scales with resolution (u is in cells/s); this gain
    // keeps the violet meter reading like the CPU reference (gain 6 at nx=144)
    this.uniData[1] = 6 * (144 / this.solver.nx)
    this.device.queue.writeBuffer(this.uni, 0, this.uniData as BufferSource)

    const enc = this.device.createCommandEncoder({ label: 'dye-render' })
    const pass = enc.beginRenderPass({
      colorAttachments: [
        {
          view: this.gpuCtx.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          storeOp: 'store',
        },
      ],
    })
    pass.setPipeline(this.pipeline)
    // built per draw: the dye pair swaps buffers every solver step
    pass.setBindGroup(
      0,
      this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.uni } },
          { binding: 1, resource: { buffer: this.solver.dye.cur } },
          { binding: 2, resource: { buffer: this.solver.solidBuf } },
          { binding: 3, resource: { buffer: this.solver.div } },
        ],
      }),
    )
    pass.draw(3)
    pass.end()
    this.device.queue.submit([enc.finish()])
    ctx.drawImage(this.canvas, 0, 0, w, h)
  }

  destroy() {
    this.uni.destroy()
    this.gpuCtx.unconfigure()
  }
}
