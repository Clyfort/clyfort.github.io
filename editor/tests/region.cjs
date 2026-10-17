const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.EDITOR_TEST_URL || 'http://127.0.0.1:8011/editor/');
    const state = async () => { await page.waitForTimeout(450); return page.evaluate(() => JSON.parse(localStorage.getItem('shiguang-studio-project-v1'))); };
    const pixel = (x, y) => page.locator('#artboard').evaluate((c, [x, y]) => [...c.getContext('2d').getImageData(x, y, 1, 1).data], [x, y]);
    const green = [40, 120, 80, 255], white = [255, 255, 255, 255];
    // A background swatch must always change the canvas, even while text is selected.
    const old = await state(); await page.locator('#assetPanel [data-background="#ffffff"]').click();
    let doc = await state(); assert.equal(doc.background, '#ffffff'); assert.equal(doc.layers[2].fill, old.layers[2].fill);
    await page.locator('#newProject').click(); await page.locator('#newBackground').fill('#112233'); await page.locator('#modalWhite').click();
    assert.equal(await page.locator('#newBackground').inputValue(), '#ffffff'); await page.locator('#confirmCanvas').click();
    const data = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 1000; const ctx = c.getContext('2d'); ctx.fillStyle = '#287850'; ctx.fillRect(0, 0, 800, 1000); return c.toDataURL().split(',')[1]; });
    await page.locator('#imageInput').setInputFiles({ name: 'green.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
    const draw = async (x1, y1, x2, y2) => {
      const r = await page.locator('#artboard').boundingBox(), z = r.width / 800;
      await page.mouse.move(r.x + x1*z, r.y + y1*z); await page.mouse.down();
      await page.mouse.move(r.x + x2*z, r.y + y2*z, { steps: 6 }); await page.mouse.up();
    };
    await page.locator('#regionTool').click(); await draw(100, 100, 300, 250);
    assert(await page.locator('#regionSelection').isVisible()); assert.deepEqual(await pixel(150, 150), green, 'selection alone does not alter pixels');
    await page.keyboard.press('Delete');
    assert.deepEqual(await pixel(150, 150), white); assert.deepEqual(await pixel(99, 150), green); assert.deepEqual(await pixel(300, 150), green);
    doc = await state(); assert.equal(doc.layers.length, 2); assert.equal(doc.layers[0].type, 'image');
    assert.equal(await page.locator('#regionSelection').isVisible(), false);
    await page.keyboard.press('Delete'); assert.equal((await state()).layers.length, 2, 'repeated Delete must not delete the image');
    await page.locator('#undo').click(); assert.deepEqual(await pixel(150, 150), green);
    await page.locator('#redo').click(); assert.deepEqual(await pixel(150, 150), white);
    // Cleared regions track a later background change.
    await page.locator('#assetPanel [data-background="#243d3b"]').click(); assert.deepEqual(await pixel(150, 150), [36, 61, 59, 255]);
    await page.locator('#assetPanel [data-background="#ffffff"]').click(); assert.deepEqual(await pixel(150, 150), white);
    // Zoomed, panned, reversed selection uses image coordinates.
    await page.locator('#zoomIn').click(); await page.locator('#viewport').hover(); await page.mouse.wheel(0, 25);
    await draw(550, 550, 400, 400); await page.keyboard.press('Backspace'); assert.deepEqual(await pixel(450, 450), white); assert.deepEqual(await pixel(399, 450), green);
    // Precise region fields and text input retain their native Delete behavior.
    await draw(600, 600, 700, 700); await page.locator('[data-region="w"]').fill('50'); await page.locator('[data-region="w"]').press('Tab');
    await page.locator('#documentName').focus(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    assert.equal((await state()).layers.length, 3);
    await page.locator('[data-action="fill-region"]').click(); assert.deepEqual(await pixel(625, 650), white); assert.deepEqual(await pixel(675, 650), green);
    // Project roundtrip and PNG export must contain the exact cleared colors.
    await page.locator('#projectMenu').click(); let waiting = page.waitForEvent('download'); await page.locator('#saveProject').click(); let file = await waiting;
    await page.locator('#projectInput').setInputFiles({ name: 'regions.figlyph', mimeType: 'application/json', buffer: require('node:fs').readFileSync(await file.path()) });
    assert.deepEqual(await pixel(150, 150), white); await page.reload(); await page.waitForTimeout(450); assert.deepEqual(await pixel(150, 150), white);
    await page.locator('#exportButton').click(); waiting = page.waitForEvent('download'); await page.locator('#downloadImage').click(); file = await waiting;
    const png = require('node:fs').readFileSync(await file.path());
    assert.equal(png.readUInt32BE(16), 800); assert.equal(png.readUInt32BE(20), 1000);
    const color = await page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,'+b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0); return [...ctx.getImageData(150, 150, 1, 1).data]; }, png.toString('base64'));
    assert.deepEqual(color, white);
    // Escape leaves content unchanged; normal object deletion is still available.
    await page.locator('#regionTool').click(); await draw(50, 50, 80, 80); await page.keyboard.press('Escape'); assert.equal(await page.locator('#regionSelection').isVisible(), false);
    await page.locator('#selectTool').click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); assert.equal((await state()).layers.length, 0);
    // Mobile drawer offers a visible action button without a hardware Delete key.
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#regionTool').click(); await draw(100, 100, 300, 300);
    await page.locator('#propertiesToggle').click(); await page.locator('[data-action="fill-region"]').click(); assert.equal((await state()).layers.length, 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []); console.log('PASS: white backgrounds, exact region pixel replacement, outside preservation, history, background tracking, zoom/reverse selection, precise fields, native text deletion, export/reload, normal selection, mobile action.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
