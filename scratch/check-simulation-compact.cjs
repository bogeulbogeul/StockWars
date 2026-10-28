const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const config=JSON.parse(fs.readFileSync('scratch/qa-browser.json'));const browser=await chromium.connect(config.ws);
 const out=path.resolve('output/simulation-compact-header-v1');fs.mkdirSync(out,{recursive:true});const results=[];
 for(const [packaged,mobile] of [[false,false],[true,false],[false,true]].slice(0,process.argv.includes('--isolation')?1:3)){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));const label=mobile?'mobile-flow':packaged?'packaged':'web';
  if(packaged)await context.route(config.base+'/**',async route=>{const rel=new URL(route.request().url()).pathname;const file=path.resolve('electron-app/dist/win-unpacked/resources/web','.'+(rel==='/'?'/index.html':decodeURIComponent(rel)));try{const body=fs.readFileSync(file);await route.fulfill({body,contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing'});}});
  try{
   await page.goto(config.base);await page.getByRole('button',{name:'주식 시뮬레이션 체험하기',exact:true}).waitFor();
   const baseline=await page.evaluate(async()=>{const {marketEngine:e}=await import('/js/engine/marketEngine.js');return {cash:e.cash,trades:e.tradeHistory.length,shares:e.portfolio.size,save:localStorage.getItem('stockwars.exhibition.first-day.v1'),story:JSON.stringify(window.stockWarsExhibition?.state)};});
   await page.getByRole('button',{name:'주식 시뮬레이션 체험하기',exact:true}).click();await page.locator('.simulation-challenge').waitFor();
   assert(await page.locator('[data-sim-next]').isDisabled());assert(await page.locator('[data-sim-finish]').isDisabled());
   await page.screenshot({path:out+'/'+label+'-start.png'});
   await page.locator('[data-sector="Energy"]').click();assert.equal(await page.locator('[data-sector="Energy"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-sector="IT"]').click();await page.locator('[data-stock="CLOUDBERRY"]').first().click();
   await page.locator('[data-subtab="info"]').click();await page.locator('[data-subtab="chart"]').click();
   await page.locator('[data-subtab="order"]').first().click();await page.locator('[data-qty]').fill('2');await page.locator('[data-execute="buy"]').click();
   await page.waitForFunction(()=>document.querySelector('.simulation-metrics').textContent.includes('✓ 매수'));
   for(let i=1;i<=3;i++) {await page.locator('[data-sim-next]').click();assert((await page.locator('.simulation-heading').innerText()).includes(i+'/3'));await page.waitForTimeout(400);}
   await page.screenshot({path:out+'/'+label+'-market.png'});assert(await page.locator('[data-sim-finish]').isDisabled());
   await page.locator('[data-qty]').fill('1');await page.locator('[data-execute="sell"]').click();await page.locator('[data-sim-finish]').click();
   await page.getByText('투자 체험 완료',{exact:true}).waitFor();assert(await page.locator('[data-execute="buy"]').isDisabled());
   const result=await page.locator('.simulation-challenge').innerText();await page.waitForTimeout(2400);assert.equal(await page.locator('.simulation-challenge').innerText(),result);
   await page.screenshot({path:out+'/'+label+'-result.png'});await page.locator('[data-sim-review]').click();assert((await page.locator('.stock-history').innerText()).includes('매도'));
   await page.locator('[data-sim-retry]').click();assert((await page.locator('.simulation-metrics').innerText()).includes('5,000잎'));assert(await page.locator('[data-sim-next]').isDisabled());
   await page.keyboard.press('Escape');await page.getByRole('button',{name:'시작하기',exact:true}).waitFor();
   const after=await page.evaluate(async()=>{const {marketEngine:e}=await import('/js/engine/marketEngine.js');return {cash:e.cash,trades:e.tradeHistory.length,shares:e.portfolio.size,save:localStorage.getItem('stockwars.exhibition.first-day.v1'),story:JSON.stringify(window.stockWarsExhibition?.state)};});assert.deepEqual(after,baseline);assert.deepEqual(errors,[]);
   await page.getByRole('button',{name:'주식 시뮬레이션 체험하기',exact:true}).click();assert((await page.locator('.simulation-metrics').innerText()).includes('5,000잎'));
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:out+'/'+label+'-mobile.png'});
   const layout=await page.evaluate(()=>{const d=document.querySelector('.cozy-phone[open]'),p=document.querySelector('.simulation-challenge'),b=document.querySelector('.stock-body');return {dialog:d.getBoundingClientRect().toJSON(),panel:p.getBoundingClientRect().toJSON(),body:b.getBoundingClientRect().toJSON(),overflow:d.scrollWidth>d.clientWidth+2};});
   assert(!layout.overflow);assert(layout.body.height>110);results.push({label,passed:true,result,layout,errors});
  }catch(e){await page.screenshot({path:out+'/'+label+'-failure.png'});throw e;}finally{await context.close();}
 }
 fs.writeFileSync(out+(process.argv.includes('--isolation')?'/isolation-checks.json':'/browser-checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});


