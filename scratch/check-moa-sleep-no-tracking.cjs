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


(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.view);await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);const result=await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();const scene=a.scenes.townModelScene,m=scene.sleepingAnna,p=scene.player;await m.setAwake(false);const head=m.root.getObjectByName('Head');m.update(0);const rest=head.quaternion.clone();p.root.position.x=m.root.position.x-200;m.faceTarget(p.root);m.update(0);const left=head.quaternion.clone();p.root.position.x=m.root.position.x+200;m.faceTarget(p.root);m.update(0);const right=head.quaternion.clone();const sleepingTarget=m.conversationTarget;const yaw=m.root.rotation.y;m.update(.1);const nod=head.quaternion.angleTo(right);await m.setAwake(true,{immediate:true});m.faceTarget(p.root);return {leftTurn:rest.angleTo(left),rightTurn:left.angleTo(right),sleepingTarget:!!sleepingTarget,sleepingYaw:yaw,nod,awakeTracks:m.conversationTarget===p.root};});assert(result.leftTurn<.000001&&result.rightTurn<.000001);assert(!result.sleepingTarget&&result.sleepingYaw===0);assert(result.nod>.000001&&result.awakeTracks);console.log(JSON.stringify(result));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});