const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1500, height: 750 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 90000 });
        const report = await page.evaluate(async () => {
            const THREE = await import('/vendor/three/three.module.js');
            const { GLTFLoader } = await import('/vendor/three/GLTFLoader.js');
            const { TOWN_MODEL_PROPS } = await import('/js/data/townModelProps.js');
            const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
            const { TOWN_BUS_MODEL_SCALE } = await import('/js/data/townObjectScale.js');
            const app = window.stockWarsApp, town = app.townModelScene;
            await town.ready;
            const box = model => new THREE.Box3().setFromObject(model);
            const defs = [...TOWN_MODEL_BUILDINGS, ...TOWN_MODEL_PROPS];
            const sizes = defs.map(d => {
                const b = box(town.scene.getObjectByName(d.id));
                return { id: d.id, file: d.file, width: b.max.x - b.min.x, height: b.max.y - b.min.y, expectedWidth: d.width };
            });
            const stop = town.scene.getObjectByName('village_bus_stop');
            const seat = box(stop.getObjectByName('Bench_Seat'));
            const floor = box(stop.getObjectByName('Smooth_Stone_Platform')).max.y;
            const doors = [];
            for (const d of TOWN_MODEL_BUILDINGS) {
                const root = town.scene.getObjectByName(d.id);
                const nodes = [];
                root.traverse(o => {
                    if (/^(Home_Arched_Wood_Door|Central_Wood_Door|Central_Arched_Wood_Door|Entry_Double_Door_Leaf|Central_Double_Door_Leaf|Double_Arch_Door_Left|Door_Recess_Shadow)$/.test(o.name)) nodes.push(o);
                });
                if (nodes.length) doors.push({ id: d.id, height: box(nodes[0]).getSize(new THREE.Vector3()).y });
            }
            document.body.classList.add('town-model-mode');
            const blocked = TOWN_MODEL_BUILDINGS.map(d => ({ id: d.id,
                frontFree: app.townStage.playerController.canStand(d.x + (d.entranceOffsetX || 0), d.y + 50) }));
            const character = (await new GLTFLoader().loadAsync('/assets/characters/3d/somangi/walk.glb')).scene;
            character.scale.setScalar(100 / 1.95);
            character.position.y = -box(character).min.y;
            const characterHeight = box(character).getSize(new THREE.Vector3()).y;
            const bus = (await new GLTFLoader().loadAsync('/assets/cinematics/bus/Popori-bus-animated.glb')).scene;
            bus.scale.setScalar(TOWN_BUS_MODEL_SCALE);
            bus.updateMatrixWorld(true);
            const busDoor = box(bus.getObjectByName('Door_Leaf')).getSize(new THREE.Vector3()).y;
            // A neutral, shared-ground comparison at the exact game scales.
            const scene = new THREE.Scene(); scene.background = new THREE.Color('#e2e6dd');
            scene.environment = town.scene.environment;
            scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc6cf, .8));
            const sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(-500, 1500, 900); scene.add(sun);
            const entries = [['plaza_bench_west', 150], ['plaza_notice_board', 420], ['village_bus_stop', 770], ['home_garden_tree', 1170], ['bus', 1690], ['plaza_tree', 2330]];
            for (const [id, x] of entries) {
                const model = id === 'bus' ? bus : town.scene.getObjectByName(id).clone(true);
                model.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); });
                model.position.set(x, 0, 0);
                if (id === 'bus') model.rotation.y = Math.PI;
                scene.add(model);
                const c = (await new GLTFLoader().loadAsync('/assets/characters/3d/somangi/walk.glb')).scene;
                c.scale.setScalar(100 / 1.95); c.position.y = -box(c).min.y;
                c.position.x = x - (id === 'plaza_tree' ? 330 : id === 'bus' ? 310 : 150); c.position.z = 70;
                scene.add(c);
            }
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 2000), new THREE.MeshStandardMaterial({ color: '#d8ddcf' }));
            ground.rotation.x = -Math.PI / 2; ground.position.set(1300, -1, 0); scene.add(ground);
            const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(1500, 750);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            const camera = new THREE.OrthographicCamera(-1500, 1500, 750, -750, 1, 6000);
            camera.position.set(1320, 800, 2800); camera.lookAt(1320, 220, 0);
            const overlay = document.createElement('div'); overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#e2e6dd';
            overlay.append(renderer.domElement); document.body.append(overlay);
            renderer.render(scene, camera);
            return { sizes, doors, shelterSeat: seat.max.y - floor, characterHeight, busDoor, blocked };
        });
        for (const s of report.sizes) assert(Math.abs(s.width - s.expectedWidth) < 1, s.id + ' width');
        for (const d of report.doors) assert(Math.abs(d.height - 125) < .2, d.id + ' door clearance');
        assert(Math.abs(report.shelterSeat - 32) < .2, 'shelter seat');
        assert(Math.abs(report.busDoor - 140) < .2, 'bus door');
        assert(report.blocked.every(d => d.frontFree), 'building approaches blocked: ' + JSON.stringify(report.blocked.filter(d => !d.frontFree)));
        assert.deepEqual(errors, []);
        fs.mkdirSync('output/town-somangi-scale-v1', { recursive: true });
        fs.writeFileSync('output/town-somangi-scale-v1/verification.json', JSON.stringify(report, null, 2));
        await page.screenshot({ path: 'output/town-somangi-scale-v1/comparison.png', clip: { x: 0, y: 80, width: 1050, height: 340 } });
        console.log('PASS: model widths, door clearances, bench seats, bus door and accessible building approaches');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
