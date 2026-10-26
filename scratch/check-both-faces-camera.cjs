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



(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.sleepingAnna);await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.arrival.stop();const s=a.scenes,t=s.townModelScene,m=t.sleepingAnna;await m.setAwake(true,{immediate:true});a.state.moaCalls=3;a.state.flags.moaAwake=true;const c=s.townStage.playerController;c.charPosX=m.root.position.x-65;c.charPosY=(m.root.position.z+100)*.4383711467890774;t.player.update(0); const {stepAsideForMoa}=await import('/js/components/town3d/SomangiStepAside.js');window.sideFrames=[];const timer=setInterval(()=>window.sideFrames.push([c.charPosX,c.charPosY,!!c.scriptedWalking]),20);await stepAsideForMoa(t.player,m);clearInterval(timer);s.place='arrival';a.state.cursor=a.plan.findLastIndex(b=>b.chapter===2);await a.render();});await page.waitForTimeout(1400);await page.screenshot({path:'scratch/bus-stop-both-faces-camera.png'});const result=await page.evaluate(async()=>{const {Vector3}=await import('/vendor/three/three.module.js');const t=window.stockWarsExhibition.scenes.townModelScene;return {fov:t.camera.fov,sideFrames:window.sideFrames.length,leftOffset:t.sleepingAnna.root.position.x-t.player.root.position.x,faces:[t.player.root,t.sleepingAnna.root].map(root=>{const forward=new Vector3(0,0,1).applyQuaternion(root.quaternion);const toward=t.camera.position.clone().sub(root.position);toward.y=0;toward.normalize();return {frontVisibility:forward.dot(toward),face:root.position.clone().add(new Vector3(0,85,0)).project(t.camera).toArray()}})}});assert(result.sideFrames>10&&Math.abs(result.leftOffset-145)<1);assert(result.faces.every(f=>f.frontVisibility>.4&&Math.abs(f.face[0])<.9));assert.deepEqual(errors,[]);console.log(JSON.stringify({result,errors}));}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});


