const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
for (const name of ['anna', 'agent-k', 'bongbong']) assert.equal(fs.existsSync(path.join(root, 'assets/characters/3d', name)), false);
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
        page.on('console', message => { if (message.type() === 'error') console.error('CONSOLE', message.text()); });
        page.on('response', r => { if (r.status() >= 400) { console.error('MISSING', r.url()); if (/\/assets\//.test(r.url())) errors.push(r.url()); } });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        console.log('PAGE LOADED', root);
        console.log('BOOT', await page.evaluate(() => ({ app: !!window.stockWarsApp, town: !!window.stockWarsApp?.townModelScene, state: window.stockWarsApp?.townModelScene?.player?.state, status: window.stockWarsApp?.townModelScene?.status?.textContent })));
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.player?.state === 'idle', null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true }); if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) { const skip = page.getByRole('button', { name: /건너뛰기/ }); if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); } }
        await page.evaluate(() => window.stockWarsApp.enterTown());
        await page.keyboard.press('2');
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.state), 'eat');
        await page.waitForFunction(() => window.stockWarsApp.townModelScene.player.state === 'idle', null, { timeout: 15000 });
        for (const [method, key] of [['enterOffice', 'homeModelScene'], ['enterVivianModel', 'vivianModelScene'], ['enterInformationModel', 'informationModelScene'], ['enterBankModel', 'bankModelScene']]) {
            await page.evaluate(m => window.stockWarsApp[m](), method);
            await page.evaluate(async key => { await window.stockWarsApp[key].ready; await window.stockWarsApp[key].player.ready; }, key);
            assert.equal(await page.evaluate(key => window.stockWarsApp[key].player.variants.size, key), 2);
            await page.keyboard.press('2');
            assert.equal(await page.evaluate(key => window.stockWarsApp[key].player.state, key), 'eat');
            assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.state), 'idle');
            await page.evaluate(key => window.stockWarsApp[key].exit(), key);
        }
        assert.deepEqual(errors, []);
        console.log('PASS standard town + four interiors: key 2, hidden-town input blocked, no errors/missing assets; root', root);
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
