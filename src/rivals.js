const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(v,n)=>((v%n)+n)%n;
export function stepRivals(s,dt){
 for(let i=0;i<s.rivals.length;i++){
  const r=s.rivals[i];if(r.distance>=s.length*s.laps)continue;
  r.x??=r.lane*5;r.jump??=0;r.vy??=0;r.steer??=0;
  const next=s.objects.filter(o=>{const d=mod(o.d-mod(r.distance,s.length),s.length);return d>2&&d<40&&!['boost','shield'].includes(o.type);});
  const desired=[-5,0,5].reduce((best,x)=>{
   const risk=p=>next.reduce((n,o)=>n+(Math.abs(p-o.x)<3.2?3:0),0)+Math.abs(p-r.x)*.04;
   return risk(x)<risk(best)?x:best;
  },r.lane*5);
  const targetV=clamp((desired-r.x)*2.5,-8,8);r.steer=targetV/14;r.x+=targetV*dt;
  if(r.jump<=0&&next.some(o=>mod(o.d-mod(r.distance,s.length),s.length)<12&&Math.abs(o.x-r.x)<2.8&&o.type!=='shark'))r.vy=10;
  r.vy-=18*dt;r.jump=Math.max(0,r.jump+r.vy*dt);if(r.jump===0)r.vy=0;
  const gap=r.distance-s.distance;
  // Continuous pack pacing; never teleport or reset distance. Boosts and clean riding still win.
  const pack=clamp(1-gap/150,.48,1.20),wave=1+.035*Math.sin(s.time*.6+i*2);
  r.pace=r.speed*1.4*pack*wave;
  r.distance=Math.min(s.length*s.laps,r.distance+r.pace*dt);
 }
}
