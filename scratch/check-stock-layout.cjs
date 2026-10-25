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
        assert(await page.locator('.cozy-phone').evaluate(el => el.getBoundingClientRect().height <= 700));
        assert(await page.locator('.stock-body').evaluate(el => el.scrollHeight <= el.clientHeight + 1), 'home contents should fit');
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
        await page.locator('.stock-app [data-search]').fill('CLOUDBERRY');
        await page.locator('.stock-app [data-stock="CLOUDBERRY"]').click();
        assert.equal(await page.locator('.stock-chart').count(), 1);
        await page.locator('.stock-app [data-period="1M"]').click();
        await page.locator('.stock-app [data-expand]').click();
        await page.locator('.stock-chart').hover();
        assert.match(await page.locator('.stock-detail-content output').textContent(), /잎/);
        assert.equal(await page.locator('.stock-chart--expanded').count(), 1);
        await page.locator('.stock-app [data-expand]').click();
        assert(await page.locator('.cozy-phone').evaluate(el => el.getBoundingClientRect().height <= 760));
        await screenshot('chart');
        assert(await page.locator('.stock-detail-content').evaluate(el => el.scrollHeight <= el.clientHeight + 1), 'chart and book should fit ' + await page.locator('.stock-detail-content').evaluate(el => JSON.stringify({height:el.clientHeight,scroll:el.scrollHeight})));
        await screenshot('chart');
        await page.locator('.stock-subtabs [data-subtab="info"]').click();
        assert.equal(await page.locator('.stock-info-grid > div').count(), 8);
        await screenshot('info');
        await page.locator('.cozy-phone__back').click();
        await page.locator('[data-phone-app="stock"]').click();
        await page.locator('.stock-app [data-stock="CLOUDBERRY"]').first().click();
        await page.locator('.stock-subtabs [data-subtab="order"]').click();
        assert.equal(await page.locator('.stock-app [data-mode="short"]').isDisabled(), true);
        assert.equal(await page.locator('.stock-app [data-leverage="2"]').isDisabled(), true);
        const before = await snap();
        await page.locator('.stock-app [data-qty]').fill('0');
        assert.equal(await page.locator('.stock-app [data-execute="buy"]').isDisabled(), true);
        await page.locator('.stock-app [data-qty]').fill('1');
        const preview = await page.evaluate(() => window.stockWarsApp.phoneHome.stockApp.source.preview('buy', 'CLOUDBERRY', 1, 1, null));
        await page.locator('.stock-app [data-execute="buy"]').click();
        const bought = await snap();
        assert.equal(bought.held, before.held + 1);
        assert.equal(bought.cash, before.cash - preview.total);
        assert.equal(bought.trades, before.trades + 1);
        await page.locator('.stock-subtabs [data-subtab="chart"]').click();
        await page.locator('.stock-subtabs [data-subtab="order"]').click();
        assert.equal(await page.locator('.stock-detail-content').evaluate(el => el.scrollTop), 0);
        const pane = await page.locator('.stock-detail-content').boundingBox();
        for (const selector of ['[data-mode="long"]', '[data-type]', '[data-qty]', '[data-execute="buy"]', '[data-execute="sell"]']) {
            const rect = await page.locator('.stock-app ' + selector).boundingBox();
            assert(rect.y >= pane.y && rect.y + rect.height <= pane.y + pane.height, selector + ' clipped');
        }
        await screenshot('order');
        for (const size of [{width: 1000, height: 760}, {width: 1920, height: 1080}]) {
            await page.setViewportSize(size);
            await page.locator('.stock-subtabs [data-subtab="chart"]').click();
            await page.locator('.stock-subtabs [data-subtab="order"]').click();
            await screenshot('order-' + size.width);
            const bounds = await page.locator('.stock-detail-content').boundingBox();
            for (const selector of ['[data-mode="long"]', '[data-qty]', '[data-execute="buy"]', '[data-execute="sell"]']) {
                const box = await page.locator('.stock-app ' + selector).boundingBox();
                assert(box.y >= bounds.y && box.y + box.height <= bounds.y + bounds.height, selector + ' clipped at ' + size.width + JSON.stringify({box,bounds}));
            }
            await screenshot('order-' + size.width);
        }
        await page.setViewportSize({width:1280,height:900});

        await page.locator('.stock-app [data-execute="sell"]').click();
        assert.equal((await snap()).held, before.held);
        await page.locator('.stock-app [data-type]').selectOption('limit');
        await page.locator('.stock-app [data-price]').fill('1');
        await page.locator('.stock-app [data-execute="buy"]').click();
        assert.equal((await snap()).pending, 1);
        await page.locator('.stock-app [data-cancel]').click();
        assert.equal((await snap()).pending, 0);
        await page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js');
            e.isLevel10Unlocked = true; e.notify(false);
        });
        assert.equal(await page.locator('.stock-app [data-mode="short"]').isDisabled(), false);
        await page.locator('.stock-app [data-leverage="2"]').click();
        assert.equal(await page.locator('.stock-app [data-leverage="2"]').getAttribute('aria-pressed'), 'true');
        await page.locator('.stock-app [data-list-back]').click();
        await page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js');
            for (const id of ['CLOUDBERRY', 'COZYPAY', 'ECOBATTERY']) e.buyStock(id, 1);
        });
        await page.locator('.stock-nav [data-tab="account"]').click();
        assert.equal(await page.locator('.stock-holding-title .stock-brand').count(), 3);
        await page.locator('.stock-history summary').click();
        assert.match(await page.locator('.stock-history').textContent(), /체결|매수/);
        await page.locator('.stock-history summary').click();
        assert(await page.locator('.cozy-phone').evaluate(el => el.getBoundingClientRect().height < 850), 'account should shrink to contents');
        assert.doesNotMatch(await page.locator('.stock-body').textContent(), /종목 보유 슬롯/);
        await screenshot('account');
        await page.locator('.stock-body').evaluate(el => { el.scrollTop = 0; });
        assert(await page.locator('.stock-body').evaluate(el => el.scrollHeight <= el.clientHeight + 1), 'collapsed account fits');
        assert.doesNotMatch(await page.locator('.stock-body').textContent(), /종목 보유 슬롯/);
        await screenshot('account');
        await page.locator('.stock-history summary').click();
        const expandedAccount = await page.locator('.cozy-phone').boundingBox();
        assert(expandedAccount.y >= 0 && expandedAccount.y + expandedAccount.height <= 900, 'expanded history stays inside viewport');
        await screenshot('account-history');
        for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
            await page.setViewportSize(size);
            await page.locator('.stock-nav [data-tab="market"]').click();
            await page.locator('.stock-app [data-search]').fill('CLOUDBERRY');
            const row = page.locator('.stock-app [data-stock="CLOUDBERRY"]');
            const textBox = await row.locator('.stock-company').boundingBox();
            const priceBox = await row.locator('.stock-right').boundingBox();
            assert(textBox.x + textBox.width <= priceBox.x + 1, 'company text overlaps price');
            await page.locator('.stock-app [data-stock="CLOUDBERRY"]').click();
            await page.locator('.stock-subtabs [data-subtab="order"]').click();
            await page.locator('.stock-app [data-execute="buy"]').scrollIntoViewIfNeeded();
            assert.equal(await page.locator('.stock-app [data-execute="buy"]').isVisible(), true);
            const dialog = await page.locator('.cozy-phone').boundingBox();
            assert(dialog.x >= 0 && dialog.y >= 0 && dialog.x + dialog.width <= size.width && dialog.y + dialog.height <= size.height);
            await screenshot(`order-${size.width}`);
            await page.locator('.stock-app [data-list-back]').scrollIntoViewIfNeeded();
            await page.locator('.stock-app [data-list-back]').click();
        }
        await page.keyboard.press('Escape');
        await page.waitForFunction(async () => { const { marketEngine: e } = await import('/js/engine/marketEngine.js'); return e.listeners.size === window.stockListenerBaseline; });
        assert.deepEqual(errors, []);
        console.log(prefix + ' desktop layout, sector colors, trading and mobile checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
