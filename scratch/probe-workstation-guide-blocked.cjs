const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);console.log(JSON.stringify(await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();const r=await a.scenes.prepareRoom('store');r.show();await r.greetingReady;const {workstationGuideRoute}=await import('/js/components/store3d/BongbongWorkstationGuide.js');const {packingWorktopBounds}=await import('/js/components/store3d/PackingWorkstation.js');const bounds=packingWorktopBounds(r),failed=[];for(const x of [-180,-160,-140,-120,-80,-40,0,40,80])for(const z of [100,130,160,190]){if(!r.canStand(x,z))continue;r.controller.charPosX=x;r.controller.charPosY=z*.4383711467890774;try{workstationGuideRoute(r,bounds)}catch(e){failed.push({x,z,error:e.message})}}return {radius:r.shopkeeper.userData.rigidBody.radius,blockedSouth:Array.from({length:19},(_,i)=>50+i*10).map(z=>({z,legal:r.canStand(-180,z)})),failed}})));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});

