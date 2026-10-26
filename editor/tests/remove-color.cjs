const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {removeColorBackground,sampleBackground}=await import(pathToFileURL(path.resolve(__dirname,'../remove-color.js')).href);
 const make=(w,h,color)=>{const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)data.set([...color,255],i*4);return data;};
 const source=make(9,9,[255,255,255]);for(let y=2;y<=6;y++)for(let x=2;x<=6;x++)source.set([255,0,0,255],(y*9+x)*4);source.set([255,255,255,255],(4*9+4)*4);
 assert.deepEqual(sampleBackground(source,9,9),[255,255,255]);
 let result=removeColorBackground({pixels:new Uint8ClampedArray(source),width:9,height:9,color:[255,255,255],tolerance:0,feather:0,contiguous:true});assert.equal(result.pixels[3],0);assert.equal(result.pixels[(4*9+4)*4+3],255,'enclosed matching foreground stays opaque');assert.equal(result.pixels[(2*9+2)*4+3],255);assert.equal(result.changed,56);
 result=removeColorBackground({pixels:new Uint8ClampedArray(source),width:9,height:9,color:[255,255,255],tolerance:0,feather:0,contiguous:false});assert.equal(result.pixels[(4*9+4)*4+3],0);assert.equal(result.changed,57);
 const edge=make(3,1,[255,255,255]);edge.set([245,245,245,128],4);edge.set([0,0,0,255],8);result=removeColorBackground({pixels:edge,width:3,height:1,color:[255,255,255],tolerance:0,feather:10});assert(result.pixels[7]>0&&result.pixels[7]<128);assert.deepEqual([...result.pixels.slice(8)],[0,0,0,255]);
 const transparent=make(2,2,[10,20,30]);transparent[3]=0;result=removeColorBackground({pixels:transparent,width:2,height:2,color:[255,255,255],tolerance:0,feather:0});assert.equal(result.pixels[3],0);assert.equal(result.pixels[7],255);
 assert.throws(()=>removeColorBackground({pixels:new Uint8ClampedArray(4),width:1,height:2,color:[255,255,255]}));
 assert.throws(()=>removeColorBackground({pixels:new Uint8ClampedArray(4),width:1,height:1,color:[NaN,255,255]}));
 console.log('PASS: connected edge removal, enclosed detail preservation, global mode, alpha feathering, RGB preservation, transparent pixels and invalid data.');
})().catch(e=>{console.error(e);process.exitCode=1;});
