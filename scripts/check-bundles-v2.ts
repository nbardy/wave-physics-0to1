import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { createFiberSection, createPhaseInterference, createGaugeLinks, createLoopFlux, createMaxwellWave } from '../src/sims/bundles-v2'
import { gaugeSample, intensity, loopSample, createMaxwellModel, pulse, WAVE_LENGTH, WAVE_N } from '../src/sims/bundles-v2/model'
const near = (a:number,b:number,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`)
near(intensity(0),1);near(intensity(Math.PI),0);near(intensity(Math.PI/2),.5)
for(const g of [0,.7,2,3]) {
  const base=gaugeSample(0),changed=gaugeSample(g)
  base.covariant.forEach((v,i)=>near(v,changed.covariant[i]))
  if(g) assert.ok(Math.abs(base.naive[0]-changed.naive[0])>.1)
  for(const flux of [0,Math.PI,2*Math.PI])near(loopSample(flux,g).phase,flux)
}
const m=createMaxwellModel(),n=createMaxwellModel()
for(let i=0;i<120;i++)m.advance(1/60)
for(let i=0;i<60;i++)n.advance(1/30)
assert.deepEqual(m.read(),n.read())
const d=m.read()
let err=0
d.e.forEach((v,i)=>{near(v,d.b[i]);err+=Math.pow(v-pulse(i*WAVE_LENGTH/WAVE_N-2),2)})
assert.ok(Math.sqrt(err/WAVE_N)<.003,'Maxwell pulse should advect two length units')
const energy=(a:Float64Array)=>a.reduce((s,v)=>s+v*v,0)
near(energy(d.e),energy(createMaxwellModel().read().e),1e-5)
mkdirSync('_figure_check/bundles-v2',{recursive:true})
function region(make:()=>ReturnType<typeof createFiberSection>,x:number,y:number,w:number,h:number) {
  const canvas=createCanvas(380,395),ctx=canvas.getContext('2d')
  make().draw(ctx as unknown as CanvasRenderingContext2D,380,395)
  return ctx.getImageData(x,y,w,h).data
}
// Inspect the changing quantity itself, keeping guide lines and labels out.
assert.notDeepEqual(region(()=>createFiberSection({current:-1}),75,45,40,160),region(()=>createFiberSection({current:1}),75,45,40,160))
assert.notDeepEqual(region(()=>createPhaseInterference({current:0}),202,174,165,7),region(()=>createPhaseInterference({current:Math.PI}),202,174,165,7))
assert.deepEqual(region(()=>createGaugeLinks({current:0}),190,311,166,7),region(()=>createGaugeLinks({current:3}),190,311,166,7))
assert.notDeepEqual(region(()=>createGaugeLinks({current:0}),12,311,166,7),region(()=>createGaugeLinks({current:3}),12,311,166,7))
assert.deepEqual(region(()=>createLoopFlux({current:Math.PI/2},{current:0}),202,342,166,7),region(()=>createLoopFlux({current:Math.PI/2},{current:2}),202,342,166,7))
assert.notDeepEqual(region(()=>createLoopFlux({current:0},{current:2}),202,342,166,7),region(()=>createLoopFlux({current:Math.PI},{current:2}),202,342,166,7))
const figures=[
  ['fiber',()=>createFiberSection({current:1}),250],
  ['phase',()=>createPhaseInterference({current:Math.PI}),280],
  ['gauge',()=>createGaugeLinks({current:3}),390],
  ['loop',()=>createLoopFlux({current:Math.PI/2},{current:2}),395],
  ['maxwell',createMaxwellWave,330],
] as const
for(const [name,make,h] of figures)for(const w of [720,380]) {
  const sim=make(),canvas=createCanvas(w,h),ctx=canvas.getContext('2d')
  const draw=()=>sim.draw(ctx as unknown as CanvasRenderingContext2D,w,h)
  if(name==='maxwell')for(let i=0;i<120;i++)sim.step(1/60)
  draw();const before=canvas.toBuffer('image/png');draw()
  assert.deepEqual(before,canvas.toBuffer('image/png'),'draw must not evolve state')
  const pixels=ctx.getImageData(0,0,w,h).data
  const colors=name==='fiber'?[[217,119,6],[148,163,184]]:name==='maxwell'?[[220,38,38],[8,145,178]]:[[124,58,237],[37,99,235]]
  for(const color of colors) {
    let count=0
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>180&&color.every((v,k)=>Math.abs(v-pixels[i+k])<15))count++
    assert.ok(count>30,`${name} missing quantity ${color}`)
  }
  writeFileSync(`_figure_check/bundles-v2/${name}-${w}.png`,before)
}
console.log('Bundles V2: analytic interference, local gauge invariance, loop invariance, Maxwell propagation/energy, cadence independence, draw purity, desktop/mobile quantity ink passed.')
