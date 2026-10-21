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
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='claire_apparel');
            const model=app.townModelScene.scene.getObjectByName(def.id);
            const bounds=new THREE.Box3().setFromObject(model);
            const names=[]; model.traverse(o=>names.push(o.name));
            return {file:def.file,native:def.nativeMaterials,width:bounds.max.x-bounds.min.x,
                door:names.includes('Entry_Double_Door_Leaf'),awning:names.some(n=>n.startsWith('Pink_Striped_Awning')),
                sign:names.includes('Boutique_Single_Wood_Frame') && names.includes('Boutique_Rounded_Hanger') && names.includes('Boutique_Smooth_Hook') && names.includes('Boutique_Continuous_Brass_Inlay'),
                flower:names.includes('Cream_Hanger_Medallion') && !names.some(n=>n.startsWith('Coin_Sprout_Leaf') || n.startsWith('Sprout_Stem')),rear:names.includes('Smooth_Walls_Windowless_Back'),
                smallWindowsRemoved:!names.some(n=>n.startsWith('Front_Left_Window') || n.startsWith('Right_Side_Window')),
                showroom:names.includes('Front_Window_Glass'),
                joinedCross:names.filter(n=>n.startsWith('Window_Unified_Cross')).length===2 && !names.some(n=>n.startsWith('Window_Cross_')),
                sideSignRemoved:!names.some(n=>/^(Sign_Wall_Mount|Sign_Bracket|Hanging_Wood_Sign|Hanger_Triangle|Hanger_Hook)/.test(n)),
                lowerStep:names.includes('Entry_Lower_Step'),
                postFeetRestored:names.filter(n=>n.startsWith('Pilaster_Foot')).length===4,
                blocked:!app.townStage.playerController.canStand(def.x,def.y-80)};
        });
        assert.equal(report.file,'ClothingStore-clean.glb');
        assert(Math.abs(report.width-340)<1);
        for(const key of ['native','door','awning','sign','flower','rear','blocked','smallWindowsRemoved','showroom','joinedCross','sideSignRemoved','postFeetRestored','lowerStep']) assert(report[key],key);
        await page.screenshot({path:'output/clothing-exterior-clean-v1/game.png'});
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});



