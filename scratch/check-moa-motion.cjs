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
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8113, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
        const errors = [], failures = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) failures.push(r.url()); });
        await page.goto('http://127.0.0.1:8113/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.sleepingAnna, null, { timeout: 90000 });
        const report = await page.evaluate(async () => {
            const town = window.stockWarsApp.townModelScene;
            await town.ready;
            // Pause the town draw loop to sample authored bone motion deterministically.
            town.arrivalActive = true;
            const anna = town.sleepingAnna, model = anna.model;
            const p = model.position;
            const far = { x: p.x + 500, z: p.z + 500 };
            anna.update(0, far);
            const sleepingMap = model.getObjectByName('Somangi_Body').material.map;
            const head = model.getObjectByName('Head');
            const start = head.quaternion.clone();
            for (let i = 0; i < 20; i++) anna.update(.1, far);
            const nodAngle = start.angleTo(head.quaternion);
            for (let i = 0; i < 20; i++) anna.update(.1, far);
            const loopError = start.angleTo(head.quaternion);
            const asleep = model.userData.moaState;
            anna.update(0, { x: p.x + 80, z: p.z });
            const awake = model.userData.moaState;
            const faceChanged = model.getObjectByName('Somangi_Body').material.map !== sleepingMap;
            const sleepHidden = !town.scene.getObjectByName('anna-sleep-indicator').visible;
            anna.update(0, { x: p.x + 150, z: p.z });
            const hysteresis = model.userData.moaState;
            anna.update(0, far);
            const restored = model.getObjectByName('Somangi_Body').material.map === sleepingMap;
            const THREE = await import('/vendor/three/three.module.js');
            const seat = town.scene.getObjectByName('village_bus_stop').getObjectByName('Bench_Seat');
            const bounds = new THREE.Box3().setFromObject(seat);
            const seatError = Math.abs(model.position.y - bounds.max.y);
            // Isolated live game renderer: same GLB, material maps and action mixer.
            const preview = new THREE.Scene();
            preview.background = new THREE.Color('#9daea3');
            preview.environment = town.scene.environment;
            preview.add(new THREE.HemisphereLight(0xffffff, 0x8b8171, 2));
            preview.add(model);
            const camera = new THREE.PerspectiveCamera(35, 1, .1, 1000);
            camera.position.set(p.x + 30, p.y + 65, p.z + 240);
            camera.lookAt(p.x, p.y + 36, p.z);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(600, 600);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:999999';
            document.body.replaceChildren(renderer.domElement);
            renderer.render(preview, camera);
            window.moaPreview = { anna, model, preview, camera, renderer };
            return { nodAngle, loopError, asleep, awake, faceChanged, sleepHidden,
                hysteresis, restored, seatError, state: model.userData.moaState };
        });
        assert(report.nodAngle > .1, JSON.stringify(report));
        assert(report.loopError < .001, JSON.stringify(report));
        assert.equal(report.asleep, 'doze');
        assert.equal(report.awake, 'smile');
        assert.equal(report.hysteresis, 'smile');
        assert.equal(report.state, 'doze');
        assert(report.faceChanged && report.sleepHidden && report.restored);
        assert(report.seatError < .001);
        await page.screenshot({ path: 'scratch/moa-game-doze.png' });
        await page.evaluate(() => {
            const { anna, model, renderer, preview, camera } = window.moaPreview;
            anna.update(0, model.position);
            renderer.render(preview, camera);
        });
        await page.screenshot({ path: 'scratch/moa-game-smile.png' });
        assert.deepEqual(errors, []);
        assert.deepEqual(failures, []);
        console.log('PASS', JSON.stringify({ root, ...report, errors, failures }));
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; server.close(); });
