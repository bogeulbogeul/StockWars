const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web');
const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico')return res.writeHead(204).end();
    const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{
        if(error)return res.writeHead(404).end();
        res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(data);
    });
});
(async()=>{
    await new Promise(resolve=>server.listen(8123,'127.0.0.1',resolve));
    const browser=await chromium.launch({headless:true,channel:'msedge'});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
        await page.goto('http://127.0.0.1:8123/');
        await page.waitForFunction(()=>window.stockWarsApp?.townModelScene?.loadedCount>=20,null,{timeout:90000});
        const save=await page.evaluate(()=>JSON.stringify(localStorage));
        await page.keyboard.press('l');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene?.player?.state==='idle',null,{timeout:90000});
        const enter=async()=>{
            await page.evaluate(()=>{
                const s=window.stockWarsApp.cipherLobbyScene;
                s.controller.charPosX=400;s.controller.charPosY=-100*Math.sin(26*Math.PI/180);
            });
            await page.keyboard.press('f');
            await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.simulationRoomScene?.active
                &&window.stockWarsApp.cipherLobbyScene.simulationRoomScene.player?.state==='idle',null,{timeout:90000});
            assert(await page.locator('#cipherSimulationStage').isVisible());
        };
        await enter();
        assert(await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.simulationRoomScene,b=s.room.userData.seasonRankingBoard;
            return b.entries.length===0&&b.snapshot===null&&s.room.getObjectByName('season-ranking-screen')
                &&s.room.children.filter(o=>o.name.startsWith('simulation-desk-')).length===1
                &&s.room.children.filter(o=>o.name.startsWith('simulation-chair-')).length===1
                &&s.room.getObjectByName('simulation-computers-center')
                &&s.room.getObjectByName('simulation-lobby-return-door').position.x===-450
                &&!s.room.getObjectByName('lobby-entry-passage')&&!s.room.getObjectByName('market-board-screen');
        }));
        await page.waitForTimeout(200);
        await page.screenshot({path:'output/cipher-simulation-shell-v1/game-reused-workstation.png'});
        // Display contract: only supplied season records, ordered by supplied rank.
        assert(await page.evaluate(()=>{
            const b=window.stockWarsApp.cipherLobbyScene.simulationRoomScene.room.userData.seasonRankingBoard;
            b.setData({seasonName:'검증용 시즌',entries:[
                {rank:2,nickname:'검증 B',cumulativeReturnPct:20},{rank:1,nickname:'검증 A',cumulativeReturnPct:30},
                {rank:0,nickname:'잘못된 순위'}]});
            const valid=b.entries.length===2&&b.entries[0].nickname==='검증 A';b.setData(null);return valid;
        }));
        await page.waitForFunction(()=>!!window.stockWarsApp.cipherLobbyScene.simulationRoomScene.interaction);
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.simulationRoomScene;
            s.controller.charPosX=0;s.controller.charPosY=20*Math.sin(26*Math.PI/180);s.update(.016);
        });
        await page.keyboard.down('s');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.simulationRoomScene.interaction.phase==='seated');
        await page.keyboard.up('s');
        await page.keyboard.press('Enter');
        await page.locator('.cipher-arena').waitFor({state:'visible'});
        await page.keyboard.press('Escape');await page.locator('.cipher-arena').waitFor({state:'hidden'});
        assert.equal(await page.evaluate(()=>document.activeElement.id),'cipherSimulationStage');
        assert.equal(await page.evaluate(()=>window.stockWarsApp.cipherLobbyScene.simulationRoomScene.interaction.phase),'seated');
        await page.keyboard.down('a');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.simulationRoomScene.interaction.phase==='idle');
        await page.keyboard.up('a');
        assert(await page.evaluate(async()=>{
            const s=window.stockWarsApp.cipherLobbyScene.simulationRoomScene;
            const {simulationCanStand}=await import('/js/data/cipherSimulationRoom.js');
            return !simulationCanStand(0,-70)&&!simulationCanStand(0,100)
                &&simulationCanStand(s.controller.charPosX,s.controller.charPosY/Math.sin(26*Math.PI/180));
        }));
        await page.evaluate(()=>{
            const s=window.stockWarsApp.cipherLobbyScene.simulationRoomScene;
            s.controller.charPosX=-390;s.controller.charPosY=-100*Math.sin(26*Math.PI/180);
        });
        await page.keyboard.press('f');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.active);
        assert.deepEqual(await page.evaluate(()=>{
            const c=window.stockWarsApp.cipherLobbyScene.controller;
            return[c.charPosX,Math.round(c.charPosY/Math.sin(26*Math.PI/180)),c.facing];
        }),[400,-100,'left']);
        await enter();await page.keyboard.press('Escape');
        await page.waitForFunction(()=>window.stockWarsApp.cipherLobbyScene.active);
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!window.stockWarsApp.cipherLobbyScene.active);
        assert.deepEqual(await page.evaluate(()=>JSON.stringify(localStorage)),save);assert.deepEqual(errors,[]);
        console.log('PASS: simulation room, left return door, season-only empty board, supplied ranking order, Enter competition UI/close focus, F/Escape return, repeat entry, saves unchanged, no console errors');
    }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
