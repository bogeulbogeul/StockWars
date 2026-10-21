const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        return res.end(`<!doctype html><link rel="stylesheet" href="css/modules/crayon-title.css"><link rel="stylesheet" href="css/modules/opening-sequence.css"><link rel="stylesheet" href="css/modules/bus-arrival.css"><div id="app"></div><script type="module">import {showTitleScreen} from './js/app/TitleScreen.js'; showTitleScreen(()=>document.body.dataset.started='true');</script>`);
    }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence iframe').waitFor();
        await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(() => document.querySelector('[data-arrival-state="driving"] .bus-arrival__stage')?.dataset.busX);
        const sample = el => ({ x: +el.dataset.busX, screenX: +el.dataset.screenX, frontX: +el.dataset.frontScreenX, wheel: +el.dataset.wheelTime });
        const first = await page.locator('.bus-arrival__stage').evaluate(sample);
        await page.waitForTimeout(650);
        const next = await page.locator('.bus-arrival__stage').evaluate(sample);
        assert(next.x < first.x && next.wheel > first.wheel, 'bus moves toward -X while wheels roll');
        assert(first.screenX > next.screenX && next.frontX < next.screenX, 'screen movement and bus front both point left');
        await page.waitForFunction(() => document.querySelector('[data-arrival-state="stopped"]'));
        assert(+await page.locator('.bus-arrival__stage').getAttribute('data-village-models') >= 10, 'real village buildings and props are present');
        const wheel = await page.locator('.bus-arrival__stage').getAttribute('data-wheel-time');
        await page.waitForTimeout(350);
        assert.equal(await page.locator('.bus-arrival__stage').getAttribute('data-wheel-time'), wheel, 'wheels stop with bus');
        await page.screenshot({ path: 'output/popori-bus-v24/game-arrival.png' });
        await page.waitForFunction(() => document.body.dataset.started === 'true');
        assert.equal(await page.locator('.bus-arrival canvas').count(), 0);
        assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
        // Reuse a live village without deleting its buildings on cutscene exit.
        const townCount = await page.evaluate(async () => {
            const { getArrivalVillage } = await import('/js/app/arrival/ArrivalVillage.js');
            const village = await getArrivalVillage();
            window.stockWarsApp = { townModelScene: { ...village, ready: Promise.resolve() } };
            const { showTitleScreen } = await import('/js/app/TitleScreen.js');
            showTitleScreen(() => document.body.dataset.borrowedDone = 'true');
            return village.scene.children.length;
        });
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(() => document.querySelector('.bus-arrival__stage')?.dataset.busX);
        await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(() => document.body.dataset.borrowedDone === 'true');
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.scene.children.length), townCount);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.landscape.playerShadow.visible), true);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.reload();
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(() => document.querySelector('[data-arrival-state="stopped"]'));
        await page.screenshot({ path: 'output/popori-bus-v24/game-arrival-mobile.png' });
        await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(() => document.body.dataset.started === 'true');
        // Late asset completion after skipping must not resurrect a canvas.
        await page.reload();
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.opening-sequence__skip').click();
        await page.waitForTimeout(700);
        assert.equal(await page.locator('.bus-arrival canvas').count(), 0);
        assert.deepEqual(errors, []);
        console.log('PASS: title → opening → arrival → game; rolling, stop, cleanup, mobile, reduced motion and skip');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
