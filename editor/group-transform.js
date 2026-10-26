import {combinedBounds} from './snapping.js?v=20261026-2';

export function scaleSelection(layers,factor,anchor){
 if(!layers.length||!Number.isFinite(factor)||factor<=0)return [];
 if(Math.abs(factor-1)<1e-10)return structuredClone(layers);
 const bounds=combinedBounds(layers);anchor??={x:bounds.x+bounds.w/2,y:bounds.y+bounds.h/2};
 let min=0,max=Infinity;
 for(const l of layers){
  min=Math.max(min,1/l.w,1/l.h);max=Math.min(max,100000/l.w,100000/l.h);
  if(l.type==='text')for(const size of [l.fontSize,...Object.values(l.charStyles||{}).map(style=>style.fontSize||l.fontSize)]){min=Math.max(min,1/size);max=Math.min(max,1000/size);}
 }
 const scale=Math.max(min,Math.min(max,factor));
 const result=layers.map(l=>{
  const next=structuredClone(l);next.x=anchor.x+(l.x-anchor.x)*scale;next.y=anchor.y+(l.y-anchor.y)*scale;next.w=l.w*scale;next.h=l.h*scale;
  for(const key of ['strokeWidth','shadow','radius'])next[key]=(l[key]||0)*scale;
  if(l.type==='text'){next.autoWidth=false;for(const key of ['fontSize','letterSpacing','paragraphSpacing'])next[key]=l[key]*scale;for(const style of Object.values(next.charStyles||{}))if(style.fontSize)style.fontSize*=scale;}
  return next;
 });
 return result.every(l=>Math.abs(l.x)<=100000&&Math.abs(l.y)<=100000)?result:[];
}

export function rotateSelection(layers,angle,center){
 if(!layers.length||!Number.isFinite(angle))return [];
 const bounds=combinedBounds(layers);center??={x:bounds.x+bounds.w/2,y:bounds.y+bounds.h/2};
 const radians=angle*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
 const result=layers.map(l=>{const x=l.x+l.w/2-center.x,y=l.y+l.h/2-center.y;return {...structuredClone(l),x:center.x+x*cos-y*sin-l.w/2,y:center.y+x*sin+y*cos-l.h/2,rotation:((l.rotation+angle)%360+540)%360-180};});
 return result.every(l=>Math.abs(l.x)<=100000&&Math.abs(l.y)<=100000)?result:[];
}
