const {chromium}=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web');
const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});
});
(async()=>{
    await new Promise(resolve=>server.listen(8767,'127.0.0.1',resolve));
    const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    const page=await browser.newPage({viewport:{width:1536,height:1080}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8767/tests/salon-package-playtest.html');
    await page.waitForFunction(()=>window.salon?.background.naturalWidth&&window.salon.isOpen);
    await page.waitForTimeout(400);
    await page.evaluate(()=>salon.request('styles'));
    await page.waitForFunction(()=>salon.styleShop.dialog.open);
    assert.equal(await page.locator('.salon-style-card').count(),6);
    assert.equal(await page.locator('.salon-style-shop').getByText('내 스타일',{exact:true}).count(),0);
    assert.equal(await page.locator('[data-style="dog"],[data-style="black-cat"]').count(),0);
    assert.ok(await page.locator('.salon-purchase button').isDisabled());
    assert.ok(await page.evaluate(()=>!salon.active()));
    for(const id of ['red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']) {
      await page.click('[data-style="'+id+'"]');
      for(const mode of ['idle','walk','sit','carry']) {
        await page.click('[data-motion="'+mode+'"]');
        for(let d=0;d<4;d++)await page.click('[data-turn="1"]');
      }
    }
    await page.click('[data-style="red-fox"]');await page.click('[data-motion="idle"]');
    await page.screenshot({path:'output/salon-skin-shop-ui/game-purchase-desktop.png'});
    await page.setViewportSize({width:600,height:850});
    assert.ok(await page.evaluate(()=>{const d=salon.styleShop.dialog;return d.scrollWidth<=d.clientWidth+1;}));
    await page.screenshot({path:'output/salon-skin-shop-ui/game-purchase-mobile.png'});
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(()=>!salon.styleShop.dialog.open&&salon.isOpen&&salon.active()));
    await page.setViewportSize({width:1536,height:1080});
    await page.evaluate(()=>salon.open()); await page.waitForTimeout(300);

    const stable=await page.evaluate(()=>{const r=salon.canvas.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,pw:salon.canvas.width,ph:salon.canvas.height};});
    await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');
    const moved=await page.evaluate(()=>{const r=salon.canvas.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,pw:salon.canvas.width,ph:salon.canvas.height};});
    assert.deepEqual(moved,stable,'room viewport must remain fixed when the nearby-action button hides');
    assert.ok(await page.evaluate(()=>salon.background.src.endsWith('salon-room-package-v10-owner.png')&&!salon.owner));
    await page.screenshot({path:'output/salon-palette-claire-2026-10-16/applied-interior-applied.png'});
    const origin=await page.evaluate(()=>({x:salon.player.x,y:salon.player.y}));
    await page.keyboard.down('a');await page.waitForTimeout(500);await page.keyboard.up('a');
    assert.ok(await page.evaluate(x=>salon.player.x<x,origin.x));
    await page.evaluate(()=>salon.request('chair-left'));
    await page.waitForFunction(()=>salon.seated?.id==='chair-left',{},{timeout:20000});
    await page.screenshot({path:'output/salon-palette-claire-2026-10-16/applied-chair-seated.png'});
    await page.keyboard.press('f');
    assert.ok(await page.evaluate(()=>!salon.seated&&salon.navigation.isWalkable(salon.player.x,salon.player.y)));
    for(const id of ['chair-back','chair-front']) {
        await page.evaluate(id=>salon.request(id),id);
        await page.waitForFunction(id=>salon.seated?.id===id,id,{timeout:20000});
        await page.keyboard.press('f');
        assert.ok(await page.evaluate(()=>!salon.seated&&salon.navigation.isWalkable(salon.player.x,salon.player.y)));
    }
    for(const viewport of [{width:900,height:650},{width:1600,height:900}]) {
        await page.setViewportSize(viewport);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const point=await page.evaluate(()=>{
            const r=salon.canvas.getBoundingClientRect(),s=Math.min(r.width/1185,r.height/1000);
            const p={x:700,y:850};return {clientX:r.left+(r.width-1185*s)/2+(p.x-20)*s,clientY:r.top+(r.height-1000*s)/2+(p.y-175)*s};
        });
        const actual=await page.evaluate(p=>salon.eventPoint(p),point);
        assert.ok(Math.abs(actual.x-700)<.001&&Math.abs(actual.y-850)<.001);
        await page.mouse.click(point.clientX,point.clientY);
        try {await page.waitForFunction(()=>Math.hypot(salon.player.x-700,salon.player.y-850)<5,{},{timeout:12000});}
        catch(error){console.log(await page.evaluate(()=>({x:salon.player.x,y:salon.player.y,target:salon.player.target,waypoints:salon.player.waypoints,status:salon.status.textContent,active:salon.active(),point:salon.navigation.isWalkable(700,850)})));throw error;}
    }
    await page.click('[data-debug]');await page.screenshot({path:'output/salon-palette-claire-2026-10-16/applied-collision-check.png'});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!salon.isOpen);
    await page.click('#enter');await page.waitForFunction(()=>salon.isOpen);
    assert.ok(await page.evaluate(()=>salon.player.x===455&&salon.player.y===940&&!salon.seated));
    await page.evaluate(()=>salon.request('exit'));await page.waitForFunction(()=>!salon.isOpen);
    await page.goto('http://127.0.0.1:8767/index.html');
    await page.waitForFunction(()=>window.stockWarsApp?.salonInterior);
    await page.evaluate(()=>{
        const app=window.stockWarsApp;
        document.body.classList.add('town-mode-active');
        app.enterTown=(_server,spawn)=>{window.salonReturnSpawn=spawn;};
        app.townStage.callbacks.onOpenApparel();
    });
    assert.ok(await page.evaluate(()=>stockWarsApp.salonInterior.isOpen&&stockWarsApp.townStage.callbacks.isInputBlocked()));
    await page.waitForFunction(()=>stockWarsApp.salonInterior.background.naturalWidth);
    await page.waitForTimeout(200);
    await page.screenshot({path:'output/salon-palette-claire-2026-10-16/applied-integrated.png'});
    await page.evaluate(()=>stockWarsApp.salonInterior.close());
    await page.waitForFunction(()=>window.salonReturnSpawn==='claire_apparel');
    for(const dpr of [1,2]) {
      const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:dpr});
      const check=await context.newPage();
      await check.goto('http://127.0.0.1:8767/tests/salon-package-playtest.html');
      await check.waitForFunction(()=>window.salon?.background.naturalWidth&&salon.isOpen);
      const measure=await check.evaluate(()=>{const r=salon.canvas.getBoundingClientRect();return {w:salon.canvas.width,h:salon.canvas.height,expectedW:Math.round(r.width*devicePixelRatio),expectedH:Math.round(r.height*devicePixelRatio)};});
      assert.equal(measure.w,measure.expectedW);assert.equal(measure.h,measure.expectedH);
      await context.close();
    }
    assert.deepEqual(errors,[]);console.log('Salon browser checks passed: movement, seating/stand-up, resize/click mapping, collision overlay, exit/re-entry.');
    await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
