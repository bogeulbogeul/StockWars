const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
 if(req.url.split('?')[0]==='/tests/CollisionAuditScenes.js')return fs.readFile(path.resolve('web/tests/CollisionAuditScenes.js'),(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type','text/javascript');res.end(b);});
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active,null,{timeout:60000});
  const setup=await page.evaluate(async()=>{
   const a=window.stockWarsExhibition,s=a.scenes;await s.ready;cancelAnimationFrame(s.frame);a.arrival.stop();a.busy=false;
   const town=s.townModelScene,bus=town.busSeat,c=bus.c,P=Math.sin(26*Math.PI/180),b=bus.bounds;
   c.charPosX=b.min.x+42+12;c.charPosY=(b.max.z+42+8)*P;town.player.previous={x:c.charPosX,z:c.charPosY/P};town.player.setState('idle');town.player.update(0);bus.update();document.activeElement?.blur();
   window.seatOwner=town;return {busEnabled:bus.enabled(),busNear:bus.near(),legal:c.canStand(c.charPosX,c.charPosY),bones:[]};
  });console.log('SETUP',setup);
  await page.keyboard.press('e');
  console.log('BUS AFTER E',await page.evaluate(()=>({seated:window.seatOwner.town.playerController.busSeated,state:window.seatOwner.busSeat.state})));
  assert.equal(await page.evaluate(()=>window.seatOwner.town.playerController.busSeated),true,'Bus E after arrival');
  await page.keyboard.press('e');assert.equal(await page.evaluate(()=>window.seatOwner.town.playerController.busSeated),false);
  await page.getByRole('button',{name:'E · 정류장 의자에 앉기',exact:true}).click({timeout:3000});
  assert.equal(await page.evaluate(()=>window.seatOwner.town.playerController.busSeated),true,'Bus click after arrival');
  await page.keyboard.press('w');assert.equal(await page.evaluate(()=>window.seatOwner.town.playerController.busSeated),false,'W stands from bus');
  console.log('PASS bus keyboard sit/stand, button click and W stand after arrival');
  const targets=await page.evaluate(async()=>{
   const a=window.stockWarsExhibition,town=a.scenes.townModelScene;
   window.seatOwners=new Map([['town',town]]);const {auditRoom}=await import('/tests/CollisionAuditScenes.js');
   for(const place of ['information','bank','stock','training','simulation'])window.seatOwners.set(place,await auditRoom(a,place));
   const result=[];for(const [place,owner]of window.seatOwners)for(const seat of owner.seatInteraction.seats){if(!owner.seatInteraction.occupied(seat)&&owner.seatInteraction.exits(seat).length)result.push({place,id:seat.id});}
   return result;
  });
  const checked=[];
  for(const target of targets){
   const before=await page.evaluate(target=>{
    const a=window.stockWarsExhibition;for(const [place,owner]of window.seatOwners){if(place==='town')owner.town.containerEl.classList.add('hidden');else owner.hide();}
    const owner=window.seatOwners.get(target.place);if(target.place==='town')owner.town.containerEl.classList.remove('hidden');else{owner.show();cancelAnimationFrame(owner.frame);owner.frame=null;}
    a.busy=false;a.scenes.informationAwaitingTalk=false;const manager=owner.seatInteraction,c=manager.c,p=owner.player;
    const seat=manager.seats.find(s=>s.id===target.id);c.keysHeld.clear();p.setState('idle');
    let exit;
    for(const candidate of manager.exits(seat)){c.charPosX=candidate.x;c.charPosY=candidate.y;if(manager.nearest()?.id===seat.id){exit=candidate;break;}}
    if(!exit)throw Error('No keyboard approach selecting '+seat.id);
    p.previous={x:exit.x,z:exit.y/Math.sin(26*Math.PI/180)};p.update(0);manager.update(0);owner.busSeat?.update();
    window.seatOwner=owner;window.seatController=c;window.seatManager=manager;
    const bones=[];p.variants.get('walk').model.traverse(b=>{if(b.isBone&&/^Leg\.?[LR]$/.test(b.name))bones.push({bone:b,position:b.position.toArray(),rotation:b.quaternion.toArray()});});window.seatBaseline=bones;
    document.activeElement?.blur();return {enabled:manager.enabled(),nearest:manager.nearest()?.id,bones:bones.length};
   },target);
   assert.equal(before.enabled,true,JSON.stringify({target,before}));assert.equal(before.bones,2);
   await page.keyboard.press('e');
   const seated=await page.evaluate(()=>({seated:window.seatController.busSeated,id:window.seatManager.selected?.id}));
   assert.deepEqual(seated,{seated:true,id:target.id});
   await page.keyboard.press('e');
   const standing=await page.evaluate(()=>({seated:window.seatController.busSeated,legal:window.seatController.canStand(window.seatController.charPosX,window.seatController.charPosY),restored:window.seatBaseline.every(s=>[...s.bone.position.toArray(),...s.bone.quaternion.toArray()].every((v,i)=>Math.abs(v-[...s.position,...s.rotation][i])<1e-6))}));
   assert.deepEqual(standing,{seated:false,legal:true,restored:true});checked.push(target);console.log('SEAT PASS',target.place,target.id);
  }
  console.log('PASS all keyboard seats',checked.length);assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
