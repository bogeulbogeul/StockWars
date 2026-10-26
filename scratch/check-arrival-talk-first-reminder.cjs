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



        await page.keyboard.down('s');await page.waitForFunction(()=>window.stockWarsExhibition.arrival.reminder.isOpen);await page.keyboard.up('s');
        const reminder=page.locator('.moa-wake-dialogue:not(.hidden)');assert((await reminder.textContent()).includes('우선 저 아이에게 말을 걸어보자.'));
        assert.equal(await reminder.locator('[data-dialogue-theme]').getAttribute('data-dialogue-theme'),'somang');assert((await reminder.textContent()).includes('소망이'));
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls||0),0);assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.sleeping),true);
        await page.screenshot({path:'scratch/somangi-talk-first-reminder.png'});
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsExhibition.arrival.reminder.isOpen),false);
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls||0),0);
        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForFunction(()=>window.stockWarsExhibition.arrival.near());await page.keyboard.up('d');await page.keyboard.up('w');
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),1);
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.arrival.reminder.isOpen),false);assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.sleeping),true);assert.deepEqual(errors,[]);
        console.log('PASS leaving before talk shows Somangi-themed line, F dismiss does not call/wake Moa, return and interact normally');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
