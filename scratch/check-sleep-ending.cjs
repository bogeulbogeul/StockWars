const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="css/modules/crayon-title.css"><link rel="stylesheet" href="css/modules/opening-sequence.css"><body><div id="app"></div><script type="module">
        import {showSleepEnding} from './js/app/exhibition/SleepEnding.js';
        import {showTitleScreen} from './js/app/TitleScreen.js';
        if(sessionStorage.endShown) showTitleScreen(()=>{}, {opening:false,arrival:false});
        else {sessionStorage.endShown='true'; showSleepEnding();}
        </script>`);
    }
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
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
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?skipOpening=1`);
        await page.getByTitle('소망이의 첫날 밤 잠자기 애니메이션').waitFor();
        assert.equal(await page.getByRole('button', { name: '타이틀 화면으로 가기' }).isVisible(), false);
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('iframe').count(), 1);
        const back = page.getByRole('button', { name: '타이틀 화면으로 가기' });
        await back.waitFor({ timeout: 25000 });
        assert.match(await back.locator('img').getAttribute('src'), /return-button\.png$/);
        await page.waitForFunction(() => document.querySelector('.crayon-title__start img')?.naturalWidth > 0);
        assert.equal(await back.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        assert.equal(await page.locator('iframe').count(), 0);
        await page.screenshot({ path: 'scratch/sleep-ending-title.png' });
        await back.click();
        await page.getByRole('button', { name: '게임 시작', exact: true }).waitFor();
        assert.equal(new URL(page.url()).searchParams.has('skipOpening'), false);
        assert.equal(await page.locator('iframe').count(), 0);
        assert.deepEqual(errors, []);
        console.log('PASS: full sleep animation, hidden/disabled button during playback, matching title artwork, return label, actual title navigation, no runtime errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
