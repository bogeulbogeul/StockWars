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
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/css/modules/phone-stock.css');
  await page.setContent(`<meta charset="utf-8"><link rel="stylesheet" href="${base}/css/modules/phone-home.css"><link rel="stylesheet" href="${base}/css/modules/phone-stock.css"><dialog open class="cozy-phone"><div class="cozy-phone__shell"><div class="cozy-phone__screen"><div class="cozy-phone__detail cozy-phone__detail--stock"><div class="cozy-phone__content" id="app"></div></div></div></div></dialog>`);
  await page.evaluate(async()=>{
   const {StockApp}=await import('/js/components/phone/stock/StockApp.js');
   const {exhibitionStockSource}=await import('/js/app/exhibition/PhoneStockSource.js');
   const state={cash:500,shares:[],trades:[],flags:{trade:false,certificate:true}};
   const source=exhibitionStockSource(()=>state,{canTrade:()=>true,onTrade:stock=>{state.cash-=stock.price;state.shares.push({...stock,quantity:1});state.flags.trade=true;return true;}});
   window.lessonState=state;window.lessonSource=source;
   const app=new StockApp(document.querySelector('#app'),source);window.lessonApp=app;app.tab='market';app.renderTab();
  });
  assert(await page.locator('.stock-lesson-dock p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=22));
  await page.screenshot({path:path.join(output,`${prefix}-readable-market.png`)});
  assert.match(await page.locator('.stock-recommendations h3').textContent(),/500/);
  assert.equal(await page.locator('.stock-recommendations button').count(),6);
  const id=await page.locator('.stock-recommendations button').first().getAttribute('data-stock');
  assert.equal(await page.evaluate(id=>window.lessonSource.execute('buy',id,1,1,null).success,id),false,'cannot buy before lessons');
  await page.locator('.stock-recommendations button').first().click();
  assert.equal(await page.locator('[data-subtab="info"][aria-current="page"]').count(),1,'company information opens first');
  await page.locator('[data-subtab="order"]').click();
  assert(await page.locator('[data-execute="buy"]').isDisabled(),'manual order jump stays locked');
  await page.locator('[data-subtab="info"]').click();
  const next=page.locator('[data-lesson-next]');
  const finishContext=async context=>{
   for(let i=0;i<20;i++) {
    const current=await page.locator('.stock-detail-content').getAttribute('data-panel');
    if(current!==context)return;
    if(!await next.isVisible())return;
    await next.click();
   }
   throw Error('lesson did not advance: '+context);
  };
  await next.click();await page.locator('[data-lesson-prev]').click();
  assert.match(await page.locator('[data-lesson-title]').textContent(),/1 \/ 2/);
  await page.screenshot({path:path.join(output,`${prefix}-company-info.png`)});
  await finishContext('info');
  assert.equal(await page.locator('.stock-detail-content').getAttribute('data-panel'),'chart');
  await finishContext('chart');
  assert.equal(await page.locator('.stock-detail-content').getAttribute('data-panel'),'order');
  assert(await page.locator('[data-execute="buy"]').isDisabled());
  await finishContext('order');
  assert.equal(await page.evaluate(()=>window.lessonSource.lessonReady),true);
  assert.equal(await page.locator('[data-execute="buy"]').isDisabled(),false);
  const b=await page.locator('[data-execute="buy"]').boundingBox(),d=await page.locator('.stock-lesson-dock').boundingBox();assert(b.y+b.height<=d.y,'buy above dock without scrolling');await page.screenshot({path:path.join(output,prefix+'-fixed-order.png')});
  for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]) {
   await page.setViewportSize(size);
   const dock=await page.locator('.stock-lesson-dock').boundingBox(),body=await page.locator('.stock-body').boundingBox();
   assert(body.y+body.height<=dock.y+1,'dock overlap');
   assert(dock.y>=0 && dock.y+dock.height<=size.height,'dock viewport');
   await page.locator('[data-execute="buy"]').scrollIntoViewIfNeeded();
   assert(await page.locator('[data-execute="buy"]').isVisible());
   await page.screenshot({path:path.join(output,`${prefix}-ready-order-${size.width}.png`)});
  }
  // Changing company invalidates the previous review, so another company cannot bypass it.
  await page.evaluate(()=>window.lessonApp.openStock(window.lessonApp.state().firstTrade.choices[1].id));
  assert.equal(await page.evaluate(()=>window.lessonSource.lessonReady),false);
  assert.equal(await page.locator('.stock-detail-content').getAttribute('data-panel'),'info');
  await finishContext('info');await finishContext('chart');await finishContext('order');
  const before=await page.evaluate(()=>window.lessonState.cash);
  await page.locator('[data-execute="buy"]').click();
  assert.equal(await page.evaluate(()=>window.lessonState.flags.trade),true);
  assert(await page.evaluate(before=>window.lessonState.cash>=0 && window.lessonState.cash<before,before));
  await page.evaluate(()=>window.lessonApp.refresh());
  assert.equal(await page.locator('.stock-lesson-dock').isVisible(),false);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,`${prefix}-checks.json`),JSON.stringify({companyFirst:true,reviewGate:true,realBudget:500,choiceCount:6,previous:true,contexts:true,mobile:true,tradeOnce:true,errors},null,2));
  console.log(prefix+' detailed first-stock tutorial passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
