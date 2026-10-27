const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const cfg=JSON.parse(fs.readFileSync('scratch/qa-browser.json'));const browser=await chromium.connect(cfg.ws);
 const out=path.resolve(process.argv[2]||'output/simulation-playthrough-v1');fs.mkdirSync(out+'/raw',{recursive:true});
 const context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:out+'/raw',size:{width:1920,height:1080}}});
 const start=Date.now(),page=await context.newPage(),errors=[],missing=[],marks=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
 const wait=ms=>page.waitForTimeout(ms),shot=async name=>{marks.push({name,time:(Date.now()-start)/1000});fs.writeFileSync(out+'/marks.json',JSON.stringify(marks,null,2));await page.screenshot({path:out+'/'+name+'.png'});console.log(name);};
 const baseline=()=>page.evaluate(()=>JSON.stringify(window.stockWarsExhibition?.state));
 try{
 await page.goto(cfg.base);await page.getByRole('button',{name:'주식 시뮬레이션 체험하기',exact:true}).waitFor();await wait(700);const story=await baseline();await shot('01-title');await wait(1800);
 await page.getByRole('button',{name:'주식 시뮬레이션 체험하기',exact:true}).click();await page.locator('.simulation-challenge').waitFor();await shot('02-start');await wait(4200);
 assert(await page.locator('[data-sim-next]').isDisabled());await page.locator('[data-sim-sector="Energy"]').click();await wait(2200);
 await page.locator('[data-stock="ECOBATTERY"]').first().click();await page.locator('[data-subtab="info"]').click();await wait(3500);await shot('03-energy-company');
 await page.locator('[data-list-back]').click();await page.locator('[data-sim-sector="IT"]').click();await wait(1800);await page.locator('[data-stock="CLOUDBERRY"]').first().click();await page.locator('[data-subtab="info"]').click();await wait(3500);
 await page.locator('[data-subtab="chart"]').click();await page.locator('[data-expand]').click();
 const pointer=async()=>{const b=await page.locator('svg.stock-chart').boundingBox();await page.mouse.move(b.x+b.width*.3,b.y+b.height*.5,{steps:24});await wait(1500);await page.mouse.move(b.x+b.width*.65,b.y+b.height*.45,{steps:32});await wait(1500);};
 await pointer();await shot('04-chart');
 const order=async(qty,side)=>{await page.locator('[data-subtab="order"]').first().click();await page.locator('[data-qty]').fill(String(qty));await wait(2200);await page.locator('[data-execute="'+side+'"]').click();await wait(1800);};
 await order(2,'buy');await shot('05-first-buy');
 await page.locator('[data-sim-next]').click();await wait(3400);await page.locator('[data-subtab="chart"]').click();await pointer();await shot('06-news-one');
 await page.locator('[data-list-back]').click();await page.locator('[data-sector="Energy"]').click();await page.locator('[data-stock="ECOBATTERY"]').first().click();await order(5,'buy');await shot('07-second-buy');
 await page.locator('[data-sim-next]').click();await wait(3500);await page.locator('[data-list-back]').click();await page.locator('.stock-nav [data-tab="account"]').click();await shot('08-news-two-account');await wait(4000);
 await page.locator('.stock-nav [data-tab="market"]').click();await page.locator('[data-sector="IT"]').click();await page.locator('[data-stock="CLOUDBERRY"]').first().click();await order(2,'sell');await shot('09-first-sale');
 await page.locator('[data-sim-next]').click();await wait(3500);await page.locator('[data-list-back]').click();await page.locator('[data-sector="Energy"]').click();await page.locator('[data-stock="ECOBATTERY"]').first().click();await order(5,'sell');await shot('10-final-sale');
 const state=await page.evaluate(()=>{const d=document.querySelector('.cozy-phone[open]');return {panel:document.querySelector('.simulation-challenge').innerText,history:d.querySelector('[data-result]')?.textContent}});
 await page.locator('[data-sim-finish]').click();await shot('11-result');const result=await page.locator('.simulation-challenge').innerText();await wait(4500);assert.equal(await page.locator('.simulation-challenge').innerText(),result);
 await page.locator('[data-sim-review]').click();await shot('12-history');const history=await page.locator('.stock-history').innerText();assert(history.includes('거래 내역 · 4건'));await wait(4000);
 await page.locator('[data-sim-retry]').click();await shot('13-retry');assert((await page.locator('.simulation-metrics').innerText()).includes('5,000잎'));assert(await page.locator('[data-sim-next]').isDisabled());await wait(2400);
 await page.getByRole('button',{name:'‹ 타이틀로',exact:true}).click();await page.getByRole('button',{name:'시작하기',exact:true}).waitFor();assert.equal(await baseline(),story);await shot('14-return-title');await wait(2000);
 fs.writeFileSync(out+'/checks.json',JSON.stringify({errors,missing,result,history,state,storyUnchanged:true,execution:'actual clicks and keyboard inputs only; no balance/price/progress injection'},null,2));assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 }catch(e){await page.screenshot({path:out+'/failure.png'});throw e;}finally{await context.close();await page.video().saveAs(out+'/raw/playthrough.webm');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
