import {hazardStage} from './hazards.js';
import {waveHeight} from './legacy/physics.js';

// Forgiving core volumes, in model metres. Ignore decorative fins, spikes and
// the rider's limbs. Fish models face across the rail, so their length is X.
export const CORES={
 crab:{x:1.5,y:.8,z:.8,cy:0},
 breacher:{x:3.1,y:1.0,z:1.0,cy:0},
 rock:{x:1.65,y:1.2,z:1.15,cy:-.05},
 fish:{x:1,y:.55,z:.34,cy:0},
 shark:{x:2.2,y:.60,z:.62,cy:0},
 toxic:{x:.95,y:.95,z:.95,cy:.45},
 boost:{x:1.5,y:2.8,z:.7,cy:0},
 shield:{x:1.5,y:2.8,z:.7,cy:0},
};
export const BIKE_CORE={x:.7,y:.45,z:1.7,cy:.55};
export const isPickup=o=>o.type==='boost'||o.type==='shield';
export const objectXAt=(o,time)=>o.x+(o.type==='crab'?Math.sin(time*.95+(o.phase||0))*1.8:o.type==='shark'?Math.sin(time*.85+(o.phase||0))*1.1:o.type==='fish'?Math.sin(time*2.8+(o.phase||0))*1.25:0);
export const objectHeightAt=(o,time,stage={rise:0})=>o.type==='breacher'?1.4-10*(1-stage.rise):(isPickup(o)?2.1:1.4)+(['fish','shark'].includes(o.type)?Math.sin(time*2+(o.phase||0))*.25:0);
export function craftFrame(track,distance,x,time){
 const f=track.sample(distance,x),surface=f.p.y>-.9;
 if(surface)f.p.y=waveHeight(f.p.x,f.p.z,time,.7)+.08;
 return {...f,surface};
}
function relative(s,o,targetD,p){
 const core=CORES[o.type];let dx=p.x-objectXAt(o,p.time),dz=targetD-p.d,y=p.jump;
 let oy=0;
 if(s.track){
  const c=craftFrame(s.track,p.d,p.x,p.visualTime).p,f=s.track.sample(targetD,objectXAt(o,p.time));
  const wx=c.x-f.p.x,wz=c.z-f.p.z,h=Math.hypot(f.t.x,f.t.z);
  dx=wx*f.right.x+wz*f.right.z;dz=(wx*f.t.x+wz*f.t.z)/h;y+=c.y;oy=f.p.y;
 }
 return [dx/(core.x+BIKE_CORE.x),(y+BIKE_CORE.cy-oy-objectHeightAt(o,p.time,hazardStage(s,o,Math.floor(targetD/s.length),p.time))-core.cy)/(core.y+BIKE_CORE.y),dz/(core.z+BIKE_CORE.z)];
}
// Segment against a rounded 3D core, including lateral movement, jumping,
// animated animals, track elevation and the same surface heave as rendering.
export function sweptContact(s,o,targetD,before,after){
 if(o.type==='breacher'&&!hazardStage(s,o,Math.floor(targetD/s.length),after.time).solid)return false;
 const a=relative(s,o,targetD,before),b=relative(s,o,targetD,after),v=b.map((n,i)=>n-a[i]);
 const vv=v.reduce((n,k)=>n+k*k,0),u=vv?Math.max(0,Math.min(1,-a.reduce((n,k,i)=>n+k*v[i],0)/vv)):0;
 return a.reduce((n,k,i)=>n+(k+v[i]*u)**2,0)<1;
}
export const clearance=o=>CORES[o.type].z+BIKE_CORE.z+.5;
