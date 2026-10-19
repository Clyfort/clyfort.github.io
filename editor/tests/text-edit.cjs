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
    assert.equal(await page.locator('#inlineText').evaluate(() => window.getSelection().toString().length), '点击框外完成编辑'.length);
    await page.locator('#inlineText').press('Escape');
    // Box selection mode must not accidentally start text editing.
    await page.locator('#marqueeTool').click(); document = await state(); await doubleClick(document.layers.find(l => l.id === title.id));
    assert.equal(await page.locator('#inlineText').isVisible(), false);
    await page.locator('#selectTool').click(); await page.reload();
    assert.equal((await state()).layers.find(l => l.id === title.id).text, '点击框外完成编辑');
    // Pixel regression: the old canvas glyphs must disappear behind the live editor.
    await page.locator('#newProject').click(); await page.locator('#confirmCanvas').click();
    await page.locator('[data-panel="elements"]').click(); await page.locator('[data-action="add-text"]').click();
    const placement = await page.locator('#artboard').boundingBox();
    await page.locator('#artboard').click({ position: { x: 120*placement.width/800, y: 380*placement.height/1000 } });
    await page.locator('#inlineText').press('Control+Enter');
    const ink = (x = 0, y = 0, w = 800, h = 1000) => page.locator('#artboard').evaluate((c, [x, y, w, h]) => {
      const d = c.getContext('2d').getImageData(x, y, w, h).data;
      let count = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 240 || d[i+1] < 240 || d[i+2] < 240) count++;
      return count;
    }, [x, y, w, h]);
    document = await state(); let single = document.layers[0];
    assert(await ink(300, 350, 350, 200) > 0, 'long original text actually has pixels to the right');
    await doubleClick(single); assert(await page.locator('#inlineText').isVisible());
    assert.equal(await ink(), 0, 'canvas stops painting the active text immediately');
    await page.locator('#inlineText').fill('你好'); assert.equal(await ink(), 0, 'old glyphs stay hidden when replacement text is shorter');
    await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
    assert.equal(await ink(), 0, 'font redraw does not resurrect the old glyphs');
    await page.locator('#inlineText').press('Control+Enter');
    assert(await ink() > 0, 'new text renders when editing ends');
    assert.equal(await ink(300, 350, 350, 200), 0, 'no residual old text to the right after commit');
    assert.equal((await state()).layers[0].visible, true, 'editing never changes the saved visibility');
    await page.locator('#undo').click(); assert(await ink(300, 350, 350, 200) > 0);
    await page.locator('#redo').click(); assert.equal(await ink(300, 350, 350, 200), 0);
    document = await state(); single = document.layers[0]; await doubleClick(single);
    await page.locator('#inlineText').fill(''); await page.locator('#inlineText').press('Control+Enter');
    assert.equal(await ink(), 0, 'empty text does not restore the old content');
    assert.equal((await state()).layers.length, 0, 'empty text frame is deleted and autosaved');
    await page.locator('#undo').click(); assert.equal((await state()).layers[0].text, '你好');
    await page.locator('#redo').click(); assert.equal((await state()).layers.length, 0);
    await page.reload(); assert.equal((await state()).layers.length, 0); assert.equal(await ink(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: built-in scenery removed; native double-click on text and blank text-frame space, text commit, history, zoom/pan, native selection, other-object selection, reload and pixel-verified removal of old glyphs during editing.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
