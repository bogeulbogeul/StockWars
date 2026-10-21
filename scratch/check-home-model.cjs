const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || process.env.CHECK_GAME_ROOT || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8097, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto('http://127.0.0.1:8097/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount >= 20, null, { timeout: 90000 });
        const save = await page.evaluate(() => JSON.stringify(localStorage));
        await page.evaluate(async () => {
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const home = TOWN_MODEL_BUILDINGS.find(b => b.id === 'home_office_tower');
            const player = window.stockWarsApp.townStage.playerController;
            player.charPosX = home.x + (home.entranceOffsetX || 0); player.charPosY = home.y + 65;
        });
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.homeModelScene?.player?.state === 'idle', null, { timeout: 90000 });
        assert.equal(await page.locator('#homeModelStage').isVisible(), true);
        const state = await page.evaluate(() => {
            const home = window.stockWarsApp.homeModelScene;
            return { background: home.scene.background.getHex(),
                parts: home.room.children.filter(o => o.visible).map(o => o.name),
                textures: home.room.getObjectByName('Entrance_Floor').material.map !== null };
        });
        assert.equal(state.background, 0);
        assert(!state.parts.includes('Wall_Front'));
        assert(state.parts.includes('Entrance_Floor') && state.textures);
        assert(await page.evaluate(() => {
            const floor = window.stockWarsApp.homeModelScene.room.getObjectByName('Floor');
            let solid = false;
            floor.traverse(obj => {
                if (obj.isMesh && ![obj.material].flat().some(mat => mat.map)
                    && obj.geometry.attributes.position.count > 24) solid = true;
            });
            return solid;
        }));
        await page.screenshot({ path: 'scratch/home-cement-entry-game.png' });
        const rotation = await page.evaluate(() => window.stockWarsApp.homeModelScene.roomCamera.targetYaw);
        await page.keyboard.press('e');
        await page.waitForTimeout(700);
        assert(await page.evaluate(start => {
            const h = window.stockWarsApp.homeModelScene;
            return Math.abs(h.roomCamera.yaw - start - Math.PI / 2) < .02
                && !h.room.getObjectByName('Wall_Right').visible
                && h.room.getObjectByName('Wall_Front').visible;
        }, rotation));
        await page.screenshot({ path: 'scratch/home-room-rotated.png' });
        const startPosition = await page.evaluate(() => {
            const c = window.stockWarsApp.homeModelScene.controller;
            return { x: c.charPosX, y: c.charPosY };
        });
        await page.keyboard.down('d');
        await page.waitForTimeout(300);
        await page.keyboard.up('d');
        assert(await page.evaluate(start => {
            const c = window.stockWarsApp.homeModelScene.controller;
            const moved = c.charPosY < start.y - 8 && Math.abs(c.charPosX - start.x) < 25;
            c.charPosX = start.x; c.charPosY = start.y;
            return moved;
        }, startPosition));
        await page.keyboard.press('q');
        await page.waitForTimeout(700);
        assert(await page.evaluate(start => Math.abs(window.stockWarsApp.homeModelScene.roomCamera.yaw - start) < .02, rotation));
        // Walk left, then into the wall; the new collision coordinates must stop movement.
        await page.keyboard.down('a');
        await page.waitForTimeout(3000);
        await page.keyboard.up('a');
        assert(await page.evaluate(async () => {
            const { HOME_ROOM_BOUNDS: bounds, HOME_MODEL_SCALE: scale } = await import('/js/data/homeModelRoom.js');
            const minX = (bounds.minX + bounds.wallThickness) * scale + 20;
            const x = window.stockWarsApp.homeModelScene.controller.charPosX;
            return x >= minX && x < minX + 8;
        }));
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.homeModelScene.active);
        assert.equal(await page.locator('#townStageContainer').isVisible(), true);
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.homeModelScene.active);
        await page.keyboard.down('s');
        await page.waitForFunction(() => !window.stockWarsApp.homeModelScene.active, null, { timeout: 10000 });
        await page.keyboard.up('s');
        // Return again, resize and ensure loading/resizing doesn't lose the black background.
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.homeModelScene.active);
        await page.setViewportSize({ width: 900, height: 700 });
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => {
            const home = window.stockWarsApp.homeModelScene;
            return home.renderer.domElement.clientWidth === home.layer.clientWidth;
        }), true);
        await page.screenshot({ path: 'scratch/home-cement-entry-game-small.png' });
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), save);
        assert.deepEqual(errors, []);
        console.log('PASS: F entry, Q/E quarter turns, near-wall hiding, camera-relative movement, black surround, cement texture, wall collision, Escape/entrance exit, repeat entry, resize, saves unchanged, no console errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
