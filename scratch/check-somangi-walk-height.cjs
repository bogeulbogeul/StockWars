const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/check') { res.setHeader('Content-Type', 'text/html'); return res.end('<body style="margin:0;background:#aaa"></body>'); }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => { if (error) return res.writeHead(404).end(); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); res.end(data); });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 500, height: 500 } });
        await page.goto(`http://127.0.0.1:${server.address().port}/check`);
        const report = await page.evaluate(async () => {
            const THREE = await import('/vendor/three/three.module.js');
            const { loadSomangi } = await import('/js/components/town3d/SomangiAssets.js');
            const { model, animations } = await loadSomangi('walk');
            const mixer = new THREE.AnimationMixer(model), action = mixer.clipAction(animations[0]);
            action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
            const meshes = []; model.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
            const frames = [], points = [];
            for (let frame = 0; frame <= 60; frame++) {
                mixer.setTime(frame / 80); model.updateMatrixWorld(true);
                const bounds = new THREE.Box3(), snapshot = [];
                for (const mesh of meshes) {
                    mesh.skeleton.update(); mesh.computeBoundingBox(); bounds.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
                    for (let i = 0; i < mesh.geometry.attributes.position.count; i += 113) {
                        const v = new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i);
                        mesh.applyBoneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); snapshot.push(v.x, v.y, v.z);
                    }
                }
                frames.push({ height: bounds.max.y - bounds.min.y, floor: bounds.min.y }); points.push(snapshot);
            }
            const heights = frames.map(f => f.height), floors = frames.map(f => f.floor);
            const scene = new THREE.Scene(); scene.background = new THREE.Color(0xaaaaaa); scene.add(model);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2));
            const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-3, 5, 4); scene.add(light);
            const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, .1, 20);
            camera.position.set(2, 1.2, 6); camera.lookAt(0, 0, 0);
            const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(500, 500);
            renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.append(renderer.domElement);
            mixer.setTime(.1875); model.updateMatrixWorld(true); renderer.render(scene, camera);
            return { frames: frames.length, heightMin: Math.min(...heights), heightMax: Math.max(...heights),
                floorRange: Math.max(...floors) - Math.min(...floors), loopError: Math.max(...points[0].map((v, i) => Math.abs(v - points.at(-1)[i]))) };
        });
        assert.ok(report.heightMax - report.heightMin < .025, JSON.stringify(report));
        assert.ok(report.floorRange < .001, JSON.stringify(report));
        assert.ok(report.loopError < .00001, JSON.stringify(report));
        await page.screenshot({ path: 'output/somangi-game-v1/walk-height-fixed.png' });
        console.log('PASS', root, report);
        fs.writeFileSync(`output/somangi-game-v1/${root.includes('resources') ? 'runtime' : 'web'}-walk-height.json`, JSON.stringify(report, null, 2));
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
