const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
  try { await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active,null,{timeout:20000}); }
  catch(error){console.log('BOOT DIAGNOSTIC',await page.evaluate(()=>({started:window.stockWarsExhibition?.started,cursor:window.stockWarsExhibition?.state?.cursor,busy:window.stockWarsExhibition?.busy,tour:window.stockWarsExhibition?.scenes?.tourActive,body:document.body.innerText.slice(0,1200)})),errors);throw error;}
  const before=await page.evaluate(async()=>{
   const a=window.stockWarsExhibition,s=a.scenes;await s.ready;await s.townModelScene.player.ready;
   cancelAnimationFrame(s.frame);a.arrival.stop();a.busy=false;
   const c=s.townStage.playerController,p=s.townModelScene.player;
   for(let x=940;x<=1160;x+=20)for(let y=2320;y<=2400;y+=20){if(c.canJumpAt(x,y)){c.charPosX=x;c.charPosY=y;break;}}
   p.setState('idle');p.update(0);document.activeElement?.blur();
   const allowed=c.canJumpAt(c.charPosX,c.charPosY),scripted=p.play('jump',{scripted:true});p.setState('idle');
   return {allowed,scripted,blocked:p.blocked(),place:s.place};
  });
  console.log('SETUP',before);
  await page.keyboard.press('Space');
  const state=await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state);
  console.log('REAL SPACE',state);assert.equal(state,'jump');
  await page.evaluate(()=>{const p=window.stockWarsApp.townModelScene.player;for(let i=0;i<30;i++)p.update(.02);});
  assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.jump.active),false);
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.busy=true;a.scenes.tourActive=true;});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'jump');
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.scenes.townModelScene.player.setState('idle');a.scenes.townStage.playerController.scriptedWalking=true;});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'idle');
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.busy=false;a.scenes.tourActive=false;a.scenes.townStage.playerController.scriptedWalking=false;});
  await page.evaluate(()=>{const input=document.createElement('input');input.id='jump-input-test';document.body.append(input);input.focus();});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'idle');
  await page.evaluate(()=>{document.getElementById('jump-input-test').remove();window.stockWarsExhibition.busy=true;document.activeElement?.blur();});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'idle');
  await page.evaluate(()=>{window.stockWarsExhibition.busy=false;window.stockWarsApp.townStage.playerController.busSeated=true;});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'idle');
  await page.evaluate(()=>{const c=window.stockWarsApp.townStage.playerController;c.busSeated=false;window.originalJumpCheck=c.canJumpAt;c.canJumpAt=()=>false;});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.player.state),'idle');
  await page.evaluate(()=>{window.stockWarsApp.townStage.playerController.canJumpAt=window.originalJumpCheck;});
  const fallback=await page.evaluate(()=>{
   const p=window.stockWarsApp.townModelScene.player,c=window.stockWarsApp.townStage.playerController;
   const jump=c.canJumpAt,stand=c.canStand;delete c.canJumpAt;c.canStand=()=>true;
   const allowed=p.play('jump',{scripted:true});p.setState('idle');c.canStand=()=>false;
   const blocked=p.play('jump',{scripted:true});c.canJumpAt=jump;c.canStand=stand;return {allowed,blocked};
  });assert.deepEqual(fallback,{allowed:true,blocked:false});
  const rooms=[];
  for(const place of ['home','store','information','bank','stock']){
   await page.evaluate(async place=>{
    const s=window.stockWarsApp;await s.show(place);const room=s.rooms.get(place);cancelAnimationFrame(room.frame);room.frame=null;
    const c=room.controller,P=Math.sin(26*Math.PI/180);let found=false;
    for(let x=-200;x<=200&&!found;x+=25)for(let z=-150;z<=180&&!found;z+=25){if(c.canJumpAt(x,z*P)){c.charPosX=x;c.charPosY=z*P;found=true;}}
    if(!found)throw Error('No clear jump floor: '+place);
    room.player.setState('idle');room.player.update(0);document.activeElement?.blur();
   },place);
   await page.keyboard.press('Space');
   const state=await page.evaluate(place=>window.stockWarsApp.rooms.get(place).player.state,place);assert.equal(state,'jump',place);rooms.push(place);
   await page.evaluate(place=>{const p=window.stockWarsApp.rooms.get(place).player;for(let i=0;i<30;i++)p.update(.02);},place);
  }
  assert.deepEqual(errors,[]);console.log('PASS real Space after arrival and in rooms; input/busy/seated/overhead guards',rooms);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
