// One shared world clock for movement, warning, emergence and collision.
export const WARNING_SECONDS=.65,RISE_SECONDS=.3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const hazardKey=(lap,o)=>`${lap}:${o.id}`;
export function hazardStage(s,o,lap,time=s.time){
 if(o.type!=='breacher')return {warning:false,rise:1,solid:true};
 const start=s.hazards?.get(hazardKey(lap,o));
 if(start===undefined||time<start)return {warning:false,rise:0,solid:false};
 const elapsed=time-start,rise=clamp((elapsed-WARNING_SECONDS)/RISE_SECONDS,0,1);
 return {warning:elapsed<WARNING_SECONDS+RISE_SECONDS,rise,solid:rise>=.85};
}
export function updateHazards(s){
 s.hazards??=new Map();const notices=[];
 const racers=[s,...s.rivals],lead=Math.max(...racers.map(r=>r.distance));
 const warningDistance=Math.max(96,...racers.map(r=>(r.speed||0)*1.5));
 for(const o of s.objects){if(o.type!=='breacher')continue;
  for(let lap=Math.max(0,Math.floor(s.distance/s.length));lap<=Math.min(s.laps-1,Math.floor((lead+warningDistance)/s.length));lap++){
   const d=lap*s.length+o.d,key=hazardKey(lap,o),delta=d-lead;
   if(delta>=-5&&delta<=warningDistance&&!s.hazards.has(key)){
    s.hazards.set(key,s.time);if(d-s.distance>0&&d-s.distance<180)notices.push({o,lap,d});
   }
  }
 }
 return notices;
}
