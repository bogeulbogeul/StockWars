const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('.');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
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
        const page = await browser.newPage({ viewport: { width: 1020, height: 1070 } });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/output/map-app-design-v1/index.html`);
        await page.waitForSelector('body[data-ready="true"]');
        assert.equal(await page.locator('.sample:first-child .map-place').count(),9);
        await page.locator('[data-filter="금융"]').click();
        assert.equal(await page.locator('.sample:first-child .map-place').count(),2);
        await page.locator('[data-filter="전체"]').click();
        await page.locator('#placeSearch').fill('증권사');
        assert.equal(await page.locator('.sample:first-child .map-place').count(),1);
        await page.locator('.sample:first-child .map-place').click();
        assert.equal(await page.locator('.facility-card h4').textContent(),'토리 증권사');
        await page.locator('#placeSearch').fill('');
        await page.locator('.sample:first-child .map-place[data-place="settlement_information"]').click();
        await page.locator('#setTarget').click();
        assert.equal(await page.locator('#setTarget').getAttribute('aria-pressed'),'true');
        await page.locator('.sample:first-child [data-zoom="in"]').click();
        await page.locator('.locate').click();
        assert.equal(await page.locator('.sample:first-child .map-box svg').evaluate(el=>el.style.transform),'scale(1)');
        await page.locator('h1').click();
        assert.deepEqual(errors, []);
        await page.screenshot({ path: 'output/map-app-design-v1/preview.png', fullPage: true });
        console.log('Map design: nine current buildings, search, filters, selection, target and zoom verified');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
