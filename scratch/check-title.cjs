const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const root = path.resolve('web');
 const server = http.createServer(async (req,res) => {
  try {
   const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
   if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
   const data = await fs.readFile(file);
   res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
   res.end(data);
  } catch {res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(8087,'127.0.0.1',r));
 let browser;
 try {
  browser = await chromium.launch({headless:true,channel:'msedge'});
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8087');
  await page.locator('#btnTitleNewGame').waitFor();
  await page.screenshot({path:'scratch/title-desktop.png'});
  for (const size of [{width:390,height:844},{width:1280,height:720},{width:844,height:390}]) {
   await page.setViewportSize(size);
   assert.equal(await page.locator('#titleScreen').evaluate(e=>e.scrollWidth > e.clientWidth),false,'horizontal overflow');
   await page.locator('#btnTitleStartDemo').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('#btnTitleStartDemo').isVisible(),true);
   if(size.width===390) {await page.locator('#titleScreen').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'scratch/title-mobile.png'});}
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#btnTitleNewGame').click();
  await page.waitForTimeout(550);
  assert.equal(await page.locator('#titleScreen').isVisible(),false);
  assert.equal(await page.locator('#characterCreationModal').isVisible(),true); assert.equal(await page.evaluate(()=>window.stockWarsApp.characterCreation.initialMode),'NEW');
  await page.goto('http://127.0.0.1:8087');
  await page.locator('#btnTitleStartDemo').click();
  await page.waitForTimeout(550);
  assert.equal(await page.locator('#titleScreen').isVisible(),false);
  assert.equal(await page.locator('#characterCreationModal').isVisible(),true); assert.equal(await page.evaluate(()=>window.stockWarsApp.characterCreation.initialMode),'DEMO');
  const result = await page.evaluate(async()=>{
   const {TitleScreen}=await import('/js/components/TitleScreen.js');
   const host=document.createElement('div');document.body.append(host);
   const modes=[];let settings=0;
   const title=new TitleScreen(host,{onStartGame:m=>modes.push(m),onOpenSettings:()=>settings++});
   title.btnNewGame.click(); title.btnNewGame.click();title.show();title.btnStartDemo.click();title.show();title.btnContinue.click();title.show();title.btnSettings.click();
   title.updateTicker({val:100,diffPct:-1},[{name:'<b>Test</b>',price:80,prevPrice:100}]);
   const result={modes,settings,text:title.titleTickerText.textContent,html:title.titleTickerText.innerHTML,focused:document.activeElement===title.btnNewGame};
   title.hide();title.show();await new Promise(r=>setTimeout(r,550));result.visible=!title.overlay.classList.contains('hidden');host.remove();return result;
  });
  assert.deepEqual(result.modes,['NEW','DEMO','CONTINUE']);assert.equal(result.settings,1);assert.equal(result.focused,true);assert.equal(result.visible,true);assert.ok(!result.html.includes('<b>'));
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop/mobile/landscape layouts, NEW/DEMO/CONTINUE callbacks, settings, focus, duplicate clicks, hide/show, safe ticker. No page errors.');
 } finally {if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

