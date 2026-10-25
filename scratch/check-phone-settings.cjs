const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), out = path.resolve('output/phone-settings-music-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
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
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        await page.addInitScript(() => {
            window.settingsTestAudios = [];
            const Original = window.Audio;
            window.Audio = class extends Original { constructor(...args) { super(...args); window.settingsTestAudios.push(this); } };
        });
        const base = `http://127.0.0.1:${server.address().port}`;
        await page.goto(base + '/?demo=standard');
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        const start = async () => {
            await page.getByRole('button', { name: '게임 시작', exact: true }).click();
            await page.locator('.opening-sequence__skip').click();
            await page.locator('.bus-arrival .opening-sequence__skip').click();
            await page.locator('.crayon-title').waitFor({ state: 'detached' });
        };
        await start();
        const get = () => page.evaluate(async () => {
            const { getTownMusic } = await import('/js/engine/TownMusic.js');
            const m = getTownMusic();
            return { muted: m.muted, volume: m.volume, listeners: m.listeners.size, master: m.master?.gain.value, active: m.active };
        });
        const before = await get(); assert.equal(before.volume, 1);
        await page.locator('.cozy-phone-launch').click();
        await page.locator('[data-phone-app="settings"]').click();
        const toggle = page.getByRole('switch', { name: '배경음악', exact: true });
        assert.equal(await toggle.getAttribute('aria-checked'), 'true');
        await toggle.click();
        assert.equal((await get()).muted, true);
        assert.equal(await page.evaluate(() => localStorage.getItem('stockwars-town-music-muted-v1')), '1');
        await page.locator('[data-music-volume]').evaluate(el => { el.value = '35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        assert.equal((await get()).volume, .35);
        assert.equal(await page.locator('[data-music-volume-label]').textContent(), '35%');
        await toggle.click();
        await page.waitForTimeout(1300);
        const active = await get();
        assert.equal(active.muted, false);
        if (active.active && active.master != null) assert(Math.abs(active.master - .55 * .35) < .005, JSON.stringify(active));
        await page.screenshot({ path: path.join(out, prefix + '-settings.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await toggle.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, prefix + '-mobile.png') });
        await page.locator('.cozy-phone__back').click();
        assert.equal((await get()).listeners, before.listeners);
        await page.locator('[data-phone-app="settings"]').click();
        assert.equal(await page.locator('[data-music-volume]').inputValue(), '35');
        await toggle.click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        await page.reload();
        await page.waitForFunction(() => window.stockWarsApp?.phoneHome);
        const restored = await get(); assert.equal(restored.muted, true); assert.equal(restored.volume, .35);
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        await page.getByRole('button', { name: '게임 시작', exact: true }).click();
        await page.locator('.opening-sequence__skip').waitFor();
        assert.equal(await page.evaluate(() => window.settingsTestAudios.at(-1)?.volume), 0);
        await page.locator('.opening-sequence__skip').click();
        await page.locator('.bus-arrival .opening-sequence__skip').click();
        await page.locator('.crayon-title').waitFor({ state: 'detached' });
        await page.goto(base + '/?skipOpening=1');
        await page.waitForFunction(() => window.stockWarsExhibition?.view);
        await page.evaluate(() => {
            const e = window.stockWarsExhibition; e.arrival.stop(); e.state.flags.phone = true; e.view.sync(e.state);
            window.settingsStoryBefore = JSON.stringify(e.state); e.view.openPhone(); e.view.phoneHome.openApp('settings');
        });
        assert.equal(await toggle.getAttribute('aria-checked'), 'false');
        assert.equal(await page.locator('[data-music-volume]').inputValue(), '35');
        await toggle.click();
        assert.equal(await page.evaluate(() => JSON.stringify(window.stockWarsExhibition.state) === window.settingsStoryBefore), true);
        assert.equal(await page.locator('.town-music-toggle').count(), 0);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(out, prefix + '-checks.json'), JSON.stringify({ settingsApp: true, mute: true, volume: .35, effectiveGain: active.master, restored: true, openingMuted: true, topControlRemoved: true, cleanup: true, exhibitionSaveUnchanged: true, errors }, null, 2));
        console.log(prefix + ' phone settings music checks passed');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
