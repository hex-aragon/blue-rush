import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRace,stepRace,makeObjects,COURSES,BOOST_SPEED} from '../src/game.js';
import {planRival} from '../src/rivals.js';
import {hazardStage,updateHazards,WARNING_SECONDS,RISE_SECONDS} from '../src/hazards.js';
import {objectXAt,sweptContact,objectHeightAt} from '../src/collision.js';
import {makeObject} from '../src/models.js';
import {createTrack} from '../src/track.js';
const ready=()=>{const s=createRace();s.phase='racing';s.objects=[];return s;};
const point=(d,time,x=0)=>({d,x,jump:0,time,visualTime:time});

test('small fish dart faster while medium crabs patrol wider in both directions',()=>{
 const fish={type:'fish',x:0,phase:0},crab={type:'crab',x:0,phase:0};
 assert.ok(objectXAt(fish,.1)>objectXAt(crab,.1));
 for(const [o,range] of [[fish,1.25],[crab,1.8]]){const positions=Array.from({length:160},(_,i)=>objectXAt(o,i/10));assert.ok(Math.max(...positions)>range*.99&&Math.min(...positions)<-range*.99);assert.ok(positions.every(p=>Math.abs(p)<=range));}
});
test('giants are intangible while hidden, show warning, then emerge into the shared collider',()=>{
 const s=ready(),o={id:1,type:'breacher',d:100,x:0};s.objects=[o];
 assert.equal(hazardStage(s,o,0).solid,false);assert.equal(sweptContact(s,o,100,point(99,0),point(101,0)),false);
 s.hazards.set('0:1',0);assert.equal(hazardStage(s,o,0,.2).warning,true);assert.equal(hazardStage(s,o,0,.2).rise,0);
 const rising=hazardStage(s,o,0,WARNING_SECONDS+RISE_SECONDS/2);assert.ok(rising.rise>.49&&rising.rise<.51);assert.ok(objectHeightAt(o,.8,rising)<-3);
 assert.equal(sweptContact(s,o,100,point(99,1.1),point(101,1.15)),true);
 assert.equal(hazardStage(s,o,1,2).solid,false);
});
test('each lap gets one shared warning with time to react at top speed; pause freezes it',()=>{
 const s=ready(),o={id:1,type:'breacher',d:150,x:0};s.objects=[o];s.distance=45;s.speed=36*BOOST_SPEED;s.rivals.forEach(r=>r.distance=0);
 assert.equal(updateHazards(s).length,1);assert.equal(updateHazards(s).length,0);
 assert.ok((150-s.distance)/s.speed>WARNING_SECONDS+RISE_SECONDS+.4);
 s.phase='paused';const before=hazardStage(s,o,0);for(let i=0;i<300;i++)stepRace(s,{},1/60);assert.deepEqual(hazardStage(s,o,0),before);
});
test('active giant rows always leave their item lane safe throughout the warning and pop',()=>{
 for(let seed=0;seed<30;seed++){const s=ready();s.objects=makeObjects(1600,seed);const giants=s.objects.filter(o=>o.type==='breacher');assert.ok(giants.length>=3);
  for(const o of giants){const pickup=s.objects.find(p=>p.d===o.d&&['boost','shield'].includes(p.type));assert.ok(pickup);s.hazards.set(`0:${o.id}`,0);
   for(let t=0;t<2;t+=.1){const p=point(o.d,t,pickup.x);assert.equal(sweptContact(s,o,o.d,p,p),false);}
  }
 }
});
test('new threats have real 3D bodies and a separate warning mesh',()=>{
 const crab=makeObject('crab'),giant=makeObject('breacher'),fish=makeObject('fish');
 assert.equal(crab.userData.claws.length,2);assert.ok(giant.userData.warning&&giant.userData.breachBody);
 const size=m=>new T.Box3().setFromObject(m).getSize(new T.Vector3());assert.ok(size(crab).x>4);assert.ok(size(giant.userData.breachBody).z>7);assert.ok(size(fish).y>1);
});
test('AI contact uses real collision penalties, shields and per-rider pickup resources',()=>{
 for(const shield of [0,9]){const s=ready();s.distance=0;s.x=-5;s.objects=[{id:1,d:10,x:0,type:'rock'}];const r=s.rivals[0];Object.assign(r,{distance:9,x:0,speed:40,shield,targetX:0,nextDecision:Infinity,aiRisk:0});
  stepRace(s,{},1/60);assert.ok(r.consumed.has('0:1'));assert.equal(r.hits,shield?0:1);assert.equal(r.shield,0);if(!shield)assert.ok(r.slow>0&&r.speed<25);
 }
 const s=ready();s.x=-5;s.objects=[{id:1,d:10,x:0,type:'boost'}];const r=s.rivals[0];Object.assign(r,{distance:9,x:0,speed:30,targetX:0,nextDecision:Infinity,aiRisk:0});stepRace(s,{},1/60);assert.equal(r.pickups,1);assert.equal(r.energy,35);assert.equal(s.pickups,0);
});
test('rivals predict moving lanes and earn/use boosts during a close competitive race',()=>{
 const s=ready();s.objects=makeObjects(s.length,19);let changes=0,lastRank=4;
 for(let i=0;i<5000&&s.phase!=='finished';i++){
  planRival(s,s,0);const previous=s.rivals.map(r=>r.distance);
  stepRace(s,{throttle:true,boost:i%240===0&&s.aiRisk<2,steer:Math.max(-1,Math.min(1,(s.targetX-s.x)*.95-s.vx*.16))},1/60);
  const rank=1+s.rivals.filter(r=>r.distance>s.distance).length;if(rank!==lastRank)changes++;lastRank=rank;
  s.rivals.forEach((r,j)=>{assert.ok(r.distance>=previous[j]&&r.distance-previous[j]<=s.course.speed*BOOST_SPEED/60+.001);assert.ok(r.energy>=0&&r.energy<=100);});
 }
 assert.ok(changes>=3,`rank changes: ${changes}`);for(const r of s.rivals){assert.ok(r.boosts>=3);assert.ok(r.pickups>5);assert.ok(r.dodges>5);}
});
test('all courses complete with active threats and finite AI under actual track elevation',()=>{
 for(const course of COURSES){const track=createTrack(course),s=createRace({course,track,length:track.length,seed:19});
  for(let i=0;i<17000&&s.phase!=='finished';i++){stepRace(s,{throttle:true,steer:Math.sin(i*.003),boost:i%300===0,jump:i%110===0},1/60);for(const r of s.rivals)assert.ok(Number.isFinite(r.distance)&&Number.isFinite(r.x)&&Math.abs(r.x)<=7.2);}
  assert.equal(s.phase,'finished');assert.ok(s.hazards.size>5);assert.ok(s.rivals.every(r=>r.pickups>0));
 }
});
