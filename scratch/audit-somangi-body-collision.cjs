const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/somangi-body-collision-audit-v1';
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
        page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
        page.on('response',r=>{if(r.status()>=400)console.error('HTTP',r.status(),r.url());});
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.seatInteraction,null,{timeout:45000});
        await page.evaluate(async()=>{
            const app=window.stockWarsExhibition;app.arrival.stop();app.busy=false;app.started=true;
            const room=await app.scenes.prepareRoom('information');app.scenes.place='information';
            app.scenes.townStage.containerEl.classList.add('hidden');room.show();
            window.guideTestRoom=room;
        });
        await page.waitForTimeout(300);
        const report=await page.evaluate(async()=>{
            const room=guideTestRoom,p=room.player,c=room.controller;
            cancelAnimationFrame(room.frame);room.frame=null;
            const THREE=await import('/vendor/three/three.module.js');
            const {PLAYER_BODY_RADIUS:radius,PLAYER_BODY_HEIGHT:height}=await import('/js/components/town3d/CharacterBodies.js');
            c.keysHeld.clear();c.busSeated=false;p.root.position.set(0,0,0);p.root.rotation.set(0,0,0);
            function measure(model){
                const b=new THREE.Box3(),slice=new THREE.Box3(),v=new THREE.Vector3();let radial=0,count=0;
                const parts=[];
                p.root.updateMatrixWorld(true);model.updateMatrixWorld(true);
                model.traverse(mesh=>{
                    if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
                    for(let n=mesh;n;n=n.parent){if(!n.visible)return;if(n===model)break;}
                    if(mesh.isSkinnedMesh)mesh.skeleton.update();
                    const part=new THREE.Box3();
                    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
                        mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);b.expandByPoint(v);part.expandByPoint(v);count++;
                        if(v.y>=6&&v.y<=height){slice.expandByPoint(v);radial=Math.max(radial,Math.hypot(v.x,v.z));}
                    }
                    parts.push({name:mesh.name,size:part.getSize(new THREE.Vector3()).toArray()});
                });
                const size=b.getSize(new THREE.Vector3()),ss=slice.getSize(new THREE.Vector3());
                return {width:size.x,depth:size.z,height:size.y,sliceWidth:ss.x,sliceDepth:ss.z,radial,count,parts};
            }
            const states={};
            for(const state of ['idle','walk','sideways']){
                p.setState(state);const variant=p.variants.get(state==='idle'?'walk':state);
                const samples=[];const duration=variant.action.getClip().duration;
                for(let i=0;i<(state==='idle'?1:16);i++){
                    if(state!=='idle')variant.mixer.setTime(duration*i/16);
                    samples.push(measure(variant.model));
                }
                states[state]={samples,maxWidth:Math.max(...samples.map(s=>s.width)),maxDepth:Math.max(...samples.map(s=>s.depth)),maxHeight:Math.max(...samples.map(s=>s.height)),maxRadial:Math.max(...samples.map(s=>s.radial))};
            }
            const table=room.room.getObjectByName('information-waiting-table'),sofa=room.room.getObjectByName('information-waiting-sofa');
            const tb=new THREE.Box3().setFromObject(table),sb=new THREE.Box3().setFromObject(sofa);
            const legal=[];for(let x=180;x<=280;x+=.5)if(room.canStand(x,138))legal.push(x);
            return {radius,diameter:radius*2,collisionHeight:height,states,gap:sb.min.x-tb.max.x,legalCenterX:[Math.min(...legal),Math.max(...legal)]};
        });
        fs.writeFileSync(`${output}/${prefix}-measurements.json`,JSON.stringify(report,null,2));
        const summary={...report,states:Object.fromEntries(Object.entries(report.states).map(([k,v])=>[k,{width:v.maxWidth,depth:v.maxDepth,height:v.maxHeight,radius:v.maxRadial}]))};
        assert.deepEqual(errors,[]);console.log(JSON.stringify(summary));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
