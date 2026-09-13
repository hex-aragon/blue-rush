import {sweptContact,clearance,isPickup} from './collision.js';
export {objectXAt} from './collision.js';
export const BOOST_COST=25,BOOST_DURATION=1.8;
import {stepRivals} from './rivals.js';
// Deterministic simulation. Units: metres, seconds. Rendering is independent.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mod=(v,n)=>((v%n)+n)%n;
export const COURSES=[
 {id:'reef',name:'산호빛 서킷',tag:'수면에서 심해까지',description:'윤슬 위로 출발해 산호 협곡으로 다이빙. 세 바퀴의 푸른 모험.',depth:52,speed:33,color:0x39dccb,difficulty:'보통',seed:271},
 {id:'abyss',name:'심해의 궤도',tag:'발광 해파리와 상어',description:'푸른 빛이 흐르는 깊은 바다. 상어의 횡단을 읽고 드리프트하세요.',depth:105,speed:36,color:0x8d9cff,difficulty:'도전',seed:983},
 {id:'sunset',name:'노을 웨이브',tag:'물결 위의 스프린트',description:'황금빛 수면과 얕은 바다. 점프와 부스트로 파도를 가르세요.',depth:16,speed:31,color:0xffc181,difficulty:'여유',seed:617},
];
export function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function makeObjects(length,seed,course){
 const rng=random(seed),rows=[{id:0,d:55,lane:0,x:0,type:'boost'}];let id=1,previousSafe=0;
 for(let d=90;d<length-45;d+=64+rng()*18){
  const choices=[-1,0,1].filter(lane=>Math.abs(lane-previousSafe)<=1),safe=choices[Math.floor(rng()*choices.length)];previousSafe=safe;const hazard=rng()<.5?'rock':rng()<.55?'fish':'shark';
  for(let lane=-1;lane<=1;lane++){
   const roll=rng();if(lane===safe){rows.push({id:id++,d,lane,x:lane*5,type:roll<.8?'boost':'shield'});}
   else if(roll<.83){const type=roll<.18?'toxic':hazard;rows.push({id:id++,d,lane,x:lane*5,type,phase:rng()*6.28,move:0});}
  }
 }
 // Every row leaves a rewarded safe lane, including moving-animal clearance.
 return rows;
}
export function createRace({length=1600,course=COURSES[0],seed=1,laps=3,track=null}={}){
 return {phase:'countdown',countdown:3,length,course,laps,track,distance:0,speed:0,x:0,vx:0,jump:0,vy:0,jumpReady:true,time:0,boost:0,energy:0,boostReady:true,boosts:0,dodges:0,resolved:new Set(),slow:0,shield:0,invulnerable:0,drift:0,wasDrift:false,driftDirection:0,events:[],objects:makeObjects(length,seed,course),consumed:new Set(),pickups:0,hits:0,drifts:0,jumps:0,bestLap:Infinity,lapTimes:[],lapStarted:0,rivals:[{name:'Mako',distance:9,speed:course.speed*.94,lane:-1},{name:'Nori',distance:17,speed:course.speed*.91,lane:1},{name:'Coral',distance:25,speed:course.speed*.88,lane:0}]};
}
export function emit(s,type,text){s.events.push({type,text,time:s.time});if(s.events.length>12)s.events.shift();}
export function charge(s,amount){s.energy=Math.min(100,s.energy+amount);}
export function collect(s,o){
 if(o.type==='boost'){charge(s,35);s.pickups++;emit(s,'charge','부스터 +35 · 가속 버튼으로 사용');}
 else if(o.type==='shield'){s.shield=9;s.pickups++;emit(s,'shield','버블 실드 · 충돌 1회 방어');}
 else if(s.invulnerable<=0){
  if(s.shield>0){s.shield=0;s.invulnerable=1;emit(s,'shield','실드가 충돌을 막았어요');}
  else {s.slow=o.type==='toxic'?2.8:1.8;s.speed*=o.type==='toxic'?.6:.48;s.invulnerable=1.3;s.hits++;emit(s,'hit',o.type==='toxic'?'먹물 아이템! 잠시 속도가 줄어요':o.type==='shark'?'상어와 충돌! 옆으로 피하세요':'장애물 접촉! 점프로 넘을 수 있어요');}
 }
}
export function stepRace(s,input,dt){
 dt=clamp(dt,0,.05);if(!['racing','countdown'].includes(s.phase))return;
 if(s.phase==='countdown'){s.countdown-=dt;if(s.countdown<=0){s.phase='racing';emit(s,'start','출발! 세 바퀴를 완주하세요');}return;}
 const previous=s.distance,previousLap=Math.floor(previous/s.length),oldX=s.x,oldJump=s.jump;
 s.time+=dt;for(const key of ['boost','slow','shield','invulnerable'])s[key]=Math.max(0,s[key]-dt);
 const steer=clamp(input.steer||0,-1,1),drifting=!!input.drift&&Math.abs(steer)>.2&&s.speed>14&&s.jump<.1;
 if(drifting){if(s.wasDrift&&Math.sign(steer)!==s.driftDirection)s.drift=0;s.driftDirection=Math.sign(steer);s.drift=Math.min(2.2,s.drift+dt);}
 if(s.wasDrift&&!drifting){if(s.drift>=.65){const gain=Math.round(12+s.drift*10);charge(s,gain);s.drifts++;emit(s,'drift',`드리프트 충전 +${gain}`);}s.drift=0;}
 s.wasDrift=drifting;
 if(!input.boost)s.boostReady=true;
 if(input.boost&&s.boostReady){s.boostReady=false;if(s.boost<=0&&!input.brake&&s.energy>=BOOST_COST){s.energy-=BOOST_COST;s.boost=BOOST_DURATION;s.boosts++;s.slow=0;emit(s,'boost','가속! 해류를 가르세요');}else if(s.energy<BOOST_COST&&s.boost<=0)emit(s,'empty','부스터 25 필요 · 아이템과 회피로 충전');}
 if(input.brake)s.boost=0;
 const target=(input.brake?9:s.course.speed)*(s.boost>0?1.75:1)*(s.slow>0?.49:1)*(drifting?.91:1);
 s.speed+=(target-s.speed)*(1-Math.exp(-dt*(input.brake?4:s.boost>0?3.4:1.25)));
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
    if(!isPickup(o)&&!s.consumed.has(key)){charge(s,10);s.dodges++;emit(s,'dodge','회피 성공 · 부스터 +10');}
   }
  }
 }
 stepRivals(s,dt);
 const lap=Math.floor(s.distance/s.length);if(lap>previousLap){const split=s.time-s.lapStarted;s.lapTimes.push(split);s.bestLap=Math.min(s.bestLap,split);s.lapStarted=s.time;if(lap<s.laps)emit(s,'lap',`${lap+1}번째 바퀴 · ${s.laps-lap===1?'마지막 스퍼트!':'계속 달려요'}`);}
 if(s.distance>=s.length*s.laps){s.distance=s.length*s.laps;s.phase='finished';s.rank=1+s.rivals.filter(r=>r.distance>=s.distance).length;emit(s,'finish','완주!');}
}
export const position=s=>1+s.rivals.filter(r=>r.distance>s.distance).length;
export function formatTime(seconds){if(!Number.isFinite(seconds))return '—';const ticks=Math.round(Math.max(0,seconds)*100);return `${Math.floor(ticks/6000)}:${(Math.floor(ticks/100)%60).toString().padStart(2,'0')}.${(ticks%100).toString().padStart(2,'0')}`;}
