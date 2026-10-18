const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || process.env.CHECK_GAME_ROOT || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8099, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto('http://127.0.0.1:8099/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount >= 20, null, { timeout: 90000 });
        const save = await page.evaluate(() => JSON.stringify(localStorage));
        await page.keyboard.press('l');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene?.player?.state === 'idle', null, { timeout: 90000 });
        await page.keyboard.press('f');
        assert.equal(await page.locator('dialog[open]').count(), 0, 'F away from doors must do nothing');
        for (const [id, x, selector] of [['training', -450, '[data-close]'], ['competition', 450, '[data-exit]']]) {
            for (const closeWith of ['button', 'Escape']) {
                await page.evaluate(({x}) => {
                    const s = window.stockWarsApp.cipherLobbyScene;
                    s.controller.charPosX = x;
                    s.controller.charPosY = -100 * Math.sin(26 * Math.PI / 180);
                }, {x});
                await page.waitForTimeout(100);
                await page.keyboard.press('f');
                const dialog = id === 'training' ? page.locator('.cipher-training:not(.cipher-arena)').first() : page.locator('.cipher-arena');
                await dialog.waitFor({state:'visible'});
                assert.equal(await page.locator('dialog[open]').count(), 1);
                if (id === 'training') {
                    await dialog.locator('[type=search]').fill('');
                    await dialog.locator('[type=search]').pressSequentially('test');
                    assert.equal(await dialog.locator('[type=search]').inputValue(), 'test');
                    await dialog.locator('[type=search]').fill('');
                }
                await page.keyboard.down('w');
                await page.waitForTimeout(150);
                await page.keyboard.up('w');
                assert.deepEqual(await page.evaluate(() => {
                    const c = window.stockWarsApp.cipherLobbyScene.controller;
                    return [c.charPosX, Math.round(c.charPosY / Math.sin(26 * Math.PI / 180))];
                }), [x, -100]);
                if(closeWith === 'button') await dialog.locator(selector).click();
                else await page.keyboard.press('Escape');
                await dialog.waitFor({state:'hidden'});
                await page.waitForTimeout(100);
                assert(await page.locator('#cipherLobbyStage').isVisible());
                assert.equal(await page.evaluate(() => document.body.classList.contains('cipher-facility-active')), false);
                assert.equal(await page.evaluate(() => document.activeElement.id), 'cipherLobbyStage');
                assert.equal(await page.evaluate(() => window.stockWarsApp.cipherLobbyScene.active), true);
                assert.deepEqual(await page.evaluate(() => {
                    const c = window.stockWarsApp.cipherLobbyScene.controller;
                    return [c.charPosX, Math.round(c.charPosY / Math.sin(26 * Math.PI / 180))];
                }), [x,-100]);
            }
        }
        await page.screenshot({path:'scratch/cipher-lobby-return-from-rooms.png'});
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.cipherLobbyScene.active);
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), save);
        assert.deepEqual(errors, []);
        console.log('PASS: F proximity, both rooms visible, typing, movement blocked in rooms, button/Esc return to door, focus restored, repeated entry, town exit, saves unchanged, no console errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
