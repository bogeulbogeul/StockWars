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


    await page.evaluate(async()=>{
      const a=window.stockWarsApp;a.tradeModal.close();a.annaTutorial.isActive=false;
      const {SideQuestEngine}=await import('/js/engine/SideQuestEngine.js');
      window.rewardState={};window.rewardMarket={cash:0};window.rewardEngine=new SideQuestEngine(()=>window.rewardState,window.rewardMarket);
      rewardEngine.accept('challenge_logistics_s_v1','park');rewardEngine.record('labor',{score:30,brokenCount:0});
      const w=a.logisticsWarehouse;
      w.callbacks.getQuestReward=()=>rewardEngine.active().find(q=>q.giver==='park'&&q.ready&&!q.claimed);
      w.callbacks.onClaimReward=id=>rewardEngine.claim(id);
      w.callbacks.getQuestOffers=()=>rewardEngine.offers('park');
      w.open();w.dismiss();w.talk();
    });
    assert.match(await page.locator('[data-line]').textContent(),/ハハ|하하/);
    assert.match(await page.locator('.warehouse-portrait-frame img').getAttribute('src'),/smile/);
    assert.equal(await page.evaluate(()=>rewardMarket.cash),300);
    await page.getByRole('button',{name:'감사합니다'}).click();
    assert.match(await page.locator('.warehouse-portrait-frame img').getAttribute('src'),/neutral/);
    await page.evaluate(()=>window.stockWarsApp.logisticsWarehouse.talk());
    assert.equal(await page.evaluate(()=>rewardMarket.cash),300);
    assert.equal(await page.getByRole('button',{name:'부탁할 일이 있나요?'}).isVisible(),true);
    console.log('PASS: completed quest pays once on talking to Park, smile portrait and thank-you dialogue, next quest unlocks');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
