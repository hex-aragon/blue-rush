import * as T from 'three';
import {material,ellipsoid,link} from './models.js';
import {random} from './game.js';

// Continuous height field with a submerged navigable valley, not disconnected flat pads.
export function seabedField(track){
 const samples=track.curve.getSpacedPoints(260);
 return (x,z)=>{
  let best=Infinity,nearest=0;
  for(let i=0;i<samples.length;i++){const p=samples[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;nearest=i;}}
  const distance=Math.sqrt(best),p=samples[nearest];
  const rough=Math.sin(x*.041+Math.sin(z*.039)*2)*2.2+Math.cos(z*.057-x*.013)*1.8+Math.sin(x*.14+z*.17)*.7;
  const shoulder=T.MathUtils.smoothstep(distance,13,50)*Math.min(23,8+Math.abs(Math.sin(x*.021+z*.031))*18);
  return Math.min(-5,p.y-15+rough+shoulder);
 };
}
function rockGeometry(seed=1){
 const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.17*Math.sin(x*7+seed)*Math.cos(z*8+y*6)+.10*Math.sin(y*13-z*6);p.setXYZ(i,x*n,y*n,z*n);}
 geo.computeVertexNormals();return geo;
}
export function buildSeabed(track,course){
 const group=new T.Group(),height=seabedField(track),rng=random(course.seed+713);
 const geo=new T.PlaneGeometry(940,960,150,150);geo.rotateX(-Math.PI/2);geo.translate(-100,0,-15);
 const p=geo.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),y=height(x,z);p.setY(i,y);
  const col=new T.Color(0x487b76);col.lerp(new T.Color(0x153e46),T.MathUtils.clamp((-y-5)/150,0,.65));
  col.multiplyScalar(.78+.12*Math.sin(x*.2+z*.09)+.08*Math.cos(x*.035-z*.12));colors.push(col.r,col.g,col.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 const groundMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:.02});
 const caustics={value:0};
 groundMat.onBeforeCompile=shader=>{shader.uniforms.flowTime=caustics;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 seaPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nseaPoint=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 seaPoint;uniform float flowTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat c=pow(max(0.,1.-abs(sin(seaPoint.x*.29+sin(seaPoint.z*.26+flowTime*.4))+sin(seaPoint.z*.33-flowTime*.55))*.7),16.);totalEmissiveRadiance+=vec3(.018,.065,.057)*c;');};
 const ground=new T.Mesh(geo,groundMat);ground.name='continuous-seabed';ground.receiveShadow=true;group.add(ground);
 const stones=rockGeometry(course.seed),stoneMat=new T.MeshStandardMaterial({color:0x365961,roughness:.92,metalness:.02});
 const stoneSpecs=[];
 for(let d=0;d<track.length;d+=11){
  const side=rng()>.5?1:-1,frame=track.sample(d,side*(27+rng()*40));
  const y=height(frame.p.x,frame.p.z),tall=4+rng()*14;
  stoneSpecs.push({x:frame.p.x,y:y+tall*.25,z:frame.p.z,sx:3+rng()*4,sy:tall,sz:3+rng()*4,ry:rng()*6});
 }
 const instanced=new T.InstancedMesh(stones,stoneMat,stoneSpecs.length),dummy=new T.Object3D();
 stoneSpecs.forEach((s,i)=>{dummy.position.set(s.x,s.y,s.z);dummy.rotation.set(.1,s.ry,.13);dummy.scale.set(s.sx,s.sy,s.sz);dummy.updateMatrix();instanced.setMatrixAt(i,dummy.matrix);});instanced.castShadow=instanced.receiveShadow=true;group.add(instanced);
 // Raised shoulders and overhead rock arches reveal depth through occlusion and parallax.
 for(let d=220;d<track.length;d+=340){const f=track.sample(d);if(f.p.y>-8)continue;
  const arch=new T.Group();arch.position.copy(f.p);arch.rotation.y=Math.atan2(f.t.x,f.t.z);group.add(arch);
  for(let k=0;k<9;k++){const a=k/8*Math.PI,m=new T.Mesh(stones,stoneMat);m.position.set(Math.cos(a)*17,Math.sin(a)*13+1,0);m.scale.set(4.6,4.2,3.5);m.rotation.z=a;m.castShadow=m.receiveShadow=true;arch.add(m);}
 }
 const coral=new T.Group();group.add(coral);
 for(let d=15;d<track.length;d+=22){const side=rng()>.5?1:-1,f=track.sample(d,side*(14+rng()*12));if(f.p.y>-4)continue;
  const base=new T.Group();base.position.set(f.p.x,height(f.p.x,f.p.z)+.5,f.p.z);coral.add(base);const color=[0xc86b69,0xdfae78,0x879bc6,0x5eb99e][Math.floor(rng()*4)];
  for(let b=0;b<4;b++){const x=(b-1.5)*.65,h=1.5+rng()*3;link(base,[x,0,0],[x+.2,h,.2],.13,color);for(const dir of [-1,1]){link(base,[x,h*.45,0],[x+dir*.7,h*.83,.4],.09,color);link(base,[x+dir*.7,h*.83,.4],[x+dir*.9,h*1.08,.3],.055,color);}ellipsoid(base,[x+.2,h,.2],[.13,.16,.13],color,.15);}
 }
 return {group,coral,height,caustics};
}
export function makeSurfaceUnderside(){
 const geo=new T.PlaneGeometry(2200,2200,100,100);geo.rotateX(-Math.PI/2);
 const mat=new T.ShaderMaterial({side:T.DoubleSide,transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying vec3 wp;void main(){vec3 p=position;p.y+=sin(p.x*.022+p.z*.014-time*1.2)*.72+sin(p.x*.051-p.z*.027-time*1.7)*.3;wp=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float time;varying vec3 wp;void main(){float n=sin(wp.x*.065+sin(wp.z*.04+time*.2))*sin(wp.z*.075-time*.3);vec3 c=mix(vec3(.04,.21,.29),vec3(.29,.62,.66),n*.5+.5);gl_FragColor=vec4(c,.68);}`});
 return new T.Mesh(geo,mat);
}
