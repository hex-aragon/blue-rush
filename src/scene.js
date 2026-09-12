import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWater} from './legacy/water.js';
import {FoamWake} from './legacy/foam.js';
import {waveHeight} from './legacy/physics.js';
import {makeCraft,makeFish,makeObject,ellipsoid,cube,material} from './models.js';
import {mod,random,objectXAt} from './game.js';
const Y=new T.Vector3(0,1,0);
export class RaceScene{
 constructor(container,track,course){
  this.container=container;this.track=track;this.course=course;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.8;this.renderer.domElement.tabIndex=-1;container.append(this.renderer.domElement);
  this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x176783,.0025);this.scene.background=new T.Color(0x176783);
  this.camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.15,3000);
  this.ambient=new T.HemisphereLight(0xc4f7ff,0x174d54,2.2);this.scene.add(this.ambient);this.sun=new T.DirectionalLight(0xffe2b7,3);this.sun.position.set(-100,180,-50);this.scene.add(this.sun);
  const generator=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.env=generator.fromScene(room,.04);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.6;room.dispose();generator.dispose();
  this.sky=new Sky();this.sky.scale.setScalar(2400);this.sky.material.uniforms.sunPosition.value.set(-.3,.3,-.8);this.sky.material.uniforms.turbidity.value=3;this.scene.add(this.sky);
  this.water=createWater();this.water.material.uniforms.waterColor.value.set(0x09657a);this.water.material.uniforms.sunColor.value.set(0xc9d3bd);this.scene.add(this.water);this.foam=new FoamWake(this.scene,{detail:innerWidth<700?'light':'full'});
  this.courseGroup=new T.Group();this.scene.add(this.courseGroup);this.objectGroup=new T.Group();this.scene.add(this.objectGroup);this.objects=[];this.fish=[];this.kelp=[];this.jellies=[];
  this.craft=makeCraft();this.scene.add(this.craft);this.bubbleShield=new T.Mesh(new T.SphereGeometry(3,24,16),new T.MeshBasicMaterial({color:0xb2eaff,wireframe:true,transparent:true,opacity:.16,depthWrite:false}));this.craft.add(this.bubbleShield);
  this.rivals=[0x95caff,0xfb96ad,0xadebad].map(c=>{const m=makeCraft(c);this.scene.add(m);return m;});
  const particles=new Float32Array(900*3),rng=random(5);for(let i=0;i<particles.length;i++)particles[i]=(rng()-.5)*180;this.particles=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(particles,3)),new T.PointsMaterial({color:0xc3faff,size:.16,transparent:true,opacity:.5,depthWrite:false}));this.scene.add(this.particles);
  this.trail=new T.Group();this.scene.add(this.trail);for(let i=0;i<55;i++)ellipsoid(this.trail,[0,0,0],[.1,.1,.1],0x91ffe9,1);this.history=[];
  this.setTrack(track,course);this.snap=true;this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',this.resize);
 }
 disposeGroup(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose();});group.clear();}
 setTrack(track,course){
  this.track=track;this.course=course;this.disposeGroup(this.courseGroup);this.fish=[];this.kelp=[];this.jellies=[];this.history=[];this.foam.reset();this.snap=true;
  this.sky.material.uniforms.sunPosition.value.set(-.3,course.id==='sunset'?.1:.4,-.8);
  const sandMaterial=material(0x477d78);if(!sandMaterial.userData.caustic){sandMaterial.userData.caustic=true;sandMaterial.onBeforeCompile=shader=>{shader.uniforms.flowTime={value:0};this.causticShader=shader;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 seaPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nseaPoint=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 seaPoint; uniform float flowTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat caustic=pow(max(0.0,1.0-abs(sin(seaPoint.x*.33+sin(seaPoint.z*.24+flowTime*.45))+sin(seaPoint.z*.4-flowTime*.6))*.65),12.0);totalEmissiveRadiance+=vec3(.12,.42,.36)*caustic;');};sandMaterial.needsUpdate=true;}
  const positions=[],colors=[],indices=[],slices=720;
  for(let i=0;i<=slices;i++){const f=track.sample(i/slices*track.length);for(const x of [-9,9]){const p=f.p.clone().addScaledVector(f.right,x);positions.push(p.x,p.y-.6,p.z);const col=new T.Color(i%16<8?0x197e88:0x207681);colors.push(col.r,col.g,col.b);}if(i<slices){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const ribbon=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)).setAttribute('color',new T.Float32BufferAttribute(colors,3)).setIndex(indices),new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.60,roughness:.55,metalness:.3,side:T.DoubleSide}));ribbon.geometry.computeVertexNormals();this.courseGroup.add(ribbon);
  for(const side of [-1,1]){const pts=[];for(let i=0;i<=slices;i++){const f=track.sample(i/slices*track.length,side*9);f.p.y+=.5;pts.push(f.p);}const rail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),720,.13,5,false),material(0x83efdc,1));this.courseGroup.add(rail);}
  for(let d=0;d<track.length;d+=23){const f=track.sample(d),g=new T.Group();g.position.copy(f.p);g.rotation.y=Math.atan2(-f.t.x,-f.t.z);this.courseGroup.add(g);
   for(const side of [-1,1]){cube(g,[side*9,.1,0],[.3,1.7,.4],0xe6e8bb,.2);ellipsoid(g,[side*9,1,0],[.22,.22,.22],course.color,2);}
   if(d%69<23){for(const x of [-2,0,2]){const chevron=new T.Mesh(new T.ConeGeometry(.38,1.4,3),material(0xacffe6,.7));chevron.rotation.x=-Math.PI/2;chevron.position.set(x,-.35,0);g.add(chevron);}}
  }
  for(let d=0;d<track.length;d+=150){const f=track.sample(d),arch=new T.Mesh(new T.TorusGeometry(10,.22,6,48,Math.PI),material(d===0?0xffd88d:course.color,1.4));arch.position.copy(f.p);arch.rotation.y=Math.atan2(f.t.x,f.t.z);this.courseGroup.add(arch);if(d===0){const stripe=new T.Group();stripe.position.copy(f.p);stripe.rotation.y=arch.rotation.y;this.courseGroup.add(stripe);for(let i=0;i<18;i++)for(let j=0;j<2;j++)cube(stripe,[i-8.5,-.3,j-.5],[1,.06,1],(i+j)%2?0x153c4c:0xeefcf2);}}
  // Layered seabed beside the racing corridor keeps all visible scenery out of the drivable ribbon.
  const rng=random(course.seed);
  for(let d=0;d<track.length;d+=14){const side=rng()>.5?1:-1,offset=side*(14+rng()*55),f=track.sample(d,offset),g=new T.Group();g.position.copy(f.p);g.position.y-=6+rng()*7;this.courseGroup.add(g);
   const rock=new T.Mesh(new T.DodecahedronGeometry(1,1),material([0x416a6b,0x477779,0x728d7d][Math.floor(rng()*3)]));rock.scale.set(3+rng()*8,3+rng()*8,3+rng()*8);rock.position.y=-4;g.add(rock);
   if(f.p.y< -3){const color=[0xf18b7d,0xdab17f,0x8b9cda,0x85d8b6][Math.floor(rng()*4)];for(let j=0;j<5;j++){const branch=ellipsoid(g,[(rng()-.5)*5,rng()*2,(rng()-.5)*5],[.24+rng()*.3,1+rng()*2,.24],color,.15);branch.rotation.z=(rng()-.5)*.8;ellipsoid(g,[branch.position.x,branch.position.y+branch.scale.y,branch.position.z],[.38,.27,.38],color,.6);}
    if(rng()>.4){for(let j=0;j<4;j++){const leaf=ellipsoid(g,[j-1.5,1.6,1],[.35,3+rng()*2,.13],0x278b75,.1);leaf.rotation.z=(rng()-.5)*.5;this.kelp.push({mesh:leaf,phase:rng()*6});}}
   }
  }
  for(let i=0;i<55;i++){const f=track.sample(rng()*track.length,(rng()>.5?1:-1)*(16+rng()*30));if(f.p.y>-4)f.p.y=-10;const fish=makeFish(i%14===0,[0xfbc777,0x95e3dd,0xdca2dc][i%3]);fish.position.copy(f.p);fish.position.y+=rng()*14;fish.rotation.y=rng()*6;this.courseGroup.add(fish);this.fish.push({mesh:fish,origin:fish.position.clone(),phase:rng()*6,shark:i%14===0});}
  for(let i=0;i<16;i++){const f=track.sample((i+.4)/16*track.length,(i%2?1:-1)*(18+rng()*13));if(f.p.y>-5)continue;const jelly=new T.Group();jelly.position.copy(f.p);jelly.position.y+=8+rng()*7;const jellyMat=new T.MeshStandardMaterial({color:i%2?0x9ae7ed:0xd4b8ff,emissive:i%2?0x65c7dc:0x906bea,emissiveIntensity:.9,transparent:true,opacity:.6,side:T.DoubleSide,roughness:.2,depthWrite:false});const cap=new T.Mesh(new T.SphereGeometry(1.4,18,10,0,Math.PI*2,0,Math.PI*.55),jellyMat);cap.scale.y=.7;jelly.add(cap);for(let j=0;j<7;j++){const a=j/7*Math.PI*2,points=[];for(let k=0;k<8;k++)points.push(new T.Vector3(Math.cos(a)*(.7+.12*Math.sin(k)), -k*.4,Math.sin(a)*(.7+.2*Math.sin(k*1.5))));jelly.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),14,.035,4,false),material(0xb9d0ff,1)));}this.courseGroup.add(jelly);this.jellies.push({mesh:jelly,y:jelly.position.y,phase:rng()*6});}
  // Sun shafts are local to submerged scenery and never cover the centre of the track.
  const rayMat=new T.MeshBasicMaterial({color:0xa0e4e4,transparent:true,opacity:.024,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  for(let d=120;d<track.length;d+=210){const f=track.sample(d,22);if(f.p.y>-8)continue;const ray=new T.Mesh(new T.CylinderGeometry(1.2,8,65,12,1,true),rayMat);ray.position.copy(f.p);ray.position.y+=22;ray.rotation.z=.22;this.courseGroup.add(ray);}
  // Seabed follows the course, so even deep stretches have a lit spatial reference.
  for(let d=0;d<track.length;d+=35){const f=track.sample(d);const sand=new T.Mesh(new T.SphereGeometry(1,12,8),material(0x477d78));sand.scale.set(62,7,42);sand.position.copy(f.p);sand.position.y-=15;sand.rotation.y=Math.atan2(f.t.x,f.t.z);this.courseGroup.add(sand);}
  const dynamic=new Set([...this.fish.map(f=>f.mesh),...this.kelp.map(k=>k.mesh),...this.jellies.map(j=>j.mesh)]),batches=new Map(),remove=[];
  this.courseGroup.updateMatrixWorld(true);
  this.courseGroup.traverse(m=>{if(!m.isMesh)return;let ancestor=m;while(ancestor&&ancestor!==this.courseGroup){if(dynamic.has(ancestor))return;ancestor=ancestor.parent;}if(m.geometry.attributes.color)return;const geo=m.geometry.clone().applyMatrix4(m.matrixWorld);if(geo.index)geo.setIndex(geo.index.clone());const key=m.material;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geo.index?geo.toNonIndexed():geo);remove.push(m);});
  for(const [mat,geos] of batches){const merged=mergeGeometries(geos,false);if(merged)this.courseGroup.add(new T.Mesh(merged,mat));geos.forEach(g=>g.dispose());}remove.forEach(m=>m.removeFromParent());
 }
 setObjects(objects){this.objectGroup.clear();this.objects=objects.map(o=>{const mesh=makeObject(o.type);this.objectGroup.add(mesh);return {o,mesh};});}
 pose(mesh,distance,x,time,jump=0,steer=0){const f=this.track.sample(distance,x),surface=f.p.y>-.9;
  if(surface)f.p.y=waveHeight(f.p.x,f.p.z,time,.7)+.08;mesh.position.copy(f.p);mesh.position.y+=jump;mesh.rotation.set(Math.asin(f.t.y)*.6,Math.atan2(-f.t.x,-f.t.z)+steer*.12,-steer*.16,'YXZ');return {f,surface};
 }
 update(s,t,dt,{menu=false,quality='high'}={}){
  if(this.causticShader)this.causticShader.uniforms.flowTime.value=t;
  const distance=menu?0:s.distance,steer=s.vx/14;const {f,surface}=this.pose(this.craft,distance,menu?0:s.x,t,s.jump,steer+(s.wasDrift?Math.sign(s.vx)*1.5:0));
  this.bubbleShield.visible=s.shield>0;this.craft.visible=s.invulnerable<=0||Math.floor(t*14)%2===0;
  this.rivals.forEach((m,i)=>{m.visible=!menu;this.pose(m,s.rivals[i].distance,s.rivals[i].lane*5,t);});
  const lap=Math.floor(s.distance/s.length);
  for(const {o,mesh} of this.objects){let delta=mod(o.d-mod(s.distance,s.length)+s.length/2,s.length)-s.length/2;const objLap=lap+(o.d<mod(s.distance,s.length)&&delta>0?1:o.d>mod(s.distance,s.length)&&delta<0?-1:0);mesh.visible=!s.consumed.has(`${objLap}:${o.id}`)&&Math.abs(delta)<260;
   if(!mesh.visible)continue;const frame=this.track.sample(o.d,objectXAt(o,s.time));mesh.position.copy(frame.p);mesh.position.y+=(o.type==='boost'||o.type==='shield'?2.1:1.4)+(o.type==='fish'||o.type==='shark'?Math.sin(t*2+o.phase)*.25:0);mesh.rotation.y=Math.atan2(frame.t.x,frame.t.z)+(o.type==='shark'||o.type==='fish'?Math.PI/2:0);if(mesh.userData.spin)mesh.rotation.z=Math.sin(t*1.4)*.2;mesh.traverse(m=>{if(m.userData.tail)m.userData.tail.rotation.y=Math.sin(t*5+o.id)*.35;});
  }
  this.fish.forEach(({mesh,origin,phase,shark})=>{mesh.visible=mesh.position.distanceTo(this.camera.position)<155;mesh.position.x=origin.x+Math.sin(t*.18+phase)*9;mesh.position.y=origin.y+Math.sin(t*.6+phase);mesh.rotation.y=Math.cos(t*.18+phase)>0?-Math.PI/2:Math.PI/2;mesh.userData.tail.rotation.y=Math.sin(t*(shark?3:7)+phase)*.3;});
  this.jellies.forEach(({mesh,y,phase})=>{mesh.visible=mesh.position.distanceTo(this.camera.position)<150;mesh.position.y=y+Math.sin(t*.9+phase);mesh.scale.setScalar(1+Math.sin(t*2+phase)*.07);});
  if(quality==='high')this.kelp.forEach(({mesh,phase})=>mesh.rotation.z=Math.sin(t*1.2+phase)*.22);
  const under=this.craft.position.y<-3;const viewDepth=Math.max(0,-this.craft.position.y);this.water.visible=!under;this.sky.visible=!under;this.scene.background.set(under?(this.course.id==='abyss'?0x082e4c:0x14647e):0x85c6d9);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=under?.0038:.0013;
  this.renderer.toneMappingExposure=under?1.05:.72;this.ambient.intensity=under?2:1.6;this.sun.intensity=under?1.6:3;this.water.material.uniforms.time.value=t;this.water.material.uniforms.waveStrength.value=.7;
  const forward=f.t.clone();forward.y=0;forward.normalize();let desired;
  if(menu){desired=this.craft.position.clone().add(new T.Vector3(10,7,13));this.camera.position.lerp(desired,this.snap?1:.04);this.camera.lookAt(this.craft.position.clone().add(new T.Vector3(-7,2,-9)));}
  else{const mobile=innerWidth<700,back=mobile?19:15;desired=this.craft.position.clone().addScaledVector(forward,-back);desired.y=f.p.y+(mobile?9:7)+s.jump*.25;this.camera.position.lerp(desired,this.snap?1:1-Math.exp(-dt*7));const target=this.craft.position.clone().addScaledVector(forward,14);target.y=f.p.y+2;this.camera.lookAt(target);}
  this.camera.fov=(innerWidth<700?69:64)+(s.boost>0&&!this.reduced?5:0);this.camera.updateProjectionMatrix();this.snap=false;
  this.particles.visible=under;this.particles.position.copy(this.camera.position);if(!this.reduced)this.particles.rotation.y=t*.007;
  if(surface&&!menu){const p=this.craft.position;this.foam.update({x:p.x,z:p.z,heading:Math.atan2(f.t.x,-f.t.z),speed:s.speed,heave:p.y-s.jump,pitch:0,roll:0,rudder:steer,jumpHeight:s.jump,throttle:1},{kind:'jetski',length:5,beam:2,draft:.4},t,.7);}else{this.foam.reset();}
  if(!menu&&s.speed>2){this.history.unshift(this.craft.position.clone().addScaledVector(forward,-2));if(this.history.length>55)this.history.pop();}
  this.trail.children.forEach((m,i)=>{const p=this.history[i];m.visible=!!p&&(under||s.boost>0||s.wasDrift);if(p){m.position.copy(p);m.position.x+=Math.sin(i*2+t*8)*.35;m.position.y+=.3;m.scale.setScalar((1-i/55)*(s.boost>0?.32:.17));}});
  this.renderer.render(this.scene,this.camera);
  return {under,depth:viewDepth,drawCalls:this.renderer.info.render.calls};
 }
 setQuality(q){this.renderer.setPixelRatio(q==='low'?1:Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);}
}
