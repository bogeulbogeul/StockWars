const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const out = path.resolve(process.argv[3] || 'output/phone-home-2d-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const errors = [];
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        page.on('pageerror', e => { errors.push(e.message); console.error('Browser:', e.message); });
        page.on('response', response => {
            if (response.status() === 404 && /\.js(?:\?|$)/.test(response.url())) console.error('Missing module:', response.url());
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        await page.locator('.cozy-phone-launch').click();
        const dialog = page.locator('.cozy-phone');
        const checkCenter = async () => {
            const center = await dialog.evaluate(el => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2 - innerWidth / 2, y: b.y + b.height / 2 - innerHeight / 2 }; });
            assert(Math.abs(center.x) < 2 && Math.abs(center.y) < 2, JSON.stringify(center));
        };
        await assert.equal(await dialog.evaluate(d => d.open), true);
        assert.equal(await page.locator('[data-phone-app]:visible').count(), 8);
        assert.deepEqual(await page.locator('[data-phone-app]').allTextContents(), ['주식', '소식', '업적', '메신저', '할 일', '내 정보', '지도', '설정']);
        assert.equal(await page.locator('.cozy-phone__dots').count(), 0);
        assert.equal(await page.locator('.cozy-phone__tile').evaluateAll(tiles => new Set(tiles.map(el => getComputedStyle(el).backgroundColor)).size), 8);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townStage.callbacks.isInputBlocked()), true);
        for (const id of ['stock', 'news', 'achievements', 'messenger', 'tasks', 'profile', 'map', 'settings']) {
            await page.locator(`[data-phone-app="${id}"]`).click();
            assert.equal(await page.locator('.cozy-phone__detail').isVisible(), true);
            await checkCenter();
            await page.locator('.cozy-phone__back').click();
        }
        assert.equal(await page.locator('.device-container:visible').count(), 0);
        const sizes = [[1280, 900], [390, 844], [844, 390]];
        for (const [width, height] of sizes) {
            await page.setViewportSize({ width, height });
            const bounds = await dialog.boundingBox();
            await checkCenter();
            assert(bounds.width >= Math.min(350, (height - 24) * .54), 'phone must remain readable, independent of game zoom');
            assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, JSON.stringify(bounds));
            for (const tile of await page.locator('[data-phone-app]').all()) {
                const b = await tile.boundingBox();
                assert(b.y + b.height < bounds.y + bounds.height, 'app extends below phone');
            }
            await page.screenshot({ path: path.join(out, `${prefix}-${width}x${height}.png`) });
            for (const app of ['stock', 'news']) {
                await page.locator(`[data-phone-app="${app}"]`).click();
                await checkCenter();
                await page.locator('.cozy-phone__back').click();
            }
        }
        await page.keyboard.press('Escape');
        assert.equal(await dialog.evaluate(d => d.open), false);
        assert.equal(await page.locator('.cozy-phone-launch').evaluate(n => n === document.activeElement), true);
        await page.keyboard.press('p');
        assert.equal(await dialog.evaluate(d => d.open), true);
        await page.keyboard.press('p');
        assert.equal(await dialog.evaluate(d => d.open), false);
        // Exhibition is the default entry: retain receive/certificate gates and first-open progression.
        await page.goto(base + '/?skipOpening=1');
        await page.waitForFunction(() => window.stockWarsExhibition?.view);
        assert.equal(await page.evaluate(() => window.stockWarsExhibition.view.openPhone()), false);
        await page.evaluate(() => {
            const e = window.stockWarsExhibition;
            e.arrival.stop(); e.state.flags.phone = true; e.view.sync(e.state); e.view.openPhone();
        });
        assert.equal(await page.locator('[data-phone-app="stock"]').isVisible(), true);
        assert.equal(await page.locator('[data-phone-app="stock"]').getAttribute('aria-disabled'), 'true');
        await page.locator('[data-phone-app="stock"]').dispatchEvent('click');
        assert.equal(await page.locator('.cozy-phone__notice').isVisible(), true);
        assert.equal(await page.locator('.stock-app').count(), 0);
        await page.locator('[data-phone-app="messenger"]').click();
        assert.match(await page.locator('.cozy-phone__content').textContent(), /모아/);
        await page.keyboard.press('Escape');
        await page.evaluate(() => {
            const e = window.stockWarsExhibition;
            e.state.flags.bank = e.state.flags.certificate = true;
            e.state.nickname = '검수'; e.state.cash = 5000; e.state.debt = 5000;
            e.view.sync(e.state); e.view.openPhone();
        });
        assert.equal(await page.locator('[data-phone-app]:visible').count(), 8);
        await page.evaluate(async () => {
            const { weatherService } = await import('/js/engine/weatherService.js');
            weatherService.currentWeather = { ...weatherService.currentWeather, category: 'snow', text: '눈' };
            window.stockWarsExhibition.view.phoneHome.updateClock();
        });
        assert.equal(await page.locator('[data-phone-weather]').getAttribute('aria-label'), '눈');
        assert.equal(await page.locator('[data-phone-app="stock"]').getAttribute('aria-disabled'), 'false');
        await page.locator('[data-phone-app="stock"]').click();
        assert.match(await page.locator('.cozy-phone__content').textContent(), /5,000잎/);
        await page.locator('.cozy-phone__back').click();
        await page.locator('[data-phone-app="profile"]').click();
        assert.match(await page.locator('.cozy-phone__content').textContent(), /빌린 정착 자금/);
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(() => window.stockWarsExhibition.view.openPhone());
        await page.screenshot({ path: path.join(out, `${prefix}-exhibition.png`) });
        await page.keyboard.press('Escape');
        const advanced = await page.evaluate(async () => {
            const e = window.stockWarsExhibition;
            let result = '';
            const original = e.activities.next;
            e.activities.next = id => { result = id; };
            e.activities.openPhone(); e.view.panel.querySelector('button').click();
            e.view.phoneHome.close();
            await new Promise(resolve => setTimeout(resolve, 50));
            e.activities.next = original;
            return result;
        });
        assert.equal(advanced, 'openPhone');
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(out, `${prefix}-checks.json`), JSON.stringify({ apps: 8, sizes, exhibitionGates: true, firstOpenProgression: true, legacyHidden: true, errors }, null, 2));
        console.log(prefix + ' phone home: all checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; server.close(); });
