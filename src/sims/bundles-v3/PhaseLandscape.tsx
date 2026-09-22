import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'

type Mode = 'fibers' | 'gauge'
type Ref = {current:number}
type Point = [number,number]
const amber='#d97706', blue='#2563eb', violet='#7c3aed', ink='#334155', gray='#cbd5e1'
const TAU=2*Math.PI
const fixed=(v:number,d=3)=>(Math.round((v+1e-12)*10**d)/10**d).toFixed(d)

export function phaseLandscapeSample(x:number,gradient:number,gauge:number){
 const phase=.7+gradient*(x-.5)+.45*Math.sin(TAU*x)
 const amplitude=.7+.2*Math.cos(Math.PI*(x-.5))
 const alpha=gauge*Math.sin(Math.PI*x)
 return {phase,amplitude,alpha,coordinatePhase:phase+alpha,zeroAngle:-alpha}
}
export function phaseLandscapeLink(x:number,y:number,gradient:number,gauge:number){
 const left=phaseLandscapeSample(x,gradient,gauge),right=phaseLandscapeSample(y,gradient,gauge)
 const originalLink=.35*(y-x)
 const coordinateLink=originalLink+right.alpha-left.alpha
 return {coordinateLink,covariantDifference:right.coordinatePhase-left.coordinatePhase-coordinateLink,
  originalDifference:phaseLandscapeSample(y,gradient,0).phase-phaseLandscapeSample(x,gradient,0).phase-originalLink}
}
function path(c:CanvasRenderingContext2D,points:Point[],color:string,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=ink,size=12){c.font=`${size}px system-ui`;c.fillStyle=color;c.textAlign='left';c.fillText(s,x,y)}
function arrow(c:CanvasRenderingContext2D,a:Point,b:Point,color:string,width=2){path(c,[a,b],color,width);const t=Math.atan2(b[1]-a[1],b[0]-a[0]);path(c,[[b[0]-6*Math.cos(t-.45),b[1]-6*Math.sin(t-.45)],b,[b[0]-6*Math.cos(t+.45),b[1]-6*Math.sin(t+.45)]],color,width)}

export function createPhaseLandscape(value:Ref,mode:Mode):Stepper {
 return {step(){},draw(c,w,h){
  c.clearRect(0,0,w,h);c.fillStyle='#faf9f6';c.fillRect(0,0,w,h)
  const mobile=w<500,n=mobile?5:9,left=mobile?36:64,right=w-left
  const rows=mode==='gauge'?2:1,rowHeight=(h-(mode==='gauge'?60:0))/rows
  for(let row=0;row<rows;row++){
   const top=row*rowHeight,gradient=mode==='fibers'?value.current:1.2,gauge=row?value.current:0
   const cy=top+rowHeight*.48,base=top+rowHeight*.78,R=Math.min(mobile?62:78,(right-left)/(n-1)*.9)
   const center=(x:number):Point=>[left+(right-left)*x,cy]
   // An oblique view of each local complex plane: horizontal real axis,
   // vertical imaginary axis, projected at a common fixed camera angle.
   const project=(x:number,phase:number,amplitude=1):Point=>{
    const p=center(x);return [p[0]+.5*R*amplitude*Math.cos(phase),p[1]-R*amplitude*Math.sin(phase)]
   }
   text(c,mode==='fibers'?'Complex fibers and a section':row?'Relabeled coordinates':'Original coordinates',18,top+27,ink,mobile?14:17)
   if(!mobile)text(c,mode==='fibers'?'Chosen section ψ(x)   ·   Unit circles in the complex planes':row?'Local basis -α(x)   ·   Coordinate phases θ + α':'Blue: local zero direction   ·   Amber: chosen value',18,top+49,'#64748b',12)
   path(c,[[left-12,base],[right+12,base]],'#94a3b8',1.2)
   text(c,'x',right+16,base+4,'#64748b',13)
   // The translucent ruled strip joins each selected value to the zero section.
   // It is a drawing aid; its height is the projected complex value, not |ψ|².
   const section=Array.from({length:161},(_,j)=>{const x=j/160,s=phaseLandscapeSample(x,gradient,gauge);return project(x,s.phase,s.amplitude)})
   c.beginPath();c.moveTo(left,cy);section.forEach(p=>c.lineTo(...p));c.lineTo(right,cy);c.closePath();c.fillStyle='rgba(217,119,6,.09)';c.fill()
   for(let i=0;i<n;i++){
    const x=i/(n-1),p=center(x),s=phaseLandscapeSample(x,gradient,gauge)
    path(c,[[p[0],cy],[p[0],base]],'#dde1e5')
    path(c,Array.from({length:65},(_,j)=>project(x,TAU*j/64)),gray,1)
    path(c,[project(x,0,1.12),project(x,Math.PI,1.12)],'#e2e5e9')
    path(c,[project(x,Math.PI/2,1.1),project(x,-Math.PI/2,1.1)],'#e2e5e9')
    arrow(c,p,project(x,s.zeroAngle,1),blue,1.7)
    const tip=project(x,s.phase,s.amplitude);arrow(c,p,tip,amber,2.8)
    c.fillStyle=amber;c.beginPath();c.arc(...tip,3.5,0,TAU);c.fill()
    text(c,x.toFixed(2),p[0]-12,base+18,'#64748b',10)
    if(mode==='gauge')text(c,s.coordinatePhase.toFixed(2),p[0]-14,base+38,amber,11)
   }
   path(c,section,amber,2.3)
   if(mode==='gauge'){
    text(c,'θ',10,base+38,amber,12)
    for(let i=0;i<n-1;i++){
     const x=i/(n-1),y=(i+1)/(n-1),link=phaseLandscapeLink(x,y,gradient,gauge),mid=center((x+y)/2)[0]
     text(c,link.coordinateLink.toFixed(2),mid-12,base+57,blue,10)
    }
    text(c,'a',10,base+57,blue,12)
   } else {
    text(c,'Amplitude |ψ|: radial length',18,h-31,'#64748b',mobile?11:13)
    text(c,'Phase θ: angle from local zero',18,h-12,'#64748b',mobile?11:13)
   }
  }
  if(mode==='gauge'){
   const d=phaseLandscapeLink(0,1/(n-1),1.2,value.current),y=h-35
   text(c,'First link: Δθ - a',18,y,violet,mobile?12:14)
   text(c,`${fixed(d.originalDifference)}  =  ${fixed(d.covariantDifference)} rad`,18,y+23,violet,mobile?14:18)
  }
 }}
}

export function PhaseLandscape({mode='fibers'}:{mode?:Mode}){
 const [value,setValue]=useState(mode==='fibers'?1.2:1.5),ref=useRef(value);ref.current=value
 return <Sim height={mode==='fibers'?370:690} animated={false} resettable={false} create={()=>createPhaseLandscape(ref,mode)}>
  <label>{mode==='fibers'?'Phase gradient':'Local relabeling'} <input aria-label={mode==='fibers'?'Section phase gradient':'Local phase relabeling'} type="range" min={mode==='fibers'?-3:0} max="3" step="0.01" value={value} onChange={e=>setValue(+e.target.value)}/><output>{value.toFixed(2)} rad</output></label>
 </Sim>
}
