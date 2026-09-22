import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { screenIntensity, routePhase, TAU } from './model'
import './ABBanner.css'

type Ctx = CanvasRenderingContext2D
type Params = { current: { flux: number; gauge: number } }
const gold = '#f6c979', blue = '#7dd3fc', violet = '#b69aff', white = '#e2e9fc', muted = '#8794b5'
function text(c: Ctx, value: string, x: number, y: number, color = muted, size = 11, align: CanvasTextAlign = 'left') {
  c.fillStyle = color; c.font = `${size}px system-ui`; c.textAlign = align; c.fillText(value, x, y)
}
function line(c: Ctx, points: number[][], color: string, width = 1) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath()
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()
}
function phasor(c: Ctx, x: number, y: number, phase: number, color: string, r = 13) {
  c.fillStyle='#10182b';c.strokeStyle='#48516b';c.lineWidth=1;c.beginPath();c.arc(x,y,r+4,0,TAU);c.fill();c.stroke()
  const ex=x+r*Math.cos(phase),ey=y-r*Math.sin(phase)
  line(c,[[x,y],[ex,ey]],color,2)
  c.fillStyle=color;c.beginPath();c.arc(ex,ey,2.2,0,TAU);c.fill()
}
export function createABBanner(params: Params, transport = false): Stepper {
  return { step() {}, draw(c,w,h) {
    const {flux,gauge}=params.current, small=w<600
    c.clearRect(0,0,w,h);c.fillStyle='#090e1d';c.fillRect(0,0,w,h);c.setLineDash([])
    const centerX=small?w*.49:w*.36, centerY=small?152:228
    const rx=small?w*.25:w*.205,ry=small?68:113
    const start=centerX-rx-26,finish=centerX+rx+26
    const light=c.createRadialGradient(centerX,centerY,5,centerX,centerY,small?135:220)
    light.addColorStop(0,'#4a2a743d');light.addColorStop(1,'#090e1000');c.fillStyle=light;c.fillRect(0,0,w,h)
    text(c,'AHARONOV–BOHM',24,30,muted,10)
    text(c,transport?'Two paths · phase transport':'Magnetic flux and electron interference',24,54,white,small?15:20)
    const path=(branch:1|-1)=>{
      const points:number[][]=[]
      for(let i=0;i<=100;i++){const t=i/100;points.push([centerX-rx*Math.cos(Math.PI*t),centerY-branch*ry*Math.sin(Math.PI*t)])}
      const col=branch===1?gold:blue
      c.shadowColor=col;c.shadowBlur=13;line(c,[[start,centerY],...points,[finish,centerY]],col,1.5);c.shadowBlur=0
      for(const t of (small?[.5]:[.23,.5,.77])) {
        const x=centerX-rx*Math.cos(Math.PI*t),y=centerY-branch*ry*Math.sin(Math.PI*t)
        phasor(c,x,y,routePhase(t,branch,flux,transport?gauge:0),col,small?10:13)
      }
      text(c,`${routePhase(1,branch,flux,transport?gauge:0).toFixed(2)} rad`,centerX+(small?48:83),centerY-branch*(ry-10)+(branch===-1?25:0),col,10)
    }
    path(1);path(-1)
    // Core is an excluded region, not a computed field map or particle dynamics.
    const radius=small?30:47
    c.shadowColor='#9b6cff';c.shadowBlur=24;c.fillStyle='#261e40';c.strokeStyle='#9b7fe3';c.lineWidth=1
    c.beginPath();c.arc(centerX,centerY,radius,0,TAU);c.fill();c.stroke();c.shadowBlur=0
    c.save();c.beginPath();c.arc(centerX,centerY,radius-3,0,TAU);c.clip()
    for(let i=-radius*2;i<radius*2;i+=8)line(c,[[centerX+i-radius,centerY+radius],[centerX+i+radius,centerY-radius]],'#74619c44')
    c.restore()
    text(c,'Φ',centerX,centerY+7,violet,25,'center')
    text(c,'sealed flux',centerX,centerY+radius+21,muted,10,'center')
    c.fillStyle=white;c.beginPath();c.arc(start,centerY,3,0,TAU);c.fill()
    text(c,'split',start,centerY+27,muted,10,'center')
    text(c,'B = 0 along both paths',centerX,small?257:391,muted,11,'center')
    if(transport)text(c,`endpoint shift: ${gauge.toFixed(2)} rad on both paths`,centerX,small?278:413,'#86d5bc',small?10:12,'center')
    else text(c,`relative phase  ${flux>=0?'+':''}${(2*flux).toFixed(2)}π`,centerX,small?278:413,violet,12,'center')
    // The detector is a spatial coordinate, not the continuation of a trajectory.
    const px=small?32:w*.76,py=small?317:103,pw=small?w-64:85,ph=small?28:246
    const n=small?Math.ceil(pw):Math.ceil(ph)
    text(c,'DETECTOR',px,py-14,muted,10)
    for(let i=0;i<n;i++) {
      const s=i/(n-1)*2-1,I=screenIntensity(s,flux)
      c.fillStyle=`rgb(${Math.round(15+181*I)},${Math.round(20+159*I)},${Math.round(39+216*I)})`
      if(small)c.fillRect(px+i,py,1,ph);else c.fillRect(px,py+i,pw,1)
    }
    const shifted:number[][]=[],zero:number[][]=[]
    for(let i=0;i<=240;i++){
      const s=i/120-1
      if(small){shifted.push([px+pw*i/240,py+ph+62-screenIntensity(s,flux)*46]);zero.push([px+pw*i/240,py+ph+62-screenIntensity(s,0)*46])}
      else{shifted.push([px+pw+12+screenIntensity(s,flux)*44,py+ph*i/240]);zero.push([px+pw+12+screenIntensity(s,0)*44,py+ph*i/240])}
    }
    c.setLineDash([3,4]);line(c,zero,'#a3afc6',1.5);c.setLineDash([]);line(c,shifted,violet,2.2)
    text(c,'Intensity',px,small?441:376,white,11)
    text(c,'— flux on    ··· zero flux',px,small?460:398,muted,10)
    if(!small){line(c,[[finish+8,centerY],[px-16,centerY]],'#485675',1);text(c,'recombine',finish+10,centerY+23,muted,10)}
  } }
}
export function ABBanner({mode='hero'}:{mode?:'hero'|'transport'}) {
  const [flux,setFlux]=useState(.3),[gauge,setGauge]=useState(0)
  const params=useRef({flux,gauge});params.current={flux,gauge}
  return <div className="ab-banner"><Sim height={485} animated={false} resettable={false} create={()=>createABBanner(params,mode==='transport')}>
    <label className="ab-slider">Enclosed flux · qΦ/h <input aria-label="Enclosed magnetic flux" type="range" min="-1" max="1" step="0.01" value={flux} onChange={e=>setFlux(+e.target.value)}/><output>{flux>0?'+':''}{flux.toFixed(2)}</output></label>
    {mode==='transport'&&<label className="ab-slider">Local phase convention <input aria-label="Local phase convention" type="range" min="-3" max="3" step="0.01" value={gauge} onChange={e=>setGauge(+e.target.value)}/><output>{gauge.toFixed(2)}</output></label>}
    <button type="button" onClick={()=>setFlux(0)}>Zero flux</button>
  </Sim></div>
}
