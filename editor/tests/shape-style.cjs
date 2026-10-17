const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EDITOR_TEST_URL || 'http://127.0.0.1:8011/editor/');
    const state = async () => { await page.waitForTimeout(450); return page.evaluate(() => JSON.parse(localStorage.getItem('shiguang-studio-project-v1'))); };
    const pixel = (x, y) => page.locator('#artboard').evaluate((c, [x, y]) => [...c.getContext('2d').getImageData(x, y, 1, 1).data], [x, y]);
    const draw = async (shape, x1, y1, x2, y2) => {
      await page.locator(`[data-shape="${shape}"]`).click();
      const r = await page.locator('#artboard').boundingBox(), z = r.width / 800;
      await page.mouse.move(r.x + x1 * z, r.y + y1 * z); await page.mouse.down();
      await page.mouse.move(r.x + x2 * z, r.y + y2 * z, { steps: 6 }); await page.mouse.up();
    };
    await page.locator('#newProject').click(); await page.locator('#confirmCanvas').click();
    await draw('rect', 100, 100, 300, 250);
    let doc = await state(), layer = doc.layers[0];
    assert.equal(layer.stroke, '#000000'); assert.equal(layer.strokeWidth, 2); assert.equal(layer.fillEnabled, false);
    assert.deepEqual(await pixel(200, 175), [255, 255, 255, 255], 'hollow center must remain white');
    assert((await pixel(100, 175))[0] < 20, 'outline must actually render black');
    await page.locator('[data-prop="fillEnabled"]').check();
    assert((await pixel(200, 175))[0] < 20, 'enabling fill must fill the shape');
    await page.locator('[data-prop="fillEnabled"]').uncheck();
    assert.deepEqual(await pixel(200, 175), [255, 255, 255, 255]);
    await page.locator('[data-prop="stroke"]').fill('#d77552');
    assert((await pixel(100, 175))[0] > 100, 'outline color can be edited');
    for (const [i, shape] of ['roundrect', 'ellipse', 'triangle'].entries()) {
      await draw(shape, 100 + i * 200, 320, 260 + i * 200, 460);
      layer = (await state()).layers.at(-1);
      assert.equal(layer.fillEnabled, false); assert.equal(layer.stroke, '#000000');
    }
    await draw('arrow', 100, 600, 350, 600);
    layer = (await state()).layers.at(-1); assert.equal(layer.shape, 'arrow'); assert.equal(layer.fillEnabled, false);
    assert.deepEqual(await pixel(150, 600), [255, 255, 255, 255], 'block arrow shaft has an unfilled interior');
    await draw('lineArrow', 100, 800, 350, 800);
    layer = (await state()).layers.at(-1); assert.equal(layer.shape, 'lineArrow'); assert.equal(layer.stroke, '#000000');
    assert((await pixel(200, 800))[0] < 20, 'line arrow shaft is a single black line');
    assert((await pixel(330, 780))[0] < 100, 'upper V arm renders');
    assert((await pixel(330, 820))[0] < 100, 'lower V arm renders');
    assert.deepEqual(await pixel(330, 790), [255, 255, 255, 255], 'V arrowhead is open');
    await draw('lineArrow', 650, 800, 450, 600);
    layer = (await state()).layers.at(-1); assert(Math.abs(layer.rotation + 135) < 1);
    const wait = page.waitForEvent('download'); await page.locator('#projectMenu').click(); await page.locator('#saveProject').click();
    const file = await wait, content = require('node:fs').readFileSync(await file.path());
    await page.locator('#projectInput').setInputFiles({ name: 'arrows.figlyph', mimeType: 'application/json', buffer: content });
    assert.equal((await state()).layers.at(-1).shape, 'lineArrow'); await page.reload(); assert.equal((await state()).layers.at(-1).shape, 'lineArrow');
    // Projects created before fillEnabled existed retain their filled appearance.
    doc = await state(); doc.layers = [doc.layers[0]]; delete doc.layers[0].fillEnabled;
    await page.locator('#projectInput').setInputFiles({ name: 'legacy.figlyph', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
    await page.waitForTimeout(500); assert((await pixel(200, 175))[0] < 20);
    assert.deepEqual(errors, []);
    console.log('PASS: black hollow defaults, pixel-verified outline/fill toggle, both arrow geometries, diagonal line arrow, project roundtrip/reload, legacy fill compatibility.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
