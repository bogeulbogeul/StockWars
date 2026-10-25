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
 await page.waitForFunction(()=>window.stockWarsApp?.enterBankModel,null,{timeout:90000});
 const start=page.getByRole('button',{name:'게임 시작',exact:true});if(await start.isVisible())await start.click();
 for(let i=0;i<3;i++){const skip=page.getByRole('button',{name:/건너뛰기/});if(await skip.isVisible()){await skip.click();await page.waitForTimeout(150);}}
 await page.evaluate(()=>window.stockWarsApp.enterBankModel());
 await page.waitForFunction(()=>window.stockWarsApp.bankModelScene?.active,null,{timeout:30000});
 await page.evaluate(async()=>{await window.stockWarsApp.bankModelScene.ready;});
 const result=await page.evaluate(async()=>{
 const s=window.stockWarsApp.bankModelScene;if(s.failed)throw Error('Lobby load failed');
 const t=await s.room.userData.chagokReady;
 const meshes=[];t.traverse(o=>{if(o.isMesh)meshes.push(o.name);});
 const {Box3}=await import('/vendor/three/three.module.js');
 const {BANK_ROOM,CHAGOK_POSITION,bankCanStand}=await import('/js/data/bankModelRoom.js');
 s.room.updateMatrixWorld(true);const box=new Box3().setFromObject(t);
 return {meshes,count:s.room.children.filter(o=>o.name==='chagok-character').length,
 height:box.max.y-box.min.y,footY:box.min.y,seatY:t.position.y,centerX:t.position.x,centerZ:t.position.z,active:s.active,
 collision:!bankCanStand(CHAGOK_POSITION.x,CHAGOK_POSITION.z),spawnClear:bankCanStand(BANK_ROOM.spawn.x,BANK_ROOM.spawn.z),
 sidePathClear:bankCanStand(230,0),exitClear:bankCanStand(0,320)};
 });
 console.log(JSON.stringify(result));assert.equal(result.count,1);assert.equal(result.meshes.filter(n=>/seed_shell/.test(n)).length,2);assert(result.meshes.some(n=>/brown_round_glasses/.test(n)));
 assert(!result.meshes.some(n=>/collar|Vest|Apron/i.test(n)));assert(result.height>100&&result.height<120);assert(result.footY>45&&result.footY<64.5);
 assert(result.collision&&result.spawnClear&&result.sidePathClear&&result.active);assert(result.exitClear);assert.equal(result.centerX,0);assert.equal(result.centerZ,-103);assert(Math.abs(result.seatY-66.7)<.001);
 await page.screenshot({path:`output/chagok-seat-inward-v7/lobby${runtime?'-runtime':''}.png`});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 await page.screenshot({path:`output/chagok-seat-inward-v7/lobby-small${runtime?'-runtime':''}.png`});
 await page.close();
 let exhibition = null;
 if (!process.argv.includes('--standard-only')) {
 const firstDay = await browser.newPage({viewport:{width:1280,height:800}});
 firstDay.on('pageerror',e=>errors.push(e.message));
 await firstDay.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
 await firstDay.waitForFunction(()=>window.stockWarsExhibition?.scenes,null,{timeout:30000});
 exhibition = await firstDay.evaluate(async()=>{
   const scenes=window.stockWarsExhibition.scenes;
   await Promise.race([scenes.show('bank'),new Promise((_,reject)=>setTimeout(()=>reject(Error('First-day bank load timed out')),45000))]);
   const s=scenes.rooms.get('bank');
   return {count:s.room.children.filter(o=>o.name==='chagok-character').length,active:s.active,failed:!!s.failed};
 });
 assert.deepEqual(exhibition,{count:1,active:true,failed:false});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`output/chagok-seat-inward-v7/check${runtime?'-runtime':''}.json`,JSON.stringify({root,result,exhibition,errors},null,2));
 console.log('PASS Chagok bank model, scale, ground, collision, doors, viewport and asset loading');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});











