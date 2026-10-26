import {layerBounds} from './layout.js?v=20261022-3';

export function combinedBounds(layers){
 const boxes=layers.map(layerBounds);
 if(!boxes.length)return null;
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
 return {x,y,w:Math.max(...boxes.map(b=>b.x+b.w))-x,h:Math.max(...boxes.map(b=>b.y+b.h))-y};
}

// Work in document coordinates; the caller converts the screen-space tolerance.
export function snapTranslation(originals,others,canvas,dx,dy,tolerance,axis=null){
 const bounds=combinedBounds(originals),guides=[];
 if(!bounds)return {dx,dy,guides};
 if(axis==='x')dy=0;if(axis==='y')dx=0;
 const moved={...bounds,x:bounds.x+dx,y:bounds.y+dy};
 const targets=[{x:0,y:0,w:canvas.width,h:canvas.height},...others.filter(l=>l.visible).map(layerBounds)];
 const corrections={x:0,y:0};
 for(const [key,size,cross,crossSize]of [['x','w','y','h'],['y','h','x','w']]){
  if(axis&&axis!==key)continue;
  let best=null;
  for(const target of targets)for(const fraction of [0,.5,1]){
   const position=target[key]+target[size]*fraction;
   for(const anchor of [0,.5,1]){
    const delta=position-moved[key]-moved[size]*anchor;
    if(Math.abs(delta)<=tolerance&&(!best||Math.abs(delta)<Math.abs(best.delta)-.0001))best={delta,position,target};
   }
  }
  if(best){corrections[key]=best.delta;guides.push({axis:key,position:best.position,start:Math.min(moved[cross],best.target[cross]),end:Math.max(moved[cross]+moved[crossSize],best.target[cross]+best.target[crossSize])});}
 }
 return {dx:dx+corrections.x,dy:dy+corrections.y,guides};
}
