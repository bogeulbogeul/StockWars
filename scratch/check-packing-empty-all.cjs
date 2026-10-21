const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(15000);
        await page.goto('http://127.0.0.1:8765/packing.html');
        const dialog = page.locator('.packing-game[open]');
        const reset = dialog.getByRole('button', { name: '모두 꺼내기', exact: true });
        assert.ok(await reset.isDisabled());
        const count = await dialog.locator('.packing-item-card').count();
        await dialog.locator('.packing-item-card').first().click();
        await dialog.locator('[data-x="0"][data-y="0"]').click();
        assert.equal(await dialog.locator('.packing-piece').count(), 1);
        assert.ok(await reset.isEnabled());
        await reset.click();
        assert.equal(await dialog.locator('.packing-piece').count(), 0);
        assert.equal(await dialog.locator('.packing-item-card').count(), count);
        assert.ok(await reset.isDisabled());
        assert.equal(await dialog.getByRole('button', { name: '다시 놓기', exact: true }).count(), 0);
        console.log('PASS: all-items removal, empty-state disabling, single button');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
