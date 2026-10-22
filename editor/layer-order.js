// The document stores layers from back to front. Move a selection as a stable set.
export function reorderedLayers(layers,ids,direction){
 const moving=new Set(layers.filter(layer=>ids.has(layer.id)&&!layer.locked).map(layer=>layer.id));
 if(!moving.size)return layers;
 if(direction==='front')return [...layers.filter(layer=>!moving.has(layer.id)),...layers.filter(layer=>moving.has(layer.id))];
 if(direction==='back')return [...layers.filter(layer=>moving.has(layer.id)),...layers.filter(layer=>!moving.has(layer.id))];
 const result=[...layers];
 if(direction==='up'){for(let i=result.length-2;i>=0;i--)if(moving.has(result[i].id)&&!moving.has(result[i+1].id))[result[i],result[i+1]]=[result[i+1],result[i]];}
 else if(direction==='down'){for(let i=1;i<result.length;i++)if(moving.has(result[i].id)&&!moving.has(result[i-1].id))[result[i],result[i-1]]=[result[i-1],result[i]];}
 return result;
}
