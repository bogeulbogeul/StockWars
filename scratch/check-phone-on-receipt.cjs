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
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.started);const before=await page.locator('.exhibition-phone').isVisible();assert(!before);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();const {complete}=await import('/js/app/exhibition/State.js');complete(a.state,'phone');a.view.sync(a.state);a.view.panel.hidden=true;});const phone=page.locator('.exhibition-phone');assert(await phone.isVisible());const bounds=await phone.boundingBox();assert(bounds.y>600&&bounds.y+bounds.height<=800);assert.equal(await page.locator('.cozy-phone[open]').count(),0);await phone.click();assert.equal(await page.locator('.cozy-phone[open]').count(),1);await page.keyboard.press('Escape');await page.evaluate(()=>{const a=window.stockWarsExhibition;a.view.panel.hidden=false;a.view.line({speaker:'모아',text:'스마트폰을 잘 받았나요?'},()=>{});});assert(await phone.isDisabled());console.log(JSON.stringify({hiddenBeforeReceipt:true,visibleAfterReceipt:true,bottom:bounds.y+bounds.height,autoOpened:false,dialogueLock:true}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
