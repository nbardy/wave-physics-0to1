import type { Stepper } from './Sim'

/** A real lesson figure, rendered at its original proportions for the index. */
export interface LessonPreviewSpec {
  poster: string
  width: number
  height: number
  /** A detail of the figure, without controls or instructional furniture. */
  crop?: { x: number; y: number; width: number; height: number }
  /** Seconds of the same fixed-step simulation used to make the poster. */
  warmup: number
  load: () => Promise<Stepper>
}

export const PREVIEW_DT = 1 / 60

export function previewBounds(spec: LessonPreviewSpec) {
  return spec.crop ?? { x: 0, y: 0, width: spec.width, height: spec.height }
}
