const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/information-desk-sprout-v1';
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
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/?demo=first-day&skipOpening=1`);
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.seatInteraction,null,{timeout:90000});
        const result=await page.evaluate(async()=>{
            const app=window.stockWarsApp;window.stockWarsExhibition?.arrival.stop();
            await app.show('information');const room=app.rooms.get('information');await room.ready;
            await room.room.userData.shellReady;
            const THREE=await import('/vendor/three/three.module.js');
            const map=room.scene.getObjectByName('Popori_Colored_Pencil_Map_No_Text');
            if(!map)throw Error('Missing map display');
            let texture;map.traverse(m=>{for(const mat of [m.material].flat())if(mat?.map)texture=mat.map;});
            if(!texture)throw Error('Missing map texture');
            cancelAnimationFrame(app.frame);cancelAnimationFrame(room.frame);
            const wall=room.scene.getObjectByName('Left_Oval_Leaf');
            const desk=room.scene.getObjectByName('Sprout_Leaf');
            if(wall.geometry!==desk.geometry)throw Error('Desk does not reuse wall leaf geometry');
            room.renderer.render(room.scene,room.camera);
            return {name:texture.name,width:texture.image.width,height:texture.image.height,
                capture:room.renderer.domElement.toDataURL('image/png')};
        });
        assert.equal(result.name,'Popori_Current_Village_Map_v2');assert(result.width>1000&&result.height>1000);assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-room.png`,Buffer.from(result.capture.split(',')[1],'base64'));
        delete result.capture;fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...result,errors},null,2));
        console.log('PASS',prefix,JSON.stringify(result));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
