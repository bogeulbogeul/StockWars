const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/information-map-insert-v2');
const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css',
            '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', r => { if (r.status() >= 400 && /\/assets\//.test(r.url())) errors.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.status.hidden, null, { timeout: 90000 });
        const start = page.getByRole('button', { name: '게임 시작', exact: true });
        if (await start.isVisible()) await start.click();
        for (let sequence = 0; sequence < 3; sequence++) {
            const skip = page.getByRole('button', { name: /건너뛰기/ });
            if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(150); }
        }

        const results = [];
        await page.evaluate(() => window.stockWarsApp.enterTown());
        for (const [key, state] of [['1','wave'],['2','eat'],['Space','jump'],['3','crab']]) {
            await page.keyboard.press(key);
            await page.waitForFunction(state => window.stockWarsApp.townModelScene.player.state === state, state);
            if (state === 'crab') await page.keyboard.press('3');
            else await page.waitForFunction(() => window.stockWarsApp.townModelScene.player.state === 'idle', null, {timeout:15000});
        }
        await page.keyboard.down('d');
        await page.waitForFunction(() => window.stockWarsApp.townModelScene.player.state === 'walk');
        await page.keyboard.up('d');
        await page.waitForFunction(() => window.stockWarsApp.townModelScene.player.state === 'idle');
        await page.screenshot({path:'output/fairy-smooth-body-v3/game-town.png'});
        for (const [method,key,label] of [['enterOffice','homeModelScene','home'],['enterVivianModel','vivianModelScene','store'],['enterInformationModel','informationModelScene','information']]) {
            await page.evaluate(method=>window.stockWarsApp[method](),method);
            await page.evaluate(async key=>{await window.stockWarsApp[key].ready},key);
            const report = await page.evaluate(key=>{
                const s=window.stockWarsApp[key]; let torso=0, shopkeeper=false;
                s.scene.traverse(o=>{if(o.name==='Eating_Torso')torso++;if(o.name==='bongbong-shopkeeper')shopkeeper=true;});
                return {key,failed:!!s.failed,torso,shopkeeper};
            },key);
            assert.equal(report.failed,false);assert.ok(report.torso>0);
            if(label==='store') {
                assert.equal(report.shopkeeper,true);
                assert.equal(await page.evaluate(async()=>{
                    const {vivianCanStand}=await import('/js/data/vivianModelRoom.js');
                    return vivianCanStand(2.05*75,-1.3*75);
                }),false);
            }
            results.push(report);
            await page.waitForTimeout(500);
            await page.screenshot({path:`output/fairy-smooth-body-v3/game-${label}.png`});
            await page.evaluate(key=>window.stockWarsApp[key].exit(),key);
        }
        await page.evaluate(()=>window.stockWarsApp.cipherLobby.open());
        await page.evaluate(async()=>await window.stockWarsApp.cipherLobbyScene.ready);
        await page.waitForTimeout(500);
        await page.screenshot({path:'output/fairy-smooth-body-v3/game-tori.png'});
        const tori=await page.evaluate(()=>!!window.stockWarsApp.cipherLobbyScene.scene.getObjectByName('cipher-agent-k'));
        assert.ok(tori);assert.deepEqual(errors,[]);
        fs.writeFileSync('output/fairy-smooth-body-v3/browser-validation.json',JSON.stringify({root,results,tori,motions:['walk','wave','eat','jump','crab'],errors},null,2));
        console.log('PASS',JSON.stringify({root,results,tori,errors}));
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});


