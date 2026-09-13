import {audioMix,synthesizeAmbience} from './audio-synthesis.js';
export class OceanAudio{
 constructor(){this.enabled=false;this.mix=audioMix(0,0,false);}
 async enable(){
  if(!this.ctx){
   const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;this.ctx=new A();
   this.master=this.ctx.createGain();this.master.gain.value=0;
   const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=5;this.master.connect(limiter);limiter.connect(this.ctx.destination);
   const data=synthesizeAmbience(this.ctx.sampleRate);this.layers={};
   for(const name of ['surface','underwater','bubbles']){
    const buffer=this.ctx.createBuffer(1,data[name].length,this.ctx.sampleRate);buffer.getChannelData(0).set(data[name]);
    const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
    const gain=this.ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(this.master);source.start();this.layers[name]=gain;
   }
   this.motor=this.ctx.createOscillator();this.motor.type='triangle';this.motor.frequency.value=58;
   this.motorFilter=this.ctx.createBiquadFilter();this.motorFilter.type='lowpass';this.motorFilter.frequency.value=400;
   this.motorGain=this.ctx.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorFilter);this.motorFilter.connect(this.motorGain);this.motorGain.connect(this.master);this.motor.start();
  }
  await this.ctx.resume();this.enabled=true;return true;
 }
 disable(){this.enabled=false;if(this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.06);}
 update(speed,immersion,active){
  this.mix=audioMix(immersion,speed,active&&this.enabled);if(!this.ctx)return;
  const now=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.enabled&&active?.6:0,now,.08);
  for(const name of ['surface','underwater','bubbles'])this.layers[name].gain.setTargetAtTime(this.mix[name],now,.18);
  this.motorGain.gain.setTargetAtTime(this.mix.motor,now,.12);this.motor.frequency.setTargetAtTime(this.mix.motorHz,now,.1);
  this.motorFilter.frequency.setTargetAtTime(immersion>.5?220:850,now,.2);
 }
 cue(type){
  if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),gain=this.ctx.createGain();
  const wet=this.mix.underwater>0;o.type='sine';o.frequency.setValueAtTime(type==='hit'?95:type==='jump'?260:540,t);o.frequency.exponentialRampToValueAtTime(type==='hit'?40:wet?680:950,t+.18);
  gain.gain.setValueAtTime(.06,t);gain.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(gain);gain.connect(this.master);o.start();o.stop(t+.3);o.onended=()=>{o.disconnect();gain.disconnect();};
 }
}
