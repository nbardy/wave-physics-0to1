import { useRef, useState } from 'react'
import { Sim, type Stepper } from '../../components/Sim'
import { PALETTE as P } from '../lib/palette'
import { drawArrow } from '../lib/chrome'
import { TAU, intensity, gaugeSample, loopSample, createMaxwellModel, WAVE_LENGTH, WAVE_N, pulse } from './model'

type Ref = { current: number }
type Ctx = CanvasRenderingContext2D
const ink = '#334155', faint = '#cbd5e1'
function label(c: Ctx, s: string, x: number, y: number, color = ink) {
  c.fillStyle = color; c.font = '12px system-ui'; c.textAlign = 'left'; c.fillText(s, x, y)
}
function clear(c: Ctx, w: number, h: number) { c.clearRect(0, 0, w, h); c.lineWidth = 1; c.setLineDash([]) }
function dial(c: Ctx, x: number, y: number, r: number, phase: number, color: string) {
  c.strokeStyle = faint; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke()
  c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke()
  drawArrow(c, x, y, x + r * Math.cos(phase), y - r * Math.sin(phase), color, 2)
}
function bar(c: Ctx, x: number, y: number, w: number, value: number, color: string) {
  c.fillStyle = '#e2e8f0'; c.fillRect(x, y, w, 7)
  c.fillStyle = color; c.fillRect(x, y, w * Math.max(0, Math.min(1, value)), 7)
}
function Slider({ name, value, set, min = 0, max = TAU }: { name: string; value: number; set: (v: number) => void; min?: number; max?: number }) {
  return <label>{name} <input type="range" min={min} max={max} step="0.01" value={value} onChange={e => set(Number(e.target.value))} /></label>
}

export function createFiberSection(amplitude: Ref): Stepper {
  return { step() {}, draw(c,w,h) {
    clear(c,w,h)
    const left=30,right=w-30,zero=125,scale=60
    label(c,'Allowed values: real numbers',12,22)
    for(let i=0;i<7;i++) {
      const x=left+(right-left)*i/6
      drawArrow(c,x,zero,x,42,'#94a3b8',1)
      drawArrow(c,x,zero,x,204,'#94a3b8',1)
      const value=amplitude.current*Math.sin(i/6*TAU)
      c.strokeStyle='#94a3b8';c.beginPath();c.arc(x,zero,4,0,TAU);c.stroke()
      c.fillStyle=P.theta;c.beginPath();c.arc(x,zero-scale*value,5,0,TAU);c.fill()
    }
    c.strokeStyle=P.theta;c.lineWidth=2;c.beginPath()
    for(let i=0;i<=200;i++) {
      const x=left+(right-left)*i/200,y=zero-scale*amplitude.current*Math.sin(i/200*TAU)
      if(i===0)c.moveTo(x,y);else c.lineTo(x,y)
    }
    c.stroke()
    label(c,'Selected value: s(x)',12,h-28,P.theta)
    label(c,'Base position x →',w-135,h-28)
  } }
}
export function FiberSection() {
  const [v,set]=useState(.65);const ref=useRef(v);ref.current=v
  return <Sim height={250} animated={false} resettable={false} create={()=>createFiberSection(ref)}><Slider name="Section amplitude" value={v} set={set} min={-1} max={1}/></Sim>
}

export function createPhaseInterference(phase: Ref): Stepper {
  return { step() {}, draw(c, w, h) {
    clear(c, w, h)
    const pw = w / 2, r = Math.min(42, pw / 5)
    ;[0, phase.current].forEach((p, j) => {
      const x = j * pw + pw / 2 - r / 2
      label(c, j ? 'Changed phase' : 'Reference: aligned', j * pw + 12, 22)
      dial(c, x, 91, r, 0, P.conn)
      drawArrow(c, x + r, 91, x + r + r * Math.cos(p), 91 - r * Math.sin(p), P.theta, 2)
      drawArrow(c, x, 137, x + r * (1 + Math.cos(p)), 137 - r * Math.sin(p), P.curv, 3)
      label(c, `I / Imax = ${intensity(p).toFixed(2)}`, j * pw + 12, 160, P.curv)
      bar(c, j * pw + 12, 174, pw - 24, intensity(p), P.curv)
      for (let i = 0; i < pw - 24; i++) {
        const v = intensity(i / (pw - 24) * TAU * 3 + p)
        c.fillStyle = `rgba(124,58,237,${v})`; c.fillRect(j * pw + 12 + i, 205, 1, 36)
      }
    })
    label(c, 'Two unit amplitudes · sum · intensity', 12, h - 12)
  } }
}
export function PhaseInterference() {
  const [v, set] = useState(1.7); const ref = useRef(v); ref.current = v
  return <Sim height={280} animated={false} resettable={false} create={() => createPhaseInterference(ref)}><Slider name="Relative phase" value={v} set={set} /></Sim>
}

export function createGaugeLinks(gauge: Ref): Stepper {
  return { step() {}, draw(c, w, h) {
    clear(c, w, h)
    ;[0, gauge.current].forEach((g, row) => {
      const d = gaugeSample(g), y = 55 + row * 164, dx = (w - 62) / 4
      label(c, row ? 'Relabeled local bases' : 'Original local bases', 12, y - 30)
      d.phase.forEach((p, i) => {
        const x = 31 + i * dx
        dial(c, x, y + 13, Math.min(21, dx / 3), p, P.theta)
        if (i < 4) {
          const mid = x + dx / 2
          label(c, `${d.transport[i].toFixed(2)}`, mid - 15, y + 52, P.conn)
          drawArrow(c, x + 24, y + 13, x + dx - 24, y + 13, P.conn, 1)
        }
      })
      const naive = d.naive.reduce((a, b) => a + b, 0)
      const cov = d.covariant.reduce((a, b) => a + b, 0)
      label(c, `Ordinary: ${naive.toFixed(3)}`, 12, y + 81, P.theta)
      label(c, `Transported: ${cov.toFixed(3)}`, w / 2, y + 81, P.curv)
      bar(c, 12, y + 92, w / 2 - 24, naive / 12, P.theta)
      bar(c, w / 2, y + 92, w / 2 - 24, cov / 12, P.curv)
    })
    label(c, 'Arrows: complex values · links: transport angles (rad)', 12, h - 12)
  } }
}
export function GaugeLinks() {
  const [v, set] = useState(0); const ref = useRef(v); ref.current = v
  return <Sim height={390} animated={false} resettable={false} create={() => createGaugeLinks(ref)}><Slider name="Local basis change" value={v} set={set} max={3} /></Sim>
}

export function createLoopFlux(flux: Ref, gauge: Ref): Stepper {
  return { step() {}, draw(c, w, h) {
    clear(c, w, h)
    const pw = w / 2
    ;[0, gauge.current].forEach((g, col) => {
      const d = loopSample(flux.current, g), left = col * pw
      const x0 = left + 43, x1 = left + pw - 43, y0 = 75, y1 = 182
      const points = [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]
      label(c, col ? 'Relabeled' : 'Original', left + 12, 22)
      let transported = 0
      points.forEach(([x,y], i) => {
        const [nx,ny] = points[(i + 1) % 4]
        drawArrow(c,x,y,nx,ny,P.conn,1)
        label(c,d.links[i].toFixed(2),(x+nx)/2 - 12 + (i===1?4:i===3?-28:0),(y+ny)/2 + (i===0?-24:i===2?34:0),P.conn)
        dial(c,x,y,17,transported,P.theta)
        transported += d.links[i]
      })
      dial(c,left+pw/2,270,28,d.phase,P.curv)
      label(c, `Loop: ${(d.phase / Math.PI).toFixed(2)}π`,left+12,325,P.curv)
      bar(c,left+12,342,pw-24,intensity(d.phase),P.curv)
      label(c, `I / Imax = ${intensity(d.phase).toFixed(2)}`,left+12,373,P.curv)
    })
  } }
}
export function LoopFlux() {
  const [f, sf] = useState(Math.PI / 2), [g, sg] = useState(0)
  const fr = useRef(f), gr = useRef(g); fr.current = f; gr.current = g
  return <Sim height={395} animated={false} resettable={false} create={() => createLoopFlux(fr, gr)}>
    <Slider name="Enclosed phase φ" value={f} set={sf} /><Slider name="Local basis change" value={g} set={sg} max={2} />
  </Sim>
}

export function createMaxwellWave(): Stepper {
  const model = createMaxwellModel()
  return { step: dt => model.advance(dt), draw(c,w,h) {
    clear(c,w,h); const d = model.read()
    const plot = (values: ArrayLike<number>, y: number, color: string, dashed = false) => {
      c.strokeStyle = color; c.lineWidth = 2; c.setLineDash(dashed ? [4,4] : [])
      c.beginPath()
      for(let i=0;i<WAVE_N;i++) {
        const x=20+i/(WAVE_N-1)*(w-40), py=y-values[i]*65
        if(i===0)c.moveTo(x,py);else c.lineTo(x,py)
      }
      c.stroke();c.setLineDash([])
    }
    const initial = Float64Array.from({length:WAVE_N},(_,i)=>pulse(i*WAVE_LENGTH/WAVE_N))
    label(c, `Vacuum · c = 1 · t = ${d.time.toFixed(2)}`,12,22)
    ;[125,255].forEach(y => {c.strokeStyle=faint;c.beginPath();c.moveTo(20,y);c.lineTo(w-20,y);c.stroke();plot(initial,y,'#94a3b8',true)})
    label(c,'E_y',12,48,P.efield);label(c,'B_z',12,178,P.bfield)
    plot(d.e,125,P.efield);plot(d.b,255,P.bfield)
    label(c,'Dashed: t = 0',12,h-36)
    label(c,'0',20,h-12);label(c,'x →',w/2,h-12);label(c,'12',w-35,h-12)
  } }
}
export function MaxwellWave() { return <Sim height={330} create={createMaxwellWave} /> }
