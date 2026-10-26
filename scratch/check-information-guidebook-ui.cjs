const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||'web'),prefix=root.includes('win-unpacked')?'desktop':'web';
const output='output/information-guidebook-ui-v2';
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
        assert.equal(await page.locator('.information-guide-action:visible').count(),0);
        const pos=await page.evaluate(async()=>{
            const room=window.guideTestRoom,b=room.interaction.bounds;
            const {GROUND_PROJECTION:P}=await import('/js/data/townModelBuildings.js');
            for(let z=b.min.z-60;z<b.max.z+60;z+=10)for(let x=b.max.x+35;x<b.max.x+90;x+=10){
                if(room.canStand(x,z)){
                    room.controller.charPosX=x;room.controller.charPosY=z*P;
                    if(room.interaction.near())return {x,z};
                }
            }
            throw Error('Map has no reachable reading position');
        });
        await page.waitForTimeout(150);
        assert.equal(await page.locator('.information-guide-action:visible').count(),1);
        await page.keyboard.press('f');
        await page.waitForFunction(()=>document.querySelector('.information-guidebook')?.open);
        await page.locator('.information-guidebook article').focus();
        const before=await page.evaluate(()=>({x:guideTestRoom.controller.charPosX,y:guideTestRoom.controller.charPosY,cursor:stockWarsExhibition.state.cursor}));
        await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');
        await page.keyboard.press('f');await page.keyboard.press('Enter');
        const after=await page.evaluate(()=>({x:guideTestRoom.controller.charPosX,y:guideTestRoom.controller.charPosY,cursor:stockWarsExhibition.state.cursor}));
        assert.deepEqual(after,before);
        await page.locator('.information-guidebook nav button').nth(2).click();
        assert.match(await page.locator('.information-guidebook article').innerText(),/천천히 시작/);
        await page.getByRole('button',{name:'다음 페이지',exact:true}).click();
        assert.equal(await page.locator('.guide-page-number').innerText(),'04 / 05');
        await page.keyboard.press('ArrowLeft');
        assert.equal(await page.locator('.guide-page-number').innerText(),'03 / 05');
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-guidebook.png`});
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.information-guidebook').evaluate(d=>d.open),false);
        assert(await page.evaluate(()=>guideTestRoom.active));
        await page.locator('.information-guide-action').click();
        await page.getByRole('button',{name:'가이드북 닫기',exact:true}).click();
        await page.setViewportSize({width:390,height:844});
        await page.locator('.information-guide-action').click();
        await page.screenshot({animations:'disabled',path:`${output}/${prefix}-guidebook-mobile.png`});
        assert(await page.locator('.information-guidebook').evaluate(d=>d.getBoundingClientRect().width<=innerWidth));
        await page.evaluate(()=>guideTestRoom.hide());
        assert.equal(await page.locator('.information-guidebook').evaluate(d=>d.open),false);
        assert.deepEqual(errors,[]);
        fs.writeFileSync(`${output}/${prefix}-checks.json`,JSON.stringify({reachablePosition:pos,nearbyOnly:true,keyboardAndButton:true,movementAndStoryBlocked:true,escapeReturns:true,hideCloses:true,mobileFits:true,errors},null,2));
        console.log('PASS',prefix,JSON.stringify(pos));
    }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
