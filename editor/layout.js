// Axis-aligned bounds of a rotated layer. Shared by hit/selection UI and layout.
export function layerBounds(layer){
 const radians=layer.rotation*Math.PI/180,cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians));
 const w=layer.w*cos+layer.h*sin,h=layer.w*sin+layer.h*cos;
 return {x:layer.x+(layer.w-w)/2,y:layer.y+(layer.h-h)/2,w,h};
}

// Return translations only; rotation, scale, content and stacking order stay intact.
export function arrangeLayers(layers,action,canvas,target='selection'){
 const entries=layers.filter(layer=>layer.visible&&!layer.locked).map(layer=>({layer,bounds:layerBounds(layer)}));
 if(!entries.length)return [];
 const horizontal=['align-left','align-center','align-right','distribute-horizontal'].includes(action);
 const vertical=['align-top','align-middle','align-bottom','distribute-vertical'].includes(action);
 if(!horizontal&&!vertical)return [];
 const axis=horizontal?'x':'y',size=horizontal?'w':'h';
 const translate=(entry,position)=>({id:entry.layer.id,[axis]:entry.layer[axis]+position-entry.bounds[axis]});
 if(action.startsWith('distribute-')){
  if(entries.length<3)return [];
  entries.sort((a,b)=>a.bounds[axis]-b.bounds[axis]);
  const first=entries[0].bounds,last=entries.at(-1).bounds;
  const gap=(last[axis]+last[size]-first[axis]-entries.reduce((sum,entry)=>sum+entry.bounds[size],0))/(entries.length-1);
  let cursor=first[axis];
  return entries.map((entry,index)=>{const result=translate(entry,index===entries.length-1?last[axis]:cursor);cursor+=entry.bounds[size]+gap;return result;});
 }
 const start=target==='canvas'||entries.length===1?0:Math.min(...entries.map(entry=>entry.bounds[axis]));
 const end=target==='canvas'||entries.length===1?(horizontal?canvas.width:canvas.height):Math.max(...entries.map(entry=>entry.bounds[axis]+entry.bounds[size]));
 return entries.map(entry=>translate(entry,action==='align-left'||action==='align-top'?start:action==='align-right'||action==='align-bottom'?end-entry.bounds[size]:(start+end-entry.bounds[size])/2));
}
