const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/news-app-game-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
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
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        const before = await page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js'); e.stopEngine();
            const before = { cash: e.cash, positions: e.portfolio.size, listeners: e.listeners.size };
            window.stockWarsApp.phoneHome.open(); window.stockWarsApp.phoneHome.openApp('news'); return before;
        });
        assert.equal(await page.locator('.news-list-card').count(), 288);
        await page.screenshot({ path: path.join(out, prefix + '-list.png') });
        await page.locator('.stock-news [data-news-sector="Energy"]').click();
        assert.equal(await page.locator('.news-list-card').count(), 36);
        await page.locator('.stock-news [data-news-sector="ALL"]').click();
        await page.locator('.stock-news [data-news-search]').fill('CLOUDBERRY');
        assert.equal(await page.locator('.news-list-card').count(), 4);
        await page.locator('.stock-news [data-news-search]').fill('없음123');
        assert.equal(await page.locator('.news-list-card').count(), 0);
        await page.locator('.stock-news [data-news-search]').fill('');
        await page.locator('.stock-news [data-news-id="CN_CLOUDBERRY_P2"]').click();
        assert.equal(await page.locator('.news-reader > p').count(), 3);
        assert.match(await page.locator('.news-byline').textContent(), /기업 발표/);
        await page.screenshot({ path: path.join(out, prefix + '-article.png') });
        await page.locator('.stock-news [data-news-back]').click();
        assert.equal(await page.locator('.stock-news [data-news-id="CN_CLOUDBERRY_P2"]').evaluate(el => el === document.activeElement), true);
        // Quote notifications must not destroy a reader's position or active filters.
        await page.locator('.stock-news [data-news-search]').fill('CLOUDBERRY');
        await page.locator('.stock-news [data-news-id="CN_CLOUDBERRY_P2"]').click();
        await page.evaluate(async () => { const { marketEngine: e } = await import('/js/engine/marketEngine.js'); e.notify(false); });
        assert.equal(await page.locator('.news-reading-view').isVisible(), true);
        await page.locator('.stock-news [data-news-stock]').click();
        assert.equal(await page.locator('.stock-detail-header').isVisible(), true);
        await page.locator('.stock-subtabs [data-subtab="info"]').click();
        await page.locator('[data-related]').click();
        assert.equal(await page.locator('.news-list-card').count(), 4);
        await page.locator('.stock-news [data-news-clear]').click();
        assert.equal(await page.locator('.news-list-card').count(), 288);
        // A live new article and its full text are preserved and safely rendered.
        await page.evaluate(async () => {
            const { marketEngine: e } = await import('/js/engine/marketEngine.js');
            e.news.unshift({ id: 'ui-live-news', stockId: 'CLOUDBERRY', title: '원문 검수', type: '공시', source: '출처 검수', time: '검수', body: ['첫 문단', '<img src=x onerror=alert(1)>', '셋째 문단'] });
            e.notify(false);
        });
        assert.equal(await page.locator('.news-list-card').count(), 289);
        await page.locator('.stock-news [data-news-id="ui-live-news"]').click();
        assert.match(await page.locator('.news-reader').textContent(), /<img src=x onerror=alert\(1\)>/);
        assert.equal(await page.locator('.news-reader img').count(), 0);
        await page.locator('.stock-news [data-news-back]').click();
        for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
            await page.setViewportSize(size);
            await page.locator('.stock-news [data-news-id="CN_CLOUDBERRY_P2"]').click();
            const box = await page.locator('.cozy-phone').boundingBox();
            assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width && box.y + box.height <= size.height);
            await page.locator('.stock-news [data-news-stock]').scrollIntoViewIfNeeded();
            assert.equal(await page.locator('.stock-news [data-news-stock]').isVisible(), true);
            await page.screenshot({ path: path.join(out, `${prefix}-article-${size.width}.png`) });
            await page.locator('.stock-news [data-news-back]').click();
        }
        await page.keyboard.press('Escape');
        const after = await page.evaluate(async () => { const { marketEngine: e } = await import('/js/engine/marketEngine.js'); return { cash: e.cash, positions: e.portfolio.size, listeners: e.listeners.size }; });
        assert.deepEqual(after, before);
        await page.goto(base + '/?skipOpening=1');
        await page.waitForFunction(() => window.stockWarsExhibition?.view);
        const exhibitionBefore = await page.evaluate(() => {
            const e = window.stockWarsExhibition; e.arrival.stop(); e.state.flags.phone = true; e.view.sync(e.state);
            const saved = JSON.stringify(e.state); e.view.openPhone(); e.view.phoneHome.openApp('news'); return saved;
        });
        assert.equal(await page.locator('.news-list-card').count(), 288);
        await page.locator('.stock-news [data-news-id="CN_CLOUDBERRY_P2"]').click();
        await page.locator('.stock-news [data-news-stock]').click();
        assert.equal(await page.locator('.cozy-phone__notice').isVisible(), true);
        assert.equal(await page.evaluate(() => JSON.stringify(window.stockWarsExhibition.state)), exhibitionBefore);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(out, prefix + '-checks.json'), JSON.stringify({ articles: 288, search: true, sectors: 8, fullBody: true, source: true, focusReturn: true, liveUpdates: true, escapedText: true, relatedStock: true, stockFilterClear: true, mobileSizes: 2, cleanup: true, exhibitionReadOnly: true, errors }, null, 2));
        console.log(prefix + ' news app checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
