const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.EDITOR_TEST_URL||'http://127.0.0.1:8011/editor/');await page.waitForFunction(()=>localStorage.getItem('shiguang-studio-project-v1'));
  const fixture=await page.evaluate(()=>{const doc=JSON.parse(localStorage.getItem('shiguang-studio-project-v1')),text=doc.layers.find(l=>l.type==='text'),shape=doc.layers.find(l=>l.type==='shape');doc.layers=[{...text,id:'text',text:'searchable text',name:'Title',fontSize:24},{...shape,id:'a',name:'A'},{...shape,id:'locked',name:'Locked',locked:true},{...shape,id:'b',name:'B'},{...shape,id:'c',name:'C'}];return doc;});
  const state=async()=>{await page.waitForTimeout(400);return page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));};
  await page.locator('#projectInput').setInputFiles({name:'layers.figlyph',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await state();
  await page.locator('[data-panel="layers"]').click();await page.locator('[data-layer="text"]').click();
  await page.locator('#layerName').fill('海报主标题');await page.locator('#layerName').press('Enter');let doc=await state();assert.equal(doc.layers[0].name,'海报主标题');assert(doc.layers[0].customName);
  await page.locator('[data-prop="text"]').fill('edited text');await page.locator('[data-prop="text"]').press('Tab');assert.equal((await state()).layers[0].name,'海报主标题');
  await page.locator('#layerSearch').fill('海报');assert.equal(await page.locator('[data-layer]:visible').count(),1);assert.equal(await page.locator('#layerSearch').inputValue(),'海报');
  await page.locator('#layerSearch').fill('EDITED');assert.equal(await page.locator('[data-layer]:visible').count(),1,'search includes text content and ignores case');
  await page.locator('#layerSearch').fill('no such layer');assert(await page.locator('#layerSearchEmpty').isVisible());await page.locator('[data-action="layer-clear-search"]').click();assert.equal(await page.locator('[data-layer]:visible').count(),5);
  const select=async ids=>{for(let i=0;i<ids.length;i++)await page.locator(`[data-layer="${ids[i]}"]`).click(i?{modifiers:['Shift']}:{})};
  const order=async()=>(await state()).layers.map(l=>l.id);
  await select(['a','b','locked']);await page.locator('[data-action="layer-front"]').click();assert.deepEqual(await order(),['text','locked','c','a','b']);
  await page.locator('#undo').click();assert.deepEqual(await order(),['text','a','locked','b','c']);await page.locator('#redo').click();await state();
  await page.locator('[data-action="layer-back"]').click();assert.deepEqual(await order(),['a','b','text','locked','c']);
  await page.locator('[data-action="layer-up"]').click();assert.deepEqual(await order(),['text','a','b','locked','c']);
  await page.locator('[data-action="layer-down"]').click();assert.deepEqual(await order(),['a','b','text','locked','c']);
  await select(['locked']);assert(await page.locator('#layerName').isDisabled());await page.locator('[data-action="layer-front"]').click();assert.deepEqual(await order(),['a','b','text','locked','c']);
  await select(['text']);await page.locator('#layerName').fill('temporary');await page.locator('#layerName').press('Escape');assert.equal((await state()).layers.find(l=>l.id==='text').name,'海报主标题');
  await page.locator('#layerName').fill('新的标题');await page.locator('#layerName').press('Enter');await state();await page.locator('#undo').click();assert.equal(await page.locator('#layerName').inputValue(),'海报主标题','undo keeps the layer that was edited selected');
  await page.locator('#artboard').focus();await page.keyboard.press('Control+Shift+]');assert.equal((await order()).at(-1),'text');await page.keyboard.press('Control+Shift+[');assert.equal((await order())[0],'text');
  await page.reload();await state();await page.locator('[data-panel="layers"]').click();await page.locator('[data-layer="text"]').click();assert.equal(await page.locator('#layerName').inputValue(),'海报主标题');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-panel="layers"]').click();await page.locator('#layerSearch').fill('海报');assert.equal(await page.locator('[data-layer]:visible').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS: custom names survive text changes and reload; searchable names/text, no-match/clear, stable multi-layer front/back/steps, locks, undo/redo, Escape and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
