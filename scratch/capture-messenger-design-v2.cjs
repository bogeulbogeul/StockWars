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
        const page = await browser.newPage({ viewport: { width: 1220, height: 990 } });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/output/messenger-app-design-v2/index.html`);
        await page.waitForSelector('body[data-ready="true"]');
        await page.locator('#addEntry').click();
        assert.equal(await page.locator('#friendId').evaluate(el=>el===document.activeElement),true);
        await page.locator('#friendId').fill('없음');
        await page.getByRole('button',{name:'찾기',exact:true}).click();
        assert.equal(await page.locator('.result').isVisible(),false);
        await page.locator('#friendId').fill('SW-2048');
        await page.getByRole('button',{name:'찾기',exact:true}).click();
        assert.equal(await page.locator('.result').isVisible(),true);
        await page.locator('#sendRequest').click();
        assert.equal(await page.locator('#sendRequest').isDisabled(),true);
        assert.equal(await page.locator('#createRoom').isDisabled(),true);
        await page.getByRole('checkbox',{name:'새봄 선택'}).check();
        await page.getByRole('checkbox',{name:'잎새 선택'}).check();
        assert.equal(await page.locator('#selectedCount').textContent(),'2');
        await page.locator('#roomName').fill('광장 산책 친구들');
        await page.locator('#createRoom').click();
        assert.match(await page.locator('#roomFeedback').textContent(),/광장 산책 친구들/);
        await page.locator('#roomFeedback').evaluate(el=>el.textContent='');
        await page.locator('#sendRequest').evaluate(el=>{el.disabled=false;el.textContent='친구 요청 보내기';});
        await page.locator('#friendFeedback').evaluate(el=>el.textContent='');
        await page.locator('h1').click();
        assert.deepEqual(errors, []);
        await page.screenshot({ path: 'output/messenger-app-design-v2/preview.png', fullPage: true });
        console.log('Messenger v2: friend search, request state, selection and room creation verified');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
