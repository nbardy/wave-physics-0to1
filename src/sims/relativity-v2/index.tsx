import { useEffect, useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE as P } from '../lib/palette'
import { arcLength, cartesianArcLength, tidalSeparation, triangleTransport, transport, rotate, orbit, advanceOrbit, measuredAdvance, mercuryAdvance, MERCURY_MU, type Vec } from './model'

function useFigureHeight(desktop:number,mobile:number){
 const [wide,setWide]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(min-width: 601px)').matches);
 useEffect(()=>{const media=window.matchMedia('(min-width: 601px)');const update=()=>setWide(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 return wide?desktop:mobile;
}
type Ref={current:number}
const ink='#30343b', grid='#d9dde0';
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=ink,size=13){c.fillStyle=color;c.font=`${size}px system-ui`;c.textAlign='left';c.fillText(s,x,y)}
function line(c:CanvasRenderingContext2D,points:number[][],color=grid,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()}
function dot(c:CanvasRenderingContext2D,x:number,y:number,color:string,r=4){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function arrow(c:CanvasRenderingContext2D,a:number[],b:number[],color:string){line(c,[a,b],color,2);const q=Math.atan2(b[1]-a[1],b[0]-a[0]);line(c,[[b[0]-7*Math.cos(q-.45),b[1]-7*Math.sin(q-.45)],b,[b[0]-7*Math.cos(q+.45),b[1]-7*Math.sin(q+.45)]],color,2)}
function clear(c:CanvasRenderingContext2D,w:number,h:number){c.clearRect(0,0,w,h)}
function panels(c:CanvasRenderingContext2D,w:number,h:number,titles:string[],paint:(x:number,y:number,pw:number,ph:number,i:number)=>void){
 const stacked=w<500, pw=stacked?w:w/2,ph=stacked?h/2:h;
 titles.forEach((title,i)=>{const x=stacked?0:i*pw,y=stacked?i*ph:0;text(c,title,x+12,y+22,ink,14);paint(x,y,pw,ph,i)})
}
export function createMetricCoordinates(radius:Ref):Stepper {return {step(){},draw(c,w,h){
 clear(c,w,h);const r=radius.current,angle=Math.PI/3;
 panels(c,w,h,['Cartesian coordinates','Polar coordinates'],(x,y,pw,ph,i)=>{
  const cx=x+pw*.48,cy=y+38+(ph-90)/2,s=Math.min(pw*.42,(ph-95)/2)/3;
  c.save();c.beginPath();c.rect(x+12,y+35,pw-24,ph-83);c.clip();
  if(i===0){for(let n=-2;n<=3;n++){line(c,[[cx+n*s,y+38],[cx+n*s,y+ph-52]]);line(c,[[x+15,cy-n*s],[x+pw-15,cy-n*s]])}}
  else {for(let n=1;n<=3;n++){c.strokeStyle=grid;c.lineWidth=1;c.beginPath();c.arc(cx,cy,n*s,0,2*Math.PI);c.stroke()}for(let a=0;a<2*Math.PI;a+=Math.PI/6)line(c,[[cx,cy],[cx+3*s*Math.cos(a),cy-3*s*Math.sin(a)]])}
  const points=Array.from({length:81},(_,j)=>[cx+r*s*Math.cos(angle*j/80),cy-r*s*Math.sin(angle*j/80)]);
  line(c,points,P.dye,4);dot(c,...points[0] as [number,number],P.dye);dot(c,...points[80] as [number,number],P.dye);
  line(c,[[cx,cy],points[0]],P.conn);text(c,`r = ${r.toFixed(2)}`,cx+5,cy+20,P.conn);
  c.restore();
  text(c,i?'∫ r dφ':'Σ √(Δx² + Δy²)',x+12,y+ph-31);
  text(c,`length = ${(i?arcLength(r,angle):cartesianArcLength(r,angle)).toFixed(3)}`,x+12,y+ph-11,P.dye);
 })
}}}
export function MetricCoordinates(){const [r,set]=useState(1.6),ref=useRef(r);ref.current=r;return <Sim height={useFigureHeight(330,510)} create={()=>createMetricCoordinates(ref)} animated={false} resettable={false}><label>Radius <input aria-label="Arc radius" type="range" min="0.6" max="2.5" step="0.01" value={r} onChange={e=>set(+e.target.value)}/><output>{r.toFixed(2)}</output></label></Sim>}

export function createSphericalTransport(span:Ref):Stepper {return {step(){},draw(c,w,h){
 clear(c,w,h);const a=span.current*Math.PI/180,result=triangleTransport(a);
 panels(c,w,h,['Flat triangle','Spherical triangle'],(x,y,pw,ph,i)=>{
  const R=Math.min(pw*.31,ph*.28),cx=x+pw/2,cy=y+ph*.49;
  if(i===0){const v=[[cx,cy-R],[cx-R,cy+R*.65],[cx+R,cy+R*.65],[cx,cy-R]];line(c,v,grid,2);v.slice(0,3).forEach(p=>arrow(c,p,[p[0]+24,p[1]],P.conn));arrow(c,v[0],[v[0][0]+24,v[0][1]],P.dye);text(c,'Return rotation: 0°',x+12,y+ph-15,P.dye);return}
  const project=(v:Vec):number[]=>[cx+R*(v[0]*.82-v[1]*.57),cy+R*(v[0]*.25+v[1]*.36-v[2]*.9)];
  c.strokeStyle=grid;c.lineWidth=1;c.beginPath();c.arc(cx,cy,R,0,2*Math.PI);c.stroke();
  for(let edge=0;edge<3;edge++){
   const start=result.vertices[edge],end=result.vertices[edge+1];
   const axis:Vec=[start[1]*end[2]-start[2]*end[1],start[2]*end[0]-start[0]*end[2],start[0]*end[1]-start[1]*end[0]],len=Math.hypot(...axis),n=axis.map(v=>v/len) as Vec;
   const angle=edge===1?a:Math.PI/2;
   line(c,Array.from({length:61},(_,j)=>project(rotate(start,n,angle*j/60))),P.conn,2);
   const mid=rotate(start,n,angle/2),v=transport(result.vectors[edge],start,mid),p=project(mid),q=project(mid.map((z,j)=>z+.3*v[j]) as Vec);arrow(c,p,q,P.conn);
  }
  const pole=project(result.vertices[0]);arrow(c,pole,project([.4,0,1]),P.ghost);arrow(c,pole,project([.4*result.vectors[3][0],.4*result.vectors[3][1],1]),P.dye);
  text(c,`Return rotation: ${(result.angle*180/Math.PI).toFixed(0)}°`,x+12,y+ph-35,P.dye);text(c,`Angle sum: ${(180+span.current).toFixed(0)}°`,x+12,y+ph-15);
 })
}}}
export function SphericalTransport(){const [a,set]=useState(70),ref=useRef(a);ref.current=a;return <Sim height={useFigureHeight(350,520)} create={()=>createSphericalTransport(ref)} animated={false} resettable={false}><label>Longitude span <input aria-label="Triangle longitude span" type="range" min="15" max="110" step="1" value={a} onChange={e=>set(+e.target.value)}/><output>{a}°</output></label></Sim>}

export function createTidalFall(time:Ref):Stepper {return {step(){},draw(c,w,h){clear(c,w,h);
 panels(c,w,h,['Uniform field · falling frame','Tidal field · falling frame'],(x,y,pw,ph,i)=>{
  const cx=x+pw/2,cy=y+ph*.49,unit=Math.min(36,ph*.12),t=time.current,k=i?.18:0,d=tidalSeparation(k,t);
  c.setLineDash([3,5]);line(c,[[x+20,cy-unit],[x+pw-20,cy-unit]]);line(c,[[x+20,cy+unit],[x+pw-20,cy+unit]]);c.setLineDash([]);
  dot(c,cx,cy,ink,3);
  for(const sign of [-1,1]){dot(c,cx,cy+sign*unit*d,P.dye,7);if(i)arrow(c,[cx+18,cy+sign*unit*d],[cx+18,cy+sign*(unit*d+18*d)],P.conn)}
  line(c,[[cx-25,cy-unit*d],[cx-25,cy+unit*d]],P.dye,2);
  text(c,`d / d₀ = ${d.toFixed(3)}`,x+12,y+ph-34,P.dye);text(c,`k = ${k.toFixed(2)} s⁻²`,x+12,y+ph-13,P.conn);
 })
}}}
export function TidalFall(){const [t,set]=useState(0),ref=useRef(t);ref.current=t;return <Sim height={useFigureHeight(330,520)} create={()=>createTidalFall(ref)} animated={false} resettable={false}><label>Elapsed time <input aria-label="Free fall elapsed time" type="range" min="0" max="3" step="0.01" value={t} onChange={e=>set(+e.target.value)}/><output>{t.toFixed(2)} s</output></label></Sim>}

export function createMercuryOrbit(mu:Ref):Stepper {
 let newton=orbit(0),gr=orbit(mu.current),lastMu=mu.current,acc=0,steps=0;
 // Animation time only schedules fixed angular steps; it is not orbital time.
 const dt=1/120;
 return {step(elapsed){if(lastMu!==mu.current){newton=orbit(0);gr=orbit(mu.current);lastMu=mu.current;acc=0;steps=0}acc+=elapsed;
  while(acc+1e-12>=dt){acc-=dt;for(let j=0;j<12;j++){advanceOrbit(newton);advanceOrbit(gr);steps++;if(steps%8===0)for(const s of [newton,gr]){s.trail.push([Math.cos(s.phi)/s.w,Math.sin(s.phi)/s.w]);if(s.trail.length>5200)s.trail.shift()}}}
 },draw(c,w,h){clear(c,w,h);
  panels(c,w,h-44,['Newton','Schwarzschild'],(x,y,pw,ph,i)=>{
   const s=i?gr:newton,scale=Math.min(pw*.35,ph*.30),cx=x+pw/2,cy=y+ph*.48;
   const project=(p:number[])=>[cx+p[0]*scale,cy-p[1]*scale];
   line(c,s.trail.map(project),i?P.conn:P.ghost,1.5);dot(c,cx,cy,P.dye,6);
   for(const p of s.peri.slice(-8)){const r=1/(1-s.e);line(c,[[cx,cy],project([Math.cos(p)/r,Math.sin(p)/r])],i?P.conn:P.ghost,.8)}
   dot(c,...project([Math.cos(s.phi)/s.w,Math.sin(s.phi)/s.w]) as [number,number],i?P.conn:P.ghost,5);
   const m=measuredAdvance(s);text(c,m===null?'Measuring first orbit…':`Advance: ${(m*180/Math.PI).toFixed(3)}° / orbit`,x+12,y+ph-35,i?P.conn:ink,12);
   text(c,`μ = ${s.mu.toFixed(4)} · ${s.peri.length-1} orbits`,x+12,y+ph-15,ink,12);
  });
  text(c,`Mercury μ = ${MERCURY_MU.toExponential(3)}`,12,h-24,ink,12);
  text(c,`Leading order: ${mercuryAdvance().toFixed(2)}″ / century`,12,h-7,ink,12);
 }}
}
export function MercuryOrbit(){const [m,set]=useState(.002),ref=useRef(m);ref.current=m;return <Sim height={useFigureHeight(360,540)} create={()=>createMercuryOrbit(ref)} resetToken={m}><label>Model μ <input aria-label="Relativistic orbit strength" type="range" min="0" max="0.004" step="0.0001" value={m} onChange={e=>set(+e.target.value)}/><output>{m.toFixed(4)}</output></label></Sim>}
