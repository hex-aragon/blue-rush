import {clamp,random} from './game.js';
export function audioMix(immersion,speed=0,active=true){
 const wet=clamp(typeof immersion==='boolean'?(immersion?1:0):immersion,0,1),pace=clamp(speed/55,0,1);
 return {surface:active?(1-wet)*(.34+pace*.14):0,underwater:active?wet*.48:0,bubbles:active?wet*(.18+pace*.24):0,motor:active?(.045+pace*.045):0,motorHz:(wet>0.5?38:58)+speed*(wet>0.5?1.3:2.2)};
}
export function synthesizeAmbience(rate=22050,seconds=12){
 const count=Math.floor(rate*seconds),surface=new Float32Array(count),underwater=new Float32Array(count),bubbles=new Float32Array(count),rng=random(92871);
 let brown=0,pink=0,low=0;
 for(let i=0;i<count;i++){
  const t=i/rate,white=rng()*2-1;pink=.975*pink+.025*white;brown=(brown+white*.012)/1.012;low=.995*low+.005*white;
  const breaker=Math.pow(.5+.5*Math.sin(t*1.06+.7*Math.sin(t*.41)),2.5);
  const fade=Math.min(1,t/.09,(seconds-t)/.09);
  surface[i]=Math.tanh((pink*(1.8+breaker*3.5)+white*breaker*.07)*1.1)*.82*fade;
  underwater[i]=(brown*1.6+low*1.2+Math.sin(t*2*Math.PI*43)*.026+Math.sin(t*2*Math.PI*67)*.012)*fade;
 }
 for(let start=.15;start<seconds-.3;start+=.08+rng()*.35){
  const freq=380+rng()*1350,duration=.035+rng()*.11,amp=.12+rng()*.20,offset=Math.floor(start*rate);
  for(let j=0;j<duration*rate&&offset+j<count;j++){const t=j/rate,decay=Math.exp(-t/(duration*.18));bubbles[offset+j]+=Math.sin(2*Math.PI*freq*(t+1.3*t*t))*decay*amp*Math.min(1,t/.002);}
 }
 return {surface,underwater,bubbles};
}
