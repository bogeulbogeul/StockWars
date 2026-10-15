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
      const {SideQuestEngine}=await import('/js/engine/SideQuestEngine.js');window.qs={};window.qm={cash:0};window.qe=new SideQuestEngine(()=>qs,qm);
      const c=a.annaDialogueModal.callbacks;c.getQuestOffers=()=>qe.offers('anna');c.onAcceptQuest=id=>qe.accept(id,'anna');c.getQuestReward=()=>qe.active().find(q=>q.giver==='anna'&&q.ready&&!q.claimed);c.onClaimReward=id=>qe.claim(id);
      a.annaDialogueModal.show();
    });
    await page.getByRole('button',{name:'부탁할 일이 있나요?'}).click();
    assert.match(await page.locator('#annaSpeechText').textContent(),/1,000G/);
    await page.getByRole('button',{name:'맡겨 주세요'}).click();
    await page.getByRole('button',{name:'알겠어요',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'부탁할 일이 있나요?'}).isVisible(),false);
    await page.evaluate(()=>{qe.record('trade',{side:'sell',quantity:1,profit:1000});window.stockWarsApp.annaDialogueModal.show();});
    assert.equal(await page.locator('#annaVnPortrait').getAttribute('data-expression'),'Happy');
    assert.equal(await page.evaluate(()=>qm.cash),350);
    await page.getByRole('button',{name:'감사합니다'}).click();
    assert.equal(await page.evaluate(()=>qm.cash),350);
    await page.evaluate(()=>{
      const a=window.stockWarsApp;a.annaDialogueModal.hide();const k=a.cipherLobby;
      k.getQuestOffers=()=>qe.offers('agent_k');k.onAcceptQuest=id=>qe.accept(id,'agent_k');k.getQuestReward=()=>qe.active().find(q=>q.giver==='agent_k'&&q.ready&&!q.claimed);k.onClaimReward=id=>qe.claim(id);
      k.dialog.showModal();k.renderAgentQuestOffer();
    });
    await page.getByRole('button',{name:'맡겨 주세요'}).click();
    await page.getByRole('button',{name:'알겠습니다',exact:true}).click();
    await page.evaluate(()=>{qe.record('arena',{opponent:'에이전트 K',completed:true,playerAssets:11000,opponentAssets:10000});window.stockWarsApp.cipherLobby.renderAgentChoices();});
    assert.match(await page.locator('.cipher-agent-portrait').getAttribute('src'),/smile/);
    assert.equal(await page.evaluate(()=>qm.cash),850);
    await page.getByRole('button',{name:'감사합니다'}).click();
    assert.equal(await page.evaluate(()=>qm.cash),850);
    console.log('PASS: Anna and K story acceptance, return dialogue, happy portraits and rewards paid once');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
