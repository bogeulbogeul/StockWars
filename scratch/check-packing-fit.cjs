const { chromium } = require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8765/packing.html');
  await page.evaluate(async () => {
   document.querySelector('dialog').close();
   const { PackingGame } = await import('/js/components/packing/PackingGame.js');
   window.fitGame = new PackingGame(); window.fitGame.open();
  });
  const patternCount = await page.evaluate(async () => (await import('/js/components/packing/PackingData.js')).PACKING_PATTERNS.length);
  for (const [width,height] of [[1440,900],[1280,720],[1024,600],[800,600],[390,844],[360,740]]) {
   await page.setViewportSize({width,height});
   for (let i=0;i<patternCount;i++) {
    await page.evaluate(async i => {
     const {createOrder}=await import('/js/components/packing/PackingData.js');
     fitGame.session={orders:[createOrder(i)],completed:0,awaitingNext:false}; fitGame.render();
    },i);
    const bad=await page.evaluate(() => {
     const d=fitGame.dialog, outer=d.getBoundingClientRect();
     return [...d.querySelectorAll('.packing-header,.packing-footer,.packing-box,.packing-item-card,.packing-card-art')].filter(e=>{
      const r=e.getBoundingClientRect();return r.top<outer.top-1||r.bottom>outer.bottom+1||r.left<outer.left-1||r.right>outer.right+1||r.height<5;
     }).map(e=>e.className);
    });
    assert.deepEqual(bad,[],`${width}x${height} pattern ${i}`);
   }
   await page.screenshot({path:`output/packing-ui-v1/fit-${width}.png`});
  }
  await page.setViewportSize({width:1280,height:720});
  const point=await page.evaluate(async()=>{
   const {hitsArtwork}=await import('/js/components/packing/PackingHitTest.js');
   const b=fitGame.dialog.querySelector('[data-item="A"]');
   const svg=b.querySelector('.packing-art').getBoundingClientRect();
   const r=b.getBoundingClientRect();
   for(let y=svg.top+2;y<svg.bottom;y+=2)for(let x=svg.left+2;x<svg.right;x+=2)if(hitsArtwork(b,x,y))return {x,y,blankX:r.left+3,blankY:r.top+3,labelX:r.x+r.width/2,labelY:r.bottom-12};
  });
  assert.ok(point);
  for(const [x,y] of [[point.blankX,point.blankY],[point.labelX,point.labelY]]) {
   await page.mouse.move(x,y);await page.mouse.down();
   assert.equal(await page.evaluate(()=>!!fitGame.input.drag),false);
   await page.mouse.up();
  }
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  assert.ok(await page.evaluate(()=>!!fitGame.input.drag));
  await page.mouse.up();
  console.log(`PASS: all ${patternCount} patterns at 6 viewport sizes; artwork drag enabled, labels and card corners excluded`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
