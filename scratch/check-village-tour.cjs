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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();page.setDefaultTimeout(180000);await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);const result=await page.evaluate(async()=>{const app=window.stockWarsExhibition;app.arrival.stop();const s=app.scenes,c=s.townStage.playerController,m=s.townModelScene.sleepingAnna;await m.setAwake(true,{immediate:true});c.charPosX=975;c.charPosY=2355;s.townModelScene.player.update(0);const samples=[];const timer=setInterval(()=>samples.push({x:c.charPosX,y:c.charPosY,mx:m.root.position.x,mz:m.root.position.z,state:s.townModelScene.player.state}),150);const goals=['tree','homeOutside','storeOutside','furniture','pub','bookstore','post','stockOutside','bankOutside','informationOutside'];const times=[];for(const goal of goals){const start=performance.now();await s.show(goal,{tour:true});times.push({goal,ms:Math.round(performance.now()-start),x:c.charPosX,y:c.charPosY,state:s.townModelScene.player.state});}clearInterval(timer);return {times,samples:samples.slice(0,8),walkingSamples:samples.filter(x=>x.state==='walk').length};});console.log(JSON.stringify(result));assert(result.walkingSamples>0);assert(result.times.every(x=>x.state==='idle'));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});