import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { area, boxInflow, carry, createSolverStudy, patch, pressureVelocity, smoothLayers, studyHeight, type SolverOperation } from '../src/sims/SolverSteps'
let checks = 0
function check(ok: boolean, text: string) { assert(ok, text); console.log(`ok ${++checks}: ${text}`) }
for (const y of [0.2, 0.61]) check(Math.abs(area(patch(y, 0)) - area(patch(y, 1))) < 1e-12, `transport preserves patch area at y=${y}`)
check(carry({x:0,y:0.2},1).x > carry({x:0,y:0.61},1).x, 'upper dye travels farther in the same second')
check(patch(0.2,1)[0].x > patch(0.2,1)[3].x, 'shear tilts the material patch')
check(patch(0.2,1).every(p => p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1), 'transported patch stays fully in view')
const {before, after} = smoothLayers()
const sum = (u:Float64Array) => u.reduce((a,b)=>a+b,0)
const energy = (u:Float64Array) => u.reduce((a,b)=>a+b*b,0)
check(Math.abs(sum(before)-sum(after)) < 1e-10, 'no-flux diffusion conserves total momentum')
check(energy(after)<energy(before)*0.65, 'viscosity visibly reduces kinetic energy')
check(after.every(v => v>=-1 && v<=1), 'stable diffusion preserves velocity bounds')
check(after.every((v,i)=>Math.abs(v+after[64-i])<1e-12), 'diffusion preserves antisymmetry')
check(after[26] < 0.5 && after[26] > 0 && after[38] > -0.5 && after[38] < 0, 'neighboring opposed layers measurably slow down')
const smooth = createSolverStudy('smooth').metrics
check(smooth[1] < 0.07 * smooth[0], `largest adjacent velocity jump falls from ${smooth[0]} to ${smooth[1].toFixed(4)}`)
let divBefore = 0, divAfter = 0, curlError = 0
const e=1e-5
for (const x of [-0.3,0,0.3]) for (const y of [-0.3,0,0.3]) for (const corrected of [false,true]) {
 const dx = pressureVelocity(x+e,y,corrected), mx = pressureVelocity(x-e,y,corrected)
 const dy = pressureVelocity(x,y+e,corrected), my = pressureVelocity(x,y-e,corrected)
 const div = (dx.x-mx.x+dy.y-my.y)/(2*e)
 const curl = (dx.y-mx.y-dy.x+my.x)/(2*e)
 if(corrected) divAfter=Math.max(divAfter,Math.abs(div)); else divBefore=Math.max(divBefore,Math.abs(div+3))
 curlError=Math.max(curlError,Math.abs(curl-2))
}
check(divBefore<1e-9 && divAfter<1e-9, 'independent numerical derivatives verify pressure removes divergence -3')
check(curlError<1e-9, 'pressure correction preserves the original rotation')
check(Math.abs(boxInflow(false)-0.75)<1e-12 && Math.abs(boxInflow(true))<1e-12, 'boundary-integrated net inflow falls from 0.75 to zero')
mkdirSync('_figure_check/solver-steps',{recursive:true})
for(const w of [640,340]) {
 const h=Math.round(studyHeight(w)), canvas=createCanvas(w,h), ctx=canvas.getContext('2d')
 for(const op of ['carry','smooth','balance'] as SolverOperation[]) {
  const study=createSolverStudy(op)
  const draw=()=>{study.draw(ctx as unknown as CanvasRenderingContext2D,w,h);return Buffer.from(ctx.getImageData(0,0,w,h).data)}
  const first=draw(); study.step(100)
  check(first.equals(draw()), `${w}px ${op}: no hidden playback; computed comparison stays fixed`)
  writeFileSync(`_figure_check/solver-steps/${w}-${op}.png`,canvas.toBuffer('image/png'))
  const stacked=w<520, pw=stacked?w:(w-16)/2, ph=stacked?(h-16)/2:h
  const fw=pw-24, fh=ph-76
  const paneOffset=(side:number)=>({x:stacked?0:side*(pw+16),y:stacked?side*(ph+16):0})
  const points=(side:number,rgb:number[],yMin=0,yMax=1)=>{
    const o=paneOffset(side), out:{x:number;y:number}[]=[]
    for(let y=Math.ceil(o.y+36+yMin*fh);y<o.y+36+yMax*fh;y++) for(let x=Math.ceil(o.x+12);x<o.x+pw-12;x++){
      const k=4*(x+y*w)
      if(rgb.every((v,c)=>Math.abs(first[k+c]-v)<10))out.push({x:x-o.x-12,y:y-o.y-36})
    }return out
  }
  if(op==='carry'){
    const shift=(rgb:number[])=>{const centroid=(side:number)=>{const p=points(side,rgb);return p.reduce((sum,q)=>sum+q.x,0)/p.length};return centroid(1)-centroid(0)}
    const amberShift=shift([217,119,6]),pinkShift=shift([219,39,119])
    check(amberShift>fw*0.3&&pinkShift>fw*0.14&&amberShift>pinkShift*1.7,`${w}px: rendered amber patch travels farther than pink`)
  }
  if(op==='smooth'){
    const y=0.07+0.86*5/12, far=(side:number)=>Math.max(...points(side,[37,99,235],y-3/fh,y+3/fh).map(p=>p.x))
    check(far(0)-far(1)>fw*0.18,`${w}px: rendered near-middle velocity arrow visibly shortens`)
  }
  // Specific figure ink inside field panes, excluding all labels/furniture.
  let blue=0, amber=0, pink=0
  for(let y=36;y<h-38;y++) for(let x=12;x<w-12;x++) {
   const k=4*(x+y*w); const match=(r:number,g:number,b:number)=>Math.abs(first[k]-r)<10 && Math.abs(first[k+1]-g)<10 && Math.abs(first[k+2]-b)<10
   if(match(37,99,235)) blue++
   if(match(217,119,6)) amber++
   if(match(219,39,119)) pink++
  }
  check(blue>100 && (op!=='carry'||(amber>100&&pink>100)),`${w}px ${op}: visible quantity-specific arrows and dye`)
 }
}
console.log(`${checks} solver-step checks passed`)
