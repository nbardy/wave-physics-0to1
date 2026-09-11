import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createPredictionLab, flowPanels } from '../src/sims/FlowPrediction'
import { VorticityFlow, VX, VY, LX, VDT, VISCOSITY, fft2 } from '../src/sims/history/vorticity'
let checks=0
function check(ok:boolean,label:string){assert(ok,label);console.log(`ok ${++checks}: ${label}`)}
const max=(a:ArrayLike<number>)=>Array.from(a).reduce((m,x)=>Math.max(m,Math.abs(x)),0)
const error=(a:ArrayLike<number>,b:ArrayLike<number>)=>max(Array.from(a,(x,i)=>x-b[i]))
const n=VX*VY,r=Float64Array.from({length:n},(_,i)=>Math.sin(i*.123)+Math.cos(i*.081)),im=Float64Array.from(r,x=>x*.31),r0=r.slice(),i0=im.slice()
fft2(r,im);fft2(r,im,true)
check(error(r,r0)<1e-12&&error(im,i0)<1e-12,'rectangular complex FFT round trip preserves both components')
const mode=new VorticityFlow(false),kx=2*Math.PI/LX,ky=4*Math.PI,k2=kx*kx+ky*ky
const expectedU=new Float64Array(n),expectedV=new Float64Array(n)
for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
 const k=x+y*VX,phase=kx*x*LX/VX+ky*y/VY
 mode.omega[k]=Math.sin(phase)
 expectedU[k]=ky*Math.cos(phase)/k2;expectedV[k]=-kx*Math.cos(phase)/k2
}
mode.rebuild()
check(error(mode.u,expectedU)<1e-12&&error(mode.v,expectedV)<1e-12,'analytic oblique Fourier mode produces the correct signed velocity in both directions')
const ur=mode.u.slice(),ui=new Float64Array(n),vr=mode.v.slice(),vi=new Float64Array(n)
fft2(ur,ui);fft2(vr,vi)
let divergence=0
for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
 const k=x+y*VX,ax=2*Math.PI*(x<VX/2?x:x-VX)/LX,ay=2*Math.PI*(y<VY/2?y:y-VY)
 divergence=Math.max(divergence,Math.hypot(ax*ur[k]+ay*vr[k],ax*ui[k]+ay*vi[k])/n)
}
check(divergence<1e-12,'reconstructed grid velocity has zero spectral divergence')
const shear=new VorticityFlow(false)
for(let y=0;y<VY;y++)for(let x=0;x<VX;x++)shear.omega[x+y*VX]=Math.sin(2*Math.PI*y/VY)
shear.rebuild();const initial=shear.omega.slice()
for(let i=0;i<120;i++)shear.step()
check(error(shear.omega,Float64Array.from(initial,x=>x*Math.exp(-VISCOSITY*4*Math.PI**2*2)))<1e-10,'unidirectional shear matches exact viscous decay over two seconds (advection vanishes)')
const forced=new VorticityFlow(false);forced.push(1,.5,.6,0)
check(forced.u[VX/2+VY/2*VX]>.1,'a rightward stroke produces a rightward central response')
check(Math.abs(forced.omega.reduce((a,b)=>a+b,0)/n)<1e-12,'localized forcing preserves the periodic zero-circulation constraint')
const lab=createPredictionLab(),start=lab.measure(),half=start.positions.length/2
check(error(start.positions.slice(0,half),start.positions.slice(half))===0,'both panels start with identical material markers')
lab.addDye();const dyed=lab.measure()
check(error(start.live,dyed.live)===0&&error(start.frozen,dyed.frozen)===0,'adding dye alone leaves both velocity fields unchanged')
check(dyed.count===start.count+260&&error(dyed.positions.slice(24,48),dyed.positions.slice(72,96))===0,'new dye occupies identical positions in both panels')
lab.push();const pushed=lab.measure()
check(error(dyed.frozen,pushed.frozen)===0&&error(dyed.live,pushed.live)>.1,'stirring changes the evolving flow while the frozen reference is unchanged')
for(let i=0;i<720;i++)lab.step(VDT)
const evolved=lab.measure()
check(Math.abs(evolved.time-12)<1e-10&&evolved.count===pushed.count,'motion continues past the former eight-second reset without reseeding')
check(evolved.live.every(Number.isFinite)&&max(evolved.live)<5,'stirred flow remains finite after twelve seconds')
check(error(evolved.frozen,start.frozen)===0&&evolved.fieldChange>.05,'initial velocity is retained only in the frozen reference')
check(error(evolved.positions.slice(0,48),evolved.positions.slice(48))>.1,'material trajectories visibly separate between the two models')
check(error(createPredictionLab().measure().live,start.live)===0,'Reset builds the same fresh physical state')
const fast=createPredictionLab(),slow=createPredictionLab()
for(let i=0;i<60;i++)fast.step(1/60)
for(let i=0;i<20;i++)slow.step(1/20)
check(error(fast.measure().live,slow.measure().live)===0&&error(fast.measure().positions,slow.measure().positions)===0,'20Hz and 60Hz callers produce identical physics and material trajectories')
mkdirSync('_figure_check/prediction',{recursive:true})
for(const w of [640,340]){
 const h=w+72,c=createCanvas(w,h),ctx=c.getContext('2d'),s=createPredictionLab()
 const draw=()=>{s.draw(ctx as unknown as CanvasRenderingContext2D,w,h);return Buffer.from(ctx.getImageData(0,0,w,h).data)}
 const before=draw()
 for(let i=0;i<240;i++)s.step(VDT)
 const after=draw()
 check(after.equals(draw()),`${w}px: drawing is pure`)
 for(const [pane,p] of flowPanels(w).entries()){
  let amber=0,rose=0,moved=0
  for(let y=p.y;y<p.y+p.h;y++)for(let x=0;x<w;x++){
   const k=4*(x+y*w),r=after[k],g=after[k+1],b=after[k+2]
   // Hue-specific probes exclude the slate title and pale background.
   if(r>g+30&&g>b+25)amber++
   if(r>g+50&&b>g+15)rose++
   if(Math.abs(after[k]-before[k])+Math.abs(after[k+1]-before[k+1])+Math.abs(after[k+2]-before[k+2])>70)moved++
  }
  check(amber>w*3&&rose>w*3,`${w}px pane ${pane}: both dye species visibly occupy the field`)
  check(moved>w*10,`${w}px pane ${pane}: actual colored trails move and deform`)
 }
 writeFileSync(`_figure_check/prediction/${w}-evolving.png`,c.toBuffer('image/png'))
}
console.log(`${checks} prediction checks passed`)
