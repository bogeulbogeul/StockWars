const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('web'), out = path.resolve(process.env.SOMANGI_WALK_PREVIEW_DIR || 'output/somangi-walk-height-fixed-preview');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
    if (req.url === '/check') { res.setHeader('Content-Type', 'text/html'); return res.end('<body style="margin:0"></body>'); }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => { if (error) return res.writeHead(404).end(); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); res.end(data); });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 420, height: 500 }, deviceScaleFactor: 1 });
        await page.goto(`http://127.0.0.1:${server.address().port}/check`);
        await page.evaluate(async modelName => {
            const THREE = await import('/vendor/three/three.module.js');
            const { loadSomangi } = await import('/js/components/town3d/SomangiAssets.js');
            const { model, animations } = await loadSomangi(modelName);
            const scene = new THREE.Scene(); scene.background = new THREE.Color(0x999999); scene.add(model);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2));
            const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(3, 5, 4); scene.add(light);
            const camera = new THREE.OrthographicCamera(-1.008, 1.008, 1.2, -1.2, .1, 20);
            const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            renderer.setSize(420, 500); renderer.toneMapping = THREE.ACESFilmicToneMapping;
            document.body.append(renderer.domElement);
            const mixer = new THREE.AnimationMixer(model), action = mixer.clipAction(animations[0]);
            action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
            window.drawSomangi = (time, view) => {
                mixer.setTime(time); model.updateMatrixWorld(true);
                const positions = { front: [0, 0, 6], side: [6, 0, 0], back: [0, 0, -6], 'opposite-side': [-6, 0, 0] };
                camera.position.set(...positions[view]);
                camera.lookAt(0, 0, 0); renderer.render(scene, camera);
            };
        }, process.env.SOMANGI_PREVIEW_MODEL || 'walk');
        for (const view of (process.env.SOMANGI_WALK_VIEWS || 'front,side').split(',')) {
            const directory = path.join(out, view); fs.mkdirSync(directory, { recursive: true });
            for (let i = 0; i < 30; i++) {
                await page.evaluate(({ time, view }) => window.drawSomangi(time, view), { time: i / 40, view });
                await page.screenshot({ path: path.join(directory, `${String(i).padStart(2, '0')}.png`) });
            }
        }
        console.log(`Rendered actual game ${process.env.SOMANGI_PREVIEW_MODEL || 'walk'}.glb: 30 frames per view, 0.75 seconds, fixed camera and scale`);
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
