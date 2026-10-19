const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.env.CHECK_GAME_ROOT || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8106, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'America/New_York' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await page.goto('http://127.0.0.1:8106/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.buildingClocks?.length === 1
            && window.stockWarsApp.townModelScene.status.hidden, null, { timeout: 90000 });
        const report = await page.evaluate(async () => {
            const { koreaClockSeconds } = await import('/js/components/town3d/BuildingClock.js');
            const THREE = await import('/vendor/three/three.module.js');
            const s = window.stockWarsApp.townModelScene;
            const clock = s.buildingClocks[0];
            const checks = [];
            for (const [iso, seconds] of [['2026-10-18T15:00:00Z',0], ['2026-10-18T18:00:00Z',10800],
                ['2026-10-18T21:30:00Z',23400], ['2026-10-19T03:15:30Z',44130]]) {
                if (koreaClockSeconds(Date.parse(iso)) !== seconds) throw Error('KST conversion');
                clock.update(Date.parse(iso));
                for (const h of clock.hands) {
                    const positions = h.object.geometry.attributes.position;
                    let tip = new THREE.Vector3();
                    let longest = 0;
                    for (let i = 0; i < positions.count; i++) {
                        const v = new THREE.Vector3().fromBufferAttribute(positions, i);
                        const radius = v.x*v.x + v.y*v.y;
                        if (radius > longest) { longest = radius; tip = v; }
                    }
                    tip.applyQuaternion(h.object.quaternion);
                    const angle = 2*Math.PI*(seconds%h.period)/h.period;
                    const dot = new THREE.Vector2(tip.x, tip.y).normalize().dot(new THREE.Vector2(Math.sin(angle),Math.cos(angle)));
                    if (dot < .99) throw Error(`Hand direction ${h.name}: ${dot}`);
                }
                checks.push(iso);
            }
            const before = clock.hands[1].object.quaternion.clone();
            clock.update(Date.parse('2026-10-19T03:16:30Z'));
            if (before.angleTo(clock.hands[1].object.quaternion) < .1) throw Error('Clock did not advance');
            const player = s.town.playerController;
            player.charPosX = 2030; player.charPosY = 1810;
            const canStand = player.canStand(2030, 1810);
            s.draw();
            const model = s.scene.getObjectByName('cipher_securities');
            const bounds = new THREE.Box3().setFromObject(model);
            return { checks, canStand, width: bounds.max.x-bounds.min.x,
                handCount: clock.hands.length, source: model.getObjectByName('Clock_Face')?.name };
        });
        assert.equal(report.canStand, true);
        assert(Math.abs(report.width-370)<1);
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'scratch/cipher-exterior-clock-game.png' });
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene?.player?.state === 'idle', null, { timeout: 90000 });
        assert(await page.locator('#cipherLobbyStage').isVisible());
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.townStage.containerEl.classList.contains('hidden'));
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log('PASS', JSON.stringify(report), 'F entry / Escape return; no browser errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
