const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),out=path.resolve('output/heart-hud-game-v1'),prefix=root.includes('win-unpacked')?'desktop':'web';fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/?skipOpening=1');await page.waitForFunction(()=>window.stockWarsExhibition?.started);
  await page.evaluate(()=>window.stockWarsApp.townModelScene.ready);await page.waitForTimeout(2500);
  await page.locator('.heart-hud').waitFor({state:'visible'});assert.equal(await page.locator('[data-heart-count]').textContent(),'3 / 3');
  async function noOverlap(){
   await page.waitForTimeout(200);
   const result=await page.evaluate(()=>{const h=document.querySelector('.heart-hud'),r=h.getBoundingClientRect();if(!r.width)return {hidden:true,hits:[]};const hits=[...document.querySelectorAll('.game-guidance,.money-hud,.exhibition-panel,.crayon-dialogue,.cozy-phone-launch,.exhibition-phone')].filter(e=>getComputedStyle(e).visibility!=='hidden').filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;}).map(e=>e.className);return {hidden:false,hits,inBounds:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});
   assert.deepEqual(result.hits,[]);if(!result.hidden)assert(result.inBounds);return result;
  }
  assert.equal((await noOverlap()).hidden,false);
  await page.screenshot({path:path.join(out,`${prefix}-guidance.png`)});
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.state.flags.bank=true;a.state.flags.certificate=true;a.view.sync(a.state);});await noOverlap();
  await page.screenshot({path:path.join(out,`${prefix}-money-and-hearts.png`)});
  for(const [width,height] of [[600,740],[360,740],[320,600],[900,500]]){await page.setViewportSize({width,height});await noOverlap();}
  await page.screenshot({path:path.join(out,`${prefix}-small.png`)});
  await page.setViewportSize({width:320,height:600});
  await page.evaluate(()=>{const v=window.stockWarsExhibition.view;v.panel.hidden=false;v.clear('안내');v.text('하트와 대화창 배치 확인');});await noOverlap();
  await page.evaluate(()=>{window.stockWarsExhibition.view.panel.hidden=true;});await noOverlap();
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.view.heartHUD.update(2);});
  assert.equal(await page.locator('.heart-hud .is-empty').count(),1);await noOverlap();
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.view.heartHUD.update(0);});assert.equal(await page.locator('.heart-hud .is-empty').count(),3);
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.state.flags.phone=true;a.view.sync(a.state);a.view.phoneHome.canOpen=()=>true;a.view.phoneHome.open();});assert.equal(await page.locator('.heart-hud').isVisible(),false);
  await page.evaluate(()=>window.stockWarsExhibition.view.phoneHome.close());await page.locator('.heart-hud').waitFor({state:'visible'});
  await page.goto(base+'/?demo=standard');await page.locator('.crayon-title').waitFor();assert.equal(await page.locator('.heart-hud').isVisible(),false);
  await page.getByRole('button',{name:'게임 시작',exact:true}).click();await page.locator('.opening-sequence__skip').click();await page.locator('.bus-arrival .opening-sequence__skip').click();await page.locator('.crayon-title').waitFor({state:'detached'});
  await page.locator('.heart-hud').waitFor({state:'visible'});
  await page.waitForFunction(()=>window.stockWarsApp?.townModelScene);
  await page.evaluate(()=>window.stockWarsApp.townModelScene.ready);await page.waitForTimeout(2500);
  await noOverlap();await page.screenshot({path:path.join(out,`${prefix}-full-hearts.png`)});
  await page.evaluate(()=>{window.stockWarsApp.itemEngine.state.stamina=1;});
  await page.waitForFunction(()=>document.querySelector('[data-heart-count]').textContent==='1 / 3');assert.equal(await page.locator('.heart-hud .is-empty').count(),2);
  await noOverlap();await page.screenshot({path:path.join(out,`${prefix}-reduced-hearts.png`)});
  await page.evaluate(()=>{window.stockWarsApp.itemEngine.state.stamina=3;});await page.waitForFunction(()=>document.querySelector('[data-heart-count]').textContent==='3 / 3');await noOverlap();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,`${prefix}-validation.json`),JSON.stringify({passed:true,errors,checks:['existing stamina sync and recovery','exhibition default 3','empty hearts','guidance and money no overlap','320/360/600px and short landscape','phone hide restore','title hidden']},null,2));console.log(prefix+' heart HUD passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
