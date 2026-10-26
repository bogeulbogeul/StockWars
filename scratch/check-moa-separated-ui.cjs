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

        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsExhibition?.arrival?.active&&window.stockWarsExhibition?.scenes?.townModelScene?.sleepingAnna);

        await page.waitForSelector('.moa-movement-guide:not([hidden])');

        const guide=page.locator('.moa-movement-guide');assert.equal(await guide.locator('button').count(),0);
        assert(!/[↑←↓→]/.test(await guide.textContent()));assert(!(await guide.textContent()).includes('구름'));
        const position=()=>page.evaluate(()=>{const c=window.stockWarsExhibition.scenes.townStage.playerController;return [c.charPosX,c.charPosY]});
        const before=await position();await page.keyboard.down('ArrowUp');await page.waitForTimeout(200);await page.keyboard.up('ArrowUp');assert.deepEqual(await position(),before);assert(await guide.isVisible());
        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('d');await page.keyboard.up('w');
        await page.waitForFunction(()=>document.querySelector('.moa-movement-guide').hidden);
        await page.waitForTimeout(150);assert.equal(await guide.isVisible(),false);
        await page.keyboard.press('f');await page.waitForSelector('.moa-wake-dialogue:not(.hidden)');
        assert.equal(await page.locator('.moa-wake-dialogue [data-dialogue-theme]').getAttribute('data-dialogue-theme'),'moa');
        assert((await page.locator('.moa-wake-dialogue').textContent()).includes('구름'));assert.equal(await guide.isVisible(),false);
        await page.screenshot({path:'scratch/moa-separated-dialogue.png'});
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),2);
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.sleeping),true);
        await page.keyboard.press('f');await page.waitForFunction(()=>{const a=window.stockWarsExhibition;return a.state.flags.moaAwake&&!a.scenes.townModelScene.sleepingAnna.root.userData.seated&&!a.busy;});
        assert.equal(await page.locator('.moa-wake-dialogue:not(.hidden)').count(),0);
        assert(await page.locator('.exhibition-panel[data-dialogue-theme]').count());assert.deepEqual(errors,[]);
        console.log('PASS first-day: WASD only, guide hides on real movement, separate Moa-themed dialogue, 3-call wake');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
