import { projectToCanvas } from '../math/linear.js';
import { VERTEX_FLOATS, palette } from './geometry.js';

let sharedGpuPromise = null;

async function requestSharedGpu() {
  if (new URLSearchParams(window.location.search).has('forceCanvas')) return null;
  if (sharedGpuPromise) return sharedGpuPromise;
  sharedGpuPromise = (async () => {
    if (!('gpu' in navigator)) return null;
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return null;
    const device = await adapter.requestDevice();
    return { device, format: navigator.gpu.getPreferredCanvasFormat() };
  })().catch(() => null);
  return sharedGpuPromise;
}

function concatVertices(drawables, topology) {
  const matching = drawables.filter((drawable) => drawable.topology === topology && drawable.vertices.length > 0);
  const total = matching.reduce((sum, drawable) => sum + drawable.vertices.length, 0);
  const combined = new Float32Array(total);
  let offset = 0;
  for (const drawable of matching) {
    combined.set(drawable.vertices, offset);
    offset += drawable.vertices.length;
  }
  return combined;
}

function rgbaCss(color, alphaMultiplier = 1) {
  const r = Math.round(Math.max(0, Math.min(1, color[0])) * 255);
  const g = Math.round(Math.max(0, Math.min(1, color[1])) * 255);
  const b = Math.round(Math.max(0, Math.min(1, color[2])) * 255);
  const a = Math.max(0, Math.min(1, color[3] * alphaMultiplier));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

class CanvasFallbackRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: true });
    this.mode = 'fallback';
    this.lastSize = [0, 0];
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.lastSize = [width, height];
  }

  render(drawables, mvp) {
    this.resize();
    const { context: ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const triangles = [];
    const triangleData = concatVertices(drawables, 'triangles');
    for (let offset = 0; offset < triangleData.length; offset += VERTEX_FLOATS * 3) {
      const projected = [];
      let averageDepth = 0;
      const color = [triangleData[offset + 6], triangleData[offset + 7], triangleData[offset + 8], triangleData[offset + 9]];
      const normal = [triangleData[offset + 3], triangleData[offset + 4], triangleData[offset + 5]];
      for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
        const base = offset + vertexIndex * VERTEX_FLOATS;
        const point = [triangleData[base], triangleData[base + 1], triangleData[base + 2]];
        const screen = projectToCanvas(point, mvp, canvas.width, canvas.height);
        projected.push(screen);
        averageDepth += screen.depth / 3;
      }
      const light = Math.min(1, 0.43 + 0.57 * Math.abs(normal[0] * 0.35 + normal[1] * 0.8 + normal[2] * 0.48));
      triangles.push({ projected, averageDepth, color, light });
    }

    triangles.sort((a, b) => b.averageDepth - a.averageDepth);
    for (const triangle of triangles) {
      const [a, b, c] = triangle.projected;
      if (![a, b, c].some((point) => point.visible)) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();
      const litColor = [
        triangle.color[0] * triangle.light,
        triangle.color[1] * triangle.light,
        triangle.color[2] * triangle.light,
        triangle.color[3],
      ];
      ctx.fillStyle = rgbaCss(litColor);
      ctx.fill();
    }

    const lineData = concatVertices(drawables, 'lines');
    ctx.lineWidth = Math.max(1, (window.devicePixelRatio || 1) * 1.05);
    ctx.lineCap = 'round';
    for (let offset = 0; offset < lineData.length; offset += VERTEX_FLOATS * 2) {
      const a = projectToCanvas([lineData[offset], lineData[offset + 1], lineData[offset + 2]], mvp, canvas.width, canvas.height);
      const bBase = offset + VERTEX_FLOATS;
      const b = projectToCanvas([lineData[bBase], lineData[bBase + 1], lineData[bBase + 2]], mvp, canvas.width, canvas.height);
      if (!a.visible && !b.visible) continue;
      const color = [lineData[offset + 6], lineData[offset + 7], lineData[offset + 8], lineData[offset + 9]];
      ctx.strokeStyle = rgbaCss(color);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

class WebGpuRenderer {
  constructor(canvas, gpu) {
    this.canvas = canvas;
    this.device = gpu.device;
    this.format = gpu.format;
    this.context = canvas.getContext('webgpu');
    if (!this.context) throw new Error('This canvas does not expose a WebGPU context');
    this.mode = 'webgpu';
    this.uniformBuffer = null;
    this.bindGroup = null;
    this.triangleBuffer = null;
    this.lineBuffer = null;
    this.triangleCapacity = 0;
    this.lineCapacity = 0;
    this.depthTexture = null;
    this.size = [0, 0];
    this.createResources();
  }

  createResources() {
    const shader = this.device.createShaderModule({
      label: 'CAD primitive shader',
      code: `
        struct Uniforms { mvp : mat4x4<f32> };
        @group(0) @binding(0) var<uniform> uniforms : Uniforms;

        struct VertexInput {
          @location(0) position : vec3<f32>,
          @location(1) normal : vec3<f32>,
          @location(2) color : vec4<f32>,
        };

        struct VertexOutput {
          @builtin(position) position : vec4<f32>,
          @location(0) normal : vec3<f32>,
          @location(1) color : vec4<f32>,
        };

        @vertex
        fn vertexMain(input : VertexInput) -> VertexOutput {
          var output : VertexOutput;
          output.position = uniforms.mvp * vec4<f32>(input.position, 1.0);
          output.normal = input.normal;
          output.color = input.color;
          return output;
        }

        @fragment
        fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
          let normalLength = length(input.normal);
          var lighting = 1.0;
          if (normalLength > 0.001) {
            let light = normalize(vec3<f32>(0.35, 0.8, 0.48));
            lighting = 0.43 + 0.57 * abs(dot(normalize(input.normal), light));
          }
          return vec4<f32>(input.color.rgb * lighting, input.color.a);
        }
      `,
    });

    const vertexBuffers = [{
      arrayStride: VERTEX_FLOATS * 4,
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'float32x3' },
        { shaderLocation: 2, offset: 24, format: 'float32x4' },
      ],
    }];

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'CAD scene bind group layout',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      }],
    });
    this.pipelineLayout = this.device.createPipelineLayout({
      label: 'CAD scene pipeline layout',
      bindGroupLayouts: [this.bindGroupLayout],
    });

    const common = {
      layout: this.pipelineLayout,
      vertex: { module: shader, entryPoint: 'vertexMain', buffers: vertexBuffers },
      fragment: {
        module: shader,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          },
        }],
      },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less-equal' },
      multisample: { count: 1 },
    };

    this.trianglePipeline = this.device.createRenderPipeline({
      ...common,
      label: 'CAD triangles pipeline',
      primitive: { topology: 'triangle-list', cullMode: 'none' },
    });

    this.linePipeline = this.device.createRenderPipeline({
      ...common,
      label: 'CAD lines pipeline',
      primitive: { topology: 'line-list', cullMode: 'none' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less-equal' },
    });

    this.uniformBuffer = this.device.createBuffer({
      label: 'CAD uniforms',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(2, Math.round(rect.width * dpr));
    const height = Math.max(2, Math.round(rect.height * dpr));
    if (this.canvas.width === width && this.canvas.height === height) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.size = [width, height];
    this.context.configure({ device: this.device, format: this.format, alphaMode: 'premultiplied' });
    if (this.depthTexture) this.depthTexture.destroy();
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  ensureBuffer(kind, floatLength) {
    const byteLength = Math.max(4, floatLength * 4);
    const capacityKey = kind === 'triangles' ? 'triangleCapacity' : 'lineCapacity';
    const bufferKey = kind === 'triangles' ? 'triangleBuffer' : 'lineBuffer';
    if (this[capacityKey] >= byteLength && this[bufferKey]) return this[bufferKey];
    if (this[bufferKey]) this[bufferKey].destroy();
    const capacity = 2 ** Math.ceil(Math.log2(byteLength));
    this[bufferKey] = this.device.createBuffer({
      label: `CAD ${kind} vertices`,
      size: capacity,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this[capacityKey] = capacity;
    return this[bufferKey];
  }

  render(drawables, mvp, clearColor = palette.background) {
    this.resize();
    this.device.queue.writeBuffer(this.uniformBuffer, 0, mvp.buffer, mvp.byteOffset, 64);

    const triangles = concatVertices(drawables, 'triangles');
    const lines = concatVertices(drawables, 'lines');
    if (triangles.length) {
      const buffer = this.ensureBuffer('triangles', triangles.length);
      this.device.queue.writeBuffer(buffer, 0, triangles.buffer, triangles.byteOffset, triangles.byteLength);
    }
    if (lines.length) {
      const buffer = this.ensureBuffer('lines', lines.length);
      this.device.queue.writeBuffer(buffer, 0, lines.buffer, lines.byteOffset, lines.byteLength);
    }

    const encoder = this.device.createCommandEncoder({ label: 'CAD scene encoder' });
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: clearColor[0], g: clearColor[1], b: clearColor[2], a: clearColor[3] },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    pass.setBindGroup(0, this.bindGroup);
    if (triangles.length) {
      pass.setPipeline(this.trianglePipeline);
      pass.setVertexBuffer(0, this.triangleBuffer);
      pass.draw(triangles.length / VERTEX_FLOATS);
    }
    if (lines.length) {
      pass.setPipeline(this.linePipeline);
      pass.setVertexBuffer(0, this.lineBuffer);
      pass.draw(lines.length / VERTEX_FLOATS);
    }
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}

export async function createRenderer(canvas) {
  const gpu = await requestSharedGpu();
  if (!gpu) return new CanvasFallbackRenderer(canvas);
  try {
    return new WebGpuRenderer(canvas, gpu);
  } catch (error) {
    console.warn('WebGPU renderer initialization failed; using Canvas fallback.', error);
    return new CanvasFallbackRenderer(canvas);
  }
}
