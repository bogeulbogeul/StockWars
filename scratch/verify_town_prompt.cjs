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
      const app=window.stockWarsApp;app.tradeModal.close();app.annaTutorial.isActive=false;
      const stage=app.townStage;stage.callbacks.getTutorialDestination=()=> 'bit_logistics';
      stage.show({id:'local',name:'로컬'},'bit_logistics');
      const {TOWN_BUILDINGS}=await import('/js/data/townWorldData.js');
      const {townEntrance}=await import('/js/data/townLayout.js');
      const entry=townEntrance(TOWN_BUILDINGS.find(b=>b.id==='bit_logistics'));
      stage.playerController.charPosX=entry.x+300;stage.playerController.charPosY=entry.y;
      stage.checkProximity();stage.updateTutorialDirection();
    });
    assert.equal(await page.locator('.town-tutorial-direction').count(),1);
    assert.equal(await page.locator('.town-tutorial-destination').count(),0);
    await page.evaluate(async()=>{
      const stage=window.stockWarsApp.townStage;
      const {TOWN_BUILDINGS}=await import('/js/data/townWorldData.js');
      const {townEntrance}=await import('/js/data/townLayout.js');
      const entry=townEntrance(TOWN_BUILDINGS.find(b=>b.id==='bit_logistics'));
      stage.playerController.charPosX=entry.x;stage.playerController.charPosY=entry.y;
      stage.checkProximity();stage.updateTutorialDirection();
    });
    assert.equal(await page.locator('.town-tutorial-direction').isVisible(),false);
    assert.equal(await page.locator('#townBuildingPrompt').isVisible(),true);
    console.log('PASS: one navigation label; only building interaction remains at entrance');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
