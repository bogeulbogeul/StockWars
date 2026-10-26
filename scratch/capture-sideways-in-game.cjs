const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('web'),out=path.resolve(process.env.SOMANGI_CAPTURE_OUT||'output/somangi-sideways-game-capture-v1');fs.mkdirSync(out,{recursive:true});
const reverse=process.env.SOMANGI_CAPTURE_REVERSE==='1';
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:760},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
  await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active,null,{timeout:60000});
  const setup=await page.evaluate(async reverse=>{
   const a=window.stockWarsExhibition,s=a.scenes;await s.ready;a.arrival.stop();cancelAnimationFrame(s.frame);a.busy=false;
   await s.show('store');const room=s.rooms.get('store');await room.player.ready;cancelAnimationFrame(room.frame);room.frame=null;
   const {updateSomangiClearance}=await import('/js/components/town3d/SomangiClearance.js');
   const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
   const c=room.controller,p=room.player;c.jumpActive=false;c.busSeated=false;c.isResting=false;c.scriptedWalking=false;p.setState('idle');
   const candidates=[];
   for(let x=-260;x<=260;x+=5){
    let probe={},run=[],inside=false,entry=-1,exit=-1;
    for(let z=-200;z<=200;z+=5){
     if(!c.canStand(x,z*P)){probe={};run=[];inside=false;entry=exit=-1;continue;}
     updateSomangiClearance(probe,0,1,x,z,(px,pz)=>c.canStand(px,pz*P));
     run.push({z,narrow:!!probe.somangiCrab});
     if(!inside&&probe.somangiCrab){inside=true;entry=run.length-1;}
     if(inside&&!probe.somangiCrab&&exit<0)exit=run.length-1;
     if(entry>=5&&exit-entry>=6&&run.length-exit>=6&&exit>=0){
      candidates.push({x,startZ:run[Math.max(0,entry-10)].z,endZ:z,entryZ:run[entry].z,exitZ:run[exit].z,length:run[exit].z-run[entry].z});break;
     }
    }
   }
   candidates.sort((a,b)=>b.length-a.length);const route=candidates[0];
   if(!route)return {route:null,candidates:0};
   const originalEnd=route.endZ;
   for(let z=originalEnd+5;z<=Math.min(180,originalEnd+110);z+=5){if(!c.canStand(route.x,z*P))break;route.endZ=z;}
   const startZ=reverse?route.endZ:route.startZ,endZ=reverse?route.startZ:route.endZ;
   const key=reverse?'w':'s',direction=reverse?-1:1,pauseZ=(route.entryZ+route.exitZ)/2;
   Object.assign(c,{charPosX:route.x,charPosY:startZ*P,facing:reverse?'up':'down',somangiCrab:false,somangiCrabAuto:false,somangiTravelAxis:null});
   c.keysHeld.clear();p.previous=null;p.storyYaw=p.storyTarget=p.storyCamera=null;p.update(0);c.keysHeld.add(key);
   let stopped=false,pauseRemaining=0;
   a.view.root.hidden=true;
   const badge=document.createElement('div');badge.id='capture-state';badge.style.cssText='position:fixed;left:20px;top:18px;z-index:2147483647;padding:12px 18px;border:1px solid #b8a480;border-radius:12px;background:#fff9ec;color:#4b4234;font:bold 20px sans-serif';document.body.append(badge);
   window.captureStep=()=>{
    if(reverse&&!stopped&&p.state==='sideways'&&c.charPosY/P<=pauseZ){stopped=true;pauseRemaining=30;}
    const paused=pauseRemaining>0;
    if(paused){c.keysHeld.clear();pauseRemaining--;}else c.keysHeld.add(key);
    room.update(1/30);room.renderer.render(room.scene,room.camera);
    const state=p.state;badge.textContent=(reverse?'반대 방향 · ':'실제 잡화점 통로 · ')+(state==='sideways'?'옆걸음':state==='walk'?'일반 걷기':c.somangiCrab?'멈춤 · 옆 방향 유지':'멈춤');
    return {state,paused,narrow:!!c.somangiCrab,x:c.charPosX,z:c.charPosY/P,legal:c.canStand(c.charPosX,c.charPosY),yaw:p.root.rotation.y,done:direction*(c.charPosY/P-endZ)>=0};
   };
   return {route,startZ,endZ,pauseZ:reverse?pauseZ:null,candidates:candidates.length};
  },reverse);
  console.log('ROUTE',JSON.stringify(setup));assert.ok(setup.route,'No actual store passage with wide/narrow/wide phases');
  const frames=[];fs.mkdirSync(path.join(out,'frames'),{recursive:true});
  for(let frame=0;frame<150;frame++){
   const info=await page.evaluate(()=>window.captureStep());frames.push(info);assert.equal(info.legal,true);
   await page.screenshot({path:path.join(out,'frames',String(frame).padStart(3,'0')+'.png')});
   if(info.done)break;
  }
  const phases=frames.map(f=>f.state).filter((state,i,array)=>!i||state!==array[i-1]);
  assert.deepEqual(phases,reverse?['walk','sideways','idle','sideways','walk']:['walk','sideways','walk']);assert.deepEqual(errors,[]);
  if(reverse){
   const paused=frames.filter(f=>f.paused);assert.equal(paused.length,30);assert.ok(paused.every(f=>f.narrow&&f.state==='idle'&&Math.abs(f.z-paused[0].z)<1e-8&&Math.cos(f.yaw-paused[0].yaw)>.999999));
   const start=frames.findIndex(f=>f.paused),end=frames.findLastIndex(f=>f.paused);assert.ok(Math.cos(frames[start-1].yaw-frames[end+1].yaw)>.999999);
  }
  fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({place:'actual VivianModelScene',fps:30,reverse,route:setup.route,startZ:setup.startZ,endZ:setup.endZ,pauseZ:setup.pauseZ,phases,frames,errors},null,2));
  console.log('CAPTURE PASS',frames.length,'frames',phases);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
