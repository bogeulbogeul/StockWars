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
      const a=window.stockWarsApp;a.tradeModal.close();a.annaTutorial.isActive=false;
      const w=a.logisticsWarehouse;window.accepted=[];
      const offers=[{id:'challenge_logistics_s_v1'},{id:'challenge_flawless_v1'}];
      w.callbacks.getQuestOffers=()=>offers.filter(q=>!window.accepted.includes(q.id));
      w.callbacks.onAcceptQuest=(id,giver)=>{if(giver!=='park')throw Error('wrong giver');window.accepted.push(id);return {success:true};};
      w.open();w.dismiss();w.talk();
    });
    assert.equal(await page.locator('[data-quest-offers]').isVisible(),false);
    await page.getByRole('button',{name:'부탁할 일이 있나요?'}).click();
    assert.match(await page.locator('[data-line]').textContent(),/물량이 밀려/);
    assert.equal(await page.evaluate(()=>window.accepted.length),0);
    await page.getByRole('button',{name:'맡겨 주세요'}).click();
    assert.deepEqual(await page.evaluate(()=>window.accepted),['challenge_logistics_s_v1']);
    await page.getByRole('button',{name:'다음',exact:true}).click();
    assert.match(await page.locator('[data-line]').textContent(),/깨지기 쉬운/);
    await page.getByRole('button',{name:'다음에 할게요'}).click();
    assert.equal(await page.getByRole('button',{name:'일 시작하기',exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'부탁할 일이 있나요?'}).click();
    await page.getByRole('button',{name:'맡겨 주세요'}).click();
    await page.getByRole('button',{name:'다음',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'부탁할 일이 있나요?'}).isVisible(),false);
    assert.equal(await page.getByRole('button',{name:'일 시작하기',exact:true}).isVisible(),true);
    await page.screenshot({path:'scratch/park-story-quests.png'});
    console.log('PASS: Park offers one story at a time; accept, defer, retry and return to work choices');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
