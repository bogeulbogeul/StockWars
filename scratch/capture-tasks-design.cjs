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
        const page = await browser.newPage({ viewport: { width: 1020, height: 1020 } });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/output/tasks-app-design-v1/index.html`);
        await page.waitForSelector('body[data-ready="true"]');
        assert.equal(await page.locator('.task').count(),5);
        await page.locator('[data-filter="done"]').click();
        assert.equal(await page.locator('.task').count(),2);
        await page.locator('[data-filter="todo"]').click();
        assert.equal(await page.locator('.task').count(),3);
        await page.locator('[data-task="stock"]').click();
        assert.equal(await page.locator('#detailTitle').textContent(),'주식 앱 살펴보기');
        await page.locator('#pin').click();
        assert.equal(await page.locator('.task').first().getAttribute('data-task'),'stock');
        await page.locator('.add').click();
        await page.locator('[name="title"]').fill('광장에서 사진 찍기');
        await page.getByRole('button',{name:'추가하기',exact:true}).click();
        assert.equal(await page.locator('.task').count(),6);
        await page.reload();
        await page.waitForSelector('body[data-ready="true"]');
        assert.deepEqual(errors, []);
        await page.screenshot({ path: 'output/tasks-app-design-v1/preview.png', fullPage: true });
        console.log('Tasks design preview: filters, details, pin and memo creation verified');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
