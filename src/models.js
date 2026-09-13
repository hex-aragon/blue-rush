import * as T from 'three';
const sphere=new T.SphereGeometry(1,20,14),box=new T.BoxGeometry(1,1,1);
sphere.userData.shared=true;box.userData.shared=true;
const materials=new Map();
export function material(color,glow=0){const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.38,metalness:.22,emissive:color,emissiveIntensity:glow}));return materials.get(key);}
export function ellipsoid(g,p,scale,color,glow=0){const m=new T.Mesh(sphere,material(color,glow));m.position.set(...p);m.scale.set(...scale);g.add(m);return m;}
export function cube(g,p,scale,color,glow=0){const m=new T.Mesh(box,material(color,glow));m.position.set(...p);m.scale.set(...scale);g.add(m);return m;}
function fin(g,points,color){const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSize:.07,bevelThickness:.05,bevelSegments:1,steps:1});const m=new T.Mesh(geo,material(color));g.add(m);return m;}
// Articulated rider proportions and riding posture reference Korean Blue Voyage's sport-rider.
export function link(g,a,b,r,color){
 const start=new T.Vector3(...a),end=new T.Vector3(...b);
 const mesh=new T.Mesh(new T.CapsuleGeometry(r,Math.max(.001,start.distanceTo(end)-r*2),3,8),material(color));
 mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());g.add(mesh);return mesh;
}
export function makeCraft(color=0xffa348,number=1,kind='human'){
 const g=new T.Group();g.name='aqua-bike';
 // Open water-bike hull: narrow saddle, visible handlebars and twin ducted jets.
 ellipsoid(g,[0,.15,0],[.92,.35,2.25],0x142c3a);
 ellipsoid(g,[0,.40,-.28],[.87,.29,1.95],color);
 ellipsoid(g,[0,.59,-1.0],[.68,.24,1.06],color);
 ellipsoid(g,[0,.66,.42],[.39,.19,1.08],0x162c36);
 for(const side of [-1,1]){
  const rail=link(g,[side*.79,.42,-1.1],[side*.89,.34,1.65],.07,0x193943);
  ellipsoid(g,[side*1.02,.19,.92],[.33,.34,1.02],0xd4e3dc);
  const duct=new T.Mesh(new T.TorusGeometry(.27,.08,8,18),material(0x224651));duct.position.set(side*1.02,.19,1.86);g.add(duct);
  const turbine=new T.Group();turbine.position.copy(duct.position);g.add(turbine);
  for(let i=0;i<4;i++){const blade=cube(turbine,[0,0,.01],[.40,.045,.05],0x718f95);blade.rotation.z=i*Math.PI/4;}
  turbine.name='turbine';
  for(let j=0;j<6;j++)link(g,[side*.46,.46,.2+j*.18],[side*.79,.42,.2+j*.18],.026,0x152c34);
  ellipsoid(g,[side*.51,.62,-1.86],[.21,.08,.10],0xd8fff4,1.7);
  const fin=cube(g,[side*1.0,.35,-.4],[.65,.10,.76],color);fin.rotation.y=side*.25;
 }
 link(g,[0,.7,-.85],[0,1.2,-.59],.07,0x365768);
 link(g,[-.62,1.22,-.59],[.62,1.22,-.59],.058,0x111f2b);
 const dash=cube(g,[0,1.12,-.75],[.3,.09,.24],0x0d2335);dash.rotation.x=-.3;
 cube(g,[0,1.17,-.76],[.2,.02,.14],0x76d8d3,.5);
 const {rider,head}=makeRider(kind,color,number);g.add(rider);g.userData.character=kind;
 g.scale.setScalar(1.25);g.userData.rider=rider;g.userData.head=head;g.userData.color=color;
 g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
 return g;
}

function makeRider(kind,color,number){
 if(kind==='penguin'||kind==='seal')return makeAnimalRider(kind,color);
 const rider=new T.Group();rider.name='sport-rider';
 const suit=0x143d50,vest=color,skin=0xbd8e6e,black=0x122634;
 ellipsoid(rider,[0,1.39,.32],[.34,.45,.27],suit);
 ellipsoid(rider,[0,1.45,.34],[.37,.38,.29],vest);
 ellipsoid(rider,[0,1.02,.54],[.31,.2,.33],suit);
 for(const y of [1.22,1.62])link(rider,[-.31,y,.58],[.31,y,.58],.035,black);
 for(const x of [-.2,.2])link(rider,[x,1.72,.48],[x,1.10,.61],.035,black);
 ellipsoid(rider,[0,1.91,.10],[.13,.16,.14],skin);
 const head=new T.Group();head.position.set(0,2.18,.02);rider.add(head);head.name='helmet';
 if(kind==='fish')makeFishHead(head,color);else{
 ellipsoid(head,[0,0,0],[.31,.34,.32],0xe6eee8);
 ellipsoid(head,[0,.035,-.24],[.27,.16,.13],0x0c2c40);
 link(head,[-.22,.17,-.29],[.22,.17,-.29],.028,color);
 ellipsoid(head,[0,-.21,-.18],[.22,.10,.22],0xe2eae3);
 // Breathing regulator and rear air tank make the underwater rider readable from behind.
 ellipsoid(head,[0,-.14,-.35],[.10,.09,.07],0x1b3d49);
 }
 ellipsoid(rider,[0,1.42,.76],[.18,.40,.17],0xc2d8d8);
 for(const y of [1.21,1.58])link(rider,[-.17,y,.82],[.17,y,.82],.035,black);
 const hose=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,1.8,.76),new T.Vector3(.43,1.84,.55),new T.Vector3(.38,1.96,-.15),new T.Vector3(0,2.03,-.31)]),18,.035,6),material(black));rider.add(hose);
 for(const side of [-1,1]){
  link(rider,[side*.3,1.69,.17],[side*.49,1.43,-.15],.115,suit);
  link(rider,[side*.49,1.43,-.15],[side*.57,1.22,-.59],.09,suit);
  ellipsoid(rider,[side*.57,1.22,-.59],[.12,.095,.14],black);
  link(rider,[side*.20,1.03,.50],[side*.53,.8,.08],.15,suit);
  ellipsoid(rider,[side*.53,.80,.08],[.16,.17,.15],black);
  link(rider,[side*.53,.8,.08],[side*.64,.44,.70],.11,suit);
  ellipsoid(rider,[side*.65,.44,.78],[.15,.11,.30],black);
 }
 // A number marker on the vest is mesh geometry, readable from the chase camera.
 for(let i=0;i<number;i++)cube(rider,[(i-(number-1)/2)*.09,1.6,.94],[.035,.13,.02],0x193546);
 return {rider,head};
}
export function animateCraft(g,{steer=0,jump=0,time=0,speed=0}={}){
 const rider=g.userData.rider;if(!rider)return;
 rider.rotation.z=-steer*.19;rider.rotation.x=-Math.min(.13,speed*.002)-Math.min(.10,jump*.03);
 rider.position.y=Math.sin(time*7)*Math.min(.018,speed*.0006)+Math.min(.08,jump*.03);
 g.userData.head.rotation.y=-steer*.13;
 g.traverse(m=>{if(m.name==='turbine')m.rotation.z=time*(5+speed*2);});
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

function makeFishHead(head,color){
 head.name='fish-head';
 // An oversized mackerel head on the original human wetsuit and air tank.
 ellipsoid(head,[0,.1,0],[.57,.48,.72],0x5dc2c2);
 ellipsoid(head,[0,-.12,-.16],[.50,.29,.62],0xd2edca);
 for(const side of [-1,1]){
  ellipsoid(head,[side*.47,.20,-.35],[.24,.25,.25],0xfff9da);
  ellipsoid(head,[side*.55,.19,-.49],[.11,.13,.11],0x113243);
  ellipsoid(head,[side*.59,.25,-.55],[.04,.04,.04],0xffffff);
  for(let i=0;i<3;i++)link(head,[side*.53,-.03,.03+i*.14],[side*.43,-.23,.08+i*.14],.025,0x27848f);
 }
 const lips=new T.Mesh(new T.TorusGeometry(.17,.065,8,18),material(0xffad81));lips.position.set(0,-.11,-.78);head.add(lips);
 const dorsal=fin(head,[[-.35,0],[0,.48],[.4,0]],color);dorsal.rotation.y=Math.PI/2;dorsal.position.set(0,.45,.1);dorsal.name='mackerel-fin';
 const tail=fin(head,[[-.33,0],[.46,.34],[.2,0],[.46,-.30]],0x319daa);tail.rotation.y=Math.PI/2;tail.position.set(0,.12,.67);tail.name='head-tail';
}
function makeAnimalRider(kind,color){
 const rider=new T.Group();rider.name=kind+'-rider';
 const penguin=kind==='penguin',skin=penguin?0x193345:0x91abb3,belly=penguin?0xfff2cf:0xcadad6;
 ellipsoid(rider,[0,1.36,.34],penguin?[.55,.71,.49]:[.63,.65,.53],skin);
 ellipsoid(rider,[0,1.31,-.035],[.43,.52,.20],belly);
 // Riding bib on the back, visible from the chase camera.
 ellipsoid(rider,[0,1.42,.76],[.39,.37,.10],color);
 for(const side of [-1,1]){
  const flipper=ellipsoid(rider,[side*.54,1.35,-.17],[.14,.41,.20],skin);flipper.rotation.x=.6;flipper.rotation.z=side*.4;flipper.name='flipper';
  link(rider,[side*.49,1.5,-.1],[side*.57,1.22,-.59],.10,skin);
  const foot=ellipsoid(rider,[side*.52,.62,.43],penguin?[.24,.10,.40]:[.25,.11,.44],penguin?0xffac4e:skin);foot.rotation.y=side*.22;
 }
 const tail=ellipsoid(rider,[0,.95,.91],[.25,.13,.32],skin);tail.rotation.x=-.25;
 const head=new T.Group();head.name=kind+'-head';head.position.set(0,2.1,.07);rider.add(head);
 ellipsoid(head,[0,0,0],penguin?[.46,.47,.44]:[.57,.43,.46],skin);
 if(penguin){
  for(const side of [-1,1])ellipsoid(head,[side*.21,-.05,-.32],[.21,.32,.14],belly);
  const beak=ellipsoid(head,[0,-.12,-.55],[.25,.13,.31],0xffb343);beak.name='beak';
  link(head,[-.18,-.14,-.72],[.18,-.14,-.72],.014,0x9a5735);
  // A tiny snorkel and tilted cap give the silhouette an absurd holiday mood.
  const cap=ellipsoid(head,[.06,.43,.01],[.31,.12,.30],color);cap.rotation.z=-.24;
  link(head,[.43,-.03,-.1],[.51,.64,-.1],.065,0xf9db70);
  link(head,[.51,.64,-.1],[.68,.64,-.1],.065,0xf9db70);
 }else{
  for(const side of [-1,1])ellipsoid(head,[side*.19,-.17,-.39],[.25,.19,.20],belly);
  ellipsoid(head,[0,-.07,-.59],[.12,.08,.08],0x273c46);
  for(const side of [-1,1])for(let i=0;i<3;i++)link(head,[side*.15,-.16-i*.035,-.57],[side*.64,-.10-i*.10,-.54],.016,0xeff2dc);
  // The chairman insists on a coral bow tie, even while diving.
  for(const side of [-1,1]){const bow=ellipsoid(rider,[side*.14,1.76,-.19],[.18,.12,.07],0xf29599);bow.rotation.z=side*.35;}
  ellipsoid(rider,[0,1.76,-.25],[.07,.07,.05],0xffd9a1);
 }
 for(const side of [-1,1]){
  ellipsoid(head,[side*.24,.09,-.39],[.145,.17,.11],0xfffbe9);
  ellipsoid(head,[side*.25,.07,-.485],[.068,.086,.045],0x123748);
  ellipsoid(head,[side*.27,.12,-.51],[.022,.027,.015],0xffffff);
 }
 return {rider,head};
}
