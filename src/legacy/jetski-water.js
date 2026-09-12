import {waveHeight,clamp} from './physics.js';
import {localToSea} from './immersion.js';
export function jetRenderPitch(s){return (s.pitch||0)+(s.jumpVelocity||0)*.025*Math.min(1,(s.jumpHeight||0)/.6);}
// A planing craft follows the local surface instead of a displacement ship's slow heave spring.
export function stepJetSkiWater(s,spec,t,strength,dt){
 const sn=Math.sin(s.heading),cs=Math.cos(s.heading),L=spec.length*.32,B=spec.beam*.42;
 const front=waveHeight(s.x+sn*L,s.z-cs*L,t,strength),back=waveHeight(s.x-sn*L,s.z+cs*L,t,strength),left=waveHeight(s.x-cs*B,s.z-sn*B,t,strength),right=waveHeight(s.x+cs*B,s.z+sn*B,t,strength),middle=waveHeight(s.x,s.z,t,strength);
 const pace=clamp(Math.abs(s.speed||0)/18,0,1),pitch=clamp(Math.atan2(front-back,L*2)+pace*.035,-.28,.28),roll=clamp(-Math.atan2(right-left,B*2)+(s.rudder||0)*pace*.15,-.30,.30),blend=1-Math.exp(-Math.max(0,dt)*14);
 const oldPitch=s.pitch||0,oldRoll=s.roll||0,oldHeave=s.heave||0;s.pitch=oldPitch+(pitch-oldPitch)*blend;s.roll=oldRoll+(roll-oldRoll)*blend;
 let h=middle*.4+(front+back+left+right)*.15+.015+pace*.10;
 // Keep the rim above water while leaving the lower hull and jet intake immersed.
 for(const x of [-B,0,B])for(const z of [-L,0,L]){const p=localToSea({...s,pitch:jetRenderPitch(s)},x,.23,z);h=Math.max(h,waveHeight(p.x,p.z,t,strength)-p.y-(s.jumpHeight||0)+.055);}
 s.heave=h;s.waterlineOffset=0;s.capsized=false;
 if(dt>0){s.heaveVelocity=(h-oldHeave)/dt;s.pitchVelocity=(s.pitch-oldPitch)/dt;s.rollVelocity=(s.roll-oldRoll)/dt;}
 return s;
}
export function jetSpraySources(s,spec,t,strength){
 if((s.jumpHeight||0)>.15||Math.abs(s.speed||0)<2)return [];
 const cs=Math.cos(s.heading),sn=Math.sin(s.heading),pace=clamp(Math.abs(s.speed)/18,0,1.6),forward=s.speed>=0?1:-1,sources=[];
 for(const side of [-1,1])for(const along of [-.20,.04]){const x=s.x+cs*side*spec.beam*.48-sn*spec.length*along,z=s.z+sn*side*spec.beam*.48+cs*spec.length*along,turn=clamp(1-side*(s.rudder||0)*.3,.7,1.3);sources.push({x,z,y:waveHeight(x,z,t,strength)+.07,nx:cs*side,nz:sn*side,vx:cs*side*(2+pace*3.3)*turn-sn*forward*(2+pace*2),vz:sn*side*(2+pace*3.3)*turn+cs*forward*(2+pace*2),vy:1.1+pace*.7,energy:(.4+pace*.4)*turn,pace});}
 return sources;
}
