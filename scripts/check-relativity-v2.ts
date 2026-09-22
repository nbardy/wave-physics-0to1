import { strict as assert } from 'node:assert'
import { mkdirSync,writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { orbit,advanceOrbit,measuredAdvance,mercuryAdvance,triangleTransport,tidalSeparation,arcLength,cartesianArcLength,MERCURY_E } from '../src/sims/relativity-v2/model'
import { createMetricCoordinates,createSphericalTransport,createTidalFall,createMercuryOrbit } from '../src/sims/relativity-v2'
import type { Stepper } from '../src/components/Sim'
let count=0;
function check(ok:boolean,message:string){assert(ok,message);count++;console.log(`ok ${message}`)}
for(const r of [.6,1.6,2.5]){
 let length=0;const a=Math.PI/3,n=10000;
 for(let i=0;i<n;i++)length+=Math.hypot(r*Math.cos(a*(i+1)/n)-r*Math.cos(a*i/n),r*Math.sin(a*(i+1)/n)-r*Math.sin(a*i/n));
 check(Math.abs(length-arcLength(r,a))<2e-8,`Cartesian polygon length matches polar integral, r=${r}`)
 check(Math.abs(cartesianArcLength(r,a)-arcLength(r,a))<1e-7,`displayed Cartesian quadrature agrees with polar analytic r=${r}`)
 const coarseError=arcLength(r,a)-cartesianArcLength(r,a,128),fineError=arcLength(r,a)-cartesianArcLength(r,a,256);
 check(Math.abs(coarseError/fineError-4)<.001,`Cartesian quadrature converges quadratically r=${r}`)
}
for(const angle of [15,70,110]){const t=triangleTransport(angle*Math.PI/180);check(Math.abs(t.angle-angle*Math.PI/180)<1e-12,`transport equals spherical excess ${angle}°`);t.vectors.forEach((v,i)=>{check(Math.abs(Math.hypot(...v)-1)<1e-12,`transport preserves length at vertex ${i}`);check(Math.abs(v.reduce((s,x,j)=>s+x*t.vertices[i][j],0))<1e-12,`vector tangent at vertex ${i}`)})}
check(tidalSeparation(0,3)===1,'uniform field maintains separation');
const h=1e-4,t=2,k=.18;
check(Math.abs((tidalSeparation(k,t+h)-2*tidalSeparation(k,t)+tidalSeparation(k,t-h))/h**2-k*tidalSeparation(k,t))<1e-7,'tidal trajectory satisfies differential equation');
check(mercuryAdvance()>42.97&&mercuryAdvance()<43,'Mercury physical prediction independent of demo scale');
for(const mu of [0,.0001,.002,.004]){const s=orbit(mu);for(let i=0;i<70000;i++)advanceOrbit(s);const m=measuredAdvance(s)!;const firstOrder=6*Math.PI*mu/(1-MERCURY_E**2);check(mu===0?Math.abs(m)<1e-8:Math.abs(m/firstOrder-1)<.04,`numerical precession agrees with weak-field prediction μ=${mu}: ${m}`)}
const fine=orbit(.004),coarse=orbit(.004);for(let i=0;i<70000;i++){advanceOrbit(coarse);advanceOrbit(fine,.001);advanceOrbit(fine,.001)}check(Math.abs(measuredAdvance(fine)!-measuredAdvance(coarse)!)<1e-8,'RK4 step-halving convergence at maximum strength');
const out='_figure_check/relativity-v2';mkdirSync(out,{recursive:true});
function render(name:string,s:Stepper,w:number,h:number){const canvas=createCanvas(w,h),c=canvas.getContext('2d');s.draw(c as unknown as CanvasRenderingContext2D,w,h);const a=canvas.toBuffer('image/png');s.draw(c as unknown as CanvasRenderingContext2D,w,h);check(a.equals(canvas.toBuffer('image/png')),`${name} pure draw`);writeFileSync(`${out}/${name}.png`,a);return c.getImageData(0,0,w,h).data}
for(const w of [342,380,638,720]){
 for(const r of [.6,2.5])render(`metric-${w}-${r}`,createMetricCoordinates({current:r}),w,w<500?510:330);
 for(const a of [15,110])render(`sphere-${w}-${a}`,createSphericalTransport({current:a}),w,w<500?520:350);
 const extents:number[]=[];
 for(const t of [0,3]){const data=render(`tidal-${w}-${t}`,createTidalFall({current:t}),w,w<500?520:330);const ys:number[]=[];for(let y=w<500?285:45;y<(w<500?475:280);y++)for(let x=w<500?0:w/2;x<w;x++){const i=(y*w+x)*4;if(Math.abs(data[i]-217)<8&&Math.abs(data[i+1]-119)<8&&Math.abs(data[i+2]-6)<8)ys.push(y)}extents.push(Math.max(...ys)-Math.min(...ys))}
 check(extents[1]>extents[0]*1.5,`tidal amber specimen visibly stretches at ${w}px`);
 const s=createMercuryOrbit({current:.004});for(let i=0;i<240;i++)s.step(1/60);render(`orbit-${w}`,s,w,w<500?540:360);
}
// Identical fixed-angle physics for different RAF subdivisions.
const a=createMercuryOrbit({current:.002}),b=createMercuryOrbit({current:.002});for(let i=0;i<120;i++)a.step(1/60);for(let i=0;i<240;i++)b.step(1/120);
const aa=render('cadence-a',a,720,540),bb=render('cadence-b',b,720,540);check(Buffer.from(aa).equals(Buffer.from(bb)),'orbit independent of animation frame cadence');
console.log(`${count} relativity-v2 checks passed`)
