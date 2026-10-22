const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('.'),out=path.join(root,'output/fairy-clothing-closefit-v5');
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
  await page.goto(`http://127.0.0.1:${server.address().port}/output/fairy-clothing-closefit-v5/viewer.html`);
  await page.waitForFunction(()=>window.ready);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'geometry-validation.json'))),report=[];
  for(const entry of manifest){
   if(entry.file==='information-room.glb')continue;
   const file='/output/fairy-clothing-closefit-v5/'+entry.file;
   const info=await page.evaluate(file=>review.load(file),file);
   const clips=info.clips.length?info.clips:[{name:null,duration:0}];
   for(const clip of clips){
    await page.evaluate(({file,name})=>review.load(file,name),{file,name:clip.name});
    const frames=Math.max(1,Math.ceil(clip.duration*24));
    const result=await page.evaluate(({duration,frames})=>{
     const samples=[];for(let i=0;i<=frames;i++)samples.push(review.inspect(duration*i/frames));
     return {frames:frames+1,outsideFrames:samples.filter(s=>s.outside>0),nonFinite:samples.some(s=>s.notFinite),minSamples:Math.min(...samples.map(s=>s.samples)),shoulderNoOverlapFrames:samples.filter(s=>s.shoulderSamples.some(a=>a.inside===0)).map(s=>({time:s.time,shoulders:s.shoulderSamples})),garmentMin:Math.min(...samples.map(s=>s.garmentMin)),garmentMax:Math.max(...samples.map(s=>s.garmentMax)),garmentSamples:Math.min(...samples.map(s=>s.garmentSamples))};
    },{duration:clip.duration,frames});
    const record={file:entry.file,clip:clip.name,duration:clip.duration,...result};report.push(record);
    console.log(JSON.stringify({...record,outsideFrames:result.outsideFrames.length,shoulderNoOverlapFrames:result.shoulderNoOverlapFrames.length}));
    // Six actual animation poses, front and side, assembled by the renderer canvas.
    const url=await page.evaluate(({duration})=>{
     const sheet=document.createElement('canvas');sheet.width=1650;sheet.height=750;const ctx=sheet.getContext('2d');
     for(let i=0;i<6;i++){review.render(duration*i/5);ctx.drawImage(review.canvas,(i%3)*550,Math.floor(i/3)*375,550,375);}
     return sheet.toDataURL('image/png').split(',')[1];
    },{duration:clip.duration});
    const name=entry.file.replace('.glb','')+'-'+(clip.name||'rest');
    fs.writeFileSync(path.join(out,name+'-poses.png'),Buffer.from(url,'base64'));
   }
  }
  fs.writeFileSync(path.join(out,'motion-validation.json'),JSON.stringify({report,errors},null,2));
  if(errors.length||report.some(r=>r.nonFinite||r.minSamples<24||r.outsideFrames.length||r.shoulderNoOverlapFrames.length||r.garmentMin<.006||r.garmentSamples<64))throw Error('Motion or clothing fit inspection failed; inspect motion-validation.json');
  console.log('FINISHED',JSON.stringify({clips:report.length,frames:report.reduce((s,r)=>s+r.frames,0),outsideClips:report.filter(r=>r.outsideFrames.length).map(r=>[r.file,r.clip,r.outsideFrames.length]),errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});



