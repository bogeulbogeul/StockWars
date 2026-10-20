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
    await new Promise(resolve => server.listen(8109, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.goto('http://127.0.0.1:8109/');
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.status.hidden,null,{timeout:90000});
        const report=await page.evaluate(async()=>{
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const THREE=await import('/vendor/three/three.module.js');
            const app=window.stockWarsApp;
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='data_ink_bookstore');
            const model=app.townModelScene.scene.getObjectByName(def.id);
            const bounds=new THREE.Box3().setFromObject(model);
            const names=[]; model.traverse(o=>names.push(o.name));
            return {file:def.file,native:def.nativeMaterials,width:bounds.max.x-bounds.min.x,
                roof:names.some(n=>n.startsWith('Smooth_Plum_Tile')),
                books:names.filter(n=>n.startsWith('Front_Sign_Book_Relief')).length===6 && names.some(n=>n.startsWith('Front_Sign_Page_Engraving')),
                sign:names.includes('Side_Sign_Rounded_Wood_Frame') && names.some(n=>n.startsWith('Side_Sign_Page_Engraving')),
                side:names.includes('Right_Side_Window_Glass'),
                steps:names.includes('Entry_Upper_Step') && names.includes('Entry_Lower_Step') && names.includes('Entry_Flush_Threshold'),
                door:names.includes('Door_Continuous_Arch_Surround') && names.includes('Door_Arched_Glass_Bead') && names.includes('Door_Lower_Recessed_Panel') && names.includes('Door_Brass_Curved_Pull') && !names.includes('Door_Brass_Knob'),
                sideFinish:names.includes('Side_Window_Continuous_Arch_Frame') && names.includes('Side_Window_Inset_Rebate') && names.includes('Side_Window_Unified_Cross') && !names.some(n=>/^Side_Window_Cross_/.test(n)),
                sillRemoved:!names.some(n=>/Display_(Rounded_Sill|Sill_Lower_Lip)/.test(n)),
                highlightsRemoved:!names.some(n=>n.startsWith('Display_Glass_Soft_Highlight')),
                window:names.includes('Display_Continuous_Timber_Frame') && names.includes('Display_Inner_Rebate') && names.includes('Display_Recessed_Glass') && names.filter(n=>n.startsWith('Display_Book_Bound_Spine')).length===3 && names.filter(n=>n.startsWith('Display_Book_Gilt_Diamond')).length===3,
                rear:names.includes('Windowless_Rear_Walls'),
                blocked:!app.townStage.playerController.canStand(def.x,def.y-80)};
        });
        assert.equal(report.file,'Bookstore-clean.glb');
        assert(Math.abs(report.width-350)<1);
        for(const key of ['native','roof','books','sign','door','steps','side','sideFinish','window','sillRemoved','highlightsRemoved','rear','blocked']) assert(report[key],key);
        await page.screenshot({path:'output/bookstore-exterior-clean-v1/game.png'});
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});




