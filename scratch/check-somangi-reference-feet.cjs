const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('.'),out=path.join(root,'output/somangi-reference-shape-v6');
const server=http.createServer((req,res)=>{
 const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(f)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/output/somangi-reference-shape-v6/viewer.html`);
  await page.waitForFunction(()=>window.ready);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'geometry-validation.json'))),report=[];
  for(const entry of manifest){
   const file='/output/somangi-reference-shape-v6/'+entry.file;
   const info=await page.evaluate(file=>review.load(file),file);
   for(const clip of info.clips){
    const times=Array.from({length:9},(_,i)=>clip.duration*i/8);
    const samples=[];
    for(const variant of ['original/','']){
     await page.evaluate(({file,name})=>review.load(file,name),{file:'/output/somangi-reference-shape-v6/'+variant+entry.file,name:clip.name});
     samples.push(await page.evaluate(times=>times.map(t=>review.feet(t)),times));
    }
    const maxDelta=Math.max(...samples[0].map((v,i)=>Math.abs(v-samples[1][i])));
    report.push({file:entry.file,clip:clip.name,maxDelta,samples});
   }
  }
  fs.writeFileSync(path.join(out,'feet-validation.json'),JSON.stringify({report,errors},null,2));
  const maxDelta=Math.max(...report.map(r=>r.maxDelta));console.log('FEET',JSON.stringify({clips:report.length,maxDelta,errors}));
  if(maxDelta>.02||errors.length)throw Error('Foot contact drift exceeded .02 source units');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
