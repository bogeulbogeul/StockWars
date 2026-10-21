const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        const button = page.getByRole('button', { name: '게임 시작', exact: true });
        await button.waitFor();
        await page.waitForFunction(() => document.querySelector('.crayon-title img')?.naturalWidth > 0);
        assert.equal(await page.locator('.crayon-title img').evaluate(el => getComputedStyle(el).opacity), '1');
        for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
            await page.setViewportSize({ width, height });
            const box = await button.boundingBox();
            assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.screenshot({ path: 'scratch/crayon-title-desktop.png' });
        assert.equal(await page.locator('#app').evaluate(el => el.inert), true);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.querySelector('.crayon-title'));
        assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount > 0, null, { timeout: 30000 });
        assert.equal(await page.locator('body').evaluate(el => el.classList.contains('town-mode-active')), true);
        await page.reload();
        await button.waitFor();
        await button.click();
        await page.waitForFunction(() => !document.querySelector('.crayon-title'));
        assert.deepEqual(errors, []);
        console.log('PASS: artwork, responsive hit target, keyboard/click entry, inert cleanup, town loading, no runtime errors');
    } finally {
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
