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
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.started=true;const s=a.scenes;await s.ready;const r=await s.prepareRoom('stock');r.renderer.setPixelRatio(.5);s.townStage.containerEl.classList.add('hidden');s.place='stock';r.show();a.state.cursor=a.plan.findIndex(b=>b.id==='stockCounter');void a.render();});await page.getByText('안내데스크에서 토리에게 말을 걸어보자',{exact:true}).waitFor();await page.keyboard.down('w');await page.waitForTimeout(1400);await page.keyboard.up('w');await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');const position=await page.evaluate(()=>{const c=window.stockWarsExhibition.scenes.rooms.get('stock').controller;return {x:c.charPosX,z:c.charPosY/.438371146789}});await page.keyboard.press('f');await page.waitForFunction(()=>window.stockWarsExhibition.state.flags.stockCounter);assert(await page.locator('.exhibition-panel .dialogue-next-triangle').isVisible());assert.deepEqual(errors,[]);console.log(JSON.stringify({walkedToCounter:true,position,fStartsToriDialogue:true,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});

