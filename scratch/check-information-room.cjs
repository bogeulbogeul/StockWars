const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/information-map-insert-v2');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css',
            '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        const approach = async () => {
            await page.evaluate(async () => {
                const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
                const b = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
                const c = window.stockWarsApp.townStage.playerController;
                c.charPosX = b.x; c.charPosY = b.y + 70; c.keysHeld.clear();
                document.activeElement?.blur();
            });
            await page.waitForTimeout(100);
            await page.keyboard.press('f');
            await page.waitForFunction(() => window.stockWarsApp.informationModelScene?.active);
            await page.evaluate(() => window.stockWarsApp.informationModelScene.ready);
            await page.waitForTimeout(150);
        };
        await approach();
        const report = await page.evaluate(async () => {
            const app = window.stockWarsApp, room = app.informationModelScene;
            const { informationCanStand: canStand } = await import('/js/data/informationModelRoom.js');
            const map = room.scene.getObjectByName('Popori_Colored_Pencil_Map_No_Text');
            let texture = false;
            map?.traverse(o => { if (o.material?.map?.image?.width > 1000) texture = true; });
            const queue = [[0, 235]], seen = new Set(['0,235']);
            for (let index = 0; index < queue.length; index++) {
                const [x, z] = queue[index];
                for (const [dx, dz] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
                    const nx = x + dx, nz = z + dz, key = `${nx},${nz}`;
                    if (seen.has(key) || !canStand(nx, nz)) continue;
                    seen.add(key); queue.push([nx, nz]);
                }
            }
            return { active: room.active, map: !!map, texture,
                noStagedVisitor: !room.scene.getObjectByName('Somangi_Visitor_Seated_Preview'),
                mapReachable: queue.some(([x, z]) => Math.abs(x + 280) < 20 && Math.abs(z - 95) < 20),
                spawnClear: canStand(0, 235), wallBlocked: !canStand(395, 100),
                furnitureBlocked: !canStand(0, -95), townHidden: app.townStage.containerEl.classList.contains('hidden') };
        });
        for (const [key, value] of Object.entries(report)) assert(value, key);
        await page.screenshot({ path: path.join(output, 'game-interior.png') });
        await page.keyboard.down('a');
        await page.waitForTimeout(300);
        await page.keyboard.up('a');
        assert(await page.evaluate(() => window.stockWarsApp.informationModelScene.controller.charPosX < -10));
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.informationModelScene.active);
        assert(await page.evaluate(async () => {
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const b = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
            const app = window.stockWarsApp, c = app.townStage.playerController;
            return !app.townStage.containerEl.classList.contains('hidden') && c.charPosX === b.x && c.charPosY === b.y + 85;
        }));
        await approach();
        await page.setViewportSize({ width: 780, height: 1050 });
        await page.waitForTimeout(200);
        assert(await page.locator('#informationModelStage canvas').isVisible());
        await page.screenshot({ path: path.join(output, 'game-interior-portrait.png') });
        await page.evaluate(async () => {
            const { GROUND_PROJECTION } = await import('/js/data/townModelBuildings.js');
            const s = window.stockWarsApp.informationModelScene;
            s.controller.charPosX = 0; s.controller.charPosY = 320 * GROUND_PROJECTION; s.update(.016);
        });
        await page.waitForFunction(() => !window.stockWarsApp.informationModelScene.active);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'game-validation.json'), JSON.stringify({ ...report,
            movement: true, escapeReturn: true, reentry: true, automaticExit: true, resize: true, errors }, null, 2));
        console.log('PASS', JSON.stringify({ ...report, errors, root }));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
