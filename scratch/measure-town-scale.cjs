const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('web');
const server = http.createServer((req, res) => {
    if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><body>'); }
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage();
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        const report = await page.evaluate(async () => {
            const THREE = await import('/vendor/three/three.module.js');
            const { GLTFLoader } = await import('/vendor/three/GLTFLoader.js');
            const { TOWN_MODEL_BUILDINGS, modelAssetUrl } = await import('/js/data/townModelBuildings.js');
            const { TOWN_MODEL_PROPS, propAssetUrl } = await import('/js/data/townModelProps.js');
            const loader = new GLTFLoader();
            const defs = [...TOWN_MODEL_BUILDINGS.map(d => ({ ...d, url: modelAssetUrl(d.file) })),
                ...TOWN_MODEL_PROPS.slice(0, 11).map(d => ({ ...d, url: propAssetUrl(d.file) })),
                { id: 'bus', url: '/assets/cinematics/bus/Popori-bus-animated.glb', width: 0 }];
            return Promise.all(defs.map(async d => {
                const model = (await loader.loadAsync(d.url)).scene;
                model.rotation.y = d.rotation || 0;
                model.updateMatrixWorld(true);
                const bounds = new THREE.Box3().setFromObject(model);
                const size = bounds.getSize(new THREE.Vector3());
                const scale = d.width ? d.width / size.x : 50;
                const parts = [];
                model.traverse(o => {
                    if (!o.isMesh || !/door|entry.*frame|seat.*slat|bench.*seat|seat.*plank|shelter.*post/i.test(o.name)) return;
                    const box = new THREE.Box3().setFromObject(o);
                    const s = box.getSize(new THREE.Vector3());
                    parts.push({ name: o.name, width: s.x, height: s.y, depth: s.z, minY: box.min.y, maxY: box.max.y });
                });
                return { id: d.id, width: d.width, rawSize: size.toArray(), scale, height: size.y * scale, parts };
            }));
        });
        fs.mkdirSync('output/town-somangi-scale-v1', { recursive: true });
        fs.writeFileSync('output/town-somangi-scale-v1/before.json', JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report.map(r => ({ id:r.id, height:r.height, parts:r.parts.filter(p=>p.height>.6 || /seat/i.test(p.name)).map(p=>({name:p.name,height:p.height*r.scale,width:p.width*r.scale})) }))));
    } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
