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
    await new Promise(resolve => server.listen(8098, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto('http://127.0.0.1:8098/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount >= 20, null, { timeout: 90000 });
        const save = await page.evaluate(() => JSON.stringify(localStorage));
        await page.keyboard.press('l');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene?.player?.state === 'idle', null, { timeout: 90000 });
        assert(await page.locator('#cipherLobbyStage').isVisible());
        const fixtures = await page.evaluate(async () => {
            const room = window.stockWarsApp.cipherLobbyScene.room;
            const { LOBBY, lobbyCanStand, nearbyLobbyDoor } = await import('/js/data/cipherLobbyRoom.js');
            for (const area of LOBBY.waitingAreas) {
                if (!room.getObjectByName(`waiting-bench-${area.side}`)
                    || !room.getObjectByName(`waiting-planter-${area.side}`)) throw Error('Missing waiting furniture');
                if (lobbyCanStand(area.benchX, area.benchZ) || lobbyCanStand(area.plantX, area.plantZ)) throw Error('Furniture collision missing');
            }
            for (const x of [-450,450]) {
                if (!lobbyCanStand(x,-100) || !nearbyLobbyDoor(x,-100)) throw Error('Door access blocked');
            }
            if (!lobbyCanStand(0,245) || !lobbyCanStand(400,245)) throw Error('Entrance/elevator approach blocked');
            const board = room.userData.marketBoard;
            const { marketEngine } = await import('/js/engine/marketEngine.js');
            const original = [...marketEngine.stocks.values()][0];
            const oldPrice = original.price;
            const oldIndex = Number(board.index.val);
            original.price = oldPrice + 100;
            board.update(performance.now() + 2000);
            const updated = Number(board.index.val) === Number(marketEngine.getCipherIndex().val)
                && Number(board.index.val) !== oldIndex;
            original.price = oldPrice;
            board.lastUpdate = -Infinity;
            board.update(performance.now());
            return { index: Number(board.index.val) === Number(marketEngine.getCipherIndex().val), updated,
                training: !!room.getObjectByName('door-training-panel'),
                competition: !!room.getObjectByName('door-competition-panel'),
                frames: !!room.getObjectByName('door-training-frame') && !!room.getObjectByName('door-competition-frame') };
        });
        assert.deepEqual(fixtures, { index: true, updated: true, training: true, competition: true, frames: true });
        await page.screenshot({ path: 'scratch/cipher-lobby-board-doors.png' });
        const position = () => page.evaluate(() => {
            const s = window.stockWarsApp.cipherLobbyScene;
            return { x: s.controller.charPosX, z: s.controller.charPosY / Math.sin(26 * Math.PI / 180), state: s.player.state };
        });
        await page.keyboard.down('w');
        await page.waitForTimeout(900);
        assert.equal((await position()).state, 'walk');
        await page.evaluate(() => { for (let i=0; i<100; i++) window.stockWarsApp.cipherLobbyScene.update(.05); });
        await page.keyboard.up('w');
        const desk = await position();
        assert(desk.z >= -63 && desk.z < -50, JSON.stringify(desk));
        await page.keyboard.down('d');
        await page.evaluate(() => { for (let i=0; i<40; i++) window.stockWarsApp.cipherLobbyScene.update(.05); });
        await page.keyboard.up('d');
        // Pass between the desk and the new waiting bench before testing the back wall.
        await page.evaluate(() => { window.stockWarsApp.cipherLobbyScene.controller.charPosX = 210; });
        await page.keyboard.down('w');
        await page.evaluate(() => { for (let i=0; i<100; i++) window.stockWarsApp.cipherLobbyScene.update(.05); });
        await page.keyboard.up('w');
        assert((await position()).z >= -358);
        assert((await position()).z < -340);
        await page.keyboard.down('d');
        await page.evaluate(() => { for (let i=0; i<100; i++) window.stockWarsApp.cipherLobbyScene.update(.05); });
        await page.keyboard.up('d');
        assert((await position()).x <= 478);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.cipherLobbyScene.active);
        assert(await page.locator('#townStageContainer').isVisible());
        await page.evaluate(() => {
            const p = window.stockWarsApp.townStage.playerController;
            p.charPosX = 2030; p.charPosY = 1815;
        });
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene.active);
        await page.keyboard.press('1');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene.player.state === 'wave');
        await page.keyboard.down('s');
        await page.waitForFunction(() => !window.stockWarsApp.cipherLobbyScene.active, null, { timeout: 5000 });
        await page.keyboard.up('s');
        assert.deepEqual(await page.evaluate(() => {
            const p = window.stockWarsApp.townStage.playerController;
            return [p.charPosX, p.charPosY];
        }), [2030, 1815]);
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene.active);
        await page.setViewportSize({ width: 900, height: 700 });
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'scratch/cipher-lobby-blockout-small.png' });
        await page.setViewportSize({ width: 500, height: 850 });
        await page.waitForTimeout(300);
        const dimensions = await page.evaluate(() => {
            const s = window.stockWarsApp.cipherLobbyScene;
            return { aspect: s.camera.aspect, width: s.renderer.domElement.getBoundingClientRect().width, height: s.layer.getBoundingClientRect().height, innerWidth };
        });
        assert(Math.abs(dimensions.aspect - dimensions.width / dimensions.height) < .001, JSON.stringify(dimensions));
        assert.equal(dimensions.width, 500, JSON.stringify(dimensions));
        await page.screenshot({ path: 'scratch/cipher-lobby-blockout-portrait.png' });
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), save);
        assert.deepEqual(errors, []);
        console.log('PASS: live game market board, labeled doors, L/F entry, walk animation, desk/wall collision, Escape/mat exit, return position, wave, repeat entry, landscape/portrait resize, saves unchanged, no console errors');
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
