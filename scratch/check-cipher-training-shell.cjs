const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(process.argv[2] || 'web');
const server = http.createServer((req,res) => {
    if (req.url === '/favicon.ico') return res.writeHead(204).end();
    const file = path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
    fs.readFile(file,(error,data) => {
        if (error) return res.writeHead(404).end();
        res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(8121,'127.0.0.1',resolve));
    const browser = await chromium.launch({headless:true,channel:'msedge'});
    try {
        const page = await browser.newPage({viewport:{width:1440,height:1000}});
        const errors=[];
        page.on('pageerror',error => errors.push(error.message));
        page.on('console',message => { if(message.type()==='error') {errors.push(message.text());console.error(message.text());} });
        await page.goto('http://127.0.0.1:8121/');
        await page.waitForFunction(() => window.stockWarsApp?.townModelScene?.loadedCount>=20,null,{timeout:90000});
        const save = await page.evaluate(() => JSON.stringify(localStorage));
        await page.keyboard.press('l');
        await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene?.player?.state==='idle',null,{timeout:90000});
        const enter = async () => {
            await page.evaluate(async () => {
                const lobby=window.stockWarsApp.cipherLobbyScene;
                const {GROUND_PROJECTION}=await import('/js/data/townModelBuildings.js');
                lobby.controller.charPosX=-400;lobby.controller.charPosY=-100*GROUND_PROJECTION;
            });
            await page.keyboard.press('f');
            await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene.trainingRoomScene?.active
                && window.stockWarsApp.cipherLobbyScene.trainingRoomScene.player?.state==='idle',null,{timeout:90000});
            assert(await page.locator('#cipherTrainingStage').isVisible());
            assert(!(await page.locator('#cipherLobbyStage').isVisible()));
            assert.equal(await page.locator('dialog[open]').count(),0);
        };
        const returned = async () => {
            await page.waitForFunction(() => window.stockWarsApp.cipherLobbyScene.active);
            assert(!(await page.locator('#cipherTrainingStage').isVisible()));
            assert.deepEqual(await page.evaluate(() => {
                const c=window.stockWarsApp.cipherLobbyScene.controller;
                return [c.charPosX,Math.round(c.charPosY/Math.sin(26*Math.PI/180)),c.facing];
            }),[-400,-100,'right']);
        };
        await enter();
        assert(await page.evaluate(async () => {
            const room=window.stockWarsApp.cipherLobbyScene.trainingRoomScene.room;
            const walls=[];room.traverse(o=>{if(o.name.startsWith('Training_Closed_Side_Wall'))walls.push(o);});
            const {TRAINING_ROOM,trainingCanStand}=await import('/js/data/cipherTrainingRoom.js');
            if(TRAINING_ROOM.desks.length!==1
                || room.children.filter(o=>o.name.startsWith('training-desk-')).length!==1
                || room.children.filter(o=>o.name.startsWith('training-chair-')).length!==1
                || room.children.filter(o=>o.name.startsWith('training-computers-')).length!==1)return false;
            if(!room.getObjectByName('training-storage-cabinet')
                || trainingCanStand(TRAINING_ROOM.cabinet.x,TRAINING_ROOM.cabinet.z)
                || !trainingCanStand(-280,-160))return false;
            const decor=room.getObjectByName('training-cabinet-decor');
            if(!decor || decor.position.y!==.83 || !decor.getObjectByName('Small_Cabinet_Plant')
                || !['Binder_1','Binder_2','Binder_3'].every(name=>decor.getObjectByName(name)))return false;
            for(const desk of TRAINING_ROOM.desks){
                if(!room.getObjectByName(`training-desk-${desk.id}`) || trainingCanStand(desk.x,desk.z))return false;
                const pc=room.getObjectByName(`training-computers-${desk.id}`);
                if(!pc || pc.position.y!==72 || !pc.getObjectByName('Left_Display')
                    || !pc.getObjectByName('Right_Display') || !pc.getObjectByName('Keyboard_Base')
                    || !pc.getObjectByName('Mouse'))return false;
                const chair=room.getObjectByName(`training-chair-${desk.id}`);
                if(!chair || !chair.getObjectByName('Seat_Contact_Point')
                    || Math.abs(chair.rotation.y-Math.PI)>.001 || trainingCanStand(desk.x,desk.chairZ))return false;
                if(!trainingCanStand(desk.x+80,desk.chairZ) || !trainingCanStand(desk.x,20))return false;
            }
            return walls.length===1 && !!room.getObjectByName('training-lobby-return-door')
                && !room.getObjectByName('lobby-entry-passage') && !room.getObjectByName('cipher-cozy-desk')
                && !!room.getObjectByName('market-board-screen') && !!room.getObjectByName('market-board-frame')
                && Number.isFinite(Number(room.userData.marketBoard.index?.val));
        }));
        await page.waitForTimeout(250);
        await page.screenshot({path:'output/cipher-training-single-workstation-v1/game-training-single.png'});
        await page.waitForFunction(()=>!!window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction);
        for(const x of [0,0]) {
            await page.evaluate(x=>{
                const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
                s.controller.charPosX=x;s.controller.charPosY=20*Math.sin(26*Math.PI/180);
                s.controller.keysHeld.clear();s.update(.016);
            },x);
            await page.keyboard.down('s');
            await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase==='seated');
            await page.waitForTimeout(200); // holding entry movement must not immediately stand up
            assert.equal(await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase),'seated');
            await page.keyboard.up('s');
            assert(await page.evaluate(()=>{
                const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
                return !s.player.root.visible && s.interaction.visual.visible && s.controller.isResting;
            }));
            await page.keyboard.press('1');await page.keyboard.press('Space');
            assert.equal(await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase),'seated');
            if(x===0) {
                await page.screenshot({path:'output/somangi-office-sit-v1/game-seated.png'});
                await page.evaluate(()=>{
                    const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
                    s.camera.position.set(230,230,-260);s.camera.lookAt(0,90,100);
                });
                await page.waitForTimeout(100);
                await page.screenshot({path:'output/somangi-office-sit-v1/game-seat-detail.png'});
                await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.resize());
            }
            await page.keyboard.down('a');
            await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase==='idle');
            await page.keyboard.up('a');
            assert(await page.evaluate(async()=>{
                const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
                const {trainingCanStand}=await import('/js/data/cipherTrainingRoom.js');
                return s.player.root.visible && !s.interaction.visual.visible && !s.controller.isResting
                    && trainingCanStand(s.controller.charPosX,s.controller.charPosY/Math.sin(26*Math.PI/180));
            }));
        }
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            s.controller.charPosX=0;s.controller.charPosY=185*Math.sin(26*Math.PI/180);
        });
        await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');
        assert.equal(await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase),'idle');
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            s.controller.charPosX=200;s.controller.charPosY=169*Math.sin(26*Math.PI/180);
        });
        await page.keyboard.down('w');
        await page.evaluate(() => { const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;for(let i=0;i<150;i++)s.update(.05); });
        await page.keyboard.up('w');
        assert(await page.evaluate(() => {
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            const z=s.controller.charPosY/Math.sin(26*Math.PI/180);
            return z>=-282 && z<-269;
        }));
        await page.keyboard.down('d');
        await page.evaluate(() => { const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;for(let i=0;i<150;i++)s.update(.05); });
        await page.keyboard.up('d');
        assert(await page.evaluate(() => {const x=window.stockWarsApp.cipherLobbyScene.trainingRoomScene.controller.charPosX;return x<=428&&x>415;}));
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            s.controller.charPosX=0;s.controller.charPosY=20*Math.sin(26*Math.PI/180);
            s.controller.keysHeld.clear();s.update(.016);
        });
        await page.keyboard.down('s');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.interaction.phase==='seated');
        await page.keyboard.up('s');
        await page.keyboard.press('Escape');await returned();
        await enter();
        assert(await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            return s.interaction.phase==='idle' && s.player.root.visible && !s.controller.isResting;
        }));
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            s.controller.charPosX=0;s.controller.charPosY=270*Math.sin(26*Math.PI/180);
        });
        await page.keyboard.down('s');await page.waitForTimeout(250);await page.keyboard.up('s');
        await page.keyboard.press('f');
        assert(await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.trainingRoomScene.active));
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.trainingRoomScene;
            s.controller.charPosX=390;s.controller.charPosY=-100*Math.sin(26*Math.PI/180);
        });
        await page.keyboard.press('f');await returned();
        // Competition stays on its existing UI contract.
        await page.evaluate(() => {window.stockWarsApp.cipherLobbyScene.controller.charPosX=400;});
        await page.keyboard.press('f');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.simulationRoomScene?.active);
        await page.keyboard.press('Enter');
        await page.locator('.cipher-arena').waitFor({state:'visible'});
        await page.keyboard.press('Escape');
        await page.locator('.cipher-arena').waitFor({state:'hidden'});
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.active);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !window.stockWarsApp.cipherLobbyScene.active);
        assert.deepEqual(await page.evaluate(() => JSON.stringify(localStorage)),save);
        assert.deepEqual(errors,[]);
        console.log('PASS: exactly one central desk/computer/chair, repeated auto-seat/stand, hold/release, block jump/wave, rear approach blocked, seated Escape/reset, wall collision, live board, right-door return, competition UI, saves unchanged, no console errors');
    } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
