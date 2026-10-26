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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();const s=a.scenes,m=s.townModelScene.sleepingAnna;s.townModelScene.renderer.setPixelRatio(.35);await m.setAwake(true,{immediate:true});const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');s.place='furniture';m.root.position.set(842.0737,0,1999.1168/P);a.state.moaCalls=3;a.state.flags.moaAwake=true;a.state.cursor=a.plan.findLastIndex(b=>b.chapter===3&&b.place==='furniture');const c=s.townStage.playerController;c.charPosX=850;c.charPosY=2048;await a.render();await m.setMood('surprised','surprised');});await page.locator('.exhibition-panel .dialogue-next-triangle').click();await page.waitForTimeout(1000);const result={errors,state:await page.evaluate(()=>({busy:window.stockWarsExhibition.busy,tour:window.stockWarsExhibition.scenes.tourActive,place:window.stockWarsExhibition.scenes.place,mood:window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.mood,expression:window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.expressions.id}))};assert.deepEqual(errors,[]);assert.equal(result.state.mood,'calm');assert.equal(result.state.expression,'smile');console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
