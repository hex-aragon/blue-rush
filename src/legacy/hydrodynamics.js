import {clamp,waveHeight} from './physics.js';
// Derivatives of the exact spectrum used by the water shader, in game metres/seconds.
export function waveSample(x,z,t,strength=1){
 const a=x*.022+z*.014-t*1.2,b=x*.051-z*.027-t*1.7,c=z*.085+x*.03-t*2.1,d=x*.007+z*.010-t*.52;
 return {height:waveHeight(x,z,t,strength),dx:strength*(.72*.022*Math.cos(a)+.3*.051*Math.cos(b)+.12*.03*Math.cos(c)+.35*.007*Math.cos(d)),dz:strength*(.72*.014*Math.cos(a)-.3*.027*Math.cos(b)+.12*.085*Math.cos(c)+.35*.010*Math.cos(d)),vertical:strength*(-.72*1.2*Math.cos(a)-.3*1.7*Math.cos(b)-.12*2.1*Math.cos(c)-.35*.52*Math.cos(d))};
}
export function hullContacts(s,spec,t,strength){
 const contacts=[],cs=Math.cos(s.heading),sn=Math.sin(s.heading),speed=s.speed||0,heave=s.heave??waveHeight(s.x,s.z,t,strength),vertical=s.heaveVelocity??waveSample(s.x,s.z,t,strength).vertical;
 for(const u of [.055,.14,.30,.55,.82,.94])for(const side of [-1,1]){
  const f=u<.27?Math.pow(Math.sin(u/.27*Math.PI/2),.78):u>.86?1-(u-.86)*1.5:1;
  const lx=side*spec.beam*.47*f,lz=(u-.5)*spec.length,x=s.x+cs*lx-sn*lz,z=s.z+sn*lx+cs*lz,wave=waveSample(x,z,t,strength);
  const hullY=heave+(s.waterlineOffset||0)-Math.sin(s.pitch||0)*lz-Math.sin(s.roll||0)*lx;
  const hullVy=vertical-(s.pitchVelocity||0)*lz-(s.rollVelocity||0)*lx;
  const closing=wave.vertical+wave.dx*sn*speed-wave.dz*cs*speed-hullVy;
  const wetness=clamp((wave.height-hullY+.65)/1.1,0,1),bow=clamp((.38-u)/.325,0,1),entry=clamp(Math.max(0,closing)*.38*wetness,0,2);
  const flow=clamp(Math.abs(speed)/15,0,1.5)*(speed>=0?bow:clamp((u-.65)/.3,0,1));
  contacts.push({x,z,y:wave.height,side,u,closing,clearance:hullY-wave.height,entry,flow,energy:entry+flow*.7,nx:cs*side,nz:sn*side});
 }
 return contacts;
}
export function advanceDroplet(p,dt,t,strength){
 p.age+=dt;p.vy-=9.81*dt;p.vx*=Math.exp(-dt*.22);p.vz*=Math.exp(-dt*.22);p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
 return p.age>.08&&p.y<=waveHeight(p.x,p.z,t,strength)+.08;
}
// Fine 2 m cells around the vessel; gradually coarser cells toward the horizon.
export function oceanGridAxis(i){const n=Math.abs(i),a=n<=64?n*2:128+(n-64)*2+10744*((n-64)/64)**3;return Math.sign(i)*a;}
