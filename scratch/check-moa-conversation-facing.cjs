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
        const sleeping=await page.evaluate(async()=>{
            const T=await import('/vendor/three/three.module.js'),s=window.stockWarsExhibition.scenes.townModelScene,a=s.sleepingAnna,p=s.player;
            const direction=new T.Vector3().subVectors(a.root.position,p.root.position).setY(0).normalize();
            return {playerDot:new T.Vector3(0,0,1).applyQuaternion(p.root.quaternion).dot(direction),seated:a.root.userData.seated,asleep:a.root.userData.sleeping,bodyYaw:a.root.rotation.y,headYaw:a.root.getObjectByName('Head').quaternion.y,calls:window.stockWarsExhibition.state.moaCalls};
        });assert(sleeping.playerDot>.999&&sleeping.seated&&sleeping.asleep&&sleeping.calls===1&&Math.abs(sleeping.bodyYaw)<.001);
        await page.keyboard.press('f');await page.keyboard.press('f');await page.waitForFunction(()=>{const a=window.stockWarsExhibition;return !a.busy&&!a.scenes.townModelScene.sleepingAnna.root.userData.seated;});
        const facing=()=>page.evaluate(async()=>{const T=await import('/vendor/three/three.module.js'),s=window.stockWarsExhibition.scenes.townModelScene,a=s.sleepingAnna,p=s.player;const d=new T.Vector3().subVectors(a.root.position,p.root.position).setY(0).normalize();return {playerDot:new T.Vector3(0,0,1).applyQuaternion(p.root.quaternion).dot(d),moaDot:new T.Vector3(0,0,1).applyQuaternion(a.root.quaternion).dot(d.clone().negate()),target:p.storyTarget===a.root};});
        const stood=await facing();assert(stood.playerDot>.999&&stood.moaDot>.999&&stood.target);
        await page.screenshot({path:'scratch/moa-mutual-conversation.png'});
        await page.keyboard.press('Enter');await page.waitForFunction(()=>!window.stockWarsExhibition.busy);const next=await facing();assert(next.playerDot>.999&&next.moaDot>.999);
        const movementRestored=await page.evaluate(()=>{const s=window.stockWarsExhibition.scenes.townModelScene;s.town.playerController.charPosX+=5;s.player.update(.016);return !s.player.storyTarget;});assert(movementRestored);assert.deepEqual(errors,[]);
        console.log(JSON.stringify({sleeping,stood,next,movementRestored,errors}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
