import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { mkdirSync, writeFileSync } from 'node:fs'
import { barometerGeometry, barometerLayout, barometerState, barometerHeight, createBarometer, HEAD, TUBE_LENGTH, RESERVOIR_WIDTH, RESERVOIR_DEPTH, TOTAL_ML, INITIAL_RESERVOIR_ML, INITIAL_COLUMNS_ML, type Point } from '../src/sims/Barometer'
let checks=0
function check(ok:boolean,label:string){assert(ok,label);console.log(`ok ${++checks}: ${label}`)}
let horizontal=true, fixed=true, length=true, vacuum=true, monotone=true, previous=0
let conserved=true, geometryConserves=true, submerged=true, falling=true, lastLevel=1
function area(points:Point[]){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y},0))/2}
function above(points:Point[], level:number){
 const out:Point[]=[]
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length]
  if(a.y>=level)out.push(a)
  if((a.y>=level)!==(b.y>=level))out.push({x:a.x+(b.x-a.x)*(level-a.y)/(b.y-a.y),y:level})
 }
 return out
}
for(let degrees=0;degrees<=55;degrees++){
 const state=barometerState(degrees), level=state.reservoirLevel+HEAD
 for(const g of state.geometries){
  horizontal&&=g.surface.length===2 && g.surface.every(p=>p.y===level) && g.liquid.every(p=>p.y<=level)
  fixed&&=Math.abs(Math.hypot(g.tube[2].x-g.tube[1].x,g.tube[2].y-g.tube[1].y)-TUBE_LENGTH)<1e-9
  length&&=Math.abs(g.alongTube*Math.cos(g.degrees*Math.PI/180)-HEAD)<1e-9
  vacuum&&=g.tube[2].y>level && g.tube[3].y>level
  submerged&&=g.tube[0].y<state.reservoirLevel&&g.tube[1].y<state.reservoirLevel&&g.tube[0].y>-RESERVOIR_DEPTH&&g.tube[1].y>-RESERVOIR_DEPTH
 }
 monotone&&=state.geometries[1].alongTube>previous;previous=state.geometries[1].alongTube
 falling&&=state.reservoirLevel<lastLevel;lastLevel=state.reservoirLevel
 conserved&&=Math.abs(state.reservoirML+state.columnsML-TOTAL_ML)<1e-9&&Math.abs(INITIAL_RESERVOIR_ML-state.reservoirML-(state.columnsML-INITIAL_COLUMNS_ML))<1e-9
 // Integrate the actual polygons drawn, not the volume readouts being tested.
 // The depicted rectangular vessels have uniform 10 mm depth into the page.
 const drawnVolume=(RESERVOIR_WIDTH*(RESERVOIR_DEPTH+state.reservoirLevel)+state.geometries.reduce((sum,g)=>sum+area(above(g.liquid,state.reservoirLevel)),0))*10/1000
 geometryConserves&&=Math.abs(drawnVolume-TOTAL_ML)<1e-8
}
check(horizontal,'all 56 tilt positions keep both surfaces horizontal, 760 mm above the moving bath')
check(fixed,'both glass tubes retain their physical 1600 mm length at every tilt')
check(length,'column length times cos(tilt) equals hydrostatic vertical height')
check(vacuum,'sealed caps remain above the mercury over the complete slider range')
check(monotone,'every tilt increment increases the measured along-tube length')
check(falling,'every tilt increment lowers the shared reservoir and both column tops')
check(submerged,'both open mouths stay submerged and above the tank floor across the slider')
check(conserved,'reservoir loss equals column gain and total volume is conserved at all 56 settings')
check(geometryConserves,'integrating the actual liquid polygons plus bath gives the same total volume at every angle')
check(Math.abs(barometerGeometry(55).alongTube-1325.0195646716343)<1e-6,'55 degrees gives a 1325 mm column without changing head')
mkdirSync('_figure_check/barometer',{recursive:true})
for(const w of [640,340]){
 const h=barometerHeight(w),c=createCanvas(w,h),ctx=c.getContext('2d'),layout=barometerLayout(w,h)
 const sampledLevels:number[]=[], sampledAmber:number[]=[]
 let uprightFrame:Buffer|undefined
 for(const angle of [0,35,55]){
  const state=barometerState(angle),levelY=layout.poolY-(HEAD+state.reservoirLevel)*layout.scale
  const sim=createBarometer(angle)
  const draw=()=>{sim.draw(ctx as unknown as CanvasRenderingContext2D,w,h);return Buffer.from(ctx.getImageData(0,0,w,h).data)}
  const first=draw();if(angle===0)uprightFrame=first;sim.step(10)
  check(first.equals(draw()),`${w}px ${angle}°: stable equilibrium drawing, no hidden animation`)
  let surfaceOK=true, sceneFits=true
  for(let side=0;side<2;side++){
   const g=state.geometries[side]
   sceneFits&&=g.tube.every(p=>layout.feet[side]+p.x*layout.scale>0 && layout.feet[side]+p.x*layout.scale<w && layout.poolY-p.y*layout.scale>25)
   const left=Math.min(...g.surface.map(p=>p.x))*layout.scale+layout.feet[side]
   const right=Math.max(...g.surface.map(p=>p.x))*layout.scale+layout.feet[side]
   const heights:number[]=[]
   for(let x=Math.ceil(left+2);x<right-2;x++){
    let found=-1
    // Sample MERCURY itself, not the dashed guide or dark meniscus outline.
    for(let y=Math.floor(levelY)-3;y<layout.poolY;y++){
     const k=4*(x+y*w)
     if(Math.abs(first[k]-71)<4&&Math.abs(first[k+1]-85)<4&&Math.abs(first[k+2]-105)<4){found=y;break}
    }
    if(found>=0)heights.push(found)
   }
   surfaceOK&&=heights.length>=2&&Math.max(...heights)-Math.min(...heights)<=1&&Math.abs(heights[0]-levelY)<3
  }
  check(surfaceOK,`${w}px ${angle}°: BOTH rendered mercury surfaces are level at the actual height ruler`)
  check(sceneFits,`${w}px ${angle}°: full rigid tubes fit the viewport`)
  // Sample the reservoir away from the submerged glass and from its old-level guide.
  const x=Math.round(layout.tankLeft+layout.tankWidth*.8)
  let bath=-1
  for(let y=Math.floor(layout.poolY)-2;y<layout.poolY+RESERVOIR_DEPTH*layout.scale;y++){
   const k=4*(x+y*w)
   if(first[k]===71&&first[k+1]===85&&first[k+2]===105){bath=y;break}
  }
  check(bath>=0&&Math.abs(bath-(layout.poolY-state.reservoirLevel*layout.scale))<3,`${w}px ${angle}°: rendered reservoir mercury follows the computed volume loss`)
  sampledLevels.push(bath)
  if(angle===55){
   const x=Math.round(layout.feet[0]), y=Math.floor(layout.poolY-state.reservoirLevel*layout.scale/2)
   const k=4*(x+y*w)
   check(first[k]===71&&first[k+1]===85&&first[k+2]===105,`${w}px: mercury remains connected through the tube section exposed by the falling bath`)
  }
  let amber=0,gray=0
  for(let x=24;x<w-24;x++){
   const k=4*(x+(h-45)*w)
   if(first[k]===182&&first[k+1]===107&&first[k+2]===23)amber++
   if(first[k]===71&&first[k+1]===85&&first[k+2]===105)gray++
  }
  check(amber+gray>=w-52&&Math.abs(amber/(w-48)-state.columnsML/TOTAL_ML)<.015,`${w}px ${angle}°: fixed-length inventory bar measures the changing volume split`)
  sampledAmber.push(amber)
  writeFileSync(`_figure_check/barometer/${w}-${angle}.png`,c.toBuffer('image/png'))
 }
 check(sampledLevels[2]-sampledLevels[0]>=2,`${w}px: reservoir's actual liquid surface visibly drops`)
 check(sampledAmber[0]<sampledAmber[1]&&sampledAmber[1]<sampledAmber[2],`${w}px: volume bar shows increasing column volume across the whole range`)
 const reset=createBarometer(0);reset.draw(ctx as unknown as CanvasRenderingContext2D,w,h)
 check(uprightFrame!.equals(Buffer.from(ctx.getImageData(0,0,w,h).data)),`${w}px: returning upright restores the original reservoir, columns, and volume bar`)
}
console.log(`${checks} barometer checks passed`)
