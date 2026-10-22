const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<.001,`${message}: ${actual} != ${expected}`);
const bounds=l=>{const a=l.rotation*Math.PI/180,w=Math.abs(Math.cos(a))*l.w+Math.abs(Math.sin(a))*l.h,h=Math.abs(Math.sin(a))*l.w+Math.abs(Math.cos(a))*l.h;return {x:l.x+(l.w-w)/2,y:l.y+(l.h-h)/2,w,h};};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.EDITOR_TEST_URL||'http://127.0.0.1:8011/editor/');
  await page.waitForFunction(()=>localStorage.getItem('shiguang-studio-project-v1'));
  const fixture=await page.evaluate(()=>{
   const doc=JSON.parse(localStorage.getItem('shiguang-studio-project-v1')),base=doc.layers.find(l=>l.type==='shape');
   doc.width=1000;doc.height=800;doc.layers=[
    {...base,id:'first',name:'A',shape:'rect',x:70,y:80,w:100,h:70,rotation:0},
    {...base,id:'middle',name:'B',shape:'rect',x:250,y:200,w:80,h:120,rotation:30},
    {...base,id:'last',name:'C',shape:'rect',x:710,y:500,w:160,h:90,rotation:90},
    {...base,id:'locked',name:'Locked',shape:'rect',x:10,y:10,w:80,h:80,rotation:0,locked:true},
    {...base,id:'hidden',name:'Hidden',shape:'rect',x:10,y:10,w:80,h:80,rotation:0,visible:false},
   ];return doc;
  });
  const load=async()=>{await page.locator('#projectInput').setInputFiles({name:'layout.figlyph',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await page.waitForFunction(()=>document.querySelector('#artboard').width===1000);await page.waitForTimeout(400);};
  const state=async()=>{await page.waitForTimeout(400);return page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));};
  const select=async ids=>{await page.locator('[data-panel="layers"]').click();for(let i=0;i<ids.length;i++)await page.locator(`[data-layer="${ids[i]}"]`).click(i?{modifiers:['Shift']}:{})};
  await load();await select(['first','middle','last','locked','hidden']);
  await page.locator('[data-action="align-left"]').click();let doc=await state();
  for(const id of ['first','middle','last'])near(bounds(doc.layers.find(l=>l.id===id)).x,70,'left edges');
  for(const id of ['locked','hidden'])assert.deepEqual(doc.layers.find(l=>l.id===id),fixture.layers.find(l=>l.id===id));
  await page.locator('#undo').click();assert.deepEqual((await state()).layers,fixture.layers);await page.locator('#redo').click();await state();
  await page.locator('#alignmentTarget').selectOption('canvas');await page.locator('[data-action="align-bottom"]').click();doc=await state();
  for(const id of ['first','middle','last']){const b=bounds(doc.layers.find(l=>l.id===id));near(b.y+b.h,800,'canvas bottom edges');}
  await page.locator('[data-action="align-center"]').click();doc=await state();for(const id of ['first','middle','last']){const b=bounds(doc.layers.find(l=>l.id===id));near(b.x+b.w/2,500,'canvas centers');}
  await load();await select(['first','middle','last']);await page.locator('[data-action="distribute-horizontal"]').click();doc=await state();
  let b=doc.layers.slice(0,3).map(bounds);near(b[1].x-b[0].x-b[0].w,b[2].x-b[1].x-b[1].w,'horizontal gaps');near(doc.layers[0].x,fixture.layers[0].x,'first endpoint');near(doc.layers[2].x,fixture.layers[2].x,'last endpoint');
  await page.locator('[data-action="distribute-vertical"]').click();doc=await state();b=doc.layers.slice(0,3).map(bounds);near(b[1].y-b[0].y-b[0].h,b[2].y-b[1].y-b[1].h,'vertical gaps');
  await page.reload();assert.deepEqual((await state()).layers,doc.layers,'layout persists');await select(['middle']);
  await page.locator('[data-action="align-right"]').click();doc=await state();const single=bounds(doc.layers[1]);near(single.x+single.w,1000,'single rotated layer aligns to canvas');
  await select(['first','middle']);assert(await page.locator('[data-action="distribute-horizontal"]').isDisabled());
  await page.setViewportSize({width:390,height:844});await page.locator('#propertiesToggle').click();await page.locator('[data-action="align-top"]').click();doc=await state();near(bounds(doc.layers[0]).y,bounds(doc.layers[1]).y,'mobile alignment');
  const fits=await page.locator('.layout-align').evaluate(el=>el.scrollWidth<=el.clientWidth);assert(fits);assert.deepEqual(errors,[]);
  console.log('PASS: rotated multi/single bounds, selection/canvas reference, six alignments, equal gaps, fixed endpoints, protected layers, undo/redo, persistence and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
