const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.EDITOR_TEST_URL || 'http://127.0.0.1:8011/editor/');
    const state = async () => { await page.waitForTimeout(450); return page.evaluate(() => JSON.parse(localStorage.getItem('shiguang-studio-project-v1'))); };
    const click = async (x, y) => { const r = await page.locator('#artboard').boundingBox(); await page.mouse.click(r.x+x*r.width/800, r.y+y*r.height/1000); };
    const edit = async layer => { const r = await page.locator('#artboard').boundingBox(); await page.mouse.dblclick(r.x+(layer.x+20)*r.width/800, r.y+(layer.y+layer.h/2)*r.height/1000); };
    await page.locator('#newProject').click(); await page.locator('#confirmCanvas').click();
    await page.locator('[data-action="add-text"]').click(); assert.equal((await state()).layers.length, 0, 'arming text tool does not insert text');
    await click(100, 200); assert(await page.locator('#inlineText').isVisible()); assert(await page.locator('#inlineText').evaluate(el => el === document.activeElement), 'placement opens a focused editor');
    await page.locator('#inlineText').fill('放在这里'); await page.locator('#inlineText').press('Control+Enter');
    let doc = await state(), layer = doc.layers[0]; assert(Math.abs(layer.x-100)<1); assert(Math.abs(layer.y-200)<1); assert.equal(layer.text, '放在这里');
    await edit(layer); await page.locator('#inlineText').fill(''); await page.locator('#inlineText').press('Control+Enter');
    assert.equal((await state()).layers.length, 0, 'empty confirmation deletes frame');
    await page.locator('#undo').click(); assert.equal((await state()).layers[0].text, '放在这里');
    await page.locator('#redo').click(); assert.equal((await state()).layers.length, 0);
    await page.locator('[data-action="add-text"]').click(); await page.keyboard.press('Escape'); await click(150, 150);
    assert.equal((await state()).layers.length, 0, 'Escape cancels placement');
    await page.locator('[data-panel="text"]').click(); await page.locator('[data-text="body"]').click();
    assert.equal((await state()).layers.length, 0); await click(250, 350); await page.locator('#inlineText').fill(' \n '); await page.locator('#inlineText').press('Control+Enter');
    assert.equal((await state()).layers.length, 0, 'whitespace-only frame also disappears');
    await page.locator('#zoomIn').click(); await page.locator('#viewport').hover(); await page.mouse.wheel(0, 15);
    await page.locator('[data-text="subheading"]').click(); await click(400, 300); await page.locator('#inlineText').fill('缩放后的位置'); await page.locator('#inlineText').press('Control+Enter');
    layer = (await state()).layers[0]; assert.equal(layer.fontSize, 36); assert(Math.abs(layer.x-400)<1); assert(Math.abs(layer.y-300)<1);
    await edit(layer); await page.locator('#inlineText').fill(''); await click(10, 10); assert.equal((await state()).layers.length, 0, 'outside click confirms deletion');
    // Clearing an old frame and clicking Add must not lose the new-tool click to blur handling.
    await page.locator('[data-action="add-text"]').click(); await click(100, 200); await page.locator('#inlineText').fill('');
    await page.locator('[data-action="add-text"]').click(); assert.equal((await state()).layers.length, 0); assert(await page.locator('#viewport').evaluate(el => el.classList.contains('text-place-active')));
    await click(180, 260); await page.locator('#inlineText').fill('右侧清空'); await page.locator('#inlineText').press('Control+Enter');
    await page.locator('[data-prop="text"]').fill(''); await page.locator('[data-prop="text"]').press('Tab'); assert.equal((await state()).layers.length, 0, 'inspector confirmation removes empty frame too');
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('[data-panel="text"]').click(); await page.locator('[data-text="heading"]').click();
    assert.equal(await page.locator('#assetPanel').isVisible(), false); await click(120, 400);
    assert(await page.locator('#inlineText').isVisible()); await page.locator('#inlineText').fill('手机文字'); await page.locator('#inlineText').press('Control+Enter');
    assert.equal((await state()).layers[0].text, '手机文字'); await page.reload(); assert.equal((await state()).layers[0].text, '手机文字');
    assert.deepEqual(errors, []); console.log('PASS: click-to-place text, focused editing, all presets, exact zoom/pan coordinates, empty and whitespace deletion, outside/inspector confirmation, undo/redo, placement cancellation, blur/tool sequencing, mobile and reload.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
