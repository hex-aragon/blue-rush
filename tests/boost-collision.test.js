import test from 'node:test';
import assert from 'node:assert/strict';
import {createRace,stepRace,collect,makeObjects,COURSES} from '../src/game.js';
import {sweptContact,clearance,objectXAt} from '../src/collision.js';
import {createTrack} from '../src/track.js';
const ready=opts=>{const s=createRace(opts);s.phase='racing';s.objects=[];s.speed=33;return s;};
const run=(s,input={},seconds=1)=>{for(let i=0;i<Math.ceil(seconds*60);i++)stepRace(s,input,1/60);};

test('empty tank cannot accelerate; charge is capped and held input cannot spend twice',()=>{
 const s=ready();run(s,{boost:true},.1);assert.equal(s.boosts,0);assert.equal(s.energy,0);
 for(let i=0;i<4;i++)collect(s,{type:'boost'});assert.equal(s.energy,100);
 run(s,{},.1);run(s,{boost:true},4);assert.equal(s.boosts,1);assert.equal(s.energy,75);
 run(s,{},.1);run(s,{boost:true},.1);assert.equal(s.boosts,2);assert.equal(s.energy,50);
});
test('braking cancels a burst, and simultaneous brake/boost cannot waste energy',()=>{
 const s=ready();s.energy=100;run(s,{boost:true,brake:true},.1);assert.equal(s.energy,100);
 run(s,{},.1);run(s,{boost:true},.5);assert.ok(s.speed>50);run(s,{brake:true},1);assert.equal(s.boost,0);assert.ok(s.speed<11);
});
test('paused race preserves banked fuel and boost button cannot spend it',()=>{
 const s=ready();s.energy=70;s.phase='paused';run(s,{boost:true},3);assert.equal(s.energy,70);assert.equal(s.boosts,0);
});
test('whole-body safe passage awards once; passing a pickup does not award dodge fuel',()=>{
 const s=ready();s.x=-5;s.objects=[{id:1,d:20,x:0,type:'rock'},{id:2,d:20,x:5,type:'boost'}];
 while(s.distance<20)stepRace(s,{},1/60);assert.equal(s.dodges,0);
 run(s,{},1);assert.equal(s.dodges,1);assert.equal(s.energy,10);run(s,{},2);assert.equal(s.energy,10);
});
test('shielded, immune and damaging contact never award a dodge',()=>{
 for(const mode of ['shield','invulnerable','none']){const s=ready();s[mode]=9;s.objects=[{id:1,d:10,x:0,type:'rock'}];run(s,{},2);assert.ok(s.consumed.has('0:1'));assert.equal(s.dodges,0);assert.equal(s.energy,0);assert.equal(s.hits,mode==='none'?1:0);}
});
test('jumping over a hazard earns fuel only after clearance',()=>{
 const s=ready();s.objects=[{id:1,d:20,x:0,type:'rock'}];run(s,{jump:true},1);assert.equal(s.hits,0);assert.equal(s.dodges,1);assert.equal(s.energy,10);
});
test('safe lane beside a rock and the rear corners of a rounded core are not hits',()=>{
 const s=ready(),o={type:'rock',x:0};
 const point=(x,d,jump=0)=>({x,d,jump,time:0,visualTime:0});
 assert.equal(sweptContact(s,o,10,point(2.5,10),point(2.5,10)),false);
 assert.equal(sweptContact(s,o,10,point(2.2,12.5),point(2.2,12.5)),false);
 assert.equal(sweptContact(s,o,10,point(0,9),point(0,11)),true);
});
test('high-speed sweep detects a whole obstacle between frames and later swerving behind cannot hit',()=>{
 const s=ready(),o={id:1,type:'rock',d:10,x:0};
 const p=d=>({d,x:0,jump:0,time:0,visualTime:0});
 assert.equal(sweptContact(s,o,10,p(4),p(16)),true);
 s.objects=[o];s.distance=10+clearance(o)+.01;s.x=0;run(s,{},.1);assert.equal(s.hits,0);
});
test('riding the rail boundary no longer applies an invisible speed penalty',()=>{
 const a=ready(),b=ready();run(a,{},10);run(b,{steer:1},10);assert.equal(b.x,7.2);assert.ok(Math.abs(a.speed-b.speed)<1e-9);
});
test('dodge reward respects lap seams and can be earned once on each lap',()=>{
 const s=ready({length:100});s.x=-5;s.distance=96;s.objects=[{id:1,d:98,x:0,type:'rock'},{id:2,d:1,x:0,type:'rock'}];
 run(s,{},.4);assert.equal(s.dodges,2);assert.equal(s.energy,20);
 run(s,{},3.1);assert.equal(s.dodges,4);assert.equal(s.energy,40);
});
test('all seeded rows retain a safe lane at every moving-animal phase',()=>{
 for(let seed=0;seed<40;seed++){
  const objects=makeObjects(1600,seed),rows=new Map();for(const o of objects){if(!rows.has(o.d))rows.set(o.d,[]);rows.get(o.d).push(o);}
  for(const row of rows.values()){
   const safe=row.find(o=>['boost','shield'].includes(o.type));assert.ok(safe);
   for(let t=0;t<8;t+=.25)for(const o of row.filter(o=>!['boost','shield'].includes(o.type))){
    const p={x:safe.x,d:o.d,jump:0,time:t,visualTime:t};assert.equal(sweptContact(ready(),o,o.d,p,p),false,`${seed} ${o.type} ${safe.x} ${objectXAt(o,t)}`);
   }
  }
 }
});
test('surface heave, actual track elevation and animal bob remain finite with no safe-lane collisions',()=>{
 for(const course of COURSES){const track=createTrack(course),s=ready({track,length:track.length,course});
  for(let d=10;d<track.length;d+=41)for(let t=0;t<6;t+=1){
   const o={type:'shark',d,x:0,phase:t},p={d,x:5,jump:0,time:t,visualTime:t};
   assert.equal(sweptContact(s,o,d,p,p),false);
  }
 }
});

test('successive safe lanes stay reachable during maximum-speed acceleration',()=>{
 for(let seed=0;seed<50;seed++){
  const safe=makeObjects(1600,seed).filter(o=>['boost','shield'].includes(o.type)&&o.d>=90);
  for(let i=1;i<safe.length;i++){
   assert.ok(Math.abs(safe[i].x-safe[i-1].x)<=5);
   const travelTime=(safe[i].d-safe[i-1].d-7)/(36*1.75);
   const s=ready();s.x=safe[i-1].x;run(s,{steer:Math.sign(safe[i].x-s.x)},travelTime-.25);
   assert.ok(Math.abs(s.x-safe[i-1].x)>=Math.abs(safe[i].x-safe[i-1].x)||s.x===safe[i].x);
  }
 }
});
