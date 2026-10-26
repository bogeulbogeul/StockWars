const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output=process.argv[3]||'output/information-map-current-layout-v3';
const expectedName=process.argv[4]||'Popori_Current_Village_Map_v2';
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
            const room=await app.prepareRoom('information');await room.ready;room.show();
            await room.room.userData.shellReady;
            const THREE=await import('/vendor/three/three.module.js');
            const map=room.scene.getObjectByName('Popori_Colored_Pencil_Map_No_Text');
            if(!map)throw Error('Missing map display');
            let texture;map.traverse(m=>{for(const mat of [m.material].flat())if(mat?.map)texture=mat.map;});
            if(!texture)throw Error('Missing map texture');
            const guide=room.interaction;
            if(!guide?.mapTexture)throw Error('Missing map reader');
            guide.choice.showModal();guide.openMap();
            const reader=guide.mapDialog.querySelector('img');await reader.decode();
            const canvas=document.createElement('canvas');canvas.width=texture.image.width;canvas.height=texture.image.height;
            const context=canvas.getContext('2d');context.drawImage(texture.image,0,0);
            const expected=context.getImageData(0,0,canvas.width,canvas.height).data;
            context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(reader,0,0);
            const actual=context.getImageData(0,0,canvas.width,canvas.height).data;
            for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])throw Error('Map reader pixels differ from stand');
            guide.close();
            const {mapPathData}=await import('/js/components/phone/map/MapPaths.js');
            const {villagePathRoutes}=await import('/js/data/townLandscapeLayout.js');
            const e=window.stockWarsExhibition;
            e.state.flags.phone=true;e.view.phonePromptAllowed=true;e.view.sync(e.state);
            e.view.openPhone();e.view.phoneHome.openApp('map');
            const phone=document.querySelector('.phone-map-canvas');
            if(!phone)throw Error('Phone map did not open');
            const expectedPaths=villagePathRoutes().map(mapPathData);
            const phonePaths=[...phone.querySelectorAll('path')].map(p=>p.getAttribute('d'));
            if(!expectedPaths.every(d=>phonePaths.includes(d)))throw Error('Phone paths outdated');
            e.view.phoneHome.close();
            const {presentVillageMap}=await import('/js/app/exhibition/VillageMapIntro.js');
            presentVillageMap(e,{mapIntro:1});
            const storyPaths=[...e.villageMap.querySelectorAll('path')].map(p=>p.getAttribute('d'));
            if(!expectedPaths.every(d=>storyPaths.includes(d)))throw Error('Story map paths outdated');
            presentVillageMap(e,{});
            cancelAnimationFrame(app.frame);cancelAnimationFrame(room.frame);
            const b=new THREE.Box3().setFromObject(map),center=b.getCenter(new THREE.Vector3());
            const normal=new THREE.Vector3(0,0,1).transformDirection(map.matrixWorld);
            const size=b.getSize(new THREE.Vector3());
            // The panel's local print surface faces -Y before GLB's axis conversion.
            const pos=map.geometry.attributes.position;
            const a=new THREE.Vector3().fromBufferAttribute(pos,0).applyMatrix4(map.matrixWorld);
            const c=new THREE.Vector3().fromBufferAttribute(pos,1).applyMatrix4(map.matrixWorld);
            const d=new THREE.Vector3().fromBufferAttribute(pos,2).applyMatrix4(map.matrixWorld);
            const facing=c.sub(a).cross(d.sub(a)).normalize();
            const distance=Math.max(size.x,size.y,size.z)*1.9;
            room.camera.position.copy(center).addScaledVector(facing,distance);room.camera.up.set(0,1,0);
            room.camera.lookAt(center);room.renderer.render(room.scene,room.camera);
            return {name:texture.name,width:texture.image.width,height:texture.image.height,readerMatchesStand:true,phoneAndStoryPathsMatch:true,
                capture:room.renderer.domElement.toDataURL('image/png')};
        });
        assert.equal(result.name,expectedName);assert(result.width>1000&&result.height>1000);assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-map-display.png`,Buffer.from(result.capture.split(',')[1],'base64'));
        delete result.capture;fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...result,errors},null,2));
        console.log('PASS',prefix,JSON.stringify(result));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
