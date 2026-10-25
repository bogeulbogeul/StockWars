const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/phone-off-launcher-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const preview = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/css/modules/phone-launcher.css"><style>body{margin:0;background:#f5f0e5;display:grid;place-items:center;height:100vh}.phone-launcher{transform:scale(3)}</style><button class="cozy-phone-launch"></button><script type="module">import {decoratePhoneLauncher} from '/js/components/phone/PhoneLauncher.js';decoratePhoneLauncher(document.querySelector('button'));</script>`;
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/launcher-preview') { res.setHeader('Content-Type', 'text/html'); return res.end(preview); }
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
        page.on('pageerror', e => errors.push(e.message));
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        assert.equal(await page.locator('.cozy-phone-launch').isVisible(), false);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        const button = page.locator('.cozy-phone-launch');
        assert.equal(await button.getAttribute('aria-label'), '스마트폰 열기');
        assert.equal(await button.locator('svg').count(), 1);
        await page.screenshot({ path: path.join(out, prefix + '-game.png') });
        await button.click();
        assert.equal(await page.locator('.cozy-phone').evaluate(el => el.open), true);
        await page.keyboard.press('Escape');
        assert.equal(await button.evaluate(el => el === document.activeElement), true);
        await page.setViewportSize({ width: 390, height: 844 });
        const box = await button.boundingBox();
        assert(box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844);
        await button.click();
        assert.equal(await page.locator('.cozy-phone').evaluate(el => el.open), true);
        await page.keyboard.press('Escape');
        await page.goto(base + '/?skipOpening=1');
        await page.waitForFunction(() => window.stockWarsExhibition?.view);
        assert.equal(await page.locator('.exhibition-phone').isVisible(), false);
        await page.evaluate(() => { const e = window.stockWarsExhibition; e.arrival.stop(); e.state.flags.phone = true; e.view.sync(e.state); });
        await page.locator('.exhibition-phone').click();
        assert.equal(await page.locator('.cozy-phone').evaluate(el => el.open), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.exhibition-phone').evaluate(el => el === document.activeElement), true);
        await page.screenshot({ path: path.join(out, prefix + '-exhibition-mobile.png') });
        assert.deepEqual(errors, []);
        const art = await browser.newPage({ viewport: { width: 360, height: 480 } });
        await art.goto(base + '/launcher-preview');
        await art.locator('.phone-launcher svg').waitFor();
        await art.screenshot({ path: path.join(out, prefix + '-preview.png') });
        fs.writeFileSync(path.join(out, prefix + '-checks.json'), JSON.stringify({ titleHidden: true, receivedGate: true, clickOpen: true, focusReturn: true, mobileBounds: true, errors }, null, 2));
        console.log(prefix + ' off-screen phone button checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
