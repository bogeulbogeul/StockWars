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
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.sleepingAnna?.mixer, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true }); if (await start.isVisible()) await start.click();
        for (let i = 0; i < 3; i++) { const skip = page.getByRole('button', { name: /건너뛰기/ }); if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); } }
        await page.evaluate(() => window.stockWarsApp.enterTown());

        await page.waitForSelector('.moa-movement-guide:not([hidden])');

        const guide=page.locator('.moa-movement-guide');assert.equal(await guide.locator('button').count(),0);assert(!/[↑←↓→]/.test(await guide.textContent()));
        const position=()=>page.evaluate(()=>{const c=window.stockWarsApp.townStage.playerController;return [c.charPosX,c.charPosY]});
        const before=await position();await page.keyboard.down('ArrowUp');await page.waitForTimeout(200);await page.keyboard.up('ArrowUp');assert.deepEqual(await position(),before);assert(await guide.isVisible());
        await page.evaluate(()=>{window.calls=0;window.stockWarsApp.annaDialogueModal.show=()=>window.calls++;});
        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('d');await page.keyboard.up('w');
        await page.waitForFunction(()=>document.querySelector('.moa-movement-guide').hidden);
        for(let count=1;count<=2;count++){await page.keyboard.press('f');await page.waitForSelector('.moa-wake-dialogue:not(.hidden)');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.sleepingAnna.root.userData.wakeCalls),count);assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.sleepingAnna.root.userData.sleeping),true);assert.equal(await page.locator('.moa-wake-dialogue [data-dialogue-theme]').getAttribute('data-dialogue-theme'),'moa');assert.equal(await guide.isVisible(),false);}
        await page.keyboard.press('f');await page.waitForFunction(()=>window.calls===1&&!window.stockWarsApp.townModelScene.sleepingAnna.root.userData.seated);assert.equal(await page.locator('.moa-wake-dialogue:not(.hidden)').count(),0);
        assert.deepEqual(errors,[]);console.log('PASS standard: WASD-only movement, guide hidden after movement, themed dialogue separated, third call wakes');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
