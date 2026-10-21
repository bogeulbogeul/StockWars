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
 window.dragGame=new PackingGame();dragGame.open();
 });
 for(const viewport of [{width:1280,height:720},{width:390,height:844}]) {
 await page.setViewportSize(viewport);
 for(let pattern=0;pattern<10;pattern++) {
 await page.evaluate(async i=>{const {createOrder}=await import('/js/components/packing/PackingData.js');dragGame.session={orders:[createOrder(i)],completed:0,awaitingNext:false};dragGame.render();},pattern);
 await page.waitForTimeout(100);
 const ids=await page.evaluate(()=>dragGame.order.items.map(i=>i.id));
 for(const id of ids){
 await page.evaluate(id=>{dragGame.selected=id;dragGame.render();},id);
 const art=page.locator(`dialog[open] .packing-item-card[data-item="${id}"] .packing-art`);
 const r=await art.boundingBox();
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();
 assert.ok(await page.evaluate(()=>!!dragGame.input.drag),`start ${id} pattern ${pattern} width ${viewport.width}`);
 const dest=await page.evaluate(async id=>{const{footprint}=await import('/js/components/packing/PackingLogic.js');const r=dragGame.dialog.querySelector('.packing-grid').getBoundingClientRect();const s=footprint(dragGame.order.items.find(i=>i.id===id));const c=r.width/dragGame.order.width;return{x:r.x+s.width*c/2,y:r.y+s.height*c/2};},id);
 await page.mouse.move(dest.x,dest.y,{steps:5});await page.mouse.up();
 assert.ok(await page.evaluate(id=>dragGame.order.items.find(i=>i.id===id).x===0,id),`place ${id}`);
 await page.locator('dialog[open] [data-action="reset"]').click();
 }
 }
 }
 console.log('PASS all items, all patterns, desktop and mobile mouse drag');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
