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
            app.userProfile={...app.userProfile,nickname:'Title Tester',firstTutorialCompleted:true};
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
        await page.evaluate(()=>{const app=window.stockWarsApp;app.smartphoneUI.togglePhone();app.playerProfileModal.open();});
        const select=page.locator('.player-profile-title-control select');
        assert.equal(await select.locator('option').count(),6);
        await select.selectOption('challenge_agent_k_v1');
        assert.equal(await page.evaluate(()=>window.stockWarsApp.itemEngine.state.equippedTitle),'challenge_agent_k_v1');
        assert.equal(await page.locator('.office-player-title-slot .player-title-badge > span').textContent(),'K를 넘은 자');
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('stockwars-item-gameplay-v1')).items.equippedTitle),'challenge_agent_k_v1');
        for (const styleId of ['dog','black-cat']) {
            await page.evaluate(style=>{const app=window.stockWarsApp;app.userProfile.styleId=style;app.playerProfileModal.update();},styleId);
            await page.waitForFunction(()=>{const img=document.querySelector('.player-profile-portrait img');return img.complete&&img.naturalWidth>0;});
            assert.ok((await page.locator('.player-profile-portrait img').getAttribute('src')).includes(styleId==='dog'?'dog-face':'cat-face'));
        }
        await page.screenshot({path:path.resolve(__dirname,'profile-clean-desktop.png')});
        await select.selectOption('');
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('stockwars-item-gameplay-v1')).items.equippedTitle),null);
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:path.resolve(__dirname,'profile-clean-mobile.png')});
        assert.equal(await page.locator('.player-profile-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
        await page.locator('.player-profile-stat-help summary').click();
        assert.equal(await page.locator('.player-profile-stat-help').getAttribute('open'),'');
        assert.deepEqual(errors,[]);
        console.log('PASS: profile title equip/unequip persists; office sync; dog/cat faces load; mobile fits; details expand; no browser errors');
    } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

