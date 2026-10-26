const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');assert(!fs.existsSync(path.join(root,'ai-assistant.js')));
 for(const file of ['index.html','editor.js','editor.css','layout.css','README.md'])assert(!/openTextAssistant|requestTextAction|aiTool|ai-text-button|ai-dialog|api\.openai|DeepSeek|Chat Completions/.test(fs.readFileSync(path.join(root,file),'utf8')),file+' has no former assistant integration');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],external=[],base=process.env.EDITOR_TEST_URL||'http://127.0.0.1:8011/editor/';page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(!request.url().startsWith(new URL(base).origin))external.push(request.url());});
  await page.addInitScript(()=>localStorage.setItem('figlyph-ai-settings-v1',JSON.stringify({baseUrl:'https://example.test/v1',model:'obsolete'})));
  await page.goto(base);await page.waitForFunction(()=>localStorage.getItem('shiguang-studio-project-v1'));
  assert.equal(await page.locator('#aiTool,[data-action="ai-text"],.ai-dialog').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('figlyph-ai-settings-v1')),null);
  await page.locator('[data-panel="text"]').click();assert(!(await page.locator('body').innerText()).includes('AI'));assert(await page.locator('[data-action="add-text"]').isVisible());
  await page.locator('#artboard').focus();await page.keyboard.press('t');const box=await page.locator('#artboard').boundingBox();await page.mouse.click(box.x+box.width*.15,box.y+box.height*.2);await page.locator('#inlineText').fill('纯本地文字编辑');await page.locator('#inlineText').press('Control+Enter');assert(await page.locator('[data-prop="autoWidth"]').isChecked());assert.equal(await page.locator('[data-action="ai-text"]').count(),0);
  await page.locator('#projectMenu').click();assert(!(await page.locator('#modal').innerText()).includes('API'));await page.locator('#closeModal').click();
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#aiTool').count(),0);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log('PASS: assistant module, UI, configuration and provider integration removed; obsolete preferences cleared; local editing and automatic text width work with no external requests.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
