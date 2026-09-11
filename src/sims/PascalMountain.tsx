import { useEffect, useRef, useState } from 'react'
import type { Stepper } from '../components/Sim'
import { MERCURY } from './Barometer'

// Périer's reported observations, NOT an atmospheric simulation or an invented
// continuous altitude curve. Primary source: letter to Pascal, 22 Sept 1648,
// reporting the experiment of 19 Sept. In the original units (12 lignes/pouce):
// departure and return: 26 pouces + 3.5 lignes; summit: 23 pouces + 2 lignes.
// The control in Clermont was reported unchanged throughout the day.
// Approximate metric conversion: historical French pouce = 27.07 mm (Larousse).
// Geometry uses the UNROUNDED converted observations; rounded labels carry ≈.
// No time integration, easing, or stability condition applies to recorded data.
export const LINE_MM = 27.07 / 12
export const BASE_LINES = 26 * 12 + 3.5
export const SUMMIT_LINES = 23 * 12 + 2
export const STOPS = ['departure', 'summit', 'return'] as const
export type MountainStop = typeof STOPS[number]
const LABELS: Record<MountainStop, string> = { departure: '1 · Before', summit: '2 · Summit', return: '3 · Return' }
export function mountainReading(stop: MountainStop) {
  const control = BASE_LINES * LINE_MM
  const carried = (stop === 'summit' ? SUMMIT_LINES : BASE_LINES) * LINE_MM
  return { control, carried, drop: control - carried, location: stop === 'summit' ? 'Puy-de-Dôme' : 'Clermont' }
}
export const READOUT: Record<MountainStop, string> = {
  departure: 'Before the climb, the two tubes agree. That first comparison matters: a difference at the summit will not be a difference they brought with them. Now take the traveling tube uphill.',
  summit: 'At the summit, the carried column is about 85 mm lower. The tube left in Clermont still has its morning reading. The change appears where the altitude changed. Bring the traveling tube back down to check it once more.',
  return: 'Back in Clermont, the carried column returns to its starting height and matches the control again. The instrument that gave the lower reading uphill has recovered its original reading downhill.',
}
export function mountainLayout(w: number, h: number) {
  return { baseY: h - 70, scale: (h - 142) / 800, centers: [w * 0.27, w * 0.74], bore: Math.min(25, w * 0.075) }
}
export function createMountain(stop: MountainStop = 'departure'): Stepper {
  const reading = mountainReading(stop)
  return {
    step() {},
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, w, h)
      const { baseY, scale, centers, bore } = mountainLayout(w, h)
      const Y = (mm: number) => baseY - mm * scale
      const refY = Y(reading.control), liveY = Y(reading.carried), tubeTop = Y(800)
      const font = (n: number, bold = false) => { ctx.font = `${bold ? 600 : 400} ${n}px system-ui, sans-serif` }
      // Shared datum: the instruments are aligned to compare column HEIGHTS,
      // not positioned as though Clermont and the summit occupy the same place.
      ctx.strokeStyle = '#aeb7c5'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(centers[0] - bore, refY); ctx.lineTo(centers[1] + bore, refY); ctx.stroke(); ctx.setLineDash([])
      for (let side = 0; side < 2; side++) {
        const x = centers[side], mercury = side === 0 ? reading.control : reading.carried, top = Y(mercury)
        ctx.textAlign = 'center'; ctx.fillStyle = '#303743'; font(14, true)
        ctx.fillText(side === 0 ? 'Control' : 'Traveling tube', x, 22)
        font(12); ctx.fillStyle = '#697586'; ctx.fillText(side === 0 || stop !== 'summit' ? 'Clermont' : 'Summit', x, 42)
        ctx.fillStyle = '#e9eef5'; ctx.fillRect(x - bore / 2, tubeTop, bore, baseY + 5 - tubeTop)
        ctx.fillStyle = MERCURY; ctx.fillRect(x - bore / 2, top, bore, baseY + 5 - top)
        ctx.strokeStyle = '#98a5b6'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(x - bore / 2, baseY + 5); ctx.lineTo(x - bore / 2, tubeTop); ctx.lineTo(x + bore / 2, tubeTop); ctx.lineTo(x + bore / 2, baseY + 5); ctx.stroke()
        ctx.strokeStyle = '#243144'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(x - bore / 2, top); ctx.lineTo(x + bore / 2, top); ctx.stroke()
        // Separate mercury dishes: the control stays behind, the other travels.
        const dishW = Math.min(86, w * 0.24)
        ctx.fillStyle = MERCURY; ctx.fillRect(x - dishW / 2, baseY, dishW, 15)
        ctx.strokeStyle = '#98a5b6'; ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.moveTo(x-dishW/2,baseY-5); ctx.lineTo(x-dishW/2,baseY+16); ctx.lineTo(x+dishW/2,baseY+16); ctx.lineTo(x+dishW/2,baseY-5); ctx.stroke()
        font(20, true); ctx.fillStyle = '#303743'; ctx.fillText(`≈ ${Math.round(mercury)} mm`, x, h - 19)
      }
      if (reading.drop > 0) {
        // Difference bracket refers to actual measured liquid levels, not a fake
        // "weight of air" bar programmed to equal the mercury in every state.
        const x = centers[1] + bore / 2 + 10
        ctx.strokeStyle = '#78716c'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, refY); ctx.lineTo(x, liveY)
        ctx.moveTo(x-3,refY); ctx.lineTo(x+3,refY);ctx.moveTo(x-3,liveY);ctx.lineTo(x+3,liveY);ctx.stroke()
        ctx.fillStyle = '#697586'; font(12); ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(reading.drop)} mm lower`, w / 2, (refY + liveY) / 2 + 4)
      } else {
        ctx.fillStyle = '#697586'; font(12); ctx.textAlign = 'center'
        ctx.fillText('Same height', w / 2, refY - 12)
      }
      ctx.textAlign = 'left'
    },
  }
}
export function PascalMountain() {
  const [stop, setStop] = useState<MountainStop>('departure')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const scene = createMountain(stop)
    const paint = () => {
      const w = canvas.clientWidth, h = 360, dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); scene.draw(ctx, w, h)
    }
    const observer = new ResizeObserver(paint); observer.observe(canvas); window.addEventListener('resize', paint); paint()
    return () => { observer.disconnect(); window.removeEventListener('resize', paint) }
  }, [stop])
  const reading = mountainReading(stop)
  return <>
    <figure className="sim">
      <canvas ref={canvasRef} className="sim-canvas" style={{ width: '100%', height: 360 }} role="img"
        aria-label={`Périer's recorded ${stop} observations: control in Clermont about ${Math.round(reading.control)} mm; traveling tube in ${reading.location} about ${Math.round(reading.carried)} mm.`} />
      <div className="sim-controls" role="group" aria-label="Périer experiment stages">
        {STOPS.map(stage => <button key={stage} type="button" aria-pressed={stage === stop} onClick={() => setStop(stage)}
          style={stage === stop ? { color: '#2563eb', background: '#eef4ff', borderColor: '#a8c3ff' } : undefined}>
          {LABELS[stage]}
        </button>)}
      </div>
    </figure>
    <p aria-live="polite">{READOUT[stop]}</p>
  </>
}
