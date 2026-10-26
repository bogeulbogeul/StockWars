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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);const result=await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.busy=true;a.view.panel.hidden=true;const s=a.scenes;await s.ready;await s.townModelScene.sleepingAnna.setAwake(true,{immediate:true});const r=await s.prepareRoom('home');const {MoaCharacter}=await import('/js/components/town3d/MoaCharacter.js');const moa=new MoaCharacter(r.scene,{x:110,z:-60});await moa.ready;r.room.userData.moa=moa;r.room.userData.update=dt=>moa.update(dt);s.place='home';s.townStage.containerEl.classList.add('hidden');r.show();r.renderer.setPixelRatio(.35);s.townModelScene.renderer.setPixelRatio(.35);const samples=[];const timer=setInterval(()=>samples.push({indoor:moa.root.position.toArray(),visible:moa.root.visible,player:r.player.root.position.toArray(),inside:r.active,outside:s.townModelScene.sleepingAnna.root.position.toArray(),walking:!!s.townStage.playerController.scriptedWalking}),25);try{const {leaveHomeWithMoa}=await import('/js/app/exhibition/HomeDeparture.js');await leaveHomeWithMoa(s);}finally{clearInterval(timer)}return{samples,place:s.place,moaVisible:s.townModelScene.sleepingAnna.root.visible}});assert.equal(result.place,'homeOutside');assert(result.moaVisible);assert(result.samples.some(f=>f.indoor[2]>270));assert(result.samples.filter(f=>f.walking).length>10);assert.deepEqual(errors,[]);console.log(JSON.stringify({homeExitFrames:result.samples.length,moaFirst:true,walked:true,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
