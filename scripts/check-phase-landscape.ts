import { strict as assert } from 'node:assert'
import { mkdirSync,writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createPhaseLandscape,phaseLandscapeSample,phaseLandscapeLink } from '../src/sims/bundles-v3/PhaseLandscape'
let checks=0
function ok(v:boolean,s:string){assert(v,s);checks++;console.log('ok',s)}
for(const g of [0,1.5,3])for(let i=0;i<8;i++){
 const x=i/8,y=(i+1)/8,s=phaseLandscapeSample(x,1.2,g),d=phaseLandscapeLink(x,y,1.2,g)
 ok(Math.abs(s.coordinatePhase+s.zeroAngle-s.phase)<1e-12,`same physical phasor ${g},${i}`)
 ok(Math.abs(d.covariantDifference-d.originalDifference)<1e-12,`covariant difference invariant ${g},${i}`)
}
const dir='_figure_check/phase-landscape';mkdirSync(dir,{recursive:true})
function render(w:number,mode:'fibers'|'gauge',value:number){const h=mode==='fibers'?370:690,c=createCanvas(w,h),ctx=c.getContext('2d'),s=createPhaseLandscape({current:value},mode);s.draw(ctx as unknown as CanvasRenderingContext2D,w,h);const image=c.toBuffer('image/png');s.draw(ctx as unknown as CanvasRenderingContext2D,w,h);ok(image.equals(c.toBuffer('image/png')),'pure draw');writeFileSync(`${dir}/${mode}-${w}-${value}.png`,image);return ctx.getImageData(0,0,w,h).data}
for(const w of [340,1000]){
 const a=render(w,'fibers',-3),b=render(w,'fibers',3);let moved=0;for(let i=0;i<a.length;i+=4)if(a[i]===217&&a[i+1]===119&&a[i+2]===6&&(b[i]!==217||b[i+1]!==119||b[i+2]!==6))moved++
 ok(moved>100,'section amber moves under phase gradient')
 const c=render(w,'gauge',0),d=render(w,'gauge',3);let blueChanges=0,amberChanges=0;
 // Compare selected phasors/section in second scene, excluding numeric labels.
 for(let y=350;y<535;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;
  if(c[i]===37&&c[i+1]===99&&c[i+2]===235&&(d[i]!==37||d[i+1]!==99||d[i+2]!==235))blueChanges++
  if(c[i]===217&&c[i+1]===119&&c[i+2]===6&&(d[i]!==217||d[i+1]!==119||d[i+2]!==6))amberChanges++
 }
 ok(blueChanges>30,'blue reference zeros move');ok(amberChanges===0,'amber physical section unchanged')
}
console.log(`${checks} phase landscape checks passed`)
