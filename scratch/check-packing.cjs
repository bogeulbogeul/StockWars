const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/packing.html');
    await page.locator('.packing-game[open]').waitFor();
    await page.evaluate(async () => {
        document.querySelector('dialog').close();
        const { PackingGame } = await import('/js/components/packing/PackingGame.js');
        const { createOrder } = await import('/js/components/packing/PackingData.js');
        window.testPacking = new PackingGame();
        window.testPacking.session = { orders: [3, 6, 0, 7, 8].map(i => createOrder(i)), completed: 0, awaitingNext: false };
        window.testPacking.open();
    });
    const dialog = page.locator('.packing-game[open]');
    async function drag(id, x, y) {
        const item = await page.evaluate(id => window.testPacking.order.items.find(i => i.id === id), id);
        const actualId = await page.evaluate(item => {
            const game = window.testPacking;
            return [...game.dialog.querySelectorAll('.packing-item-card')].map(e => e.dataset.item)
                .find(id => { const other = game.order.items.find(i => i.id === id); return other.art === item.art && other.rotated === item.rotated; }) || item.id;
        }, item);
        const button = dialog.locator(`[data-item="${actualId}"]`);
        const source = await button.locator('.packing-art').boundingBox();
        const grid = await dialog.locator('.packing-grid').boundingBox();
        const width = await page.evaluate(() => window.testPacking.order.width);
        const rotated = item.rotated;
        const w = rotated ? item.height : item.width, h = rotated ? item.width : item.height;
        const cell = grid.width / width;
        await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
        await page.mouse.down();
        await page.mouse.move(grid.x + (x + w / 2) * cell, grid.y + (y + h / 2) * cell, { steps: 7 });
        await page.keyboard.press('r'); // Retired shortcut must not change a held item.
        assert.equal(await page.evaluate(id => window.testPacking.order.items.find(i => i.id === id).rotated, id), rotated);
        await page.mouse.up();
        return actualId;
    }
    await drag('A', 0, 0);
    await drag('B', 0, 0);
    assert.equal(await page.evaluate(() => window.testPacking.order.items.find(i => i.id === 'B').x), null);
    await page.screenshot({ path: 'output/packing-ui-v1/desktop.png', fullPage: true });
    assert.equal(await dialog.locator('[data-action="finish"]').isDisabled(), true);
    assert.equal(await dialog.locator('[data-action="rotate"]').count(), 0);
    // Complete each authored arrangement by dragging its supplied orientations.
    const patterns = await page.evaluate(async () => (await import('/js/components/packing/PackingData.js')).PACKING_PATTERNS);
    for (let turn = 0; turn < 5; turn++) {
        const order = await page.evaluate(() => window.testPacking.order);
        const rows = patterns[order.patternIndex];
        for (const item of order.items) {
            if (item.x !== null) continue;
            const points = [];
            rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === item.id) points.push({ x, y }); }));
            const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
            const w = Math.max(...points.map(p => p.x)) - x + 1;
            assert.equal(item.rotated ? item.height : item.width, w);
            const actualId = await drag(item.id, x, y);
            assert.ok(await page.evaluate(({id,x,y}) => { const item=window.testPacking.order.items.find(i => i.id === id); return item.x===x && item.y===y; }, {id:actualId,x,y}));
        }
        await dialog.locator('[data-action="finish"]').click();
        assert.equal(await page.evaluate(() => window.testPacking.session.completed), turn + 1);
        if (turn < 4) await dialog.locator('[data-action="next"]').click();
    }
    await page.screenshot({ path: 'output/packing-ui-v1/completed.png', fullPage: true });
    await dialog.locator('[data-action="restart"]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.testPacking.isOpen), false);
    await page.evaluate(() => window.testPacking.open());
    assert.equal(await page.evaluate(() => window.testPacking.session.completed), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
        const { createOrder } = await import('/js/components/packing/PackingData.js');
        window.testPacking.session = { orders: [createOrder(7)], completed: 0, awaitingNext: false };
        window.testPacking.selected = null;
        window.testPacking.render();
    });
    // Actual touch pointer stream, including cancellation and subsequent recovery.
    const cdp = await page.context().newCDPSession(page);
    const touchSource = await dialog.locator('[data-item="A"] .packing-art').boundingBox();
    const touchGrid = await dialog.locator('.packing-grid').boundingBox();
    const touchCell = touchGrid.width / 4;
    const point = (x, y) => [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(touchSource.x + touchSource.width / 2, touchSource.y + touchSource.height / 2) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.equal(await page.evaluate(() => window.testPacking.input.drag), null);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(touchSource.x + touchSource.width / 2, touchSource.y + touchSource.height / 2) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(touchGrid.x + touchCell, touchGrid.y + touchCell) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await page.evaluate(() => window.testPacking.order.items.find(i => i.id === 'A').x), 0);
    await page.screenshot({ path: 'output/packing-ui-v1/mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.querySelector('.packing-game[open]').scrollWidth <= innerWidth));
    fs.writeFileSync('output/packing-ui-v1/browser-result.json', JSON.stringify({ errors, completedOrders: 5, fixedOrientationDrag: true, rotationShortcutRemoved: true, touchDragAndCancel: true, mobileWidth: 390 }, null, 2));
    assert.deepEqual(errors, []);
    await browser.close();
    console.log('PASS: five orders without rotation, retired R key, overlap, completion, replay, close/reopen, touch');
})().catch(e => { console.error(e); process.exit(1); });
