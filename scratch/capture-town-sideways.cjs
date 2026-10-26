const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('web'),out=path.resolve('output/somangi-sideways-town-capture-v1');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
  await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active,null,{timeout:60000});
  const setup=await page.evaluate(async()=>{
   const a=window.stockWarsExhibition,s=a.scenes;await s.ready;a.arrival.stop();cancelAnimationFrame(s.frame);a.busy=false;
   const town=s.townModelScene,c=s.townStage.playerController,p=town.player;
   const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
   const {updateSomangiClearance}=await import('/js/components/town3d/SomangiClearance.js');
   const candidates=[];
   for(let x=536;x<=600;x+=2){
    let probe={},run=[],inside=false,entry=-1,exit=-1;
    for(let z=3500;z<=4700;z+=5){
     if(!c.canStand(x,z*P)){probe={};run=[];inside=false;entry=exit=-1;continue;}
     updateSomangiClearance(probe,0,1,x,z,(px,pz)=>c.canStand(px,pz*P));run.push({z,narrow:!!probe.somangiCrab});
     if(!inside&&probe.somangiCrab){inside=true;entry=run.length-1;}
     if(inside&&!probe.somangiCrab&&exit<0)exit=run.length-1;
     if(entry>=15&&exit-entry>=12&&exit>=0&&run.length-exit>=15){candidates.push({x,startZ:run[Math.max(0,entry-60)].z,endZ:z,entryZ:run[entry].z,exitZ:run[exit].z,length:run[exit].z-run[entry].z});break;}
    }
   }
   candidates.sort((a,b)=>b.length-a.length);const route=candidates[0];if(!route)return {route:null};
   for(let z=route.endZ+5;z<=Math.min(4700,route.endZ+120);z+=5){if(!c.canStand(route.x,z*P))break;route.endZ=z;}
   route.endZ=Math.min(route.endZ,route.exitZ+140);
   Object.assign(c,{charPosX:route.x,charPosY:route.startZ*P,facing:'down',somangiCrab:false,somangiCrabAuto:false,somangiTravelAxis:null,jumpActive:false,busSeated:false,isResting:false,scriptedWalking:false});
   c.keysHeld.clear();p.setState('idle');p.previous=null;p.storyYaw=p.storyTarget=p.storyCamera=null;p.update(0);a.view.root.hidden=true;
   // Let the game's conversation-to-follow camera transition finish before recording.
   for(let i=0;i<40;i++){town.lastDrawTime=performance.now()-1000/30;town.draw();}
   c.keysHeld.add('s');
   const badge=document.createElement('div');badge.style.cssText='position:fixed;left:20px;top:18px;z-index:2147483647;padding:12px 18px;border:1px solid #b8a480;border-radius:12px;background:#fff9ec;color:#4b4234;font:bold 20px sans-serif';document.body.append(badge);
   window.captureTownStep=()=>{
    c.keysHeld.add('s');
    town.lastDrawTime=performance.now()-1000/30;town.draw();
    badge.textContent='가구점 외벽·숲 경계 · '+(p.state==='sideways'?'옆걸음':p.state==='walk'?'일반 걷기':'멈춤');
    return {state:p.state,x:c.charPosX,z:c.charPosY/P,legal:c.canStand(c.charPosX,c.charPosY),enabled:town.seatInteraction.enabled(),busy:a.busy,keys:[...c.keysHeld],done:c.charPosY/P>=route.endZ};
   };
   return {route};
  });
  console.log('TOWN ROUTE',setup);assert.ok(setup.route);
  const frames=[];fs.mkdirSync(path.join(out,'frames'),{recursive:true});
  for(let i=0;i<180;i++){
   const info=await page.evaluate(()=>window.captureTownStep());frames.push(info);assert.equal(info.legal,true);
   await page.screenshot({path:path.join(out,'frames',String(i).padStart(3,'0')+'.png')});if(info.done)break;
  }
  const phases=frames.map(f=>f.state).filter((state,i,array)=>!i||state!==array[i-1]);
  fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({place:'actual TownModelScene, furniture exterior and woodland boundary',fps:30,route:setup.route,phases,frames,errors},null,2));
  console.log('LAST FRAME',frames.at(-1));assert.deepEqual(phases,['walk','sideways','walk']);assert.deepEqual(errors,[]);
  console.log('CAPTURE PASS',frames.length,phases);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
