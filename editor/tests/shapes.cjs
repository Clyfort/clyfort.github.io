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
    assert((await page.title()).includes('图绎 Figlyph'));
    assert.equal(await page.locator('.brand-en').textContent(), 'FIGLYPH');
    await page.locator('#newProject').click(); await page.locator('#confirmCanvas').click();
    const point = async (x, y) => { const r = await page.locator('#artboard').boundingBox(); return { x: r.x + x * r.width / 800, y: r.y + y * r.height / 1000 }; };
    const draw = async (x1, y1, x2, y2, shift = false) => {
      const a = await point(x1, y1), b = await point(x2, y2);
      await page.mouse.move(a.x, a.y); await page.mouse.down(); if (shift) await page.keyboard.down('Shift');
      await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up(); if (shift) await page.keyboard.up('Shift');
    };
    const near = (a, b) => assert(Math.abs(a - b) < 1, `${a} should be near ${b}`);
    // Choosing a tool and clicking without a drag must never create a layer.
    await page.locator('[data-shape="rect"]').click(); assert.equal((await state()).layers.length, 0);
    let a = await point(100, 100); await page.mouse.click(a.x, a.y); assert.equal((await state()).layers.length, 0);
    assert.equal(await page.locator('[data-shape="rect"]').getAttribute('aria-pressed'), 'true');
    await draw(100, 120, 340, 270); let doc = await state(), l = doc.layers.at(-1);
    assert.equal(doc.layers.length, 1); near(l.x, 100); near(l.y, 120); near(l.w, 240); near(l.h, 150);
    assert(await page.locator('#selectTool').evaluate(el => el.classList.contains('active')));
    // Draw all supported basic shapes, including reverse direction and constrained proportions.
    await page.locator('[data-shape="roundrect"]').click(); await draw(600, 600, 400, 450); l = (await state()).layers.at(-1);
    near(l.x, 400); near(l.y, 450); near(l.w, 200); near(l.h, 150); assert(l.radius > 0);
    await page.locator('[data-shape="ellipse"]').click(); await draw(100, 350, 230, 400, true); l = (await state()).layers.at(-1); near(l.w, l.h); near(l.w, 130);
    await page.locator('[data-shape="triangle"]').click(); await draw(500, 300, 640, 430); assert.equal((await state()).layers.at(-1).shape, 'triangle');
    await page.locator('[data-shape="line"]').click(); await draw(100, 700, 400, 800); l = (await state()).layers.at(-1);
    near(l.w, Math.hypot(300, 100)); near(l.rotation, Math.atan2(100, 300) * 180 / Math.PI);
    await page.locator('[data-shape="arrow"]').click(); await draw(600, 800, 400, 600); l = (await state()).layers.at(-1); near(l.rotation, -135);
    assert.equal((await state()).layers.length, 6);
    // Preview is removable with Escape; pointer cancellation also leaves no orphan layer.
    await page.locator('[data-shape="rect"]').click(); a = await point(50, 50); let b = await point(150, 150);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.equal((await state()).layers.length, 6);
    await page.locator('[data-shape="rect"]').click(); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y);
    await page.locator('#viewport').dispatchEvent('pointercancel', { pointerId: 1, clientX: b.x, clientY: b.y }); await page.mouse.up(); assert.equal((await state()).layers.length, 6);
    // Undo/redo adds or removes exactly one completed drawing, not intermediate preview frames.
    await page.locator('[data-shape="rect"]').click(); await draw(30, 30, 80, 90);
    await page.locator('#undo').click(); assert.equal((await state()).layers.length, 6);
    await page.locator('#redo').click(); assert.equal((await state()).layers.length, 7);
    // Palette color applies to the next shape, not the canvas background.
    const background = (await state()).background;
    await page.locator('[data-shape="rect"]').click(); await page.locator('[data-color="#344c3e"]').click(); await draw(20, 250, 80, 300);
    doc = await state(); assert.equal(doc.background, background); assert.equal(doc.layers.at(-1).fill, '#344c3e');
    // Project names use the new extension; legacy files and existing browser storage still open.
    await page.locator('#projectMenu').click(); let wait = page.waitForEvent('download'); await page.locator('#saveProject').click(); let file = await wait;
    assert(file.suggestedFilename().endsWith('.figlyph')); const savedFile = await file.path();
    await page.locator('#projectInput').setInputFiles({ name: 'legacy.shiguang', mimeType: 'application/json', buffer: require('node:fs').readFileSync(savedFile) });
    assert.equal((await state()).layers.length, 8); await page.reload(); assert.equal((await state()).layers.length, 8);
    // Mobile tool drawer closes when a shape is armed; drawing still uses canvas coordinates.
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('[data-panel="elements"]').click(); await page.locator('[data-shape="ellipse"]').click();
    assert.equal(await page.locator('#assetPanel').isVisible(), false); await draw(200, 200, 350, 300);
    assert.equal((await state()).layers.length, 9); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS: tool arming, no click insertion, six drag-drawn shapes, reverse/Shift/diagonal drawing, Escape/pointercancel, one-step history, color, Figlyph naming, legacy files, reload and mobile drawing.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
