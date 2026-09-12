import * as T from 'three';
const sphere=new T.SphereGeometry(1,20,14),box=new T.BoxGeometry(1,1,1);
const materials=new Map();
export function material(color,glow=0){const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.38,metalness:.22,emissive:color,emissiveIntensity:glow}));return materials.get(key);}
export function ellipsoid(g,p,scale,color,glow=0){const m=new T.Mesh(sphere,material(color,glow));m.position.set(...p);m.scale.set(...scale);g.add(m);return m;}
export function cube(g,p,scale,color,glow=0){const m=new T.Mesh(box,material(color,glow));m.position.set(...p);m.scale.set(...scale);g.add(m);return m;}
function fin(g,points,color){const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSize:.07,bevelThickness:.05,bevelSegments:1,steps:1});const m=new T.Mesh(geo,material(color));g.add(m);return m;}
export function makeCraft(color=0xffb77e){
 const g=new T.Group();g.name='submersible';
 ellipsoid(g,[0,.55,0],[1,.65,2.5],color);ellipsoid(g,[0,.33,-.5],[.83,.4,2.35],0xe2f3ec);
 const glass=ellipsoid(g,[0,1,-.55],[.65,.56,1.18],0x183a53);glass.material=new T.MeshPhysicalMaterial({color:0x15344a,metalness:.75,roughness:.13,clearcoat:1});
 cube(g,[0,1.06,.9],[.5,.18,.85],0x193c4e);cube(g,[0,.72,2.05],[2.2,.12,.7],color);
 for(const side of [-1,1]){
  ellipsoid(g,[side*1.05,.32,.4],[.3,.32,1.65],0xd5eeea);
  const engine=new T.Mesh(new T.CylinderGeometry(.22,.32,1,16),material(0x16384a));engine.rotation.x=Math.PI/2;engine.position.set(side*1.05,.35,1.55);g.add(engine);
  ellipsoid(g,[side*1.05,.35,2.1],[.18,.18,.16],0x80ffee,3);
  const wing=cube(g,[side*1.32,.55,.05],[1.35,.12,.7],color);wing.rotation.z=side*.14;wing.rotation.y=side*.25;
  ellipsoid(g,[side*.55,.58,-2],[.2,.12,.1],0xecfff4,2);
  cube(g,[side*1.4,.62,.05],[.6,.04,.13],0x69ffe8,2);
 }
 const tail=fin(g,[[-.35,0],[.45,1.15],[1,0]],color);tail.rotation.y=Math.PI/2;tail.position.set(0,.9,1.4);
 return g;
}
export function makeFish(shark=false,color=0xffc16e){
 const g=new T.Group(),skin=shark?0x668a9a:color;
 ellipsoid(g,[0,0,0],shark?[.78,.72,2.5]:[.38,.7,1.2],skin);
 ellipsoid(g,[0,-.24,-.2],shark?[.67,.41,2.1]:[.3,.38,1],shark?0xc4d7d1:0xffe5b7);
 const tail=new T.Group();tail.position.z=shark?2.1:1;g.add(tail);g.userData.tail=tail;
 const tf=fin(tail,[[-.4,0],[.65,1.1],[.35,0],[.65,-.8]],skin);tf.rotation.y=Math.PI/2;
 const dorsal=fin(g,[[-.7,0],[0,1.25],[.8,0]],skin);dorsal.rotation.y=Math.PI/2;dorsal.position.set(0,shark?.45:.4,.2);
 for(const side of [-1,1]){const f=fin(g,[[0,0],[side*1.5,-.25],[side*.3,-.5]],skin);f.rotation.x=Math.PI/2;f.position.set(0,-.2,0);ellipsoid(g,[side*(shark?.52:.29),.15,shark?-1.7:-.73],[.075,.075,.075],0x031d28);}
 if(shark)for(const side of [-1,1])for(let i=0;i<3;i++){const slit=cube(g,[side*.72,-.05,-.75+i*.2],[.025,.35,.035],0x365965);slit.rotation.x=-.18;}
 return g;
}
export function makeObject(type){
 const g=new T.Group();
 if(type==='shark'||type==='fish'){g.add(makeFish(type==='shark'));g.rotation.y=Math.PI/2;}
 else if(type==='rock'){
  const m=new T.Mesh(new T.DodecahedronGeometry(1.9,0),material(0x638785));m.scale.set(1,.78,.75);m.position.y=-.05;g.add(m);
  for(let i=0;i<3;i++)ellipsoid(g,[(i-1)*.8,1,.2],[.13,.27,.13],0xff997e,.6);
 }else if(type==='toxic'){
  ellipsoid(g,[0,.45,0],[1,1,1],0xba72c2,.4);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const spike=new T.Mesh(new T.ConeGeometry(.22,.8,6),material(0xd893d6,.2));spike.position.set(Math.cos(a)*1.15,.45+Math.sin(a)*1.15,0);spike.rotation.z=a-Math.PI/2;g.add(spike);}
  const eye=material(0x301d52);for(const x of [-.35,.35]){const m=new T.Mesh(sphere,eye);m.scale.set(.16,.22,.1);m.position.set(x,.55,1);g.add(m);}
 }else{
  const color=type==='boost'?0x9affe1:0xa3c7ff;
  const ring=new T.Mesh(new T.TorusGeometry(1.3,.13,8,32),material(color,2));g.add(ring);g.userData.spin=true;
  if(type==='boost'){const shape=fin(g,[[.1,1],[-.7,-.1],[0,-.1],[-.1,-1],[.7,.2],[.1,.2]],color);shape.material=material(color,2);}
  else {ellipsoid(g,[0,0,0],[.65,.8,.3],color,.5);}
 }
 return g;
}
