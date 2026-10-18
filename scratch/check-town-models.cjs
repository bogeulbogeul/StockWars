const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, process.env.CHECK_GAME_ROOT || '../web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8096, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1600, height: 1080 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto('http://127.0.0.1:8096/');
        const expectedModels = await page.evaluate(async () => {
            const [{ TOWN_MODEL_BUILDINGS }, { TOWN_MODEL_PROPS }] = await Promise.all([
                import('/js/data/townModelBuildings.js'), import('/js/data/townModelProps.js')
            ]);
            return TOWN_MODEL_BUILDINGS.length + TOWN_MODEL_PROPS.length;
        });
        await page.waitForFunction(count => window.stockWarsApp?.townModelScene?.loadedCount === count, expectedModels, { timeout: 90000 });
        if (process.env.AUDIT_MATERIALS === '1') await require('./audit-building-materials.cjs')(page);
        await page.waitForTimeout(1500);
        if (process.env.CHECK_LAYOUT === '1') await require('./audit-village-paths.cjs')(page);
        if (process.env.CHECK_LANDSCAPE === '1') {
            assert.equal(await page.evaluate(() => {
                const scene = window.stockWarsApp.townModelScene;
                return !!scene.landscape && scene.scene.background.isTexture
                    && !!scene.scene.getObjectByName('village-grass-ground')
                    && scene.landscape.pathsMap.isTexture;
            }), true);
            await page.screenshot({ path: 'scratch/town-landscape-player.png' });
            const position = await page.evaluate(() => {
                const player = window.stockWarsApp.townStage.playerController;
                return { x: player.charPosX, y: player.charPosY };
            });
            for (const [x, y] of [[1250, 600], [1150, 1950]]) {
                await page.evaluate(({ x, y }) => {
                    const scene = window.stockWarsApp.townModelScene;
                    scene.town.playerController.charPosX = x;
                    scene.town.playerController.charPosY = y;
                    scene.draw();
                }, { x, y });
                await page.waitForTimeout(100);
                assert.equal(await page.evaluate(() => {
                    const scene = window.stockWarsApp.townModelScene;
                    return Number.isFinite(scene.landscape.center.value)
                        && scene.landscape.ground.position.z === scene.landscape.center.value;
                }), true);
            }
            await page.evaluate(({ x, y }) => {
                const scene = window.stockWarsApp.townModelScene;
                scene.town.playerController.charPosX = x;
                scene.town.playerController.charPosY = y;
                scene.draw();
            }, position);
        }
        const playerState = await page.evaluate(() => {
            const scene = window.stockWarsApp.townModelScene;
            const state = scene.player?.state;
            const controller = scene.town.playerController;
            controller.updateCamera(scene.viewport.clientWidth, scene.viewport.clientHeight, 0, true);
            scene.previewCameraOrigin = { x: controller.cameraX, y: controller.cameraY };
            if (scene.player) scene.player.state = 'loading';
            scene.draw();
            return state;
        });
        await page.screenshot({ path: 'scratch/town-camera-ui-paused.png' });
        await page.evaluate(state => {
            const scene = window.stockWarsApp.townModelScene;
            if (scene.player) scene.player.state = state;
            scene.draw();
        }, playerState);
        if (process.env.COMPARE_MATERIALS === '1') {
            await page.evaluate(() => {
                window.stockWarsApp.townModelScene.scene.traverse(object => {
                    if (!object.isMesh) return;
                    for (const material of [object.material].flat()) material.normalScale?.set(0, 0);
                });
            });
            await page.waitForTimeout(200);
            await page.screenshot({ path: 'scratch/town-normal-disabled.png' });
            await page.evaluate(async () => {
                const THREE = await import('/vendor/three/three.module.js');
                window.stockWarsApp.townModelScene.scene.traverse(object => {
                    if (!object.isMesh) return;
                    object.material = new THREE.MeshBasicMaterial({ map: object.material.map,
                        color: object.material.color, side: object.material.side, toneMapped: false });
                });
            });
            await page.waitForTimeout(200);
            await page.screenshot({ path: 'scratch/town-base-color.png' });
        }
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.loadedCount), expectedModels);
        assert.equal(await page.locator('button:visible').count(), 0);
        assert.equal(await page.locator('.town-model-layer').isVisible(), true);
        assert.equal(await page.evaluate(() => window.stockWarsApp.townModelScene.camera.isPerspectiveCamera), true);
        await page.keyboard.press('f');
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('dialog[open]').count(), 0);
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => {
            const scene = window.stockWarsApp.townModelScene;
            return scene.width === scene.viewport.clientWidth && scene.height === scene.viewport.clientHeight;
        }), true);
        const movement = await page.evaluate(() => {
            const scene = window.stockWarsApp.townModelScene;
            const player = scene.town.playerController;
            scene.draw();
            const before = scene.camera.position.x;
            const coordinate = scene.player && scene.player.state !== 'loading' ? 'charPosX' : 'cameraX';
            player[coordinate] += 100;
            scene.draw();
            const delta = scene.camera.position.x - before;
            player[coordinate] -= 100;
            scene.draw();
            return delta;
        });
        assert.ok(Math.abs(movement - 100) < 0.01);
        await page.evaluate(() => window.stockWarsApp.enterOffice());
        assert.equal(await page.locator('.town-model-layer').isVisible(), false);
        await page.evaluate(() => window.stockWarsApp.townStage.show({ name: '검수', ping: null }));
        assert.equal(await page.locator('.town-model-layer').isVisible(), true);
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log(`PASS: automatic town view, hidden UI, perspective camera, safe shortcuts, ${expectedModels} scene objects, resize, camera synchronization, office/town round trip.`);
        console.log(JSON.stringify(await page.evaluate(() => {
            const scene = window.stockWarsApp.townModelScene;
            return { loaded: scene.loadedCount, models: scene.scene.children.filter(c => c.name).map(c => c.name),
                canvas: [scene.width, scene.height], statusHidden: scene.status.hidden };
        })));
        console.log(JSON.stringify({ errors }));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
