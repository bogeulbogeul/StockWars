const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,_electron}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),native=process.argv.includes('--electron');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.wav':'audio/wav','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 let browser,app,page;
 if(native){
  app=await _electron.launch({executablePath:path.resolve('electron-app/node_modules/electron/dist/electron.exe'),args:[path.resolve('scratch/town-music-electron-harness.cjs')],env:{...process.env,STOCKWARS_TITLE_CHECK:'1'}});
  page=await app.firstWindow();
 }else{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,channel:'msedge'});page=await browser.newPage();
 }
 try {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(!native)await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button',{name:'게임 시작',exact:true}).waitFor();
  await page.mouse.click(2,2);
  await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.music.currentStage==='title');
  const title=await page.evaluate(()=>{
   const m=window.stockWarsApp.townModelScene.music,v=m.voices.get('title');
   return {keys:[...m.voices.keys()],seconds:v.source.buffer.duration,sampleRate:v.source.buffer.sampleRate,loop:v.source.loop,parent:m.control.parentElement.className};
  });assert.deepEqual(title.keys,['title']);assert.equal(title.seconds,84.5);assert.equal(title.sampleRate,32000);assert.equal(title.loop,true);assert.equal(title.parent,'crayon-title');
  // The title's key trap must let the music toggle use Enter, rather than start.
  await page.getByRole('button',{name:'게임 시작',exact:true}).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.className),'town-music-toggle');
  await page.keyboard.press('Enter');await page.waitForTimeout(900);
  assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.music.muted),true);
  assert.ok(await page.evaluate(()=>window.stockWarsApp.townModelScene.music.master.gain.value<.01));
  assert.equal(await page.evaluate(()=>localStorage.getItem('stockwars-town-music-muted-v1')),'1');
  if(!native){await page.reload();await page.getByRole('button',{name:'게임 시작',exact:true}).waitFor();}
  assert.equal(await page.evaluate(()=>window.stockWarsApp.townModelScene.music.muted),true);
  await page.getByRole('button',{name:'배경음악 켜기'}).click({force:native});
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage==='title');
  await page.waitForTimeout(1200);
  fs.mkdirSync('output/title-theme-game-v1',{recursive:true});
  const prefix=native?'electron':root.includes('win-unpacked')?'desktop':'web';
  await page.screenshot({path:`output/title-theme-game-v1/${prefix}-title.png`});
  await page.getByRole('button',{name:'게임 시작',exact:true}).click({force:native});
  await page.waitForFunction(()=>document.querySelector('.opening-sequence iframe'));
  await page.waitForTimeout(1000);
  const opening=await page.evaluate(()=>{
   const m=window.stockWarsApp.townModelScene.music;
   return {titleActive:m.titleActive,active:m.active,gain:m.voices.get('title')?.gain.gain.value,controlHidden:m.control.hidden};
  });assert.equal(opening.titleActive,false);assert.equal(opening.active,false);assert.ok(opening.gain<.001);assert.equal(opening.controlHidden,true);
  await page.locator('.opening-sequence__skip').click({force:native});
  await page.locator('.bus-arrival').waitFor();
  await page.locator('.bus-arrival .opening-sequence__skip').click({force:native});
  await page.waitForFunction(()=>!document.body.classList.contains('title-screen-active'));
  await page.waitForFunction(()=>window.stockWarsApp.townModelScene.music.currentStage&&window.stockWarsApp.townModelScene.music.currentStage!=='title');
  await page.waitForTimeout(6500);
  const town=await page.evaluate(()=>{
   const m=window.stockWarsApp.townModelScene.music;
   return {stage:m.currentStage,voices:[...m.voices.keys()],controlVisible:!m.control.hidden,parent:m.control.parentElement.tagName};
  });assert.equal(town.voices.length,1);assert.equal(town.voices[0],town.stage);assert.equal(town.parent,'BODY');assert.equal(town.controlVisible,true);
  assert.deepEqual(errors,[]);
  const report={root,native,title,opening,town,errors};fs.writeFileSync(`output/title-theme-game-v1/${prefix}-validation.json`,JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report));
 }finally{if(app)await app.close();if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
