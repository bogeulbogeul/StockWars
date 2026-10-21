const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge'});
 try {
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:8765/packing.html');
  await page.evaluate(async()=>{
   document.querySelector('dialog').close();
   const {PackingGame}=await import('/js/components/packing/PackingGame.js');
   const {createOrder}=await import('/js/components/packing/PackingData.js');
   window.grabGame=new PackingGame();
   grabGame.session={orders:[createOrder(0)],completed:0,awaitingNext:false};grabGame.open();
  });
  const art=page.locator('dialog[open] [data-item="A"] .packing-art');
  const source=await art.boundingBox();
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  assert.ok(await page.evaluate(()=>!!grabGame.input.drag),'first press begins drag');
  // Reproduce the host focus/capture transition during the initial press.
  await page.evaluate(()=>{
   window.dispatchEvent(new Event('blur'));
   grabGame.dialog.releasePointerCapture(grabGame.input.drag?.pointerId ?? 1);
  });
  assert.ok(await page.evaluate(()=>!!grabGame.input.drag),'visible page focus transition must not cancel a held item');
  const grid=await page.locator('dialog[open] .packing-grid').boundingBox();
  await page.mouse.move(grid.x+grid.width/3,grid.y+grid.width/3,{steps:5});
  await page.mouse.up();
  assert.ok(await page.evaluate(()=>grabGame.order.items.find(i=>i.id==='A').x===0),'first gesture places item after capture loss');
  await page.locator('dialog[open] [data-action="reset"]').click();
  const next=await art.boundingBox();
  await page.mouse.move(next.x+next.width/2,next.y+next.height/2);await page.mouse.down();
  await page.evaluate(()=>grabGame.dialog.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:grabGame.input.drag.pointerId})));
  assert.equal(await page.evaluate(()=>grabGame.input.drag),null,'real pointer cancellation still clears drag');
  await page.mouse.up();
  console.log('PASS first grab, focus/capture transition, drop, explicit pointer cancellation');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
