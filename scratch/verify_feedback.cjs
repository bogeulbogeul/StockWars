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

    const result = await page.evaluate(async () => {
      const app = window.stockWarsApp;
      return { summary: document.querySelector('#tradeAccountSummary').textContent, sellMaxDisabled: document.querySelector('#btnQtySellMax').disabled };
    });
    assert.match(result.summary, /보유 현금/);
    assert.equal(result.sellMaxDisabled, true);
    await page.evaluate(() => {
      const modal = window.stockWarsApp.tradeModal;
      modal.callbacks.getMaxSellQty = () => 7;
      modal.callbacks.getAccountSummary = () => ({ cash: 1500, quantity: 7, averagePrice: 1000 });
      modal.updateCalculations();
      document.querySelector('#btnSubtabOrder').click();
      document.querySelector('#btnQtySellMax').click();
    });
    assert.equal(await page.locator('#tradeQtyInput').inputValue(), '7');
    assert.match(await page.locator('#tradeAccountSummary').textContent(), /보유 7주/);
    console.log('PASS: account summary, disabled empty sale, sell MAX uses holdings');
    await page.evaluate(() => {
      const app = window.stockWarsApp;
      app.tradeModal.close();
      app.annaTutorial.isActive = false;
      app.cipherLobby.agentKIntroduced = true;
      app.cipherLobby.open();
      app.cipherLobby.competitionRoom.open({ skipTutorial: true });
    });
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.stockWarsApp.cipherLobby.competitionRoom.dialog.open), false);
    const before = await page.evaluate(() => window.stockWarsApp.cipherLobby.player.y);
    await page.keyboard.down('s');
    await page.waitForTimeout(250);
    await page.keyboard.up('s');
    const after = await page.evaluate(() => window.stockWarsApp.cipherLobby.player.y);
    assert.notEqual(after, before);
    console.log('PASS: ESC exits competition room and lobby movement resumes');
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
