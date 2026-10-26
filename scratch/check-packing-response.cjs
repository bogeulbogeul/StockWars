const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');

const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';

const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file.endsWith(path.sep+'packing.html') && !fs.existsSync(file) ? path.resolve('web/packing.html') : file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge'});
 try {
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/packing.html`);
  await page.evaluate(async()=>{
   document.querySelector('dialog')?.close();
   const {PackingGame}=await import('/js/components/packing/PackingGame.js');
   const {createOrder}=await import('/js/components/packing/PackingData.js');
   window.grabGame=new PackingGame();
   grabGame.session={orders:[createOrder(0)],completed:0,awaitingNext:false};grabGame.open();
  });
  const art=page.locator('dialog[open] [data-item="A"] .packing-art');
  const source=await art.boundingBox();
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  await page.evaluate(()=>window.originalGhost=grabGame.dialog.querySelector('.packing-ghost').firstElementChild);
  assert.ok(await page.evaluate(()=>!!grabGame.input.drag),'first press begins drag');
  // Reproduce the host focus/capture transition during the initial press.
  await page.evaluate(()=>{
   window.dispatchEvent(new Event('blur'));
   grabGame.dialog.releasePointerCapture(grabGame.input.drag?.pointerId ?? 1);
  });
  assert.ok(await page.evaluate(()=>!!grabGame.input.drag),'visible page focus transition must not cancel a held item');
  const grid=await page.locator('dialog[open] .packing-grid').boundingBox();
  await page.mouse.move(grid.x+grid.width/3,grid.y+grid.width/3,{steps:5});
  assert.ok(await page.evaluate(()=>originalGhost===grabGame.dialog.querySelector('.packing-ghost').firstElementChild),'movement retains SVG node');
  assert.equal(await page.locator('dialog[open] .packing-ghost').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  await page.mouse.up();
  assert.ok(await page.evaluate(()=>grabGame.order.items.find(i=>i.id==='A').x===0),'first gesture places item after capture loss');
  await page.locator('dialog[open] [data-action="reset"]').click();
  const next=await art.boundingBox();
  await page.mouse.move(next.x+next.width/2,next.y+next.height/2);await page.mouse.down();
  await page.evaluate(()=>grabGame.dialog.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:grabGame.input.drag.pointerId})));
  assert.equal(await page.evaluate(()=>grabGame.input.drag),null,'real pointer cancellation still clears drag');
  await page.mouse.up();
  console.log('PASS first grab, focus/capture transition, drop, explicit pointer cancellation');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});

