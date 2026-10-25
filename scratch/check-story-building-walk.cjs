const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); page.setDefaultTimeout(90000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(() => window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);
        await page.evaluate(async () => {
            const a = window.stockWarsExhibition; a.arrival.stop(); a.busy = true; a.view.panel.hidden = true;
            const s = a.scenes; await s.ready; await s.townModelScene.player.ready;
            s.townModelScene.renderer.setPixelRatio(.35);
            s.homeEntered = s.informationEntered = s.bankEntered = true;
            const room = await s.prepareRoom('home'); s.place = 'home';
            s.townStage.containerEl.classList.add('hidden'); room.show();
        });
        for (const place of ['notice', 'store', 'bench', 'stock', 'bench', 'information', 'store', 'home']) {
            console.log('STORY ' + place);
            await page.evaluate(place => {
                window.travelDone = false; window.travelFailure = null;
                window.stockWarsExhibition.scenes.show(place).then(() => window.travelDone = true).catch(e => window.travelFailure = e.message);
            }, place);
            await page.waitForFunction(() => !!document.querySelector('[aria-label="목적지 이동 안내"]') || window.travelDone || window.travelFailure);
            const failure = await page.evaluate(() => window.travelFailure); assert(!failure, failure);
            const before = await page.evaluate(() => {
                const c = window.stockWarsExhibition.scenes.townStage.playerController; return [c.charPosX, c.charPosY];
            });
            await page.waitForTimeout(300);
            assert.equal(await page.evaluate(() => window.travelDone), false, 'must wait for walking');
            assert.deepEqual(await page.evaluate(() => {
                const c = window.stockWarsExhibition.scenes.townStage.playerController; return [c.charPosX, c.charPosY];
            }), before, 'destination prompt must not move player');
            const walked = await page.evaluate(async place => {
                const s = window.stockWarsExhibition.scenes, c = s.townStage.playerController;
                const { TOWN_MODEL_BUILDINGS, GROUND_PROJECTION: P } = await import('/js/data/townModelBuildings.js');
                const { TOWN_MODEL_PROPS } = await import('/js/data/townModelProps.js');
                const { tourRoute, resolveTourStop, routeLength, routePoint } = await import('/js/app/exhibition/TourRoute.js');
                const ids = { home: 'home_office_tower', store: 'vivian_store', information: 'settlement_information', stock: 'cipher_securities' };
                const b = TOWN_MODEL_BUILDINGS.find(b => b.id === ids[place]);
                const p = TOWN_MODEL_PROPS.find(p => p.id === (place === 'notice' ? 'plaza_notice_board' : 'plaza_bench_west'));
                const goal = resolveTourStop(b ? { x: b.x + (b.entranceOffsetX || 0), y: b.y + 110 } : { x: p.x, y: p.y + 90 }, c.sceneryCanStand);
                const sparse = tourRoute({ x: c.charPosX, y: c.charPosY }, goal, c.canStand), distance = routeLength(sparse);
                const route = Array.from({ length: Math.ceil(distance / 12) + 1 }, (_, i) => routePoint(sparse, Math.min(distance, i * 12)));
                const held = new Set(); let index = 1, frames = 0;
                const apply = next => {
                    for (const key of held) if (!next.has(key)) window.dispatchEvent(new KeyboardEvent('keyup', { key, code: 'Key' + key.toUpperCase(), bubbles: true }));
                    for (const key of next) if (!held.has(key)) window.dispatchEvent(new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), bubbles: true }));
                    held.clear(); for (const key of next) held.add(key);
                };
                try { await new Promise((resolve, reject) => {
                    const tick = () => {
                        if (window.travelFailure) return reject(new Error(window.travelFailure));
                        if (!document.querySelector('[aria-label="목적지 이동 안내"]')) return resolve();
                        if (++frames > 20000) return reject(new Error('WASD route stalled ' + place + ' at ' + c.charPosX + ',' + c.charPosY));
                        let target = route[index];
                        if (Math.hypot(target.x - c.charPosX, (target.y - c.charPosY) / P) < 12 && index < route.length - 1) target = route[++index];
                        const dx = target.x - c.charPosX, dy = target.y - c.charPosY, next = new Set();
                        if (Math.abs(dx) > 3) next.add(dx > 0 ? 'd' : 'a');
                        if (Math.abs(dy) > 3) next.add(dy > 0 ? 's' : 'w');
                        apply(next); requestAnimationFrame(tick);
                    }; requestAnimationFrame(tick);
                }); } finally { apply(new Set()); }
                return frames;
            }, place);
            await page.waitForFunction(() => window.travelDone || window.travelFailure);
            assert.equal(await page.evaluate(() => window.travelFailure), null);
            console.log(JSON.stringify({ place, wasdFrames: walked }));
        }
        assert.deepEqual(errors, []); console.log('PASS story exits, destination walking and repeat entries');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
