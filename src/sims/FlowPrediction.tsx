import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Sim, type Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
import { LX, VDT, VorticityFlow, sample, wrap } from './history/vorticity'
const COLORS=[PALETTE.dye,PALETTE.dye2]
interface Tracer {x:number;y:number;color:number;trail:{x:number;y:number}[]}
export interface PredictionLab extends Stepper {
 stir(x:number,y:number,dx:number,dy:number):void
 addDye(x?:number,y?:number):void
 push():void
 measure():{time:number;count:number;fieldChange:number;frozen:Float64Array;live:Float64Array;positions:number[]}
}
export function flowPanels(w:number){return [{x:0,y:28,w,h:w/2},{x:0,y:w/2+64,w,h:w/2}]}
export function createPredictionLab():PredictionLab{
 const live=new VorticityFlow(),frozenU=live.u.slice(),frozenV=live.v.slice()
 const sets:[Tracer[],Tracer[]]=[[],[]]
 let time=0,acc=0,serial=0
 // Bound rendering cost when stirring for a long time; retire the oldest
 // markers only. This never resets or forces the underlying fluid.
 const insert=(x:number,y:number,color:number)=>{for(const set of sets){if(set.length>=6500)set.shift();set.push({x:wrap(x,2),y:wrap(y,1),color,trail:[]})}}
 // Dense material bands, not a blurred Eulerian dye bitmap. Positions are the
 // same in both panes; only the velocity used to advance them differs.
 for(let j=0;j<34;j++)for(let i=0;i<110;i++)insert((i+0.5+(j%2)*0.25)*2/110,(j+0.5)/34,j<17?0:1)
 const addDye=(x=1,y=0.5)=>{
  for(let i=0;i<260;i++){
   const a=i*2.399963229728653,r=0.07*Math.sqrt((i+0.5)/260)
   insert(x+r*Math.cos(a),y+r*Math.sin(a),serial%2)
  }serial++
 }
 const api:PredictionLab={
  addDye,
  stir(x,y,dx,dy){live.push(x,y,dx*18,dy*18);for(let i=0;i<16;i++)insert(x+(i%4-1.5)*0.007,y+(Math.floor(i/4)-1.5)*0.007,serial%2);serial++},
  push(){live.push(1,0.5,0.6,0);addDye(1,0.5)},
  measure(){let delta=0;for(let k=0;k<live.u.length;k++)delta+=(live.u[k]-frozenU[k])**2+(live.v[k]-frozenV[k])**2;return{time,count:sets[0].length,fieldChange:Math.sqrt(delta/live.u.length),frozen:frozenU.slice(),live:live.u.slice(),positions:sets.flatMap(s=>[...s.slice(0,12),...s.slice(-12)].flatMap(p=>[p.x,p.y]))}},
  step(dt){acc+=dt;while(acc+1e-12>=VDT){
   live.step();time+=VDT
   for(let pane=0;pane<2;pane++){
    const u=pane===0?frozenU:live.u,v=pane===0?frozenV:live.v
    for(const p of sets[pane]){
     p.trail.push({x:p.x,y:p.y});if(p.trail.length>9)p.trail.shift()
     const mx=p.x+VDT*sample(u,p.x,p.y)/2,my=p.y+VDT*sample(v,p.x,p.y)/2
     p.x=wrap(p.x+VDT*sample(u,mx,my),LX);p.y=wrap(p.y+VDT*sample(v,mx,my),1)
    }
   }acc-=VDT
  }},
  draw(ctx,w,h){
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)
   const panels=flowPanels(w)
   for(let pane=0;pane<2;pane++){
    const box=panels[pane]
    ctx.fillStyle='#303743';ctx.font='600 13px system-ui, sans-serif'
    ctx.fillText(pane===0?'A drawing: flow held fixed':'A prediction: flow evolves',10,box.y-10)
    ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip()
    ctx.fillStyle='#f7f9fc';ctx.fillRect(box.x,box.y,box.w,box.h)
    const X=(x:number)=>box.x+x/LX*box.w,Y=(y:number)=>box.y+y*box.h
    for(let color=0;color<2;color++){
     ctx.strokeStyle=COLORS[color];ctx.globalAlpha=0.48;ctx.lineWidth=1.15;ctx.beginPath()
     for(const p of sets[pane])if(p.color===color){
      let old=p.trail[0];if(!old)continue;ctx.moveTo(X(old.x),Y(old.y))
      for(let i=1;i<p.trail.length;i++){const q=p.trail[i];if(Math.abs(q.x-old.x)>1||Math.abs(q.y-old.y)>.5)ctx.moveTo(X(q.x),Y(q.y));else ctx.lineTo(X(q.x),Y(q.y));old=q}
      if(Math.abs(p.x-old.x)<1&&Math.abs(p.y-old.y)<.5)ctx.lineTo(X(p.x),Y(p.y))
     }ctx.stroke()
     ctx.fillStyle=COLORS[color];ctx.globalAlpha=0.8;ctx.beginPath()
     for(const p of sets[pane])if(p.color===color){ctx.moveTo(X(p.x)+0.8,Y(p.y));ctx.arc(X(p.x),Y(p.y),0.8,0,Math.PI*2)}ctx.fill()
    }
    ctx.restore()
   }
  },
 }
 return api
}
export function FlowPrediction(){
 const outer=useRef<HTMLDivElement>(null),lab=useRef<PredictionLab|null>(null)
 const [width,setWidth]=useState(640)
 const drag=useRef<{id:number;pane:number;x:number;y:number}|null>(null)
 useEffect(()=>{const canvas=outer.current?.querySelector('canvas');if(!canvas)return;const measure=()=>setWidth(canvas.clientWidth);const observer=new ResizeObserver(measure);observer.observe(canvas);measure();return()=>observer.disconnect()},[])
 const point=(e:PointerEvent<HTMLDivElement>)=>{
  const canvas=outer.current?.querySelector('canvas');if(!canvas)return null
  const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top
  for(const [pane,p] of flowPanels(r.width).entries())if(x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h)return{pane,x:(x-p.x)/p.w*2,y:(y-p.y)/p.h}
  return null
 }
 return <div ref={outer} className="sim-stir flow-prediction" role="group" aria-label="Compare fixed and evolving flow. Drag the colored fields to stir, or use the buttons."
  onPointerDown={e=>{if(!(e.target instanceof HTMLCanvasElement)||e.button!==0)return;const p=point(e);if(!p)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,...p};lab.current?.addDye(p.x,p.y)}}
  onPointerMove={e=>{const old=drag.current,p=point(e);if(!old||old.id!==e.pointerId)return;if(!p||p.pane!==old.pane){drag.current=null;return;}e.preventDefault();const dx=p.x-old.x,dy=p.y-old.y;if(Math.hypot(dx,dy)>0.001){lab.current?.stir(p.x,p.y,dx,dy);drag.current={id:e.pointerId,...p}}}}
  onPointerUp={e=>{if(drag.current?.id===e.pointerId)drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
  onPointerCancel={()=>{drag.current=null}}>
  <Sim height={width+72} create={()=>{const fresh=createPredictionLab();lab.current=fresh;return fresh}}>
   <button type="button" onClick={()=>lab.current?.push()}>Stir the middle</button>
   <button type="button" onClick={()=>lab.current?.addDye()}>Add dye only</button>
  </Sim>
 </div>
}
