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

        await page.emulateMedia({reducedMotion:'reduce'});
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForFunction(()=>window.stockWarsExhibition?.scenes?.townModelScene?.sleepingAnna);
        await page.evaluate(()=>{
            const app=window.stockWarsExhibition;app.state.arrivalPosition={x:1040,y:2300};app.state.moaCalls=1;
            window.handoff=null;window.addEventListener('stockwars-arrival-finished',()=>{const g=document.querySelector('.moa-movement-guide');window.handoff={guideVisible:!!g&&!g.hidden&&!app.view.root.hidden,titleGone:!document.querySelector('.crayon-title'),calls:app.state.moaCalls,position:{x:app.scenes.townStage.playerController.charPosX,y:app.scenes.townStage.playerController.charPosY}};});
        });
        await page.getByRole('button',{name:'게임 시작',exact:true}).click();
        await page.waitForSelector('.opening-sequence iframe');await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(()=>document.querySelector('[data-arrival-state=departed]'));
        assert.equal(await page.locator('.moa-movement-guide').count(),0);
        const alighted=await page.evaluate(()=>{const c=window.stockWarsExhibition.scenes.townStage.playerController;return {x:c.charPosX,y:c.charPosY};});
        await page.waitForFunction(()=>window.handoff);
        const result=await page.evaluate(()=>window.handoff);assert(result.guideVisible&&result.titleGone&&result.calls===0);assert.deepEqual(result.position,alighted);await page.waitForTimeout(2000);const idle=await page.evaluate(()=>{const c=window.stockWarsExhibition.scenes.townStage.playerController;return {x:c.charPosX,y:c.charPosY};});assert.deepEqual(idle,alighted);assert.notDeepEqual(idle,{x:1040,y:2300});
        await page.screenshot({path:'scratch/arrival-preserved-alighting-position.png'});
        await page.keyboard.down('a');await page.waitForTimeout(150);await page.keyboard.up('a');
        await page.waitForFunction(()=>document.querySelector('.moa-movement-guide').hidden);
        assert.deepEqual(errors,[]);console.log(JSON.stringify({alighted,result,idle,hiddenOnMovement:true,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
