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


    await page.evaluate(()=>{const app=window.stockWarsApp;app.tradeModal.close();app.annaTutorial.isActive=false;app.openLogisticsJob();});

    await page.locator('[data-start]').click();
    const read=()=>page.evaluate(()=>{const w=window.stockWarsApp.logisticsWarehouse,r=w.canvas.getBoundingClientRect();return {scroll:w.dialog.scrollTop,x:r.x,y:r.y,width:r.width,height:r.height,near:w.talkPrompt.hidden,playerX:w.player.x};});
    await page.waitForTimeout(100);const before=await read();assert.equal(before.near,false);assert.match(await page.locator('.warehouse-talk-prompt').textContent(),/마을로 나가기/);
    await page.keyboard.down('a');await page.waitForTimeout(500);await page.keyboard.up('a');
    const after=await read();assert.equal(after.near,true);assert.notEqual(after.playerX,before.playerX);
    for(const key of ['x','y','width','height','scroll'])assert.equal(after[key],before[key],key);
    const labels=await page.evaluate(()=>{const w=window.stockWarsApp.logisticsWarehouse,labels=[],label=w.label;w.label=(ctx,text,...rest)=>{labels.push(text);return label.call(w,ctx,text,...rest);};w.draw();w.label=label;return labels;});
    assert.deepEqual(labels,[]);
    await page.evaluate(()=>{const w=window.stockWarsApp.logisticsWarehouse;w.player.x=870;w.player.y=665;});
    await page.waitForTimeout(100);assert.match(await page.locator('.warehouse-talk-prompt').textContent(),/박씨 아저씨와 대화/);
    await page.locator('.warehouse-talk-prompt').click();
    await page.locator('.warehouse-dialogue').waitFor({state:'visible'});assert.equal(await page.locator('.warehouse-talk-prompt').isVisible(),false);
    await page.locator('[data-later]').click();
    await page.evaluate(()=>{const w=window.stockWarsApp.logisticsWarehouse;w.player.x=1197;w.player.y=680;w.canvas.focus();});
    await page.keyboard.press('f');
    await page.locator('.logistics-warehouse').waitFor({state:'hidden'});
    await page.evaluate(()=>window.stockWarsApp.openLogisticsJob());
    await page.locator('[data-start]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-line]').textContent(),/환영/);
    assert.equal(await page.locator('[data-start]').textContent(),'알겠어요');
    assert.equal(await page.locator('[data-quest-offers]').isVisible(),false);
    await page.locator('[data-start]').click();
    const corner=await page.evaluate(()=>{const w=window.stockWarsApp.logisticsWarehouse,r=w.canvas.getBoundingClientRect(),s=Math.min(r.width/1536,r.height/1024);return {x:r.x+(r.width-1536*s)/2+1217*s,y:r.y+(r.height-1024*s)/2+640*s};});
    await page.mouse.click(corner.x,corner.y);
    await page.locator('.logistics-warehouse').waitFor({state:'hidden'});
    await page.evaluate(()=>{window.stockWarsApp.openLogisticsJob();});
    await page.screenshot({path:'scratch/warehouse-fixed.png'});
    console.log('PASS: keyboard movement changes player only; canvas bounds stay fixed across proximity transitions; no floating player labels');
  } finally { await browser?.close(); server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
