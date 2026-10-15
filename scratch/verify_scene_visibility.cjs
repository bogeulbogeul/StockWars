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
      const app=window.stockWarsApp;app.tradeModal.close();app.isLocalSession=true;
      await app.enterTown(null,'bit_logistics');
      const overlay=app.annaTutorial.overlay;overlay.classList.remove('hidden');overlay.classList.add('vn-inventory-focus');
    });
    await page.waitForTimeout(500);
    const state=await page.evaluate(()=>({office:getComputedStyle(document.querySelector('#isoOfficeStage')).display,town:getComputedStyle(document.querySelector('#townStageContainer')).display}));
    assert.equal(state.office,'none');assert.notEqual(state.town,'none');
    await page.screenshot({path:'scratch/town-inventory-scene.png'});
    await page.evaluate(()=>{const a=window.stockWarsApp;a.annaTutorial.overlay.classList.remove('vn-inventory-focus');a.annaTutorial.overlay.classList.add('vn-hud-focus');});
    assert.equal(await page.locator('#isoOfficeStage').isVisible(),false);
    await page.evaluate(()=>window.stockWarsApp.enterOffice());
    assert.equal(await page.locator('#isoOfficeStage').isVisible(),true);
    assert.equal(await page.locator('#townStageContainer').isVisible(),false);
    console.log('PASS: inventory and HUD tutorial dimming never reveals inactive office; returning to office hides town');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
