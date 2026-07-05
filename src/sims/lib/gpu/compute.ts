// Micro-lib for compute-shader fields: storage buffers that play the role
// Float32Array plays in lib/solver.ts, plus a thin kernel wrapper.
//
// The design mirrors the CPU solver's buffer discipline exactly: a field that
// gets a read-everything/write-everything pass (advection, Jacobi sweeps) is a
// *pair* of buffers whose roles swap — the same `const swap = dye; dye = next`
// move, expressed as two GPUBuffers. Nothing here is a history; nobody ever
// reads state older than one pass.

export function f32Buffer(device: GPUDevice, n: number, init?: Float32Array): GPUBuffer {
  const buf = device.createBuffer({
    size: n * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  })
  if (init) device.queue.writeBuffer(buf, 0, init as BufferSource)
  return buf
}

export function u32Buffer(device: GPUDevice, data: Uint32Array): GPUBuffer {
  const buf = device.createBuffer({
    size: data.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(buf, 0, data as BufferSource)
  return buf
}

/** A ping-pong pair: `cur` is the live field, `alt` is scratch for the next pass. */
export class FieldPair {
  cur: GPUBuffer
  alt: GPUBuffer
  constructor(device: GPUDevice, n: number, init?: Float32Array) {
    this.cur = f32Buffer(device, n, init)
    this.alt = f32Buffer(device, n, init)
  }
  swap() {
    const t = this.cur
    this.cur = this.alt
    this.alt = t
  }
}

/**
 * A compute kernel: WGSL in, dispatchable pipeline out. Bindings are
 * positional (@binding(0), @binding(1), …) in the order passed to `bind`.
 * Bind groups are built per dispatch — measured cheap at this scale, and it
 * keeps the call sites readable (the whole point of this port).
 */
export class Kernel {
  private pipeline: GPUComputePipeline
  constructor(
    private device: GPUDevice,
    code: string,
    label: string,
  ) {
    this.pipeline = device.createComputePipeline({
      label,
      layout: 'auto',
      compute: { module: device.createShaderModule({ label, code }), entryPoint: 'main' },
    })
  }

  /** Encode one dispatch covering an x×y grid at @workgroup_size(8,8). */
  run(pass: GPUComputePassEncoder, buffers: GPUBuffer[], x: number, y: number) {
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(
      0,
      this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: buffers.map((buffer, binding) => ({ binding, resource: { buffer } })),
      }),
    )
    pass.dispatchWorkgroups(Math.ceil(x / 8), Math.ceil(y / 8))
  }
}

/** Read a storage buffer back to the CPU (tests and diagnostics only — never the frame path). */
export async function readBack(device: GPUDevice, src: GPUBuffer, n: number): Promise<Float32Array> {
  const staging = device.createBuffer({
    size: n * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })
  const enc = device.createCommandEncoder()
  enc.copyBufferToBuffer(src, 0, staging, 0, n * 4)
  device.queue.submit([enc.finish()])
  await staging.mapAsync(GPUMapMode.READ)
  const out = new Float32Array(staging.getMappedRange().slice(0))
  staging.unmap()
  staging.destroy()
  return out
}
