import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWater} from './legacy/water.js';
import {FoamWake} from './legacy/foam.js';
import {craftFrame,objectHeightAt} from './collision.js';
import {makeCraft,animateCraft,makeFish,makeObject,ellipsoid,cube,material} from './models.js';
import {buildSeabed,makeSurfaceUnderside} from './underwater.js';
import {mod,random,objectXAt} from './game.js';
const smooth=(a,b,v)=>T.MathUtils.smoothstep(v,a,b);

// Bake only static meshes; dynamic creatures and instanced rocks preserve their transforms.
export function batch(group,exclude=new Set()){
 group.updateWorldMatrix(true,true);const inverse=new T.Matrix4().copy(group.matrixWorld).invert();const batches=new Map(),remove=[];
 group.traverse(m=>{
  if(!m.isMesh||m.isInstancedMesh||m.geometry.attributes.color||m.material.transparent)return;
  for(let p=m;p&&p!==group;p=p.parent)if(exclude.has(p))return;
  const geo=m.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld)),flat=geo.index?geo.toNonIndexed():geo;
  if(flat!==geo)geo.dispose();if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(flat);remove.push(m);
 });
 for(const [mat,geos]of batches){const merged=mergeGeometries(geos);if(merged){const mesh=new T.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}geos.forEach(g=>g.dispose());}
 remove.forEach(m=>m.removeFromParent());
}
function prepareBike(g){batch(g.userData.head);batch(g.userData.rider,new Set([g.userData.head]));const animated=new Set([g.userData.rider]);g.traverse(o=>{if(o.name==='turbine')animated.add(o);});batch(g,animated);return g;}
function releasePrivate(group){
 const geometries=new Set();group.traverse(m=>{if(m.geometry&&!m.userData.sharedGeometry)geometries.add(m.geometry);});
 // Shared model primitives are not disposed on a course change.
 for(const geo of geometries)if(!geo.userData.shared)geo.dispose();group.clear();
}
export class RaceScene{
 constructor(container,track,course){
  this.container=container;this.track=track;this.course=course;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.setSize(innerWidth,innerHeight);
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.85;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.renderer.domElement.tabIndex=-1;container.append(this.renderer.domElement);
  this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x176783,.003);this.scene.background=new T.Color(0x176783);
  this.camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.15,3000);
  this.ambient=new T.HemisphereLight(0x94d8e7,0x071c26,.85);this.scene.add(this.ambient);
  this.sun=new T.DirectionalLight(0xffe5c0,3.2);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);
  Object.assign(this.sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:240});this.sun.shadow.normalBias=.08;this.sun.shadow.bias=-.00015;this.scene.add(this.sun,this.sun.target);
  this.headlight=new T.SpotLight(0xace8e9,85,115,.52,.65,1);this.scene.add(this.headlight,this.headlight.target);
  const generator=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.env=generator.fromScene(room,.04);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.3;room.dispose();generator.dispose();
  this.sky=new Sky();this.sky.scale.setScalar(2400);this.sky.material.uniforms.turbidity.value=3;this.scene.add(this.sky);
  this.water=createWater();this.water.material.uniforms.waterColor.value.set(0x09657a);this.water.material.uniforms.sunColor.value.set(0xc9d3bd);this.scene.add(this.water);
  this.underside=makeSurfaceUnderside();this.scene.add(this.underside);
  this.foam=new FoamWake(this.scene,{detail:innerWidth<700?'light':'full'});
  this.courseGroup=new T.Group();this.scene.add(this.courseGroup);this.objectGroup=new T.Group();this.scene.add(this.objectGroup);
  this.craft=prepareBike(makeCraft());this.scene.add(this.craft);
  this.bubbleShield=new T.Mesh(new T.SphereGeometry(2.2,24,16),new T.MeshBasicMaterial({color:0x92d9fa,wireframe:true,transparent:true,opacity:.11,depthWrite:false}));this.bubbleShield.position.y=1;this.craft.add(this.bubbleShield);
  this.rivals=[0x49b2e8,0xe576a2,0x99c86d].map((c,i)=>{const m=prepareBike(makeCraft(c,i+2));m.name=['Mako','Nori','Coral'][i];this.scene.add(m);return m;});
  this.rivalNames=this.rivals.map((m,i)=>{const el=document.createElement('span');el.className='rival-name';el.textContent=m.name;el.style.setProperty('--rival-color',['#88cfff','#f4a8c4','#c0e89c'][i]);container.append(el);return el;});
  const particles=new Float32Array(650*3),rng=random(5);for(let i=0;i<particles.length;i++)particles[i]=(rng()-.5)*130;
  this.particles=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(particles,3)),new T.PointsMaterial({color:0xc3faff,size:.09,transparent:true,opacity:.38,depthWrite:false}));this.scene.add(this.particles);
  const bubbleGeometry=new T.SphereGeometry(1,8,6),bubbleMat=new T.MeshPhysicalMaterial({color:0xa7d5dc,metalness:.05,roughness:.09,transparent:true,opacity:.32,depthWrite:false});
  this.trail=new T.InstancedMesh(bubbleGeometry,bubbleMat,120);this.trail.frustumCulled=false;this.scene.add(this.trail);this.dummy=new T.Object3D();this.history=[];
  this.setTrack(track,course);this.snap=true;
  addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);});
 }
 setTrack(track,course){
  this.track=track;this.course=course;releasePrivate(this.courseGroup);if(this.seabed){releasePrivate(this.seabed.group);this.seabed.group.removeFromParent();}
  this.fish=[];this.kelp=[];this.jellies=[];this.objects=[];this.history=[];this.foam.reset();this.snap=true;
  this.sky.material.uniforms.sunPosition.value.set(-.3,course.id==='sunset'?.10:.4,-.8);
  this.seabed=buildSeabed(track,course);batch(this.seabed.coral);this.scene.add(this.seabed.group);
  const positions=[],indices=[],slices=720;
  for(let i=0;i<=slices;i++){
   const f=track.sample(i/slices*track.length);for(const x of [-9,9]){const p=f.p.clone().addScaledVector(f.right,x);positions.push(p.x,p.y-.65,p.z);}
   // No road surface under water: the bikes swim above a real 3D seabed.
   if(i<slices&&f.p.y>-.9&&track.sample((i+1)/slices*track.length).p.y>-.9){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const ribbon=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)).setIndex(indices),new T.MeshStandardMaterial({color:0x287f89,transparent:true,opacity:.24,roughness:.8,metalness:.04,side:T.DoubleSide}));ribbon.geometry.computeVertexNormals();this.courseGroup.add(ribbon);
  for(const side of [-1,1]){const pts=[];for(let i=0;i<=slices;i++){const f=track.sample(i/slices*track.length,side*9);f.p.y-=.55;pts.push(f.p);}this.courseGroup.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),720,.10,6,false),material(0x5caeaa,.65)));}
  for(let d=0;d<track.length;d+=23){const f=track.sample(d),g=new T.Group();g.position.copy(f.p);g.rotation.y=Math.atan2(-f.t.x,-f.t.z);this.courseGroup.add(g);
   for(const side of [-1,1]){cube(g,[side*9,-.55,0],[.22,1.5,.3],0x345d68);ellipsoid(g,[side*9,.22,0],[.16,.16,.16],course.color,1.5);}
   if(d%69<23){const arrow=new T.Mesh(new T.ConeGeometry(.35,1.3,3),material(0x9ee4d1,.5));arrow.rotation.x=-Math.PI/2;arrow.position.set(0,-.65,0);g.add(arrow);}
  }
  for(let d=0;d<track.length;d+=150){const f=track.sample(d),arch=new T.Mesh(new T.TorusGeometry(10,.14,6,48,Math.PI),material(d===0?0xd8b985:0x6cbbb5,.6));arch.position.copy(f.p);arch.rotation.y=Math.atan2(f.t.x,f.t.z);this.courseGroup.add(arch);
   if(d===0){const stripe=new T.Group();stripe.position.copy(f.p);stripe.rotation.y=arch.rotation.y;this.courseGroup.add(stripe);for(let i=0;i<18;i++)for(let j=0;j<2;j++)cube(stripe,[i-8.5,-.6,j-.5],[1,.08,1],(i+j)%2?0x173745:0xb7d3c5);}
  }
  const rng=random(course.seed);
  for(let d=0;d<track.length;d+=30){const f=track.sample(d,(rng()>.5?1:-1)*(15+rng()*13));if(f.p.y>-3)continue;
   const g=new T.Group();g.position.set(f.p.x,this.seabed.height(f.p.x,f.p.z),f.p.z);this.courseGroup.add(g);
   for(let j=0;j<3;j++){const leaf=ellipsoid(g,[j-.8,3,0],[.28,3+rng()*2,.11],0x236852);leaf.rotation.z=(rng()-.5)*.5;this.kelp.push({mesh:leaf,phase:rng()*6});}
  }
  for(let i=0;i<65;i++){const f=track.sample(rng()*track.length,(rng()>.5?1:-1)*(13+rng()*25));if(f.p.y>-4)f.p.y=-12;const fish=makeFish(i%14===0,[0xd6a25d,0x6ebcb7,0xab7db1][i%3]);fish.position.copy(f.p);fish.position.y+=rng()*12-3;this.courseGroup.add(fish);this.fish.push({mesh:fish,origin:fish.position.clone(),phase:rng()*6,shark:i%14===0});}
  for(let i=0;i<17;i++){const f=track.sample((i+.4)/17*track.length,(i%2?1:-1)*(17+rng()*10));if(f.p.y>-5)continue;
   const jelly=new T.Group();jelly.position.copy(f.p);jelly.position.y+=4+rng()*6;
   const jellyMat=new T.MeshStandardMaterial({color:0xa7c7ea,emissive:0x6179ab,emissiveIntensity:.6,transparent:true,opacity:.55,side:T.DoubleSide,roughness:.3,depthWrite:false});
   const cap=new T.Mesh(new T.SphereGeometry(1.3,18,10,0,Math.PI*2,0,Math.PI*.55),jellyMat);cap.scale.y=.7;jelly.add(cap);
   for(let j=0;j<6;j++){const a=j/6*Math.PI*2,points=[];for(let k=0;k<8;k++)points.push(new T.Vector3(Math.cos(a)*(.7+.12*Math.sin(k)),-k*.4,Math.sin(a)*(.7+.2*Math.sin(k*1.5))));jelly.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),14,.03,4,false),material(0x86aacf,.5)));}
   this.courseGroup.add(jelly);this.jellies.push({mesh:jelly,y:jelly.position.y,phase:rng()*6});
  }
  const rayMat=new T.MeshBasicMaterial({color:0x77c9d6,transparent:true,opacity:.013,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  for(let d=100;d<track.length;d+=180){const f=track.sample(d,23);if(f.p.y>-8)continue;const ray=new T.Mesh(new T.CylinderGeometry(1,7,55,10,1,true),rayMat);ray.position.copy(f.p);ray.position.y+=17;ray.rotation.z=.25;this.courseGroup.add(ray);}
  batch(this.courseGroup,new Set([...this.fish.map(f=>f.mesh),...this.kelp.map(k=>k.mesh),...this.jellies.map(j=>j.mesh)]));
 }
 setObjects(objects){releasePrivate(this.objectGroup);this.objects=objects.map(o=>{const mesh=makeObject(o.type);mesh.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});this.objectGroup.add(mesh);return {o,mesh};});}
 pose(mesh,distance,x,time,jump=0,steer=0,speed=0){
  const f=craftFrame(this.track,distance,x,time),surface=f.surface;
  mesh.position.copy(f.p);mesh.position.y+=jump;
  mesh.rotation.set(Math.asin(f.t.y)*.8,Math.atan2(-f.t.x,-f.t.z)+steer*.11,-steer*.12,'YXZ');
  animateCraft(mesh,{steer,jump,time,speed});return {f,surface};
 }
 update(s,t,dt,{menu=false,quality='high'}={}){
  this.seabed.caustics.value=t;const distance=menu?0:s.distance,steer=s.vx/14;
  const {f,surface}=this.pose(this.craft,distance,menu?0:s.x,t,menu?0:s.jump,menu?0:steer+(s.wasDrift?Math.sign(s.vx)*1.4:0),s.speed);
  this.bubbleShield.visible=!menu&&s.shield>0;this.craft.visible=menu||s.invulnerable<=0||Math.floor(t*14)%2===0;
  this.rivals.forEach((m,i)=>{const r=s.rivals[i];m.visible=true;this.pose(m,menu?12+i*8:r.distance,menu?(i-1)*5:r.x??r.lane*5,t,menu?0:r.jump||0,menu?0:r.steer||0,r.speed);});
  const lap=Math.floor(s.distance/s.length);
  for(const {o,mesh}of this.objects){const delta=mod(o.d-mod(s.distance,s.length)+s.length/2,s.length)-s.length/2,objLap=lap+(o.d<mod(s.distance,s.length)&&delta>0?1:o.d>mod(s.distance,s.length)&&delta<0?-1:0);
   mesh.visible=!s.consumed.has(`${objLap}:${o.id}`)&&Math.abs(delta)<180;if(!mesh.visible)continue;
   const frame=this.track.sample(o.d,objectXAt(o,s.time));mesh.position.copy(frame.p);mesh.position.y+=objectHeightAt(o,s.time);
   mesh.rotation.y=Math.atan2(frame.t.x,frame.t.z)+(['shark','fish'].includes(o.type)?Math.PI/2:0);if(mesh.userData.spin)mesh.rotation.z=Math.sin(t*1.4)*.2;
   mesh.traverse(m=>{if(m.userData.tail)m.userData.tail.rotation.y=Math.sin(t*5+o.id)*.35;});
  }
  this.fish.forEach(({mesh,origin,phase,shark})=>{mesh.visible=mesh.position.distanceTo(this.camera.position)<115;mesh.position.x=origin.x+Math.sin(t*.18+phase)*9;mesh.position.y=origin.y+Math.sin(t*.6+phase);mesh.rotation.y=Math.cos(t*.18+phase)>0?-Math.PI/2:Math.PI/2;mesh.userData.tail.rotation.y=Math.sin(t*(shark?3:7)+phase)*.3;});
  this.jellies.forEach(({mesh,y,phase})=>{mesh.visible=mesh.position.distanceTo(this.camera.position)<120;mesh.position.y=y+Math.sin(t*.9+phase);mesh.scale.setScalar(1+Math.sin(t*2+phase)*.07);});
  if(quality==='high')this.kelp.forEach(({mesh,phase})=>mesh.rotation.z=Math.sin(t*1.2+phase)*.22);
  const forward=f.t.clone();forward.y=0;forward.normalize();
  if(menu){const desired=this.craft.position.clone().add(new T.Vector3(10,6.5,12));this.camera.position.lerp(desired,this.snap?1:.04);this.camera.lookAt(this.craft.position.clone().add(new T.Vector3(-6,2,-8)));}
  else{const mobile=innerWidth<700,back=mobile?17:13;const desired=this.craft.position.clone().addScaledVector(forward,-back);desired.y=f.p.y+T.MathUtils.lerp(mobile?7.6:6.0,mobile?5.6:4.3,smooth(.5,4,-f.p.y))+s.jump*.3;this.camera.position.lerp(desired,this.snap?1:1-Math.exp(-dt*7));const target=this.craft.position.clone().addScaledVector(forward,12);target.y=f.p.y+2.5;this.camera.lookAt(target);}
  const rush=!menu&&!this.reduced?Math.max(0,Math.min(1,(s.speed/s.course.speed-1)/.75)):0;
  const targetFov=(innerWidth<700?67:62)+rush*9;this.camera.fov=this.snap?targetFov:T.MathUtils.lerp(this.camera.fov,targetFov,1-Math.exp(-dt*5));this.camera.updateProjectionMatrix();this.snap=false;
  const under=this.camera.position.y<-.2,immersion=smooth(.15,2,-this.camera.position.y),depth=Math.max(0,-this.craft.position.y);
  this.water.visible=!under;this.underside.visible=under;this.underside.material.uniforms.time.value=t;this.sky.visible=!under;
  this.scene.background.set(under?(this.course.id==='abyss'?0x062739:0x0a4251):0x85c6d9);this.scene.fog.color.copy(this.scene.background);this.scene.fog.density=under?.009:.0016;
  this.renderer.toneMappingExposure=under?1.15:.8;this.ambient.intensity=under?.65:1.25;this.scene.environmentIntensity=under?.20:.40;
  this.sun.color.set(under?0x88cddd:0xffe4bb);this.sun.intensity=under?2.6:3.2;this.sun.position.copy(this.craft.position).add(new T.Vector3(-38,85,-30));this.sun.target.position.copy(this.craft.position);
  this.headlight.intensity=under?105:0;this.headlight.position.copy(this.craft.position).add(new T.Vector3(0,1.2,0));this.headlight.target.position.copy(this.craft.position).addScaledVector(f.t,28).add(new T.Vector3(0,-9,0));
  this.water.material.uniforms.time.value=t;this.water.material.uniforms.waveStrength.value=.7;
  this.particles.visible=under;this.particles.position.copy(this.camera.position);if(!this.reduced)this.particles.rotation.y=t*.006;
  if(surface&&!menu){const p=this.craft.position;this.foam.update({x:p.x,z:p.z,heading:Math.atan2(f.t.x,-f.t.z),speed:s.speed,heave:p.y-s.jump,pitch:0,roll:0,rudder:steer,jumpHeight:s.jump,throttle:1},{kind:'jetski',length:5.6,beam:2.3,draft:.4},t,.7);}else this.foam.reset();
  if(!menu&&s.speed>2){this.history.unshift(this.craft.position.clone().addScaledVector(forward,-2.7));if(this.history.length>60)this.history.pop();}
  this.trail.visible=!menu&&(under||s.boost>0);let bubbleCount=0;
  this.history.forEach((p,i)=>{for(const side of [-1,1]){this.dummy.position.copy(p).addScaledVector(f.right,side*(.4+i*.025));this.dummy.position.y+=i*.018+Math.sin(i*2+t)*.08;this.dummy.scale.setScalar((1-i/60)*(.07+(i%4)*.02)*(s.boost>0?1.7:1));this.dummy.updateMatrix();this.trail.setMatrixAt(bubbleCount++,this.dummy.matrix);}});this.trail.count=bubbleCount;this.trail.instanceMatrix.needsUpdate=true;
  let visibleRivals=0;this.rivalNames.forEach((el,i)=>{const m=this.rivals[i],p=m.position.clone().add(new T.Vector3(0,4.4,0)).project(this.camera),range=m.position.distanceTo(this.craft.position);const visible=!menu&&range<95&&p.z<1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.9;el.hidden=!visible;if(visible){visibleRivals++;el.style.transform=`translate(-50%,-100%) translate(${(p.x*.5+.5)*innerWidth}px,${(-p.y*.5+.5)*innerHeight}px)`;}});
  this.renderer.render(this.scene,this.camera);
  return {under,immersion,depth,drawCalls:this.renderer.info.render.calls,visibleRivals};
 }
 setQuality(q){this.renderer.setPixelRatio(q==='low'?1:Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=q!=='low';this.renderer.setSize(innerWidth,innerHeight);}
}
