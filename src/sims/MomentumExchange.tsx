import { useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

export const EXCHANGE_ROWS = 48, EXCHANGE_DT = 1 / 240
const DY = 1 / EXCHANGE_ROWS
// Closed, equal-mass layers: zero normal gradient at both outer edges.
// FTCS diffusion number <= .04 / 240 * 48² = .384 < 1/2.
// Each face transfers equal and opposite momentum; no external drive.
export function createExchange(nu = .012): Stepper & { measure(): { u: number[]; time: number }; kick(): void } {
  if (nu < 0 || nu > .04) throw new RangeError('Exchange viscosity must lie in [0, .04]')
  const u = new Float64Array(EXCHANGE_ROWS), next = u.slice()
  const marks = [new Float64Array(EXCHANGE_ROWS), new Float64Array(EXCHANGE_ROWS)]
  let time = 0, acc = 0
  const kick = () => { time = 0; acc = 0; for (let i = 0; i < u.length; i++) u[i] = i < u.length / 2 ? 1 : -1; marks.forEach(m => m.fill(0)) }
  kick()
  return {
    kick, measure: () => ({ u: Array.from(u), time }),
    step(dt) {
      acc += dt
      while (acc + 1e-12 >= EXCHANGE_DT) {
        const a = nu * EXCHANGE_DT / DY ** 2
        for (let i = 0; i < u.length; i++) next[i] = u[i] + a * ((u[i-1] ?? u[i]) + (u[i+1] ?? u[i]) - 2*u[i])
        u.set(next)
        for (let i = 0; i < u.length; i++) {
          marks[0][i] += (i < u.length/2 ? 1 : -1) * EXCHANGE_DT * .2
          marks[1][i] += u[i] * EXCHANGE_DT * .2
        }
        time += EXCHANGE_DT; acc -= EXCHANGE_DT
      }
    },
    draw(ctx, w, h) {
      ctx.clearRect(0,0,w,h); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h)
      for (let pane = 0; pane < 2; pane++) {
        const top = pane * 204 + 28, height = 146, mid = top + height/2
        ctx.font = '600 13px system-ui'; ctx.fillStyle = '#303743'
        ctx.fillText(pane ? 'Viscosity exchanges momentum' : 'No exchange between layers', 10, top-10)
        ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0,top,w,height)
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([3,4]); ctx.beginPath(); ctx.moveTo(6,mid); ctx.lineTo(w-6,mid); ctx.stroke(); ctx.setLineDash([])
        const profileX = w*.78, span = w*.16
        ctx.strokeStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(profileX,top+4); ctx.lineTo(profileX,top+height-4); ctx.stroke()
        for (let i = 1; i < u.length; i += 3) {
          const speed = pane ? u[i] : i < u.length/2 ? 1 : -1
          const y = top+(i+.5)/u.length*height, color = i < u.length/2 ? PALETTE.dye : PALETTE.dye2
          ctx.fillStyle = color
          for (let j = 0; j < 7; j++) { const x = (((marks[pane][i]+j/7)%1+1)%1)*(w*.53)+8; ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill() }
          const end = profileX+span*speed
          // Velocity is blue in this article's key; the dye colours stay on the markers.
          ctx.strokeStyle = PALETTE.vel; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(profileX,y); ctx.lineTo(end,y)
          if (Math.abs(speed) > .03) { const d=Math.sign(speed); ctx.moveTo(end-d*4,y-3);ctx.lineTo(end,y);ctx.lineTo(end-d*4,y+3) } ctx.stroke()
        }
        ctx.fillStyle = '#64748b'; ctx.font = '12px system-ui'
        ctx.fillText('← left',w*.63,top+height+17);ctx.textAlign='right';ctx.fillText('right →',w-8,top+height+17);ctx.textAlign='left'
      }
    },
  }
}
export function MomentumExchange() {
  const [nu, setNu] = useState(.012)
  return <div className="history-experiment" role="group" aria-label="Momentum exchange between matched layers">
    <Sim resetToken={nu} resetLabel="Kick layers apart" height={408} create={()=>createExchange(nu)}>
      <label className="sim-slider"><span>no coupling</span><input aria-label="Layer viscosity" type="range" min="0" max="0.04" step="0.001" value={nu} onChange={e=>setNu(+e.target.value)}/><span>strong</span></label>
    </Sim>
  </div>
}
