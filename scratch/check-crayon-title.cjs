const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const titleOnly = process.argv.includes('--title-only');
const server = http.createServer((req, res) => {
    if (titleOnly && req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        return res.end(`<!doctype html><link rel="stylesheet" href="css/modules/crayon-title.css"><link rel="stylesheet" href="css/modules/opening-sequence.css"><link rel="stylesheet" href="css/modules/graphics-paused.css"><body class="graphics-paused ui-paused"><div id="app"></div><script type="module">import {showTitleScreen} from './js/app/TitleScreen.js'; showTitleScreen(()=>document.body.dataset.started='true');</script>`);
    }
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
        assert.equal(await page.locator('.crayon-title img').first().evaluate(el => getComputedStyle(el).opacity), '1');
        await page.waitForFunction(() => document.querySelectorAll('.crayon-title__frame').length === 2);
        assert.equal(await page.locator('.crayon-title canvas').count(), 0);
        assert.match(await button.locator('img').getAttribute('src'), /start-button\.png$/);
        await page.setViewportSize({ width: 1672, height: 941 });
        const capture = clip => page.screenshot({ clip });
        const armClip = { x: 925, y: 440, width: 100, height: 100 };
        const sproutClip = { x: 100, y: 735, width: 150, height: 150 };
        const logoClip = { x: 350, y: 90, width: 700, height: 150 };
        const firstLogo = await capture(logoClip);
        await page.waitForFunction(() => document.querySelector('.crayon-title__art').dataset.frame === '1');
        await page.waitForFunction(() => document.querySelector('.crayon-title__art').dataset.frame === '2');
        assert.deepEqual(await capture(logoClip), firstLogo);
        await page.screenshot({ path: 'scratch/crayon-title-motion.png' });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => document.querySelector('.crayon-title__art').dataset.frame === '0');
        assert.equal(await page.locator('.crayon-title__frame:not([hidden])').count(), 0);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
            await page.setViewportSize({ width, height });
            const box = await button.boundingBox();
            assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.screenshot({ path: 'scratch/crayon-title-desktop.png' });
        assert.equal(await page.locator('#app').evaluate(el => el.inert), true);
        await page.keyboard.press('Enter');
        await page.getByRole('button', { name: '건너뛰기' }).click();
        await page.waitForFunction(() => !document.querySelector('.crayon-title'));
        assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
        if (titleOnly) {
            assert.equal(await page.locator('body').getAttribute('data-started'), 'true');
        } else {
            await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount > 0, null, { timeout: 30000 });
            assert.equal(await page.locator('body').evaluate(el => el.classList.contains('town-mode-active')), true);
        }
        await page.reload();
        await button.waitFor();
        await button.click();
        await page.getByRole('button', { name: '건너뛰기' }).click();
        await page.waitForFunction(() => !document.querySelector('.crayon-title'));
        assert.deepEqual(errors, []);
        console.log('PASS: PNG flipbook frames, no deformation canvas, separate button asset, fixed logo, reduced motion, responsive button, opening/skip, town entry, no runtime errors');
    } finally {
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
