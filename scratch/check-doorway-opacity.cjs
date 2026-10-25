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
 const result=await page.evaluate(async()=>{
 const a=window.stockWarsExhibition,t=a.scenes.townModelScene,c=t.town.playerController;a.arrival.stop();t.arrivalActive=false;t.entryActive=true;a.started=true;t.town.containerEl.classList.remove('hidden');document.body.classList.remove('title-screen-active');t.renderer.setPixelRatio(1);t.dialogueOcclusion.reset();
 const {createInformationDoor}=await import('/js/app/exhibition/InformationDoor.js');const {walkPlayerIntoInformation}=await import('/js/app/exhibition/InformationPlayerEntry.js');const {walkMoaThroughDoor}=await import('/js/app/exhibition/DoorwayMoaWalk.js');const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
 const doors=[['information',createInformationDoor(t.scene.getObjectByName('settlement_information'))],['home',createInformationDoor(t.scene.getObjectByName('home_office_tower'),{id:'home',panelName:'Home_Arched_Wood_Door',hingeName:'Home_Door_Brass_Hinge',isPart:p=>p.name.startsWith('Home_Door_'),darkFill:p=>p.name==='Home_Door_Round_Window_Glass'})],['store',createInformationDoor(t.scene.getObjectByName('vivian_store'),{id:'store',panelName:'Central_Arched_Wood_Door',isPart:p=>p.name.startsWith('Door_')&&p.name!=='Door_Continuous_Arch_Frame',darkFill:p=>p.name==='Door_Glass'})],['bank',t.scene.getObjectByName('node_finance').bankDoor],['cipher',t.scene.getObjectByName('cipher_securities').cipherDoor]];
 const rows=[],pictures=[];
 // Sample all rendered frames until each asynchronous walk completes.
 async function run(root,callback,name,door){let ended=false;const originals=[];root.traverse(mesh=>{if(mesh.isMesh)originals.push({mesh,ref:mesh.material,values:[mesh.material].flat().map(m=>({m,opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}))})});let frames=0,mutations=0,picture=null;const pending=callback().finally(()=>ended=true);while(!ended){await new Promise(requestAnimationFrame);frames++;for(const o of originals){if(o.mesh.material!==o.ref)mutations++;for(const v of o.values)if(v.m.opacity!==v.opacity||v.m.transparent!==v.transparent||v.m.depthWrite!==v.depthWrite)mutations++;}const z=name.startsWith('player')?c.charPosY/P:root.position.z;if(!picture&&z<door.center.z+55&&z>door.center.z+20){t.draw();t.renderer.render(t.scene,t.camera);picture=t.renderer.domElement.toDataURL('image/png')}if(frames>500)throw Error('walk timeout '+name);}await pending;if(picture)pictures.push({name,data:picture});rows.push({name,frames,mutations,materials:originals.length});}
 for(const [name,door]of doors){c.charPosX=door.center.x;c.charPosY=(door.center.z+105)*P;c.keysHeld.clear();t.player.root.visible=true;await door.open();await run(t.player.root,()=>walkPlayerIntoInformation(t.player,door),'player-'+name,door);await door.close();}
 await t.sleepingAnna.setAwake(true,{immediate:true});t.sleepingAnna.faceTarget(null);
 for(const [name,door]of doors.filter(([name])=>['information','bank','home'].includes(name))){const m=t.sleepingAnna;m.root.visible=true;m.root.position.set(door.center.x,0,door.center.z+105);c.charPosX=door.center.x+200;c.charPosY=(door.center.z+105)*P;await door.open();await run(m.root,()=>walkMoaThroughDoor(m,door,c),'moa-'+name,door);await door.close();}
 return {rows,pictures};
 });
 const output='output/doorway-opaque-characters-v1';fs.mkdirSync(output,{recursive:true});const label=root.includes('resources')?'executable':'web';for(const p of result.pictures)fs.writeFileSync(output+'/'+label+'-'+p.name+'.png',Buffer.from(p.data.split(',')[1],'base64'));delete result.pictures;fs.writeFileSync(output+'/'+label+'-checks.json',JSON.stringify({...result,errors},null,2));for(const row of result.rows){assert(row.frames>10);assert.equal(row.mutations,0,row.name)}assert.equal(result.rows.length,8);assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,errors},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
