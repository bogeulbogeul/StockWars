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



        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForFunction(()=>window.stockWarsExhibition.arrival.near());await page.keyboard.up('d');await page.keyboard.up('w');
        await page.keyboard.press('f');await page.waitForSelector('.moa-wake-dialogue:not(.hidden)');

        const panel=page.locator('.moa-wake-dialogue .vn-dialogue-box'),triangle=panel.locator('.dialogue-next-triangle');
        assert.equal(await panel.locator('button').count(),1);assert.equal(await triangle.textContent(),'');
        assert(!/닫기|다시 부르기|다음|1\/3/.test(await panel.textContent()));
        const p=await panel.boundingBox(),t=await triangle.boundingBox();assert(t.x>p.x+p.width*.8&&p.y+p.height-t.y-t.height<50);
        assert((await triangle.evaluate(e=>getComputedStyle(e).backgroundImage)).includes('/moa/next-arrow.png'));
        await page.screenshot({path:'scratch/moa-triangle-dialogue.png'});
        await triangle.click();assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),2);
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.sleeping),true);
        await page.keyboard.press('f');await page.waitForFunction(()=>!window.stockWarsExhibition.busy&&window.stockWarsExhibition.state.flags.moaAwake);
        const story=page.locator('.exhibition-panel');assert.equal(await story.locator('button').count(),1);assert.equal(await story.locator('.dialogue-next-triangle').textContent(),'');
        const before=await page.evaluate(()=>window.stockWarsExhibition.state.cursor);await page.keyboard.press('f');await page.waitForFunction(n=>window.stockWarsExhibition.state.cursor===n+1,before);assert.deepEqual(errors,[]);
        console.log('PASS only bottom-right triangle, native resident art, click advances second call, F wakes on third and advances story');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
