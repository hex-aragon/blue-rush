// Geometry uses the unloaded waterline as y=0, with displacement added by cargo.
export function underwaterProfile(ship){const depth=ship.draft*.7;return {depth,propY:-depth*.72,propRadius:Math.min(ship.beam*.13,depth*.21),propZ:ship.length*.46};}
export function localToSea(s,x,y,z){const cr=Math.cos(s.roll||0),sr=Math.sin(s.roll||0),cp=Math.cos(s.pitch||0),sp=Math.sin(s.pitch||0),ch=Math.cos(s.heading||0),sh=Math.sin(s.heading||0),rx=cr*x+sr*y,ry=-sr*x+cr*y,rz=sp*ry+cp*z;return {x:s.x+ch*rx-sh*rz,y:cp*ry-sp*z,z:s.z+sh*rx+ch*rz};}
export function immersedHeave(s,ship,surface){
 if(ship.kind==='jetski'||s.capsized)return s.heave||0;
 const p=underwaterProfile(ship);let ceiling=Infinity;
 // Disc perimeter, not just the centre: keep the entire propeller submerged.
 for(let i=0;i<12;i++){const a=i*Math.PI/6,v=localToSea(s,Math.sin(a)*p.propRadius,p.propY+Math.cos(a)*p.propRadius,p.propZ);ceiling=Math.min(ceiling,surface(v.x,v.z)-v.y-.12);}
 const keel=localToSea(s,0,-p.depth,0);ceiling=Math.min(ceiling,surface(keel.x,keel.z)-keel.y-Math.min(.15,p.depth*.3));
 return Math.min(s.heave||0,ceiling);
}
