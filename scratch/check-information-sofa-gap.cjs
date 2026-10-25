const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/information-sofa-sideways-gap-v3';
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
        const result=await page.evaluate(async()=>{
            const room=window.guideTestRoom;
            const THREE=await import('/vendor/three/three.module.js');
            const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
            if(room.room.getObjectByName('Cream_Pillow')||room.room.getObjectByName('Gingham_Pillow'))throw Error('Throw pillows remain');
            const names=['sofa','rug','table','plant'];
            const objects=names.map(n=>room.room.getObjectByName('information-waiting-'+n));
            if(objects.some(o=>!o))throw Error('Missing waiting furniture');
            room.room.updateMatrixWorld(true);
            const boxes=Object.fromEntries(objects.map((o,i)=>{const b=new THREE.Box3().setFromObject(o);return [names[i],{min:b.min.toArray(),max:b.max.toArray()}];}));
            const queue=[[0,235]],seen=new Set(['0,235']);
            for(let i=0;i<queue.length;i++){
                const [x,z]=queue[i];for(const [dx,dz] of [[10,0],[-10,0],[0,10],[0,-10]]){
                    const nx=x+dx,nz=z+dz,key=nx+','+nz;
                    if(seen.has(key)||!room.canStand(nx,nz))continue;
                    seen.add(key);queue.push([nx,nz]);
                }
            }
            const seats=room.seatInteraction.seats.filter(s=>s.label==='안내소 대기 소파');
            if(seats.length!==2)throw Error('Expected two sofa seats, got '+seats.length);
            const seatChecks=seats.map(s=>{
                const exits=room.seatInteraction.exits(s);
                const reachable=exits.some(e=>queue.some(([x,z])=>Math.hypot(x-e.x,z-e.y/P)<20));
                return {id:s.id,forward:s.forward.toArray(),exits:exits.length,reachable};
            });
            return {boxes,seats:seatChecks,walkableSamples:queue.length,
                deskReachable:queue.some(([x,z])=>Math.hypot(x,z-100)<140),
                mapReachable:queue.some(([x,z])=>Math.hypot(x+300,z-40)<90),
                sofaBlocks:!room.canStand(320,138),tableBlocks:!room.canStand(114,138),
                rugWalkable:room.canStand(220,138)};
        });
        
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-room.png`});
        assert(result.sofaBlocks&&result.tableBlocks&&result.rugWalkable&&result.deskReachable&&result.mapReachable);
        assert(result.seats.every(s=>s.exits>0&&s.reachable));
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-room.png`});
        const seating=await page.evaluate(async()=>{
            const room=guideTestRoom,seats=room.seatInteraction.seats.filter(s=>s.label==='안내소 대기 소파');
            return seats.map(s=>{const sit=room.seatInteraction.sit(s),height=room.player.root.position.y,stand=sit&&room.seatInteraction.stand();return {sit,stand,height};});
        });
        assert(seating.every(s=>s.sit&&s.stand));
        await page.evaluate(()=>{const r=guideTestRoom;r.seatInteraction.sit(r.seatInteraction.seats.find(s=>s.label==='안내소 대기 소파'));});
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-seated.png`});
        await page.evaluate(()=>{
            const room=guideTestRoom;room.seatInteraction.stand();
            const seat=room.seatInteraction.seats.find(s=>s.label==='안내소 대기 소파');
            const exit=room.seatInteraction.exits(seat)[0];
            room.controller.charPosX=exit.x;room.controller.charPosY=exit.y;room.controller.keysHeld.clear();
        });
        await page.waitForTimeout(100);await page.keyboard.press('e');
        assert(await page.evaluate(()=>guideTestRoom.seatInteraction.selected?.label==='안내소 대기 소파'));
        await page.keyboard.press('e');assert(await page.evaluate(()=>!guideTestRoom.controller.busSeated));
        await page.evaluate(async()=>{
            const r=guideTestRoom,{GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
            r.seatInteraction.stand();r.controller.charPosX=220;r.controller.charPosY=250*P;
            r.controller.keysHeld.clear();r.controller.somangiCrabAuto=false;
            window.passageProjection=P;window.passageSamples=[];window.passageRecording=true;
            const sample=()=>{const c=r.controller;if(passageRecording){passageSamples.push({x:c.charPosX,z:c.charPosY/P,sideways:!!c.somangiCrab,legal:r.canStand(c.charPosX,c.charPosY/P)});requestAnimationFrame(sample);}};sample();
        });
        await page.keyboard.down('w');
        await page.waitForFunction(()=>guideTestRoom.controller.somangiCrab&&guideTestRoom.controller.charPosY/passageProjection<145,null,{timeout:10000});
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-sideways.png`});
        await page.waitForFunction(()=>guideTestRoom.controller.charPosY/passageProjection< -40,null,{timeout:10000});
        await page.keyboard.up('w');
        const passage=await page.evaluate(()=>{passageRecording=false;return {enteredSideways:passageSamples.some(s=>s.sideways&&s.z>95&&s.z<181),allLegal:passageSamples.every(s=>s.legal),exitedSideways:!guideTestRoom.controller.somangiCrab,samples:passageSamples};});
        console.log('PASSAGE',JSON.stringify({...passage,samples:passage.samples.length}));
        assert(passage.enteredSideways&&passage.allLegal&&passage.exitedSideways);
        fs.writeFileSync(`${output}/${prefix}-passage.json`,JSON.stringify(passage,null,2));
        assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({...result,seating,keyboardSitStand:true,errors},null,2));
        console.log('PASS',prefix,JSON.stringify({...result,seating}));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
