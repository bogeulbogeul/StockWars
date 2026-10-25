const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const prefix = root.includes('win-unpacked') ? 'desktop' : 'web';
const output = process.argv[3] || 'output/town-rigidbody-arrival-v2';
fs.mkdirSync(output,{recursive:true});
const server = http.createServer((req,res)=>{
    const testPath=req.url.split('?')[0];
    const testModule=['/tests/exteriorBuildingCheck.js','/tests/CollisionAudit.js','/tests/CollisionAuditScenes.js','/tests/JumpCollisionAudit.js','/tests/BusStopCheck.js','/tests/AllSeatsCheck.js'].includes(testPath);
    const file = testModule?path.resolve('web'+testPath)
        :path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!testModule&&!file.startsWith(root+path.sep)) return res.writeHead(403).end();
    fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();
        res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
    await new Promise(r=>server.listen(8139,'127.0.0.1',r));
    const browser=await chromium.launch({headless:true,channel:'msedge'});
    try {
        const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto('http://127.0.0.1:8139/?skipOpening=1');
        await page.waitForFunction(()=>window.stockWarsExhibition?.scenes.townStage.playerController.modelCollisionReady,null,{timeout:90000});
        const before=await page.evaluate(async()=>{
            const app=window.stockWarsExhibition,s=app.scenes.townModelScene,c=s.town.playerController;
            const THREE=await import('/vendor/three/three.module.js');
            const {GROUND_PROJECTION}=await import('/js/data/townModelBuildings.js');
            const seat=new THREE.Box3().setFromObject(s.scene.getObjectByName('village_bus_stop').getObjectByName('Bench_Seat'));
            const center=seat.getCenter(new THREE.Vector3());
            app.state.arrivalPosition={x:center.x-45,y:center.z*GROUND_PROJECTION};
            app.scenes.townStage.containerEl.classList.remove('hidden');
            app.arrival.start();
            return {x:c.charPosX,y:c.charPosY,blocked:!c.canStand(c.charPosX,c.charPosY)};
        });
        assert(before.blocked,'Reproduce saved position inside the actual bench');
        await page.waitForTimeout(150);
        await page.keyboard.down('w');await page.waitForTimeout(1300);await page.keyboard.up('w');
        await page.keyboard.down('d');await page.waitForTimeout(650);await page.keyboard.up('d');
        await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
        const after=await page.evaluate(()=>{
            const app=window.stockWarsExhibition,c=app.scenes.townStage.playerController;
            return {x:c.charPosX,y:c.charPosY,legal:c.canStand(c.charPosX,c.charPosY),nearMoa:app.arrival.near()};
        });
        assert(after.legal,'Arrival WASD must respect bench collision');
        console.log(JSON.stringify({before,after}));
        assert(after.nearMoa,'Opening dialogue must remain reachable');
        assert.deepEqual(errors,[]);
        await page.screenshot({path:`${output}/${prefix}-arrival-bench.png`});
        fs.writeFileSync(`${output}/${prefix}-arrival.json`,JSON.stringify({before,after,errors},null,2));
        if(output.includes('all-seats')){
            const seats=await page.evaluate(async()=>{const {checkAllSeats}=await import('/tests/AllSeatsCheck.js');return checkAllSeats(window.stockWarsExhibition);});
            assert.equal(seats.seats.filter(s=>!s.occupied).length,13);
            assert(seats.seats.every(s=>s.occupied||(!s.error&&s.pose?.intersections===0&&s.pose?.buildingClear!==false)));
            const keyboard=[];
            for(const place of ['town','information','stock','training']){
                const prepared=await page.evaluate(async p=>{const {prepareSeatKeyboard}=await import('/tests/AllSeatsCheck.js');return prepareSeatKeyboard(window.stockWarsExhibition,p);},place);
                assert(prepared.enabled&&prepared.nearest,'Seat prompt must be available '+place);
                await page.keyboard.press('e');await page.waitForTimeout(80);
                assert(await page.evaluate(()=>!!window.__seatKeyboardOwner.seatInteraction.selected),'E must sit '+place);
                await page.keyboard.press('e');await page.waitForTimeout(80);
                assert(await page.evaluate(()=>{const owner=window.__seatKeyboardOwner,c=owner.seatInteraction.c;return !c.busSeated&&c.canStand(c.charPosX,c.charPosY);}),'E must stand '+place);
                await page.getByRole('button',{name:/E · .*에 앉기/}).filter({visible:true}).last().click();
                await page.keyboard.press('w');await page.waitForTimeout(80);await page.keyboard.up('w');
                assert(await page.evaluate(()=>!window.__seatKeyboardOwner.seatInteraction.c.busSeated),'Movement must stand '+place);
                const start=await page.evaluate(()=>{const c=window.__seatKeyboardOwner.seatInteraction.c;return {x:c.charPosX,y:c.charPosY};});
                await page.keyboard.down('d');await page.waitForTimeout(180);await page.keyboard.up('d');
                assert(await page.evaluate(p=>{const c=window.__seatKeyboardOwner.seatInteraction.c;return Math.hypot(c.charPosX-p.x,c.charPosY-p.y)>2&&c.canStand(c.charPosX,c.charPosY);},start),'Walk to seats '+place);
                await page.evaluate(()=>{cancelAnimationFrame(window.__seatKeyboardTick);window.__seatKeyboardOwner.seatInteraction.reset();if(!window.__seatKeyboardOwner.town)window.__seatKeyboardOwner.hide();});
                keyboard.push({place,pass:true});
            }
            await page.evaluate(async()=>{
                const app=window.stockWarsExhibition;app.scenes.townStage.containerEl.classList.remove('hidden');app.arrival.start();
                const {checkBusStop}=await import('/tests/BusStopCheck.js');return checkBusStop(app);
            });
            await page.keyboard.press('e');
            assert(await page.evaluate(()=>{const s=window.stockWarsApp.townModelScene;return s.town.playerController.activeSeat===s.busSeat&&s.town.playerController.busSeated;}));
            await page.keyboard.press('e');
            assert(await page.evaluate(()=>!window.stockWarsApp.townStage.playerController.busSeated));
            keyboard.push({place:'bus-return',pass:true});
            for(const [i,seat]of seats.seats.entries())if(seat.capture){fs.writeFileSync(`${output}/${prefix}-seat-${i}.png`,Buffer.from(seat.capture.split(',')[1],'base64'));delete seat.capture;}
            fs.writeFileSync(`${output}/${prefix}-seats.json`,JSON.stringify({...seats,keyboard,errors},null,2));
            console.log('SEATS',JSON.stringify(seats));assert.deepEqual(errors,[]);
        }
        if(output.includes('bus-stop')){
            const seat=await page.evaluate(async()=>{const {checkBusStop}=await import('/tests/BusStopCheck.js');return checkBusStop(window.stockWarsExhibition);});
            await page.keyboard.press('e');await page.waitForTimeout(150);
            const seated=await page.evaluate(async()=>{const {seatedSnapshot}=await import('/tests/BusStopCheck.js');return seatedSnapshot(window.stockWarsExhibition);});
            await page.screenshot({path:`${output}/${prefix}-seated.png`});
            await page.keyboard.press('Space');
            assert(await page.evaluate(()=>window.stockWarsApp.townStage.playerController.busSeated));
            await page.keyboard.press('e');await page.waitForTimeout(100);
            assert(await page.evaluate(async()=>{const {standingSnapshot}=await import('/tests/BusStopCheck.js');return standingSnapshot(window.stockWarsExhibition);}));
            await page.keyboard.press('e');await page.waitForTimeout(100);
            await page.keyboard.down('w');await page.waitForTimeout(150);await page.keyboard.up('w');
            assert(await page.evaluate(()=>{const c=window.stockWarsApp.townStage.playerController;return !c.busSeated&&c.canStand(c.charPosX,c.charPosY);}));
            await page.getByRole('button',{name:'E · 정류장 의자에 앉기',exact:true}).click();
            assert(await page.evaluate(()=>window.stockWarsApp.townStage.playerController.busSeated));
            await page.getByRole('button',{name:'E · 일어나기',exact:true}).click();
            await page.evaluate(()=>document.activeElement?.blur());
            const ground=await page.evaluate(async()=>{const {preparePlatformJump}=await import('/tests/BusStopCheck.js');return preparePlatformJump(window.stockWarsExhibition);});
            await page.keyboard.press('Space');await page.waitForTimeout(100);
            assert(await page.evaluate(height=>window.stockWarsApp.townModelScene.player.root.position.y>height+.1,ground));
            await page.waitForTimeout(650);
            assert(await page.evaluate(height=>{const p=window.stockWarsApp.townModelScene.player;return !p.jump.active&&Math.abs(p.root.position.y-height)<.01;},ground));
            fs.writeFileSync(`${output}/${prefix}-seat.json`,JSON.stringify({seat,seated,standing:true,movementExit:true,mouseToggle:true,platformJump:true,errors},null,2));
            assert.deepEqual(errors,[]);console.log(JSON.stringify({seat,seated}));
        }
        if(output.includes('jump-check')) {
            const jump=await page.evaluate(async()=>{
                const {auditJumpCollisions}=await import('/tests/JumpCollisionAudit.js');
                return auditJumpCollisions(window.stockWarsExhibition);
            });
            const phase=process.argv[4]||'baseline';
            for(const group of jump.groups){
                if(!group.motion?.capture)continue;
                fs.writeFileSync(`${output}/${prefix}-jump-${group.place}.png`,Buffer.from(group.motion.capture.split(',')[1],'base64'));
                delete group.motion.capture;
            }
            fs.writeFileSync(`${output}/${prefix}-${phase}.json`,JSON.stringify({...jump,errors},null,2));
            console.log('JUMP',JSON.stringify(jump));
            if(phase==='final')assert.equal(jump.unsafe,0);
            assert.deepEqual(errors,[]);
        }
        if(output.includes('audit')) {
            const audit=await page.evaluate(async()=>{
                const {auditCollisions}=await import('/tests/CollisionAudit.js');
                return auditCollisions(window.stockWarsExhibition);
            });
            const phase=process.argv[4]||'baseline';
            fs.writeFileSync(`${output}/${prefix}-${phase}.json`,JSON.stringify({...audit,errors},null,2));
            console.log('AUDIT',JSON.stringify({issues:audit.issueGroups,animation:audit.animation,npcIssues:audit.npcIssues,
                town: audit.town.affected, rooms:audit.rooms.map(r=>({place:r.place,affected:r.affected}))}));
            if(phase==='final')assert.equal(audit.issueGroups,0);
            assert.deepEqual(errors,[]);
        }
        if(output.includes('exterior')) {
            const buildings=await page.evaluate(async()=>{
                const {checkExteriorBuildings}=await import('/tests/exteriorBuildingCheck.js');
                return checkExteriorBuildings(window.stockWarsExhibition);
            });
            assert.deepEqual(errors,[]);
            fs.writeFileSync(`${output}/${prefix}-exterior.json`,JSON.stringify({...buildings,errors},null,2));
            await page.screenshot({path:`${output}/${prefix}-exterior.png`});
            console.log('Exterior buildings verified:',buildings.buildings.length);
        }
        if(output.includes('furniture') || output.includes('wall')) {
            const rooms=await page.evaluate(async()=>{
                const app=window.stockWarsExhibition;app.arrival.stop();
                const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
                const {PLAYER_BODY_RADIUS:R}=await import('/js/components/town3d/CharacterBodies.js');
                const {moveTownBody}=await import('/js/components/town3d/TownBodyMovement.js');
                const {HOME_EXIT_Z}=await import('/js/data/homeModelRoom.js');
                const {VIVIAN_EXIT_Z}=await import('/js/data/vivianModelRoom.js');
                const results=[];
                for(const place of ['home','store','information','bank','stock','training','simulation']){
                    let room;
                    if(['training','simulation'].includes(place)) {
                        const {CipherLobbyScene}=await import('/js/components/cipher3d/CipherLobbyScene.js');
                        const training=place==='training';
                        const data=await import(training?'/js/data/cipherTrainingRoom.js':'/js/data/cipherSimulationRoom.js');
                        const build=await import(training?'/js/components/cipher3d/CipherTrainingShell.js':'/js/components/cipher3d/CipherSimulationShell.js');
                        room=new CipherLobbyScene(app.scenes.container,()=>{}, {
                            layout:training?data.TRAINING_ROOM:data.SIMULATION_ROOM,
                            canStand:training?data.trainingCanStand:data.simulationCanStand,
                            buildRoom:training?build.buildCipherTrainingShell:build.buildCipherSimulationShell,
                            nearbyDoor:training?data.nearbyTrainingReturnDoor:data.nearbySimulationReturnDoor,
                            automaticExit:false
                        });
                        await room.ready;room.show();
                    } else { await app.scenes.show(place);room=app.scenes.rooms.get(place);await room.ready; }
                    if(room.failed)throw Error('Room loading failed '+place);
                    const c=room.controller, start={x:c.charPosX,z:c.charPosY/P};
                    if(!room.canStand(start.x,start.z))throw Error('Blocked spawn '+place);
                    if(place!=='home' && !room.furnitureBodies.length)throw Error('Missing furniture '+place);
                    if(!room.wallBodies.length)throw Error('Missing wall bodies '+place);
                    for(const wall of room.wallBodies){
                        if(room.canStand((wall.minX+wall.maxX)/2,(wall.minY+wall.maxY)/2/P))throw Error('Wall is not solid '+place);
                    }
                    for(const body of room.furnitureBodies){
                        if(room.canStand((body.minX+body.maxX)/2,(body.minY+body.maxY)/2/P))throw Error('Unblocked furniture '+body.mesh);
                    }
                    const exit=place==='home'?HOME_EXIT_Z:place==='store'?VIVIAN_EXIT_Z:room.layout.exitZ;
                    const key=(x,z)=>`${x},${z}`,step=8;
                    const queue=[[Math.round(start.x/step),Math.round(start.z/step)]];
                    const visited=new Set([key(...queue[0])]);let exitReachable=false;
                    for(let i=0;i<queue.length;i++){
                        const [x,z]=queue[i];
                        if(['training','simulation'].includes(place)?room.nearbyDoor(x*step,z*step):z*step>=exit && Math.abs(x*step)<20)exitReachable=true;
                        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
                            const nx=x+dx,nz=z+dz,k=key(nx,nz);
                            if(Math.abs(nx)>80||Math.abs(nz)>80||visited.has(k)||!room.canStand(nx*step,nz*step))continue;
                            visited.add(k);queue.push([nx,nz]);
                        }
                    }
                    results.push({place,bodies:room.furnitureBodies.length,exitReachable,freeCells:visited.size,
                        names:room.furnitureBodies.map(b=>b.mesh),walls:room.wallBodies.length});
                    if(!exitReachable)throw Error('Exit blocked '+place+' bodies '+room.furnitureBodies.length);
                    let wallApproach=false;
                    for(const wall of room.wallBodies){
                        const cx=(wall.minX+wall.maxX)/2,cz=(wall.minY+wall.maxY)/2/P;
                        const candidates=[0,.25,.5,.75,1].flatMap(t=>{
                            const x=wall.minX+(wall.maxX-wall.minX)*t;
                            const z=(wall.minY+(wall.maxY-wall.minY)*t)/P;
                            return [[wall.minX-R-4,z],[wall.maxX+R+4,z],
                                [x,wall.minY/P-R-4],[x,wall.maxY/P+R+4]];
                        });
                        const point=candidates.find(([x,z])=>room.canStand(x,z));
                        if(!point)continue;
                        c.charPosX=point[0];c.charPosY=point[1]*P;
                        moveTownBody(c,(cx-point[0])*2,(cz-point[1])*2*P);
                        if(!room.canStand(c.charPosX,c.charPosY/P))throw Error('Wall approach penetrated '+place);
                        const nx=Math.max(wall.minX,Math.min(wall.maxX,c.charPosX));
                        const nz=Math.max(wall.minY/P,Math.min(wall.maxY/P,c.charPosY/P));
                        if(Math.hypot(c.charPosX-nx,c.charPosY/P-nz)<R-.01)throw Error('Wall body clearance '+place);
                        room.player.update();wallApproach=true;break;
                    }
                    results[results.length-1].wallApproach=wallApproach;
                    results[results.length-1].wallApproachSampleUnavailable=!wallApproach;
                    if(place==='store' && !queue.some(([x,z])=>Math.abs(x*step)<123 && Math.abs(z*step-3.75)<48.75))throw Error('Shop counter interaction blocked');
                    room.renderer.render(room.scene,room.camera);
                    results[results.length-1].capture=room.renderer.domElement.toDataURL('image/png');
                    room.hide();
                }
                return results;
            });
            assert.deepEqual(errors,[]);
            for(const room of rooms){fs.writeFileSync(`${output}/${prefix}-${room.place}.png`,Buffer.from(room.capture.split(',')[1],'base64'));delete room.capture;}
            fs.writeFileSync(`${output}/${prefix}-furniture.json`,JSON.stringify({rooms,errors},null,2));
            console.log(rooms.map(r=>({place:r.place,bodies:r.bodies,exitReachable:r.exitReachable})));
        }
        if(output.includes('character')) {
            const characters=await page.evaluate(async()=>{
                const app=window.stockWarsExhibition;
                app.arrival.stop();
                const {charactersCanStand}=await import('/js/components/town3d/CharacterBodies.js');
                const {GROUND_PROJECTION}=await import('/js/data/townModelBuildings.js');
                const result=[];
                const check=(scene,bodies)=>{
                    for(const body of bodies){
                        body.root.getWorldPosition(body.position);
                        const x=body.position.x,z=body.position.z;
                        if(charactersCanStand(bodies,x,z))throw Error('NPC body is not solid');
                        result.push({name:body.root.name,radius:body.radius,x,z});
                    }
                };
                const town=app.scenes.townModelScene;
                check(town,town.characterBodies);
                await town.sleepingAnna.setAwake(true,{immediate:true});
                check(town,town.characterBodies);
                for(const place of ['information','bank','stock']){
                    await app.scenes.show(place);
                    const room=app.scenes.rooms.get(place);await room.ready;
                    if(room.characterBodies.length!==1)throw Error('Missing NPC '+place);
                    check(room,room.characterBodies);
                    const body=room.characterBodies[0];
                    body.root.getWorldPosition(body.position);
                    room.controller.charPosX=body.position.x;
                    room.controller.charPosY=body.position.z*GROUND_PROJECTION;
                    room.update(.016);
                    if(!room.canStand(room.controller.charPosX,room.controller.charPosY/GROUND_PROJECTION))throw Error('NPC overlap recovery '+place);
                }
                return result;
            });
            assert.equal(characters.length,5);
            assert.deepEqual(errors,[]);
            fs.writeFileSync(`${output}/${prefix}-characters.json`,JSON.stringify({characters,errors},null,2));
        }
        console.log('PASS',prefix,JSON.stringify({before,after}));
    } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
