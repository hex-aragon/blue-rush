export function heldSteering(onChange){
 const held=new Map();let value=0;
 const emit=()=>{value=Math.max(-1,Math.min(1,[...held.values()].reduce((sum,v)=>sum+v,0)));onChange(value);};
 return {get value(){return value;},set(source,direction){if(direction)held.set(source,direction);else held.delete(source);emit();},reset(){held.clear();emit();}};
}
export function bindRaceSteering(buttons,onChange,enabled){
 const input=heldSteering(value=>{buttons.forEach((b,i)=>b.classList.toggle('held',value===(i?1:-1)));onChange(value);});let pulse;const starts=new Map(),releases=new Map();
 const hold=(source,direction)=>{clearTimeout(releases.get(source));starts.set(source,performance.now());input.set(source,direction);};
 const release=(source,minimum=90)=>{clearTimeout(releases.get(source));const wait=minimum-(performance.now()-(starts.get(source)??-Infinity));if(wait>0)releases.set(source,setTimeout(()=>{input.set(source,0);starts.delete(source);releases.delete(source);},wait));else{input.set(source,0);starts.delete(source);releases.delete(source);}};
 buttons.forEach((button,i)=>{const direction=i?1:-1;
 button.addEventListener('pointerdown',e=>{if(!enabled()||e.button>0)return;e.preventDefault();clearTimeout(pulse);input.set('assistive',0);button.setPointerCapture(e.pointerId);hold(`pointer-${e.pointerId}`,direction);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>release(`pointer-${e.pointerId}`,e.type==='pointercancel'?0:90));
 button.addEventListener('keydown',e=>{if(![' ','Enter'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(enabled())hold(`key-${i}-${e.key}`,direction);});
 button.addEventListener('keyup',e=>{if(![' ','Enter'].includes(e.key))return;e.preventDefault();e.stopPropagation();release(`key-${i}-${e.key}`);});
 button.addEventListener('blur',()=>{for(const key of [' ','Enter'])release(`key-${i}-${key}`,0);});
 button.addEventListener('click',e=>{if(e.detail||!enabled())return;clearTimeout(pulse);input.set('assistive',direction);pulse=setTimeout(()=>input.set('assistive',0),180);});
 button.addEventListener('contextmenu',e=>e.preventDefault());
 });
 const reset=()=>{clearTimeout(pulse);for(const timer of releases.values())clearTimeout(timer);releases.clear();starts.clear();input.reset();};window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 return {get value(){return input.value;},reset};
}
