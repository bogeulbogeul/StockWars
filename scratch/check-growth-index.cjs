const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), output = path.resolve('output/sprout-growth-index-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : u.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.on('pageerror', e => errors.push(e.message));
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        const initial = await page.evaluate(async () => {
            const { marketEngine: engine } = await import('/js/engine/marketEngine.js');
            const { GROWTH_INDEX_MEMBERS } = await import('/js/data/growthIndex.js');
            engine.stopEngine();
            for (const m of GROWTH_INDEX_MEMBERS) {
                const stock = engine.stocks.get(m.id); stock.price = stock.prevPrice = m.basePrice;
            }
            engine.notify(false);
            const phone = window.stockWarsApp.phoneHome;
            phone.open(); phone.openApp('stock');
            const source = phone.stockApp.source;
            return { growth: source.getState().sproutIndex, leaf: source.getState().cipherIndex, originalLeaf: engine.getCipherIndex(), cash: engine.cash, portfolio: engine.portfolio.size };
        });
        assert.equal(initial.growth.val, '1000.00');
        assert.deepEqual(initial.leaf, initial.originalLeaf);
        assert.match(await page.locator('.stock-indices').textContent(), /새싹 성장지수1[,.]?000/);
        const updated = await page.evaluate(async () => {
            const { marketEngine: engine } = await import('/js/engine/marketEngine.js');
            const stock = engine.stocks.get('MOMOSOLUTION'); stock.price *= 1.1;
            engine.notify(false);
            return { index: window.stockWarsApp.phoneHome.stockApp.source.getState().sproutIndex, cash: engine.cash, portfolio: engine.portfolio.size };
        });
        assert.equal(updated.index.val, '1006.25');
        assert.equal(updated.cash, initial.cash); assert.equal(updated.portfolio, initial.portfolio);
        assert.match(await page.locator('.stock-indices').textContent(), /1006\.25/);
        assert.doesNotMatch(await page.locator('.stock-indices').textContent(), /구성 준비 중/);
        await page.screenshot({ path: path.join(output, prefix + '-growth.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(output, prefix + '-mobile.png') });
        const bounds = await page.locator('.stock-indices').boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= 390);
        await page.goto(base + '/?skipOpening=1');
        await page.waitForFunction(() => window.stockWarsExhibition?.view);
        const exhibition = await page.evaluate(() => {
            const e = window.stockWarsExhibition; e.arrival.stop();
            e.state.flags.phone = e.state.flags.certificate = true; e.view.sync(e.state);
            const before = JSON.stringify(e.state);
            e.view.openPhone(); e.view.phoneHome.openApp('stock');
            return { index: e.view.phoneHome.stockApp.source.getState().sproutIndex, unchanged: before === JSON.stringify(e.state) };
        });
        assert.equal(exhibition.index.val, '1000.00'); assert.equal(exhibition.unchanged, true);
        assert.match(await page.locator('.stock-indices').textContent(), /1000\.00/);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, prefix + '-checks.json'), JSON.stringify({ initial, updated, exhibition, errors }, null, 2));
        console.log(prefix + ' growth index checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
