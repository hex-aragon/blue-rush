export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function waveHeight(x,z,t,strength=1){return strength*(Math.sin(x*0.022+z*0.014-t*1.2)*0.72+Math.sin(x*0.051-z*0.027-t*1.7)*0.3+Math.sin(z*0.085+x*0.03-t*2.1)*0.12+Math.sin(x*.007+z*.010-t*.52)*.35);}
