const MAX_PIXELS=16_000_000;

export function sampleBackground(pixels,width,height){
 const corners=[0,width-1,(height-1)*width,width*height-1].filter(index=>pixels[index*4+3]>0);
 if(!corners.length)return [255,255,255];
 const colors=corners.map(index=>[...pixels.subarray(index*4,index*4+3)]);
 let best=colors[0],score=-1;
 for(const candidate of colors){const matches=colors.filter(color=>color.every((value,index)=>Math.abs(value-candidate[index])<=24)).length;if(matches>score){best=candidate;score=matches;}}
 return best;
}

// Remove only matching pixels reachable from the edge unless global mode is chosen.
// Work in source resolution and preserve RGB data and existing transparency.
export function removeColorBackground({pixels,width,height,color,tolerance=12,feather=3,contiguous=true}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>MAX_PIXELS||!(pixels instanceof Uint8ClampedArray)||pixels.length!==width*height*4)throw Error('图片像素数据无效或超过 1600 万像素。');
 if(!Array.isArray(color)||color.length!==3||!color.every(value=>Number.isFinite(value)&&value>=0&&value<=255)||!Number.isFinite(tolerance)||!Number.isFinite(feather))throw Error('背景颜色或容差无效。');
 const threshold=Math.max(0,Math.min(100,tolerance))*Math.sqrt(3)*2.55,softness=Math.max(0,Math.min(20,feather))*Math.sqrt(3)*2.55,limit=threshold+softness;
 const length=width*height,visited=contiguous?new Uint8Array(length):null,queue=contiguous?new Int32Array(length):null;
 let head=0,tail=0,changed=0;
 const distance=index=>{const offset=index*4;return Math.hypot(pixels[offset]-color[0],pixels[offset+1]-color[1],pixels[offset+2]-color[2]);};
 const erase=(index,value)=>{const offset=index*4+3,previous=pixels[offset];pixels[offset]=value<=threshold||!softness?0:Math.round(previous*Math.min(1,(value-threshold)/softness));if(pixels[offset]<previous)changed++;};
 const visit=index=>{if(visited[index])return;visited[index]=1;const value=distance(index);if(pixels[index*4+3]===0||value<=limit){queue[tail++]=index;erase(index,value);}};
 if(contiguous){
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=1;y<height-1;y++){visit(y*width);visit(y*width+width-1);}
  while(head<tail){const index=queue[head++],x=index%width;if(x>0)visit(index-1);if(x<width-1)visit(index+1);if(index>=width)visit(index-width);if(index+width<length)visit(index+width);}
 }else for(let index=0;index<length;index++){const value=distance(index);if(value<=limit)erase(index,value);}
 return {pixels,changed};
}
