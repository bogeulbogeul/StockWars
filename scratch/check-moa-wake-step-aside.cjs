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
            const app=window.stockWarsExhibition;app.state.flags.moaAwake=false;app.state.moaCalls=2;app.state.cash=1977;
            window.wakeTriggers=0;const actor=app.scenes.townModelScene.sleepingAnna,set=actor.setAwake.bind(actor);
            actor.setAwake=(awake,options)=>{if(awake)window.wakeTriggers++;return set(awake,options);};
            window.handoff=false;window.addEventListener('stockwars-arrival-finished',()=>window.handoff=true);
        });
        await page.getByRole('button',{name:'게임 시작',exact:true}).click();
        await page.waitForSelector('.opening-sequence iframe');await page.locator('.opening-sequence__skip').click();
        await page.waitForFunction(()=>window.handoff);
        await page.waitForTimeout(3000);
        const idle=await page.evaluate(()=>{const a=window.stockWarsExhibition,m=a.scenes.townModelScene.sleepingAnna;return {seated:m.root.userData.seated,sleeping:m.root.userData.sleeping,effect:m.root.getObjectByName('moa-sleep-zzzz').visible,calls:a.state.moaCalls,wakeTriggers:window.wakeTriggers,cash:a.state.cash};});
        assert(idle.seated&&idle.sleeping&&idle.effect&&idle.calls===0&&idle.wakeTriggers===0&&idle.cash===1977);
        await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),0);
        await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForFunction(()=>window.stockWarsExhibition.arrival.near());await page.keyboard.up('d');await page.keyboard.up('w');
        for(let count=1;count<=2;count++){await page.keyboard.press('f');assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),count);assert.equal(await page.evaluate(()=>window.wakeTriggers),0);assert.equal(await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.sleepingAnna.root.userData.seated),true);}
        await page.evaluate(()=>{window.walkSamples=[];window.trackStep=true;const tick=()=>{const s=window.stockWarsExhibition.scenes.townModelScene,c=s.town.playerController,p=s.player;window.walkSamples.push({x:c.charPosX,y:c.charPosY,walking:p.state==='walk',scripted:!!c.scriptedWalking,clipTime:p.variants.get('walk').action.time});if(window.trackStep)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
        await page.keyboard.press('f');await page.waitForFunction(()=>{const a=window.stockWarsExhibition;return a.state.flags.moaAwake&&!a.scenes.townModelScene.sleepingAnna.root.userData.seated&&!a.busy;});
        assert.equal(await page.evaluate(()=>window.stockWarsExhibition.state.moaCalls),3);
        const walk=await page.evaluate(()=>{window.trackStep=false;const rows=window.walkSamples,s=window.stockWarsExhibition.scenes.townModelScene;return {distance:rows[0].x-s.town.playerController.charPosX,walkFrames:rows.filter(r=>r.walking&&r.scripted).length,maxStep:Math.max(...rows.slice(1).map((r,i)=>Math.hypot(r.x-rows[i].x,r.y-rows[i].y))),clipChanged:new Set(rows.filter(r=>r.walking).map(r=>r.clipTime.toFixed(3))).size,playerX:s.player.root.position.x,moaX:s.sleepingAnna.root.position.x};});assert(walk.distance>45&&walk.walkFrames>5&&walk.maxStep<8&&walk.clipChanged>3&&walk.playerX<walk.moaX);await page.screenshot({path:'scratch/moa-wake-walk-left.png'});console.log(JSON.stringify({walk}));assert.deepEqual(errors,[]);console.log(JSON.stringify({idle,distantFDoesNotCount:true,firstTwoRemainSeated:true,thirdWakes:true,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
