const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
        const errors = [], missing = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => { if (r.status() >= 400 && /packing/i.test(r.url())) missing.push(r.url()); });
        await page.goto('http://127.0.0.1:8765/?scene=packing', { waitUntil: 'domcontentloaded' });
        await page.locator('.packing-game[open]').waitFor({ timeout: 60000 });
        const state = await page.evaluate(async () => {
            const app = window.stockWarsApp;
            const { marketEngine } = await import('/js/engine/marketEngine.js');
            return { cash: marketEngine.cash, inventory: JSON.stringify(app.itemEngine.state.inventory),
                stamina: JSON.stringify(app.mainHUD.stamina), blocked: app.townStage.callbacks.isInputBlocked() };
        });
        assert.equal(state.blocked, true);
        assert.ok(await page.locator('.packing-game[open]').isVisible());
        const art = await page.locator('.packing-game[open] image').first().evaluate(el => getComputedStyle(el).opacity);
        assert.equal(art, '1');
        await page.keyboard.press('Escape');
        await page.evaluate(() => {
            const player = window.stockWarsApp.townStage.playerController;
            player.charPosX = 2070; player.charPosY = 1110;
        });
        await page.locator('.packing-entry-hint').waitFor({ state: 'visible' });
        await page.locator('.packing-entry-hint').click();
        assert.ok(await page.locator('.packing-game[open]').isVisible());
        await page.keyboard.press('Escape');
        await page.keyboard.press('f');
        assert.ok(await page.locator('.packing-game[open]').isVisible());
        const playerBefore = await page.evaluate(() => ({ x: window.stockWarsApp.townStage.playerController.charPosX, y: window.stockWarsApp.townStage.playerController.charPosY }));
        await page.keyboard.press('w'); await page.keyboard.press('l');
        const playerAfter = await page.evaluate(() => ({ x: window.stockWarsApp.townStage.playerController.charPosX, y: window.stockWarsApp.townStage.playerController.charPosY }));
        assert.deepEqual(playerAfter, playerBefore);
        // Keyboard-only alternative: select and place, with supplied orientation.
        const game = page.locator('.packing-game[open]');
        const first = game.locator('[data-item]').first();
        const id = await first.getAttribute('data-item');
        await first.focus(); await page.keyboard.press('Enter');
        await game.locator('[data-x="0"][data-y="0"]').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(id => window.stockWarsApp.packingGame.order.items.find(i => i.id === id).x, id), 0);
        await page.keyboard.press('Escape'); await page.keyboard.press('f');
        assert.equal(await page.evaluate(id => window.stockWarsApp.packingGame.order.items.find(i => i.id === id).x, id), 0);
        // Main game uses root CSS zoom. Drag geometry and the preview must still agree.
        await game.locator('[data-action="reset"]').click();
        const source = await game.locator('[data-item="A"] .packing-art').boundingBox();
        const grid = await game.locator('.packing-grid').boundingBox();
        const columns = await page.evaluate(() => window.stockWarsApp.packingGame.order.width);
        const cellSize = grid.width / columns;
        await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
        await page.mouse.down();
        await page.mouse.move(grid.x + cellSize, grid.y + cellSize, { steps: 6 });
        const preview = await game.locator('.packing-preview').boundingBox();
        assert.ok(Math.abs(preview.x - grid.x) < 2);
        assert.ok(Math.abs(preview.width - cellSize * 2) < 2);
        const ghost = await game.locator('.packing-ghost').boundingBox();
        assert.ok(Math.abs(ghost.x - grid.x) < 2);
        await page.mouse.up();
        assert.equal(await page.evaluate(() => window.stockWarsApp.packingGame.order.items.find(i => i.id === 'A').x), 0);
        await page.screenshot({ path: 'output/packing-ui-v1/in-game.png' });
        const after = await page.evaluate(async () => {
            const app = window.stockWarsApp;
            const { marketEngine } = await import('/js/engine/marketEngine.js');
            return { cash: marketEngine.cash, inventory: JSON.stringify(app.itemEngine.state.inventory),
                stamina: JSON.stringify(app.mainHUD.stamina), blocked: app.townStage.callbacks.isInputBlocked() };
        });
        assert.deepEqual(after, state);
        await page.keyboard.press('Escape');
        // The ordinary shop keeps its purchasing path and offers packing separately.
        await page.evaluate(() => { document.body.classList.remove('ui-paused'); window.stockWarsApp.openVivianStore(); });
        await page.locator('.packing-store-button').click();
        assert.ok(await page.locator('.packing-game[open]').isVisible());
        assert.deepEqual(missing, []);
        fs.writeFileSync('output/packing-ui-v1/integration-result.json', JSON.stringify({ errors, missing, entry: ['query', 'button', 'F', 'normal shop'], worldInputBlocked: true, keyboard: true, economyUnchanged: true }, null, 2));
        assert.deepEqual(errors, []);
        console.log('PASS: game integration, entrances, keyboard, world input blocked, economy unchanged');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
