import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createExchange, EXCHANGE_DT } from '../src/sims/MomentumExchange'
import { createSound, gasState, GAMMA } from '../src/sims/SoundRace'
import { createCascade, advanceEnergy, CASCADE_DT } from '../src/sims/WhorlsCascade'
import { PALETTE } from '../src/sims/lib/palette'
let checks=0
function check(ok:boolean,label:string){assert(ok,label);console.log(`ok ${++checks}: ${label}`)}
const sum=(a:number[])=>a.reduce((a,b)=>a+b,0)
const energy=(a:number[])=>sum(a.map(x=>x*x))
const difference=(a:number[],b:number[])=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
const iso=gasState(0,false),adi=gasState(0,true)
check(iso.pressure===adi.pressure&&iso.temperature===adi.temperature,'uncompressed specimens have identical pressure and temperature')
check(Math.abs(adi.speed/iso.speed-Math.sqrt(1.4))<1e-12,'thermal assumption alone recovers the Newton/Laplace speed ratio')
check(Math.abs(1-iso.speed/adi.speed-.154845745)<1e-8,'uncompressed isothermal prediction is about 15.5 percent low')
for(const c of [.1,.25,.4]){
 const cold=gasState(c,false),hot=gasState(c,true)
 check(Math.abs(cold.pressure*cold.volume-1)<1e-12&&Math.abs(hot.pressure*hot.volume**GAMMA-1)<1e-12,`${c}: both compression states obey their respective gas laws`)
 check(cold.temperature===273.15&&hot.temperature>cold.temperature&&hot.pressure>cold.pressure,`${c}: retaining heat raises temperature and restoring pressure`)
 check(Math.abs(cold.speed-iso.speed)<1e-10&&hot.speed>adi.speed,`${c}: isothermal sound speed stays fixed; warming increases adiabatic speed`)
}
const delta=1e-6
check(Math.abs((gasState(delta,true).pressure-1)/(gasState(delta,false).pressure-1)-GAMMA)<1e-6,'independent small-compression slopes recover the bulk-modulus ratio')
const no=createExchange(0),weak=createExchange(.002),strong=createExchange(.04),initial=no.measure().u
for(let i=0;i<720;i++){no.step(EXCHANGE_DT);weak.step(EXCHANGE_DT);strong.step(EXCHANGE_DT)}
check(difference(no.measure().u,initial)===0,'zero coupling preserves every layer velocity')
check(Math.abs(sum(strong.measure().u))<1e-11,'closed layers conserve total signed momentum')
check(energy(strong.measure().u)<energy(weak.measure().u)&&energy(weak.measure().u)<energy(initial),'stronger coupling dissipates more relative kinetic energy')
check(strong.measure().u.every((v,i)=>Math.abs(v+strong.measure().u[47-i])<1e-12),'equal and opposite layers slow symmetrically')
check(Math.abs(strong.measure().u[20])<.3&&Math.abs(weak.measure().u[20])>.4,'coupling extremes visibly separate near the seam')
strong.kick();check(difference(strong.measure().u,initial)===0&&strong.measure().time===0,'kick starts a fresh matched comparison')
const cadence=createExchange(.012),reference=createExchange(.012)
for(let i=0;i<30;i++)cadence.step(1/30)
for(let i=0;i<60;i++)reference.step(1/60)
check(difference(cadence.measure().u,reference.measure().u)===0,'momentum diffusion is independent of caller cadence')
const cascade=createCascade(.025)
for(let i=0;i<720;i++)cascade.step(CASCADE_DT)
const budget=cascade.measure()
for(const [i,l] of budget.lanes.entries())check(Math.abs(sum(l.energy)+l.heat-budget.input)<1e-12&&l.energy.every(v=>v>=0),`cascade lane ${i}: every supplied unit remains in motion or heat`)
check(budget.lanes[1].heat>budget.lanes[0].heat+.3,'transfer produces a large visible increase in dissipation at six seconds')
check(Math.abs(budget.lanes[0].energy[0]-Math.exp(-.025*6))<1e-12,'uncoupled large scale matches exact exponential viscous decay')
cascade.inject();check(cascade.measure().input===2&&cascade.measure().lanes.every(l=>Math.abs(sum(l.energy)+l.heat-2)<1e-12),'another push adds equal energy to both budgets')
let lossless={energy:new Float64Array([1,0,0,0,0]),heat:0}
for(let i=0;i<1200;i++)lossless=advanceEnergy(lossless.energy,lossless.heat,0,true)
check(lossless.heat===0&&Math.abs(sum(Array.from(lossless.energy))-1)<1e-12&&lossless.energy[4]>.9,'transfer alone conserves energy and accumulates it at the resolved cutoff')
const low=createCascade(.002),high=createCascade(.08),thirty=createCascade(.025),sixty=createCascade(.025)
for(let i=0;i<720;i++){low.step(CASCADE_DT);high.step(CASCADE_DT)}
check(high.measure().lanes[1].heat>low.measure().lanes[1].heat+.25,'viscous-loss endpoints give substantially different energy budgets')
for(let i=0;i<30;i++)thirty.step(1/30)
for(let i=0;i<60;i++)sixty.step(1/60)
check(difference(thirty.measure().lanes[1].energy,sixty.measure().lanes[1].energy)===0,'cascade budget is independent of caller cadence')
mkdirSync('_figure_check/followups',{recursive:true})
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
for(const w of [640,340]){
 for(const kind of ['sound','exchange','cascade'] as const){
  const h=kind==='sound'?424:kind==='exchange'?408:426,c=createCanvas(w,h),ctx=c.getContext('2d')
  const s=kind==='sound'?createSound(.4):kind==='exchange'?createExchange(.04):createCascade(.025)
  s.step(kind==='cascade'?4:kind==='exchange'?2:0)
  const draw=()=>{s.draw(ctx as unknown as CanvasRenderingContext2D,w,h);return Buffer.from(ctx.getImageData(0,0,w,h).data)}
  const pixels=draw();check(pixels.equals(draw()),`${w}px ${kind}: draw is pure`)
  const ownInk=(color:string,x0:number,y0:number,x1:number,y1:number)=>{
   const col=rgb(color);let count=0
   for(let y=Math.ceil(y0);y<y1;y++)for(let x=Math.ceil(x0);x<x1;x++){const k=4*(x+y*w);if(col.every((v,j)=>Math.abs(pixels[k+j]-v)<5))count++}
   return count
  }
  if(kind==='sound'){
   const cold=ownInk(PALETTE.vel,12,202,w/2-12,214),hot=ownInk(PALETTE.dye,w/2+12,202,w-12,214)
   check(hot>cold*1.4&&cold>100,`${w}px sound: hotter gas has a visibly larger pressure-rise bar on the same scale`)
  }else if(kind==='exchange'){
   // Velocity arrows are blue (the article's key) since 2026-09-23; the dye colours stay on the markers.
   const top=ownInk(PALETTE.vel,w*.62,28,w,174),bottom=ownInk(PALETTE.vel,w*.62,232,w,378)
   check(top>bottom*1.3&&bottom>50,`${w}px exchange: actual velocity arrows shorten in the coupled specimen`)
  }else{
   const top=ownInk(PALETTE.visc,14,178,w-14,187),bottom=ownInk(PALETTE.visc,14,391,w-14,400)
   check(bottom>top*2&&top>50,`${w}px cascade: actual heat strip is larger with interscale transfer`)
  }
  writeFileSync(`_figure_check/followups/${w}-${kind}.png`,c.toBuffer('image/png'))
 }
}
console.log(`${checks} history follow-up checks passed`)
