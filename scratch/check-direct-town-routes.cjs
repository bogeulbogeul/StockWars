const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output=process.argv[3]||'output/town-direct-routes-v8';
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.seatInteraction,null,{timeout:90000});
        const report=await page.evaluate(async previous=>{
            const {createTourPaths}=await import('/js/app/exhibition/TourPaths.js');
            const {routeLength,resolveTourStop,clearTourSegment}=await import('/js/app/exhibition/TourRoute.js');
            const {TOWN_MODEL_BUILDINGS:B,GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
            const {villagePathRoutes}=await import('/js/data/townLandscapeLayout.js');
            const s=window.stockWarsApp,legal=s.townStage.playerController.sceneryCanStand;
            const before=createTourPaths({routes:previous}),after=createTourPaths();
            const door=id=>{const b=B.find(b=>b.id===id);return resolveTourStop({x:b.x+(b.entranceOffsetX||0),y:b.y+110},legal);};
            const home=door('home_office_tower'),info=door('settlement_information'),bank=door('node_finance');
            const cases=[['stop-information',{x:1120,y:2355},info],['information-home',info,home],['home-bank',home,bank],
                ['information-bank',info,bank],['bank-store',bank,door('vivian_store')]];
            const result={routes:[],blockedLinks:[]};
            for(const [name,start,goal] of cases){
                const old=before.route(start,goal,legal),next=after.route(start,goal,legal);
                if(next.slice(1).some((p,i)=>!clearTourSegment(next[i],p,legal)))throw Error('Route crosses solid '+name);
                for(let i=1;i<next.length;i++)for(let j=0;j<=20;j++){
                    const t=j/20,x=next[i-1].x+(next[i].x-next[i-1].x)*t,y=next[i-1].y+(next[i].y-next[i-1].y)*t;
                    // Endpoints may connect from a building approach to the pavement.
                    if(i>1&&i<next.length-1&&!after.onPath(x,y))throw Error('Leaves pavement '+name);
                }
                const previousLength=routeLength(old),length=routeLength(next);
                result.routes.push({name,previousLength,length,seconds:length/180,previousSeconds:previousLength/180,
                    reductionPercent:(1-length/previousLength)*100});
            }
            for(const route of villagePathRoutes().slice(-2))for(let i=1;i<route.length;i++){
                if(!clearTourSegment({x:route[i-1][0],y:route[i-1][1]},{x:route[i][0],y:route[i][1]},legal))result.blockedLinks.push(route);
            }
            window.stockWarsExhibition.arrival.stop();cancelAnimationFrame(s.frame);
            const scene=s.townModelScene;scene.scene.userData.skyTimeOfDay='day';scene.scene.userData.townWeather='clear';
            scene.landscape.sky.update(performance.now(),true);
            scene.camera.position.set(1750,4200,8000);scene.camera.lookAt(1750,100,3500);
            scene.landscape.update(1750,3500,s.townStage.playerController.renderPosition);scene.renderer.render(scene.scene,scene.camera);
            result.capture=scene.renderer.domElement.toDataURL('image/png');return result;
        },JSON.parse(fs.readFileSync(`${output}/previous-routes.json`)));
        console.log(JSON.stringify(report.routes));
        // Road anchors are sampled every 8 units; new joins can shift a nearby
        // destination anchor slightly. Permit under .12s variation, not detours.
        for(const r of report.routes)assert(r.length<=r.previousLength*1.05+20,r.name+' regressed');
        if(output.includes('direct-routes-v8')){
            assert(report.routes[0].reductionPercent>40);assert(report.routes[1].reductionPercent>8);
        }
        assert.deepEqual(report.blockedLinks,[]);assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-overview.png`,Buffer.from(report.capture.split(',')[1],'base64'));delete report.capture;
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...report,errors},null,2));console.log('PASS',prefix,JSON.stringify(report));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
