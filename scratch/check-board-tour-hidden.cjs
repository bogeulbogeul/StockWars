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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.state.flags.moaAwake=true;a.state.moaCalls=3;a.scenes.place='notice';a.state.cursor=a.plan.findIndex(b=>b.chapter===3&&b.place==='notice');const {TOWN_MODEL_PROPS}=await import('/js/data/townModelProps.js');const p=TOWN_MODEL_PROPS.find(p=>p.id==='plaza_notice_board');Object.assign(a.scenes.townStage.playerController,{charPosX:p.x,charPosY:p.y+55});await a.render();});await page.waitForTimeout(250);assert.equal(await page.locator('.board-launch').isVisible(),false);await page.keyboard.press('f');assert.equal(await page.locator('.village-board[open]').count(),0);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.state.cursor=a.plan.findIndex(b=>b.id==='notice');await a.render();});await page.locator('.board-launch').waitFor({state:'visible'});await page.locator('.board-launch').click();await page.locator('.village-board[open]').waitFor();assert.deepEqual(errors,[]);console.log(JSON.stringify({tourButtonHidden:true,laterNoticeButtonWorks:true,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});