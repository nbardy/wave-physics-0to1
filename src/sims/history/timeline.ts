import type { Stepper } from '../../components/Sim'
import { createHistoryFlow, type EraKind, type HistoryFlow } from './flow'

export const ERAS: { year: number; kind: EraKind; name: string }[] = [
  { year: 1687, kind: 'newton', name: 'Newton' },
  { year: 1757, kind: 'euler', name: 'Euler / d’Alembert' },
  { year: 1822, kind: 'navier', name: 'Navier' },
  { year: 1845, kind: 'stokes', name: 'Stokes' },
  { year: 1883, kind: 'reynolds', name: 'Reynolds' },
  { year: 1904, kind: 'prandtl', name: 'Prandtl' },
]

export function timelineMix(position: number) {
  const p = Math.max(0, Math.min(ERAS.length - 1, position))
  const left = Math.floor(p), right = Math.min(left + 1, ERAS.length - 1)
  return { left, right, alpha: p - left }
}

export function timelinePresentation(position: number) {
  const { left, right, alpha } = timelineMix(position)
  // At the midpoint the later era takes the normal-color role. The less
  // prominent era is cyan on either side; at a notch no comparison is drawn.
  const base = alpha < .5 ? left : right
  const comparison = alpha === 0 ? null : alpha < .5 ? right : left
  return { base, comparison, comparisonAlpha: Math.min(alpha, 1 - alpha) }
}

// A view blend, not an interpolation of physical laws or Reynolds numbers.
// Each era owns its state and fixed physics timestep. Scrubbing selects cached
// states without rebuilding the Sim, its input, or any solver mid-gesture.
export function createTimeline(
  position: { current: number },
  createFlow: (kind: EraKind, comparison: () => boolean) => Stepper & Partial<Pick<HistoryFlow, 'markWake'>> = createHistoryFlow,
): Stepper & { markWake: () => void } {
  const flows = ERAS.map((era, i) => createFlow(era.kind,
    () => timelinePresentation(position.current).comparison === i))
  const layers = [document.createElement('canvas'), document.createElement('canvas')]
  const contexts = layers.map(layer => layer.getContext('2d')!)
  return {
    markWake() {
      const { left, right, alpha } = timelineMix(position.current)
      flows[left].markWake?.()
      if (alpha > 0 && right !== left) flows[right].markWake?.()
    },
    step(dt) {
      const { left, right, alpha } = timelineMix(position.current)
      flows[left].step(dt)
      if (alpha > 0 && right !== left) flows[right].step(dt)
    },
    draw(ctx, width, height) {
      const { base, comparison, comparisonAlpha } = timelinePresentation(position.current)
      // Match the output backing resolution, including Retina displays.
      const transform = ctx.getTransform()
      const scale = Math.max(1, Math.hypot(transform.a, transform.b))
      const render = (index: number, layer: number) => {
        const canvas = layers[layer], context = contexts[layer]
        const w = Math.ceil(width * scale), h = Math.ceil(height * scale)
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
        context.setTransform(scale, 0, 0, scale, 0, 0)
        context.clearRect(0, 0, width, height)
        context.save()
        flows[index].draw(context, width, height)
        context.restore()
      }
      render(base, 0)
      if (comparison !== null) render(comparison, 1)
      // Child renderers change globalAlpha internally and paint backgrounds.
      // Composite normal-colored base plus the tinted comparison. Existing
      // opacity weights are preserved as their color roles swap at midpoint.
      ctx.save()
      ctx.globalAlpha = 1
      ctx.drawImage(layers[0], 0, 0, width, height)
      if (comparison !== null) {
        ctx.globalAlpha = comparisonAlpha
        ctx.drawImage(layers[1], 0, 0, width, height)
      }
      ctx.restore()
    },
    dispose() { for (const flow of flows) flow.dispose?.() },
  }
}
