const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.wav':'audio/wav'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url);
  await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.music);
  await page.mouse.click(2,2);
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.context?.state==='running');
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage==='title');
  assert.deepEqual(await page.evaluate(()=>[...window.stockWarsApp.townModelScene.music.voices.keys()]),['title'],'title plays only theme');
  await page.goto(url+'/?demo=first-day&skipOpening=1');
  await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active);
  await page.evaluate(()=>{window.stockWarsApp.townModelScene.scene.userData.skyTimeOfDay='dawn';});
  assert.equal(await page.evaluate(()=>!!window.stockWarsApp.townModelScene.music.context),false);
  await page.mouse.click(2,2);
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage==='dawn');
  const stages=[];
  for(const stage of ['dawn','day','sunset','night']) {
   await page.evaluate(stage=>{window.stockWarsApp.townModelScene.scene.userData.skyTimeOfDay=stage;},stage);
   await page.waitForFunction(stage=>window.stockWarsApp.townModelScene.music.currentStage===stage,stage);
   if(stage!=='dawn') {
    const before=await page.evaluate(()=>{const m=window.stockWarsApp.townModelScene.music;return [...m.voices].map(([stage,v])=>({stage,to:v.to,from:v.from,gain:v.gain.gain.value}));});
    assert.ok(before.some(v=>v.to===0&&v.gain>.8),JSON.stringify(before));
    assert.ok(before.find(v=>v.stage===stage).gain<.2);
   }
   await page.waitForTimeout(6400);
   const result=await page.evaluate(()=>{const m=window.stockWarsApp.townModelScene.music;return {stage:m.currentStage,voices:m.voices.size,gain:m.voices.get(m.currentStage).gain.gain.value,loop:m.voices.get(m.currentStage).source.loop,duration:m.voices.get(m.currentStage).source.buffer.duration};});
   assert.equal(result.voices,1);assert.equal(result.loop,true);assert.ok(Math.abs(result.gain-1)<.001);stages.push(result);
  }
  // Interrupt a fade, then return to a still-fading source without restarting it.
  const rapid=await page.evaluate(async()=>{
   const m=window.stockWarsApp.townModelScene.music,sky=window.stockWarsApp.townModelScene.scene.userData;
   const old=m.voices.get('night').source;sky.skyTimeOfDay='day';
   await new Promise(r=>setTimeout(r,850));sky.skyTimeOfDay='night';
   await new Promise(r=>setTimeout(r,850));
   return {stage:m.currentStage,reused:m.voices.get('night').source===old,gains:[...m.voices.values()].map(v=>v.gain.gain.value)};
  });
  assert.equal(rapid.stage,'night');assert.equal(rapid.reused,true);assert.ok(rapid.gains.every(g=>g>=0&&g<=1));
  const indoors=await page.evaluate(async()=>{
   const s=window.stockWarsApp,m=s.townModelScene.music,old=m.voices.get('night').source;
   await s.show('home');await new Promise(r=>setTimeout(r,800));
   const inside={same:m.voices.get('night').source===old,indoors:m.indoors,volume:m.master.gain.value};
   await s.show('arrival');await new Promise(r=>setTimeout(r,800));
   return {inside,outside:m.master.gain.value};
  });
  assert.ok(indoors.inside.same&&indoors.inside.indoors);assert.ok(indoors.inside.volume<indoors.outside);
  await page.getByRole('button',{name:'배경음악 끄기'}).click();await page.waitForTimeout(900);
  assert.ok(await page.evaluate(()=>window.stockWarsApp.townModelScene.music.master.gain.value<.01));
  assert.equal(await page.evaluate(()=>localStorage.getItem('stockwars-town-music-muted-v1')),'1');
  await page.getByRole('button',{name:'배경음악 켜기'}).click();
  const clock=await page.evaluate(async()=>{
   const model=window.stockWarsApp.townModelScene;
   const {timeOfDayService:clock}=await import('/js/engine/timeOfDayService.js');
   delete model.scene.userData.skyTimeOfDay;clock.setTimeOfDay('day',true);
   const manual=model.landscape.sky.currentStage(performance.now());
   document.body.classList.add('exhibition-sunset');
   const story=model.landscape.sky.currentStage(performance.now());
   document.body.classList.remove('exhibition-sunset');
   clock.setTimeOfDay('night',true);
   model.scene.userData.skyTimeOfDay='night';
   return {manual,story};
  });assert.deepEqual(clock,{manual:'day',story:'sunset'});
  const hidden=await page.evaluate(async()=>{
   const m=window.stockWarsApp.townModelScene.music;
   Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
   await new Promise(r=>setTimeout(r,150));const state=m.context.state;
   Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
   await new Promise(r=>setTimeout(r,150));delete document.hidden;
   return {hidden:state,visible:m.context.state};
  });assert.deepEqual(hidden,{hidden:'suspended',visible:'running'});
  // Render the actual decoded files across the wrap and measure audio, not only flags.
  const loops=await page.evaluate(async()=>{
   const m=window.stockWarsApp.townModelScene.music,results=[];
   for(const [stage,b] of m.buffers){
    const offline=new OfflineAudioContext(2,8820,44100),s=offline.createBufferSource();
    s.buffer=b;s.loop=true;s.loopEnd=b.duration;s.connect(offline.destination);s.start(0,b.duration-.1);
    const rendered=await offline.startRendering(),a=rendered.getChannelData(0);
    let sum=0;for(const v of a)sum+=v*v;
    results.push({stage,rms:Math.sqrt(sum/a.length),seam:Math.abs(a[4410]-a[4409]),finite:[...a].every(Number.isFinite)});
   }return results;
  });assert.equal(loops.length,4);assert.ok(loops.every(v=>v.rms>.005&&v.finite&&v.seam<.02));
  // Failed loading retains existing audio and throttles retries; no unhandled error.
  await page.route('**/dawn-loop.wav',route=>route.fulfill({status:503,body:'unavailable'}));
  const failure=await page.evaluate(async()=>{
   const s=window.stockWarsApp,m=s.townModelScene.music;m.buffers.delete('dawn');
   s.townModelScene.scene.userData.skyTimeOfDay='dawn';
   await new Promise(r=>setTimeout(r,500));
   return {stage:m.currentStage,retry:m.retryAt>performance.now(),hasOld:m.voices.has('night')};
  });assert.deepEqual(failure,{stage:'night',retry:true,hasOld:true});
  assert.deepEqual(errors,[]);
  const report={root,stages,rapid,indoors,clock,visibilityHandler:hidden,loops,failure,errors};
  fs.mkdirSync('output/town-time-music-game-v1',{recursive:true});
  await page.screenshot({path:`output/town-time-music-game-v1/${root.includes('win-unpacked')?'desktop':'web'}-music-control.png`});
  fs.writeFileSync(`output/town-time-music-game-v1/${root.includes('win-unpacked')?'desktop':'web'}-validation.json`,JSON.stringify(report,null,2));
  console.log('PASS',JSON.stringify(report));
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
