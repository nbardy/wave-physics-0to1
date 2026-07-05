import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A stepper owns its own simulation state (built fresh by `create`) and exposes
 * a pure-ish step/draw pair. The <Sim> shell owns the RAF loop and controls.
 */
export interface Stepper {
  step: (dt: number) => void
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  /** Release non-GC resources (GPU buffers). Called on Reset and unmount. */
  dispose?: () => void
}

export interface SimProps {
  height?: number
  /** Build a fresh stepper (with its own state). Called on mount and on Reset. */
  create: (width: number, height: number) => Stepper
  caption?: string
  /** Figure-specific controls (bespoke per sim — see AGENTS.md). Rendered beside Play/Reset. */
  children?: ReactNode
}

export function Sim({ height = 240, create, caption, children }: SimProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(true)
  const runningRef = useRef(running)
  runningRef.current = running
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssWidth = canvas.clientWidth || 600
    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const stepper = create(cssWidth, height)
    // Only run figures that are on screen — with dozens of live simulations on
    // one page, stepping them all murders the frame rate (measured: 8 fps).
    // Off-screen figures freeze; time resumes when they scroll back into view.
    let visible = false
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false
        last = 0 // don't integrate the time spent off-screen as one giant dt
      },
      { rootMargin: '120px' },
    )
    observer.observe(canvas)
    let raf = 0
    let last = 0
    const loop = (t: number) => {
      if (visible) {
        const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60
        last = t
        if (runningRef.current) stepper.step(dt)
        stepper.draw(ctx, cssWidth, height)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      stepper.dispose?.()
    }
    // `create` is expected to be stable (module-level fn); reset is driven by resetKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, height])

  return (
    <figure className="sim">
      <canvas ref={canvasRef} className="sim-canvas" style={{ width: '100%', height }} />
      <div className="sim-controls">
        <button type="button" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => setResetKey((k) => k + 1)}>
          Reset
        </button>
        {children}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
