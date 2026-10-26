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

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('stockwars.exhibition.first-day.v1',JSON.stringify({version:1,cursor:12,nickname:'이전기록',order:'packing',cash:999,debt:0,shares:[],trades:[],flags:{},answers:[]})));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.arrival?.active);const before=await page.evaluate(()=>{const a=window.stockWarsExhibition;const first={cursor:a.state.cursor,nickname:a.state.nickname};a.state.nickname='이번실행';a.state.moaCalls=2;a.save();return {first,stored:JSON.parse(localStorage.getItem('stockwars.exhibition.first-day.v1')).nickname}});assert.equal(before.first.cursor,0);assert.equal(before.first.nickname,'');assert.equal(before.stored,'이전기록');await page.reload();await page.waitForFunction(()=>window.stockWarsExhibition?.arrival?.active);const after=await page.evaluate(()=>({cursor:window.stockWarsExhibition.state.cursor,nickname:window.stockWarsExhibition.state.nickname,calls:window.stockWarsExhibition.state.moaCalls||0}));assert.deepEqual(after,{cursor:0,nickname:'',calls:0});console.log(JSON.stringify({before,after}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});