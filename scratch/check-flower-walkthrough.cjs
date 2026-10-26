const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/flowers-walkthrough-v1';fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.town.playerController.modelCollisionReady
            &&window.stockWarsApp.townModelScene.seatInteraction,null,{timeout:90000});
        const report=await page.evaluate(async()=>{
            const {TOWN_MODEL_PROPS}=await import('/js/data/townModelProps.js');
            const {Box3}=await import('/vendor/three/three.module.js');
            const s=window.stockWarsApp.townModelScene,c=s.town.playerController;
            window.stockWarsExhibition?.arrival.stop();
            document.body.classList.add('town-model-mode');c.jumpActive=false;
            const flowers=TOWN_MODEL_PROPS.filter(d=>d.file.startsWith('Flowers-mini-'));
            const details=flowers.map(d=>{
                const m=s.scene.getObjectByName(d.id),b=new Box3().setFromObject(m);
                return {id:d.id,visible:m.visible,passThrough:m.userData.walkThrough,
                    ground:s.collisionFootprints.filter(b=>b.id===d.id).length,
                    overhead:s.jumpCollisionBodies.filter(b=>b.id===d.id).length,
                    centerWalkable:c.canStand((b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2*.4383711467890774)};
            });
            const solid=s.collisionFootprints.find(b=>b.id==='garden_bench_home');
            return {flowers:details,solidBenchPreserved:!!solid&&!c.sceneryCanStand((solid.minX+solid.maxX)/2,(solid.minY+solid.maxY)/2)};
        });
        assert(report.flowers.length>0);
        for(const f of report.flowers){assert(f.visible&&f.passThrough,f.id);assert.equal(f.ground,0,f.id);assert.equal(f.overhead,0,f.id);}
        assert(report.flowers.some(f=>f.centerWalkable),'An unobstructed flower group must be walkable; nearby trees/buildings remain solid');
        assert(report.solidBenchPreserved);assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...report,errors},null,2));
        console.log('PASS',prefix,report.flowers.length,'flower groups have no ground/jump colliders;',report.flowers.filter(f=>f.centerWalkable).length,'centers walkable; solid bench preserved');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
