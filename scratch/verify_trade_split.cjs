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
    assert.equal(await page.locator('#tradeSubtabChartContent').isVisible(), true);
    assert.equal(await page.locator('#tradeSubtabOrderContent').isVisible(), false);
    await page.locator('#btnOpenOrder').click();
    await page.waitForFunction(() => document.querySelector('#btnSubtabOrder').classList.contains('active'));
    assert.equal(await page.locator('#tradeSubtabChartContent').isVisible(), false);
    assert.equal(await page.locator('#tradeSubtabOrderContent').isVisible(), true);
    assert.equal(await page.locator('#tradeLimitPrice').isVisible(), false);
    await page.locator('#tradeOrderType').selectOption('limit');
    assert.equal(await page.locator('#tradeLimitPrice').isVisible(), true);
    const bounds = await page.locator('.trade-form-panel').boundingBox();
    const content = await page.locator('#tradeSubtabOrderContent').boundingBox();
    assert.ok(Math.abs(bounds.width - content.width) < 2);
    await page.screenshot({path:path.resolve(__dirname,'trade-order-split.png')});
    await page.evaluate(async () => {
      const {applyAnnaTradeFocus} = await import('./js/components/tutorial/annaTradeFocus.js');
      const app = window.stockWarsApp;
      app.annaTutorial.callbacks.onTutorialTradeStep('buy_stock');
      applyAnnaTradeFocus('buy_stock');
    });
    assert.equal(await page.locator('#btnBuyExecute').isVisible(), true);
    assert.equal(await page.locator('.leverage-selector').isVisible(), false);
    assert.equal(await page.locator('#btnSellExecute').isVisible(), false);
    await page.screenshot({path:path.resolve(__dirname,'trade-tutorial-split.png')});
    await page.evaluate(async () => {
      const {clearAnnaTradeFocus} = await import('./js/components/tutorial/annaTradeFocus.js');
      clearAnnaTradeFocus();
      window.stockWarsApp.annaTutorial.callbacks.onTutorialTradeStep('chart_colors');
    });
    assert.equal(await page.locator('#tradeSubtabChartContent').isVisible(), true);
    console.log('PASS: separate tabs, full-width order form, limit price visibility, tutorial focus and chart restoration');
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
