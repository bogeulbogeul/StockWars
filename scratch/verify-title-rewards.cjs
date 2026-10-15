const { chromium } = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../web');
const server = http.createServer((req,res) => {
    const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file,(error,data) => {
        if(error) return res.writeHead(404).end();
        res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    let browser;
    try {
        browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
        const page = await browser.newPage({viewport:{width:1280,height:1000}});
        const errors=[]; page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
        await page.waitForFunction(()=>window.stockWarsApp?.itemEngine);
        await page.evaluate(async()=>{
            const app=window.stockWarsApp;
            app.titleScreen.hide();
            app.userProfile={...app.userProfile,nickname:'Title Tester',firstTutorialCompleted:true,trait:{key:'analysis'}};
            const {applyPlayerTrait}=await import('/js/engine/PlayerTrait.js');
            applyPlayerTrait(app.itemEngine.state,app.userProfile);
            const {SideQuestEngine}=await import('/js/engine/SideQuestEngine.js');
            const engine=new SideQuestEngine(()=>app.itemEngine.state,{cash:0});
            for(const quest of engine.list()) {
                engine.accept(quest.id,quest.giver);
                Object.assign(app.itemEngine.state.sideQuests[quest.id],{count:quest.target,completed:true});
                engine.claim(quest.id);
            }
            while (app.itemEngine.pendingStatPoints() > 0) app.itemEngine.allocateLevelStat('analysis');
            app.itemGameplay.start();
            app.smartphoneUI.showPhone();
        });
        await page.locator('#iconAchieveApp').click();
        await page.locator('#achievementApp.active').waitFor();
        assert.equal(await page.locator('.achieve-card').count(),9);
        assert.equal(await page.locator('.achieve-card.is-earned').count(),6);
        assert.equal(await page.locator('[data-title-equip="trait_recovery"]').isDisabled(),true);
        assert.equal(await page.locator('.player-profile-dialog select').count(),0);
        await page.waitForFunction(()=>[...document.querySelectorAll('.achieve-card img')].every(i=>i.complete&&i.naturalWidth>0));
        await page.locator('[data-title-equip="challenge_agent_k_v1"]').click();
        assert.equal(await page.evaluate(()=>window.stockWarsApp.itemEngine.state.equippedTitle),'challenge_agent_k_v1');
        await page.evaluate(()=>window.stockWarsApp.playerProfileModal.update());
        assert.equal(await page.locator('[data-field="equippedTitle"]').textContent(),'K를 넘은 자');
        assert.equal(await page.locator('.office-player-title-slot, .town-player-title-slot').count(),0);
        assert.equal(await page.locator('.achieve-scroll').evaluate(el=>el.scrollWidth>el.clientWidth),false);
        await page.waitForTimeout(400);
        await page.screenshot({path:path.resolve(__dirname,'titles-phone-ko.png')});
        await page.evaluate(()=>{document.documentElement.lang='en';window.stockWarsApp.itemGameplay.sync();});
        await page.evaluate(()=>window.stockWarsApp.playerProfileModal.update());
        assert.equal(await page.locator('[data-field="equippedTitle"]').textContent(),'Beyond K');
        assert.equal(await page.locator('.achieve-card .player-title-badge').count(),6);
        await page.screenshot({path:path.resolve(__dirname,'titles-phone-en.png')});
        await page.locator('[data-title-equip="challenge_agent_k_v1"]').click();
        assert.equal(await page.locator('.office-player-title-slot .player-title-badge').count(),0);
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('stockwars-item-gameplay-v1')).items);
        assert.equal(saved.equippedTitle,null);
        assert.equal(Object.values(saved.sideQuests).filter(q=>q.claimed).length,5);
        await page.locator('[data-title-equip="trait_analysis"]').click();
        assert.equal(await page.evaluate(()=>window.stockWarsApp.itemEngine.state.equippedTitle),'trait_analysis');
        assert.equal(await page.locator('.office-player-title-slot, .town-player-title-slot').count(),0);
        assert.deepEqual(errors,[]);
        console.log('PASS: nine titles, six earned images, locked other traits, app-only equip/unequip, read-only profile, KO/EN text, save and layout; no browser errors');
    } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
