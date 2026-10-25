const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('.');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1700, height: 1200 }, deviceScaleFactor: 1 });
        await page.goto(`http://127.0.0.1:${server.address().port}/output/phone-stock-readable-v2/icons.html`);
        await page.waitForSelector('body[data-ready="true"]');
        if (await page.locator('.cell').count() !== 72) throw new Error('Expected 72 stocks');
        await page.screenshot({ path: 'output/phone-stock-readable-v2/stock-icons.png', fullPage: true });
        console.log('72 current stock icons captured');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
