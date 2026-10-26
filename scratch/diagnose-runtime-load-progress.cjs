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


(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();page.on('pageerror',e=>console.log('ERROR',e.message));page.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');for(let i=0;i<4;i++){await page.waitForTimeout(5000);console.log(await page.evaluate(()=>{const s=window.stockWarsExhibition?.scenes.townModelScene;return {hasApp:!!window.stockWarsExhibition,status:s?.status.textContent,roots:s?.scene.children.length,loaded:s?.loadedCount,player:s?.player?.state,moa:!!s?.sleepingAnna}}));}}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});