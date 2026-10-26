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
        const result=await page.evaluate(async()=>{
            const app=window.stockWarsExhibition,actor=app.scenes.townModelScene.sleepingAnna;
            const {GROUND_PROJECTION:p}=await import('/js/data/townModelBuildings.js');
            Object.assign(app.scenes.townStage.playerController,{charPosX:actor.root.position.x-50,charPosY:actor.root.position.z*p+20});
            await app.arrival.talk();await app.arrival.talk();const sleepingAfterTwo=actor.root.userData.sleeping&&actor.root.userData.seated;
            await app.arrival.talk();
            const stoodAfterThird=app.state.flags.moaAwake&&!actor.root.userData.seated&&!actor.root.getObjectByName('moa-sleep-zzzz').visible;
            await app.render();return {sleepingAfterTwo,stoodAfterThird,awakeAfterRender:!actor.root.userData.seated};
        });
        await page.reload();await page.waitForFunction(()=>{const a=window.stockWarsExhibition;return a?.scenes?.townModelScene?.sleepingAnna&&!a.scenes.townModelScene.sleepingAnna.root.userData.seated&&a.state.flags.moaAwake;});assert(result.sleepingAfterTwo&&result.stoodAfterThird&&result.awakeAfterRender);assert.deepEqual(errors,[]);console.log(JSON.stringify({result,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
