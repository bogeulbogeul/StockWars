const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const output = path.resolve('output/level-up-notice-preview');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (error, data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400 && /\.(js|css)(?:\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=standard',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.stockWarsApp?.townModelScene).catch(error=>{throw new Error(error.message+' '+JSON.stringify(errors));});
  await page.evaluate(async()=>{await window.stockWarsApp.townModelScene.ready;});
  await page.getByRole('button',{name:'게임 시작',exact:true}).click();
  await page.locator('.opening-sequence__skip').click();
  await page.locator('.bus-arrival .opening-sequence__skip').click();
  await page.waitForFunction(()=>!document.querySelector('.crayon-title'));
  await page.evaluate(async()=>{
   const app=window.stockWarsApp;
   app.userProfile={nickname:'소망이',firstTutorialCompleted:true};
   app.itemGameplay.start();
   const {toastManager}=await import('/js/components/ToastManager.js');
   toastManager.setQuietMode(false); toastManager.container.replaceChildren();
  });
  await page.keyboard.press('KeyP'); await page.keyboard.press('KeyI');
  const retired=await page.evaluate(()=>{
   const app=window.stockWarsApp;
   for(const key of ['settingsModal','playerProfileModal','inventoryModal','tradeModal','friendModal','rankingModal']) {
    app[key]?.open?.('CLOUDBERRY');app[key]?.show?.();app[key]?.toggle?.();
   }
   app.smartphoneUI.showPhone();app.smartphoneUI.showStockApp();
   const visible=[...document.querySelectorAll('[data-retired-neon-ui]')].filter(node=>node.getClientRects().length && getComputedStyle(node).display!=='none');
   return {roots:document.querySelectorAll('[data-retired-neon-ui]').length,visible:visible.length,
    rent:document.querySelectorAll('.rent-quest').length,openDialogs:document.querySelectorAll('dialog[open]').length};
  });
  assert.ok(retired.roots>=15);assert.equal(retired.visible,0);assert.equal(retired.rent,0);assert.equal(retired.openDialogs,0);
  await page.waitForTimeout(600);
  await page.evaluate(()=>{const app=window.stockWarsApp;app.itemEngine.state.exp=600;app.itemGameplay.sync();});
  const toast=page.locator('.game-notice--level');
  await toast.waitFor({state:'visible'});
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(output,prefix+'-level-up-paper-in-game.png')});
  const message=await toast.textContent();
  await toast.waitFor({state:'detached',timeout:5000});
  await page.evaluate(()=>window.stockWarsApp.itemGameplay.sync());
  assert.equal(await page.locator('.game-notice--level').count(),0);
  assert.deepEqual(errors,[]);
  const report={screenshot:path.join(output,prefix+'-level-up-paper-in-game.png'),message,retired,errors};
  fs.writeFileSync(path.join(output,prefix+'-neon-retirement.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
