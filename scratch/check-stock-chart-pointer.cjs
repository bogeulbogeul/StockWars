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
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=`http://127.0.0.1:${server.address().port}`;
  await page.goto(base+'/css/modules/phone-stock.css');
  await page.setContent(`<meta charset="utf-8"><link rel="stylesheet" href="${base}/css/modules/phone-home.css"><link rel="stylesheet" href="${base}/css/modules/phone-stock.css"><dialog open class="cozy-phone"><div class="cozy-phone__shell"><div class="cozy-phone__screen"><div class="cozy-phone__detail cozy-phone__detail--stock"><div class="cozy-phone__content" id="app"></div></div></div></div></dialog>`);
  await page.evaluate(async()=>{
   const {StockApp}=await import('/js/components/phone/stock/StockApp.js');
   const {exhibitionStockSource}=await import('/js/app/exhibition/PhoneStockSource.js');
   const state={cash:5500,shares:[],trades:[],flags:{trade:false,certificate:true}};
   const source=exhibitionStockSource(()=>state,{canTrade:()=>true});
   const app=new StockApp(document.querySelector('#app'),source);window.chartTestApp=app;
   app.openStock('CLOUDBERRY');app.renderDetail('chart');
  });
  const pointAt=async fraction=>page.locator('.stock-chart').evaluate((svg,f)=>{
   const p=svg.createSVGPoint();p.x=36+280*f;p.y=90;
   const screen=p.matrixTransform(svg.getScreenCTM());return {x:screen.x,y:screen.y};
  },fraction);
  for(const size of [{width:1280,height:900},{width:390,height:844}]) {
   await page.setViewportSize(size);
   for(const period of ['1W','1Y']) {
    await page.locator('[data-period="'+period+'"]').click();
    const svg=page.locator('.stock-chart');
    await svg.scrollIntoViewIfNeeded();
    const p=await pointAt(.67);await page.mouse.move(p.x,p.y);
    assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'visible');
    assert.match(await page.locator('.stock-chart-tooltip-text').textContent(),/잎/);
    assert.equal(await page.locator('.stock-chart-tooltip-text').textContent(),await page.locator('.stock-chart-readout').textContent());
    assert(await svg.evaluate(svg=>{
     const c=svg.querySelector('circle'),x=Number(c.getAttribute('cx')),y=Number(c.getAttribute('cy'));
     return [...svg.querySelector('polyline').points].some(p=>Math.abs(p.x-x)<.01 && Math.abs(p.y-y)<.01);
    }),'marker lies on a plotted price sample');
    const oldX=await page.locator('.stock-chart-cursor circle').getAttribute('cx');
    await page.evaluate(()=>window.chartTestApp.refresh());
    assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'visible','quote refresh preserves pointer');
    assert.equal(await page.locator('.stock-chart-cursor circle').getAttribute('cx'),oldX);
    if(size.width===1280 && period==='1W') await page.screenshot({path:path.join(output,`${prefix}-chart-crosshair.png`)});
    const normal=await svg.boundingBox();
    await page.locator('[data-expand]').click();await svg.scrollIntoViewIfNeeded();
    const expanded=await svg.boundingBox();
    assert(expanded.height>normal.height+70,'expansion visibly increases height');
    if(size.width>=1000)assert(expanded.width>normal.width+150,'expansion uses full content width');
    assert.equal(await page.locator('[data-expand]').getAttribute('aria-pressed'),'true');
    const q=await pointAt(.4);await page.mouse.move(q.x,q.y);
    assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'visible');
    if(size.width===1280 && period==='1W') await page.screenshot({path:path.join(output,`${prefix}-chart-expanded.png`)});
    await page.locator('[data-expand]').click();
    assert.equal(await page.locator('[data-expand]').getAttribute('aria-pressed'),'false');
    const restored=await svg.boundingBox();assert(Math.abs(restored.height-normal.height)<2);
   }
   const p=await pointAt(.5);
   await page.locator('.stock-chart').dispatchEvent('pointerdown',{clientX:p.x,clientY:p.y,pointerType:'touch'});
   assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'visible');
   await page.locator('.stock-chart').dispatchEvent('pointerleave',{pointerType:'touch'});
   assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'visible','touch selection persists');
   await page.locator('.stock-chart').dispatchEvent('pointerleave',{pointerType:'mouse'});
   assert.equal(await page.locator('.stock-chart-cursor').getAttribute('visibility'),'hidden');
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,`${prefix}-checks.json`),JSON.stringify({crosshair:true,tooltip:true,markerOnLine:true,letterboxCoordinates:true,refreshPreserved:true,weeklyAndYearly:true,expansionVisible:true,restore:true,mobileAndTouch:true,errors},null,2));
  console.log(prefix+' chart pointer and expansion passed');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
