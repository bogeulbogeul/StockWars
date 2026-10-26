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
        await page.waitForFunction(()=>window.stockWarsApp.townModelScene.player?.root?.parent
            && window.stockWarsApp.townModelScene.sleepingAnna!==undefined,null,{timeout:90000});
        await page.evaluate(()=>document.body.classList.add('town-model-mode','ui-paused'));
        const report=await page.evaluate(async()=>{
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const THREE=await import('/vendor/three/three.module.js');
            const app=window.stockWarsApp;
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='vivian_store');
            const model=app.townModelScene.scene.getObjectByName(def.id);
            const bounds=new THREE.Box3().setFromObject(model);
            const names=[]; model.traverse(o=>names.push(o.name));
            const fp=app.townModelScene.collisionFootprints.find(b=>b.maxY===def.y && b.minX<def.x && b.maxX>def.x);
            const noOverlap=!app.townModelScene.collisionFootprints.slice(0,TOWN_MODEL_BUILDINGS.length).some(b=>b!==fp
                && b.minX<fp.maxX && b.maxX>fp.minX && b.minY<fp.maxY && b.maxY>fp.minY);
            return {file:def.file,native:def.nativeMaterials,width:bounds.max.x-bounds.min.x,expectedWidth:def.width,
                noOverlap,
                noTimberThreshold:!names.includes('Door_Flush_Threshold'),
                fittedCross:names.includes('Door_Glass_Unified_Fitted_Cross') && !names.some(n=>n.startsWith('Door_Glass_Mullion_')),
                polishedDoor:names.includes('Door_Lower_Panel_Continuous_Moulding')
                    && names.includes('Door_Glass_Continuous_Rebate') && names.includes('Door_Brass_Smooth_Pull'),
                door:names.includes('Central_Arched_Wood_Door'),awning:names.includes('Awning_Stripe'),
                flower:names.includes('Flower_Gold_Center') && names.includes('Flower_Plaque_Wood_Mount'),
                roof:names.some(n=>n.startsWith('Pitched_Coral_Roof')) && names.some(n=>n.startsWith('Coral_Ridge_Cap')),
                frames:names.includes('Door_Continuous_Arch_Frame') && names.includes('Left_Display_Continuous_Frame') && names.includes('Right_Display_Continuous_Frame'),
                stairs:names.includes('Entry_Continuous_Two_Step_Solid'),
                rear:names.includes('Smooth_Cream_Walls_Windowless_Back') && !names.some(n=>n.startsWith('Side_Window')),
                blocked:!app.townStage.playerController.canStand(def.x,def.y)};
        });
        assert.equal(report.file,'VivianStore-clean.glb');
        assert(Math.abs(report.width-report.expectedWidth)<1);
        for(const key of ['native','door','awning','flower','roof','frames','stairs','rear','blocked','noOverlap','polishedDoor','noTimberThreshold','fittedCross']) assert(report[key],key);
        await page.screenshot({path:'output/vivian-flush-entry-v6/game.png'});
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

