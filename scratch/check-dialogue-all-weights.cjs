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


(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.view);const result=await page.evaluate(()=>{const app=window.stockWarsExhibition,v=app.view;app.arrival.stop();v.state=app.state;const samples=[];function inspect(label){for(const el of v.panel.querySelectorAll('*'))if(el.textContent.trim())samples.push({label,tag:el.tagName,weight:getComputedStyle(el).fontWeight});}v.line({speaker:'모아',text:'일반 대사'},()=>{});inspect('line');v.clear('활동 제목');v.text('활동 안내');v.choices([['확인',()=>{}]]);const strong=document.createElement('strong');strong.textContent='강조 문구';v.panel.append(strong);inspect('activity');const guide=document.createElement('div');guide.className='moa-movement-guide';guide.innerHTML='<strong>다가가 보세요</strong><p><kbd>W</kbd> 이동</p>';document.body.append(guide);for(const el of guide.querySelectorAll('*'))samples.push({label:'guide',tag:el.tagName,weight:getComputedStyle(el).fontWeight});return samples;});assert(result.length>5);assert(result.every(x=>x.weight==='500'),JSON.stringify(result));console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});