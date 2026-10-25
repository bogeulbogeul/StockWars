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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);
await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();a.busy=true;a.view.panel.hidden=true;const s=a.scenes;await s.ready;const r=await s.prepareRoom('information');await r.room.userData.seatMoa();s.place='information';s.townStage.containerEl.classList.add('hidden');r.show();const seat=r.seatInteraction.seats.find(x=>x.meshes.some(m=>m.name==='Round_Sage_Cushion'));seat.forward.set(0,0,-1);if(!r.seatInteraction.sit(seat))throw new Error('seat failed');r.renderer.setPixelRatio(.35);s.townModelScene.renderer.setPixelRatio(.35);window.samples=[];window.exitDone=false;window.exitError=null;window.sampleTimer=setInterval(()=>window.samples.push({dismount:!!r.playerDismounting,p:r.player.root.position.toArray(),moa:r.room.userData.moa.root.position.toArray(),seated:!!r.controller.busSeated}),20);const {leaveInformationForBank}=await import('/js/app/exhibition/InformationExit.js');leaveInformationForBank(s).then(()=>window.exitDone=true).catch(e=>window.exitError=e.message);});
await page.waitForFunction(()=>window.stockWarsExhibition.scenes.rooms.get('information').playerDismounting);await page.waitForTimeout(220);await page.screenshot({path:'scratch/player-dismount-information.png'});await page.waitForFunction(()=>window.exitDone||window.exitError);const result=await page.evaluate(()=>{clearInterval(window.sampleTimer);return {samples:window.samples,error:window.exitError}});assert.equal(result.error,null);const frames=result.samples.filter(f=>f.dismount);assert(frames.length>=5);assert(frames[0].p[1]>frames.at(-1).p[1]+10);const origin=frames[0].moa;assert(frames.every(f=>Math.hypot(...f.moa.map((v,i)=>v-origin[i]))<.01));let maxStep=0;for(let i=1;i<frames.length;i++)maxStep=Math.max(maxStep,Math.hypot(...frames[i].p.map((v,j)=>v-frames[i-1].p[j])));assert(maxStep<20);assert.deepEqual(errors,[]);console.log(JSON.stringify({dismountFrames:frames.length,startHeight:frames[0].p[1],endHeight:frames.at(-1).p[1],maxStep,moaWaits:true,exitComplete:true,errors}));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
