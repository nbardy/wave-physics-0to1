// WebGPU device acquisition — availability is a typed sum, not a silent
// fallback (RULE T4). Callers dispatch on `kind` exactly once, at sim
// creation; downstream code never re-asks "do we have a GPU?".

export type GpuContext =
  | { kind: 'ready'; device: GPUDevice }
  | { kind: 'unavailable'; reason: string }

let cached: Promise<GpuContext> | null = null

/** One adapter/device per page, shared by every GPU sim. */
export function acquireGpu(): Promise<GpuContext> {
  if (!cached) cached = probe()
  return cached
}

async function probe(): Promise<GpuContext> {
  if (!('gpu' in navigator)) {
    return { kind: 'unavailable', reason: 'this browser has no WebGPU (navigator.gpu missing)' }
  }
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    return { kind: 'unavailable', reason: 'WebGPU present but requestAdapter() returned null' }
  }
  const device = await adapter.requestDevice()
  // A lost device (driver reset, tab backgrounded too long on some OSes) must
  // not leave a dead device cached forever — next acquire re-probes.
  device.lost.then(() => {
    cached = null
  })
  return { kind: 'ready', device }
}
