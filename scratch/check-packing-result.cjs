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
   grabGame.session={orders:Array.from({length:5},(_,i)=>createOrder(i)),completed:0,awaitingNext:false};grabGame.open();
  });
  await page.evaluate(()=>{grabGame.session.completed=1;grabGame.session.awaitingNext=true;grabGame.render();});
  assert.equal(await page.locator('dialog[open] .packing-result button').count(),1);
  assert.equal(await page.locator('dialog[open] .packing-result button').innerText(),'다음 상자');
  assert.equal(await page.locator('dialog[open] .packing-parcel svg ellipse').count(),5);
  await page.screenshot({path:'output/packing-drag-response-v1/result-shop-flower.png'});
  await page.locator('dialog[open] .packing-result button').click();
  assert.ok(await page.locator('dialog[open] .packing-result').isHidden());
  await page.evaluate(()=>{grabGame.session.completed=5;grabGame.session.awaitingNext=true;grabGame.render();});
  assert.equal(await page.locator('dialog[open] .packing-result [data-action="close"]').count(),1);
  console.log('PASS next-only intermediate result, shared shop flower, next action, final exit retained');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});



