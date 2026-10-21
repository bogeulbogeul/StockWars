const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true,channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1280,height:800}});
        const errors=[];
        page.on('pageerror', error=>errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.renderer, {timeout:10000}).catch(async error=>{ console.log(errors); console.log(await page.evaluate(()=>({app:!!window.stockWarsApp,model:!!window.stockWarsApp?.townModelScene,text:document.body.innerText.slice(0,500)}))); throw error; });
        if (await page.locator('.crayon-title__start').count()) await page.locator('.crayon-title__start').click();
        assert.equal(await page.locator('.main-hud-bar,#isoOfficeStage,.town-channel-header-hud,.town-controls-hint,#townWorldTrack').count(),0);
        assert.equal(await page.locator('body.ui-paused,body.graphics-paused').count(),0);
        await page.locator('#floatingPhoneBtn').click();
        await page.waitForFunction(()=>document.body.classList.contains('phone-view-active'));
        assert.equal(await page.locator('.device-container').isVisible(),true);
        await page.screenshot({path:path.join(__dirname,'current-world-smartphone.png')});
        await page.evaluate(async()=>{
            const app=window.stockWarsApp;
            app.smartphoneUI.minimizePhone();
            const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');
            const home=TOWN_MODEL_BUILDINGS.find(item=>item.id==='home_office_tower');
            app.townStage.playerController.charPosX=home.x+(home.entranceOffsetX||0);
            app.townStage.playerController.charPosY=home.y+65;
        });
        await page.keyboard.press('f');
        await page.waitForFunction(()=>window.stockWarsApp.homeModelScene?.active);
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!window.stockWarsApp.homeModelScene?.active && document.body.classList.contains('town-mode-active'));
        assert.deepEqual(errors,[]);
        console.log('PASS: current 3D world, retired UI absent, smartphone visible, F home entry and Escape return, no page errors');
    } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
