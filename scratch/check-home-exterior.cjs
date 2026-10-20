const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
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
    await new Promise(resolve => server.listen(8108, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto('http://127.0.0.1:8108/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 90000 });
        const save = await page.evaluate(() => JSON.stringify(localStorage));
        const report = await page.evaluate(async () => {
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const THREE = await import('/vendor/three/three.module.js');
            const app = window.stockWarsApp, s = app.townModelScene;
            const definition = TOWN_MODEL_BUILDINGS.find(b => b.id === 'home_office_tower');
            const home = s.scene.getObjectByName(definition.id);
            const box = new THREE.Box3().setFromObject(home);
            const player = app.townStage.playerController;
            player.charPosX = definition.x + (definition.entranceOffsetX || 0);
            player.charPosY = definition.y + 85;
            player.facing = 'up';
            s.draw();
            return { width: box.max.x - box.min.x, materials: definition.nativeMaterials,
                door: !!home.getObjectByName('Home_Arched_Wood_Door'),
                roof: !!home.getObjectByName('Home_Curved_Roof_Base'),
                chimney: !!home.getObjectByName('Home_Chimney_Dark_Cap'),
                roundDoorGlass: !!home.getObjectByName('Home_Door_Round_Window_Glass'),
                plainWalls: !home.getObjectByName('Home_Corner_Stone')
                    && !home.getObjectByName('Home_Front_Foundation_Stone')
                    && !home.getObjectByName('Home_Chimney_Stone_Course'),
                noCanopy: !home.getObjectByName('Home_Curved_Door_Canopy')
                    && !home.getObjectByName('Home_Canopy_Bracket'),
                continuousEaves: !!home.getObjectByName('Home_Continuous_Mitered_Eaves')
                    && !home.getObjectByName('Home_Side_Wood_Eaves'),
                sealedEdges: !!home.getObjectByName('Home_Continuous_Door_Threshold')
                    && !home.getObjectByName('Home_Sealed_Tile_Underside'),
                rear: !!home.getObjectByName('Home_Back_NoWindows'),
                canStand: player.canStand(player.charPosX, player.charPosY),
                blockedInBuilding: !player.canStand(definition.x, definition.y - 80) };
        });
        assert(Math.abs(report.width - 320) < 1);
        for (const key of ['materials', 'door', 'roof', 'chimney', 'roundDoorGlass', 'plainWalls', 'noCanopy', 'continuousEaves', 'sealedEdges', 'rear', 'canStand', 'blockedInBuilding']) assert(report[key], key);
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'scratch/home-single-eaves-game.png' });
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.homeModelScene?.player?.state === 'idle', null, { timeout: 90000 });
        assert(await page.locator('#homeModelStage').isVisible());
        assert.equal(await page.evaluate(() => window.stockWarsApp.homeModelScene.scene.background.getHex()), 0);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.homeModelScene.active);
        await page.keyboard.press('f');
        await page.waitForFunction(() => window.stockWarsApp.homeModelScene.active);
        await page.keyboard.down('s');
        await page.waitForFunction(() => !window.stockWarsApp.homeModelScene.active, null, { timeout: 10000 });
        await page.keyboard.up('s');
        await page.setViewportSize({ width: 900, height: 700 });
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), save);
        assert.deepEqual(errors, []);
        console.log('PASS: native home exterior, width320, front door/roof, windowless rear, town collision, F entry, black interior, Escape and hallway exit, resize, save unchanged, no errors', JSON.stringify(report));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
