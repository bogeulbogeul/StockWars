const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('web');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(e,data)=>{
    if(e)return res.writeHead(404).end();
    res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/octet-stream');
    res.end(data);
  });
});
(async()=>{
 await new Promise(r=>server.listen(8119,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8119/assets/opening/opening-scene-06-v1/scene.html');
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  for(const [label,time] of [['boarding',5000],['journey',15000],['ending',24000]]){
   await page.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t;}),time);
   await page.screenshot({path:`output/popori-bus-v1/opening-${label}-check.png`});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: opening scene 6 images loaded, animation sampled at 5/15/24 seconds, no page errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
