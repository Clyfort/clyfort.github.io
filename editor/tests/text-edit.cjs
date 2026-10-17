const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.EDITOR_TEST_URL || 'http://127.0.0.1:8011/editor/');
    await page.locator('[data-panel="images"]').click();
    assert.equal(await page.locator('[data-builtin]').count(), 0);
    assert(!(await page.locator('#assetPanel').innerText()).includes('内置风景'));
    assert(await page.locator('[data-action="upload"]').isVisible());
    await page.locator('[data-panel="elements"]').click();
    const state = async () => { await page.waitForTimeout(450); return page.evaluate(() => JSON.parse(localStorage.getItem('shiguang-studio-project-v1'))); };
    let document = await state(); const title = document.layers.find(l => l.type === 'text' && l.bold);
    const doubleClick = async (layer, empty = true) => {
      const r = await page.locator('#artboard').boundingBox(), z = r.width / document.width;
      // The right side is blank inside this wide text frame, not over an actual glyph.
      const x = empty ? layer.x + layer.w - 20 : layer.x + 30, y = layer.y + layer.h / 3;
      const angle = layer.rotation * Math.PI / 180, dx = x - layer.x - layer.w/2, dy = y - layer.y - layer.h/2;
      await page.mouse.dblclick(r.x + (layer.x + layer.w/2 + dx*Math.cos(angle)-dy*Math.sin(angle))*z, r.y + (layer.y + layer.h/2 + dx*Math.sin(angle)+dy*Math.cos(angle))*z);
    };
    await doubleClick(title); assert(await page.locator('#inlineText').isVisible(), 'native double click inside blank text-frame area opens editor');
    await page.locator('#inlineText').fill('双击文字框即可编辑\nFiglyph'); await page.locator('#inlineText').press('Control+Enter');
    assert.equal(await page.locator('#inlineText').isVisible(), false); assert.equal((await state()).layers.find(l => l.id === title.id).text, '双击文字框即可编辑\nFiglyph');
    await page.locator('#undo').click(); assert.equal((await state()).layers.find(l => l.id === title.id).text, title.text);
    await page.locator('#redo').click();
    // Starting with another object selected must still edit the double-clicked text frame.
    await page.locator('[data-panel="layers"]').click(); await page.locator('[data-layer]').filter({ hasText: '山野 · 风景' }).click();
    document = await state(); const current = document.layers.find(l => l.id === title.id); await doubleClick(current, false);
    assert(await page.locator('#inlineText').isVisible()); await page.locator('#inlineText').fill('点击框外完成编辑');
    await page.locator('#artboard').click({ position: { x: 10, y: 10 } });
    assert.equal((await state()).layers.find(l => l.id === title.id).text, '点击框外完成编辑');
    // Zoom and pan preserve double-click coordinates, and Ctrl+A remains native text selection.
    await page.locator('#zoomIn').click(); await page.locator('#viewport').hover(); await page.mouse.wheel(0, 10);
    document = await state(); await doubleClick(document.layers.find(l => l.id === title.id));
    await page.locator('#inlineText').press('Control+a');
    assert.equal(await page.locator('#inlineText').evaluate(el => el.selectionEnd - el.selectionStart), '点击框外完成编辑'.length);
    await page.locator('#inlineText').press('Escape');
    // Box selection mode must not accidentally start text editing.
    await page.locator('#marqueeTool').click(); document = await state(); await doubleClick(document.layers.find(l => l.id === title.id));
    assert.equal(await page.locator('#inlineText').isVisible(), false);
    await page.locator('#selectTool').click(); await page.reload();
    assert.equal((await state()).layers.find(l => l.id === title.id).text, '点击框外完成编辑');
    assert.deepEqual(errors, []);
    console.log('PASS: built-in scenery removed; native double-click on text and blank text-frame space, text commit, history, zoom/pan, native selection, other-object selection and reload.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
