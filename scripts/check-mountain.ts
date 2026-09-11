import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { BASE_LINES, SUMMIT_LINES, LINE_MM, STOPS, createMountain, mountainLayout, mountainReading } from '../src/sims/PascalMountain'
let checks=0
function check(ok:boolean,text:string){assert(ok,text);console.log(`ok ${++checks}: ${text}`)}
check(BASE_LINES===315.5&&SUMMIT_LINES===278,'observations match Périer: 26 pouces 3½ lignes and 23 pouces 2 lignes')
check(BASE_LINES-SUMMIT_LINES===37.5,'reported difference is 3 pouces 1½ lignes')
check(Math.abs(LINE_MM*12-27.07)<1e-12,'approximate conversion uses the historical French inch, not the English inch')
const start=mountainReading('departure'),peak=mountainReading('summit'),back=mountainReading('return')
check(start.control===start.carried&&back.control===back.carried,'both instruments agree before departure and after returning')
check(start.control===peak.control&&peak.control===back.control,'control remains at its reported morning reading through the trip')
check(Math.abs(peak.drop-84.59375)<1e-8,'metric drop is approximately 84.6 mm')
check(Math.round(start.control)===712&&Math.round(peak.carried)===627,'Clermont and summit read about 712/627 mm, without a fictitious sea-level baseline')
check(Math.abs(peak.carried/peak.control-SUMMIT_LINES/BASE_LINES)<1e-12,'unit conversion preserves the observed column-height ratio')
mkdirSync('_figure_check/mountain',{recursive:true})
for(const w of [640,340]){
 const h=360,c=createCanvas(w,h),ctx=c.getContext('2d'),layout=mountainLayout(w,h)
 const samples: {control:number;carried:number}[]=[]
 for(const stop of STOPS){
  const s=createMountain(stop),draw=()=>{s.draw(ctx as unknown as CanvasRenderingContext2D,w,h);return Buffer.from(ctx.getImageData(0,0,w,h).data)}
  const first=draw();s.step(100)
  check(first.equals(draw()),`${w}px ${stop}: recorded data stays fixed; no invented animation/interpolation`)
  const height=(side:number)=>{
    // Sample only slate mercury inside the actual bore. Neither dashed guide
    // nor transparent glass nor labels have this color.
    let top=h
    const cx=Math.round(layout.centers[side])
    for(let y=55;y<layout.baseY;y++){
      const k=4*(cx+y*w)
      if(Math.abs(first[k]-71)<3&&Math.abs(first[k+1]-85)<3&&Math.abs(first[k+2]-105)<3){top=y;break}
    }return layout.baseY-top
  }
  const control=height(0),carried=height(1);samples.push({control,carried})
  const expected=mountainReading(stop)
  check(Math.abs(control-expected.control*layout.scale)<3&&Math.abs(carried-expected.carried*layout.scale)<3,`${w}px ${stop}: both drawn mercury columns match the recorded readings`)
  writeFileSync(`_figure_check/mountain/${w}-${stop}.png`,c.toBuffer('image/png'))
 }
 check(samples.every(p=>p.control===samples[0].control),`${w}px: control's OWN mercury pixels never move between stages`)
 check(samples[0].carried===samples[2].carried&&samples[0].carried-samples[1].carried>20,`${w}px: traveling column visibly falls at summit and returns to its starting height`)
}
console.log(`${checks} mountain checks passed`)
