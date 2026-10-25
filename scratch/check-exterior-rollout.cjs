const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(8118,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto('http://127.0.0.1:8118/');
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.status.hidden
            &&window.stockWarsApp.townModelScene.player?.root?.parent
            &&window.stockWarsApp.townModelScene.sleepingAnna!==undefined,null,{timeout:90000});
        await page.evaluate(()=>document.body.classList.add('town-model-mode','ui-paused'));
        const report=await page.evaluate(async()=>{
            const THREE=await import('/vendor/three/three.module.js');
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const s=window.stockWarsApp.townModelScene,p=s.town.playerController;
            const ids=['home_office_tower','cipher_securities','vivian_store','data_ink_bookstore','settlement_information'];const result={};
            for(const id of ids){
                const d=TOWN_MODEL_BUILDINGS.find(b=>b.id===id),m=s.scene.getObjectByName(id),names=[];m.traverse(o=>names.push(o.name));
                const b=new THREE.Box3().setFromObject(m);
                result[id]={width:b.max.x-b.min.x,expected:d.width,blocked:!p.canStand(d.x,d.y),frontClear:p.canStand(d.x+(d.entranceOffsetX||0),d.y+50)};
                if(id==='home_office_tower'){
                    const f=new THREE.Box3().setFromObject(m.getObjectByName('Home_Continuous_Wood_Door_Frame'));
                    const mail=new THREE.Box3().setFromObject(m.getObjectByName('Home_Right_Mailbox'));
                    result[id].doorAligned=Math.abs((f.min.x+f.max.x)/2-d.x-d.entranceOffsetX)<1;
                    result[id].mailboxRight=mail.min.x>f.max.x;
                    result[id].latest=names.includes('Home_Door_Continuous_Panel_Moulding')&&names.includes('Home_Door_Unified_Porthole_Cross')&&names.some(n=>n.startsWith('Home_Pitched_Roof'));
                }
                if(id==='cipher_securities')result[id].latest=names.includes('Entry_Continuous_Three_Step_Solid')&&names.includes('Door_Continuous_Arch_Frame');
                if(id==='vivian_store')result[id].latest=names.includes('Door_Glass_Unified_Fitted_Cross')&&!names.includes('Door_Flush_Threshold');
                if(id==='data_ink_bookstore')result[id].latest=names.some(n=>n.startsWith('Pitched_Roof_Main_Right_Front'));
                if(id==='settlement_information')result[id].latest=names.includes('Information_Sprout_Wall_Mark')
                    && names.some(n=>n.startsWith('Main_Ridge_Cap')) && names.some(n=>n.startsWith('Porch_Pitched_Roof'))
                    && names.includes('Door_Continuous_Cream_Surround') && names.filter(n=>n.startsWith('Door_Recessed_Panel')).length===4
                    && names.includes('Entry_Continuous_Two_Step_Solid');
            }
            result.count=TOWN_MODEL_BUILDINGS.length;
            return result;
        });
        assert.equal(report.count,8);
        for(const [id,v] of Object.entries(report))if(id!=='count'){
            assert(Math.abs(v.width-v.expected)<1,id+' width');
            for(const key of ['blocked','frontClear','latest'])assert(v[key],id+' '+key);
        }
        assert(report.home_office_tower.doorAligned);assert(report.home_office_tower.mailboxRight);
        await page.screenshot({path:'output/exterior-rollout-2026-10-25/game.png'});
        await page.setViewportSize({width:900,height:700});await page.waitForTimeout(250);
        assert(await page.locator('.town-model-layer').isVisible());assert.deepEqual(errors,[]);
        console.log('PASS',JSON.stringify(report));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
