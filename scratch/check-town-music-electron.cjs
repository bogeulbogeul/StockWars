const path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
const {_electron}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const app=await _electron.launch({executablePath:path.resolve('electron-app/node_modules/electron/dist/electron.exe'),args:[path.resolve('scratch/town-music-electron-harness.cjs')]});
 try {
  app.process().stderr.on('data',chunk=>process.stderr.write(chunk));
  const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>console.log('renderer:',msg.text()));
  if (process.env.STOCKWARS_AUDIO_BASELINE === '1') {
   await page.getByRole('button').click();
   await page.waitForFunction(()=>window.baselineFinished);
   console.log('Baseline AudioContext PASS');return;
  }
  await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active);
  await page.evaluate(()=>{window.stockWarsApp.townModelScene.scene.userData.skyTimeOfDay='dawn';});
  await page.mouse.click(2,2);
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage==='dawn');
  const decoded=await page.evaluate(async()=>{
   const m=window.stockWarsApp.townModelScene.music,result=[];
   for(const stage of ['dawn','day','sunset','night']) {const b=await m.load(stage);result.push({stage,seconds:b.duration,channels:b.numberOfChannels});}
   return result;
  });assert.equal(decoded.length,4);
  await page.waitForTimeout(6300);
  await page.evaluate(()=>{window.stockWarsApp.townModelScene.scene.userData.skyTimeOfDay='sunset';});
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage==='sunset');
  const fading=await page.evaluate(()=>[...window.stockWarsApp.townModelScene.music.voices].map(([stage,v])=>({stage,from:v.from,to:v.to})));
  assert.ok(fading.find(v=>v.stage==='dawn'&&v.to===0));assert.ok(fading.find(v=>v.stage==='sunset'&&v.to===1));
  await page.waitForTimeout(6400);
  const end=await page.evaluate(()=>{const m=window.stockWarsApp.townModelScene.music;return {stage:m.currentStage,voices:m.voices.size,state:m.context.state,gain:m.voices.get('sunset').gain.gain.value,url:location.protocol};});
  assert.deepEqual(end,{stage:'sunset',voices:1,state:'running',gain:1,url:'file:'});assert.deepEqual(errors,[]);
  const result={decoded,fading,end,errors};
  fs.writeFileSync('output/town-time-music-game-v1/electron-file-validation.json',JSON.stringify(result,null,2));
  console.log('PASS',JSON.stringify(result));
 } finally {await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
