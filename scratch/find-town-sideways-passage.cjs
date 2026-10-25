const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('web'),out=path.resolve('output/somangi-sideways-town-capture-v1');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:800}});await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
  await page.waitForFunction(()=>window.stockWarsExhibition?.arrival.active,null,{timeout:60000});
  const report=await page.evaluate(async()=>{
   const a=window.stockWarsExhibition,s=a.scenes;await s.ready;a.arrival.stop();cancelAnimationFrame(s.frame);a.view.root.hidden=true;
   const town=s.townModelScene,c=s.townStage.playerController;
   const {TOWN_MODEL_BUILDINGS,GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
   const {updateSomangiClearance}=await import('/js/components/town3d/SomangiClearance.js');
   const {createExteriorBuildingBlocker}=await import('/js/components/town3d/ExteriorBuildingBodies.js');
   const buildings=TOWN_MODEL_BUILDINGS.map(d=>{
    const bodies=town.collisionFootprints.filter(b=>b.id===d.id||b.id?.startsWith(d.id));
    return {id:d.id,name:d.name,bodies: bodies.length,bounds:bodies.length?{minX:Math.min(...bodies.map(b=>b.minX)),maxX:Math.max(...bodies.map(b=>b.maxX)),minZ:Math.min(...bodies.map(b=>b.minY/P)),maxZ:Math.max(...bodies.map(b=>b.maxY/P))}:null};
   });
   const blockers=buildings.filter(b=>b.bodies).map(b=>({...b,blocked:createExteriorBuildingBlocker(town.collisionFootprints.filter(f=>f.id===b.id||f.id?.startsWith(b.id)).map(f=>({...f,minZ:f.minY/P,maxZ:f.maxY/P})))}));
   function owners(x,z){return blockers.filter(b=>b.blocked(x,z*P)).map(b=>b.id);}
   const candidates=[];let legal=0,narrow=0;
   for(const axis of [{x:1,z:0},{x:0,z:1}]){
    for(let x=500;x<=3100;x+=12)for(let z=1000;z<=5500;z+=12){
     if(!c.canStand(x,z*P))continue;legal++;
     const probe={};updateSomangiClearance(probe,axis.x,axis.z,x,z,(px,pz)=>c.canStand(px,pz*P));if(!probe.somangiCrab)continue;narrow++;
     const nx=-axis.z,nz=axis.x,left=owners(x+nx*34,z+nz*34),right=owners(x-nx*34,z-nz*34);
     const pair=left.some(l=>right.some(r=>r!==l));
     candidates.push({x,z,axis,left,right,pair});
    }
   }
   return {buildings,legal,narrow,buildingPairs:candidates.filter(c=>c.pair),samples:candidates};
  });
  fs.writeFileSync(path.join(out,'passage-search.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
