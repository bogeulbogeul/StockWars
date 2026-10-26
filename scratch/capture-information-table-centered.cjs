const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/information-table-rug-centered-v4';
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
        const capture=await page.evaluate(async()=>{
            const r=guideTestRoom;
            cancelAnimationFrame(r.frame);r.frame=null;
            const THREE=await import('/vendor/three/three.module.js');
            r.room.updateMatrixWorld(true);
            const table=new THREE.Box3().setFromObject(r.room.getObjectByName('information-waiting-table')).getCenter(new THREE.Vector3());
            const rug=new THREE.Box3().setFromObject(r.room.getObjectByName('information-waiting-rug')).getCenter(new THREE.Vector3());
            if(Math.abs(table.x-rug.x)>.01||Math.abs(table.z-rug.z)>.01)throw Error('Not centered');
            r.renderer.render(r.scene,r.camera);
            const full=r.renderer.domElement.toDataURL('image/png');
            r.camera.position.set(-70,360,660);r.camera.lookAt(225,42,138);
            r.renderer.render(r.scene,r.camera);
            return {full,close:r.renderer.domElement.toDataURL('image/png')};
        });
        for(const [name,data]of Object.entries(capture))fs.writeFileSync(`${output}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));
        assert.deepEqual(errors,[]);console.log('PASS: table and rug centers match; captured current model');
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
