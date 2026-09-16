import { useEffect, useRef, useState } from 'react'
import { PREVIEW_DT, previewBounds, type LessonPreviewSpec } from './previewSpec'
import type { Stepper } from './Sim'

/** Posters cost no simulation work. Only a hovered/focused, visible row runs. */
export function LessonPreview({ id, spec, active }: {
  id: string
  spec: LessonPreviewSpec
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const syncRef = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  const bounds = previewBounds(spec)

  useEffect(() => {
    setReady(false)
    const canvas = canvasRef.current!
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const bounds = previewBounds(spec)
    let figure: Stepper | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let loading = false
    let failed = false
    let painted = false
    let disposed = false
    let visible = false
    let raf = 0
    let last = 0
    let acc = 0
    let warmup = Math.round(spec.warmup / PREVIEW_DT)

    const canRun = () => !disposed && visible && activeRef.current
      && document.visibilityState === 'visible' && !motion.matches

    const draw = () => {
      ctx!.save()
      figure!.draw(ctx!, spec.width, spec.height)
      ctx!.restore()
    }

    const frame = (now: number) => {
      raf = 0
      if (!canRun() || !figure || !ctx) return
      if (warmup > 0) {
        // Yield while establishing the poster's state; a fluid pre-roll must
        // not lock up scrolling. Keep the image visible until it is ready.
        const deadline = performance.now() + 6
        do {
          figure.step(PREVIEW_DT)
          warmup--
        } while (warmup > 0 && performance.now() < deadline)
        last = 0
      } else {
        // Fixed physics ticks even when RAF runs at 30/60/120 Hz. Cap catch-up
        // after a stall; hidden/off-screen/idle time is never integrated.
        acc += last ? Math.min((now - last) / 1000, 0.05) : 0
        while (acc >= PREVIEW_DT) {
          figure.step(PREVIEW_DT)
          acc -= PREVIEW_DT
        }
        last = now
      }
      if (warmup === 0) {
        draw()
        if (!painted) { painted = true; setReady(true) }
      }
      raf = requestAnimationFrame(frame)
    }

    const sync = () => {
      if (!canRun()) {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
        acc = 0
        return
      }
      if (figure) {
        if (!raf) raf = requestAnimationFrame(frame)
      } else if (!loading && !failed) {
        loading = true
        spec.load().then(created => {
          if (disposed) { created.dispose?.(); return }
          figure = created
          const scale = Math.min(window.devicePixelRatio || 1, 2)
          canvas.width = Math.round(bounds.width * scale)
          canvas.height = Math.round(bounds.height * scale)
          ctx = canvas.getContext('2d')
          if (!ctx) { figure.dispose?.(); figure = null; failed = true; return }
          ctx.scale(scale, scale)
          ctx.translate(-bounds.x, -bounds.y)
          sync()
        }).catch(error => {
          // The still remains a usable link if the optional animation fails.
          failed = true
          console.warn(`Lesson preview unavailable: ${id}`, error)
        })
      }
    }
    syncRef.current = sync
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false
      sync()
    })
    observer.observe(canvas)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      figure?.dispose?.()
      syncRef.current = () => {}
    }
  }, [id, spec])

  useEffect(() => { syncRef.current() }, [active])

  return (
    <span className={`lesson-preview${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <img src={spec.poster} alt=""
        width={bounds.width} height={bounds.height} loading="lazy" decoding="async" />
      <canvas ref={canvasRef} />
    </span>
  )
}
