const assert=require('node:assert/strict'),{chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const {snapTranslation,combinedBounds}=await import(pathToFileURL(path.resolve(__dirname,'../snapping.js')).href);
 const layer=(x,y,w=100,h=60,extra={})=>({id:'a',x,y,w,h,rotation:0,visible:true,...extra});
 const source=layer(80,80),target=layer(400,300,100,100),canvas={width:800,height:600};
 let r=snapTranslation([source],[target],canvas,218,55,7);assert.equal(r.dx,220);assert.equal(r.dy,55);assert(r.guides.some(g=>g.axis==='x'&&g.position===400));
 assert.equal(snapTranslation([source],[{...target,visible:false}],canvas,218,55,1).dx,218);
 r=snapTranslation([source],[],canvas,-76,10,7);assert.equal(r.dx,-80);assert.equal(r.dy,10);
 r=snapTranslation([source],[target],canvas,218,55,7,'x');assert.equal(r.dy,0);assert.equal(r.dx,220);
 const rotated=layer(100,100,100,60,{rotation:90});assert.deepEqual(combinedBounds([rotated]),{x:120,y:80,w:60,h:100});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.EDITOR_TEST_URL||'http://127.0.0.1:8765/editor/');await page.waitForFunction(()=>localStorage.getItem('shiguang-studio-project-v1'));
  const fixture=await page.evaluate(()=>{const doc=JSON.parse(localStorage.getItem('shiguang-studio-project-v1')),base=doc.layers.find(l=>l.type==='shape');return {...doc,width:800,height:600,layers:[{...base,id:'moving',name:'Moving',shape:'rect',x:80,y:80,w:100,h:60,rotation:0},{...base,id:'companion',name:'Companion',shape:'rect',x:200,y:150,w:40,h:40,rotation:0},{...base,id:'target',name:'Target',shape:'rect',x:500,y:300,w:100,h:100,rotation:0,locked:true}]};});
  const state=async()=>{await page.waitForTimeout(400);return page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));};
  const load=async()=>{await page.locator('#projectInput').setInputFiles({name:'snap.figlyph',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await state();};
  const select=async(ids)=>{await page.locator('[data-panel="layers"]').click();for(let i=0;i<ids.length;i++)await page.locator(`[data-layer="${ids[i]}"]`).click(i?{modifiers:['Shift']}:{})};
  const drag=async(dx,dy,{alt=false,shift=false,finish=true}={})=>{const box=await page.locator('#artboard').boundingBox(),scale=box.width/800;await page.mouse.move(box.x+110*scale,box.y+110*scale);if(alt)await page.keyboard.down('Alt');if(shift)await page.keyboard.down('Shift');await page.mouse.down();await page.mouse.move(box.x+(110+dx)*scale,box.y+(110+dy)*scale,{steps:8});if(finish)await page.mouse.up();if(alt)await page.keyboard.up('Alt');if(shift)await page.keyboard.up('Shift');};
  await load();await select(['moving']);await drag(318,30,{finish:false});assert(await page.locator('.snap-guide').count()>0);await page.mouse.up();let doc=await state();assert.equal(doc.layers[0].x,400);assert.equal(doc.layers[0].y,110);assert.equal(await page.locator('.snap-guide').count(),0);assert.deepEqual(doc.layers[2],fixture.layers[2]);
  await page.locator('#undo').click();assert.deepEqual((await state()).layers,fixture.layers);await page.locator('#redo').click();await state();
  await load();await select(['moving']);await drag(318,30,{alt:true});doc=await state();assert.equal(doc.layers[0].x,398);assert.equal(doc.layers[0].y,110);
  await load();await select(['moving','companion']);await drag(258,30);doc=await state();assert.equal(doc.layers[0].x,340);assert.equal(doc.layers[1].x,460);assert.equal(doc.layers[1].y-doc.layers[0].y,70,'selection keeps relative geometry');
  await load();await select(['moving']);await drag(318,30,{shift:true});doc=await state();assert.equal(doc.layers[0].x,400);assert.equal(doc.layers[0].y,80);
  await load();await select(['moving']);await drag(318,30,{finish:false});await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual((await state()).layers,fixture.layers);assert.equal(await page.locator('.snap-guide').count(),0);
  await drag(318,30,{finish:false});await page.locator('#viewport').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.deepEqual((await state()).layers,fixture.layers);
  await page.locator('#snapToggle').click();assert.equal(await page.locator('#snapToggle').getAttribute('aria-pressed'),'false');await page.reload();assert.equal(await page.locator('#snapToggle').getAttribute('aria-pressed'),'false');await select(['moving']);await drag(318,30);assert.equal((await state()).layers[0].x,398);
  await page.setViewportSize({width:320,height:740});assert(await page.locator('#snapToggle').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=320));assert.deepEqual(errors,[]);
  console.log('PASS: canvas and layer edges/centers, rotated bounds, protected/hidden references, single/multi drag, guides, Alt bypass, Shift axis, cancellation, undo/redo, persistent toggle and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
