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
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.started);await page.waitForTimeout(300);assert.equal(await page.locator('.tutorial-stage-skip').count(),0);await page.evaluate(async()=>{const screen=document.createElement('section');document.body.append(screen);const {playOpening}=await import('/js/app/OpeningSequence.js');void playOpening(screen);});assert.equal(await page.locator('.opening-sequence__skip').count(),0);assert.equal(await page.locator('iframe[title="소망이의 첫 여행 오프닝"]').count(),1);await page.evaluate(async()=>{const screen=document.createElement('section');document.body.append(screen);const {playBusArrival}=await import('/js/app/arrival/BusArrival.js');void playBusArrival(screen);});await page.waitForTimeout(1000);assert.equal(await page.locator('.opening-sequence__skip,.tutorial-stage-skip').count(),0);assert.deepEqual(errors,[]);console.log(JSON.stringify({storySkipRemoved:true,openingSkipRemoved:true,busSkipRemoved:true,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
