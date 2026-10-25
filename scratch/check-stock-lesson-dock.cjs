const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web'), output = path.resolve(process.argv[3] || 'output/phone-stock-2d-v1');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : u.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        const mime = ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)]; res.setHeader('Content-Type', mime ? mime + '; charset=utf-8' : 'application/octet-stream'); res.end(data);
    });
});
(async () => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/css/modules/phone-stock.css');
  await page.setContent(`<meta charset="utf-8"><link rel="stylesheet" href="${base}/css/modules/phone-home.css"><link rel="stylesheet" href="${base}/css/modules/phone-stock.css"><dialog open class="cozy-phone"><div class="cozy-phone__shell"><div class="cozy-phone__screen"><div class="cozy-phone__detail cozy-phone__detail--stock"><div class="cozy-phone__content" id="app"></div></div></div></div></dialog>`);
  await page.evaluate(async()=>{
   const {marketEngine:e}=await import('/js/engine/marketEngine.js');e.stopEngine();e.cash=1000000;e.isTutorialActive=false;
   const {ItemEngine}=await import('/js/engine/ItemEngine.js'); e.itemEngine=new ItemEngine({market:e});
   for(const stock of e.stocks.values()){stock.price=1000;e.orderBooks.set(stock.id,{referencePrice:1000,asks:[{price:1000,vol:1000}],bids:[{price:1000,vol:1000}]});if(!e.buyStock(stock.id,1).success)throw Error(stock.id);}
   const {StockApp}=await import('/js/components/phone/stock/StockApp.js');
   const app=new StockApp(document.querySelector('#app'),{getState:()=>e.getState()}, {onClose:()=>{document.querySelector('dialog').close();app.destroy();}});app.tab='account';app.renderTab(); window.testStockApp=app;
  });
  assert.equal(await page.locator('.stock-holding').count(),72);
  await page.evaluate(async () => {
   const { sectorColor } = await import('/js/components/phone/stock/StockBrand.js');
   const { marketEngine: e } = await import('/js/engine/marketEngine.js');
   const keys = [...new Set(e.getState().portfolio.map(p => p.stock.sector))];
   const legend = [...document.querySelectorAll('.stock-allocation li i')];
   const donut = document.querySelector('.stock-donut').style.background;
   for (const [i, key] of keys.entries()) {
    const probe = document.createElement('span'); probe.style.background = sectorColor(key);
    if (legend[i].style.background !== probe.style.background) throw Error('Legend color: ' + key);
    if (!donut.includes(probe.style.background)) throw Error('Donut color: ' + key);
   }
  });
  assert.match(await page.locator('.stock-nav').evaluate(el => getComputedStyle(el, '::before').content), /토리 증권사/);
  assert.equal(await page.evaluate(() => document.characterSet), 'UTF-8');
  assert.doesNotMatch(await page.locator('.stock-body').textContent(),/종목 보유 슬롯/);
  await page.screenshot({path:path.join(output,`${prefix}-unlimited-account.png`)});
  assert.equal(await page.locator('.stock-history').count(), 0);
  await page.locator('[data-tab="history"]').click();
  assert.equal(await page.locator('.stock-nav [aria-current="page"]').getAttribute('data-tab'), 'history');
  assert.equal(await page.locator('.stock-history article').count(), 72);
  assert.equal(await page.locator('.stock-body').evaluate(el => el.scrollTop), 0);
  for (const size of [{width:390,height:844},{width:1280,height:900}]) {
   await page.setViewportSize(size);
   assert(await page.locator('[data-tab="history"]').isVisible());
   assert.equal(await page.locator('[data-power-off]').isVisible(), size.width >= 1000);
   assert(await page.locator('.stock-history article').first().isVisible());
  }
  await page.screenshot({path:path.join(output,`${prefix}-trade-history.png`)});
  await page.evaluate(async () => {
   const app=window.testStockApp;
   const {phoneStockSource}=await import('/js/app/PhoneStockSource.js');
   const {marketEngine:e}=await import('/js/engine/marketEngine.js');
   app.source=phoneStockSource({smartphoneUI:{homeTab:{},recordRecentlyViewed(){}},itemEngine:e.itemEngine});
   app.source.lessonActive=true; app.tab='market';app.renderTab();
   const {exhibitionStockSource}=await import('/js/app/exhibition/PhoneStockSource.js');
   const state={flags:{trade:false}}; let allowed=false;
   const source=exhibitionStockSource(()=>state,{canTrade:()=>allowed});
   if(source.lessonActive)throw Error('lesson shown outside trade');
   allowed=true;if(!source.lessonActive)throw Error('missing lesson');
   state.flags.trade=true;if(source.lessonActive)throw Error('lesson after completion');
  });
  assert(await page.locator('.stock-lesson-dock').isVisible());
  assert.equal(await page.locator('.stock-lesson-dock img').count(),0);
  await page.locator('[data-lesson-next]').click();
  assert.match(await page.locator('.stock-lesson-dock p').textContent(), /회사/);
  await page.screenshot({path:path.join(output,`${prefix}-lesson-market.png`)});
  for(const size of [{width:1280,height:900},{width:390,height:844},{width:844,height:390}]) {
   await page.setViewportSize(size);
   await page.evaluate(()=>window.testStockApp.openStock('CLOUDBERRY'));
   await page.locator('.stock-subtabs [data-subtab="order"]').click();
   const dock=await page.locator('.stock-lesson-dock').boundingBox();
   const body=await page.locator('.stock-body').boundingBox();
   assert(body.y+body.height<=dock.y+1,'dock overlaps stock contents');
   assert(dock.y>=0 && dock.y+dock.height<=size.height,'dock outside viewport');
   assert.match(await page.locator('.stock-lesson-dock p').textContent(),/수량/);
   await page.locator('[data-lesson-next]').click();
   assert.match(await page.locator('.stock-lesson-dock p').textContent(),/바로 체결/);
   await page.locator('[data-execute="buy"]').scrollIntoViewIfNeeded();
   assert(await page.locator('[data-execute="buy"]').isVisible());
   await page.screenshot({path:path.join(output,`${prefix}-lesson-order-${size.width}.png`)});
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>{const app=window.testStockApp;app.source.lessonActive=false;app.refresh();});
  assert.equal(await page.locator('.stock-lesson-dock').isVisible(),false);
  await page.locator('[data-power-off]').click();
  assert.equal(await page.locator('dialog').evaluate(el => el.open), false);
  assert.equal(await page.locator('.stock-app').count(), 0);
  console.log(prefix+' unlimited account, history and close button passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
