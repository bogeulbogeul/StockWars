const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const out=path.resolve('output/character-assets-retired-2026-10-23');
const forbidden=/\/assets\/characters\/3d\/(somangi|anna|agent-k|bongbong)\//;
for(const name of ['somangi','anna','agent-k','bongbong'])assert.ok(!fs.existsSync(path.join(root,'assets/characters/3d',name)));
const server=http.createServer((req,res)=>{
 if(req.url==='/favicon.ico')return res.writeHead(204).end();
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],retiredRequests=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(forbidden.test(r.url()))retiredRequests.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&/\/assets\//.test(r.url()))errors.push(r.url());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.status.hidden,null,{timeout:90000});
  const start=page.getByRole('button',{name:'게임 시작',exact:true});if(await start.isVisible())await start.click();
  for(let i=0;i<3;i++){const skip=page.getByRole('button',{name:/건너뛰기/});if(await skip.isVisible()){await skip.click();await page.waitForTimeout(150);}}
  await page.evaluate(()=>window.stockWarsApp.enterTown());
  async function inspect(key){
   const report=await page.evaluate(key=>{
    const s=window.stockWarsApp[key],characters=[];
    s.scene.traverse(o=>{if(/^(Eating_Torso|Somangi_Body|Rigid_Arm\.[LR]|Anna_PlumpLeaf|Anna_Vest|cipher-agent-k|bongbong-shopkeeper|anna-bus-stop-sleeping)$/.test(o.name))characters.push(o.name);});
    return {key,failed:!!s.failed,characters,anchorChildren:s.player.root.children.length};
   },key);
   assert.equal(report.failed,false);assert.deepEqual(report.characters,[]);assert.equal(report.anchorChildren,0);results.push(report);
  }
  await inspect('townModelScene');
  for(const key of ['1','2','Space','3'])await page.keyboard.press(key);
  for(const [method,key,label]of [['enterOffice','homeModelScene','home'],['enterVivianModel','vivianModelScene','store'],['enterInformationModel','informationModelScene','information']]){
   await page.evaluate(m=>window.stockWarsApp[m](),method);await page.evaluate(async k=>await window.stockWarsApp[k].ready,key);
   await inspect(key);await page.waitForTimeout(150);
   await page.screenshot({path:path.join(out,(root.includes('resources')?'runtime-':'web-')+label+'.png')});
   await page.evaluate(k=>window.stockWarsApp[k].exit(),key);
  }
  await page.evaluate(()=>window.stockWarsApp.cipherLobby.open());await page.evaluate(async()=>await window.stockWarsApp.cipherLobbyScene.ready);
  await inspect('cipherLobbyScene');
  assert.equal(await page.evaluate(async()=>{const {vivianCanStand}=await import('/js/data/vivianModelRoom.js');return vivianCanStand(2.05*75,-1.3*75);}),true);
  assert.equal(await page.evaluate(async()=>{const {lobbyCanStand}=await import('/js/data/cipherLobbyRoom.js');return lobbyCanStand(0,-205);}),true);
  assert.deepEqual(retiredRequests,[]);assert.deepEqual(errors,[]);
  const report={root,results,retiredRequests,errors};
  fs.writeFileSync(path.join(out,(root.includes('resources')?'runtime':'web')+'-validation.json'),JSON.stringify(report,null,2));
  console.log('PASS',JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
