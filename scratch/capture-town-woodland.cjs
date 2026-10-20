const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve(process.argv[3] || 'output/town-cozy-layout-v2');
fs.mkdirSync(output, { recursive: true });
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
    await new Promise(resolve => server.listen(8117, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 2000, height: 1600 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
            if (response.status() >= 400 && /\/assets\//.test(response.url())) errors.push(response.url());
        });
        await page.goto('http://127.0.0.1:8117/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden,
            null, { timeout: 90000 });
        if (process.argv[4] === 'player') {
            await page.setViewportSize({ width: 1440, height: 1000 });
            const viewpoints = process.argv[5] === 'boundary'
                ? [['boundary-west', 650, 1450], ['boundary-north', 1750, 800]]
                : [['bus-stop', 1240, 2310], ['popori-tree', 1660, 1440]];
            for (const [name, x, y] of viewpoints) {
                await page.evaluate(({ x, y }) => {
                    const app = window.stockWarsApp;
                    const controller = app.townStage.playerController;
                    controller.keysHeld.clear();
                    controller.charPosX = x;
                    controller.charPosY = y;
                    controller.facing = 'down';
                    controller.updateCamera(app.townStage.viewportEl.clientWidth,
                        app.townStage.viewportEl.clientHeight, 0, true);
                    app.townModelScene.draw();
                }, { x, y });
                await page.waitForTimeout(350);
                await page.screenshot({ path: path.join(output, `player-${name}.png`) });
            }
            assert.deepEqual(errors, []);
            console.log(JSON.stringify({ mode: 'normal player camera', output, errors }));
            return;
        }
        const report = await page.evaluate(async () => {
            const THREE = await import('/vendor/three/three.module.js');
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const { TOWN_MODEL_PROPS } = await import('/js/data/townModelProps.js');
            const { TOWN_BOUNDARY_PROPS } = await import('/js/data/townBoundaryProps.js');
            const { TOWN_BUS_ROAD, TOWN_BUS_ROUTE } = await import('/js/data/townBusRoad.js');
            const { GROUND_PROJECTION } = await import('/js/data/townModelBuildings.js');
            const { TOWN_ARRIVAL } = await import('/js/data/townLandscapeLayout.js');
            const scene = window.stockWarsApp.townModelScene;
            const buildings = TOWN_MODEL_BUILDINGS.map(def => ({ id: def.id, file: def.file,
                loaded: !!scene.scene.getObjectByName(def.id) }));
            const trees = TOWN_BOUNDARY_PROPS.map(def => ({ id: def.id,
                loaded: !!scene.scene.getObjectByName(def.id) }));
            const definitions = [...TOWN_MODEL_BUILDINGS, ...TOWN_MODEL_PROPS];
            const bounds = new THREE.Box3();
            for (const def of definitions) bounds.expandByObject(scene.scene.getObjectByName(def.id));
            bounds.expandByPoint(new THREE.Vector3(bounds.min.x, 0,
                (TOWN_BUS_ROAD.centerY + TOWN_BUS_ROAD.width / 2 + 100) / GROUND_PROJECTION));
            const roadNearEdge = TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 2 - TOWN_BUS_ROAD.shoulder;
            const roadClear = definitions.every(def => {
                const box = new THREE.Box3().setFromObject(scene.scene.getObjectByName(def.id));
                const limit = def.id === 'village_bus_stop'
                    ? TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 2 + 0.1 : roadNearEdge;
                return box.max.z * GROUND_PROJECTION < limit;
            });
            const controller = window.stockWarsApp.townStage.playerController;
            const step = 20, queue = [[TOWN_ARRIVAL.x, TOWN_ARRIVAL.y]], visited = new Set();
            for (let cursor = 0; cursor < queue.length; cursor++) {
                const [x, y] = queue[cursor];
                for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
                    const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
                    if (visited.has(key) || !controller.canStand(nx, ny)) continue;
                    visited.add(key); queue.push([nx, ny]);
                }
            }
            const entrancesReachable = TOWN_MODEL_BUILDINGS.every(def => queue.some(([x, y]) =>
                Math.abs(x - def.x - (def.entranceOffsetX || 0)) < 25 && Math.abs(y - def.y - 75) < 25));
            // Capture-only survey camera. Normal gameplay camera stays unchanged.
            scene.draw = () => {};
            scene.player.root.visible = false;
            const center = bounds.getCenter(new THREE.Vector3());
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 30000);
            camera.position.copy(center).add(new THREE.Vector3(0, 7500, 8500));
            camera.lookAt(center);
            camera.updateMatrixWorld(true);
            const projected = new THREE.Box3();
            for (const x of [bounds.min.x, bounds.max.x])
                for (const y of [bounds.min.y, bounds.max.y])
                    for (const z of [bounds.min.z, bounds.max.z])
                        projected.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
            const width = projected.max.x - projected.min.x;
            const height = projected.max.y - projected.min.y;
            const halfHeight = Math.max(height / 2, width / 2 / (2000 / 1600)) * 1.05;
            camera.left = -halfHeight * 1.25;
            camera.right = halfHeight * 1.25;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
            camera.updateProjectionMatrix();
            scene.landscape.center.value = -100000; // Flatten presentation-only horizon bend for survey.
            scene.landscape.playerShadow.visible = false;
            scene.renderer.setPixelRatio(1);
            scene.renderer.setSize(2000, 1600);
            scene.renderer.render(scene.scene, camera);
            const pixels = scene.renderer.domElement.toDataURL('image/png');
            const frame = new THREE.Frustum().setFromProjectionMatrix(
                new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            return { buildings, trees, props: TOWN_MODEL_PROPS.length, roadClear, entrancesReachable,
                busRoute: TOWN_BUS_ROUTE, road: TOWN_BUS_ROAD,
                buildingsInFrame: TOWN_MODEL_BUILDINGS.every(def => frame.containsPoint(
                    new THREE.Box3().setFromObject(scene.scene.getObjectByName(def.id)).getCenter(new THREE.Vector3()))),
                loadedCount: scene.loadedCount, pixels };
        });
        assert.equal(report.buildings.length, 9);
        assert(report.buildings.every(item => item.loaded));
        assert(report.trees.every(item => item.loaded));
        assert(report.buildingsInFrame);
        assert(report.roadClear, 'Road and shoulders must be clear of all model bounds');
        assert(report.entrancesReachable, 'All nine model entrances must be reachable');
        assert.equal(report.loadedCount, 9 + report.props);
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'actual-game-overview.png'), Buffer.from(report.pixels.split(',')[1], 'base64'));
        delete report.pixels;
        fs.writeFileSync(path.join(output, 'validation.json'), JSON.stringify({ ...report, errors }, null, 2));
        console.log(JSON.stringify({ buildings: 9, boundaryTrees: report.trees.length,
            props: report.props, loaded: report.loadedCount, errors, output }));
    } finally {
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
