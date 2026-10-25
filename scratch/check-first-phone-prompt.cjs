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
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.started);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.busy=false;const {complete}=await import('/js/app/exhibition/State.js');complete(a.state,'phone');a.state.cursor=a.plan.findIndex(b=>b.id==='openPhone');a.view.sync(a.state);a.activities.run(a.plan[a.state.cursor]);a.render=()=>{};});const guide=page.getByRole('region',{name:'스마트폰 열기 안내'});await page.getByText('화면 오른쪽 아래의 스마트폰 버튼을 눌러 주세요.',{exact:true}).waitFor();assert.equal(await page.locator('.cozy-phone[open]').count(),0);await page.locator('.exhibition-phone').click();assert.equal(await page.locator('.cozy-phone[open]').count(),1);assert.equal(await page.getByText('화면 오른쪽 아래의 스마트폰 버튼을 눌러 주세요.',{exact:true}).isVisible(),false);assert.equal(await page.evaluate(()=>!!window.stockWarsExhibition.state.flags.openPhone),false);await page.keyboard.press('Escape');await page.waitForFunction(()=>window.stockWarsExhibition.state.flags.openPhone);assert.equal(await page.locator('[aria-label="스마트폰 열기 안내"]').count(),0);assert.deepEqual(errors,[]);console.log(JSON.stringify({guideAfterReceipt:true,noAutoOpen:true,clickHidesGuide:true,closeAdvancesStory:true,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});

