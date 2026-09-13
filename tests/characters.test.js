import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {CHARACTERS,characterById,characterLineup} from '../src/characters.js';
import {makeCraft,animateCraft} from '../src/models.js';
import {prepareBike,RaceScene} from '../src/scene.js';

test('each selection races against the other three distinct characters',()=>{
 for(const c of CHARACTERS){const team=characterLineup(c.id);assert.equal(team[0],c);assert.equal(team.length,4);assert.equal(new Set(team.map(c=>c.id)).size,4);}
 assert.equal(characterById('invalid').id,'penguin');assert.equal(characterById(null).id,'penguin');
});
test('marine riders have distinct three-dimensional silhouettes and still sit on aqua-bikes',()=>{
 const heads=[];
 for(const c of CHARACTERS){const bike=makeCraft(c.color,1,c.kind),head=bike.userData.head,rider=bike.userData.rider;
  assert.equal(bike.userData.character,c.kind);assert.ok(bike.getObjectByName('turbine'));assert.ok(rider.parent===bike&&head.parent===rider);
  const bounds=new T.Box3().setFromObject(head).getSize(new T.Vector3());assert.ok(bounds.x>.6&&bounds.y>.6&&bounds.z>.6);heads.push(bounds.toArray().map(n=>n.toFixed(2)).join(','));
  const body=new T.Box3().setFromObject(bike).getSize(new T.Vector3());assert.ok(body.z>5&&body.y>3);
 }
 assert.equal(new Set(heads).size,4);
 assert.ok(makeCraft(0xffb44f,1,'penguin').getObjectByName('beak'));
 assert.ok(makeCraft(0xf18cae,1,'fish').getObjectByName('mackerel-fin'));
});
test('mesh batching preserves every character shape and live lean/head/turbine animation',()=>{
 for(const c of CHARACTERS){const bike=makeCraft(c.color,1,c.kind),before=new T.Box3().setFromObject(bike,true);prepareBike(bike);
  const after=new T.Box3().setFromObject(bike,true);assert.ok(before.min.distanceTo(after.min)<.001&&before.max.distanceTo(after.max)<.001);
  animateCraft(bike,{steer:1,jump:2,time:1,speed:50});assert.ok(bike.userData.rider.rotation.z<0);assert.ok(bike.userData.head.rotation.y<0);assert.ok(bike.getObjectByName('turbine').rotation.z>0);
  let count=0;bike.traverse(m=>{if(m.isMesh)count++;});assert.ok(count<40,`${c.id}: ${count}`);
 }
});
test('switching the actual scene team retains shield, updates names and removes old models',()=>{
 const s=Object.create(RaceScene.prototype);s.scene=new T.Scene();s.craft=prepareBike(makeCraft());s.rivals=[1,2,3].map(()=>prepareBike(makeCraft()));s.bubbleShield=new T.Mesh(new T.SphereGeometry(2),new T.MeshBasicMaterial());s.craft.add(s.bubbleShield);s.scene.add(s.craft,...s.rivals);
 s.rivalNames=[0,1,2].map(()=>({textContent:'',style:{setProperty(){}}}));s.foam={reset(){}};s.history=[];
 for(const c of [...CHARACTERS,...CHARACTERS]){const old=s.craft;s.setRiders(c.id);const lineup=characterLineup(c.id);
  assert.equal(s.craft.userData.characterId,c.id);assert.equal(s.bubbleShield.parent,s.craft);assert.equal(s.scene.children.length,4);assert.equal(old.parent,null);
  assert.deepEqual(s.rivalNames.map(n=>n.textContent),lineup.slice(1).map(c=>c.name));assert.equal(s.rivals.length,3);
  const current=s.craft;s.setRiders(c.id);assert.equal(s.craft,current);
 }
});
