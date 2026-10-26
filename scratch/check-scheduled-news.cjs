const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/news-schedule-local-v1');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__news-check') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end('<!doctype html><html><body><div id="host"></div></body></html>');
    }
    const file = path.resolve(root, '.' + url.pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const results = [];
    try {
        for (const [timezoneId, utcTime] of [['Asia/Seoul', '2026-10-25T23:59:59Z'], ['America/New_York', '2026-10-26T12:59:59Z']]) {
            for (const mode of ['standard', 'exhibition']) {
                const context = await browser.newContext({ timezoneId });
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.clock.install({ time: new Date(utcTime) });
                await page.goto(`http://127.0.0.1:${server.address().port}/__news-check`);
                async function mount() {
                    return page.evaluate(async mode => {
                        const { marketEngine } = await import('/js/engine/marketEngine.js');
                        marketEngine.stopEngine();
                        const { NewsApp } = await import('/js/components/phone/news/NewsApp.js');
                        let source;
                        if (mode === 'standard') {
                            const { phoneStockSource } = await import('/js/app/PhoneStockSource.js');
                            source = phoneStockSource({ smartphoneUI: { homeTab: {} } });
                        } else {
                            const { exhibitionStockSource } = await import('/js/app/exhibition/PhoneStockSource.js');
                            source = exhibitionStockSource(() => ({ shares: [], trades: [], cash: 0, flags: {} }));
                        }
                        window.newsSource = source;
                        window.newsApp = new NewsApp(document.querySelector('#host'), source);
                        return { count: source.news().length, hour: new Date().getHours() };
                    }, mode);
                }
                assert.deepEqual(await mount(), { count: 0, hour: 8 });
                await page.clock.fastForward(1000);
                assert.equal(await page.locator('[data-news-id]').count(), 1);
                const first = await page.evaluate(() => newsSource.news()[0]);
                assert.equal(new Date(first.publishedAt).getTime(), new Date(utcTime).getTime() + 1000);
                await page.locator('[data-news-id]').click();
                assert.equal(await page.locator('.news-reader h3').textContent(), first.title);
                await page.clock.fastForward(3 * 60 * 60 * 1000);
                assert.equal(await page.evaluate(() => newsSource.news().length), 2);
                assert.equal(await page.locator('.news-reader h3').textContent(), first.title);
                const ids = await page.evaluate(() => newsSource.news().map(article => article.id));
                await page.reload();
                const restored = await mount();
                assert.equal(restored.count, 2);
                if (mode === 'standard') assert.deepEqual(await page.evaluate(() => newsSource.news().map(a => a.id)), ids);
                // Calendar-slot helper also handles the DST fall-back day without repeating a local slot.
                const slots = await page.evaluate(async () => {
                    const { nextNewsSlot } = await import('/js/engine/ScheduledNews.js');
                    let cursor = new Date(2026, 10, 1, 0).getTime();
                    const hours = [];
                    for (let i = 0; i < 5; i++) { cursor = nextNewsSlot(cursor); hours.push(new Date(cursor).getHours()); }
                    return hours;
                });
                assert.deepEqual(slots, [9, 12, 15, 18, 21]);
                assert.deepEqual(errors, []);
                results.push({ timezoneId, mode, autoPublication: true, retainedReader: true, reload: true, dst: true, errors });
                await context.close();
            }
        }
        fs.writeFileSync(path.join(output, root.includes('win-unpacked') ? 'desktop-browser.json' : 'web-browser.json'), JSON.stringify(results, null, 2));
        console.log(JSON.stringify(results));
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
