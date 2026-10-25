const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/information-sofa-seat-penetration-check-v1';
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
            const r=guideTestRoom,THREE=await import('/vendor/three/three.module.js');
            cancelAnimationFrame(r.frame);r.frame=null;
            const sofa=r.room.getObjectByName('information-waiting-sofa');
            const pieces=[];sofa.updateMatrixWorld(true);
            sofa.traverse(m=>{if(m.isMesh){for(const mat of [m.material].flat())mat.side=THREE.DoubleSide;pieces.push({mesh:m,box:new THREE.Box3().setFromObject(m)});}});
            const seats=r.seatInteraction.seats.filter(s=>s.label==='안내소 대기 소파');
            const direction=new THREE.Vector3(.823,.317,.471).normalize(),ray=new THREE.Raycaster();
            const v=new THREE.Vector3(),results=[];
            for(let slot=0;slot<seats.length;slot++){
                if(!r.seatInteraction.sit(seats[slot]))throw Error('Cannot sit');
                r.player.root.updateMatrixWorld(true);
                const model=r.player.variants.get('walk').model;
                const byPart={},examples=[];let checked=0;
                model.traverse(mesh=>{
                    if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
                    for(let n=mesh;n;n=n.parent){if(!n.visible)return;if(n===model)break;}
                    if(mesh.isSkinnedMesh)mesh.skeleton.update();
                    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
                        mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);checked++;
                        for(const piece of pieces){
                            if(!piece.box.containsPoint(v))continue;
                            ray.set(v,direction);const hits=ray.intersectObject(piece.mesh,false);
                            const distances=[];
                            for(const hit of hits)if(hit.distance>.001&&!distances.some(d=>Math.abs(d-hit.distance)<.001))distances.push(hit.distance);
                            if(distances.length%2===1){byPart[piece.mesh.name]=(byPart[piece.mesh.name]||0)+1;if(examples.length<10)examples.push({part:piece.mesh.name,position:v.toArray()});}
                        }
                    }
                });
                const center=seats[slot].center;
                r.camera.position.set(90,180,center.z+320);r.camera.lookAt(312,92,center.z);
                r.renderer.render(r.scene,r.camera);
                const side=r.renderer.domElement.toDataURL('image/png');
                r.camera.position.set(125,240,center.z-340);r.camera.lookAt(312,92,center.z);
                r.renderer.render(r.scene,r.camera);
                results.push({slot:slot+1,checked,insideVertices:byPart,examples,position:r.player.root.position.toArray(),seatTop:seats[slot].bounds.max.y,side,back:r.renderer.domElement.toDataURL('image/png')});
                if(!r.seatInteraction.stand())throw Error('Cannot stand');
            }
            return results;
        });
        for(const result of report){
            for(const name of ['side','back']){fs.writeFileSync(`${output}/${prefix}-seat-${result.slot}-${name}.png`,Buffer.from(result[name].split(',')[1],'base64'));delete result[name];}
        }
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({report,errors},null,2));
        assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
