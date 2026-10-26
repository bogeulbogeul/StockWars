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


        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForFunction(async()=>{const a=window.stockWarsApp,c=a.townStage.playerController,m=a.townModelScene.sleepingAnna.root.position,p=(await import('/js/data/townModelBuildings.js')).GROUND_PROJECTION;return Math.hypot(c.charPosX-m.x,c.charPosY-m.z*p)<90;});await page.keyboard.up('d');await page.keyboard.up('w');
        const walkStartX=await page.evaluate(()=>window.stockWarsApp.townStage.playerController.charPosX);
        await page.keyboard.press('f');await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.sleepingAnna.root.userData.sleeping),true);
        await page.keyboard.press('f');await page.waitForFunction(()=>!window.stockWarsApp.annaDialogueModal.modalOverlay.classList.contains('hidden'));await page.waitForTimeout(200);
        const result=await page.evaluate(async()=>{const T=await import('/vendor/three/three.module.js'),a=window.stockWarsApp,p=a.townModelScene.player,m=a.townModelScene.sleepingAnna,d=new T.Vector3().subVectors(m.root.position,p.root.position).setY(0).normalize();return {x:a.townStage.playerController.charPosX,standing:!m.root.userData.seated,playerDot:new T.Vector3(0,0,1).applyQuaternion(p.root.quaternion).dot(d),moaDot:new T.Vector3(0,0,1).applyQuaternion(m.root.quaternion).dot(d.clone().negate())};});assert(result.x<walkStartX-45&&result.standing&&result.playerDot>.999&&result.moaDot>.999);
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsApp.annaDialogueModal.modalOverlay.classList.contains('hidden')),true);assert.deepEqual(errors,[]);console.log(JSON.stringify({walkStartX,result,fClosesDialogue:true,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
