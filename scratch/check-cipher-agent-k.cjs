const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req,res) => {
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(8099,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8099/?scene=cipher-lobby');
 await page.waitForFunction(()=>window.stockWarsApp?.cipherLobbyScene?.player?.state==='idle',null,{timeout:90000});
 const report=await page.evaluate(async()=>{
 const s=window.stockWarsApp.cipherLobbyScene;await s.ready;
 const model=await s.room.userData.agentKReady;
 const THREE=await import('/vendor/three/three.module.js');
 const {LOBBY,lobbyCanStand}=await import('/js/data/cipherLobbyRoom.js');
 s.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model);
 return {count:s.room.children.filter(o=>o.name==='cipher-agent-k').length,
 grounded:Math.abs(box.min.y)<.01,behindDesk:box.max.z<LOBBY.desk.z-LOBBY.desk.depth/2,
 crystal:!!model.getObjectByName('AgentK_Crystal'),vest:!!model.getObjectByName('AgentK_Vest'),
 collision:!lobbyCanStand(LOBBY.agentK.x,LOBBY.agentK.z),bounds:{min:box.min.toArray(),max:box.max.toArray()}};
 });
 assert.equal(report.count,1);for(const key of ['grounded','behindDesk','crystal','vest','collision'])assert(report[key],JSON.stringify(report));
 await page.screenshot({path:'scratch/cipher-agent-k-desk.png'});
 await page.evaluate(()=>{const s=window.stockWarsApp.cipherLobbyScene;s.camera.position.set(180,160,350);s.camera.lookAt(0,85,-200);});
 await page.waitForTimeout(150);await page.screenshot({path:'scratch/cipher-agent-k-close.png'});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.stockWarsApp.cipherLobbyScene.active);
 assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
