import {advanceDriver,clamp,BOOST_COST} from './driver.js';
import {objectXAt,CORES,isPickup} from './collision.js';
import {hazardStage} from './hazards.js';
const mod=(v,n)=>((v%n)+n)%n;
export function planRival(s,r,index){
 const pace=Math.max(18,r.speed),next=s.objects.map(o=>({o,d:mod(o.d-mod(r.distance,s.length)+6,s.length)-6})).filter(a=>a.d>=-4&&a.d<115);
 const visible=next.filter(({o,d})=>o.type!=='breacher'||s.hazards.has(`${Math.floor((r.distance+d)/s.length)}:${o.id}`));
 const danger=visible.filter(a=>!isPickup(a.o));
 const risk=x=>danger.reduce((cost,{o,d})=>{
  const future=s.time+Math.max(0,d)/pace,ox=objectXAt(o,future);
  return cost+(Math.abs(x-ox)<CORES[o.type].x+.95?22*(1-Math.max(0,d)/135):0);
 },0);
 const rivals=[s,...s.rivals.filter(other=>other!==r)];
 const score=x=>risk(x)+Math.abs(x-r.x)*.22+(x===r.targetX?-.4:0)
  -next.filter(({o,d})=>isPickup(o)&&d>0&&Math.abs(o.x-x)<1).reduce((n,{d})=>n+3*(1-d/140),0)
  +rivals.filter(other=>other.distance-r.distance>0&&other.distance-r.distance<18&&Math.abs(other.x-x)<2).length*3.5;
 const lanes=[-5,0,5];r.targetX=lanes.reduce((best,x)=>score(x)<score(best)?x:best,lanes[index%3]);
 r.aiRisk=risk(r.targetX);r.nextDecision=s.time+.12+index*.035;
 return {next:visible,risk:r.aiRisk};
}
export function stepRivals(s,dt){
 for(let i=0;i<s.rivals.length;i++){
  const r=s.rivals[i];if(r.distance>=s.length*s.laps)continue;
  Object.assign(r,{length:s.length,laps:s.laps,course:s.course,track:s.track,objects:s.objects,hazards:s.hazards,time:s.time,visualTime:s.visualTime});
  if(r.nextDecision===undefined||s.time>=r.nextDecision)planRival(s,r,i);
  const steer=clamp((r.targetX-r.x)*.95-r.vx*.16,-1,1),gap=r.distance-s.distance;
  const nearest=s.objects.map(o=>({o,d:mod(o.d-mod(r.distance,s.length)+5,s.length)-5})).filter(({o,d})=>!isPickup(o)&&d>0&&d<65&&
   (o.type!=='breacher'||hazardStage(s,o,Math.floor((r.distance+d)/s.length),s.time+d/Math.max(18,r.speed)).solid));
  const inPath=nearest.filter(({o,d})=>Math.abs(r.x+r.vx*Math.min(.25,d/Math.max(18,r.speed))-objectXAt(o,s.time+d/Math.max(18,r.speed)))<CORES[o.type].x+.8).sort((a,b)=>a.d-b.d);
  const obstacle=inPath[0],eta=obstacle?obstacle.d/Math.max(18,r.speed):Infinity;
  const jump=!!obstacle&&obstacle.o.type!=='breacher'&&eta<.62&&eta>.24&&r.jump===0;
  const urgent=!!obstacle&&eta<.55&&obstacle.o.type==='breacher'&&Math.abs(r.targetX-r.x)>1;
  const brake=gap>52||urgent;
  const boost=!brake&&r.energy>=BOOST_COST&&r.boost<=0&&gap<18&&r.aiRisk<2&&eta>1.1&&Math.abs(r.targetX-r.x)<1&&s.time-(r.lastBoost??-9)>(r.distance>=s.length*(s.laps-1)?2.2+i*.35:3.5+i*.6);
  const previous=r.distance,beforeBoosts=r.boosts;
  advanceDriver(r,{steer,jump,throttle:gap<28||s.speed>s.course.speed*1.2,brake,boost},dt);
  if(r.boosts>beforeBoosts)r.lastBoost=s.time;
  r.pace=r.speed;r.steer=r.vx/14;r.tactic=r.slow>0?'회복 중':r.boost>0?'부스터 추월':jump||r.jump>0?'점프 회피':Math.abs(steer)>.2?'라인 변경':'전력 질주';
  if(r.distance>=s.length*s.laps){r.finishedAt=s.time-dt+dt*(s.length*s.laps-previous)/Math.max(.001,r.distance-previous);r.distance=s.length*s.laps;}
 }
}
