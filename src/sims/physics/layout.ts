import { useEffect, useRef, useState, type RefObject } from 'react'

/** Measure the canvas itself so paired figures can stack in a narrow column. */
export function usePhysicsWidth(): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const canvas = ref.current?.querySelector('canvas')
    if (!canvas) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}
