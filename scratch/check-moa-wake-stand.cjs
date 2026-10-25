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

        await page.evaluate(async()=>{
            const app=window.stockWarsApp,view=app.townModelScene,actor=view.sleepingAnna;
            view.arrivalActive=true;await actor.setAwake(false);
            const {GROUND_PROJECTION:p}=await import('/js/data/townModelBuildings.js');
            Object.assign(app.townStage.playerController,{charPosX:actor.root.position.x-60,charPosY:actor.root.position.z*p+25});
            window.calls=0;app.annaDialogueModal.show=()=>window.calls++;
            window.seatedPosition=actor.root.position.clone();
        });
        await page.keyboard.press('f');
        const result=await page.evaluate(async()=>{
            const app=window.stockWarsApp,view=app.townModelScene,actor=view.sleepingAnna;
            const effect=actor.root.getObjectByName('moa-sleep-zzzz');
            const immediatelyHidden=!effect.visible;
            for(let i=0;i<6;i++)actor.update(.1);
            const middle=actor.root.position.clone();
            for(let i=0;i<8;i++)actor.update(.1);
            await actor.standReady;
            const {GROUND_PROJECTION:p}=await import('/js/data/townModelBuildings.js');
            const box=view.collisionFootprints.find(b=>b.id==='moa');
            const stood=!actor.root.userData.seated&&!actor.root.userData.sleeping;
            const after=actor.root.position.clone();
            Object.assign(app.townStage.playerController,{charPosX:after.x-60,charPosY:after.z*p+25});
            return {calls:window.calls,immediatelyHidden,stood,advanced:after.z>window.seatedPosition.z+20,
                animated:middle.z>window.seatedPosition.z&&middle.z<after.z,
                collisionFollows:Math.abs((box.minY+box.maxY)/2-after.z*p)<.001,
                endPosition:after.toArray(),face:actor.expressions.id};
        });
        assert.equal(result.calls,1);assert(result.immediatelyHidden&&result.stood&&result.advanced&&result.animated&&result.collisionFollows);
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.calls),2);
        await page.evaluate(async()=>{const a=window.stockWarsApp.townModelScene.sleepingAnna;await a.setAwake(false);if(!a.root.userData.seated||!a.root.getObjectByName('moa-sleep-zzzz').visible)throw Error('Reset failed');await a.setAwake(true,{immediate:true});if(a.root.userData.seated)throw Error('Resume failed');});
        assert.deepEqual(errors,[]);console.log(JSON.stringify({result,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
