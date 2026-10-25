const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const runtime = root.includes('win-unpacked');
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
    });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&/\/assets\//.test(r.url()))errors.push(r.url());});
 await page.goto(`http://127.0.0.1:${server.address().port}/?demo=standard`);
 await page.waitForFunction(()=>window.stockWarsApp?.cipherLobby,null,{timeout:90000});
 const start=page.getByRole('button',{name:'게임 시작',exact:true});if(await start.isVisible())await start.click();
 for(let i=0;i<3;i++){const skip=page.getByRole('button',{name:/건너뛰기/});if(await skip.isVisible()){await skip.click();await page.waitForTimeout(150);}}
 await page.evaluate(()=>window.stockWarsApp.cipherLobby.open());
 await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene?.active,null,{timeout:30000});
 await page.evaluate(async()=>{await window.stockWarsApp.cipherLobbyScene.ready;});
 const result=await page.evaluate(async()=>{
 const s=window.stockWarsApp.cipherLobbyScene;if(s.failed)throw Error('Lobby load failed');
 const t=await s.room.userData.agentKReady;
 const meshes=[];t.traverse(o=>{if(o.isMesh)meshes.push(o.name);});
 const {Box3}=await import('/vendor/three/three.module.js');
 const {LOBBY,lobbyCanStand,nearbyLobbyDoor}=await import('/js/data/cipherLobbyRoom.js');
 s.room.updateMatrixWorld(true);const box=new Box3().setFromObject(t);
 return {meshes,count:s.room.children.filter(o=>o.name==='tori-character').length,
 height:box.max.y-box.min.y,footY:box.min.y,active:s.active,
 collision:!lobbyCanStand(LOBBY.agentK.x,LOBBY.agentK.z),spawnClear:lobbyCanStand(LOBBY.spawn.x,LOBBY.spawn.z),
 sidePathClear:lobbyCanStand(100,-205),trainingDoor:nearbyLobbyDoor(-380,-100)?.id,competitionDoor:nearbyLobbyDoor(380,-100)?.id};
 });
 console.log(JSON.stringify(result));assert.equal(result.count,1);assert(result.meshes.some(n=>/crystal/i.test(n)));assert(result.meshes.includes('Glasses_smooth_frame'));
 assert(!result.meshes.some(n=>/collar|Vest|Apron/i.test(n)));assert(result.height>125&&result.height<135);assert(Math.abs(result.footY)<.02);
 assert(result.collision&&result.spawnClear&&result.sidePathClear&&result.active);assert.equal(result.trainingDoor,'training');assert.equal(result.competitionDoor,'competition');
 await page.screenshot({path:`output/tori-game-v1/lobby${runtime?'-runtime':''}.png`});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 await page.screenshot({path:`output/tori-game-v1/lobby-small${runtime?'-runtime':''}.png`});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`output/tori-game-v1/check${runtime?'-runtime':''}.json`,JSON.stringify({root,result,errors},null,2));
 console.log('PASS Tori lobby model, scale, ground, collision, doors, viewport and asset loading');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


