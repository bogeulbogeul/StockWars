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
(async()=>{
    await new Promise(resolve=>server.listen(8108,'127.0.0.1',resolve));
    const browser=await chromium.launch({headless:true,channel:'msedge'});
    try {
        const page=await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto('http://127.0.0.1:8108/');
        await page.waitForFunction(()=>window.stockWarsApp?.enterVivianModel && window.stockWarsApp?.townModelScene?.status.hidden,null,{timeout:90000});
        const save=await page.evaluate(()=>JSON.stringify(localStorage));
        await page.evaluate(()=>{
            const p=window.stockWarsApp.townStage.playerController;
            p.charPosX=2070; p.charPosY=1125;
        });
        await page.keyboard.press('f');
        await page.waitForFunction(()=>window.stockWarsApp.vivianModelScene?.player?.state==='idle',null,{timeout:90000});
        assert(await page.locator('#vivianModelStage').isVisible());
        const report=await page.evaluate(async()=>{
            const s=window.stockWarsApp.vivianModelScene;
            const {vivianCanStand,VIVIAN_ROOM_RATIO}=await import('/js/data/vivianModelRoom.js');
            const canStand=(x,z)=>vivianCanStand(x*VIVIAN_ROOM_RATIO,z*VIVIAN_ROOM_RATIO);
            const names=[];s.room.traverse(o=>names.push(o.name));
            return {counter:names.includes('Counter_Cream_Body'),packing:names.includes('Packing_Worktop'),
                flower:names.includes('Wall_Flower_Gold_Center'),fridges:names.filter(n=>n.startsWith('Right_Wall_Fridge_')).length,
                noGoods:!names.some(n=>n.startsWith('Goods_')),aisle:canStand(0,200),
                counterBlocked:!canStand(0,-75),shelfBlocked:!canStand(-360,0),
                fridgeBlocked:!canStand(348,145),packingBlocked:!canStand(195,-220),
                staffPassage:canStand(0,-200),exitPassage:canStand(0,330)};
        });
        for(const [key,value] of Object.entries(report)) assert(key==='fridges'?value===2:value,key);
        await page.screenshot({path:'scratch/vivian-room-game.png'});
        await page.evaluate(()=>{
            const s=window.stockWarsApp.vivianModelScene;s.controller.charPosX=0;s.controller.charPosY=0;
        });
        await page.keyboard.press('f');
        await page.waitForFunction(()=>!document.getElementById('vivianStoreModal').classList.contains('hidden'));
        assert(await page.locator('#vivianShopPanel').isVisible());
        assert(!(await page.locator('#vivianInterior').isVisible()));
        await page.evaluate(()=>window.stockWarsApp.vivianStoreModal.close());
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!window.stockWarsApp.vivianModelScene.active);
        assert(await page.locator('.town-model-layer').isVisible());
        await page.keyboard.press('f');
        await page.waitForFunction(()=>window.stockWarsApp.vivianModelScene.active);
        await page.keyboard.down('s');
        await page.waitForFunction(()=>!window.stockWarsApp.vivianModelScene.active,null,{timeout:10000});
        await page.keyboard.up('s');
        await page.evaluate(()=>window.stockWarsApp.enterVivianModel());
        await page.setViewportSize({width:900,height:700});
        await page.waitForTimeout(300);
        assert(await page.locator('#vivianModelStage').isVisible());
        assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),save);
        assert.deepEqual(errors,[]);
        console.log('PASS: F entry, room assets, collisions, checkout UI, Escape/entrance return, resize, save unchanged',JSON.stringify(report));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

