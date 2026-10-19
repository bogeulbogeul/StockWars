const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file,(error,data) => {
        if(error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    let browser;
    try {
        browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
        const page = await browser.newPage({viewport:{width:1280,height:1000}});
        const errors=[]; page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
        await page.waitForFunction(()=>window.stockWarsApp?.itemEngine);
        await page.evaluate(async()=>{
            const app=window.stockWarsApp;
            const {TOWN_BUILDINGS}=await import('/js/data/townWorldData.js');
            const salon=TOWN_BUILDINGS.find(b=>b.id==='claire_apparel');
            if(salon.name!=='살롱 드 테일'||salon.available!==true)throw new Error('Salon metadata mismatch');
            app.titleScreen.hide();
            app.townStage.callbacks.onBeforeTownAction=()=>true;
            app.townStage.triggerAction(salon);
        });
        await page.waitForFunction(()=>stockWarsApp.salonInterior.isOpen&&stockWarsApp.salonInterior.background.naturalWidth>0);
        assert.equal(await page.locator('.salon-interior header strong').textContent(),'살롱 드 테일');
        assert.equal(await page.locator('.salon-interior').getAttribute('aria-label'),'살롱 드 테일 내부');
        await page.screenshot({path:path.resolve(__dirname,'salon-entry-fixed.png')});
        assert.deepEqual(errors,[]);
        console.log('PASS: live building action opens loaded salon interior with updated name; no browser errors');
    } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

