const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});await page.goto(process.env.EDITOR_TEST_URL||'http://127.0.0.1:8011/editor/');
 const add=async()=>{await page.locator('[data-action="add-text"]').click();const r=await page.locator('#artboard').boundingBox();await page.mouse.click(r.x+r.width*.2,r.y+r.height*.3);await page.locator('#inlineText').fill('继承样式');await page.locator('#inlineText').press('Control+Enter');};
 const state=async()=>{await page.waitForTimeout(450);return page.evaluate(()=>JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));};
 await page.locator('#newProject').click();await page.locator('#confirmCanvas').click();await add();
 await page.locator('[data-prop="fontFamily"]').selectOption('Microsoft YaHei');
 for(const [k,v] of Object.entries({fontSize:'47',lineHeight:'1.8',letterSpacing:'2',paragraphSpacing:'9'})){await page.locator(`[data-prop="${k}"]`).fill(v);await page.locator(`[data-prop="${k}"]`).press('Tab');}
 await page.locator('[data-toggle="italic"]').click();await page.locator('[data-toggle="underline"]').click();await page.locator('[data-prop="align"]').selectOption('center');
 let expected=(await state()).layers.at(-1);await add();
 const keys=['fontFamily','fontSize','bold','italic','underline','strike','lineHeight','letterSpacing','paragraphSpacing','align','fill'];
 const check=async()=>{const actual=(await state()).layers.at(-1);for(const k of keys)assert.equal(actual[k],expected[k],k);};
 await check();await page.reload();await add();await check();
 await page.locator('[data-panel="text"]').click();await page.locator('[data-text="subheading"]').click();const r=await page.locator('#artboard').boundingBox();await page.mouse.click(r.x+r.width*.4,r.y+r.height*.5);await page.locator('#inlineText').press('Control+Enter');const preset=(await state()).layers.at(-1);assert.equal(preset.fontSize,36);assert.equal(preset.fontFamily,expected.fontFamily);assert.equal(preset.lineHeight,expected.lineHeight);
 console.log('PASS: new text inherits font, size, emphasis, spacing and alignment; reload retains defaults; explicit presets keep their size.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
