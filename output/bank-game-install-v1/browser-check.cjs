const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('web');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file===root)file=path.join(root,'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.stockWarsApp?.enterBankModel,{timeout:90000});
  await page.evaluate(()=>{const a=window.stockWarsApp;a.isLocalSession=true;const p=a.townStage.playerController;p.charPosX=2620;p.charPosY=2115;p.keysHeld.clear();});
  await page.keyboard.press('f');
  await page.waitForFunction(()=>window.stockWarsApp.bankModelScene?.player?.state!=='loading'&&window.stockWarsApp.bankModelScene?.room?.getObjectByName('bank-furnished-room'),{timeout:90000});
  await page.evaluate(()=>window.stockWarsApp.bankModelScene.ready);
  const loaded=await page.evaluate(()=>{const s=window.stockWarsApp.bankModelScene;return {active:s.active,failed:!!s.failed,meshes:(()=>{let n=0;s.room.traverse(o=>{if(o.isMesh)n++;});return n;})(),spawn:{x:s.controller.charPosX,z:s.controller.charPosY/.5}};});
  if(!loaded.active||loaded.failed||loaded.meshes<100)throw Error('Bank did not load '+JSON.stringify(loaded));
  await page.locator('#bankModelStage canvas').waitFor({state:'visible'});
  await page.waitForFunction(()=>window.stockWarsApp.bankModelScene.renderer.domElement.width>0);
  await page.waitForTimeout(500);
  await page.screenshot({path:'output/bank-game-install-v1/game.png'});
  const before=await page.evaluate(()=>window.stockWarsApp.bankModelScene.controller.charPosY);
  await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.stockWarsApp.bankModelScene.controller.charPosY);
  if(after>=before)throw Error('Movement failed');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!window.stockWarsApp.bankModelScene.active&&document.body.classList.contains('town-mode-active'));
  await page.keyboard.press('f');await page.waitForFunction(()=>window.stockWarsApp.bankModelScene.active);
  await page.evaluate(()=>{const s=window.stockWarsApp.bankModelScene;s.controller.charPosX=0;s.controller.charPosY=315;});
  // Automatic exit uses projected coordinates, so derive them from the room controller convention.
  await page.evaluate(async()=>{const m=await import('/js/data/townModelBuildings.js');window.stockWarsApp.bankModelScene.controller.charPosY=315*m.GROUND_PROJECTION;});
  await page.keyboard.down('s');await page.waitForTimeout(350);await page.keyboard.up('s');
  await page.waitForFunction(()=>!window.stockWarsApp.bankModelScene.active);
  if(errors.length)throw Error('Browser errors: '+errors.join('\n'));
  fs.writeFileSync('output/bank-game-install-v1/browser-report.json',JSON.stringify({loaded,movement:true,escapeReturn:true,reentry:true,doorReturn:true,pageErrors:errors},null,2));
  console.log('PASS bank loaded, movement, Esc return, reentry and door exit');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
