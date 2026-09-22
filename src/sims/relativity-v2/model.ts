// Schwarzschild orbit equation: Tong, General Relativity §1.3.3.
// w=a/r; μ=GM/(ac²); h²=GMa(1-e²). The initial perihelion and h are
// held fixed between Newton and Schwarzschild; a,e label the Newtonian orbit.
export const MERCURY_E = 0.205630;
export const MERCURY_A = 57.90905e9;
export const SOLAR_GM = 1.32712440018e20;
export const LIGHT_SPEED = 299792458;
export const MERCURY_MU = SOLAR_GM / (MERCURY_A * LIGHT_SPEED ** 2);
export const mercuryAdvance = () => 6 * Math.PI * MERCURY_MU / (1 - MERCURY_E ** 2)
  * (180 / Math.PI) * 3600 * (36525 / 87.9691);
// RK4's imaginary-axis stability interval includes |Δφ ω|<2√2. Here
// ω²=1-6μw, μ≤.004 and w<1.4; Δφ=.002 resolves an orbit with >3000 steps.
export const ORBIT_STEP = 0.002;
export interface Orbit { phi:number; w:number; v:number; mu:number; e:number; peri:number[]; trail:[number,number][] }
export function orbit(mu:number, e=MERCURY_E):Orbit {
  return {phi:0,w:1/(1-e),v:0,mu,e,peri:[0],trail:[[1-e,0]]};
}
export function advanceOrbit(s:Orbit, h=ORBIT_STEP) {
  const f=(w:number)=>1/(1-s.e*s.e)-w+3*s.mu*w*w;
  const aw=s.v,av=f(s.w), bw=s.v+h*av/2,bv=f(s.w+h*aw/2);
  const cw=s.v+h*bv/2,cv=f(s.w+h*bw/2),dw=s.v+h*cv,dv=f(s.w+h*cw);
  const oldV=s.v;
  s.w+=h*(aw+2*bw+2*cw+dw)/6; s.v+=h*(av+2*bv+2*cv+dv)/6;
  if(oldV>0 && s.v<=0) s.peri.push(s.phi+h*oldV/(oldV-s.v));
  s.phi+=h;
}
export function measuredAdvance(s:Orbit) {
  return s.peri.length>1 ? (s.peri.at(-1)!-s.peri[0])/(s.peri.length-1)-2*Math.PI : null;
}
export type Vec=[number,number,number];
const dot=(a:Vec,b:Vec)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a:Vec,b:Vec):Vec=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function rotate(v:Vec, axis:Vec, angle:number):Vec {
  const c=Math.cos(angle),s=Math.sin(angle),p=dot(axis,v),q=cross(axis,v);
  return v.map((x,i)=>x*c+q[i]*s+axis[i]*p*(1-c)) as Vec;
}
export function transport(v:Vec,a:Vec,b:Vec):Vec {
  const n=cross(a,b), length=Math.hypot(...n);
  if(length<1e-12)return [...v];
  return rotate(v,n.map(x=>x/length) as Vec,Math.atan2(length,dot(a,b)));
}
export function triangleTransport(angle:number) {
  const vertices:Vec[]=[[0,0,1],[1,0,0],[Math.cos(angle),Math.sin(angle),0],[0,0,1]];
  let v:Vec=[1,0,0]; const vectors:Vec[]=[[...v]];
  for(let i=0;i<3;i++){v=transport(v,vertices[i],vertices[i+1]);vectors.push(v)}
  return {vertices,vectors,angle:Math.atan2(v[1],v[0])};
}
// Exact solution of d¨=k d in the freely falling central frame, d(0)=1, ḋ(0)=0.
// This is a local, linear Newtonian tidal field; no integration stability bound.
export const tidalSeparation=(k:number,t:number)=>Math.cosh(Math.sqrt(k)*t);
export const arcLength=(r:number,angle:number)=>r*angle;
// Cartesian polygon quadrature: sum actual coordinate displacements, independently
// of the polar metric integral. Chord error is O(N⁻²); N=4096 is below 1e-7 here.
export function cartesianArcLength(r:number,angle:number,segments=4096){
  let length=0,x=r,y=0;
  for(let i=1;i<=segments;i++){
    const nx=r*Math.cos(angle*i/segments),ny=r*Math.sin(angle*i/segments);
    length+=Math.hypot(nx-x,ny-y);x=nx;y=ny;
  }
  return length;
}
