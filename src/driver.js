import {hazardStage} from './hazards.js';
import {sweptContact,clearance,isPickup} from './collision.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const BOOST_COST=25,BOOST_DURATION=1.8,THROTTLE_SPEED=1.5,BOOST_SPEED=1.95;
export function createDriver(){return {distance:0,speed:0,throttle:false,x:0,vx:0,jump:0,vy:0,jumpReady:true,time:0,boost:0,energy:0,boostReady:true,boosts:0,dodges:0,resolved:new Set(),slow:0,shield:0,invulnerable:0,drift:0,wasDrift:false,driftDirection:0,events:[],consumed:new Set(),pickups:0,hits:0,drifts:0,jumps:0};}
export function emit(s,type,text){s.events.push({type,text,time:s.time});if(s.events.length>12)s.events.shift();}
export function charge(s,amount){s.energy=Math.min(100,s.energy+amount);}
export function collect(s,o){
 if(o.type==='boost'){charge(s,35);s.pickups++;emit(s,'charge','부스터 +35 · E / 부스터로 사용');}
 else if(o.type==='shield'){s.shield=9;s.pickups++;emit(s,'shield','버블 실드 · 충돌 1회 방어');}
 else if(s.invulnerable<=0){
  if(s.shield>0){s.shield=0;s.invulnerable=1;emit(s,'shield','실드가 충돌을 막았어요');}
  else {s.slow=o.type==='toxic'?2.8:1.8;s.speed*=o.type==='toxic'?.6:.48;s.invulnerable=1.3;s.hits++;emit(s,'hit',o.type==='toxic'?'먹물 아이템! 잠시 속도가 줄어요':o.type==='breacher'?'거대 생물과 접촉! 물거품 예고를 확인하세요':o.type==='shark'?'상어와 충돌! 옆으로 피하세요':'장애물 접촉! 점프로 넘을 수 있어요');}
 }
}
export function advanceDriver(s,input,dt){
 const previous=s.distance,oldX=s.x,oldJump=s.jump;
 for(const key of ['boost','slow','shield','invulnerable'])s[key]=Math.max(0,s[key]-dt);
 const steer=clamp(input.steer||0,-1,1),drifting=!!input.drift&&Math.abs(steer)>.2&&s.speed>14&&s.jump<.1;
 if(drifting){if(s.wasDrift&&Math.sign(steer)!==s.driftDirection)s.drift=0;s.driftDirection=Math.sign(steer);s.drift=Math.min(2.2,s.drift+dt);}
 if(s.wasDrift&&!drifting){if(s.drift>=.65){const gain=Math.round(12+s.drift*10);charge(s,gain);s.drifts++;emit(s,'drift',`드리프트 충전 +${gain}`);}s.drift=0;}
 s.wasDrift=drifting;s.throttle=!!input.throttle&&!input.brake;
 if(!input.boost)s.boostReady=true;
 if(input.boost&&s.boostReady){s.boostReady=false;if(s.boost<=0&&!input.brake&&s.energy>=BOOST_COST){s.energy-=BOOST_COST;s.boost=BOOST_DURATION;s.boosts++;s.slow=0;emit(s,'boost','가속! 해류를 가르세요');}else if(s.energy<BOOST_COST&&s.boost<=0)emit(s,'empty','부스터 25 필요 · 아이템과 회피로 충전');}
 if(input.brake)s.boost=0;
 const target=(input.brake?9:s.course.speed)*(s.boost>0?BOOST_SPEED:s.throttle?THROTTLE_SPEED:1)*(s.slow>0?.49:1)*(drifting?.91:1);
 s.speed+=(target-s.speed)*(1-Math.exp(-dt*(input.brake?4:s.boost>0?3.4:s.throttle?2.5:1.25)));
 const targetV=steer*(drifting?11:14);s.vx+=(targetV-s.vx)*(1-Math.exp(-dt*(drifting?3.5:9)));
 s.x+=s.vx*dt;if(Math.abs(s.x)>7.2){s.x=clamp(s.x,-7.2,7.2);s.vx*=.35;}
 if(input.jump&&s.jumpReady&&s.jump===0){s.vy=11.5;s.jumpReady=false;s.jumps++;emit(s,'jump','점프!');}if(!input.jump)s.jumpReady=true;
 s.vy-=18*dt;s.jump=Math.max(0,s.jump+s.vy*dt);if(s.jump===0)s.vy=0;
 s.distance+=s.speed*dt;
 const visualTime=s.visualTime??s.time;
 const before={d:previous,x:oldX,jump:oldJump,time:s.time-dt,visualTime:visualTime-dt};
 const after={d:s.distance,x:s.x,jump:s.jump,time:s.time,visualTime};
 for(const o of s.objects){
  const margin=clearance(o);
  for(let lap=Math.max(0,Math.floor((previous-margin)/s.length));lap<=Math.min(s.laps-1,Math.floor((s.distance+margin)/s.length));lap++){
   const targetD=lap*s.length+o.d,key=`${lap}:${o.id}`;
   if(targetD+margin<previous||targetD-margin>s.distance||s.resolved.has(key))continue;
   if(!s.consumed.has(key)&&sweptContact(s,o,targetD,before,after)){
    s.consumed.add(key);collect(s,o);
   }
   // Reward only after the whole craft has passed, once per obstacle per lap.
   // A shielded/immune contact still counts as contact, never as a dodge.
   if(s.distance>=targetD+margin){
    s.resolved.add(key);
    if(!isPickup(o)&&!s.consumed.has(key)&&(o.type!=='breacher'||hazardStage(s,o,lap).solid)){charge(s,10);s.dodges++;emit(s,'dodge','회피 성공 · 부스터 +10');}
   }
  }
 }
}
