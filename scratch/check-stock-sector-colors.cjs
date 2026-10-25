const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), output = path.resolve(process.argv[3] || 'output/phone-stock-2d-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : u.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        await page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js');
            e.stopEngine(); e.isTutorialActive = false; window.stockListenerBaseline = e.listeners.size;
            window.stockWarsApp.phoneHome.open(); window.stockWarsApp.phoneHome.openApp('stock');
        });
        const snap = async () => page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js');
            return { cash: e.cash, held: e.heldQuantity('CLOUDBERRY'), trades: e.tradeHistory.length, pending: e.limitOrders.length };
        });
        const screenshot = async name => page.screenshot({ path: path.join(output, `${prefix}-${name}.png`) });
        assert.match(await page.locator('.stock-indices').textContent(), /리프 종합지수[\s\S]*새싹 성장지수/);
        assert.equal(await page.locator('.stock-nav button').count(), 3);
        assert.doesNotMatch(await page.locator('.stock-nav').textContent(), /뉴스/);
        assert(await page.locator('.stock-summary > strong').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 35));
        assert(await page.locator('.stock-right > strong').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
        assert.equal(await page.locator('.stock-body .stock-brand svg').count(), 4);
        assert(await page.locator('.cozy-phone').evaluate(el => el.getBoundingClientRect().width > 1000));
        assert.equal(await page.locator('.stock-app').evaluate(el => getComputedStyle(el).display), 'grid');
        await screenshot('home');
        await page.locator('.stock-nav [data-tab="market"]').click();
        assert.equal(await page.locator('.stock-app [data-stock-list] .stock-row').count(), 72);
        await page.locator('.stock-app [data-search]').fill('CLOUDBERRY');
        assert.equal(await page.locator('.stock-app [data-stock-list] .stock-row').count(), 1);
        await page.locator('.stock-app [data-star="CLOUDBERRY"]').click();
        const favorite = await page.locator('.stock-app [data-star="CLOUDBERRY"]').getAttribute('aria-pressed');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('stockwars_favorites')).includes('CLOUDBERRY')), favorite === 'true');
        await page.locator('.stock-app [data-search]').fill('');
        await page.locator('.stock-app [data-sector="Energy"]').click();
        assert.equal(await page.locator('.stock-app [data-stock-list] .stock-row').count(), 9);
        await page.locator('.stock-app [data-sector="ALL"]').click();
        await page.locator('.stock-app [data-sort]').selectOption('PRICE');
        for (const key of ['IT', 'Entertainment', 'Infrastructure', 'Bio', 'Aerospace', 'Retail', 'Energy', 'Finance']) {
            const filter = page.locator('.stock-filters [data-sector="' + key + '"]');
            await filter.click();
            const color = await filter.evaluate(el => getComputedStyle(el).backgroundColor);
            assert.equal(await page.locator('[data-stock-list] .stock-brand').first().evaluate(el => getComputedStyle(el).backgroundColor), color);
            assert.equal(await filter.getAttribute('aria-pressed'), 'true');
        }
        await page.locator('.stock-filters [data-sector="ALL"]').click();
        await screenshot('market');
        fs.writeFileSync(path.join(output, `${prefix}-sector-colors.json`), JSON.stringify({ sectors: 8, iconButtonColorsMatch: true, selectedColorPreserved: true, errors }, null, 2));
        assert.deepEqual(errors, []);
        console.log(prefix + ' 8 sector colors passed');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
