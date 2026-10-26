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
  for(const [file,clip,name] of [['walk.glb','Walk_InPlace','somangi-walk-preview'],['office-sit.glb','Office_Sit','somangi-sit-preview']]){
   const info=await page.evaluate(({file,clip})=>review.load('/output/somangi-reference-shape-v6/'+file,clip),{file,clip});
   const data=await page.evaluate(async({duration})=>{
    const stream=review.canvas.captureStream(24),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    const stopped=new Promise(r=>recorder.onstop=r);recorder.start();
    const start=performance.now(),length=Math.max(2,duration);
    while((performance.now()-start)/1000<length){review.render(((performance.now()-start)/1000)%duration);await new Promise(r=>setTimeout(r,1000/24));}
    recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:'video/webm'});
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob)});
   },{duration:info.duration});
   fs.writeFileSync(path.join(out,name+'.webm'),Buffer.from(data,'base64'));console.log('Saved',name);
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});


