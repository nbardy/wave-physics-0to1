import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'

export const CASCADE_DT=1/120, SCALES=5
const TRANSFER=[.7,1,1.4,2,0]
// Explicitly a FIVE-COMPARTMENT ENERGY MODEL, not a velocity-field simulation.
// E_i' = incoming - (a_i + d_i) E_i; H' = sum d_i E_i.
// d_i = damping * 4^i represents the k² dependence of viscous energy decay.
// Transfer rates are chosen for legibility, not fitted to turbulence data.
// Per fixed tick, exponentially remove each bin's outgoing amount and allocate
// it to the next bin and heat in the rate ratio. Positivity and E+H conservation
// hold for any timestep; simultaneous incoming flux makes this first-order in dt.
export function advanceEnergy(energy:Float64Array,heat:number,damping:number,transfer:boolean,dt=CASCADE_DT){
  const next=energy.slice()
  for(let i=0;i<SCALES;i++){
    const a=transfer?TRANSFER[i]:0,d=damping*4**i,rate=a+d
    if(rate===0)continue
    const outgoing=energy[i]*(-Math.expm1(-rate*dt))
    next[i]-=outgoing
    if(i+1<SCALES)next[i+1]+=outgoing*a/rate
    heat+=outgoing*d/rate
  }
  return {energy:next,heat}
}
export function createCascade(damping=.025):Stepper & { inject():void; measure():{time:number;input:number;lanes:{energy:number[];heat:number}[]} } {
  let lanes=[{energy:new Float64Array([1,0,0,0,0]),heat:0},{energy:new Float64Array([1,0,0,0,0]),heat:0}]
  let time=0,acc=0,input=1
  return {
    inject(){input++;lanes.forEach(l=>l.energy[0]++)},
    measure(){return{time,input,lanes:lanes.map(l=>({energy:Array.from(l.energy),heat:l.heat}))}},
    step(dt){acc+=dt;while(acc+1e-12>=CASCADE_DT){lanes=lanes.map((l,i)=>advanceEnergy(l.energy,l.heat,damping,i===1));time+=CASCADE_DT;acc-=CASCADE_DT}},
    draw(ctx,w,h){
      ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)
      for(let pane=0;pane<2;pane++){
        const y=pane*213, lane=lanes[pane],pad=14,slot=(w-2*pad)/SCALES,bw=slot*.63,base=y+145
        ctx.fillStyle='#303743';ctx.font='600 13px system-ui';ctx.fillText(pane?'Transfer to smaller scales':'No transfer between scales',pad,y+20)
        ctx.fillStyle='#f7f9fc';ctx.fillRect(pad,y+36,w-2*pad,110)
        for(let i=0;i<SCALES;i++){
          const x=pad+slot*(i+.5)-bw/2,share=lane.energy[i]/input
          ctx.fillStyle='#e6ecf3';ctx.fillRect(x,y+47,bw,98)
          ctx.fillStyle=PALETTE.dye;ctx.fillRect(x,base-98*share,bw,98*share)
          ctx.textAlign='center';ctx.fillStyle='#475569';ctx.font='12px system-ui';ctx.fillText(i?`L/${2**i}`:'L',x+bw/2,base+17)
          ctx.fillStyle='#303743';ctx.font='11px system-ui';ctx.fillText(`${Math.round(share*100)}%`,x+bw/2,y+42)
          if(i<4&&pane){ctx.fillStyle='#94a3b8';ctx.fillText('→',pad+slot*(i+1),y+96)}
        }
        ctx.textAlign='left';ctx.fillStyle='#e6ecf3';ctx.fillRect(pad,y+178,w-2*pad,9)
        ctx.fillStyle=PALETTE.visc;ctx.fillRect(pad,y+178,(w-2*pad)*lane.heat/input,9)
        ctx.font='12px system-ui';ctx.fillText(`Heat ${Math.round(lane.heat/input*100)}%`,pad,y+204)
        ctx.textAlign='right';ctx.fillStyle='#64748b';ctx.fillText(`Motion ${Math.round((input-lane.heat)/input*100)}%`,w-pad,y+204);ctx.textAlign='left'
      }
    },
  }
}
export function WhorlsCascade(){
  const [damping,setDamping]=useState(.025),api=useRef<ReturnType<typeof createCascade>|null>(null)
  return <div className="history-experiment" role="group" aria-label="Simplified energy budget with and without transfer between scales">
    <Sim resetToken={damping} height={426} create={()=>{const s=createCascade(damping);api.current=s;return s}}>
      <button onClick={()=>api.current?.inject()}>Add a large-scale push</button>
      <label className="sim-slider"><span>viscous loss</span><input aria-label="Cascade viscous loss" type="range" min="0.002" max="0.08" step="0.001" value={damping} onChange={e=>setDamping(+e.target.value)}/><span>stronger</span></label>
    </Sim>
  </div>
}
