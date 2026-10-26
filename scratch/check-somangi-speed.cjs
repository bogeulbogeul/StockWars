const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => { if (error) return res.writeHead(404).end(); res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.txt': 'text/plain' })[path.extname(file)] || 'application/octet-stream'); res.end(data); });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(() => window.stockWarsExhibition?.arrival.active);
        await page.evaluate(async () => { await window.stockWarsApp.ready; await window.stockWarsApp.townModelScene.player.ready; });
        const report = await page.evaluate(async () => {
            const app = window.stockWarsExhibition, scenes = app.scenes;
            cancelAnimationFrame(scenes.frame); app.arrival.stop();
            const raf = window.requestAnimationFrame; let arrivalTick, arrivalSpeed;
            try {
                window.requestAnimationFrame = callback => { arrivalTick = callback; return 0; };
                app.arrival.start(); app.arrival.keys.add('d');
                const startX = scenes.townStage.playerController.charPosX;
                arrivalTick(app.arrival.last + 50);
                arrivalSpeed = (scenes.townStage.playerController.charPosX - startX) / .05;
                app.arrival.stop();
            } finally { window.requestAnimationFrame = raf; }
            const { TownPlayerController } = await import('/js/components/town/TownPlayerController.js');
            const town = [];
            for (const keys of [['d'], ['d', 'w'], ['d', 'shift']]) {
                const c = new TownPlayerController(); c.charPosX = c.charPosY = 2000; c.canStand = () => true; c.keysHeld = new Set(keys); c.somangiCrabSuspended = true;
                c.update(.1); town.push(Math.hypot(c.charPosX - 2000, c.charPosY - 2000));
            }
            const wall = new TownPlayerController(); wall.charPosX = wall.charPosY = 2000; wall.canStand = x => x <= 2030; wall.keysHeld = new Set(['d', 'shift']); wall.somangiCrabSuspended = true; wall.update(.1);
            const p = scenes.townModelScene.player, c = scenes.townStage.playerController;
            p.setState('idle'); c.keysHeld.clear(); c.charPosX += 1; p.update(.1);
            const walkCadence = p.variants.get('walk').mixer.timeScale;
            c.keysHeld.add('shift'); c.charPosX += 1; p.update(.1);
            const runCadence = p.variants.get('walk').mixer.timeScale;
            c.keysHeld.clear(); p.setState('idle'); p.play('eat', { scripted: true }); p.update(.1);
            const eatingCadence = p.variants.get('eat').mixer.timeScale;
            const interiors = [];
            for (const place of ['home', 'store', 'information', 'bank', 'stock']) {
                await scenes.show(place); const room = scenes.rooms.get(place); cancelAnimationFrame(room.frame); room.frame = null;
                const rc = room.controller;
                function measure(running) {
                    const startX = place === 'information' ? 210 : 0;
                    rc.charPosX = startX; rc.charPosY = 90 * Math.sin(26 * Math.PI / 180); rc.keysHeld = new Set(running ? ['d', 'shift'] : ['d']); rc.somangiCrabSuspended = true;
                    room.blocked = () => false; room.exitPending = false; room.update(.1); return rc.charPosX - startX;
                }
                interiors.push({ place, walk: measure(false), run: measure(true) });
            }
            return { arrivalSpeed, town, wallX: wall.charPosX, walkCadence, runCadence, eatingCadence, interiors };
        });
        assert.ok(Math.abs(report.town[0] - 35) < 1e-6); assert.ok(Math.abs(report.town[1] - 35) < 1e-6); assert.ok(Math.abs(report.town[2] - 63) < 1e-6);
        assert.ok(report.wallX <= 2030); assert.equal(report.walkCadence, 1.25); assert.equal(report.runCadence, 1.75); assert.equal(report.eatingCadence, 1);
        assert.equal(report.arrivalSpeed, 210);
        for (const room of report.interiors) { assert.ok(Math.abs(room.walk - 18) < 1e-6, JSON.stringify(room)); assert.ok(Math.abs(room.run - 27.5) < 1e-6, JSON.stringify(room)); }
        assert.deepEqual(errors, []); console.log('PASS', root, JSON.stringify(report));
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
