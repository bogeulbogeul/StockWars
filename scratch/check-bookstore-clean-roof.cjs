const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (process.env.BOOKSTORE_BASELINE && file.endsWith('Bookstore-clean.glb')) file = path.resolve('output/bookstore-roof-pitched-v2/Bookstore-clean.glb');
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
        await page.evaluate(()=>document.body.classList.add('town-model-mode'));
        await page.waitForFunction(()=>{
            const scene=window.stockWarsApp?.townModelScene;
            return scene?.player?.root?.parent && scene?.sleepingAnna !== undefined;
        },null,{timeout:90000});
        const report=await page.evaluate(async()=>{
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const THREE=await import('/vendor/three/three.module.js');
            const app=window.stockWarsApp;
            document.body.classList.add('town-model-mode');
            const def=TOWN_MODEL_BUILDINGS.find(b=>b.id==='data_ink_bookstore');
            const model=app.townModelScene.scene.getObjectByName(def.id);
            const bounds=new THREE.Box3().setFromObject(model);
            const names=[]; model.traverse(o=>names.push(o.name));
            return {file:def.file,native:def.nativeMaterials,width:bounds.max.x-bounds.min.x,expectedWidth:def.width,
                pitched:names.some(n=>n.startsWith('Clean_Pitched_Roof_Main_Right_Front')) && names.some(n=>n.startsWith('Clean_Wing_Ridge')) && !names.some(n=>n.startsWith('Curved_Honey_Roof_Edge')),
                roof:names.some(n=>n.startsWith('Clean_Plum_Tile')),
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
                blocked:!app.townModelScene.town.playerController.canStand(def.x,def.y-50)};
        });
        console.log('MODEL_REPORT',JSON.stringify(report));
        assert.equal(report.file,'Bookstore-clean.glb');
        assert(Math.abs(report.width-report.expectedWidth)<1);
        for(const key of ['native','roof','pitched','books','sign','door','steps','side','sideFinish','window','sillRemoved','highlightsRemoved','rear']) assert(report[key],key);
        if(root.includes('win-unpacked')) {
            const line=fs.readFileSync('output/bookstore-roof-clean-v3/desktop-baseline-check.log','utf8').split(/\r?\n/).find(l=>l.startsWith('MODEL_REPORT '));
            const baseline=JSON.parse(line.slice('MODEL_REPORT '.length));
            assert.equal(report.blocked,baseline.blocked,'Collision sample must match the unchanged runtime baseline');
            report.collisionBaselineUnchanged=true;
        } else assert(report.blocked,'blocked');
        page.on('console',m=>{if(m.text().startsWith('ROOFBASE'))console.log(m.text());}); const aerial=await page.evaluate(async()=>{
            const THREE=await import('/vendor/three/three.module.js');
            const s=window.stockWarsApp.townModelScene;
            const b=new THREE.Box3().setFromObject(s.scene.getObjectByName('data_ink_bookstore'));
            const center=b.getCenter(new THREE.Vector3()),span=(b.max.x-b.min.x)*1.18;
            const aspect=s.renderer.domElement.width/s.renderer.domElement.height;
            const camera=new THREE.OrthographicCamera(-span/2,span/2,span/aspect/2,-span/aspect/2,1,10000);
            camera.position.set(center.x,b.max.y+1500,center.z);camera.up.set(0,0,-1);camera.lookAt(center);
            s.renderer.render(s.scene,camera);
            const samples=[];camera.updateMatrixWorld(true);
            for(const [x,y] of [[752,276],[751,200],[730,277],[705,350]]){
                const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x/1440*2-1,1-y/1000*2),camera);
                samples.push({x,y,hits:ray.intersectObject(s.scene.getObjectByName('data_ink_bookstore'),true).slice(0,4).map(h=>({name:h.object.name,point:h.point.toArray(),material:h.object.material.name,local:s.scene.getObjectByName('data_ink_bookstore').worldToLocal(h.point.clone()).toArray()}))});
            }
            console.log('ROOFBASE',JSON.stringify([...s.scene.getObjectByName('data_ink_bookstore').children].filter(o=>o.name.startsWith('Clean_Pitched')).map(o=>({name:o.name,count:o.geometry?.attributes.position.count,bounds:new THREE.Box3().setFromObject(o)})))); return {image:s.renderer.domElement.toDataURL('image/png'),samples};
        });
        fs.writeFileSync(root.includes('win-unpacked')?'output/bookstore-roof-clean-v3/desktop-aerial.png':'output/bookstore-roof-clean-v3/web-aerial.png',Buffer.from(aerial.image.split(',')[1],'base64'));
        fs.writeFileSync('output/bookstore-roof-clean-v3/game-roof-rays.json',JSON.stringify(aerial.samples,null,2)); assert(aerial.samples.every(p=>p.hits[0]?.name.startsWith('Clean_')),'Aerial roof samples must not expose walls');
        await page.screenshot({path:root.includes('win-unpacked')?'output/bookstore-roof-clean-v3/desktop-game.png':'output/bookstore-roof-clean-v3/web-game.png'});
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());
        assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});













