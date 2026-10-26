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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const p=await browser.newPage({viewport:{width:1280,height:800}});await p.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await p.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);console.log(await p.evaluate(()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.state.flags.phone=true;a.view.panel.hidden=true;a.view.root.hidden=false;a.view.sync(a.state);a.view.openPhone();const r=n=>{const s=getComputedStyle(n),b=n.getBoundingClientRect();return {top:b.top,right:innerWidth-b.right,bottom:innerHeight-b.bottom,width:b.width,height:b.height,zoom:s.zoom,cssRight:s.right,cssBottom:s.bottom,margin:s.margin}};return {phone:r(a.view.phoneHome.dialog),button:r(a.view.phone),body:getComputedStyle(document.body).zoom}}));}finally{await browser.close();server.close()}})();