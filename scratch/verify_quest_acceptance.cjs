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


    await page.evaluate(()=>{
      const app=window.stockWarsApp;app.tradeModal.close();app.annaTutorial.isActive=false;
      app.userProfile={...app.userProfile,nickname:'의뢰검증',firstTutorialCompleted:true};app.itemGameplay.start();
      app.recordQuestEvent('labor',{score:40,brokenCount:0});
    });
    assert.equal(await page.locator('.side-quest-list details').count(),0);
    assert.equal(await page.locator('.quest-tabs [data-tab=side]').isVisible(),false);
    await page.evaluate(()=>window.stockWarsApp.annaDialogueModal.show());
    assert.equal(await page.locator('#annaQuestOffers [data-quest-accept]').count(),2);
    assert.equal(await page.locator('.side-quest-list details').count(),0);
    await page.locator('#annaQuestOffers [data-quest-accept="challenge_net_profit_v1"]').click();
    assert.equal(await page.locator('.side-quest-list details').count(),1);
    assert.equal(await page.locator('.side-quest-list [data-quest="challenge_logistics_s_v1"]').count(),0);
    await page.evaluate(()=>{const app=window.stockWarsApp;app.annaDialogueModal.hide();app.openLogisticsJob();app.logisticsWarehouse.talk();});
    assert.equal(await page.locator('.warehouse-dialogue [data-quest-accept]').count(),2);
    await page.locator('.warehouse-dialogue [data-quest-accept="challenge_flawless_v1"]').click();
    assert.equal(await page.locator('.side-quest-list details').count(),2);
    assert.equal(await page.evaluate(()=>window.stockWarsApp.itemEngine.state.sideQuests.challenge_flawless_v1.count),0);
    await page.evaluate(()=>{const app=window.stockWarsApp;app.logisticsWarehouse.close();app.cipherLobby.agentKIntroduced=true;app.cipherLobby.open();app.cipherLobby.renderAgentChoices();});
    await page.locator('.cipher-agent-actions button').filter({hasText:'의뢰 확인'}).click();
    assert.equal(await page.locator('.side-quest-list [data-quest="challenge_agent_k_v1"]').count(),0);
    await page.locator('.cipher-agent-actions button').filter({hasText:'의뢰 수락'}).click();
    assert.equal(await page.locator('.side-quest-list details').count(),3);
    await page.evaluate(()=>window.stockWarsApp.cipherLobby.close());
    await page.screenshot({path:'scratch/accepted-quests.png'});
    console.log('PASS: hidden before acceptance, no pre-accept progress, individual Anna/Park/K contracts appear only after accepting');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
