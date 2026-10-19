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
      app.userProfile={...app.userProfile,nickname:'퀘스트검증',firstTutorialCompleted:true};app.itemGameplay.start();
      const arena=app.cipherLobby.competitionRoom;arena.open({skipTutorial:true});
      arena.start({id:'quest-quit',name:'에이전트 K 검증',cash:10000,stake:0,minutes:3,opponent:'에이전트 K'});
      arena.match.engine.cash=12000;arena.match.close();
    });
    assert.notEqual(await page.evaluate(()=>window.stockWarsApp.itemEngine.state.sideQuests.challenge_agent_k_v1?.completed),true);
    await page.evaluate(()=>{
      const arena=window.stockWarsApp.cipherLobby.competitionRoom;
      arena.start({id:'quest-win',name:'에이전트 K 검증',cash:10000,stake:0,minutes:0,opponent:'에이전트 K'});
      arena.match.engine.cash=12000;
    });
    await page.waitForFunction(()=>window.stockWarsApp.itemEngine.state.sideQuests.challenge_agent_k_v1?.completed===true);
    console.log('PASS: real arena finish callback completes Agent K quest; quitting does not');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
