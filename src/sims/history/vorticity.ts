// Periodic 2D vorticity–streamfunction solver, domain 2 × 1.
// omega_t + u·grad(omega) = nu Laplacian(omega), u=(psi_y,-psi_x), -Δpsi=omega.
// A Fourier inversion makes the grid velocity divergence-free (to roundoff).
// Transport: midpoint backtrace, bounded MacCormack; viscosity: exact Fourier
// exponential. Both are stable without a CFL bound. A fixed 1/60 step resolves
// motion; mean removal enforces the zero circulation required by periodic psi.
// This hybrid is NOT an alias-free pseudospectral nonlinear-advection scheme.
export const VX = 128, VY = 64, LX = 2, LY = 1, VDT = 1 / 60, VISCOSITY = 0.00018
const N = VX * VY
export const wrap = (x:number, length:number) => ((x % length) + length) % length
function fft(re:Float64Array, im:Float64Array, n:number, inverse:boolean) {
  for(let i=1,j=0;i<n;i++) { let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]} }
  for(let len=2;len<=n;len<<=1){
    const angle=(inverse?2:-2)*Math.PI/len, cr=Math.cos(angle),ci=Math.sin(angle)
    for(let i=0;i<n;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){
      const a=i+j,b=a+len/2,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b]
      re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti
      const nr=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=nr
    }}
  }
  if(inverse)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n}
}
export function fft2(re:Float64Array,im:Float64Array,inverse=false){
 const r=new Float64Array(VX),c=new Float64Array(VX)
 for(let y=0;y<VY;y++){for(let x=0;x<VX;x++){r[x]=re[x+y*VX];c[x]=im[x+y*VX]}fft(r,c,VX,inverse);for(let x=0;x<VX;x++){re[x+y*VX]=r[x];im[x+y*VX]=c[x]}}
 for(let x=0;x<VX;x++){for(let y=0;y<VY;y++){r[y]=re[x+y*VX];c[y]=im[x+y*VX]}fft(r,c,VY,inverse);for(let y=0;y<VY;y++){re[x+y*VX]=r[y];im[x+y*VX]=c[y]}}
}
export function sample(field:Float64Array,x:number,y:number){
 const xx=wrap(x,LX)*VX/LX,yy=wrap(y,LY)*VY/LY,i=Math.floor(xx),j=Math.floor(yy),tx=xx-i,ty=yy-j
 const a=i+j*VX,b=(i+1)%VX+j*VX,c=i+((j+1)%VY)*VX,d=(i+1)%VX+((j+1)%VY)*VX
 return (1-ty)*((1-tx)*field[a]+tx*field[b])+ty*((1-tx)*field[c]+tx*field[d])
}
export class VorticityFlow {
 omega=new Float64Array(N)
 u=new Float64Array(N)
 v=new Float64Array(N)
 private forward=new Float64Array(N)
 private re=new Float64Array(N)
 private im=new Float64Array(N)
 private ur=new Float64Array(N)
 private ui=new Float64Array(N)
 private vr=new Float64Array(N)
 private vi=new Float64Array(N)
 constructor(seed=true){
  if(seed){
   const vortices=[[0.52,0.34,-20],[0.52,0.66,20],[1.35,0.39,17],[1.40,0.64,-17]]
   for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
    for(const [cx,cy,strength] of vortices){const dx=wrap(x*LX/VX-cx+LX/2,LX)-LX/2,dy=wrap(y/VY-cy+0.5,1)-0.5;this.omega[x+y*VX]+=strength*Math.exp(-(dx*dx+dy*dy)/(2*0.072**2))}
   }
  }
  this.rebuild()
 }
 // Nyquist derivative modes are removed, preserving real-valued fields and the
 // compatible Fourier derivative pair. All nonzero resolved modes use -Δ^-1.
 rebuild(diffusionDt=0){
  this.re.set(this.omega);this.im.fill(0);fft2(this.re,this.im)
  for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
   const k=x+y*VX,kx=2*Math.PI*(x<VX/2?x:x-VX)/LX,ky=2*Math.PI*(y<VY/2?y:y-VY)/LY,k2=kx*kx+ky*ky
   if(k2===0||x===VX/2||y===VY/2){this.re[k]=0;this.im[k]=0;this.ur[k]=0;this.ui[k]=0;this.vr[k]=0;this.vi[k]=0;continue}
   const damp=Math.exp(-VISCOSITY*k2*diffusionDt);this.re[k]*=damp;this.im[k]*=damp
   this.ur[k]=-ky*this.im[k]/k2;this.ui[k]=ky*this.re[k]/k2
   this.vr[k]=kx*this.im[k]/k2;this.vi[k]=-kx*this.re[k]/k2
  }
  fft2(this.ur,this.ui,true);fft2(this.vr,this.vi,true);this.u.set(this.ur);this.v.set(this.vr)
  fft2(this.re,this.im,true);this.omega.set(this.re)
 }
 step(){
  const bx=new Float64Array(N),by=new Float64Array(N)
  for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
   const k=x+y*VX,px=x*LX/VX,py=y/VY
   const mx=px-VDT*this.u[k]/2,my=py-VDT*this.v[k]/2
   bx[k]=px-VDT*sample(this.u,mx,my);by[k]=py-VDT*sample(this.v,mx,my)
   this.forward[k]=sample(this.omega,bx[k],by[k])
  }
  const next=new Float64Array(N)
  for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
   const k=x+y*VX,px=x*LX/VX,py=y/VY,mx=px+VDT*this.u[k]/2,my=py+VDT*this.v[k]/2
   const back=sample(this.forward,px+VDT*sample(this.u,mx,my),py+VDT*sample(this.v,mx,my))
   const xx=Math.floor(wrap(bx[k],LX)*VX/LX),yy=Math.floor(wrap(by[k],1)*VY)
   const a=this.omega[xx+yy*VX],b=this.omega[(xx+1)%VX+yy*VX],c=this.omega[xx+((yy+1)%VY)*VX],d=this.omega[(xx+1)%VX+((yy+1)%VY)*VX]
   next[k]=Math.max(Math.min(a,b,c,d),Math.min(Math.max(a,b,c,d),this.forward[k]+0.5*(this.omega[k]-back)))
  }
  this.omega.set(next);this.rebuild(VDT)
 }
 // A localized velocity impulse: add its CURL, then reconstruct the solenoidal
 // velocity. Its divergent part is removed by the streamfunction inversion.
 push(cx:number,cy:number,fx:number,fy:number){
  const sigma=0.075,limit=0.65,length=Math.hypot(fx,fy),gain=length>limit?limit/length:1
  fx*=gain;fy*=gain
  for(let y=0;y<VY;y++)for(let x=0;x<VX;x++){
   const dx=wrap(x*LX/VX-cx+1,2)-1,dy=wrap(y/VY-cy+0.5,1)-0.5
   this.omega[x+y*VX]+=(dy*fx-dx*fy)/(sigma*sigma)*Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma))
  }
  this.rebuild()
 }
}
