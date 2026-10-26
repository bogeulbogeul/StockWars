const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('web'), out = path.resolve('output/somangi-jump-v1'); fs.mkdirSync(out, { recursive: true });
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
        await page.evaluate(async () => {
            const THREE = await import('/vendor/three/three.module.js');
            const { SomangiPlayer } = await import('/js/components/town3d/SomangiPlayer.js');
            const scene = new THREE.Scene(); scene.background = new THREE.Color(0x999999);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2));
            const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(300, 500, 400); scene.add(light);
            const camera = new THREE.OrthographicCamera(-63, 63, 75, -75, .1, 2000);
            const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(420, 500);
            renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.append(renderer.domElement);
            const ground = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-200, -.2, 0), new THREE.Vector3(200, -.2, 0), new THREE.Vector3(0, -.2, -200), new THREE.Vector3(0, -.2, 200)]);
            scene.add(new THREE.LineSegments(ground, new THREE.LineBasicMaterial({ color: 0x777777 })));
            const controller = { keysHeld: new Set(), facing: 'down', renderPosition: { x: 0, y: 0 } };
            const player = new SomangiPlayer(scene, { playerController: controller, callbacks: { isInputBlocked: () => false } }, document.body);
            await player.ready;
            window.drawJump = (time, view) => {
                player.setState('idle'); player.play('jump');
                for (let t = 0; t < time - 1e-8; t += .025) player.update(Math.min(.025, time - t));
                camera.position.set(view === 'front' ? 0 : 600, 60, view === 'front' ? 600 : 0); camera.lookAt(0, 60, 0);
                renderer.render(scene, camera);
            };
        });
        for (const view of ['front', 'side']) {
            const directory = path.join(out, view); fs.mkdirSync(directory, { recursive: true });
            for (let i = 0; i < 36; i++) {
                await page.evaluate(({ time, view }) => window.drawJump(time, view), { time: i / 40, view });
                await page.screenshot({ path: path.join(directory, `${String(i).padStart(2, '0')}.png`) });
            }
        }
        console.log('Rendered actual SomangiPlayer jump: 36 frames per view');
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
