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



(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');
 await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.exteriorDoors,{},{timeout:120000});
 await page.evaluate(()=>{const a=window.stockWarsExhibition,t=a.scenes.townModelScene;a.arrival.stop();t.arrivalActive=false;t.entryActive=false;a.started=true;t.town.containerEl.classList.remove('hidden');document.body.classList.remove('title-screen-active');t.renderer.setPixelRatio(1)});
 const ids=await page.evaluate(()=>window.stockWarsExhibition.scenes.townModelScene.exteriorDoors.doors.map(d=>d.panels[0].pivot.name));assert.equal(ids.length,6);
 const rows=[];
 for(let i=0;i<6;i++){
 const row=await page.evaluate(async index=>{const t=window.stockWarsExhibition.scenes.townModelScene,d=t.exteriorDoors.doors[index],c=t.town.playerController;const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');c.charPosX=d.center.x;c.charPosY=(d.center.z+100)*P;c.keysHeld.clear();t.player.root.visible=true;t.draw();await d.open();t.scene.updateMatrixWorld(true);return {name:d.panels[0].pivot.name,open:d.isOpen,angles:d.panels.map(p=>p.pivot.rotation.y),dynamic:d.panels.every(p=>p.pivot.children.every(m=>m.userData.dynamicDoor)),loaded:t.loadedCount,status:t.status.textContent,statusHidden:t.status.hidden}},i);
 assert(row.open&&row.dynamic);rows.push(row);
 // Frame the actual town doorway, including its surrounding facade.
 await page.evaluate(index=>{const t=window.stockWarsExhibition.scenes.townModelScene,d=t.exteriorDoors.doors[index];t.camera.position.set(d.center.x+140,d.floorY+140,d.center.z+380);t.camera.lookAt(d.center.x,d.floorY+55,d.center.z);t.renderer.render(t.scene,t.camera)},i);
 await page.locator('.town-model-layer canvas').screenshot({path:'output/all-exterior-door-hinges-v1/game-'+i+'-open.png'});
 await page.evaluate(async index=>{const t=window.stockWarsExhibition.scenes.townModelScene,d=t.exteriorDoors.doors[index],c=t.town.playerController;c.charPosX=d.center.x+800;t.draw();await d.close();if(d.isOpen)throw Error('did not close')},i);
 }
 const entry=await page.evaluate(async()=>{const a=window.stockWarsExhibition,s=a.scenes,t=s.townModelScene,d=t.scene.getObjectByName('cipher_securities').cipherDoor,c=s.townStage.playerController;await t.sleepingAnna.setAwake(true,{immediate:true});s.place='stockOutside';c.charPosX=d.center.x;c.charPosY=(d.center.z+100)*.4383711467890774;let walked=0;const timer=setInterval(()=>{if(c.scriptedWalking)walked++},10);try{await s.show('stock');return {place:s.place,walked,entryActive:t.entryActive,roomVisible:!!s.rooms.get('stock')}}finally{clearInterval(timer)}});
 assert.equal(entry.place,'stock');assert(entry.walked>0);assert(!entry.entryActive);assert(entry.roomVisible);await page.screenshot({path:'output/all-exterior-door-hinges-v1/cipher-walk-entry.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('output/all-exterior-door-hinges-v1/'+(root.includes('resources')?'executable':'web')+'-game-checks.json',JSON.stringify({rows,entry,errors},null,2));console.log(JSON.stringify({rows,entry,errors},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
