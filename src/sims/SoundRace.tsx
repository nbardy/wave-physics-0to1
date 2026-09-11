import { useEffect, useRef, useState } from 'react'
import type { Stepper } from '../components/Sim'
import { PALETTE } from './lib/palette'
export const GAMMA = 1.4, SOUND_DISTANCE = 200, SOUND_TIME = .5
export function gasState(compression:number, heatStays:boolean) {
  const volume=1-compression, exponent=heatStays?GAMMA:1
  const pressure=volume**-exponent, temperature=273.15*volume**(1-exponent)
  // Density increases as 1/V. Small-signal c² = B/rho, B = exponent*p.
  const speed=331/Math.sqrt(GAMMA)*Math.sqrt(exponent*pressure*volume)
  return {volume,pressure,temperature,speed}
}
// Exact equilibrium comparison and a frozen sound-front snapshot. No time integration.
export function createSound(compression:number):Stepper & { measure():{distance:number[];states:ReturnType<typeof gasState>[]}} {
  const states=()=>[gasState(compression,false),gasState(compression,true)]
  const time=SOUND_TIME
  return {
    measure(){const s=states();return{states:s,distance:s.map(g=>Math.min(SOUND_DISTANCE,g.speed*time))}},
    step(){},
    draw(ctx,w,h){
      ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)
      const s=states(),half=w/2
      for(let side=0;side<2;side++){
        const x=side*half+12, width=half-24, gas=s[side], color=side?PALETTE.dye:PALETTE.vel
        ctx.fillStyle='#303743';ctx.font='600 13px system-ui';ctx.fillText(side?'Heat stays':'Heat escapes',x,22)
        const y=52,room=width-9,edge=x+room*gas.volume
        ctx.fillStyle=side?'#fff1df':'#eaf1ff';ctx.fillRect(x,y,room*gas.volume,92)
        // Same number of molecules and same starting volume in both chambers.
        ctx.fillStyle=color
        for(let j=0;j<5;j++)for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(x+(i+.5)/9*room*gas.volume,y+(j+.5)/5*92,1.7,0,Math.PI*2);ctx.fill()}
        ctx.strokeStyle='#94a3b8';ctx.lineWidth=1.5;ctx.strokeRect(x,y,room,92)
        ctx.fillStyle='#475569';ctx.fillRect(edge-2,y-4,5,100)
        ctx.font='12px system-ui';ctx.fillStyle='#475569';ctx.fillText(`${(gas.temperature-273.15).toFixed(0)} °C`,x,164)
        ctx.fillText(`pressure ${gas.pressure.toFixed(2)} ×`,x,189)
        ctx.fillStyle='#e8edf3';ctx.fillRect(x,202,width,12)
        ctx.fillStyle=color;ctx.fillRect(x,202,width*(gas.pressure-1)/1.1,12)
      }
      ctx.font='12px system-ui';ctx.fillStyle='#64748b';ctx.fillText('Pressure rise above the starting value',12,238)
      ctx.font='600 13px system-ui';ctx.fillStyle='#303743';ctx.fillText('After 0.50 s · sound through each gas',12,274)
      for(let side=0;side<2;side++){
        const y=311+side*70,gas=s[side],color=side?PALETTE.dye:PALETTE.vel,left=14,right=w-16
        ctx.strokeStyle='#d6dee8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()
        ctx.fillStyle=color;const x=left+Math.min(1,time*gas.speed/SOUND_DISTANCE)*(right-left)
        ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill()
        ctx.font='12px system-ui';ctx.fillText(`${Math.round(gas.speed)} m/s`,left,y+23)
        ctx.textAlign='right';ctx.fillText(`${(SOUND_DISTANCE/gas.speed).toFixed(3)} s to 200 m`,right,y+23);ctx.textAlign='left'
      }
    },
  }
}
export function SoundRace(){
  const [compression,setCompression]=useState(.25), canvas=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=canvas.current;if(!c)return
    const draw=()=>{const w=c.clientWidth,dpr=window.devicePixelRatio||1;c.width=Math.round(w*dpr);c.height=424*dpr;const ctx=c.getContext('2d');if(ctx){ctx.scale(dpr,dpr);createSound(compression).draw(ctx,w,424)}}
    const observer=new ResizeObserver(draw);observer.observe(c);draw();return()=>observer.disconnect()
  },[compression])
  const gas=[gasState(compression,false),gasState(compression,true)]
  return <figure className="sim history-experiment" role="group" aria-label="Compare heat escaping and heat retained during compression">
    <canvas ref={canvas} className="sim-canvas" style={{width:'100%',height:424}} role="img" aria-label={`At ${Math.round(compression*100)} percent compression: pressures ${gas[0].pressure.toFixed(2)} and ${gas[1].pressure.toFixed(2)} times the starting pressure; sound speeds ${Math.round(gas[0].speed)} and ${Math.round(gas[1].speed)} meters per second.`}/>
    <div className="sim-controls">
      <button onClick={()=>setCompression(0)}>Release compression</button>
      <label className="sim-slider"><span>compress</span><input aria-label="Gas compression" type="range" min="0" max="0.4" step="0.01" value={compression} onChange={e=>setCompression(+e.target.value)}/><span>{Math.round(compression*100)}%</span></label>
    </div>
  </figure>
}
