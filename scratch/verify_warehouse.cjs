const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(() => window.stockWarsApp);
    await page.evaluate(() => { window.stockWarsApp.titleScreen.hide(); window.stockWarsApp.tradeModal.open('CLOUDBERRY'); });
    await page.locator('#titleScreen').waitFor({state:'hidden'});


    await page.evaluate(() => {
      const app=window.stockWarsApp;app.tradeModal.close();app.annaTutorial.isActive=false;
      app.userProfile={...app.userProfile,nickname:'창고테스트',firstTutorialCompleted:true};
      app.openLogisticsJob();
    });
    assert.equal(await page.locator('.logistics-warehouse').isVisible(), true);
    assert.equal(await page.evaluate(()=>window.stockWarsApp.logisticsMiniGame.isOpen), false);
    const rect = await page.locator('.logistics-warehouse canvas').boundingBox();
    const scale = Math.min(rect.width/1536,rect.height/1024);
    const entrance = await page.evaluate(async()=> (await import('/js/components/logistics/WarehouseGeometry.js')).WAREHOUSE_ENTRANCE);
    await page.mouse.click(rect.x+(rect.width-1536*scale)/2+entrance.x*scale,rect.y+(rect.height-1024*scale)/2+entrance.y*scale);
    await page.locator('.logistics-warehouse').waitFor({state:'hidden'});
    await page.evaluate(()=>window.stockWarsApp.openLogisticsJob());
    await page.evaluate(()=>window.stockWarsApp.logisticsWarehouse.request('park'));
    await page.locator('.warehouse-dialogue').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.querySelector('.logistics-warehouse canvas').dataset.playerY < 670);
    await page.screenshot({path:'scratch/warehouse-dialogue.png'});
    assert.ok(await page.locator('.warehouse-portrait-frame').evaluate(el=>parseFloat(getComputedStyle(el).borderTopWidth)>0));
    await page.setViewportSize({width:560,height:780});
    await page.waitForTimeout(150);
    const layout = await page.locator('.warehouse-dialogue').evaluate(el=>{
      const card=el.getBoundingClientRect();
      return [...el.querySelectorAll('img,strong,p,nav button')].every(child=>{
        const r=child.getBoundingClientRect();return r.left>=card.left&&r.right<=card.right+1&&r.bottom<=card.bottom+1;
      });
    });
    assert.equal(layout,true);
    await page.screenshot({path:'scratch/warehouse-dialogue-small.png'});
    await page.setViewportSize({width:1280,height:720});
    await page.locator('.warehouse-dialogue [data-start]').click();
    assert.equal(await page.evaluate(()=>window.stockWarsApp.logisticsMiniGame.isOpen), true);
    assert.equal(await page.locator('.logistics-warehouse').isVisible(), false);
    await page.evaluate(()=>window.stockWarsApp.logisticsMiniGame.close());
    await page.locator('.logistics-warehouse').waitFor({state:'visible'});

    await page.evaluate(()=>{
      const app=window.stockWarsApp;app.logisticsWarehouse.talk();app.logisticsWarehouse.startWork();
      app.logisticsMiniGame.lastResult={goldReward:100,expReward:10,hasRumor:false,score:12,brokenCount:0};
      app.logisticsMiniGame.finishAndClaimReward();
    });
    assert.equal(await page.locator('.logistics-warehouse').isVisible(),true);
    await page.evaluate(()=>{
      const app=window.stockWarsApp;app.itemEngine.state.passUntil=app.itemEngine.now()+86400000;
      app.logisticsWarehouse.talk();app.logisticsWarehouse.startWork();
    });
    await page.locator('[aria-label="비트물류 퀵패스"]').waitFor({state:'visible'});
    await page.keyboard.press('Escape');
    await page.locator('.logistics-warehouse').waitFor({state:'visible'});
    await page.evaluate(()=>{window.stockWarsApp.itemEngine.state.stamina=0;window.stockWarsApp.mainHUD.updateStamina(0);window.stockWarsApp.logisticsWarehouse.talk();});
    await page.locator('.warehouse-dialogue [data-start]').click();
    assert.equal(await page.evaluate(()=>window.stockWarsApp.logisticsMiniGame.isOpen),false);
    assert.match(await page.locator('.warehouse-dialogue [data-line]').textContent(),/체력이 부족/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.warehouse-dialogue').isVisible(),false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.logistics-warehouse').isVisible(),false);

    await page.evaluate(async()=>{
      const app=window.stockWarsApp;
      const {buildAnnaScenario}=await import('/js/components/tutorial/annaTutorialScenario.js');
      app.isLocalSession=true;app.itemEngine.state.passUntil=0;app.itemEngine.state.stamina=3;app.mainHUD.updateStamina(3);
      app.annaTutorial.steps=buildAnnaScenario({});
      app.annaTutorial.currentStepIdx=app.annaTutorial.steps.findIndex(s=>s.id==='enter_logistics');
      app.annaTutorial.isActive=true;app.annaTutorial.dialogueHistory=[];
      app.openLogisticsJob();
      app.logisticsWarehouse.talk();app.logisticsWarehouse.startWork();
      app.logisticsMiniGame.lastResult={goldReward:100,expReward:10,hasRumor:false,score:12,brokenCount:0};
      app.logisticsMiniGame.finishAndClaimReward();
    });
    assert.equal(await page.locator('.logistics-warehouse').isVisible(),false);
    assert.equal(await page.evaluate(()=>window.stockWarsApp.annaTutorial.steps[window.stockWarsApp.annaTutorial.currentStepIdx].id),'rumor_inventory_guide');
    console.log('PASS: warehouse entry, walk to NPC, manual work start, cancel return, exhausted dialogue, Escape');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
