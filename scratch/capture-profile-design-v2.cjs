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
        const page = await browser.newPage({ viewport: { width: 1220, height: 1080 } });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/output/profile-app-design-v2/index.html`);
        await page.waitForSelector('body[data-ready="true"]');
        await page.locator('[data-stage="residence"]').click();
        assert.equal(await page.locator('.doc-card').count(),1);
        await page.locator('[data-stage="bankReceived"]').click();
        assert.match(await page.locator('.profile-app').textContent(),/서명 대기/);
        assert.equal(await page.locator('.signature.signed').count(),0);
        await page.locator('[data-stage="bankSigned"]').click();
        assert.match(await page.locator('.profile-app').textContent(),/개설 완료/);
        assert.equal(await page.locator('.signature.signed').count(),1);
        await page.locator('[data-stage="loanReceived"]').click();
        assert.equal(await page.locator('.doc-card').count(),3);
        assert.equal(await page.locator('.signature.signed').count(),0);
        assert.equal((await page.locator('.profile-app').textContent()).includes('5,000잎'),false);
        await page.locator('[data-filter="waiting"]').click();
        assert.equal(await page.locator('.doc-card').count(),1);
        await page.locator('[data-filter="all"]').click();
        await page.screenshot({path:'output/profile-app-design-v2/preview.png',fullPage:true});
        await page.locator('[data-stage="loanSigned"]').click();
        assert.match(await page.locator('.profile-app').textContent(),/5,000잎/);
        assert.equal(await page.locator('.signature.signed').count(),1);
        assert.equal(await page.locator('.analysis-track').getAttribute('aria-valuemax'),'40');
        assert.equal(await page.locator('.analysis-track').getAttribute('aria-valuenow'),'4');
        assert.match(await page.locator('.analysis-card').textContent(),/Lv.3/);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: 'output/profile-app-design-v2/signed.png', fullPage: true });
        console.log('Profile design: receipt, signature, profile updates and document archive verified');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
