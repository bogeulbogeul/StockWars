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
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);const result=await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();await a.scenes.ready;const room=await a.scenes.prepareRoom('home');const {MoaCharacter}=await import('/js/components/town3d/MoaCharacter.js');const moa=new MoaCharacter(room.scene,{x:110,z:-60});await moa.ready;moa.root.visible=false;room.room.userData.moa=moa;a.scenes.place='home';const {presentSomangi}=await import('/js/app/exhibition/SomangiPresentation.js');await presentSomangi(a.scenes,{kind:'line',speaker:'소망이',text:'집에 돌아왔네.'});return {hiddenMoa:!moa.root.visible,facesHiddenMoa:room.player.storyTarget===moa.root,facesCamera:room.player.storyCamera===room.camera};});assert(result.hiddenMoa&&!result.facesHiddenMoa&&result.facesCamera);console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
