import test from 'node:test';import assert from 'node:assert/strict';
import * as T from 'three';
import {makeCraft,animateCraft} from '../src/models.js';
import {COURSES,createRace,stepRace} from '../src/game.js';
import {createTrack} from '../src/track.js';
import {seabedField,buildSeabed} from '../src/underwater.js';
import {audioMix,synthesizeAmbience} from '../src/audio-synthesis.js';
import {OceanAudio} from '../src/audio.js';
import {batch} from '../src/scene.js';

test('rider has real volume, a helmet and working lean distinct from the bike',()=>{
 const bike=makeCraft(),rider=bike.getObjectByName('sport-rider'),head=bike.getObjectByName('helmet');assert.ok(rider&&head);
 const bounds=new T.Box3().setFromObject(bike),size=bounds.getSize(new T.Vector3());assert.ok(size.y>3&&size.z>5);const baseY=bike.rotation.y;
 animateCraft(bike,{steer:1,jump:2,time:1,speed:30});assert.ok(rider.rotation.z<-.1);assert.ok(head.rotation.y<0);assert.equal(bike.rotation.y,baseY);
});
test('static batching preserves geometry under a translated/scaled animated parent',()=>{
 const bike=makeCraft(),head=bike.userData.head;bike.position.set(5,8,-11);bike.rotation.y=.5;
 bike.updateWorldMatrix(true,true);const before=new T.Box3().setFromObject(head,true);batch(head);const after=new T.Box3().setFromObject(head,true);
 assert.ok(before.min.distanceTo(after.min)<.03&&before.max.distanceTo(after.max)<.03);
});
test('three courses have a continuous seabed below the entire rideable corridor',()=>{
 for(const course of COURSES){const track=createTrack(course),floor=seabedField(track);for(let d=0;d<track.length;d+=5)for(const x of [-7.2,0,7.2]){const {p}=track.sample(d,x);assert.ok(p.y-floor(p.x,p.z)>7,`${course.id} at ${d}/${x}`);}}
});
test('submerged terrain has mesh depth and surface normals, with instanced rocks',()=>{
 const terrain=buildSeabed(createTrack(COURSES[1]),COURSES[1]),ground=terrain.group.getObjectByName('continuous-seabed');ground.geometry.computeBoundingBox();
 const size=ground.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.y>50);assert.ok(ground.geometry.attributes.normal.count>20000);assert.ok(terrain.group.children.some(m=>m.isInstancedMesh&&m.count>100));
});
test('surface waves are silent underwater and bubbles are silent above water',()=>{
 const dry=audioMix(0,30,true),wet=audioMix(1,30,true),half=audioMix(.5,30,true);
 assert.ok(dry.surface>0);assert.equal(dry.bubbles,0);assert.equal(dry.underwater,0);
 assert.equal(wet.surface,0);assert.ok(wet.bubbles>0&&wet.underwater>0);
 assert.ok(half.surface>0&&half.bubbles>0);assert.ok(wet.motorHz<dry.motorHz);
 for(const active of [false])for(const immersion of [0,.5,1]){const m=audioMix(immersion,40,active);assert.equal(m.surface+m.underwater+m.bubbles+m.motor,0);}
});
test('audio layers contain distinct bounded sound and decaying individual bubbles',()=>{
 const tracks=synthesizeAmbience(12000,3);const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
 for(const [name,data] of Object.entries(tracks)){assert.equal(data.length,36000);assert.ok(rms(data)>.005,name);assert.ok(data.every(v=>Number.isFinite(v)&&Math.abs(v)<1));}
 assert.notDeepEqual(tracks.surface,tracks.underwater);assert.ok(tracks.bubbles.filter(v=>v===0).length>10000);
});
test('rivals race continuously without vanishing far ahead after player collisions',()=>{
 const s=createRace({seed:19});s.phase='racing';let max=0;
 for(let i=0;i<24000&&s.phase!=='finished';i++){const before=s.rivals.map(r=>r.distance);stepRace(s,{},1/60);s.rivals.forEach((r,j)=>{assert.ok(r.distance>=before[j]&&r.distance-before[j]<1);max=Math.max(max,r.distance-s.distance);assert.ok(Number.isFinite(r.x)&&Math.abs(r.x)<=5.01);});}
 assert.ok(max<125,`largest pack gap ${max}`);assert.equal(s.phase,'finished');
});

// Exercise the actual audio graph, including mute after submerged audio has started.
function fakeContext(){
 const params=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});
 const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:params(),frequency:params()});
 return class{sampleRate=12000;currentTime=1;destination={};createGain(){return node();}createDynamicsCompressor(){return {...node(),threshold:params(),ratio:params()};}createBuffer(n,len){const data=new Float32Array(len);return {getChannelData:()=>data};}createBufferSource(){return node();}createOscillator(){return node();}createBiquadFilter(){return node();}async resume(){}};
}
test('real mixer updates every bus, reuses one context and mutes all sounds on pause',async()=>{
 const old=globalThis.window;globalThis.window={AudioContext:fakeContext()};try{const audio=new OceanAudio();await audio.enable();const ctx=audio.ctx;audio.update(33,1,true);assert.equal(audio.layers.surface.gain.value,0);assert.ok(audio.layers.bubbles.gain.value>0);audio.update(33,0,true);assert.equal(audio.layers.bubbles.gain.value,0);assert.ok(audio.layers.surface.gain.value>0);audio.update(33,1,false);assert.equal(audio.master.gain.value,0);assert.equal(audio.layers.underwater.gain.value,0);audio.disable();await audio.enable();assert.equal(audio.ctx,ctx);}finally{globalThis.window=old;}
});
