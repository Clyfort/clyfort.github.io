const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const near=(a,b)=>assert(Math.abs(a-b)<.001,`${a} != ${b}`);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.EDITOR_TEST_URL||'http://127.0.0.1:8011/editor/');await page.waitForFunction(()=>localStorage.getItem('shiguang-studio-project-v1'));
  const fixture=await page.evaluate(()=>{
   const doc=JSON.parse(localStorage.getItem('shiguang-studio-project-v1')),image=doc.layers.find(l=>l.type==='image'),shape=doc.layers.find(l=>l.type==='shape');
   const canvas=document.createElement('canvas');canvas.width=300;canvas.height=100;const c=canvas.getContext('2d');c.fillStyle='red';c.fillRect(0,0,300,100);
   Object.assign(image,{id:'image',x:20,y:30,w:100,h:150,rotation:25,src:canvas.toDataURL(),cropX:20,cropY:80,flipX:true,contrast:115,saturation:80});
   doc.width=500;doc.height=400;doc.background='#ffffff';doc.layers=[image];return {doc,shape};
  });
  const state=async()=>{await page.waitForTimeout(400);return page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));};
  const load=async doc=>{await page.locator('#projectInput').setInputFiles({name:'layout-export.figlyph',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await state();};
  const select=async ids=>{await page.locator('[data-panel="layers"]').click();for(let i=0;i<ids.length;i++)await page.locator(`[data-layer="${ids[i]}"]`).click(i?{modifiers:['Shift']}:{})};
  await load(fixture.doc);await select(['image']);await page.locator('[data-action="image-contain"]').click();let image=(await state()).layers[0];near(image.w,500);near(image.h,500/3);near(image.y,(400-500/3)/2);assert.equal(image.rotation,0);assert.equal(image.cropX,50);assert.equal(image.contrast,115);assert(image.flipX);
  await page.locator('#undo').click();assert.deepEqual((await state()).layers[0],fixture.doc.layers[0]);await page.locator('#redo').click();await state();
  await page.locator('[data-action="image-cover"]').click();image=(await state()).layers[0];assert.equal(image.w,500);assert.equal(image.h,400);assert.equal(image.x,0);assert.equal(image.y,0);
  await page.locator('[data-action="image-original"]').click();image=(await state()).layers[0];assert.equal(image.w,300);assert.equal(image.h,100);assert.equal(image.x,100);assert.equal(image.y,150);
  await page.locator('[data-action="toggle-lock"]').click();await state();assert(await page.locator('[data-action="image-cover"]').isDisabled());
  const shape=(id,x,y,w,h,fill)=>({...fixture.shape,id,name:id,shape:'rect',x,y,w,h,fill,fillEnabled:true,strokeWidth:0,rotation:0,radius:0,shadow:0,opacity:1});
  const doc={...fixture.doc,layers:[shape('background',0,0,500,400,'#00ff00'),shape('red',100,60,100,80,'#ff0000'),shape('blue',260,180,60,50,'#0000ff')]};
  await load(doc);await select(['red','blue']);
  const download=async()=>{const promise=page.waitForEvent('download');await page.locator('#downloadImage').click();const file=await promise,bytes=fs.readFileSync(await file.path());return {name:file.suggestedFilename(),pixels:await page.evaluate(async base64=>{const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const c=canvas.getContext('2d');c.drawImage(im,0,0);return {width:im.width,height:im.height,top:[...c.getImageData(0,0,1,1).data],gap:[...c.getImageData(Math.floor(im.width*.6),Math.floor(im.height*.5),1,1).data],bottom:[...c.getImageData(im.width-1,im.height-1,1,1).data]};},bytes.toString('base64'))};};
  await page.locator('#exportButton').click();await page.locator('#exportArea').selectOption('selection');await page.locator('#transparentExport').check();let result=await download();assert.equal(result.pixels.width,220);assert.equal(result.pixels.height,170);assert.deepEqual(result.pixels.top,[255,0,0,255]);assert.deepEqual(result.pixels.gap,[0,0,0,0]);assert.deepEqual(result.pixels.bottom,[0,0,255,255]);assert(result.name.includes('_所选图层'));
  await page.locator('#exportButton').click();await page.locator('#exportArea').selectOption('selection');await page.locator('#exportScale').selectOption('0.5');result=await download();assert.equal(result.pixels.width,110);assert.equal(result.pixels.height,85);assert.deepEqual(result.pixels.gap,[255,255,255,255]);
  await page.locator('#exportButton').click();result=await download();assert.equal(result.pixels.width,500);assert.equal(result.pixels.height,400);assert.deepEqual(result.pixels.top,[0,255,0,255]);
  await page.locator('#exportButton').click();await page.locator('#exportArea').selectOption('selection');await page.locator('#transparentExport').check();await page.locator('[data-format="jpeg"]').click();assert(!(await page.locator('#transparentRow').isVisible()));result=await download();assert(result.name.endsWith('.jpg'));for(const channel of result.pixels.gap.slice(0,3))assert(channel>=250);
  await page.setViewportSize({width:390,height:844});await page.locator('#exportButton').click();await page.locator('#exportArea').selectOption('selection');assert((await page.locator('#modal').boundingBox()).width<=390);await page.locator('#closeModal').click();
  assert.deepEqual(errors,[]);console.log('PASS: image contain/cover/original, preserved filters and flip, locks, undo/redo; selected-only exports, transparent/background pixels, whole canvas, half size, JPG and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
