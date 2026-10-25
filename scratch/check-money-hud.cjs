const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const out = path.resolve('output/money-hud-game-v1'); fs.mkdirSync(out, { recursive: true });
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.glb': 'model/gltf-binary' })[path.extname(file)] || 'application/octet-stream');res.end(data);
    });
});
(async () => {
 await new Promise(r => server.listen(0, '127.0.0.1', r));
 const browser = await chromium.launch({ headless: true, channel: 'msedge' });
 const errors=[]; const base=`http://127.0.0.1:${server.address().port}`;
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  async function start(query) {
   await page.goto(base+'/'+query);await page.getByRole('button',{name:'게임 시작',exact:true}).click();
   await page.locator('.opening-sequence__skip').click();await page.locator('.bus-arrival .opening-sequence__skip').click();
   await page.locator('.crayon-title').waitFor({state:'detached'});
   await page.waitForFunction(()=>window.stockWarsApp?.townModelScene);
   await page.evaluate(async()=>{const scene=window.stockWarsApp.townModelScene;await scene.ready;scene.draw();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   await page.waitForTimeout(2500);
  }
  await page.goto(base+'/?demo=standard');await page.locator('.crayon-title').waitFor();
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  await start('?demo=standard');
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  assert.equal(await page.locator('.money-hud dt').allTextContents().then(t=>t.join(',')),'총자산,수익률');
  await page.evaluate(async()=>{
   const {marketEngine:e}=await import('/js/engine/marketEngine.js');e.stopEngine();
   // Drive presentation with a known snapshot without changing the account or save.
   window.stockWarsApp.moneyHUD.update({cash:128500,totalNetWorth:1248500,totalProfitLoss:600,initialCash:5000},{bank:true,stock:true});
  });
  assert.equal(await page.locator('[data-money-cash]').textContent(),'128,500');
  assert.equal(await page.locator('[data-money-assets]').textContent(),'1,248,500');
  assert.equal(await page.locator('[data-money-return]').textContent(),'+12.00%');
  const hud=await page.locator('.money-hud').boundingBox();assert.equal(hud.x+hud.width,1256);assert.equal(hud.y,24);
  const music=await page.locator('body > .town-music-toggle').boundingBox();if(music)assert(music.y>=hud.y+hud.height);
  await page.screenshot({path:path.join(out,`${prefix}-town.png`)});
  await page.evaluate(()=>window.stockWarsApp.phoneHome.open());
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  await page.evaluate(()=>window.stockWarsApp.phoneHome.close());assert(await page.locator('.money-hud').isVisible());
  // Exercise the actual counter entry, then confirm closing restores the HUD.
  await page.evaluate(async()=>{const {openVivianCounterShop}=await import('/js/app/VivianCounterShop.js');openVivianCounterShop(window.stockWarsApp);});
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  await page.evaluate(()=>window.stockWarsApp.vivianStoreModal.close());
  assert(await page.locator('.money-hud').isVisible());
  for(const width of [360,320]) {
   await page.setViewportSize({width,height:740});
   const box=await page.locator('.money-hud').boundingBox();assert(box.x>=0&&box.x+box.width<=width);
   assert(await page.locator('.money-hud').evaluate(el=>el.scrollWidth<=el.clientWidth));
  }
  await page.screenshot({path:path.join(out,`${prefix}-mobile.png`)});
  await page.evaluate(()=>window.stockWarsApp.moneyHUD.update({cash:0,totalNetWorth:0,totalProfitLoss:-600,initialCash:5000},{bank:true,stock:true}));
  assert.equal(await page.locator('[data-money-return]').textContent(),'-12.00%');
  assert.equal(await page.locator('[data-money-return]').getAttribute('data-trend'),'down');
  await page.evaluate(()=>window.stockWarsApp.moneyHUD.update({cash:0,totalNetWorth:0,totalProfitLoss:0,initialCash:0},{bank:true,stock:true}));
  assert.equal(await page.locator('[data-money-return]').textContent(),'0.00%');
  await page.setViewportSize({width:1280,height:900});await start('');
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  await page.screenshot({path:path.join(out,`${prefix}-before-bank.png`)});
  await page.evaluate(async()=>{
   const a=window.stockWarsExhibition;const {complete}=await import('/js/app/exhibition/State.js');
   complete(a.state,'bank');a.view.sync(a.state);
  });
  assert(await page.locator('.money-hud').isVisible());
  assert.equal(await page.locator('.money-hud dl').isVisible(),false);
  const cashOnly=await page.locator('.money-hud').boundingBox();
  const bankMusic=await page.locator('body > .town-music-toggle').boundingBox();if(bankMusic)assert(bankMusic.y>=cashOnly.y+cashOnly.height);
  await page.screenshot({path:path.join(out,`${prefix}-bank-only.png`)});
  await page.evaluate(async()=>{
   const a=window.stockWarsExhibition;const {complete}=await import('/js/app/exhibition/State.js');
   a.state.answers=[2,1,3];complete(a.state,'certificate');a.view.sync(a.state);a.save();
  });
  assert(await page.locator('.money-hud dl').isVisible());
  await page.evaluate(async()=>{const a=window.stockWarsExhibition;const {loadState}=await import('/js/app/exhibition/State.js');a.state=loadState(a.storage);a.view.sync(a.state);});
  assert(await page.locator('.money-hud').isVisible());
  assert(await page.locator('.money-hud dl').isVisible());
  const result=await page.evaluate(()=>{
   const app=window.stockWarsExhibition;
   app.state.cash=4321;app.state.shares=[{id:'CLOUDBERRY',name:'테스트',price:100,quantity:1}];
   app.view.sync(app.state);
   return {cash:app.state.cash,total:app.state.cash+100};
  });
  assert.equal(await page.locator('[data-money-cash]').textContent(),result.cash.toLocaleString('ko-KR'));
  assert.equal(await page.locator('[data-money-assets]').textContent(),result.total.toLocaleString('ko-KR'));
  assert.equal(await page.locator('[data-money-return]').textContent(),'0.00%');
  await page.screenshot({path:path.join(out,`${prefix}-exhibition.png`)});
  await page.evaluate(()=>{const a=window.stockWarsExhibition;a.state.flags.phone=true;a.view.sync(a.state);a.view.phoneHome.canOpen=()=>true;a.view.phoneHome.open();});
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  await page.evaluate(async()=>{const a=window.stockWarsExhibition;a.view.phoneHome.close();const {freshState}=await import('/js/app/exhibition/State.js');a.state=freshState();a.view.sync(a.state);});
  assert.equal(await page.locator('.money-hud').isVisible(),false);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,`${prefix}-validation.json`),JSON.stringify({passed:true,errors,checks:['title hidden','right top 24px','music no overlap','cash assets return','phone hide restore','320px and 360px fit','positive negative zero','isolated exhibition account','before bank hidden','bank opens cash only','certificate opens assets and return','saved unlock restored','fresh state relocks']},null,2));
  console.log(prefix+' money HUD checks passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
