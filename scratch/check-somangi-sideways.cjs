const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
 if(req.url==='/check'){res.setHeader('Content-Type','text/html');return res.end('<body class="town-model-mode"></body>');}
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/check`);
  const report=await page.evaluate(async()=>{
   const THREE=await import('/vendor/three/three.module.js');
   const {SomangiPlayer}=await import('/js/components/town3d/SomangiPlayer.js');
   const {TownPlayerController}=await import('/js/components/town/TownPlayerController.js');
   const {createExteriorBuildingBlocker}=await import('/js/components/town3d/ExteriorBuildingBodies.js');
   const {moveTownBody}=await import('/js/components/town3d/TownBodyMovement.js');
   const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
   const walls=[{minX:-200,maxX:200,minZ:-70,maxZ:-50},{minX:-200,maxX:200,minZ:50,maxZ:70}];
   const blocked=createExteriorBuildingBlocker(walls),c=new TownPlayerController();c.charPosX=0;c.charPosY=0;c.canStand=(x,y)=>!blocked(x,y);c.canJumpAt=c.canStand;c.facing='down';
   const scene=new THREE.Scene(),player=new SomangiPlayer(scene,{playerController:c,callbacks:{isInputBlocked:()=>false}},document.body);await player.ready;player.update(0);
   c.keysHeld.add('d');c.update(.1);player.update(.1);
   const entry={state:player.state,x:c.charPosX,yaw:player.root.rotation.y};
   const firstYaw=player.root.rotation.y;c.keysHeld=new Set(['a']);c.update(.1);player.update(.1);
   const reversing={state:player.state,sameFacing:Math.cos(firstYaw-player.root.rotation.y)>.999};
   c.keysHeld=new Set(['d','shift']);const start=c.charPosX;c.update(.1);player.update(.1);const shiftDistance=c.charPosX-start;
   c.keysHeld.clear();player.update(.02);const stopped={state:player.state,narrow:c.somangiCrab};
   const jump=player.play('jump');for(let i=0;i<30;i++)player.update(.02);const landed=player.root.position.y;
   c.keysHeld=new Set(['d']);let sawSideways=false;
   for(let i=0;i<100;i++){c.update(.02);player.update(.02);sawSideways ||= player.state==='sideways';}
   const exit={state:player.state,narrow:c.somangiCrab,x:c.charPosX};
   c.keysHeld.clear();c.charPosX=0;c.charPosY=0;player.update(0);moveTownBody(c,0,100*P);const wallHeld=c.canStand(c.charPosX,c.charPosY)&&Math.abs(c.charPosY/P)<=8.001;
   const singleBlocked=createExteriorBuildingBlocker([walls[0]]);c.charPosX=0;c.charPosY=0;c.canStand=(x,y)=>!singleBlocked(x,y);c.keysHeld=new Set(['d']);c.update(.1);player.update(.1);const singleWall=player.state;
   return {variants:player.variants.size,entry,reversing,shiftDistance,stopped,jump,landed,sawSideways,exit,wallHeld,singleWall};
  });
  assert.equal(report.variants,3);assert.equal(report.entry.state,'sideways');assert.ok(Math.abs(report.entry.x-26.25)<1e-6);assert.ok(Math.abs(Math.sin(report.entry.yaw))<1e-6);
  assert.equal(report.reversing.sameFacing,true);assert.ok(Math.abs(report.shiftDistance-26.25)<1e-6);assert.deepEqual(report.stopped,{state:'idle',narrow:true});
  assert.equal(report.jump,true);assert.equal(report.landed,0);assert.equal(report.sawSideways,true);assert.equal(report.exit.state,'walk');assert.equal(report.exit.narrow,false);
  assert.equal(report.wallHeld,true);assert.equal(report.singleWall,'walk');assert.deepEqual(errors,[]);console.log('PASS',root,JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
