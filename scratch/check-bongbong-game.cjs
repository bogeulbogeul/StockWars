const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const runtime = root.includes('win-unpacked');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        await page.waitForFunction(() => window.stockWarsApp?.enterVivianModel, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ });
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }
        await page.evaluate(() => window.stockWarsApp.enterVivianModel());
        await page.evaluate(async () => { await window.stockWarsApp.vivianModelScene.ready; });
        const result = await page.evaluate(async () => {
            const s = window.stockWarsApp.vivianModelScene;
            if (s.failed) throw Error('Store load failed');
            const meshes = []; s.shopkeeper.traverse(o => { if (o.isMesh) meshes.push(o.name); });
            const { Box3 } = await import('/vendor/three/three.module.js');
            const { vivianCanStand, BONGBONG_POSITION, VIVIAN_MODEL_SCALE } = await import('/js/data/vivianModelRoom.js');
            s.room.updateMatrixWorld(true);
            const box = new Box3().setFromObject(s.shopkeeper);
            let calls = 0; s.onShop = () => calls++;
            s.controller.charPosX = 0; s.controller.charPosY = 0;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF' }));
            return { meshes, count: s.room.children.filter(o => o.name === 'bongbong-character').length,
                height: box.max.y-box.min.y, footY: box.min.y, counterCalls: calls,
                collision: !vivianCanStand(BONGBONG_POSITION.x, BONGBONG_POSITION.z),
                entranceClear: vivianCanStand(0, 180), scale: VIVIAN_MODEL_SCALE };
        });
        assert.equal(result.count, 1); assert(result.meshes.some(n => /RoundedBud/.test(n)));
        assert(!result.meshes.some(n => /Vest|Apron|Bread|Food/.test(n)));
        assert(result.height > 110 && result.height < 125); assert(Math.abs(result.footY) < .01);
        assert.equal(result.collision, true); assert.equal(result.entranceClear, true); assert.equal(result.counterCalls, 1);
        await page.screenshot({ path: `output/bongbong-game-v1/store${runtime ? '-runtime' : ''}.png` });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(() => window.stockWarsExhibition?.started && !window.stockWarsExhibition.busy, null, { timeout: 90000 });
        const exhibition = await page.evaluate(async () => {
            const demo = window.stockWarsExhibition;
            await demo.scenes.show('store');
            const room = demo.scenes.rooms.get('store');
            return { count: room.room.children.filter(o => o.name === 'bongbong-character').length,
                failed: !!room.failed, active: room.active };
        });
        assert.deepEqual(exhibition, { count: 1, failed: false, active: true });
        await page.screenshot({ path: `output/bongbong-game-v1/exhibition-store${runtime ? '-runtime' : ''}.png` });
        assert.deepEqual(errors, []);
        fs.writeFileSync(`output/bongbong-game-v1/browser-check${runtime ? '-runtime' : ''}.json`, JSON.stringify({ root, result, exhibition, errors }, null, 2));
        console.log('PASS Bongbong: adopted v5, one actor, no clothes, scale/ground, collision, F counter, no browser errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
