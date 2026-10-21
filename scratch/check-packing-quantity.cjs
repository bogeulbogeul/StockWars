const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:720}});
  await page.goto('http://127.0.0.1:8765/packing.html');
  await page.evaluate(async()=>{
   document.querySelector('dialog').close();
   const {PackingGame}=await import('/js/components/packing/PackingGame.js');
   const {createOrder}=await import('/js/components/packing/PackingData.js');
   window.quantityGame=new PackingGame(); quantityGame.open();
   quantityGame.session={orders:[createOrder(7)],completed:0,awaitingNext:false};quantityGame.render();
  });
  const dialog=page.locator('dialog[open]');
  const jelly=()=>dialog.locator('.packing-item-card').filter({hasText:'이슬 젤리'});
  assert.equal(await jelly().count(),1);
  assert.equal(await jelly().locator('.packing-quantity').textContent(),'×2');
  for(const x of [1,3]) {
   await jelly().click();
   await dialog.locator(`.packing-cell[data-x="${x}"][data-y="4"]`).click();
   assert.equal(await dialog.locator('.packing-quantity').count(),0);
  }
  assert.equal(await jelly().count(),0);
  assert.equal(await dialog.locator('.packing-piece').count(),2);
  await dialog.locator('[data-action="reset"]').click();
  assert.equal(await jelly().count(),1);
  assert.equal(await jelly().locator('.packing-quantity').textContent(),'×2');
  assert.equal(await dialog.locator('.packing-piece').count(),0);
  console.log('PASS: duplicate grouping, quantity decrement, single-item badge hidden, reset restores ×2');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
