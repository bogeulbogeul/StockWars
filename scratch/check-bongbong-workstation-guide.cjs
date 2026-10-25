const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const runtime = root.includes('win-unpacked');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        await page.waitForFunction(() => window.stockWarsApp?.enterVivianModel, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ });
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }
        await page.evaluate(async()=>{const a=window.stockWarsApp;await a.townModelScene.ready;const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');const b=TOWN_MODEL_BUILDINGS.find(b=>b.id==='vivian_store');Object.assign(a.townStage.playerController,{charPosX:b.x,charPosY:b.y+110});await a.enterVivianModel()});
        await page.evaluate(async () => { await window.stockWarsApp.vivianModelScene.ready; });
        await page.waitForFunction(()=>window.stockWarsApp.vivianModelScene.active);await page.evaluate(async()=>{await window.stockWarsApp.vivianModelScene.greetingReady;});
        assert.equal(await page.locator('.moa-wake-dialogue:not(.hidden)').count(),0);
        await page.keyboard.press('f');
        const dialogue=page.locator('.moa-wake-dialogue:not(.hidden)').filter({hasText:'어서 오세요'});await dialogue.waitFor();
        assert.equal(await page.getByRole('button',{name:'해볼게요',exact:true}).count(),0);
        for(let i=0;i<4;i++)await page.locator('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle').click();
        await page.getByRole('button',{name:'나중에 할게요',exact:true}).click();
        await page.locator('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle').click();
        assert.equal(await page.locator('dialog[open]').count(),0);
        await page.keyboard.press('f');for(let i=0;i<4;i++)await page.locator('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle').click();
        await page.getByRole('button',{name:'해볼게요',exact:true}).click();
        await page.getByText('여기가 포장 작업대예요.',{exact:false}).waitFor(); const guidePosition=await page.evaluate(()=>{const r=window.stockWarsApp.vivianModelScene;return r.shopkeeper.getWorldPosition(r.shopkeeper.position.clone()).toArray()}); assert(guidePosition[2]<-130); await page.screenshot({path:'scratch/bongbong-points-workstation.png'}); await page.locator('.moa-wake-dialogue:not(.hidden) .dialogue-next-triangle').click(); const workGuide=page.getByRole('region',{name:'포장 작업대 안내'});await workGuide.waitFor({state:'visible'});assert.equal(await page.locator('dialog[open]').count(),0);await page.keyboard.press('f');await page.waitForTimeout(200);assert.equal(await page.locator('dialog[open]').count(),0);await page.keyboard.down('d');await page.waitForFunction(()=>window.stockWarsApp.vivianModelScene.controller.charPosX>=163);await page.keyboard.up('d');await page.keyboard.down('w');await page.waitForFunction(()=>window.stockWarsApp.vivianModelScene.controller.charPosY/.4383711467890774<=-45);await page.keyboard.up('w');assert.equal(await page.locator('dialog[open]').count(),0);await page.screenshot({path:'scratch/player-at-packing-worktop.png'});await page.keyboard.press('f');await page.waitForFunction(()=>window.stockWarsApp.packingGame?.isOpen);assert.equal(await workGuide.count(),0);
        assert.deepEqual(errors,[]);console.log(JSON.stringify({noAutomaticDialogue:true,talkOnF:true,postpone:true,acceptWaitsForWorktop:true,worktopFStartsPacking:true,errors}));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

