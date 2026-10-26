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
 try{const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=first-day&skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townModelScene.exteriorDoors,{},{timeout:120000});
 const output='output/building-exit-walk-v1';fs.mkdirSync(output,{recursive:true});const rows=[];
 for(const place of ['home','store','stock','information','bank']){
 const result=await page.evaluate(async place=>{
 const a=window.stockWarsExhibition,s=a.scenes,t=s.townModelScene,c=s.townStage.playerController;a.arrival.stop();a.started=true;t.arrivalActive=false;t.entryActive=false;document.body.classList.remove('title-screen-active');t.renderer.setPixelRatio(.8);
 const {leaveBuildingOnFoot,buildingDoor,roomExitPoint}=await import('/js/app/OnFootNavigation.js');const {STORY_BUILDINGS}=await import('/js/app/exhibition/BuildingTravel.js');const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
 const dfn=STORY_BUILDINGS[place],room=await s.prepareRoom(place);if(room.failed)throw Error('room failed '+place);const door=buildingDoor(t,dfn.id);await door.close();
 for(const other of s.rooms.values())other.hide();s.place=place;s.townStage.containerEl.classList.add('hidden');
 // Start in a legal interior aisle, away from its exit threshold.
 if(place==='store'){room.active=true;room.layer.classList.remove('hidden');document.body.classList.add('home-model-active');room.resize();room.startLoop();room.controller.charPosX=-140;room.controller.charPosY=90*P;}
 else{room.show();room.controller.charPosY=120*P;if(place==='home')room.controller.charPosX=0;}
 room.player.update(0);
 if(['information','bank'].includes(place))room.onExit=()=>leaveBuildingOnFoot({room,town:t,id:dfn.id,showTown:()=>{room.hide();s.townStage.containerEl.classList.remove('hidden');s.place=dfn.outside;return true}});
 const original=[];t.player.root.traverse(mesh=>{if(mesh.isMesh)original.push({mesh,ref:mesh.material,values:[mesh.material].flat().map(m=>({m,opacity:m.opacity,transparent:m.transparent}))})});
 let ended=false,frames=0,indoorFrames=0,outsideFrames=0,openingFrames=0,mutations=0,largestStep=0,lastZ,picture=null;const samples=[];
 const pending=room.exit().finally(()=>ended=true);
 while(!ended){await new Promise(requestAnimationFrame);frames++;if(frames>1800)throw Error('exit timeout '+place);
 if(room.controller.scriptedWalking&&room.active)indoorFrames++;
 const visible=!s.townStage.containerEl.classList.contains('hidden');const angle=door.panels?Math.abs(door.panels[0].pivot.rotation.y):Math.abs(t.scene.getObjectByName(dfn.id).getObjectByName((place==='home'?'home':place==='store'?'store':'information')+'-opening-door').rotation.y);
 if(visible&&angle>.01&&angle<1.49)openingFrames++;
 if(visible&&c.scriptedWalking){outsideFrames++;const z=c.charPosY/P;if(lastZ!==undefined)largestStep=Math.max(largestStep,Math.abs(z-lastZ));lastZ=z;samples.push({z,angle,shown:t.player.root.visible});if(!picture&&z>door.center.z+55&&z<door.center.z+130){t.draw();t.renderer.render(t.scene,t.camera);picture=t.renderer.domElement.toDataURL('image/png')}}
 for(const o of original){if(o.mesh.material!==o.ref)mutations++;for(const v of o.values)if(v.m.opacity!==v.opacity||v.m.transparent!==v.transparent)mutations++;}
 }
 await pending;return {place,frames,indoorFrames,outsideFrames,openingFrames,mutations,largestStep,finalZ:c.charPosY/P-door.center.z,active:t.entryActive,locked:!!c.scriptedWalking,picture,samples};
 },place);
 if(result.picture)fs.writeFileSync(output+'/'+(root.includes('resources')?'executable':'web')+'-'+place+'.png',Buffer.from(result.picture.split(',')[1],'base64'));delete result.picture;rows.push(result);
 assert(result.indoorFrames>5,place+' interior walk');assert(result.outsideFrames>10);assert(result.openingFrames>2);assert.equal(result.mutations,0);assert(result.largestStep<10);assert(result.finalZ>=189);assert(!result.active&&!result.locked);
 }
 fs.writeFileSync(output+'/'+(root.includes('resources')?'executable':'web')+'-checks.json',JSON.stringify({rows,errors},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({rows:rows.map(({samples,...r})=>r),errors},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
