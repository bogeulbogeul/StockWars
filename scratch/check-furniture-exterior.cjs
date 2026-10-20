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
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.goto('http://127.0.0.1:8108/');
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.status.hidden,null,{timeout:90000});
        const report=await page.evaluate(async()=>{
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const THREE=await import('/vendor/three/three.module.js');
            const app=window.stockWarsApp;
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='julian_furniture');
            const model=app.townModelScene.scene.getObjectByName(def.id);
            const bounds=new THREE.Box3().setFromObject(model);
            const names=[]; model.traverse(o=>names.push(o.name));
            return {file:def.file,native:def.nativeMaterials,width:bounds.max.x-bounds.min.x,
                door:names.includes('Entry_Double_Door_Leaf'),awning:names.includes('Chair_House_Plaque'),
                flower:names.includes('Chair_House_Plaque') && !names.some(n=>n.startsWith('Coin_Sprout_Leaf') || n.startsWith('Sprout_Stem')),rear:names.includes('Main_Rear_NoWindows_Gable'),
                smallWindowsRemoved:!names.some(n=>n.startsWith('Front_Left_Window') || n.startsWith('Right_Side_Window')),
                showroom:names.includes('Showroom_Inset_Blue_Glass'),
                lowerStep:names.includes('Entry_Lower_Step'),
                postFeetRestored:names.filter(n=>n.startsWith('Post_Smooth_Foot')).length===5,
                blocked:!app.townStage.playerController.canStand(def.x,def.y-80)};
        });
        assert.equal(report.file,'Furniture-clean.glb');
        assert(Math.abs(report.width-448.5)<1);
        for(const key of ['native','door','awning','flower','rear','blocked','smallWindowsRemoved','showroom','postFeetRestored','lowerStep']) assert(report[key],key);
        await page.screenshot({path:'output/furniture-exterior-clean-v1/game.png'});
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


