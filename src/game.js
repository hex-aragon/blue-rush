import {createDriver,advanceDriver,emit} from './driver.js';
import {updateHazards} from './hazards.js';
export {emit,collect,charge,BOOST_COST,BOOST_DURATION,THROTTLE_SPEED,BOOST_SPEED} from './driver.js';
export {objectXAt} from './collision.js';
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
 const rng=random(seed),rows=[{id:0,d:55,lane:0,x:0,type:'boost'}];let id=1,previousSafe=0,row=0;
 for(let d=90;d<length-45;d+=72+rng()*18){
  const choices=[-1,0,1].filter(lane=>Math.abs(lane-previousSafe)<=1),safe=choices[Math.floor(rng()*choices.length)];previousSafe=safe;const hazard=['fish','crab','rock','shark'][row%4],surprise=row%5===3,ambushLane=[-1,0,1].filter(l=>l!==safe)[Math.floor(rng()*2)];row++;
  for(let lane=-1;lane<=1;lane++){
   const roll=rng();if(lane===safe){rows.push({id:id++,d,lane,x:lane*5,type:roll<.8?'boost':'shield'});}
   else if(surprise?lane===ambushLane:roll<.92){const type=surprise?'breacher':roll<.12?'toxic':hazard;rows.push({id:id++,d,lane,x:lane*5,type,phase:rng()*6.28,move:0});}
  }
 }
 // Every row leaves a rewarded safe lane, including moving-animal clearance.
 return rows;
}
export function createRace({length=1600,course=COURSES[0],seed=1,laps=3,track=null}={}){
 return {...createDriver(),phase:'countdown',countdown:3,length,course,laps,track,hazards:new Map(),objects:makeObjects(length,seed,course),bestLap:Infinity,lapTimes:[],lapStarted:0,rivals:['Mako','Nori','Coral'].map((name,i)=>({...createDriver(),name,distance:9+i*8,x:[-5,5,0][i],lane:[-1,1,0][i],style:i,pace:0}))};
}
export function stepRace(s,input,dt){
 dt=clamp(dt,0,.05);if(!['racing','countdown'].includes(s.phase))return;
 if(s.phase==='countdown'){s.countdown-=dt;if(s.countdown<=0){s.phase='racing';emit(s,'start','출발! 세 바퀴를 완주하세요');}return;}
 const previous=s.distance,previousLap=Math.floor(previous/s.length);s.time+=dt;
 if(updateHazards(s).length)emit(s,'threat','거대 생물 출현! 물거품이 이는 길을 피하세요');
 advanceDriver(s,input,dt);
 stepRivals(s,dt);
 const lap=Math.floor(s.distance/s.length);if(lap>previousLap){const split=s.time-s.lapStarted;s.lapTimes.push(split);s.bestLap=Math.min(s.bestLap,split);s.lapStarted=s.time;if(lap<s.laps)emit(s,'lap',`${lap+1}번째 바퀴 · ${s.laps-lap===1?'마지막 스퍼트!':'계속 달려요'}`);}
 if(s.distance>=s.length*s.laps){s.distance=s.length*s.laps;s.phase='finished';s.rank=1+s.rivals.filter(r=>r.distance>=s.distance).length;emit(s,'finish','완주!');}
}
export const position=s=>1+s.rivals.filter(r=>r.distance>s.distance).length;
export function formatTime(seconds){if(!Number.isFinite(seconds))return '—';const ticks=Math.round(Math.max(0,seconds)*100);return `${Math.floor(ticks/6000)}:${(Math.floor(ticks/100)%60).toString().padStart(2,'0')}.${(ticks%100).toString().padStart(2,'0')}`;}
