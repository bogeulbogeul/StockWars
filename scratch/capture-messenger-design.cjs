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
        const page = await browser.newPage({ viewport: { width: 1020, height: 990 } });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/output/messenger-app-design-v1/index.html`);
        await page.waitForSelector('body[data-ready="true"]');
        assert.equal(await page.locator('.conversation').count(),4);
        await page.locator('[data-filter="unread"]').click();
        assert.equal(await page.locator('.conversation').count(),2);
        await page.locator('[data-filter="all"]').click();
        await page.locator('input').fill('토리');
        assert.equal(await page.locator('.conversation').count(),1);
        await page.locator('.conversation').click();
        assert.equal(await page.locator('#chatName').textContent(),'토리');
        await page.locator('input').fill('');
        await page.locator('[data-id="moa"]').click();
        await page.locator('[data-reply]').first().click();
        assert.equal(await page.locator('.bubble.mine').count(),1);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: 'output/messenger-app-design-v1/preview.png', fullPage: true });
        console.log('Messenger design preview: conversations, search, unread filter and reply verified');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
