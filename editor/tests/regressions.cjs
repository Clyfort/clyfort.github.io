// Run against the HTTP development server. Requires Playwright and Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.EDITOR_TEST_URL || 'http://127.0.0.1:8011/editor/';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForTimeout(600);
    const state = async () => {
      await page.waitForTimeout(450);
      return page.evaluate(() => JSON.parse(localStorage.getItem('shiguang-studio-project-v1')));
    };
    const original = await state();
    const text = structuredClone(original.layers.find(layer => layer.type === 'text'));
    const fixture = { ...original, width: 1000, height: 1000, background: '#ffffff', fonts: [], layers: [text] };
    Object.assign(text, { x: 100, y: 100, w: 650, h: 10, text: '写下你的灵感\nÁgjf pq', fontSize: 94, fill: '#000000', stroke: '#000000', strokeWidth: 2, opacity: 1, shadow: 0, rotation: 0, bold: false, italic: true, underline: true, strike: true, lineHeight: .6, letterSpacing: -2, charStyles: { 0: { fontSize: 130, italic: true } } });
    const open = async document => {
      await page.locator('#projectInput').setInputFiles({ name: 'regression.shiguang', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
      await page.waitForTimeout(600);
    };
    const inkBounds = () => page.locator('#artboard').evaluate(canvas => {
      const { width, height } = canvas;
      const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      return { minX, minY, maxX, maxY };
    });
    const assertTextContained = async label => {
      const layer = (await state()).layers[0], ink = await inkBounds();
      assert(ink.maxX >= 0, `${label}: text actually rendered`);
      assert(ink.minX >= layer.x - 1, `${label}: left overflow ${JSON.stringify({ layer, ink })}`);
      assert(ink.minY >= layer.y - 1, `${label}: top overflow`);
      assert(ink.maxX <= layer.x + layer.w + 1, `${label}: right overflow`);
      assert(ink.maxY <= layer.y + layer.h + 1, `${label}: bottom overflow`);
    };
    for (const family of ['Noto Local', 'serif', 'Satoshi', 'monospace', 'DengXian', 'Microsoft YaHei']) {
      text.fontFamily = family;
      await open(fixture);
      await assertTextContained(family);
    }
    // Width edits, font edits, and corner dragging must all update actual text bounds.
    await page.locator('#selectTool').click();
    await page.keyboard.press('Control+a');
    await page.locator('[data-prop="w"]').fill('180');
    await page.locator('[data-prop="w"]').press('Tab');
    await assertTextContained('narrow text wrapping');
    let handle = await page.locator('[data-handle="se"]').boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down(); await page.mouse.move(handle.x + 80, handle.y + 45, { steps: 8 }); await page.mouse.up();
    await assertTextContained('text corner resize');
    // Marquee starts over content or old resize handles and works at non-default zoom and pan.
    text.fontFamily = 'Noto Local'; text.w = 650; text.h = 10;
    await open(fixture);
    await page.locator('#selectTool').click(); await page.keyboard.press('Control+a');
    await page.locator('#zoomIn').click();
    await page.locator('#viewport').hover(); await page.mouse.wheel(0, 25);
    await page.locator('#marqueeTool').click();
    const draw = async (x1, y1, x2, y2) => {
      const box = await page.locator('#artboard').boundingBox(), z = box.width / 1000;
      await page.mouse.move(box.x + x1 * z, box.y + y1 * z);
      await page.mouse.down(); await page.mouse.move(box.x + x2 * z, box.y + y2 * z, { steps: 8 });
      assert(await page.locator('#marqueeSelection').isVisible(), 'marquee rectangle visible during drag');
      await page.mouse.up();
      assert.equal(await page.locator('#marqueeSelection').isVisible(), false);
    };
    await draw(100, 100, 260, 250);
    assert(await page.locator('#selectionBox').isVisible(), 'partial text-frame intersection selects text');
    await page.locator('#marqueeMode').selectOption('contain');
    await draw(260, 250, 100, 100);
    assert.equal(await page.locator('#selectionBox').isVisible(), false, 'containment mode excludes partial text box');
    const layer = (await state()).layers[0];
    await draw(90, 90, layer.x + layer.w + 10, layer.y + layer.h + 10);
    assert(await page.locator('#selectionBox').isVisible(), 'containment mode selects fully enclosed text');
    // Intersecting two shapes must select both and retain group actions.
    const shape = original.layers.find(l => l.type === 'shape');
    const shapes = [100, 300].map((x, i) => ({ ...structuredClone(shape), id: `shape-${i}`, x, y: 100, w: 100, h: 100, rotation: 0, shape: 'rect', locked: false, visible: true }));
    await open({ ...fixture, layers: shapes });
    await page.locator('#marqueeTool').click();
    await page.locator('#marqueeMode').selectOption('intersect');
    await draw(110, 110, 390, 190);
    assert.equal(await page.locator('#inspector .inspector-header span').textContent(), '2 个元素');
    await page.locator('#selectTool').click(); await page.keyboard.press('Control+d');
    assert.equal((await state()).layers.length, 4);
    await page.locator('#undo').click(); assert.equal((await state()).layers.length, 2);
    await page.locator('#redo').click(); await page.keyboard.press('Delete');
    assert.equal((await state()).layers.length, 2);
    // Original image sizes are retained; blank canvases match, occupied canvases expand without losing layers.
    const imageFile = async (w, h) => ({ name: `image-${w}x${h}.png`, mimeType: 'image/png', buffer: Buffer.from(await page.evaluate(([w, h]) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#58a075'; ctx.fillRect(0, 0, w, h);
      return c.toDataURL('image/png').split(',')[1];
    }, [w, h]), 'base64') });
    await page.locator('#newProject').click(); await page.locator('#confirmCanvas').click();
    await page.locator('#imageInput').setInputFiles(await imageFile(713, 487));
    let document = await state();
    assert.deepEqual([document.width, document.height, document.layers[0].w, document.layers[0].h, document.layers[0].x, document.layers[0].y], [713, 487, 713, 487, 0, 0]);
    await page.locator('#imageInput').setInputFiles(await imageFile(4200, 2100));
    document = await state();
    assert.equal(document.layers.length, 2);
    assert.deepEqual([document.width, document.height, document.layers[1].w, document.layers[1].h], [4200, 2100, 4200, 2100]);
    // Export dimensions must match original-resolution canvas, not the zoomed preview.
    await page.locator('#exportButton').click();
    const download = page.waitForEvent('download'); await page.locator('#downloadImage').click();
    const exported = await download; const path = await exported.path();
    const png = require('node:fs').readFileSync(path);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [4200, 2100]);
    await page.reload(); await page.waitForTimeout(600);
    document = await state(); assert.equal(document.width, 4200); assert.equal(document.layers[1].w, 4200);
    assert.deepEqual(errors, []);
    console.log('PASS: text pixel bounds across six fonts, rich italic text, wrapping and resize; zoomed/panned marquee with intersection and containment; original-size image import, canvas expansion, export and reload.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
