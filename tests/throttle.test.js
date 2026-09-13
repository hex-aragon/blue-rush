import test from 'node:test';
import assert from 'node:assert/strict';
import {createRace,stepRace,collect,COURSES,THROTTLE_SPEED,BOOST_SPEED} from '../src/game.js';
const ready=course=>{const s=createRace({course});s.phase='racing';s.objects=[];return s;};
const run=(s,input={},seconds=1)=>{for(let i=0;i<Math.ceil(seconds*60);i++)stepRace(s,input,1/60);};
test('holding throttle moves significantly faster on all courses without fuel',()=>{
 for(const course of COURSES){const normal=ready(course),fast=ready(course);run(normal,{},5);run(fast,{throttle:true},5);
  assert.ok(fast.distance>normal.distance*1.5);assert.ok(Math.abs(fast.speed-course.speed*THROTTLE_SPEED)<.01);assert.equal(fast.energy,0);assert.equal(fast.boosts,0);assert.equal(fast.throttle,true);
 }
});
test('releasing throttle smoothly returns to cruising speed',()=>{
 const s=ready(COURSES[0]);run(s,{throttle:true},4);const top=s.speed;stepRace(s,{},1/60);assert.ok(s.speed<top&&s.speed>top-1);run(s,{},5);assert.ok(Math.abs(s.speed-s.course.speed)<.1);assert.equal(s.throttle,false);
});
test('boost works alongside throttle and returns to held throttle speed',()=>{
 const s=ready(COURSES[0]);run(s,{throttle:true},3);collect(s,{type:'boost'});run(s,{throttle:true,boost:true},1.4);
 assert.equal(s.energy,10);assert.ok(s.speed>s.course.speed*1.9);assert.ok(s.speed<s.course.speed*BOOST_SPEED);
 run(s,{throttle:true},5);assert.equal(s.boost,0);assert.equal(s.energy,10);assert.ok(Math.abs(s.speed-s.course.speed*THROTTLE_SPEED)<.01);
});
test('brake overrides held throttle and boost; hazards still slow the craft',()=>{
 const s=ready(COURSES[0]);run(s,{throttle:true},3);collect(s,{type:'toxic'});run(s,{throttle:true},1);assert.ok(s.speed<30);assert.ok(s.slow>0);
 run(s,{throttle:true},5);run(s,{throttle:true,brake:true},1);assert.ok(s.speed<11);assert.equal(s.throttle,false);
});
test('throttle input cannot move the craft during countdown or pause',()=>{
 const s=createRace();run(s,{throttle:true},2);assert.equal(s.distance,0);assert.equal(s.throttle,false);
 s.phase='racing';s.objects=[];run(s,{throttle:true},2);s.phase='paused';const distance=s.distance,speed=s.speed;run(s,{throttle:true},3);assert.equal(s.distance,distance);assert.equal(s.speed,speed);
 s.phase='racing';stepRace(s,{},1/60);assert.equal(s.throttle,false);
});
test('competitors remain nearby during sustained throttle without teleporting',()=>{
 const s=ready(COURSES[0]);for(let i=0;i<1200;i++){const before=s.rivals.map(r=>r.distance);stepRace(s,{throttle:true},1/60);s.rivals.forEach((r,j)=>{assert.ok(r.distance>=before[j]&&r.distance-before[j]<2);assert.ok(Math.abs(r.distance-s.distance)<125);});}
});
