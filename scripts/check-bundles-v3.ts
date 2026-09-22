import assert from 'node:assert/strict'
import { mkdirSync,writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createABBanner } from '../src/sims/bundles-v3/ABBanner'
import { screenIntensity,endpointIntensity,routePhase } from '../src/sims/bundles-v3/model'
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-12)
near(screenIntensity(0,0),1);near(screenIntensity(0,.5),0);near(screenIntensity(0,1),1)
for(const f of [-1,-.3,0,.3,.5,1])for(const g of [-3,0,3])for(const s of [-1,-.4,0,.7,1]){
  near(screenIntensity(s,f),endpointIntensity(s,f,g))
  near(screenIntensity(s,f),screenIntensity(s,f+1))
  near(routePhase(1,1,f,g)-routePhase(1,-1,f,g),2*Math.PI*f)
}
mkdirSync('_figure_check/bundles-v3',{recursive:true})
for(const w of [340,1000]) {
  const canvas=createCanvas(w,485),c=canvas.getContext('2d')
  const p={current:{flux:.3,gauge:0}},fig=createABBanner(p,true)
  const draw=()=>fig.draw(c as unknown as CanvasRenderingContext2D,w,485)
  draw();const first=canvas.toBuffer('image/png');draw();assert.deepEqual(first,canvas.toBuffer('image/png'))
  writeFileSync(`_figure_check/bundles-v3/ab-${w}.png`,first)
  const region=()=>w<600?c.getImageData(32,317,w-64,90).data:c.getImageData(760,103,142,246).data
  const original=region();p.current.gauge=3;draw();assert.deepEqual(original,region(),'detector invariant under regauge')
  p.current.flux=0;draw();const zero=region();p.current.flux=.5;draw();assert.notDeepEqual(zero,region(),'half quantum shifts the actual detector bands')
  p.current.flux=1;draw();assert.deepEqual(zero,region(),'full quantum restores detector')
  const core=c.getImageData(Math.round(w<600?w*.49:w*.36)-10,Math.round(w<600?152:228)-10,20,20).data
  assert.ok(core.some((v,i)=>i%4===2&&v>70),'violet flux core visible')
}
console.log('AB V3 passed: phase limits, periodicity, gauge cancellation, detector pixels, draw purity, 340px / 1000px rendering.')
