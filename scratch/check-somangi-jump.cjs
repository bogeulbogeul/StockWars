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
        await page.evaluate(async () => {
            const s = window.stockWarsApp; await s.ready; await s.townModelScene.player.ready;
            cancelAnimationFrame(s.frame); document.activeElement?.blur();
        });
        await page.keyboard.down('Space');
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.player.state), 'jump');
        await page.keyboard.up('Space');
        const report = await page.evaluate(async () => {
            const s = window.stockWarsApp, p = s.townModelScene.player, c = s.townStage.playerController;
            window.stockWarsExhibition.arrival.stop();
            const repeated = p.play('jump', { scripted: true });
            const heights = []; for (let i = 0; i < 28; i++) { p.update(.02); heights.push(p.root.position.y); }
            const landed = { state: p.state, height: p.root.position.y };
            const THREE = await import('/vendor/three/three.module.js');
            function points() {
                p.root.updateMatrixWorld(true); const result = [];
                p.variants.get('walk').model.traverse(mesh => {
                    if (!mesh.isSkinnedMesh) return; mesh.skeleton.update();
                    for (let i = 0; i < mesh.geometry.attributes.position.count; i += 101) {
                        const v = mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld); result.push(v.x, v.y, v.z);
                    }
                }); return result;
            }
            p.update(0); const original = points(); p.play('jump', { scripted: true });
            for (let i = 0; i < 5; i++) p.update(.05); p.update(.025);
            const offset = p.root.position.y, peak = points();
            const maxShapeError = Math.max(...peak.map((v, i) => Math.abs(v - original[i] - (i % 3 === 1 ? offset : 0))));
            p.setState('idle');
            p.play('jump', { scripted: true });
            for (let i = 0; i < 28; i++) { c.charPosX += 1; p.update(.02); }
            const movingLanding = p.state;
            p.setState('idle'); p.play('eat', { scripted: true });
            const jumpDuringEating = p.play('jump', { scripted: true }); p.setState('idle');
            const rooms = [];
            for (const place of ['home', 'store', 'information', 'bank', 'stock']) {
                await s.show(place); const room = s.rooms.get(place); cancelAnimationFrame(room.frame); room.frame = null;
                const player = room.player; await player.ready;
                const played = player.play('jump'); for (let i = 0; i < 28; i++) player.update(.02);
                rooms.push({ place, played, state: player.state, height: player.root.position.y });
            }
            return { repeated, maxHeight: Math.max(...heights), minHeight: Math.min(...heights), maxShapeError, landed, movingLanding, jumpDuringEating, rooms };
        });
        assert.equal(report.repeated, false); assert.ok(report.maxHeight > 19 && report.maxHeight <= 20); assert.ok(report.minHeight >= 0);
        assert.deepEqual(report.landed, { state: 'idle', height: 0 }); assert.equal(report.movingLanding, 'walk'); assert.equal(report.jumpDuringEating, false);
        assert.ok(report.maxShapeError < 1e-5, JSON.stringify(report));
        for (const room of report.rooms) { assert.equal(room.played, true, JSON.stringify(room)); assert.equal(room.height, 0); assert.equal(room.state, 'idle'); }
        assert.deepEqual(errors, []); console.log('PASS', root, JSON.stringify(report));
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
